"""Ayudas compartidas por las pruebas de navegador (Playwright + Chrome).

Requiere: pip install playwright, y el servidor del editor en marcha:
    python servidor/servidor.py            (http://localhost:8765)
"""
import os, re

BASE = os.environ.get('EDITOR_URL', 'http://localhost:8765')
URL = BASE + '/index.html'
LISTO = '(() => { try { return typeof editor !== "undefined" && editor.Canvas.getDocument().body && editor.Pages.getAll().length > 0; } catch (e) { return false; } })()'

OK, FAIL = [], []


def check(nombre, cond, extra=''):
    (OK if cond else FAIL).append(nombre)
    print(('  OK    ' if cond else '  FALLA ') + nombre + (f'  -> {extra}' if extra != '' and not cond else ''), flush=True)


def resumen():
    print(f'\nRESULTADO: {len(OK)} correctas, {len(FAIL)} fallidas')
    if FAIL:
        print('Fallidas:', *FAIL, sep='\n  - ')
    return not FAIL


class Editor:
    """Envuelve una pestaña con el editor abierto."""

    def __init__(self, ctx, url=URL):
        self.pg = pg = ctx.new_page()
        self.errores = []
        self.respuestas = []      # textos para los prompt()
        pg.on('pageerror', lambda e: self.errores.append(str(e)))
        pg.on('dialog', lambda d: d.accept(self.respuestas.pop(0)) if d.type == 'prompt' and self.respuestas else d.accept())
        pg.goto(url)
        self.esperar()

    def esperar(self):
        self.pg.wait_for_function(LISTO, timeout=60000)
        self.pg.wait_for_timeout(1200)

    def E(self, js):
        return self.pg.evaluate(f'(() => {{ const r = ({js}); return (r && typeof r === "object" && !Array.isArray(r)) ? true : r; }})()')

    def V(self, js, arg=None):
        if arg is None:
            return self.pg.evaluate(f'(() => {{ {js} }})()')
        return self.pg.evaluate(f'(arg) => {{ {js} }}', arg)

    def comp(self, cond, i=0):
        return f"buscarComp(editor.getWrapper(), c => {cond})[{i}]"

    def sel(self, cond, i=0):
        self.E(f"editor.select({self.comp(cond, i)})")
        self.pg.wait_for_timeout(250)

    def empezar_de_cero(self):
        self.E("editor.Modal.close()")
        self.pg.click('#btn-new')
        self.pg.wait_for_timeout(300)
        self.pg.locator('.gjs-mdl-content .plantilla[data-modo="todo"]').click()
        self.esperar()
        if self.E("editor.Modal.isOpen()"):
            self.pg.locator('.gjs-mdl-content .plantilla[data-modo="blanco"]').click()
            self.pg.wait_for_timeout(400)

    def escribir(self, cond, texto, i=0):
        """Doble clic en el lienzo, seleccionar todo y teclear (edición real de texto)."""
        pg = self.pg
        self.sel(cond, i)
        self.E(f"{self.comp(cond, i)}.getEl().scrollIntoView({{ block: 'center', behavior: 'instant' }})")
        pg.wait_for_timeout(250)
        x, y = self.V(f"const r = {self.comp(cond, i)}.getEl().getBoundingClientRect(), f = editor.Canvas.getFrameEl().getBoundingClientRect(), z = editor.Canvas.getZoom() / 100; return [f.left + (r.left + Math.min(r.width / 2, 40)) * z, f.top + (r.top + r.height / 2) * z]")
        pg.mouse.dblclick(x, y)
        pg.wait_for_timeout(300)
        pg.keyboard.press('Control+A')
        pg.keyboard.type(texto)
        pg.wait_for_timeout(150)
        pg.click('#bp-info', force=True)
        pg.wait_for_timeout(200)
        self.E("editor.select(null)")
        pg.wait_for_timeout(200)
        return self.E(f"{self.comp(cond, i)}.getEl().textContent.trim()")

    def ir_pagina(self, i):
        self.E(f"editor.Pages.select(editor.Pages.getAll()[{i}])")
        self.esperar()

    def nueva_pagina(self, nombre):
        self.respuestas.append(nombre)
        self.pg.click('[data-tab=pages]')
        self.pg.click('#add-page')
        self.pg.wait_for_timeout(1200)

    def html_pagina(self, i):
        return self.E(f"editor.getHtml({{ component: editor.Pages.getAll()[{i}].getMainComponent() }})")


def sin_espacios(t):
    return re.sub(r'\s+', ' ', t or '').strip()
