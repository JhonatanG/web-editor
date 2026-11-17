"""Poner partículas detrás de algo ya construido (Estilo → Fondo de partículas).
Sin reconstruir: el contenido no se mueve, las partículas quedan sobre el fondo
del elemento y debajo de su contenido, se adaptan a zonas pequeñas, se
deshacen con Ctrl+Z, se quitan y se exportan."""
import io, pathlib, sys, tempfile, zipfile
from playwright.sync_api import sync_playwright
from comun import Editor, check, resumen

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1600, 'height': 950}, accept_downloads=True)
    ed = Editor(ctx)
    pg, E, V = ed.pg, ed.E, ed.V
    ed.empezar_de_cero()
    for s in ('s-hero-img', 'sec-servicios-iconos'):
        pg.click(f'.sec-card[data-sec="{s}"] .sec-ins'); pg.wait_for_timeout(400)
    E("editor.select(null)")
    SERV = "tagDe(c) === 'section' && !tieneClase(c, 'hero')"
    pos = lambda cond: V(f"const r = {ed.comp(cond)}.getEl().getBoundingClientRect(); return [Math.round(r.top), Math.round(r.left), Math.round(r.width), Math.round(r.height)]")
    TIT = f"tagDe(c) === 'h2'"

    print('1. Sección ya construida (fondo claro)')
    antes_sec, antes_tit = pos(SERV), pos(TIT)
    ed.sel("tagDe(c) === 'h2'")   # se selecciona un título: se aplica a su contenedor
    pg.click('[data-tab=style]'); pg.wait_for_timeout(300)
    check('el recuadro aparece en Estilo', pg.is_visible('#part-box') and pg.is_visible('#part-poner'))
    ed.sel(SERV); pg.wait_for_timeout(200)
    pg.click('#part-poner'); pg.wait_for_timeout(2500)
    FP = "c.get('type') === 'fondo-particulas'"
    check('añade el fondo como hijo de la sección', E(f"{ed.comp(FP)}.parent() === {ed.comp(SERV)}") and E(f"tieneClase({ed.comp(SERV)}, 'con-particulas')"))
    check('el contenido no se mueve ni cambia de tamaño', pos(SERV) == antes_sec and pos(TIT) == antes_tit, [antes_sec, pos(SERV), antes_tit, pos(TIT)])
    check('dibuja el <canvas> ocupando toda la sección', V(f"const f = {ed.comp(FP)}.getEl(), s = {ed.comp(SERV)}.getEl(), cv = f.querySelector('canvas'); if (!cv) return false; const a = cv.getBoundingClientRect(), b = s.getBoundingClientRect(); return Math.abs(a.width - b.width) < 2 && Math.abs(a.height - b.height) < 2"))
    check('sobre fondo claro usa el color principal (no blanco)', E(f"{ed.comp(FP)}.getAttributes()['data-color']") != '#ffffff')
    check('queda debajo del texto (se puede hacer clic en el contenido)', V(f"const t = {ed.comp(TIT)}.getEl(), r = t.getBoundingClientRect(), d = t.ownerDocument; return d.elementFromPoint(r.left + 5, r.top + r.height / 2) === t || t.contains(d.elementFromPoint(r.left + 5, r.top + r.height / 2))"))
    pg.click('#btn-undo'); pg.wait_for_timeout(600)
    check('un solo Ctrl+Z lo quita', E(f"buscarComp(editor.getWrapper(), c => {FP}).length") == 0, E(f"buscarComp(editor.getWrapper(), c => {FP}).length"))
    pg.click('#btn-redo'); pg.wait_for_timeout(1500)
    check('rehacer lo vuelve a poner', E(f"buscarComp(editor.getWrapper(), c => {FP}).length") == 1)
    check('ofrece Ajustes y Quitar', pg.is_visible('#part-ajustes') and pg.is_visible('#part-quitar') and not pg.is_visible('#part-poner'))
    pg.click('#part-ajustes'); pg.wait_for_timeout(300)
    check('Ajustes selecciona el fondo y muestra sus propiedades', E(f"editor.getSelected() === {ed.comp(FP)}") and pg.is_visible('#traits'))
    print('2. Zona pequeña (una tarjeta)')
    CARD = "c.parent() && tieneClase(c.parent(), 'row') && tagDe(c) === 'div'"
    hijo = V(f"const c = {ed.comp(CARD)}; return c.components().length ? 1 : 0")
    ed.sel(CARD); pg.click('[data-tab=style]'); pg.wait_for_timeout(200)
    antes_card = pos(CARD)
    pg.click('#part-poner'); pg.wait_for_timeout(2500)
    FP2 = f"c.get('type') === 'fondo-particulas' && c.parent() === {ed.comp(CARD)}"
    datos = V(f"const f = buscarComp(editor.getWrapper(), c => {FP2})[0]; if (!f) return null; const c = editor.Canvas.getWindow().tsParticles.dom().find(x => !x.destroyed && x.canvas.element && f.getEl().contains(x.canvas.element)); return c ? [c.actualOptions.particles.number.value, c.actualOptions.particles.links.distance] : null")
    check('en una zona pequeña hay menos partículas y líneas más cortas', datos is not None and datos[0] < 70 and datos[1] < 140, datos)
    check('la tarjeta no cambia de tamaño', pos(CARD) == antes_card, [antes_card, pos(CARD)])

    print('3. Hero con imagen y capa oscura')
    HERO = "tieneClase(c, 'hero')"
    ed.sel("tieneClase(c, 'hero-contenido')")
    pg.click('[data-tab=style]'); pg.wait_for_timeout(200)
    check('desde el contenido del hero se ofrece ponerlo detrás de su contenedor', pg.is_visible('#part-poner') and 'Se ponen detrás' in pg.inner_text('#part-info'))
    ed.sel(HERO); pg.click('#part-poner'); pg.wait_for_timeout(2500)
    orden = V(f"return {ed.comp(HERO)}.components().map(c => c.getClasses().join('.'))")
    check('en el hero va encima de la capa oscura y debajo del texto', orden.index('fondo-particulas.fondo-particulas-sobre') == orden.index('overlay') + 1, orden)
    check('el texto del hero sigue encima', E("getComputedStyle(editor.Canvas.getDocument().querySelector('.hero .hero-contenido')).zIndex") == '2')

    print('4. Quitar y exportar')
    ed.sel(CARD); pg.click('[data-tab=style]'); pg.wait_for_timeout(200)
    pg.click('#part-quitar'); pg.wait_for_timeout(500)
    check('Quitar deja la tarjeta como estaba', E(f"!buscarComp(editor.getWrapper(), c => {FP2}).length && !tieneClase({ed.comp(CARD)}, 'con-particulas')"))
    with pg.expect_download(timeout=120000) as dl:
        pg.click('#btn-export')
    z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    d = pathlib.Path(tempfile.mkdtemp()); z.extractall(d)
    zp = ctx.new_page(); zp.set_viewport_size({'width': 1280, 'height': 900}); err = []
    zp.on('pageerror', lambda e: err.append(str(e)))
    zp.goto((d / 'index.html').as_uri()); zp.wait_for_load_state('networkidle'); zp.wait_for_timeout(2500)
    check('en el sitio exportado se dibujan los dos fondos', zp.locator('.con-particulas > .fondo-particulas canvas').count() == 2)
    enc = zp.evaluate("(() => { const t = document.querySelector('.con-particulas h2'); t.scrollIntoView({block: 'center', behavior: 'instant'}); const r = t.getBoundingClientRect(); const e = document.elementFromPoint(r.left + 5, r.top + r.height / 2); return [e === t || t.contains(e), e && e.outerHTML.slice(0, 160), getComputedStyle(t).opacity]; })()")
    check('y el texto sigue siendo clicable encima', enc[0], enc)
    zp.set_viewport_size({'width': 375, 'height': 800}); zp.wait_for_timeout(1200)
    check('en móvil el fondo se ajusta al nuevo tamaño', zp.evaluate("[...document.querySelectorAll('.con-particulas > .fondo-particulas')].every(f => { const c = f.querySelector('canvas'); return c && Math.abs(c.getBoundingClientRect().width - f.getBoundingClientRect().width) < 2; })") and zp.evaluate('document.documentElement.scrollWidth') == 375)
    check('sin errores de JavaScript', not err and not ed.errores, (err + ed.errores)[:3])
    b.close()
sys.exit(0 if resumen() else 1)
