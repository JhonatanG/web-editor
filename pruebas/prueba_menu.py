"""Menú transparente: escritorio real en el diseño, hamburguesa en tablet/móvil,
despliegue al editar y cierre al salir de la vista previa.
Requiere: pip install playwright, y servir la carpeta en http://127.0.0.1:8765"""
import os
from playwright.sync_api import sync_playwright

OK, FAIL = [], []
def check(n, c, x=''):
    (OK if c else FAIL).append(n)
    print(('  OK   ' if c else '  FALLA ') + n + (f'  -> {x}' if x != '' and not c else ''))

D = os.path.dirname(os.path.abspath(__file__))
LISTO = '(() => { try { return editor.Canvas.getDocument().body && editor.Pages.getAll().length > 0; } catch (e) { return false; } })()'

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    pg = b.new_context(viewport={'width': 1440, 'height': 900}).new_page()
    err = []
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.on('dialog', lambda d: d.accept())
    pg.goto('http://127.0.0.1:8765/index.html')
    pg.wait_for_function(LISTO, timeout=60000)
    pg.wait_for_timeout(1500)
    def E(js):
        return pg.evaluate(f'(() => {{ const r = ({js}); return (r && typeof r === "object" && !Array.isArray(r)) ? true : r; }})()')
    # Empezar limpio con una página que tenga el menú transparente
    E("editor.Modal.close()")
    E("(() => { editor.Pages.select(editor.Pages.getAll()[0]); editor.setComponents(''); })()")
    pg.wait_for_timeout(300)
    E("(() => { const b = editor.Blocks.get('s-nav'); const c = editor.getWrapper().append(b.get('content'))[0]; editor.trigger('block:drag:stop', c, b); })()")
    E("(() => { const b = editor.Blocks.get('s-hero-img'); const c = editor.getWrapper().append(b.get('content'))[0]; editor.trigger('block:drag:stop', c, b); })()")
    E("editor.select(null)")
    pg.wait_for_timeout(800)
    doc = "editor.Canvas.getDocument()"
    vis = lambda sel: E(f"(() => {{ const e = {doc}.querySelector('{sel}'); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; }})()")

    print('1. Escritorio en modo diseño = igual que el sitio real')
    check('el lienzo mide 1280 px reales', E("editor.Canvas.getWindow().innerWidth") == 1280, E("editor.Canvas.getWindow().innerWidth"))
    check('menú horizontal (sin hamburguesa)', not vis('.nav-transparente .navbar-toggler') and vis('.nav-transparente .navbar-collapse'))
    check('indicador muestra 1280px · xl', pg.inner_text('#bp-info').startswith('1280px · xl'), pg.inner_text('#bp-info'))
    r = E("(() => { const f = editor.Canvas.getFrameEl().getBoundingClientRect(), g = document.querySelector('#gjs').getBoundingClientRect(); return [f.left - g.left, g.right - f.right, f.bottom, g.bottom]; })()")
    check('lienzo escalado cabe entero (sin cortes)', r[0] >= 0 and r[1] >= 0 and abs(r[2] - r[3]) < 3, r)
    pg.screenshot(path=os.path.join(D, 'menu-escritorio.png'))

    print('2. Seleccionar y arrastrar con la escala')
    E("editor.select(buscarComp(editor.getWrapper(), c => tagDe(c) === 'h1')[0])")
    pg.wait_for_timeout(400)
    t = E("(() => { const el = editor.getSelected().getEl().getBoundingClientRect(), f = editor.Canvas.getFrameEl().getBoundingClientRect(), z = editor.Canvas.getZoom() / 100, tb = document.querySelector('.gjs-toolbar').getBoundingClientRect(); return [f.left + el.right * z, tb.right, f.top + el.top * z, tb.bottom]; })()")
    check('barra de herramientas junto al elemento', abs(t[0] - t[1]) < 30 and abs(t[2] - t[3]) < 40, t)
    antes = E("editor.getWrapper().components().length")
    # Arrastre nativo simulado (Playwright no arrastra dentro de un iframe)
    pg.evaluate("""(async () => {
      const blkEl = [...document.querySelectorAll('#blocks .gjs-block')].find(e => /Separador/.test(e.textContent));
      const dt = new DataTransfer();
      blkEl.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
      const tgt = editor.Canvas.getDocument().querySelector('h1'), r = tgt.getBoundingClientRect();
      const opt = { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + 5, clientY: r.top + r.height - 2 };
      const sleep = ms => new Promise(f => setTimeout(f, ms));
      tgt.dispatchEvent(new DragEvent('dragenter', opt)); await sleep(50);
      for (let i = 0; i < 4; i++) { tgt.dispatchEvent(new DragEvent('dragover', opt)); await sleep(50); }
      tgt.dispatchEvent(new DragEvent('drop', opt)); await sleep(50);
      blkEl.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
    })()""")
    pg.wait_for_timeout(800)
    antes = antes - 0
    check('arrastrar un bloque al lienzo escalado funciona', '<hr' in E("editor.getHtml()"))

    print('3. Tablet: hamburguesa plegada, se despliega al editar')
    E("editor.select(null)")
    pg.click('[data-device=tablet]'); pg.wait_for_timeout(900)
    check('tablet sin escala (768 px)', E("editor.Canvas.getWindow().innerWidth") == 768 and E("editor.Canvas.getZoom()") == 100)
    check('se ve la hamburguesa', vis('.nav-transparente .navbar-toggler'))
    check('menú plegado (no tapa el diseño)', not vis('.nav-transparente .navbar-collapse'))
    pg.screenshot(path=os.path.join(D, 'menu-tablet-plegado.png'))
    E("(() => { const d = editor.Canvas.getDocument(); d.querySelector('.navbar-toggler').dispatchEvent(new MouseEvent('click', { bubbles: true })); })()")
    pg.wait_for_timeout(600)
    check('clic en hamburguesa no lo abre Bootstrap a medias', not E(f"{doc}.querySelector('.nav-transparente .navbar-collapse').classList.contains('show')"))
    E("editor.select(buscarComp(editor.getWrapper(), c => tieneClase(c, 'navbar-toggler'))[0])"); pg.wait_for_timeout(400)
    check('al seleccionar la hamburguesa el menú se despliega', vis('.nav-transparente .navbar-collapse'))
    E("editor.select(buscarComp(editor.getWrapper(), c => tieneClase(c, 'nav-link'))[2])"); pg.wait_for_timeout(400)
    check('sigue desplegado al editar una opción', vis('.nav-transparente .navbar-collapse'))
    sel = E("[...document.querySelectorAll('#traits .gjs-trt-trait')].find(t => /Ir a/.test(t.textContent)).querySelector('select').value")
    check('«Ir a» muestra el destino que ya tiene el enlace', sel == E("editor.getSelected().getAttributes().href"), sel)
    check('indicador de tablet: 768px', pg.inner_text('#bp-info').startswith('768px'), pg.inner_text('#bp-info'))
    pg.screenshot(path=os.path.join(D, 'menu-tablet-editando.png'))
    E("editor.select(buscarComp(editor.getWrapper(), c => tagDe(c) === 'h1')[0])"); pg.wait_for_timeout(400)
    check('al seleccionar otra cosa se pliega', not vis('.nav-transparente .navbar-collapse'))
    check('la clase del editor no se guarda en el HTML', 'ed-abierto' not in E("editor.getHtml()"))

    print('4. Vista previa y regreso al diseño')
    pg.keyboard.press('Control+p'); pg.wait_for_timeout(800)
    E("(() => { const d = editor.Canvas.getDocument(); d.querySelector('.navbar-toggler').click(); })()"); pg.wait_for_timeout(800)
    check('en vista previa la hamburguesa abre el menú', vis('.nav-transparente .navbar-collapse'))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(1200)
    check('al volver al diseño el menú queda plegado', not vis('.nav-transparente .navbar-collapse'))
    pg.click('[data-device=desktop]'); pg.wait_for_timeout(900)
    pg.keyboard.press('Control+p'); pg.wait_for_timeout(900)
    check('vista previa escritorio: horizontal', not vis('.nav-transparente .navbar-toggler') and E("editor.Canvas.getZoom()") == 100)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(900)
    check('diseño escritorio tras la vista previa: sigue horizontal', not vis('.nav-transparente .navbar-toggler') and vis('.nav-transparente .navbar-collapse'))
    check('y vuelve a la escala', E("editor.Canvas.getZoom()") < 100)

    print('5. Móvil')
    pg.click('[data-device=mobile]'); pg.wait_for_timeout(900)
    check('móvil: hamburguesa y menú plegado', vis('.nav-transparente .navbar-toggler') and not vis('.nav-transparente .navbar-collapse'))
    pg.click('[data-device=desktop]'); pg.wait_for_timeout(600)

    print('6. Pantalla grande (sin escala)')
    pg.set_viewport_size({'width': 1920, 'height': 1000}); pg.wait_for_timeout(1000)
    check('en pantalla ancha no se reduce', E("editor.Canvas.getZoom()") == 100 and E("editor.Canvas.getWindow().innerWidth") >= 1280, [E("editor.Canvas.getZoom()"), E("editor.Canvas.getWindow().innerWidth")])

    check('sin errores de JavaScript', not err, err[:5])
    print(f'\nRESULTADO: {len(OK)} correctas, {len(FAIL)} fallidas')
    b.close()
