"""Pantalla de carga (Sitio → Pantalla de carga): logo mientras carga y
efecto de salida. Comprueba el panel, la prueba sobre el lienzo, que se
guarda con el proyecto y que funciona en el sitio exportado.
Uso: python pruebas/prueba_precarga.py [carpeta-capturas]"""
import io, pathlib, sys, tempfile, zipfile
from playwright.sync_api import sync_playwright
from comun import Editor, check, resumen

CAPS = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGNk+M/AwMDAxMDAwMDAAAAOFAEBgnUiaQAAAABJRU5ErkJggg=='


def exportar(pg):
    with pg.expect_download(timeout=120000) as dl:
        pg.click('#btn-export')
    z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    d = pathlib.Path(tempfile.mkdtemp()); z.extractall(d)
    return z, d


with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1600, 'height': 950}, accept_downloads=True)
    ed = Editor(ctx)
    pg, E, V = ed.pg, ed.E, ed.V
    ed.empezar_de_cero()
    E("(editor.addComponents('<nav class=\"navbar\"><div class=\"container\"><a class=\"navbar-brand\" href=\"index.html\">Café Andino</a></div></nav>'"
      "+ '<main id=\"contenido\"><section class=\"py-5\"><div class=\"container\"><h1 data-reveal=\"fade-up\">Hola</h1><p>Texto</p></div></section></main>'), 1)")
    pg.wait_for_timeout(400)

    print('1. Panel en Sitio')
    pg.click('.tabs[data-group=left] button[data-tab=sitio]'); pg.wait_for_timeout(300)
    check('el recuadro «Pantalla de carga» está en Sitio', pg.is_visible('#pl-box'))
    check('empieza desactivada y sin opciones a la vista', not E('PRE.activo') and not pg.is_visible('#pl-opciones'))
    pg.check('#pl-activo'); pg.wait_for_timeout(300)
    check('al activarla aparecen las opciones', pg.is_visible('#pl-opciones') and E('PRE.activo'))
    check('usa el logo del menú y lo dice', 'Café Andino' in pg.inner_text('#pl-fuente-info'), pg.inner_text('#pl-fuente-info'))
    vis = V("const e = editor.Canvas.getDocument().getElementById('pl-prueba'); if (!e) return null; const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.width), getComputedStyle(e).position]")
    check('se ve sobre el lienzo con el texto del menú, a pantalla completa', vis and vis[0] == 'Café Andino' and vis[1] > 600 and vis[2] == 'fixed', vis)
    if CAPS: CAPS.mkdir(parents=True, exist_ok=True); pg.screenshot(path=str(CAPS / 'editor-precarga.png'))
    pg.wait_for_timeout(3200)
    check('después sale sola del lienzo (no queda en el diseño)', E("!editor.Canvas.getDocument().getElementById('pl-prueba')") and 'precarga' not in E('editor.getHtml()'))

    pg.select_option('#pl-anim', 'barra'); pg.select_option('#pl-salida', 'cortina'); pg.wait_for_timeout(200)
    check('al cambiar el efecto se vuelve a mostrar con él', E("!!editor.Canvas.getDocument().querySelector('#pl-prueba.pl-sale-cortina .pl-barra')"))
    pg.select_option('#pl-fondo', 'personal'); pg.wait_for_timeout(100)
    check('«Otro color» muestra el selector de color', pg.is_visible('#pl-color'))
    pg.select_option('#pl-fondo', 'osc')
    pg.fill('#pl-minimo', '1200'); pg.dispatch_event('#pl-minimo', 'change'); pg.wait_for_timeout(100)
    check('el tiempo mínimo se muestra en segundos', pg.inner_text('#pl-minimo-v') == '1,2 s', pg.inner_text('#pl-minimo-v'))
    pg.select_option('#pl-fuente', 'imagen'); pg.wait_for_timeout(400)
    check('«Otra imagen» abre el administrador de imágenes', E('editor.Modal.isOpen()'))
    E("editor.Modal.close()")
    pg.select_option('#pl-fuente', 'menu'); pg.wait_for_timeout(3500)

    print('2. Se guarda con el proyecto')
    pg.wait_for_timeout(1500)
    pg.reload(); ed.esperar()
    guardado = E("[PRE.activo, PRE.anim, PRE.salida, PRE.fondo, PRE.minimo, PRE.unaVez].join('|')")
    check('al recargar el editor sigue igual', guardado == 'true|barra|cortina|osc|1200|true', guardado)
    pg.click('.tabs[data-group=left] button[data-tab=sitio]'); pg.wait_for_timeout(300)
    check('y el panel lo muestra', pg.is_checked('#pl-activo') and pg.input_value('#pl-salida') == 'cortina')
    with pg.expect_download() as dl:
        pg.click('#btn-save')
    pj = __import__('json').loads(open(dl.value.path(), encoding='utf-8').read())
    check('viaja dentro del .json del proyecto', (pj.get('__precarga') or {}).get('salida') == 'cortina', pj.get('__precarga'))

    print('3. Sitio exportado')
    z, d = exportar(pg)
    check('el ZIP lleva js/precarga.js', 'js/precarga.js' in z.namelist())
    html = (d / 'index.html').read_text(encoding='utf-8')
    check('el marcado va al principio del cuerpo', html.find('id="precarga"') < html.find('<nav'))
    check('la cabecera la marca antes de pintar y sin JS no se muestra', 'pl-cargando' in html.split('</head>')[0] and '<noscript><style>.precarga{display:none}' in html)
    check('el CSS está en site.css', '.precarga{position:fixed' in (d / 'css/site.css').read_text(encoding='utf-8'))
    zp = ctx.new_page(); zp.set_viewport_size({'width': 1280, 'height': 800}); err = []
    zp.on('pageerror', lambda e: err.append(str(e)))
    zp.goto((d / 'index.html').as_uri(), wait_until='domcontentloaded'); zp.wait_for_timeout(300)
    al_inicio = zp.evaluate("(() => { const e = document.getElementById('precarga'); const r = e && e.getBoundingClientRect(); return e && [e.textContent, r.width, r.height, document.documentElement.classList.contains('pl-cargando'), getComputedStyle(document.documentElement).overflow, getComputedStyle(document.querySelector('h1')).opacity]; })()")
    check('al abrir la página se ve el logo, cubre todo y no se puede desplazar', al_inicio and al_inicio[0] == 'Café Andino' and al_inicio[1] == 1280 and al_inicio[2] == 800 and al_inicio[3] and al_inicio[4] == 'hidden', al_inicio)
    check('lo que aparece con animación espera a que se vaya', al_inicio and al_inicio[5] == '0', al_inicio)
    if CAPS: zp.screenshot(path=str(CAPS / 'zip-cargando.png'))
    zp.wait_for_timeout(1050)
    saliendo = zp.evaluate("(() => { const e = document.getElementById('precarga'); return e && e.classList.contains('pl-saliendo'); })()")
    check('respeta el tiempo mínimo y luego sale con su efecto', saliendo, saliendo)
    zp.wait_for_timeout(400)
    if CAPS: zp.screenshot(path=str(CAPS / 'zip-telon.png'))
    zp.wait_for_timeout(1500)
    fin = zp.evaluate("[!!document.getElementById('precarga'), document.documentElement.classList.contains('pl-cargando'), getComputedStyle(document.documentElement).overflow]")
    check('al terminar desaparece y se puede desplazar', fin == [False, False, 'visible'], fin)
    zp.reload(wait_until='domcontentloaded'); zp.wait_for_timeout(150)
    otra = zp.evaluate("[document.documentElement.classList.contains('pl-visto'), !!document.getElementById('precarga')]")
    check('«solo al entrar»: en la misma visita no se repite', otra == [True, False], otra)

    zr = b.new_context(reduced_motion='reduce').new_page()
    zr.goto((d / 'index.html').as_uri(), wait_until='domcontentloaded'); zr.wait_for_timeout(200)
    red = zr.evaluate("getComputedStyle(document.querySelector('.pl-barra i')).animationName")
    check('con «reducir movimiento» no hay animaciones', red == 'none', red)
    zr.wait_for_timeout(2600)
    check('y también se va', not zr.evaluate("!!document.getElementById('precarga')"))
    check('sin errores de JavaScript', not err and not ed.errores, (err + ed.errores)[:3])

    print('4. Imagen propia, sin efecto y cada página')
    E(f"(PRE.fuente = 'imagen', PRE.logo = '{PNG}', PRE.salida = 'ninguna', PRE.unaVez = false, PRE.minimo = 0, 1)")
    z, d = exportar(pg)
    html = (d / 'index.html').read_text(encoding='utf-8')
    src = html.split('class="pl-logo" src="')[1].split('"')[0] if 'pl-logo' in html else ''
    check('la imagen va a la carpeta assets', src.startswith('assets/') and src in z.namelist(), src)
    check('sin «solo al entrar» no se recuerda la visita', 'data-una-vez="no"' in html)
    zp.goto((d / 'index.html').as_uri()); zp.wait_for_timeout(300)
    check('«Desaparece sin efecto» se va al instante', not zp.evaluate("!!document.getElementById('precarga')"))

    print('5. Desactivada')
    pg.click('.tabs[data-group=left] button[data-tab=sitio]'); pg.uncheck('#pl-activo'); pg.wait_for_timeout(200)
    z, d = exportar(pg)
    html = (d / 'index.html').read_text(encoding='utf-8')
    check('apagada, el sitio no lleva nada de la pantalla de carga', 'precarga' not in html and 'js/precarga.js' not in z.namelist() and '.precarga' not in (d / 'css/site.css').read_text(encoding='utf-8'))
    b.close()
sys.exit(0 if resumen() else 1)
