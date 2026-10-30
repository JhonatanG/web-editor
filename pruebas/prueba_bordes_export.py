"""Colores con borde inferior en menús (subrayado del enlace activo, clases border-*,
pestañas) y exportación fiel: lo que se ve en el editor es lo que sale en el ZIP,
imágenes incluidas.
Requiere: pip install playwright, y servir la carpeta en http://127.0.0.1:8765"""
import io, pathlib, struct, tempfile, zipfile, zlib, re
from playwright.sync_api import sync_playwright

OK, FAIL = [], []
def check(n, c, x=''):
    (OK if c else FAIL).append(n)
    print(('  OK   ' if c else '  FALLA ') + n + (f'  -> {x}' if x != '' and not c else ''))

def png(w, h, rgb):
    fila = b'\x00' + bytes(rgb) * w
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + \
        chunk(b'IDAT', zlib.compress(fila * h)) + chunk(b'IEND', b'')

AQUI = pathlib.Path(__file__).parent
tmp = pathlib.Path(tempfile.mkdtemp())
LOGO = tmp / 'Logo UPEC.png';  LOGO.write_bytes(png(434, 460, (30, 30, 30)))
FONDO = tmp / 'Fondo.png';     FONDO.write_bytes(png(80, 40, (40, 90, 200)))
EXTERNA = AQUI / 'recurso-externo.png'; EXTERNA.write_bytes(png(10, 10, (0, 160, 0)))
URL_EXT = 'http://127.0.0.1:8765/pruebas/recurso-externo.png'
LISTO = '(() => { try { return editor.Canvas.getDocument().body && editor.Pages.getAll().length > 0; } catch (e) { return false; } })()'
ROJO, VERDE, AZUL, ROSA = 'rgb(220, 53, 69)', 'rgb(0, 170, 85)', 'rgb(13, 110, 253)', 'rgb(232, 62, 140)'

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    # Ventana ancha: el lienzo de escritorio queda sin escala y el sitio exportado se abre a su mismo ancho
    ctx = b.new_context(viewport={'width': 1920, 'height': 1000}, accept_downloads=True)
    pg = ctx.new_page()
    err = []
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.on('dialog', lambda d: d.accept())
    pg.goto('http://127.0.0.1:8765/index.html')
    pg.wait_for_function(LISTO, timeout=60000)
    pg.wait_for_timeout(1500)
    def E(js):
        return pg.evaluate(f'(() => {{ const r = ({js}); return (r && typeof r === "object" && !Array.isArray(r)) ? true : r; }})()')
    def V(js, en=None):   # devuelve el valor tal cual (listas y objetos simples)
        return (en or pg).evaluate(f'(() => {{ {js} }})()')
    def elegir(boton, archivo):
        with pg.expect_file_chooser() as fc:
            pg.click(boton)
        fc.value.set_files(str(archivo))
        pg.wait_for_timeout(600)
    def sel(cond):
        E(f"editor.select(buscarComp(editor.getWrapper(), c => {cond})[0])"); pg.wait_for_timeout(300)
    def prop(sector, nombre, valor, sub=None):
        """Cambia un valor del panel «Estilos» escribiendo en su campo, como lo haría la persona."""
        pg.click('[data-tab=style]')
        clase = f'.gjs-sm-property__{nombre} .gjs-sm-property__{sub}' if sub else f'.gjs-sm-property__{nombre}'
        sector_el = pg.locator(f'.gjs-sm-sector__{sector}')
        if 'gjs-sm-open' not in (sector_el.get_attribute('class') or ''):
            sector_el.locator('.gjs-sm-sector-title').click()
        campo = pg.locator(f'{clase} input').first
        campo.scroll_into_view_if_needed()
        campo.fill(valor); campo.press('Enter'); pg.wait_for_timeout(300)
    def est(js_el):
        return V(f"const e = {js_el}, s = getComputedStyle(e); return {{ color: s.color, bb: s.borderBottomColor, bbw: s.borderBottomWidth, btw: s.borderTopWidth, blw: s.borderLeftWidth, btc: s.borderTopColor, h: Math.round(e.getBoundingClientRect().height) }}")
    selEl = "editor.getSelected().getEl()"

    E("editor.Modal.close()")
    E("(() => { editor.Pages.getAll().slice(1).forEach(p => editor.Pages.remove(p)); editor.setComponents(''); editor.Assets.getAll().reset(); })()")
    pg.wait_for_timeout(300)
    # Plantilla de sitio completo: el menú transparente con subrayado en el enlace activo
    pg.click('#btn-templates'); pg.wait_for_timeout(400)
    pg.locator('.gjs-mdl-content .plantilla[data-modo="completo"]').click()
    pg.wait_for_timeout(1800)
    check('plantilla de sitio completo cargada', E("editor.Pages.getAll().length") >= 4, E("editor.Pages.getAll().length"))
    ANCHO = E("editor.Canvas.getWindow().innerWidth")
    check('lienzo de escritorio sin escala (1280 px o más)', ANCHO >= 1280 and E("editor.Canvas.getZoom()") == 100, [E("editor.Canvas.getWindow().innerWidth"), E("editor.Canvas.getZoom()")])

    print('1. Subrayado del enlace activo del menú')
    activo = "buscarComp(editor.getWrapper(), c => tieneClase(c, 'nav-link') && tieneClase(c, 'active'))[0]"
    otro = "buscarComp(editor.getWrapper(), c => tieneClase(c, 'nav-link') && !tieneClase(c, 'active'))[0].getEl()"
    a0 = est(f"{activo}.getEl()")
    check('el activo tiene subrayado de 2 px con el color de acento', a0['bbw'] == '2px' and a0['bb'] == 'rgb(245, 159, 0)', a0)
    check('el subrayado no mueve el menú (activo e inactivo miden igual)', a0['h'] == est(otro)['h'], [a0['h'], est(otro)['h']])
    E(f"editor.select({activo})"); pg.wait_for_timeout(300)
    prop('decorations', 'border', '#e83e8c', sub='border-color')
    a1 = est(selEl)
    check('cambiar «Borde → Color» cambia el color del subrayado', a1['bb'] == ROSA, a1)
    check('…y sigue siendo solo abajo (no aparece borde arriba)', a1['btw'] == '0px' and a1['bbw'] == '2px', a1)
    prop('typography', 'color', '#00aa55')
    a2 = est(selEl)
    check('cambiar el color del texto del activo funciona', a2['color'] == VERDE, a2)
    check('…sin perder el color del subrayado', a2['bb'] == ROSA, a2)
    check('el estilo queda en el elemento (no en .nav-link, que cambiaría todos)', 'border-color' in E("JSON.stringify(editor.getSelected().getStyle())"))
    check('los demás enlaces no cambian', est(otro)['color'] != VERDE)

    print('2. Elemento con la clase border-bottom (Bootstrap)')
    E("(() => { const m = buscarComp(editor.getWrapper(), c => tagDe(c) === 'main')[0] || editor.getWrapper(); m.append('<h2 class=\"border-bottom border-3 pb-2\">Título con línea</h2>', { at: 0 }); return 1; })()")
    pg.wait_for_timeout(300)
    sel("tieneClase(c, 'border-bottom') && tagDe(c) === 'h2'")
    h0 = est(selEl)
    prop('decorations', 'border', '#dc3545', sub='border-color')
    h1 = est(selEl)
    check('el color del borde inferior cambia (antes lo bloqueaba el !important)', h1['bb'] == ROJO, [h0['bb'], h1['bb']])
    check('no aparecen bordes en los otros lados', h1['btw'] == '0px' and h1['blw'] == '0px', h1)
    prop('decorations', 'border', '6px', sub='border-width')
    h2 = est(selEl)
    check('cambiar el grosor también funciona', h2['bbw'] == '6px', h2)
    check('…y se quita la clase border-3 que lo impedía', 'border-3' not in E("editor.getSelected().getClasses().join(' ')"))
    check('…sigue siendo solo abajo y del mismo color', h2['btw'] == '0px' and h2['bb'] == ROJO, h2)

    print('3. Pestañas (borde de la pestaña activa)')
    E("(() => { const b = editor.Blocks.get('nav-tabs'); const m = buscarComp(editor.getWrapper(), c => tagDe(c) === 'main')[0] || editor.getWrapper(); const c = m.append(b.get('content'), { at: 1 })[0]; editor.trigger('block:drag:stop', c, b); return 1; })()")
    pg.wait_for_timeout(400)
    sel("tieneClase(c, 'nav-link') && tieneClase(c, 'active') && tieneClase(c.parent().parent(), 'nav-tabs')")
    t0 = est(selEl)
    prop('decorations', 'border', '#0d6efd', sub='border-color')
    t1 = est(selEl)
    check('elegir solo el color no borra los bordes de la pestaña', t1['btw'] == t0['btw'] == '1px', [t0, t1])
    check('el borde de la pestaña cambia de color', t1['btc'] == AZUL, t1)
    check('no se escribe «border: 0 solid» en el CSS', not re.search(r'border:\s*0 solid', E("editor.getCss()")))

    print('4. Clase de color de borde + color del panel')
    E("(() => { const m = buscarComp(editor.getWrapper(), c => tagDe(c) === 'main')[0] || editor.getWrapper(); m.append('<div class=\"border border-primary p-3\">Caja</div>', { at: 2 }); return 1; })()")
    pg.wait_for_timeout(300)
    sel("tieneClase(c, 'border-primary')")
    prop('decorations', 'border', '#dc3545', sub='border-color')
    check('se quita border-primary y gana el color elegido', est(selEl)['btc'] == ROJO and 'border-primary' not in E("editor.getSelected().getClasses().join(' ')"))

    print('5. Imágenes: logo en el menú, fondo subido y una imagen por URL')
    E("(() => { const nav = buscarComp(editor.getWrapper(), c => tieneClase(c, 'navbar-brand'))[0]; nav.append({ type: 'image', attributes: { class: 'img-fluid' } }); return 1; })()")
    pg.wait_for_timeout(300)
    sel("c.is('image') && tieneClase(c.parent(), 'navbar-brand')")
    pg.click('[data-tab=traits]'); pg.wait_for_timeout(200)
    elegir('#img-subir', LOGO)
    prop('dimension', 'height', '60px')
    check('el logo subido se ve en el lienzo', E(f"{selEl}.naturalWidth") == 434)
    sel("tagDe(c) === 'section'")
    elegir('#bg-subir', FONDO)
    check('la sección muestra el fondo subido', E(f"getComputedStyle({selEl}).backgroundImage.startsWith('url(\"data:image/png')"))
    E("(() => { const m = buscarComp(editor.getWrapper(), c => tagDe(c) === 'main')[0] || editor.getWrapper(); m.append({ type: 'image', attributes: { src: '" + URL_EXT + "', class: 'img-fluid' } }, { at: 3 }); return 1; })()")
    pg.wait_for_timeout(600)

    # Medidas y colores en el editor de cada página, para compararlos con el sitio exportado
    def medir(win):
        return f"""const d = {win}.document;
          const imgs = [...d.images].filter(i => i.getBoundingClientRect().width > 0).map(i => ({{ id: i.id, ok: i.complete && i.naturalWidth > 0, w: i.offsetWidth, h: i.offsetHeight }}));   // sin la escala de las animaciones de aparición
          const est = [...d.querySelectorAll('[id]')].filter(e => /^i[a-z0-9]{{3,}}$/.test(e.id)).map(e => {{ const s = getComputedStyle(e); return [e.id, s.color, s.borderBottomColor, s.borderBottomWidth, s.borderTopWidth, s.backgroundColor]; }});
          const fondos = [...d.querySelectorAll('*')].map(e => getComputedStyle(e).backgroundImage).filter(v => v.includes('url(') && !v.includes('data:image/svg+xml,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 30 30'));
          return {{ imgs, est, fondos: fondos.length }};"""
    paginas = V("return editor.Pages.getAll().map(archivoDePagina)")
    enEditor = {}
    E("editor.select(null)")
    for i, f in enumerate(paginas):
        E(f"editor.Pages.select(editor.Pages.getAll()[{i}])")
        pg.wait_for_function(LISTO, timeout=30000); pg.wait_for_timeout(1500)
        enEditor[f] = V(medir('editor.Canvas.getWindow()'))
    E("editor.Pages.select(editor.Pages.getAll()[0])"); pg.wait_for_timeout(1200)
    check('en el editor todas las imágenes cargan', all(im['ok'] for m in enEditor.values() for im in m['imgs']),
          [(f, im) for f, m in enEditor.items() for im in m['imgs'] if not im['ok']][:5])

    print('6. Exportar ZIP')
    if not E("document.querySelector('#t-assets-ext').checked"): E("document.querySelector('#t-assets-ext').click()")
    with pg.expect_download(timeout=90000) as dl:
        pg.click('#btn-export')
    z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    nombres = z.namelist()
    check('el logo sale a assets con su nombre', 'assets/logo-upec.png' in nombres, [n for n in nombres if n.startswith('assets/')][:6])
    check('el logo exportado es idéntico al subido', 'assets/logo-upec.png' in nombres and z.read('assets/logo-upec.png') == LOGO.read_bytes())
    check('la imagen por URL se descarga a assets', 'assets/recurso-externo.png' in nombres)
    textos = {n: z.read(n).decode('utf-8') for n in nombres if n.endswith('.html') or (n.endswith('.css') and n != 'css/site.css' and 'bootstrap' not in n)}
    check('no queda ningún archivo incrustado (data:) en HTML ni CSS', not any('data:image/png' in t or 'data:video' in t for t in textos.values()))
    rotos = set()
    for n, t in textos.items():
        base = '' if n.endswith('.html') else 'css/'
        for r in re.findall(r'(?:src|poster)="([^"]+)"|url\(\s*["\']?([^"\')]+)', t):
            ruta = r[0] or r[1]
            if ruta.startswith(('http', 'data:', '#')): continue
            real = str(pathlib.PurePosixPath(base + ruta)).replace('css/../', '')
            if real not in nombres: rotos.add(f'{n} -> {ruta}')
    check('cada ruta a assets/ del HTML y del CSS existe en el ZIP', not rotos, sorted(rotos)[:6])
    site_css = z.read('css/site.css').decode()
    check('site.css lleva el subrayado como borde inferior', 'nav-link.active{border-bottom-color:var(--sitio-acento)}' in site_css)

    print('7. El sitio exportado se ve igual que el editor')
    d = pathlib.Path(tempfile.mkdtemp()); z.extractall(d)
    sp = ctx.new_page(); sp.set_viewport_size({'width': ANCHO, 'height': 1000})   # mismo ancho que el lienzo
    fallos = []
    sp.on('requestfailed', lambda r: r.url.startswith('file:') and fallos.append(r.url))
    sp.on('pageerror', lambda e: err.append('SITIO: ' + str(e)))
    for f in paginas:
        sp.goto((d / f).as_uri()); sp.wait_for_timeout(1500)
        m = V(medir('window'), sp)
        ed = enEditor[f]
        check(f'{f}: todas las imágenes cargan', all(im['ok'] for im in m['imgs']), [im for im in m['imgs'] if not im['ok']][:4])
        check(f'{f}: mismas imágenes visibles que en el editor', len(m['imgs']) == len(ed['imgs']), [len(ed['imgs']), len(m['imgs'])])
        dif = [(a, c) for a, c in zip(ed['imgs'], m['imgs']) if abs(a['w'] - c['w']) > 2 or (a['id'] and a['id'] == c['id'] and abs(a['h'] - c['h']) > 2)]
        check(f'{f}: las imágenes miden lo mismo que en el editor', not dif, dif[:3])
        check(f'{f}: mismos fondos con imagen', m['fondos'] == ed['fondos'], [ed['fondos'], m['fondos']])
        ed_est = {x[0]: x for x in ed['est']}
        dif = [(ed_est[x[0]], x) for x in m['est'] if x[0] in ed_est and ed_est[x[0]] != x]
        check(f'{f}: colores y bordes iguales al editor', not dif, dif[:3])
    sp.goto((d / 'index.html').as_uri()); sp.wait_for_timeout(1200)
    a = V("const e = document.querySelector('.nav-transparente .nav-link.active'), s = getComputedStyle(e); return [s.color, s.borderBottomColor, s.borderTopWidth]", sp)
    check('sitio exportado: enlace activo con texto verde y subrayado rosa', a == [VERDE, ROSA, '0px'], a)
    h = V("const s = getComputedStyle(document.querySelector('h2.border-bottom')); return [s.borderBottomColor, s.borderBottomWidth, s.borderTopWidth]", sp)
    check('sitio exportado: título con línea roja de 6 px solo abajo', h == [ROJO, '6px', '0px'], h)
    logo = V("const i = document.querySelector('.navbar-brand img'); return i ? [i.getAttribute('src'), i.naturalWidth, Math.round(i.getBoundingClientRect().height)] : null", sp)
    check('sitio exportado: el logo carga desde assets a 60 px de alto', logo == ['assets/logo-upec.png', 434, 60], logo)
    check('sitio exportado: ningún archivo local falló al cargar', not fallos, fallos[:5])

    print('8. Menú en móvil (exportado)')
    sm = ctx.new_page(); sm.set_viewport_size({'width': 390, 'height': 800})
    sm.goto((d / 'index.html').as_uri()); sm.wait_for_timeout(1000)
    sm.click('.navbar-toggler'); sm.wait_for_timeout(700)
    mv = sm.evaluate("(() => { const s = getComputedStyle(document.querySelector('.nav-link.active')); return [s.color, s.borderBottomWidth]; })()")
    check('móvil: el menú se abre y el activo conserva su color de texto', mv[0] == VERDE, mv)
    check('móvil: el logo carga', sm.evaluate("document.querySelector('.navbar-brand img').naturalWidth") == 434)

    check('sin errores de JavaScript', not err, err[:5])
    EXTERNA.unlink(missing_ok=True)
    print(f'\nRESULTADO: {len(OK)} correctas, {len(FAIL)} fallidas')
    if FAIL: print('Fallidas:', *FAIL, sep='\n  - ')
    b.close()
