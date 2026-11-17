"""Cinco efectos nuevos: contador animado, degradado en movimiento,
separadores con forma, línea de tiempo y tarjetas 3D.
Comprueba que se insertan desde Secciones/Bloques, que se pueden aplicar a lo
ya construido (Propiedades / Estilo) y que funcionan en el sitio exportado.
Uso: python pruebas/prueba_efectos.py [carpeta-capturas]"""
import io, pathlib, sys, tempfile, zipfile
from playwright.sync_api import sync_playwright
from comun import Editor, check, resumen

CAPS = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1600, 'height': 950}, accept_downloads=True)
    ed = Editor(ctx)
    pg, E, V = ed.pg, ed.E, ed.V
    ed.empezar_de_cero()
    for s in ('sec-hero-degradado', 'sec-separador', 'sec-servicios-3d', 'sec-linea-tiempo', 'sec-cifras', 's-intro'):
        check(f'la sección {s} está en el catálogo', pg.locator(f'.sec-card[data-sec="{s}"]').count() == 1)
        pg.click(f'.sec-card[data-sec="{s}"] .sec-ins'); pg.wait_for_timeout(400)
        E("editor.select(null)")
    pg.wait_for_timeout(500)

    print('1. Separador con forma')
    SEP = "c.get('type') === 'separador-forma'"
    HD0 = "tieneClase(c, 'degradado-anim')"
    check('es un componente con su dibujo SVG', E(f"!!{ed.comp(SEP)}.getEl().querySelector('svg path')"))
    col = V(f"return [{ed.comp(SEP)}.getStyle().color, getComputedStyle({ed.comp(SEP)}.getEl()).backgroundColor]")
    check('la forma toma el color de la sección de abajo y el resto es transparente', col[0] == '#ffffff' and col[1] == 'rgba(0, 0, 0, 0)', col)
    sol = V(f"const s = {ed.comp(SEP)}.getEl().getBoundingClientRect(), h = {ed.comp(HD0)}.getEl().getBoundingClientRect(); return [Math.round(s.top), Math.round(h.bottom)]")
    check('se monta sobre el borde inferior del hero (sin franja)', sol[0] == sol[1] - 80, sol)
    d0 = E(f"{ed.comp(SEP)}.getEl().querySelector('path').getAttribute('d')")
    E(f"({ed.comp(SEP)}.addAttributes({{ 'data-forma': 'diagonal', 'data-invertido': 'si' }}), 1)"); pg.wait_for_timeout(300)
    check('cambiar la forma redibuja el SVG', E(f"{ed.comp(SEP)}.getEl().querySelector('path').getAttribute('d')") != d0)
    check('dar la vuelta lo voltea', 'matrix(1, 0, 0, -1' in E(f"getComputedStyle({ed.comp(SEP)}.getEl().querySelector('svg')).transform"))
    E(f"({ed.comp(SEP)}.set('sf-alto', 140), 1)"); pg.wait_for_timeout(200)
    alto = V(f"const s = {ed.comp(SEP)}.getEl().getBoundingClientRect(), n = {ed.comp(SEP)}.getEl().nextElementSibling.getBoundingClientRect(); return [Math.round(s.height), Math.round(n.top - s.top)]")
    check('el alto se cambia desde Propiedades (volteado se monta sobre la de abajo)', alto == [140, 0], alto)
    check('las partes del dibujo no se seleccionan por separado', E(f"{ed.comp(SEP)}.components().length") == 0)
    check('hay bloques de separador en Bloques', E("editor.Blocks.getAll().filter(b => b.get('id').startsWith('sep-')).length") >= 5)

    print('2. Degradado en movimiento')
    HD = "tieneClase(c, 'degradado-anim')"
    check('el hero trae el degradado animado', E(f"getComputedStyle({ed.comp(HD)}.getEl()).animationName") == 'degradado-mueve')
    INTRO = "tagDe(c) === 'section' && c.getAttributes().id === 'intro'"
    ed.sel(INTRO); pg.click('[data-tab=style]'); pg.wait_for_timeout(300)
    check('el recuadro aparece en Estilo para algo ya construido', pg.is_visible('#deg-box'))
    pg.fill('#deg-vel', '9'); pg.click('#deg-poner'); pg.wait_for_timeout(400)
    est = V(f"const e = {ed.comp(INTRO)}.getEl(), s = getComputedStyle(e); return [s.animationName, s.animationDuration, s.backgroundImage.slice(0, 15)]")
    check('se aplica a la sección: colores, animación y lentitud', est == ['degradado-mueve', '9s', 'linear-gradient'], est)
    pg.click('#btn-undo'); pg.wait_for_timeout(400)
    check('un Ctrl+Z lo quita', not E(f"tieneClase({ed.comp(INTRO)}, 'degradado-anim')"))
    pg.click('#btn-redo'); pg.wait_for_timeout(400)

    print('3. Línea de tiempo')
    check('4 hitos en una lista ordenada', E("buscarComp(editor.getWrapper(), c => tieneClase(c, 'lt-item')).length") == 4 and E("buscarComp(editor.getWrapper(), c => tieneClase(c, 'linea-tiempo'))[0].get('tagName')") == 'ol')
    lados = V("const it = [...editor.Canvas.getDocument().querySelectorAll('.lt-item')]; const m = editor.Canvas.getDocument().querySelector('.linea-tiempo').getBoundingClientRect(); return it.map(e => e.getBoundingClientRect().left < m.left + m.width / 4 ? 'izq' : 'der')")
    check('en escritorio los hitos alternan a cada lado', lados == ['izq', 'der', 'izq', 'der'], lados)

    print('4. Contador y tarjetas 3D aplicables a lo existente')
    ed.sel("tieneClase(c, 'dato')"); pg.click('[data-tab=traits]'); pg.wait_for_timeout(300)
    check('una cifra ofrece «Contar desde 0 al aparecer»', pg.locator('#traits').inner_text().find('Contar desde 0') >= 0)
    ed.sel("tieneClase(c, 'servicio-ico')"); pg.wait_for_timeout(300)
    check('una tarjeta ofrece «Inclinar en 3D»', pg.locator('#traits').inner_text().find('Inclinar en 3D') >= 0)
    TL = "tieneClase(c, 'lt-tarjeta')"
    E(f"({ed.comp(TL)}.addAttributes({{ 'data-inclinar': 'si' }}), 1)")
    if CAPS: CAPS.mkdir(parents=True, exist_ok=True); pg.screenshot(path=str(CAPS / 'editor.png'))

    print('5. Sitio exportado')
    with pg.expect_download(timeout=120000) as dl:
        pg.click('#btn-export')
    z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    nombres = z.namelist()
    check('el ZIP lleva js/contadores.js y js/tarjetas-3d.js', 'js/contadores.js' in nombres and 'js/tarjetas-3d.js' in nombres)
    d = pathlib.Path(tempfile.mkdtemp()); z.extractall(d)
    zp = ctx.new_page(); zp.set_viewport_size({'width': 1440, 'height': 900}); err = []
    zp.on('pageerror', lambda e: err.append(str(e)))
    zp.goto((d / 'index.html').as_uri()); zp.wait_for_load_state('networkidle'); zp.wait_for_timeout(500)
    if CAPS: zp.screenshot(path=str(CAPS / 'zip-hero.png'))
    antes = zp.evaluate("[...document.querySelectorAll('#cifras .dato')].map(e => e.textContent)")
    check('antes de verlas, las cifras están en 0', antes == ['+0', '0', '0%', '0,0'], antes)
    zp.evaluate("document.querySelector('#cifras').scrollIntoView({block: 'center', behavior: 'instant'})")
    zp.wait_for_timeout(700)
    medio = zp.evaluate("document.querySelector('#cifras .dato').textContent")
    zp.wait_for_timeout(1800)
    despues = zp.evaluate("[...document.querySelectorAll('#cifras .dato')].map(e => e.textContent)")
    check('al aparecer cuentan y terminan en la cifra exacta', despues == ['+1.200', '15', '98%', '4,9'] and medio not in ('+0', '+1.200'), [medio, despues])
    if CAPS: zp.screenshot(path=str(CAPS / 'zip-cifras.png'))
    card = zp.locator('[data-inclinar="si"]').first
    card.scroll_into_view_if_needed(); zp.wait_for_timeout(300)
    bb = card.bounding_box()
    zp.mouse.move(bb['x'] + bb['width'] * 0.85, bb['y'] + bb['height'] * 0.2); zp.wait_for_timeout(250)
    zp.mouse.move(bb['x'] + bb['width'] * 0.9, bb['y'] + bb['height'] * 0.15); zp.wait_for_timeout(250)
    tr = zp.evaluate("(() => { const e = document.querySelector('[data-inclinar=\"si\"]'); return [e.style.transform, e.classList.contains('inclinando'), !!e.querySelector('.brillo-3d')]; })()")
    check('la tarjeta se inclina con el ratón y brilla', 'rotateY' in tr[0] and tr[1] and tr[2], tr)
    if CAPS: zp.screenshot(path=str(CAPS / 'zip-3d.png'))
    zp.mouse.move(5, 5); zp.wait_for_timeout(300)
    check('al salir vuelve a su sitio', zp.evaluate("document.querySelector('[data-inclinar=\"si\"]').style.transform") == '')
    zp.evaluate("document.querySelector('.linea-tiempo').scrollIntoView({block: 'center', behavior: 'instant'})"); zp.wait_for_timeout(900)
    if CAPS: zp.screenshot(path=str(CAPS / 'zip-linea.png'))
    zp.set_viewport_size({'width': 375, 'height': 800}); zp.wait_for_timeout(500)
    check('en móvil no hay desborde horizontal', zp.evaluate('document.documentElement.scrollWidth') == 375)
    lados_m = zp.evaluate("(() => { const m = document.querySelector('.linea-tiempo').getBoundingClientRect(); return [...document.querySelectorAll('.lt-item')].every(e => Math.abs(e.getBoundingClientRect().left - m.left) < 2); })()")
    check('en móvil la línea de tiempo queda en una columna', lados_m)
    if CAPS: zp.screenshot(path=str(CAPS / 'zip-movil.png'), full_page=True)
    check('sin errores de JavaScript', not err and not ed.errores, (err + ed.errores)[:3])

    print('6. Movimiento reducido')
    ctx2 = b.new_context(reduced_motion='reduce'); zr = ctx2.new_page()
    zr.goto((d / 'index.html').as_uri()); zr.wait_for_load_state('networkidle')
    check('con «reducir movimiento» las cifras se ven ya completas', zr.evaluate("document.querySelector('#cifras .dato').textContent") == '+1.200')
    check('y el degradado no se mueve', zr.evaluate("getComputedStyle(document.querySelector('.degradado-anim')).animationName") == 'none')
    b.close()
sys.exit(0 if resumen() else 1)
