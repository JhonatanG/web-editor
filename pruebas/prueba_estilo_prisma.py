"""Prediseños «estilo Prisma»: menú en pestaña colgante y hero enmarcado.
Comprueba que están en Secciones, que el menú se reconoce como menú del sitio
(se marca la página activa), que el hero acepta video de fondo, y que el ZIP
se ve sin desbordes en escritorio y móvil."""
import io, pathlib, sys, tempfile, zipfile
from playwright.sync_api import sync_playwright
from comun import Editor, check, resumen

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1600, 'height': 950}, accept_downloads=True)
    ed = Editor(ctx)
    pg, E, V = ed.pg, ed.E, ed.V
    ed.empezar_de_cero()
    for s in ('sec-hero-prisma', 'sec-hero-marco', 'sec-menu-pestana'):
        check(f'la sección {s} está en el catálogo', pg.locator(f'.sec-card[data-sec="{s}"]').count() == 1)
    pg.click('.sec-card[data-sec="sec-hero-prisma"] .sec-ins'); pg.wait_for_timeout(800)
    check('inserta el menú en pestaña y el hero enmarcado', E("buscarComp(editor.getWrapper(), c => tieneClase(c, 'nav-pestana')).length") == 1 and E("buscarComp(editor.getWrapper(), c => tieneClase(c, 'hero-marco')).length") == 1)
    check('el menú se reconoce como menú del sitio', E("ES_NAV(buscarComp(editor.getWrapper(), c => tieneClase(c, 'nav-pestana'))[0])"))
    E("marcarActivo(editor.getWrapper(), 'servicios.html')")
    check('marcar la página activa pone active y aria-current', V("const l = buscarComp(editor.getWrapper(), c => tieneClase(c, 'nav-link')); return l.filter(x => tieneClase(x, 'active')).map(x => [x.getAttributes().href, x.getAttributes()['aria-current']])") == [['servicios.html', 'page']])
    E("marcarActivo(editor.getWrapper(), 'index.html')")
    check('la marca va en un h1 (semántica) y el asterisco es decorativo', E("buscarComp(editor.getWrapper(), c => tieneClase(c, 'hero-marca'))[0].get('tagName')") == 'h1' and E("buscarComp(editor.getWrapper(), c => tieneClase(c, 'hero-marca-ast'))[0].getAttributes()['aria-hidden']") == 'true')
    ed.sel("tieneClase(c, 'hero-marco-texto')")
    pg.click('[data-tab=style]'); pg.wait_for_timeout(300)
    check('al seleccionar el texto del hero aparece «Video de fondo»', pg.is_visible('#video-box'))
    with pg.expect_download(timeout=120000) as dl:
        pg.click('#btn-export')
    z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    d = pathlib.Path(tempfile.mkdtemp()); z.extractall(d)
    for ancho, alto in ((1440, 900), (375, 812)):
        zp = ctx.new_page(); zp.set_viewport_size({'width': ancho, 'height': alto}); err = []
        zp.on('pageerror', lambda e: err.append(str(e)))
        zp.goto((d / 'index.html').as_uri()); zp.wait_for_load_state('networkidle')
        r = zp.evaluate("""() => { const h = document.querySelector('.hero-marca').getBoundingClientRect(), m = document.querySelector('.hero-marco-lienzo').getBoundingClientRect(), n = document.querySelector('.nav-pestana').getBoundingClientRect();
          return { scroll: document.documentElement.scrollWidth, linea: h.height < parseFloat(getComputedStyle(document.querySelector('.hero-marca')).fontSize) * 1.3, dentro: h.right <= m.right && h.left >= m.left, nav: n.top === 0 && n.right <= innerWidth }; }""")
        check(f'a {ancho}px: sin desborde horizontal', r['scroll'] == ancho, r)
        check(f'a {ancho}px: el nombre gigante cabe en una línea dentro del marco', r['linea'] and r['dentro'], r)
        check(f'a {ancho}px: el menú cuelga del borde superior', r['nav'], r)
        check(f'a {ancho}px: sin errores de JavaScript', not err, err[:2])
        zp.close()
    check('sin errores de JavaScript en el editor', not ed.errores, ed.errores[:3])
    b.close()
sys.exit(0 if resumen() else 1)
