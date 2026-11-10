"""Código HTML/JS personalizado y fondo de partículas.
- El bloque «Código HTML/JS» con <script> se dibuja y se ejecuta en el lienzo
  (sin el aviso «can't be rendered on the canvas») y se exporta en el ZIP.
- El código de un proyecto abierto desde otro navegador no se ejecuta hasta
  revisarlo y guardarlo.
- El «Fondo de partículas» es un componente con script: tsParticles se carga
  en el lienzo (canvas.scripts), los ajustes lo redibujan y funciona en el ZIP.
Uso: python pruebas/prueba_codigo_particulas.py   (arranca su propio servidor estático)"""
import io, pathlib, socket, subprocess, sys, tempfile, time, zipfile
from playwright.sync_api import sync_playwright
from comun import Editor, check, resumen

RAIZ = pathlib.Path(__file__).resolve().parent.parent
s = socket.socket(); s.bind(('127.0.0.1', 0)); PUERTO = s.getsockname()[1]; s.close()
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PUERTO), '--bind', '127.0.0.1'], cwd=RAIZ,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
CODIGO = '<div id="cc-prueba" class="p-3">antes</div>\n<script>const n = 1; document.getElementById("cc-prueba").textContent = "ejecutado " + n;</script>'
CANVAS = "editor.Canvas.getDocument()"
try:
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome')
        ctx = b.new_context(viewport={'width': 1600, 'height': 950}, accept_downloads=True)
        ed = Editor(ctx, f'http://127.0.0.1:{PUERTO}/index.html')
        pg, E, V = ed.pg, ed.E, ed.V
        ed.empezar_de_cero()

        print('1. Fondo de partículas en el lienzo')
        check('tsParticles está cargado en el lienzo (canvas.scripts)', E("typeof editor.Canvas.getWindow().tsParticles === 'object' && typeof editor.Canvas.getWindow().loadSlim === 'function'"))
        check('el bloque está en Avanzado', E("editor.Blocks.get('fondo-particulas').getCategoryLabel()") == 'Avanzado')
        E("(editor.addComponents(editor.Blocks.get('fondo-particulas').get('content')), 1)")
        pg.wait_for_timeout(2500)
        FP = "tieneClase(c, 'fondo-particulas')"
        check('es un componente «fondo-particulas» con script', E(f"{ed.comp(FP)}.get('type') === 'fondo-particulas' && typeof {ed.comp(FP)}.get('script') === 'function'"))
        check('dibuja un <canvas> animado dentro del fondo', E(f"!!{ed.comp(FP)}.getEl().querySelector('canvas')"))
        check('una sola animación activa', E("editor.Canvas.getWindow().tsParticles.dom().filter(c => !c.destroyed).length") == 1)
        ed.sel(FP); pg.click('[data-tab=traits]') if pg.locator('[data-tab=traits]').count() else None
        E(f"{ed.comp(FP)}.addAttributes({{ 'data-color': '#ff0000', 'data-cantidad': '20' }})")
        pg.wait_for_timeout(2000)
        n = E("editor.Canvas.getWindow().tsParticles.dom().filter(c => !c.destroyed).length")
        cont = V("const w = editor.Canvas.getWindow(); const c = w.tsParticles.dom().filter(c => !c.destroyed)[0]; return c ? [c.actualOptions.particles.color.value, c.actualOptions.particles.number.value] : null")
        check('cambiar color y cantidad redibuja el fondo (sin duplicar)', n == 1 and cont == ['#ff0000', 20], [n, cont])
        check('el contenido queda encima del fondo', E("getComputedStyle(editor.Canvas.getDocument().querySelector('.seccion-particulas > .container')).zIndex") == '1')

        print('2. Código HTML/JS con <script> en el lienzo')
        E("(editor.addComponents({ type: 'custom-code' }), 1)"); pg.wait_for_timeout(400)
        CC = "c.get('type') === 'custom-code'"
        E(f"editor.select({ed.comp(CC)})")
        E(f"(editor.runCommand('custom-code:open-modal', {{ target: {ed.comp(CC)} }}), 1)"); pg.wait_for_timeout(500)
        V("editor.Commands.get('custom-code:open-modal').getCodeViewer().setContent(arg)", CODIGO)
        pg.click('.gjs-mdl-content .gjs-btn-import__custom-code'); pg.wait_for_timeout(900)
        txt = E(f"{CANVAS}.body.innerText")
        check('ya no aparece «can\'t be rendered on the canvas»', "can't be rendered" not in txt)
        check('el script se ejecutó en el lienzo', E(f"{CANVAS}.getElementById('cc-prueba') && {CANVAS}.getElementById('cc-prueba').textContent") == 'ejecutado 1')
        E(f"(editor.runCommand('custom-code:open-modal', {{ target: {ed.comp(CC)} }}), 1)"); pg.wait_for_timeout(400)
        V("editor.Commands.get('custom-code:open-modal').getCodeViewer().setContent(arg)", CODIGO.replace('const n = 1', 'const n = 2'))
        pg.click('.gjs-mdl-content .gjs-btn-import__custom-code'); pg.wait_for_timeout(900)
        check('editarlo y volver a guardarlo lo ejecuta de nuevo sin errores', E(f"{CANVAS}.getElementById('cc-prueba').textContent") == 'ejecutado 2')
        check('no se acumulan copias del script', E(f"{CANVAS}.querySelectorAll('script[data-cc-ejecutado]').length") == 1)

        print('3. Exportar el ZIP')
        with pg.expect_download(timeout=120000) as dl:
            pg.click('#btn-export')
        z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
        idx = z.read('index.html').decode('utf-8')
        js_pag = z.read('js/index.js').decode('utf-8') if 'js/index.js' in z.namelist() else ''
        check('el HTML lleva el script del código personalizado', 'ejecutado " + n' in idx, idx[-600:])
        check('el script del fondo va en js/index.js y no se repite en el HTML', 'tsParticles.load' in js_pag and 'tsparticles.slim.bundle.min.js' in js_pag and 'tsParticles.load' not in idx)
        check('el fondo exportado conserva sus ajustes', 'data-color="#ff0000"' in idx and 'class="fondo-particulas"' in idx)
        d = pathlib.Path(tempfile.mkdtemp()); z.extractall(d)
        zp = ctx.new_page(); err = []
        zp.on('pageerror', lambda e: err.append(str(e)))
        zp.goto((d / 'index.html').as_uri()); zp.wait_for_load_state('networkidle'); zp.wait_for_timeout(2500)
        check('en el sitio exportado corre el código personalizado', zp.locator('#cc-prueba').text_content() == 'ejecutado 2')
        check('y el fondo de partículas dibuja su <canvas>', zp.locator('.fondo-particulas canvas').count() == 1)
        check('el sitio exportado no tiene errores de JavaScript', not err, err[:3])
        zp.close()

        print('4. Código de un archivo abierto (no revisado)')
        E("(editor.store(), 1)"); pg.wait_for_timeout(1200)
        E("(localStorage.removeItem('bs5-codigo-confiable'), 1)")
        pg.reload(); ed.esperar(); E("editor.Modal.close()"); pg.wait_for_timeout(800)
        check('no se ejecuta y avisa cómo ejecutarlo', E(f"!{CANVAS}.getElementById('cc-prueba')") and 'archivo abierto' in E(f"{CANVAS}.body.innerText"))
        check('el fondo de partículas sí se dibuja (es del editor)', E(f"!!{CANVAS}.querySelector('.fondo-particulas canvas')"))
        E(f"(editor.runCommand('custom-code:open-modal', {{ target: {ed.comp(CC)} }}), 1)"); pg.wait_for_timeout(400)
        pg.click('.gjs-mdl-content .gjs-btn-import__custom-code'); pg.wait_for_timeout(900)
        check('al revisarlo y pulsar Guardar se ejecuta', E(f"{CANVAS}.getElementById('cc-prueba') && {CANVAS}.getElementById('cc-prueba').textContent") == 'ejecutado 2')
        check('sin errores de JavaScript en el editor', not ed.errores, ed.errores[:3])
        b.close()
finally:
    srv.terminate()
sys.exit(0 if resumen() else 1)
