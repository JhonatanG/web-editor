"""HTML semántico mientras se construye el sitio.
Requiere: pip install playwright, y servir la carpeta en http://127.0.0.1:8765"""
import io, re, zipfile
from playwright.sync_api import sync_playwright

OK, FAIL = [], []
def check(n, c, x=''):
    (OK if c else FAIL).append(n)
    print(('  OK   ' if c else '  FALLA ') + n + (f'  -> {x}' if x != '' and not c else ''))

LISTO = '(() => { try { return editor.Canvas.getDocument().body && editor.Pages.getAll().length > 0; } catch (e) { return false; } })()'

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1600, 'height': 900}, accept_downloads=True)
    pg = ctx.new_page()
    err = []
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.on('dialog', lambda d: d.accept())
    pg.goto('http://127.0.0.1:8765/index.html')
    pg.wait_for_function(LISTO, timeout=60000)
    pg.wait_for_timeout(1500)
    def E(js):
        return pg.evaluate(f'(() => {{ const r = ({js}); return (r && typeof r === "object" && !Array.isArray(r)) ? true : r; }})()')
    # Soltar un bloque como lo hace el usuario (lo coloca en la raíz de la página)
    def soltar(bid, html=None):
        if html:
            E(f"(() => {{ const c = editor.getWrapper().append({html!r})[0]; editor.trigger('block:drag:stop', c, null); }})()")
        else:
            E(f"(() => {{ const b = editor.Blocks.get('{bid}'); const c = editor.getWrapper().append(b.get('content'))[0]; editor.trigger('block:drag:stop', c, b); }})()")
        pg.wait_for_timeout(250)
    raiz = lambda: E("editor.getWrapper().components().models.filter(c => !(c.is('textnode') && !String(c.get('content')||'').trim())).map(c => tagDe(c) + (c.getClasses().length ? '.' + c.getClasses()[0] : ''))")

    E("editor.Modal.close()")
    E("(() => { editor.Pages.getAll().slice(1).forEach(p => editor.Pages.remove(p)); editor.Pages.select(editor.Pages.getAll()[0]); editor.setComponents(''); })()")
    pg.wait_for_timeout(500)

    print('1. Estructura automática al soltar bloques')
    soltar('section')
    check('una sección suelta va dentro de <main>', raiz() == ['main'], raiz())
    check('<main> lleva id="contenido"', E("buscarComp(editor.getWrapper(), c => tagDe(c) === 'main')[0].getAttributes().id") == 'contenido')
    soltar('s-nav')
    check('el menú va dentro de <header>, arriba', raiz()[:2] == ['header.sitio-cabecera', 'main'], raiz())
    check('el <nav> está dentro del <header>', E("tagDe(buscarComp(editor.getWrapper(), ES_NAV)[0].parent())") == 'header')
    soltar('s-pie')
    soltar('paragraph')
    check('un párrafo soltado después del pie también va a <main>', raiz() == ['header.sitio-cabecera', 'main', 'footer.pie'], raiz())
    soltar('s-whatsapp')
    check('el botón flotante queda fuera, al final', raiz() == ['header.sitio-cabecera', 'main', 'footer.pie', 'a.whatsapp-flotante'], raiz())
    soltar('s-topbar')
    check('la barra superior también va al <header>', E("buscarComp(editor.getWrapper(), c => tieneClase(c, 'barra-superior'))[0].parent().getClasses().includes('sitio-cabecera')"))
    soltar('sec-main')
    check('un segundo <main> se convierte en <section>', E("buscarComp(editor.getWrapper(), c => tagDe(c) === 'main').length") == 1)

    print('2. Títulos sin saltos de nivel')
    E("editor.setComponents('')"); pg.wait_for_timeout(300)
    soltar('h1')
    soltar('h2')
    soltar('card')
    t = E("buscarComp(editor.getWrapper(), esTitulo).map(c => tagDe(c) + '/' + c.getClasses().join(' '))")
    check('la tarjeta (h5) bajo un h2 pasa a h3', t[-1].startswith('h3/'), t)
    check('…y conserva su tamaño (clase h5)', 'h5' in t[-1].split('/')[1], t)
    soltar('h1')
    t = E("buscarComp(editor.getWrapper(), esTitulo).map(c => tagDe(c) + '/' + c.getClasses().join(' '))")
    check('un segundo h1 pasa a h2 con aspecto de h1', t[-1] == 'h2/h1', t)
    check('sigue habiendo un solo h1', sum(1 for x in t if x.startswith('h1/')) == 1, t)

    print('3. Formularios, íconos e iframes')
    soltar('form-contact')
    pares = E("buscarComp(editor.getWrapper(), c => tagDe(c) === 'label').map(l => { const f = l.getAttributes().for; return !!f && buscarComp(editor.getWrapper(), c => c.getAttributes().id === f).length === 1; })")
    check('cada etiqueta del formulario está asociada a su campo', pares and all(pares), pares)
    soltar('', '<a href="#"><i class="bi bi-instagram"></i></a>')
    check('enlace con solo un ícono recibe aria-label', E("buscarComp(editor.getWrapper(), c => tagDe(c) === 'a' && !textoDe(c))[0].getAttributes()['aria-label']") == 'Instagram')
    soltar('map')
    check('el mapa recibe un title', bool(E("buscarComp(editor.getWrapper(), ES_IFRAME)[0].getAttributes().title")))

    print('4. Plantilla de sitio completo')
    E("abrirPlantillas()"); pg.locator('.gjs-mdl-content .plantilla[data-modo="completo"]').click(); pg.wait_for_timeout(2000)
    for i in range(4):
        r = E(f"editor.Pages.getAll()[{i}].getMainComponent().components().models.filter(c => !(c.is('textnode') && !String(c.get('content')||'').trim())).map(tagDe)")
        f = E(f"archivoDePagina(editor.Pages.getAll()[{i}])")
        check(f'{f}: header, main, footer en orden', r[:3] == ['header', 'main', 'footer'], r)
        probs = E(f"revisar(editor.Pages.getAll()[{i}].getMainComponent()).filter(x => x.nivel !== 'consejo').map(x => x.msg)")
        check(f'{f}: sin errores ni avisos semánticos', not probs, probs)
    pg.wait_for_timeout(1000)
    check('indicador «Semántica» en verde', pg.inner_text('#sem-count') == '✓', pg.inner_text('#sem-count'))

    print('5. Revisión y corrección de HTML desordenado')
    pg.click('[data-tab=sitio]'); pg.uncheck('#t-semantica')
    pg.click('#btn-import')
    pg.fill('.imp-ta', '<nav class="navbar"><a href="#">Inicio</a></nav><div><h3>Sin h1</h3><h5>salto</h5><img src="x.png"><input name="correo"></div><footer>pie</footer>')
    pg.click('.gjs-mdl-container .tb-btn.primary'); pg.wait_for_timeout(1200)
    check('sin automático, el HTML queda como se pegó', raiz()[0] == 'nav.navbar', raiz())
    check('el indicador avisa de problemas', pg.inner_text('#sem-count') not in ('', '✓'), pg.inner_text('#sem-count'))
    pg.click('#btn-semantica'); pg.wait_for_timeout(500)
    msgs = pg.locator('.gjs-mdl-content .sem-item').all_inner_texts()
    for clave in ['Falta <main>', 'header', 'h1', 'Salto', 'alt', 'etiqueta']:
        check(f'la revisión detecta: {clave}', any(clave in m for m in msgs), msgs)
    check('se muestra el esquema de la página', pg.locator('.gjs-mdl-content .sem-linea').count() >= 3)
    pg.click('#sem-todo'); pg.wait_for_timeout(800)
    check('tras «Corregir todo»: header, main, footer', raiz() == ['header.sitio-cabecera', 'main', 'footer'], raiz())
    t = E("buscarComp(editor.getWrapper(), esTitulo).map(tagDe)")
    check('tras «Corregir todo»: h1 y h2, sin saltos', t == ['h1', 'h2'], t)
    resto = pg.locator('.gjs-mdl-content .sem-item.error, .gjs-mdl-content .sem-item.aviso').all_inner_texts()
    check('solo queda lo que necesita una persona (el alt de la imagen)', len(resto) == 1 and 'alt' in resto[0], resto)
    E("editor.Modal.close()")
    pg.check('#t-semantica')

    print('6. «Nivel del título» en Propiedades')
    E("editor.select(buscarComp(editor.getWrapper(), c => tagDe(c) === 'h2')[0])"); pg.wait_for_timeout(300)
    E("(() => { const s = [...document.querySelectorAll('#traits .gjs-trt-trait')].find(t => /Nivel del título/.test(t.textContent)).querySelector('select'); s.value = 'h3'; s.dispatchEvent(new Event('change', { bubbles: true })); })()")
    pg.wait_for_timeout(300)
    check('cambiar a H3 desde Propiedades', E("tagDe(editor.getSelected())") == 'h3')

    print('7. Capas con nombres de cada región')
    nombres = E("editor.getWrapper().components().map(c => c.getName())")
    check('Capas nombra las regiones: Encabezado, Contenido principal, Pie', nombres[:3] == ['Encabezado', 'Contenido principal', 'Pie'], nombres)

    print('8. Exportación')
    E("abrirPlantillas()"); pg.locator('.gjs-mdl-content .plantilla[data-modo="completo"]').click(); pg.wait_for_timeout(2000)
    with pg.expect_download(timeout=60000) as dl:
        E("exportarZip()")
    z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    for f in ['index.html', 'servicios.html', 'galeria.html', 'contacto.html']:
        h = z.read(f).decode()
        pos = [h.find('<header'), h.find('<main'), h.find('<footer')]
        check(f'{f}: <header> < <main> < <footer>', -1 not in pos and pos == sorted(pos), pos)
        m = re.search(r'<main\b[^>]*\bid="([^"]+)"', h)
        check(f'{f}: «Saltar al contenido» apunta a su <main>', bool(m) and f'href="#{m.group(1)}">Saltar al contenido' in h)
        check(f'{f}: un solo <h1>', len(re.findall(r'<h1\b', h)) == 1)

    print('9. Menú copiado a todas las páginas: la hamburguesa funciona en cada una')
    E("(() => { editor.Pages.select(editor.Pages.getAll()[0]); propagar(ES_NAV, true, 'El menú'); return 1; })()"); pg.wait_for_timeout(800)
    E("duplicarPagina(editor.Pages.getAll()[1])"); pg.wait_for_timeout(800)
    refs = E("""editor.Pages.getAll().map(p => { const r = p.getMainComponent(); const t = buscarComp(r, c => tieneClase(c,'navbar-toggler'))[0]; const col = buscarComp(r, c => tieneClase(c,'navbar-collapse'))[0]; return t.getAttributes()['data-bs-target'] === '#' + col.getAttributes().id; })""")
    check('en todas las páginas la hamburguesa apunta a su menú', all(refs), refs)
    with pg.expect_download(timeout=60000) as dl:
        E("exportarZip()")
    import tempfile, pathlib
    d = tempfile.mkdtemp(); zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read())).extractall(d)
    movil = ctx.new_page(); movil.set_viewport_size({'width': 390, 'height': 800})
    for f in ['index.html', 'servicios.html', 'galeria.html', 'contacto.html', 'servicios-copia.html']:
        movil.goto(pathlib.Path(d, f).as_uri()); movil.wait_for_timeout(700)
        movil.locator('.navbar-toggler').first.click(); movil.wait_for_timeout(700)
        check(f'sitio exportado en móvil: el menú se abre en {f}', movil.evaluate("document.querySelector('.navbar-collapse').classList.contains('show')"))

    check('sin errores de JavaScript', not err, err[:5])
    print(f'\nRESULTADO: {len(OK)} correctas, {len(FAIL)} fallidas')
    b.close()
