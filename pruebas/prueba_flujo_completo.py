"""Prueba de extremo a extremo del editor en Chrome real (Playwright)."""
import io, sys, zipfile, re, json
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8765/index.html'
OK, FAIL = [], []
def check(nombre, cond, extra=''):
    (OK if cond else FAIL).append(nombre)
    print(('  OK   ' if cond else '  FALLA ') + nombre + (f'  -> {extra}' if extra and not cond else ''))

with sync_playwright() as p:
    nav = p.chromium.launch(channel='chrome', headless=True)
    ctx = nav.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
    page = ctx.new_page()
    errores = []
    page.on('pageerror', lambda e: errores.append(str(e)))
    page.on('console', lambda m: m.type == 'error' and errores.append(m.text))
    page.on('dialog', lambda d: d.accept())          # confirm()/alert() -> Aceptar

    page.goto(URL)
    page.wait_for_function('(() => { try { return typeof editor !== "undefined" && editor.getWrapper && editor.Canvas.getDocument() && editor.Canvas.getDocument().body; } catch (e) { return false; } })()', timeout=60000)
    page.wait_for_timeout(1500)
    def E(js):
        if ';' in js and not js.strip().startswith('('):
            return page.evaluate(f'(() => {{ {js}; return true; }})()')
        return page.evaluate(f'(() => {{ const r = ({js}); return (r && typeof r === "object" && !Array.isArray(r)) ? true : r; }})()')

    print('\n1. Carga y bienvenida')
    check('modal de bienvenida visible', page.locator('.gjs-mdl-title', has_text='Bienvenido').is_visible())
    check('hay bloques en el panel', E("document.querySelectorAll('#blocks .gjs-block').length") > 60)

    print('\n2. Plantilla de sitio completo')
    page.locator('.plantilla[data-modo="completo"]').click()
    page.wait_for_timeout(1500)
    archivos = E("editor.Pages.getAll().map(archivoDePagina)")
    check('4 páginas creadas', archivos == ['index.html', 'servicios.html', 'galeria.html', 'contacto.html'], archivos)
    marco = lambda: page.evaluate_handle('editor.Canvas.getFrameEl()').as_element().content_frame()
    bg = E("getComputedStyle(editor.Canvas.getDocument().querySelector('footer.pie')).backgroundImage")
    check('fondo SVG del pie válido (bug de paréntesis)', bg.startswith('url('), bg[:60])

    print('\n3. Enlace a OTRA PÁGINA con «Ir a»')
    E("""(() => { const l = buscarComp(editor.getWrapper(), c => tagDe(c)==='a' && tieneClase(c,'nav-link') && /Nosotros/.test(c.getEl().textContent))[0];
         window.__link = l; editor.select(l); })()""")
    page.wait_for_timeout(300)
    check('pestaña Propiedades abierta al elegir un enlace', E("document.querySelector('[data-pane=traits]').classList.contains('active')"))
    opciones = E("""[...[...document.querySelectorAll('#traits .gjs-trt-trait')].find(t => /Ir a/.test(t.textContent)).querySelectorAll('option')].map(o => o.value)""")
    check('«Ir a» lista las 4 páginas', all(a in opciones for a in archivos), opciones)
    check('«Ir a» lista secciones (#intro)', '#intro' in opciones, opciones)
    E("""(() => { const s = [...document.querySelectorAll('#traits .gjs-trt-trait')].find(t => /Ir a/.test(t.textContent)).querySelector('select');
         s.value = 'contacto.html'; s.dispatchEvent(new Event('change', {bubbles:true})); })()""")
    page.wait_for_timeout(300)
    check('href actualizado a contacto.html', E("__link.getAttributes().href") == 'contacto.html', E("__link.getAttributes().href"))

    print('\n4. Vista previa: el enlace navega a la otra página')
    page.keyboard.press('Control+p')
    page.wait_for_timeout(500)
    check('Ctrl+P activa la vista previa', E("document.body.classList.contains('is-preview')"))
    check('botón «Volver a editar» visible', page.locator('#preview-exit').is_visible())
    marco().locator('a.nav-link', has_text='Nosotros').first.click()
    page.wait_for_timeout(2500)
    check('clic llevó a contacto.html', E("archivoDePagina(editor.Pages.getSelected())") == 'contacto.html', E("archivoDePagina(editor.Pages.getSelected())"))
    page.wait_for_timeout(800)
    # enlace a index desde el menú de contacto (en el lienzo nuevo)
    E("""(() => { const d = editor.Canvas.getDocument(); const a = d.querySelector('a.navbar-brand'); a.click(); })()""")
    page.wait_for_timeout(2500)
    check('enlace de la marca vuelve a index.html', E("archivoDePagina(editor.Pages.getSelected())") == 'index.html', E("archivoDePagina(editor.Pages.getSelected())"))
    # ancla a una sección en la misma página
    y0 = E("editor.Canvas.getWindow().scrollY")
    E("editor.Canvas.getDocument().querySelector('a.scroll-hint').click()")
    page.wait_for_timeout(1500)
    check('ancla #intro desplaza la página', E("editor.Canvas.getWindow().scrollY") > y0 + 200, E("editor.Canvas.getWindow().scrollY"))
    # enlace externo
    E("editor.Canvas.getDocument().querySelector('a.whatsapp-flotante')") and None
    with ctx.expect_page(timeout=5000) as nueva:
        E("editor.Canvas.getDocument().querySelector('a.whatsapp-flotante').click()")
    check('enlace externo abre pestaña nueva', 'wa.me' in nueva.value.url or nueva.value is not None, nueva.value.url)
    nueva.value.close()
    page.keyboard.press('Escape')
    page.wait_for_timeout(500)
    check('Esc sale de la vista previa', not E("document.body.classList.contains('is-preview')"))

    print('\n5. Botón que va a otra página (data-ir-a)')
    E("""(() => { const b = editor.getWrapper().append('<button class="btn btn-primary">Ir</button>')[0]; window.__btn = b; editor.select(b); })()""")
    page.wait_for_timeout(300)
    E("""(() => { const s = [...document.querySelectorAll('#traits .gjs-trt-trait')].find(t => /Ir a/.test(t.textContent)).querySelector('select');
         s.value = 'galeria.html'; s.dispatchEvent(new Event('change', {bubbles:true})); })()""")
    check('botón con data-ir-a=galeria.html', E("__btn.getAttributes()['data-ir-a']") == 'galeria.html')
    page.keyboard.press('Control+p'); page.wait_for_timeout(400)
    E("editor.Canvas.getDocument().querySelector('[data-ir-a=\"galeria.html\"]').click()")
    page.wait_for_timeout(2500)
    check('el botón lleva a galeria.html en vista previa', E("archivoDePagina(editor.Pages.getSelected())") == 'galeria.html')
    page.keyboard.press('Escape'); page.wait_for_timeout(300)
    E("editor.Pages.select(editor.Pages.getAll()[0])"); page.wait_for_timeout(1500)

    print('\n6. Menú común a todas las páginas')
    E("propagar(ES_NAV, true, 'El menú')")
    navs = E("editor.Pages.getAll().map(p => buscarComp(p.getMainComponent(), ES_NAV).length)")
    check('cada página tiene exactamente 1 menú', navs == [1, 1, 1, 1], navs)
    activos = E("""editor.Pages.getAll().map(p => buscarComp(p.getMainComponent(), c => tieneClase(c,'nav-link') && tieneClase(c,'active')).map(c => c.getAttributes().href))""")
    check('enlace activo correcto en cada página', activos[1:3] == [['servicios.html'], ['galeria.html']] and set(activos[3]) == {'contacto.html'}, activos)
    E("propagar(ES_PIE, false, 'El pie')")
    pies = E("editor.Pages.getAll().map(p => buscarComp(p.getMainComponent(), ES_PIE).length)")
    check('cada página tiene exactamente 1 pie', pies == [1, 1, 1, 1], pies)

    print('\n7. Renombrar página actualiza los enlaces')
    E("window.prompt = () => 'Contáctanos'; renombrarPagina(editor.Pages.getAll()[3])")
    check('archivo nuevo contactanos.html', E("archivoDePagina(editor.Pages.getAll()[3])") == 'contactanos.html')
    viejos = E("editor.Pages.getAll().reduce((n,p) => n + buscarComp(p.getMainComponent(), c => (c.getAttributes().href||'').split('#')[0]==='contacto.html').length, 0)")
    check('no quedan enlaces a contacto.html', viejos == 0, viejos)
    E("window.prompt = () => 'Servicios'; renombrarPagina(editor.Pages.getAll()[2])")
    check('nombre repetido se evita (servicios-2.html)', E("archivoDePagina(editor.Pages.getAll()[2])") == 'servicios-2.html', E("archivoDePagina(editor.Pages.getAll()[2])"))
    E("window.prompt = () => 'Galería'; renombrarPagina(editor.Pages.getAll()[2])")

    print('\n8. Nueva página, duplicar y SEO')
    E("window.prompt = () => 'Blog'; document.querySelector('#add-page').click()")
    page.wait_for_timeout(1200)
    check('página blog.html creada y seleccionada', E("archivoDePagina(editor.Pages.getSelected())") == 'blog.html')
    check('hereda el menú', E("buscarComp(editor.getWrapper(), ES_NAV).length") == 1)
    E("duplicarPagina(editor.Pages.getSelected())"); page.wait_for_timeout(1000)
    check('duplicada como blog-copia.html', 'blog-copia.html' in E("editor.Pages.getAll().map(archivoDePagina)"), E("editor.Pages.getAll().map(archivoDePagina)"))
    E("ajustesPagina(editor.Pages.getAll()[0])")
    page.fill('#pg-tit', 'Inicio · Mi Sitio'); page.fill('#pg-desc', 'Descripción de prueba'); page.click('#pg-ok')
    check('SEO guardado en la página', E("editor.Pages.getAll()[0].get('seoTitulo')") == 'Inicio · Mi Sitio')
    E("editor.Pages.select(editor.Pages.getAll()[0])"); page.wait_for_timeout(1200)

    print('\n9. Bloques: __UID__ e id repetidos')
    E("""(() => { const b = editor.Blocks.get('accordion'); const c = editor.getWrapper().append(b.get('content'))[0];
         editor.trigger('block:drag:stop', c, b); window.__acc = c; })()""")
    html = E("__acc.toHTML()")
    check('acordeón sin __UID__', '__UID__' not in html and re.search(r'id="u[a-z0-9]{6}"', html) is not None)
    E("""(() => { const b = editor.Blocks.get('s-intro'); const c = editor.getWrapper().append(b.get('content'))[0];
         editor.trigger('block:drag:stop', c, b); window.__intro = c; })()""")
    check('id repetido "intro" renombrado a intro-2', E("__intro.getAttributes().id") == 'intro-2', E("__intro.getAttributes().id"))

    print('\n10. Identidad visual, etiquetas, duplicar, deshacer')
    page.click('[data-tab=sitio]')
    page.locator('.t-preset', has_text='Selva').click()
    check('tema aplicado al lienzo', '#0e6e66' in E("editor.Canvas.getDocument().getElementById('ed-tema').textContent"))
    n0 = E("__intro.parent().components().length")
    E("editor.select(__intro)"); page.keyboard.press('Control+d'); page.wait_for_timeout(300)
    check('Ctrl+D duplica el elemento', E("__intro.parent().components().length") == n0 + 1)
    E("editor.UndoManager.undo()"); page.wait_for_timeout(300)
    check('deshacer quita la copia', E("__intro.parent().components().length") == n0)
    E("(() => { editor.select(__intro); __intro.set('etiqueta-html', 'article'); })()"); page.wait_for_timeout(300)
    check('cambiar etiqueta section → article', E("editor.getSelected().get('tagName')") == 'article')

    print('\n11. Guardado automático y recarga')
    page.wait_for_timeout(1500)
    check('indicador dice Guardado', 'Guardado' in page.inner_text('#save-state'))
    page.reload()
    page.wait_for_function('(() => { try { return typeof editor !== "undefined" && editor.Pages && editor.Pages.getAll().length > 1; } catch (e) { return false; } })()', timeout=60000)
    page.wait_for_timeout(1500)
    check('tras recargar siguen las páginas', E("editor.Pages.getAll().map(archivoDePagina)") == ['index.html','servicios.html','galeria.html','contactanos.html','blog.html','blog-copia.html'], E("editor.Pages.getAll().map(archivoDePagina)"))
    check('tras recargar sigue el SEO', E("editor.Pages.getAll()[0].get('seoTitulo')") == 'Inicio · Mi Sitio')
    check('sin bienvenida si ya hay proyecto', not page.locator('.gjs-mdl-title', has_text='Bienvenido').is_visible())
    check('botón conserva su tipo propio tras recargar', E("buscarComp(editor.getWrapper(), c => (c.getAttributes()['data-ir-a']||'')==='galeria.html')[0].get('type')") in ('btn-text','btn-plain'))

    print('\n12. Exportar ZIP')
    with page.expect_download(timeout=60000) as dl:
        page.keyboard.press('Control+e')
    z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    nombres = z.namelist()
    for f in ['index.html','servicios.html','galeria.html','contactanos.html','blog.html','css/site.css','js/site.js','css/index.css']:
        check(f'ZIP contiene {f}', f in nombres)
    idx = z.read('index.html').decode()
    check('index.html tiene <title> SEO', '<title>Inicio · Mi Sitio</title>' in idx)
    check('index.html tiene meta description', 'name="description" content="Descripción de prueba"' in idx)
    check('index.html enlaza a contactanos.html', 'href="contactanos.html"' in idx)
    check('index.html sin __UID__', '__UID__' not in idx)
    # todos los enlaces internos .html apuntan a archivos existentes
    rotos = set()
    for f in [n for n in nombres if n.endswith('.html')]:
        for h in re.findall(r'(?:href|data-ir-a)="([^"#:]+\.html)', z.read(f).decode()):
            if h not in nombres: rotos.add(f'{f} -> {h}')
    check('ningún enlace interno roto', not rotos, rotos)
    check('tema exportado en site.css', '#0e6e66' in z.read('css/site.css').decode())

    print('\n13. Sitio exportado funcionando de verdad')
    import tempfile, os, pathlib
    d = tempfile.mkdtemp(); z.extractall(d)
    sp = ctx.new_page()
    sp.on('pageerror', lambda e: errores.append('SITIO: ' + str(e)))
    sp.goto(pathlib.Path(d, 'index.html').as_uri()); sp.wait_for_timeout(1500)
    check('sitio exportado: Bootstrap cargado', sp.evaluate("!!window.bootstrap"))
    sp.locator('a.nav-link', has_text='Nosotros').first.click(); sp.wait_for_load_state(); sp.wait_for_timeout(500)
    check('sitio exportado: menú lleva a contactanos.html', sp.url.endswith('contactanos.html'), sp.url)
    sp.goto(pathlib.Path(d, 'index.html').as_uri()); sp.wait_for_timeout(800)
    sp.locator('[data-ir-a="galeria.html"]').click(); sp.wait_for_timeout(800)
    check('sitio exportado: botón lleva a galeria.html', sp.url.endswith('galeria.html'), sp.url)

    print('\n14. Errores de JavaScript')
    reales = [e for e in errores if 'favicon' not in e and 'ERR_' not in e]
    check('sin errores de JavaScript', not reales, reales[:5])

    print(f'\nRESULTADO: {len(OK)} correctas, {len(FAIL)} fallidas')
    if FAIL: print('Fallidas:', *FAIL, sep='\n  - ')
    nav.close()
