"""Texto que se escribe letra por letra (Propiedades → «Escribir letra por
letra»). Se aplica a textos ya hechos, respeta su formato, puede rotar
varias frases y funciona en el sitio exportado.
Uso: python pruebas/prueba_escribir.py [carpeta-capturas]"""
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
    E("(editor.addComponents('<main id=\"contenido\"><section class=\"py-5\"><div class=\"container\">"
      "<h1 id=\"t1\">Hola <span class=\"text-primary\">mundo</span> bonito</h1>"
      "<p id=\"t2\" class=\"lead\">Hacemos diseño</p></div></section>"
      "<section style=\"height:1600px\"></section>"
      "<section class=\"py-5\"><div class=\"container\"><h2 id=\"t3\">Abajo del todo</h2></div></section></main>'), 1)")
    pg.wait_for_timeout(400)
    T1 = "c.getAttributes().id === 't1'"
    T2 = "c.getAttributes().id === 't2'"
    T3 = "c.getAttributes().id === 't3'"

    print('1. Propiedades')
    ed.sel(T1); pg.click('[data-tab=traits]'); pg.wait_for_timeout(300)
    check('un texto ya hecho ofrece «Escribir letra por letra»', 'Escribir letra por letra' in pg.inner_text('#traits'))
    check('las opciones no se ven hasta activarlo', 'Velocidad de escritura' not in pg.inner_text('#traits'))
    caja = pg.locator('#traits .gjs-trt-trait').filter(has_text='Escribir letra por letra').locator('.gjs-field-checkbox')
    caja.click(); pg.wait_for_timeout(300)
    a = E(f"{ed.comp(T1)}.getAttributes()")
    a = V(f"const a = {ed.comp(T1)}.getAttributes(); return [a['data-escribir'], a['data-escribir-vel'], a['data-escribir-cursor']]")
    check('al marcarlo queda activado con velocidad normal y cursor', a == ['si', '60', 'si'], a)
    txt = pg.inner_text('#traits')
    check('aparecen velocidad, cursor, otras frases y repetir', all(x in txt for x in ('Velocidad de escritura', 'Cursor parpadeando', 'Otras frases', 'Repetir sin parar')), txt)
    cur = V(f"const e = {ed.comp(T1)}.getEl(); const s = getComputedStyle(e, '::after'); return [getComputedStyle(e).visibility, s.content, e.textContent]")
    check('en el lienzo el texto se sigue viendo y editando, con el cursor al final', cur == ['visible', '""', 'Hola mundo bonito'], cur)
    if CAPS: CAPS.mkdir(parents=True, exist_ok=True); pg.screenshot(path=str(CAPS / 'editor.png'))
    pg.click('#btn-undo'); pg.wait_for_timeout(300)
    check('un Ctrl+Z lo quita entero', not V(f"const a = {ed.comp(T1)}.getAttributes(); return Object.keys(a).some(k => k.startsWith('data-escribir') && a[k] === 'si' || k === 'data-escribir-vel')"))
    pg.click('#btn-redo'); pg.wait_for_timeout(300)
    check('y Ctrl+Y lo devuelve', E(f"{ed.comp(T1)}.getAttributes()['data-escribir']") == 'si')
    E(f"({ed.comp(T1)}.addAttributes({{ 'data-escribir': 'no' }}), 1)"); pg.wait_for_timeout(200)
    check('al desmarcarlo se borran sus opciones', not V(f"return Object.keys({ed.comp(T1)}.getAttributes()).some(k => k.startsWith('data-escribir'))") and not E("!!editor.getSelected().getTrait('data-escribir-vel')"))
    E(f"({ed.comp(T1)}.addAttributes({{ 'data-escribir': 'si' }}), 1)")
    E(f"({ed.comp(T1)}.addAttributes({{ 'data-escribir-vel': '30' }}), 1)")
    E(f"({ed.comp(T2)}.addAttributes({{ 'data-escribir': 'si' }}), 1)"); pg.wait_for_timeout(100)
    E(f"({ed.comp(T2)}.addAttributes({{ 'data-escribir-frases': 'Fotografía | Marketing', 'data-escribir-repetir': 'si', 'data-escribir-vel': '30' }}), 1)")
    E(f"({ed.comp(T3)}.addAttributes({{ 'data-escribir': 'si' }}), 1)"); pg.wait_for_timeout(200)

    print('2. Sitio exportado')
    with pg.expect_download(timeout=120000) as dl:
        pg.click('#btn-export')
    z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    check('el ZIP lleva js/escribir.js', 'js/escribir.js' in z.namelist())
    d = pathlib.Path(tempfile.mkdtemp()); z.extractall(d)
    html = (d / 'index.html').read_text(encoding='utf-8')
    check('el texto completo sigue en el HTML (buscadores)', 'Hola <span class="text-primary">mundo</span> bonito' in html)
    zp = ctx.new_page(); zp.set_viewport_size({'width': 1280, 'height': 800}); err = []
    zp.on('pageerror', lambda e: err.append(str(e)))
    zp.goto((d / 'index.html').as_uri(), wait_until='domcontentloaded'); zp.wait_for_timeout(200)
    q = "(id) => { const e = document.getElementById(id); return e.firstElementChild ? e.firstElementChild.textContent : e.textContent; }"
    medio = zp.evaluate(q, 't1')
    check('empieza a escribirse al aparecer', 0 < len(medio) < len('Hola mundo bonito') and 'Hola mundo bonito'.startswith(medio), medio)
    if CAPS: zp.screenshot(path=str(CAPS / 'zip-escribiendo.png'))
    alto = zp.evaluate("(() => { const e = document.getElementById('t1'); return [e.style.minHeight !== '', e.querySelector('.visually-hidden').textContent]; })()")
    check('reserva su alto y los lectores de pantalla leen el texto completo', alto == [True, 'Hola mundo bonito'], alto)
    zp.wait_for_timeout(1500)
    fin = zp.evaluate("(() => { const c = document.getElementById('t1').firstElementChild; return [c.textContent, c.querySelector('span.text-primary') && c.querySelector('span.text-primary').textContent, c.getAttribute('aria-hidden')]; })()")
    check('termina con el texto exacto y conserva el color de «mundo»', fin == ['Hola mundo bonito', 'mundo', 'true'], fin)
    check('el de abajo espera a que se llegue a él', zp.evaluate(q, 't3') == '')
    vistos = set()
    for _ in range(40):
        vistos.add(zp.evaluate(q, 't2')); zp.wait_for_timeout(200)
    check('«otras frases»: borra y escribe la siguiente', {'Hacemos diseño', 'Fotografía', 'Marketing'} <= vistos, sorted(v for v in vistos if len(v) > 8))
    zp.evaluate("document.getElementById('t3').scrollIntoView({block: 'center', behavior: 'instant'})"); zp.wait_for_timeout(1800)
    check('al bajar se escribe', zp.evaluate(q, 't3') == 'Abajo del todo')
    zp.set_viewport_size({'width': 375, 'height': 800}); zp.wait_for_timeout(300)
    check('en móvil no hay desborde horizontal', zp.evaluate('document.documentElement.scrollWidth') == 375)
    check('sin errores de JavaScript', not err and not ed.errores, (err + ed.errores)[:3])

    print('3. Movimiento reducido')
    zr = b.new_context(reduced_motion='reduce').new_page()
    zr.goto((d / 'index.html').as_uri()); zr.wait_for_timeout(300)
    check('con «reducir movimiento» el texto está completo desde el principio', zr.evaluate("[document.getElementById('t1').textContent, getComputedStyle(document.getElementById('t1')).visibility]") == ['Hola mundo bonito', 'visible'])
    b.close()
sys.exit(0 if resumen() else 1)
