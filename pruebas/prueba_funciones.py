"""Segunda pasada: el resto de funciones del editor."""
import base64, json, os
from playwright.sync_api import sync_playwright

OK, FAIL = [], []
def check(n, c, x=''):
    (OK if c else FAIL).append(n)
    print(('  OK   ' if c else '  FALLA ') + n + (f'  -> {x}' if x and not c else ''))

D = os.path.dirname(os.path.abspath(__file__))
open(os.path.join(D, 'foto.png'), 'wb').write(base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='))
LISTO = '(() => { try { return editor.Canvas.getDocument().body && editor.Pages.getAll().length > 0; } catch (e) { return false; } })()'

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
    pg = ctx.new_page()
    err = []
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and err.append(m.text))
    pg.on('dialog', lambda d: d.accept())
    pg.goto('http://127.0.0.1:8765/index.html')
    pg.wait_for_function(LISTO, timeout=60000)
    pg.wait_for_timeout(1500)
    def E(js):
        return pg.evaluate(f'(() => {{ const r = ({js}); return (r && typeof r === "object" && !Array.isArray(r)) ? true : r; }})()')
    if pg.locator('.gjs-mdl-title', has_text='Bienvenido').is_visible():
        pg.locator('.plantilla[data-modo="completo"]').click()
        pg.wait_for_timeout(1200)
    E("editor.Modal.close()")
    pg.wait_for_timeout(500)
    E("editor.select(buscarComp(editor.getWrapper(), c => tagDe(c) === 'h2')[0])")
    E("editor.Pages.getSelected() && document.querySelector('#gjs')")
    pg.wait_for_timeout(300)
    pg.click('[data-group=right] [data-tab=style]')
    pg.evaluate("document.querySelectorAll('#styles .gjs-sm-sector-title')[2] && document.querySelectorAll('#styles .gjs-sm-sector-title')[2].click()")
    pg.wait_for_timeout(400)
    pg.screenshot(path=os.path.join(D, 'editor.png'))

    print('Dispositivos')
    for dev, maxw in [('tablet', 800), ('mobile', 400), ('desktop', 5000)]:
        pg.click(f'[data-device={dev}]')
        pg.wait_for_timeout(700)
        w = E("Math.round(editor.Canvas.getFrameEl().getBoundingClientRect().width)")
        check(f'{dev}: ancho {w}px', 300 < w <= maxw, w)
    check('indicador de punto de corte', 'px' in pg.inner_text('#bp-info'))

    print('Código, ayuda, bordes')
    pg.click('#btn-code')
    pg.wait_for_timeout(800)
    check('ventana de código abre con sus pestañas', pg.locator('.gjs-mdl-content .cod-tab').count() >= 3 and pg.locator('.gjs-mdl-content .cod-pane.active .cod-editor').count() == 1)
    E("editor.Modal.close()")
    pg.keyboard.press('F1')
    pg.wait_for_timeout(300)
    check('F1 abre la ayuda', pg.locator('.gjs-mdl-title', has_text='Ayuda').is_visible())
    E("editor.Modal.close()")
    on = E("editor.Commands.isActive('sw-visibility')")
    pg.click('#btn-borders')
    check('botón de bordes alterna', E("editor.Commands.isActive('sw-visibility')") != on)

    print('Imagen: URL y subir archivo')
    E("(() => { const c = editor.getWrapper().append({ type: 'image', attributes: { class: 'img-fluid' } })[0]; window.__img = c; editor.select(c); })()")
    pg.wait_for_timeout(300)
    check('caja «Imagen desde una URL» visible', pg.locator('#img-box').is_visible())
    pg.fill('#img-url', 'https://picsum.photos/200')
    pg.click('#img-apply')
    check('imagen por URL aplicada', E("__img.get('src')") == 'https://picsum.photos/200')
    E("editor.runCommand('open-assets', { target: __img, types: ['image'], accept: 'image/*' })")
    pg.wait_for_timeout(500)
    pg.set_input_files('.gjs-am-file-uploader input[type=file]', os.path.join(D, 'foto.png'))
    pg.wait_for_timeout(1000)
    check('subir archivo añade la imagen (base64)', E("editor.Assets.getAll().some(a => (a.get('src') || '').startsWith('data:image/png'))"))
    E("editor.Modal.close()")

    print('Fondo y capa de color')
    E("(() => { const s = editor.getWrapper().append('<section class=\"py-5\"><h2>x</h2></section>')[0]; window.__sec = s; editor.select(s); })()")
    pg.wait_for_timeout(300)
    pg.click('[data-group=right] [data-tab=style]')
    pg.fill('#bg-url', 'https://picsum.photos/800')
    pg.click('#bg-apply')
    check('imagen de fondo por URL', 'picsum' in (E("__sec.getStyle()['background-image'] || ''")))
    pg.locator('#ov-op').fill('40')
    pg.wait_for_timeout(200)
    check('capa de color aplicada', '0.4' in (E("__sec.getStyle()['box-shadow'] || ''")), E("__sec.getStyle()['box-shadow']"))

    print('Video por URL')
    E("(() => { const v = editor.getWrapper().append({ type: 'video', src: 'https://www.youtube.com/embed/jNQXAC9IVRw' })[0]; window.__v = v; editor.select(v); })()")
    pg.wait_for_timeout(300)
    pg.fill('#video-url', 'https://vimeo.com/76979871')
    pg.click('#video-apply')
    check('video cambiado a Vimeo', E("__v.get('provider')") == 'vi' and E("__v.get('videoId')") == '76979871')

    print('Importar HTML')
    pg.click('#btn-import')
    pg.fill('.imp-ta', '<style>.rojo{color:red}</style><div class="container"><h1 class="rojo">Importado</h1></div>')
    pg.click('.gjs-mdl-container .tb-btn.primary')
    pg.wait_for_timeout(500)
    check('HTML importado con su CSS', 'Importado' in E("editor.getHtml()") and 'color:red' in E("editor.getCss()").replace(' ', ''))

    print('Guardar y abrir .json')
    with pg.expect_download() as dl:
        pg.keyboard.press('Control+Shift+S')
    ruta = dl.value.path()
    data = json.load(open(ruta, encoding='utf-8'))
    check('el .json trae páginas y tema', len(data.get('pages', [])) >= 4 and '__tema' in data)
    antes = E("editor.Pages.getAll().length")
    E("editor.Pages.add({ name: 'Temporal' })")
    pg.set_input_files('input[type=file][accept^=".json"]', ruta)
    pg.wait_for_timeout(1500)
    check('abrir .json restaura el proyecto', E("editor.Pages.getAll().length") == antes, E("editor.Pages.getAll().length"))

    print('Resetear')
    pg.click('#btn-new')
    pg.locator('.plantilla[data-modo="todo"]').click()
    pg.wait_for_timeout(4000)
    pg.wait_for_function(LISTO, timeout=60000)
    pg.wait_for_timeout(1500)
    check('tras resetear: 1 página vacía y bienvenida',
          E("editor.Pages.getAll().length") == 1 and E("editor.getWrapper().components().length") == 0
          and pg.locator('.gjs-mdl-title', has_text='Bienvenido').is_visible())
    pg.locator('.plantilla[data-modo="inicio"]').click()
    pg.wait_for_timeout(1500)
    pg.keyboard.press('Control+p')
    pg.wait_for_timeout(1500)
    pg.screenshot(path=os.path.join(D, 'vista-previa.png'))
    pg.keyboard.press('Escape')

    check('sin errores de JavaScript', not err, err[:5])
    print(f'\nRESULTADO: {len(OK)} correctas, {len(FAIL)} fallidas')
    b.close()
