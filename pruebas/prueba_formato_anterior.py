"""Compatibilidad e importaciones.
Abre fixtures/proyecto-formato-anterior.json (guardado con el editor anterior,
commit 7cc52ce: 4 páginas y un menú distinto en galeria.html) y comprueba que
se abre tal cual, que no se vincula nada solo, que el asistente respeta el menú
distinto, que se guarda en el formato nuevo y que el ZIP abre y navega.
También: un .json que no es proyecto se rechaza y el HTML importado se sanea."""
import io, json, pathlib, sys, tempfile, zipfile
from playwright.sync_api import sync_playwright
from comun import Editor, check, resumen

AQUI = pathlib.Path(__file__).resolve().parent
ANTIGUO = AQUI / 'fixtures' / 'proyecto-formato-anterior.json'

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1600, 'height': 950}, accept_downloads=True)
    ed = Editor(ctx)
    pg, E, V = ed.pg, ed.E, ed.V
    alertas = []
    pg.on('dialog', lambda d: alertas.append(d.message))
    ed.empezar_de_cero()

    def abrir(ruta):
        with pg.expect_file_chooser() as fc:
            pg.click('#btn-open')
        fc.value.set_files(str(ruta))
        pg.wait_for_timeout(2000)

    print('1. Abrir un proyecto del formato anterior')
    check('el archivo de prueba no tiene marca de formato (es anterior)', '__formato' not in json.loads(ANTIGUO.read_text(encoding='utf-8')))
    abrir(ANTIGUO)
    check('se abren sus 4 páginas', E("editor.Pages.getAll().map(archivoDePagina).join()") == 'index.html,servicios.html,galeria.html,contacto.html')
    check('con su contenido', V("return buscarComp(editor.Pages.getAll()[0].getMainComponent(), c => tagDe(c) === 'h1')[0].getEl().textContent.trim()") == 'Proyecto del formato anterior')
    check('se avisa que es del formato anterior', 'formato anterior' in (pg.locator('.app-toast').inner_text() if pg.locator('.app-toast').count() else ''))
    check('no se vincula nada automáticamente', E("todosLosVinculos().length") == 0)
    check('el menú distinto de galeria.html se conserva', V("return buscarComp(editor.Pages.getAll()[2].getMainComponent(), c => tieneClase(c, 'nav-link'))[1].getEl ? buscarComp(editor.Pages.getAll()[2].getMainComponent(), c => tieneClase(c, 'nav-link'))[1].getInnerHTML().trim() : ''") == 'Quiénes somos')
    pg.click('[data-tab=pages]'); pg.wait_for_timeout(300)
    check('Páginas avisa de las versiones distintas del menú', 'versiones distintas' in pg.inner_text('#vinc-estado'), pg.inner_text('#vinc-estado'))
    pg.click('#vinc-nav'); pg.wait_for_timeout(400)
    filas = V("return [...document.querySelectorAll('.vinc-fila')].map(f => [f.textContent.trim().split(' ')[0], f.querySelector('input').checked])")
    check('el asistente deja sin marcar la página con menú distinto', filas == [['servicios.html', True], ['galeria.html', False], ['contacto.html', True]], filas)
    pg.click('#vinc-ok'); pg.wait_for_timeout(600)
    check('vinculado en 3 páginas y galeria.html intacta', E("todosLosVinculos()[0].instancias.length") == 2 and V("return buscarComp(editor.Pages.getAll()[2].getMainComponent(), c => tieneClase(c, 'nav-link'))[1].getInnerHTML().trim()") == 'Quiénes somos')

    print('2. Guardar en el formato nuevo y reabrir')
    with pg.expect_download() as d:
        pg.click('#btn-save')
    nuevo = json.loads(pathlib.Path(d.value.path()).read_text(encoding='utf-8'))
    check('el .json nuevo lleva __formato 2, la identidad y la publicación', nuevo.get('__formato') == 2 and '__tema' in nuevo and '__publicacion' in nuevo)
    check('y no lleva claves del servidor', 'clave' not in json.dumps(nuevo.get('__publicacion')))
    tmp = pathlib.Path(tempfile.mkdtemp()) / 'nuevo.json'; tmp.write_text(json.dumps(nuevo), encoding='utf-8')
    ed.empezar_de_cero(); abrir(tmp)
    check('reabrir conserva páginas y vínculos', E("editor.Pages.getAll().length") == 4 and E("todosLosVinculos()[0].instancias.length") == 2)

    print('3. Importaciones validadas')
    malo = pathlib.Path(tempfile.mkdtemp()) / 'malo.json'; malo.write_text('{"hola": 1}', encoding='utf-8')
    abrir(malo)
    check('un .json que no es proyecto se rechaza con el motivo', any('no es un proyecto válido' in a and 'páginas' in a for a in alertas), alertas[-1:])
    check('y el proyecto abierto no se toca', E("editor.Pages.getAll().length") == 4)
    roto = pathlib.Path(tempfile.mkdtemp()) / 'roto.json'; roto.write_text('{no es json', encoding='utf-8')
    abrir(roto)
    check('un archivo que no es JSON se rechaza', any('no es JSON' in a for a in alertas))
    futuro = dict(nuevo, __formato=99); fut = pathlib.Path(tempfile.mkdtemp()) / 'futuro.json'; fut.write_text(json.dumps(futuro), encoding='utf-8')
    abrir(fut)
    check('un proyecto de una versión más nueva se rechaza', any('más nueva' in a for a in alertas))
    pg.click('#btn-import'); pg.wait_for_timeout(300)
    pg.fill('.imp-ta', '<section><h2 onclick="alert(1)">Hola</h2><script>alert(2)</script><a href="javascript:alert(3)">x</a><img src="x.png" onerror="alert(4)" alt="y"><iframe srcdoc="<script>alert(5)</script>"></iframe></section>')
    pg.click('.gjs-mdl-content button.primary'); pg.wait_for_timeout(500)
    html = E("editor.getHtml()")
    check('el HTML importado llega sin scripts ni on… ni javascript:', 'Hola' in html and '<script' not in html and 'onclick' not in html and 'onerror' not in html and 'javascript:' not in html and 'srcdoc' not in html, html[:300])
    check('y se informa lo que se quitó', 'Se quitó por seguridad' in pg.locator('.app-toast').inner_text())
    pg.click('#btn-undo'); pg.wait_for_timeout(500)

    print('4. El ZIP del proyecto anterior abre y navega')
    abrir(ANTIGUO)
    with pg.expect_download(timeout=120000) as dl:
        pg.click('#btn-export')
    z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    dd = pathlib.Path(tempfile.mkdtemp()); z.extractall(dd)
    zp = ctx.new_page(); err = []
    zp.on('pageerror', lambda e: err.append(str(e)))
    zp.goto((dd / 'index.html').as_uri()); zp.wait_for_load_state('networkidle')
    check('index.html abre con su contenido', zp.locator('h1').first.text_content().strip() == 'Proyecto del formato anterior')
    zp.locator('a.nav-link[href="galeria.html"]').first.click(); zp.wait_for_load_state('networkidle')
    check('y navega a otra página', zp.url.endswith('galeria.html'))
    check('el ZIP no tiene errores de JavaScript', not err, err[:3])
    check('sin errores de JavaScript en el editor', not ed.errores, ed.errores[:3])
    b.close()
sys.exit(0 if resumen() else 1)
