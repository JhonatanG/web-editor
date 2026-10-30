"""Construye desde cero un sitio turístico personalizado de 3 páginas («Laguna Quilotoa»)
usando el editor como lo haría una persona, y comprueba que el sitio exportado
funciona: menú, enlaces entre páginas, galerías con ampliación, carrusel,
acordeón, formulario, mapa, WhatsApp, diseño móvil, SEO y trabajo sin conexión.
Usa fotos reales de Wikimedia Commons: unas se suben desde el computador y otras
se enlazan por URL (y al exportar se descargan a assets).
Al terminar deja en Descargas quilotoa.json (el proyecto) y quilotoa-sitio.zip.
Requiere: pip install playwright, internet, y servir la carpeta en http://127.0.0.1:8765"""
import io, pathlib, re, tempfile, time, urllib.error, urllib.request, zipfile
from playwright.sync_api import sync_playwright

OK, FAIL = [], []
def check(n, c, x=''):
    (OK if c else FAIL).append(n)
    print(('  OK   ' if c else '  FALLA ') + n + (f'  -> {x}' if x != '' and not c else ''))

# Fotos libres de Wikimedia Commons (1280 px): nombre con que se sube, URL, autor y licencia
W = 'https://upload.wikimedia.org/wikipedia/commons/'
FOTOS_WEB = {
    'lago':      ('Lago Quilotoa.jpg', W + 'thumb/4/41/Lago_Quilotoa.JPG/1280px-Lago_Quilotoa.JPG', 'Gjadan', 'CC BY-SA 4.0'),
    'kayak':     ('Kayak en el Quilotoa.jpg', W + 'thumb/3/32/Kayak_en_el_Quilotoa.jpg/1280px-Kayak_en_el_Quilotoa.jpg', 'TupakAmaruIshkay', 'CC BY-SA 4.0'),
    'camping':   ('Acampando en la laguna.jpg', W + 'thumb/c/c5/Acampando_en_la_laguna_Quilotoa.jpg/1280px-Acampando_en_la_laguna_Quilotoa.jpg', 'TupakAmaruIshkay', 'CC BY-SA 4.0'),
    'caldera':   ('Caldera del Quilotoa.jpg', W + 'thumb/6/65/Caldera_Quilotoa.jpg/1280px-Caldera_Quilotoa.jpg', 'Gideoraielgave', 'CC BY-SA 4.0'),
    'nubes':     ('Nubes sobre el Quilotoa.jpg', W + 'thumb/1/13/Cloudsoverquilotoa.jpg/1280px-Cloudsoverquilotoa.jpg', 'Creationlaw', 'CC BY-SA 3.0'),
    'mirador':   ('El Quilotoa desde el mirador.jpg', W + 'thumb/c/c7/El_Quilotoa.JPG/1280px-El_Quilotoa.JPG', 'Gjadan', 'CC BY-SA 4.0'),
    'fumarolas': ('Fumarolas en la laguna.jpg', W + 'thumb/f/fc/Fumarolas_en_la_Laguna_del_Quilotoa_-_panoramio.jpg/1280px-Fumarolas_en_la_Laguna_del_Quilotoa_-_panoramio.jpg', 'Ciencia1.com', 'CC BY-SA 3.0'),
    'caballo':   ('Caballo junto a la laguna.jpg', W + '5/53/Horse%2C_Laguna%2C_Quilatoa_%289297497972%29.jpg', 'Rinaldo Wurglitsch', 'CC BY 2.0'),
    'iliniza':   ('El Iliniza desde el Quilotoa.jpg', W + 'thumb/b/bb/Iliniza_von_Quilotoa.JPG/1280px-Iliniza_von_Quilotoa.JPG', 'Kryptonit', 'dominio público'),
    'pano10':    ('Laguna panoramica 1.jpg', W + 'thumb/b/be/Laguna_de_Quilotoa_-_Equador_-_panoramio_%2810%29.jpg/1280px-Laguna_de_Quilotoa_-_Equador_-_panoramio_%2810%29.jpg', 'Paulo JC Nogueira', 'CC BY-SA 3.0'),
    'pano11':    ('Laguna panoramica 2.jpg', W + 'thumb/1/1b/Laguna_de_Quilotoa_-_Equador_-_panoramio_%2811%29.jpg/1280px-Laguna_de_Quilotoa_-_Equador_-_panoramio_%2811%29.jpg', 'Paulo JC Nogueira', 'CC BY-SA 3.0'),
    'pano13':    ('Laguna panoramica 3.jpg', W + 'thumb/e/e6/Laguna_de_Quilotoa_-_Equador_-_panoramio_%2813%29.jpg/1280px-Laguna_de_Quilotoa_-_Equador_-_panoramio_%2813%29.jpg', 'Paulo JC Nogueira', 'CC BY-SA 3.0'),
    'amalavida': ('Laguna del Quilotoa.jpg', W + 'thumb/e/e2/Ama_la_Vida_-_Flickr_-_Laguna_del_Quilotoa_%288226329287%29.jpg/1280px-Ama_la_Vida_-_Flickr_-_Laguna_del_Quilotoa_%288226329287%29.jpg', 'amalavida.tv', 'CC BY-SA 2.0'),
    'caldera2':  ('Caldera del Quilotoa 2.jpg', W + 'thumb/0/0c/Caldera_Quilotoa_II.jpg/1280px-Caldera_Quilotoa_II.jpg', 'Gideoraielgave', 'CC BY-SA 4.0'),
}
tmp = pathlib.Path(tempfile.mkdtemp())
def bajar(clave):
    """Las fotos que se «suben desde el computador» primero se descargan a una carpeta temporal."""
    nombre, url = FOTOS_WEB[clave][:2]
    f = tmp / nombre
    req = urllib.request.Request(url, headers={'User-Agent': 'editor-web-pruebas/1.0 (prueba educativa)'})
    for intento in range(6):           # Wikimedia responde 429 si se piden muchas seguidas
        try:
            f.write_bytes(urllib.request.urlopen(req, timeout=60).read())
            time.sleep(1.5)
            return f
        except urllib.error.HTTPError as e:
            if e.code != 429 or intento == 5: raise
            time.sleep(5 * (intento + 1))
URL = lambda clave: FOTOS_WEB[clave][1]
KAYAK = bajar('kayak')
FOTOS = [bajar(k) for k in ('camping', 'caldera', 'nubes', 'mirador', 'fumarolas', 'caballo')]   # galería de inicio
LISTO = '(() => { try { return editor.Canvas.getDocument().body && editor.Pages.getAll().length > 0; } catch (e) { return false; } })()'
PRIMARIO, OSCURO, ACENTO = '#1b7f5f', '#0f2e26', '#f2a541'
FAMILIA = 'Laguna Quilotoa'

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1920, 'height': 1000}, accept_downloads=True)
    pg = ctx.new_page()
    err = []
    pg.on('pageerror', lambda e: err.append(str(e)))
    respuestas = []          # lo que se escribe en los prompt() (nombre de página nueva…)
    pg.on('dialog', lambda d: d.accept(respuestas.pop(0)) if d.type == 'prompt' and respuestas else d.accept())
    pg.goto('http://127.0.0.1:8765/index.html')
    pg.wait_for_function(LISTO, timeout=60000)
    pg.wait_for_timeout(1500)

    def E(js):
        return pg.evaluate(f'(() => {{ const r = ({js}); return (r && typeof r === "object" && !Array.isArray(r)) ? true : r; }})()')
    def V(js, en=None):
        return (en or pg).evaluate(f'(() => {{ {js} }})()')
    def comp(cond, i=0):
        return f"buscarComp(editor.getWrapper(), c => {cond})[{i}]"
    def sel(cond, i=0):
        E(f"editor.select({comp(cond, i)})"); pg.wait_for_timeout(250)
    def soltar(bid, dentro=None, at=None):
        """Suelta un bloque como lo hace el arrastre (con su evento, que ordena header/main/footer)."""
        destino = comp(dentro) if dentro else 'editor.getWrapper()'
        pos = '' if at is None else f', {{ at: {at} }}'
        E(f"(() => {{ const b = editor.Blocks.get('{bid}'); const c = ({destino}).append(b.get('content'){pos})[0]; editor.trigger('block:drag:stop', c, b); return 1; }})()")
        pg.wait_for_timeout(350)
    def elegir(boton, archivo):
        with pg.expect_file_chooser() as fc:
            pg.click(boton)
        fc.value.set_files(str(archivo))
        pg.wait_for_timeout(500)
    def escribir(cond, texto, i=0):
        """Doble clic en el lienzo, seleccionar todo y teclear: la edición real de texto."""
        sel(cond, i)
        # «instant»: Bootstrap desplaza suave y el clic caería a mitad del desplazamiento
        E(f"{comp(cond, i)}.getEl().scrollIntoView({{ block: 'center', behavior: 'instant' }})"); pg.wait_for_timeout(250)
        x, y = V(f"const r = {comp(cond, i)}.getEl().getBoundingClientRect(), f = editor.Canvas.getFrameEl().getBoundingClientRect(), z = editor.Canvas.getZoom() / 100; return [f.left + (r.left + Math.min(r.width / 2, 40)) * z, f.top + (r.top + r.height / 2) * z]")
        pg.mouse.dblclick(x, y); pg.wait_for_timeout(300)
        pg.keyboard.press('Control+A'); pg.keyboard.type(texto); pg.wait_for_timeout(150)
        # Terminar como una persona: clic fuera del texto (así se cierra la barra de formato)
        pg.click('#bp-info', force=True); pg.wait_for_timeout(200)
        E("editor.select(null)"); pg.wait_for_timeout(200)
        return E(f"{comp(cond, i)}.getEl().textContent.trim()")
    def trait(nombre, valor):
        pg.click('[data-tab=traits]')
        t = pg.locator('#traits .gjs-trt-trait').filter(has=pg.locator('.gjs-label', has_text=re.compile('^' + re.escape(nombre) + '$', re.I))).first
        if not t.count(): print('    propiedades:', pg.locator('#traits .gjs-trt-trait .gjs-label').all_inner_texts())
        inp = t.locator('select, input').first
        if inp.evaluate('e => e.tagName') == 'SELECT': inp.select_option(valor)
        else: inp.fill(valor); inp.press('Enter')
        pg.wait_for_timeout(300)
    def estilo(sector, nombre, valor):
        pg.click('[data-tab=style]')
        s = pg.locator(f'.gjs-sm-sector__{sector}')
        if 'gjs-sm-open' not in (s.get_attribute('class') or ''): s.locator('.gjs-sm-sector-title').click()
        campo = pg.locator(f'.gjs-sm-property__{nombre} input').first
        campo.scroll_into_view_if_needed(); campo.fill(valor); campo.press('Enter'); pg.wait_for_timeout(300)
    def fondo(cond, clave, i=0):
        """Imagen de fondo por URL desde el recuadro «Fondo» del panel de estilos."""
        sel(cond, i); pg.click('[data-tab=style]'); pg.wait_for_timeout(150)
        pg.fill('#bg-url', URL(clave)); pg.click('#bg-apply'); pg.wait_for_timeout(400)
    def foto_url(cond, clave, alt, i=0):
        sel(cond, i); pg.click('[data-tab=traits]'); pg.wait_for_timeout(150)
        pg.fill('#img-url', URL(clave)); pg.click('#img-apply'); pg.wait_for_timeout(300)
        trait('Texto alternativo', alt)
    def textos(lista):
        malos = []
        for cond, i, texto in lista:
            if not E(f"!!{comp(cond, i)}"): malos.append('no encontrado: ' + cond); continue
            got = escribir(cond, texto, i)
            if got != texto: malos.append(f'{texto[:25]!r} -> {got[:60]!r}')
        return malos
    def ir_pagina(i):
        E(f"editor.Pages.select(editor.Pages.getAll()[{i}])")
        pg.wait_for_function(LISTO, timeout=30000); pg.wait_for_timeout(1200)

    print('1. Proyecto nuevo, vacío')
    E("editor.Modal.close()")
    pg.click('#btn-new'); pg.wait_for_timeout(400)
    pg.locator('.gjs-mdl-content .plantilla[data-modo="todo"]').click()
    pg.wait_for_function(LISTO, timeout=60000); pg.wait_for_timeout(1500)
    if E("editor.Modal.isOpen()"):
        pg.locator('.gjs-mdl-content .plantilla[data-modo="blanco"]').click(); pg.wait_for_timeout(500)
    E("(window.__dentro = (c, k) => { for (let x = c.parent(); x; x = x.parent()) if (tieneClase(x, k)) return true; return false; }, 1)")
    # __sec(c, pred): la <section>/<footer> que contiene a c cumple pred; __con(s, k): s tiene dentro algo con la clase k
    E("(window.__sec = (c, pred) => { let s = c; while (s && !['section', 'footer'].includes(tagDe(s))) s = s.parent(); return !!s && pred(s); }, window.__con = (s, k) => buscarComp(s, x => tieneClase(x, k)).length > 0, window.__id = (s, id) => (s.getAttributes().id || '') === id, 1)")
    check('empieza con una sola página vacía', E("editor.Pages.getAll().length") == 1 and E("editor.getWrapper().components().length") == 0)

    print('2. Identidad visual (pestaña «Sitio»)')
    pg.click('[data-tab=sitio]'); pg.wait_for_timeout(200)
    for campo, valor in (('#t-primario-x', PRIMARIO), ('#t-osc-x', OSCURO), ('#t-acento-x', ACENTO)):
        pg.fill(campo, valor); pg.press(campo, 'Enter'); pg.wait_for_timeout(150)
    pg.select_option('#t-titulos', label='Playfair Display') if pg.locator('#t-titulos option', has_text='Playfair Display').count() else None
    pg.locator('#t-radio').fill('8'); pg.wait_for_timeout(300)
    tema = E("temaCss()")
    check('los colores elegidos quedan en el tema', PRIMARIO in tema and OSCURO in tema and ACENTO in tema, tema[:200])
    check('el lienzo usa el color principal', E("getComputedStyle(editor.Canvas.getDocument().documentElement).getPropertyValue('--sitio-primario').trim()") == PRIMARIO, V("const d = editor.Canvas.getDocument(); return [getComputedStyle(d.documentElement).getPropertyValue('--sitio-primario'), [...d.querySelectorAll('#ed-tema')].map(x => x.textContent.slice(0, 40)), d.querySelectorAll('style').length]"))

    print('3. Página de inicio')
    for bid in ('s-nav', 's-hero-img', 's-intro', 's-destacados', 's-split-izq', 's-parallax', 's-testimonios', 's-galeria', 's-pie', 's-whatsapp'):
        soltar(bid)
    check('el menú queda dentro de <header>', E(f"tagDe({comp('tieneClase(c, \"nav-transparente\")')}.parent()) === 'header'"))
    check('el contenido queda dentro de <main>', E("buscarComp(editor.getWrapper(), c => tagDe(c) === 'main').length") == 1)
    check('el pie es <footer>', E("buscarComp(editor.getWrapper(), c => tagDe(c) === 'footer').length") == 1)
    t = escribir("tieneClase(c, 'navbar-brand')", FAMILIA)
    check('editar la marca del menú escribiendo', t == FAMILIA, t)
    t = escribir("tagDe(c) === 'h1'", 'Descubre el Quilotoa')
    check('editar el título del hero escribiendo', t == 'Descubre el Quilotoa', t)
    # Fondo del hero: una foto enlazada de internet
    sel("tieneClase(c, 'hero')")
    pg.click('[data-tab=style]'); pg.wait_for_timeout(200)
    pg.fill('#bg-url', URL('lago')); pg.click('#bg-apply'); pg.wait_for_timeout(1500)
    check('el hero muestra la foto de internet de fondo', 'Lago_Quilotoa' in E(f"getComputedStyle({comp('tieneClase(c, \"hero\")')}.getEl()).backgroundImage"))
    # Capa de color sobre la foto (oscurecer)
    if pg.is_visible('#ov-op'):
        pg.locator('#ov-op').fill('40'); pg.wait_for_timeout(300)
    # Imagen de la sección imagen + texto
    sel("c.is('image') && tieneClase(c, 'img-redondeada')")
    pg.click('[data-tab=traits]'); pg.wait_for_timeout(200)
    if E("!!(editor.getSelected() && editor.getSelected().is('image'))"):
        elegir('#img-subir', KAYAK)
        trait('Texto alternativo', 'Kayak en la laguna del Quilotoa')
    check('imagen de la sección cambiada por una foto subida', E("buscarComp(editor.getWrapper(), c => c.is('image') && (c.getAttributes().alt || '') === 'Kayak en la laguna del Quilotoa').length") == 1)
    # Galería de la portada: las 6 primeras fotos propias, con su texto alternativo
    imgs_gal = "buscarComp(editor.getWrapper(), c => c.is('image') && tieneClase(c.parent(), 'galeria-item'))"
    n_gal = E(f"{imgs_gal}.length")
    for i, f in enumerate(FOTOS):
        E(f"editor.select({imgs_gal}[{i}])"); pg.wait_for_timeout(200)
        pg.click('[data-tab=traits]')
        elegir('#img-subir', f)
        trait('Texto alternativo', f.stem)
    check('galería de inicio con 6 fotos subidas', E(f"{imgs_gal}.filter(c => c.get('src').startsWith('data:image/jpeg')).length") == 6, E(f"{imgs_gal}.length"))
    # Quitar las fotos de ejemplo que sobran (la galería se queda con 6)
    for _ in range(n_gal - 6):
        E(f"{imgs_gal}[6].parent().parent().remove()")
    check('las fotos que sobran se pueden quitar', E(f"{imgs_gal}.length") == 6)
    # WhatsApp con el número real
    sel("tieneClase(c, 'whatsapp-flotante')")
    trait('Dirección (URL)', 'https://wa.me/593987654321')
    check('número de WhatsApp cambiado', E(f"{comp('tieneClase(c, \"whatsapp-flotante\")')}.getAttributes().href") == 'https://wa.me/593987654321')
    # Animación de aparición en el título de la introducción
    sel("tagDe(c) === 'h2'")
    trait('Animación al aparecer', 'fade-up')
    check('animación al aparecer asignada', E("editor.getSelected().getAttributes()['data-reveal']") == 'fade-up')

    print('3b. Contenido turístico de la portada (textos y fotos de internet)')
    EN = lambda k: f"__sec(c, s => tieneClase(s, '{k}') || __con(s, '{k}'))"           # dentro de la sección que tiene la clase k
    ID = lambda i: f"__sec(c, s => __id(s, '{i}'))"            # dentro de la sección con ese id
    malos = textos([
        ("tieneClase(c, 'eyebrow') && __dentro(c, 'hero-contenido')", 0, 'Cotopaxi · Ecuador'),
        ("tagDe(c) === 'p' && __dentro(c, 'hero-contenido')", 0, 'Una laguna turquesa dentro de un volcán, a 3.900 metros de altura.'),
        (f"tieneClase(c, 'eyebrow') && {ID('intro')}", 0, 'El lugar'),
        (f"tagDe(c) === 'h2' && {ID('intro')}", 0, 'Una laguna dentro de un volcán'),
        (f"tagDe(c) === 'p' && {ID('intro')}", 0, 'El Quilotoa es una caldera de 3 km de ancho con una laguna verde esmeralda. Se baja a pie hasta la orilla y se sube caminando o a caballo.'),
        (f"tieneClase(c, 'eyebrow') && {ID('destacados')}", 0, 'Qué hacer'),
        (f"tagDe(c) === 'h2' && {ID('destacados')}", 0, 'Actividades'),
        (f"tieneClase(c, 'eyebrow') && {EN('img-redondeada')}", 0, 'Experiencia'),
        (f"tagDe(c) === 'h2' && {EN('img-redondeada')}", 0, 'Kayak en el cráter'),
        (f"tagDe(c) === 'p' && !tieneClase(c, 'eyebrow') && {EN('img-redondeada')}", 0, 'Alquila un kayak en la orilla y recorre la laguna rodeado de paredes de roca de 400 metros.'),
        (f"tieneClase(c, 'eyebrow') && {EN('parallax')}", 0, 'En cifras'),
        (f"tagDe(c) === 'h2' && {EN('parallax')}", 0, 'El Quilotoa en números'),
        (f"tagDe(c) === 'p' && {EN('parallax')}", 0, 'Datos para planificar tu visita.'),
        ("tieneClase(c, 'dato')", 0, '3.914 m'), ("tieneClase(c, 'dato')", 1, '3 km'), ("tieneClase(c, 'dato')", 2, '250 m'),
        (f"tieneClase(c, 'small') && {EN('parallax')}", 0, 'de altura'), (f"tieneClase(c, 'small') && {EN('parallax')}", 1, 'de ancho'), (f"tieneClase(c, 'small') && {EN('parallax')}", 2, 'de profundidad'),
        (f"tieneClase(c, 'eyebrow') && {EN('galeria-lightbox')}", 0, 'Fotos'),
        (f"tagDe(c) === 'h2' && {EN('galeria-lightbox')}", 0, 'Postales del Quilotoa'),
        ("tieneClase(c, 'font-titulo') && __dentro(c, 'pie')", 0, FAMILIA),
        ("tagDe(c) === 'p' && __dentro(c, 'pie')", 0, 'Turismo comunitario en la laguna del Quilotoa.'),
        ("tagDe(c) === 'span' && __dentro(c, 'pie') && /©/.test(c.getEl().textContent)", 0, '© 2026 Laguna Quilotoa. Todos los derechos reservados.'),
    ])
    check('textos de la portada escritos a mano', not malos, malos)
    ACTIVIDADES = [('pano13', 'Senderismo', 'Ruta de 12 km por el borde del cráter'), ('kayak', 'Kayak', 'Rema sobre la laguna'),
                   ('camping', 'Camping', 'Noches bajo las estrellas'), ('caballo', 'Cabalgata', 'Sube de la orilla sin esfuerzo')]
    tarjeta = f"{ID('destacados')}"
    for i, (k, titulo, sub) in enumerate(ACTIVIDADES):
        foto_url(f"c.is('image') && {tarjeta}", k, titulo, i)
    malos = textos([(f"tagDe(c) === 'h3' && {tarjeta}", i, t) for i, (_, t, _s) in enumerate(ACTIVIDADES)] +
                   [(f"tagDe(c) === 'p' && {tarjeta}", i, s_) for i, (_, _t, s_) in enumerate(ACTIVIDADES)])
    check('tarjetas de actividades con foto, título y texto', not malos and E(f"buscarComp(editor.getWrapper(), c => c.is('image') && {tarjeta}).every(c => c.get('src').includes('wikimedia'))"), malos)
    fondo("tieneClase(c, 'parallax')", 'amalavida')
    fondo("tagDe(c) === 'footer'", 'pano11')
    check('fondos de cifras y pie con fotos de internet', E("['parallax', 'pie'].every(k => getComputedStyle(buscarComp(editor.getWrapper(), c => tieneClase(c, k))[0].getEl()).backgroundImage.includes('wikimedia'))"))

    print('4. Páginas nuevas (heredan menú y pie)')
    respuestas.append('galeria')
    pg.click('[data-tab=pages]'); pg.click('#add-page'); pg.wait_for_timeout(1200)
    check('página galeria.html creada', E("archivoDePagina(editor.Pages.getSelected())") == 'galeria.html')
    check('hereda el menú y el pie', E("buscarComp(editor.getWrapper(), c => tieneClase(c, 'nav-transparente')).length") == 1 and E("buscarComp(editor.getWrapper(), c => tagDe(c) === 'footer').length") == 1)
    main = "tagDe(c) === 'main'"
    E(f"{comp(main)}.components().reset()")
    soltar('s-banner', dentro=main)
    soltar('s-galeria', dentro=main)
    soltar('carousel', dentro=main)
    soltar('s-pista', dentro=main)
    t = escribir("tagDe(c) === 'h1'", 'Galería de la laguna')
    check('título de la página de galería editado', t == 'Galería de la laguna', t)
    imgs_g2 = imgs_gal
    for i in range(3):
        E(f"editor.select({imgs_g2}[{i}])"); pg.wait_for_timeout(200)
        pg.click('[data-tab=traits]'); pg.click('#img-galeria'); pg.wait_for_timeout(400)
        pg.locator('.gjs-mdl-content .gjs-am-asset-image').nth(i + 2).click(); pg.wait_for_timeout(300)
    check('fotos reutilizadas desde la galería de recursos', E(f"{imgs_g2}.slice(0, 3).every(c => c.get('src').startsWith('data:image/jpeg'))"))
    check('la galería de recursos guarda los nombres', 'Acampando en la laguna.jpg' in E("editor.Assets.getAll().map(a => a.get('name')).join('|')"))
    # El resto de la galería: fotos enlazadas de internet, con su texto alternativo
    for i, k in enumerate(['iliniza', 'pano10', 'pano11', 'pano13', 'amalavida', 'caldera2']):
        E(f"editor.select({imgs_g2}[{i + 3}])"); pg.wait_for_timeout(200)
        pg.click('[data-tab=traits]')
        pg.fill('#img-url', URL(k)); pg.click('#img-apply'); pg.wait_for_timeout(300)
        trait('Texto alternativo', FOTOS_WEB[k][0][:-4])
    check('galería con fotos enlazadas de internet', E(f"{imgs_g2}.filter(c => c.get('src').includes('upload.wikimedia.org')).length") == 6)
    fondo("tieneClase(c, 'hero-interno')", 'pano10')
    RUTAS = [('mirador', 'Mirador Shalalá'), ('pano11', 'Bajada a la orilla'), ('fumarolas', 'Fumarolas'), ('iliniza', 'Vista al Iliniza'), ('nubes', 'Mar de nubes')]
    for i, (k, t) in enumerate(RUTAS):
        foto_url("c.is('image') && __dentro(c, 'pista')", k, t, i)
    malos = textos([("tieneClase(c, 'eyebrow') && __dentro(c, 'hero-contenido')", 0, 'Fotos'),
                    ("tieneClase(c, 'eyebrow') && __sec(c, s => __id(s, 'experiencias'))", 0, 'Rutas'),
                    ("tagDe(c) === 'h2' && __sec(c, s => __id(s, 'experiencias'))", 0, 'Rutas y miradores'),
                    ("tagDe(c) === 'p' && tieneClase(c, 'text-secondary') && __sec(c, s => __id(s, 'experiencias'))", 0, 'Desliza para ver más rutas.'),
                    ("tieneClase(c, 'eyebrow') && __sec(c, s => __con(s, 'galeria-lightbox'))", 0, 'Fotos'),
                    ("tagDe(c) === 'h2' && __sec(c, s => __con(s, 'galeria-lightbox'))", 0, 'La laguna en imágenes')] +
                   [("tagDe(c) === 'h3' && __dentro(c, 'pista')", i, t) for i, (_, t) in enumerate(RUTAS)] +
                   [("tagDe(c) === 'p' && __dentro(c, 'pista')", i, 'Incluido en el tour de día completo.') for i in range(len(RUTAS))])
    check('página de galería con fotos y textos propios', not malos and E("buscarComp(editor.getWrapper(), c => c.is('image') && __dentro(c, 'pista')).every(c => c.get('src').includes('wikimedia'))"), malos)
    car = "buscarComp(editor.getWrapper(), c => c.is('image') && __dentro(c, 'carousel'))"
    for i in range(E(f"{car}.length")):
        E(f"editor.select({car}[{i}])"); pg.wait_for_timeout(200)
        pg.click('[data-tab=traits]')
        pg.fill('#img-url', URL(['lago', 'mirador', 'pano11'][i % 3])); pg.click('#img-apply'); pg.wait_for_timeout(300)
    check('carrusel con fotos de internet', E(f"{car}.length") >= 2 and E(f"{car}.every(c => c.get('src').includes('upload.wikimedia.org'))"), E(f"{car}.length"))
    # Créditos de las fotos (las licencias CC BY y CC BY-SA piden citar al autor)
    creditos = ' · '.join(sorted({f'{v[2]} ({v[3]})' for v in FOTOS_WEB.values()}))
    pg.evaluate("""([m, t]) => { buscarComp(editor.getWrapper(), c => tagDe(c) === m)[0].append('<section class="container pb-5"><p class="small text-secondary mb-0">Fotografías de <a href="https://commons.wikimedia.org/wiki/Category:Quilotoa" target="_blank" rel="noopener">Wikimedia Commons</a>: ' + t + '.</p></section>'); }""", ['main', creditos])

    respuestas.append('tours')
    pg.click('[data-tab=pages]'); pg.click('#add-page'); pg.wait_for_timeout(1200)
    check('página tours.html creada', E("archivoDePagina(editor.Pages.getSelected())") == 'tours.html')
    E(f"{comp(main)}.components().reset()")
    soltar('s-banner', dentro=main)
    soltar('pricing', dentro=main)
    soltar('faq', dentro=main)
    soltar('s-contacto', dentro=main)
    soltar('map', dentro=main)
    escribir("tagDe(c) === 'h1'", 'Tours y reservas')
    fondo("tieneClase(c, 'hero-interno')", 'caldera')
    PLANES = [('Caminata', '$15', ['Guía local', 'Bajada a la orilla', 'Mirador Shalalá']),
              ('Kayak', '$25', ['1 hora de kayak', 'Chaleco y remo', 'Fotos en la laguna']),
              ('Día completo', '$45', ['Caminata + kayak', 'Almuerzo típico', 'Subida a caballo'])]
    lista = [("tieneClase(c, 'eyebrow') && __dentro(c, 'hero-contenido')", 0, 'Reservas'),
             ("tagDe(c) === 'h2' && __sec(c, s => __con(s, 'card-header'))", 0, 'Nuestros tours'),
             ("tagDe(c) === 'p' && __sec(c, s => __con(s, 'card-header'))", 0, 'Precios por persona, con guía de la comunidad.')]
    for i, (nombre, precio, items) in enumerate(PLANES):
        lista += [("tieneClase(c, 'card-header')", i, nombre), ("tieneClase(c, 'card-title')", i, precio)]
        lista += [("tagDe(c) === 'li' && __dentro(c, 'card-body')", i * 3 + j, it) for j, it in enumerate(items)]
        lista += [("tieneClase(c, 'btn') && __dentro(c, 'card-body')", i, 'Reservar')]
    lista += [("tieneClase(c, 'accordion-button')", 0, '¿Qué ropa llevo?'), ("tieneClase(c, 'accordion-body')", 0, 'Abrigo, gorra y protector solar: hace frío y el sol es fuerte a 3.900 m.'),
              ("tieneClase(c, 'accordion-button')", 1, '¿Es difícil la subida?'), ("tieneClase(c, 'accordion-body')", 1, 'Son unos 400 m de desnivel. Si prefieres, puedes subir a caballo.'),
              ("tagDe(c) === 'h2' && __sec(c, s => __id(s, 'contacto'))", 0, 'Reserva tu tour'),
              ("tagDe(c) === 'p' && tieneClase(c, 'text-secondary') && __sec(c, s => __id(s, 'contacto'))", 0, 'Escríbenos la fecha y el tour que te interesa y te confirmamos por correo o WhatsApp.')]
    malos = textos(lista)
    for i in range(3):
        sel("tieneClase(c, 'btn') && __dentro(c, 'card-body')", i); trait('Ir a', '#contacto')
    # Datos de contacto: llevan un ícono delante, así que se cambia solo el texto
    pg.evaluate("""(datos) => buscarComp(editor.getWrapper(), c => tagDe(c) === 'p' && c.components().length === 2 && tagDe(c.components().at(0)) === 'i')
        .forEach((c, i) => { if (datos[i]) c.components().at(1).set('content', datos[i]); })""",
        ['Comunidad Quilotoa, Cotopaxi, Ecuador', '+593 98 765 4321', 'reservas@lagunaquilotoa.ec', 'Todos los días, 7:00 a 17:00'])
    check('tours, precios y preguntas con textos propios', not malos, malos)
    check('los botones «Reservar» llevan al formulario', V("return buscarComp(editor.getWrapper(), c => tieneClase(c, 'btn') && __dentro(c, 'card-body')).map(c => c.getAttributes().href)") == ['#contacto'] * 3)

    sel("c.is('map')")
    pg.click('[data-tab=traits]'); pg.wait_for_timeout(200)
    trs = pg.locator('#traits .gjs-trt-trait .gjs-label').all_inner_texts()
    campo_dir = next((x for x in trs if re.search(r'direcci|address|ubicaci', x, re.I)), None)
    check('el mapa tiene un campo «Dirección o lugar» en español', campo_dir == 'Dirección o lugar', trs)
    if campo_dir:
        trait(campo_dir, 'Laguna de Quilotoa, Ecuador')
    check('el mapa apunta al lugar turístico', 'Quilotoa' in (E("editor.getSelected().getAttributes().src || editor.getSelected().get('src') || ''") or ''), E("editor.getSelected().getAttributes().src"))
    check('el mapa tiene título accesible', bool(E("editor.getSelected().getAttributes().title")), E("editor.getSelected().getAttributes()"))
    check('hay formulario de contacto con correo', E("buscarComp(editor.getWrapper(), c => tagDe(c) === 'input' && c.getAttributes().type === 'email').length") >= 1)
    check('hay acordeón de preguntas', E("buscarComp(editor.getWrapper(), c => tieneClase(c, 'accordion')).length") == 1)

    print('5. Menú: nombres y destinos, y aplicarlo a todas las páginas')
    ir_pagina(0)
    links = "buscarComp(editor.getWrapper(), c => tieneClase(c, 'nav-link'))"
    n_links = E(f"{links}.length")
    for _ in range(n_links - 3):
        E(f"{links}[{3}].parent().remove()")
    for i, (texto, destino) in enumerate((('Inicio', 'index.html'), ('Galería', 'galeria.html'), ('Tours', 'tours.html'))):
        escribir("tieneClase(c, 'nav-link')", texto, i)
        E(f"editor.select({links}[{i}])"); pg.wait_for_timeout(200)
        trait('Ir a', destino)
    check('el menú tiene 3 opciones con sus destinos', V(f"return {links}.map(c => [c.getEl().textContent.trim(), c.getAttributes().href])") == [['Inicio', 'index.html'], ['Galería', 'galeria.html'], ['Tours', 'tours.html']], V(f"return {links}.map(c => [c.getEl().textContent.trim(), c.getAttributes().href])"))
    # Botón del hero hacia la galería
    btn = "(tagDe(c) === 'a' || tagDe(c) === 'button') && __dentro(c, 'hero') && !tieneClase(c, 'nav-link')"
    escribir(btn, 'Ver galería')
    sel(btn); trait('Ir a', 'galeria.html')
    check('botón del hero lleva a la galería', E(f"(({comp(btn)}).getAttributes().href || ({comp(btn)}).getAttributes()['data-ir-a'])") == 'galeria.html')
    pg.click('[data-tab=pages]'); pg.click('#sync-nav'); pg.wait_for_timeout(600)
    pg.click('#sync-pie'); pg.wait_for_timeout(600)
    activos = []
    for i in range(3):
        ir_pagina(i)
        activos.append(V("return buscarComp(editor.getWrapper(), c => tieneClase(c, 'nav-link') && tieneClase(c, 'active')).map(c => c.getAttributes().href)"))
    check('cada página marca su enlace activo', activos == [['index.html'], ['galeria.html'], ['tours.html']], activos)
    check('ninguna página tiene menús repetidos', all(True for _ in [0]) and E("editor.Pages.getAll().every(p => buscarComp(p.getMainComponent(), c => tieneClase(c, 'nav-transparente')).length === 1)"))

    print('6. SEO de cada página')
    seo = [('Laguna Quilotoa · Turismo de naturaleza', 'Caminatas, kayak y miradores en la laguna del volcán Quilotoa, Ecuador.'),
           ('Galería · Laguna Quilotoa', 'Fotos de la laguna, sus senderos y miradores.'),
           ('Tours y reservas · Laguna Quilotoa', 'Elige tu tour y reserva en línea.')]
    pg.click('[data-tab=pages]')
    for i, (tit, desc) in enumerate(seo):
        pg.locator('#pages .page-row').nth(i).locator('button[title^="Título"]').click(); pg.wait_for_timeout(300)
        pg.fill('#pg-tit', tit); pg.fill('#pg-desc', desc); pg.click('#pg-ok'); pg.wait_for_timeout(200)
    check('título y descripción guardados en las 3 páginas', V("return editor.Pages.getAll().map(p => p.get('seoTitulo'))") == [s[0] for s in seo])

    print('7. Diseño móvil: título del hero más pequeño solo en móvil')
    ir_pagina(0)
    pg.click('[data-device=mobile]'); pg.wait_for_timeout(900)
    sel("tagDe(c) === 'h1'")
    estilo('typography', 'font-size', '34px')
    check('en móvil el título mide 34px', E(f"getComputedStyle({comp('tagDe(c) === \"h1\"')}.getEl()).fontSize") == '34px')
    pg.click('[data-device=desktop]'); pg.wait_for_timeout(900)
    check('en escritorio no cambia', E(f"getComputedStyle({comp('tagDe(c) === \"h1\"')}.getEl()).fontSize") != '34px')
    check('el CSS lleva la regla de móvil', bool(re.search(r'@media \(max-width: ?575px\)', E("editor.getCss()"))))

    print('8. Deshacer, semántica, código y vista previa')
    antes = E("editor.getHtml().length")
    soltar('alert', dentro=main)
    E("editor.UndoManager.undo()"); pg.wait_for_timeout(400)
    check('deshacer quita lo último añadido', E("editor.getHtml().length") == antes)
    pg.click('#btn-code'); pg.wait_for_timeout(700)
    check('la ventana de código se abre con el HTML', E("editor.Modal.isOpen()") and 'Laguna' in pg.inner_text('.gjs-mdl-content'))
    E("editor.Modal.close()")
    pg.click('#sem-count') if pg.is_visible('#sem-count') else None
    pg.wait_for_timeout(600)
    problemas = V("return editor.Pages.getAll().map(p => (revisar(p.getMainComponent()) || []).filter(x => x.nivel === 'error' || x.tipo === 'error').map(x => x.msg || x.texto || JSON.stringify(x)))")
    check('semántica sin errores en las 3 páginas', all(not x for x in problemas), problemas)
    E("editor.Modal.close()")
    pg.keyboard.press('Control+p'); pg.wait_for_timeout(900)
    E("editor.Canvas.getDocument().querySelector('.galeria-lightbox img').click()")
    pg.wait_for_timeout(500)
    check('vista previa: la foto de la galería se amplía', E("!!editor.Canvas.getDocument().querySelector('.lb img')"))
    E("editor.Canvas.getDocument().querySelector('.lb') && editor.Canvas.getDocument().querySelector('.lb').click()")
    pg.keyboard.press('Escape'); pg.wait_for_timeout(900)

    print('9. Se guarda y sobrevive a recargar')
    pg.wait_for_timeout(1200)
    pg.reload(); pg.wait_for_function(LISTO, timeout=60000); pg.wait_for_timeout(2000); E("editor.Modal.close()")
    check('tras recargar siguen las 3 páginas', V("return editor.Pages.getAll().map(archivoDePagina)") == ['index.html', 'galeria.html', 'tours.html'], V("return editor.Pages.getAll().map(archivoDePagina)"))
    check('tras recargar siguen las fotos propias', E(f"{imgs_gal}.filter(c => c.get('src').startsWith('data:image/jpeg')).length") == 6)
    check('tras recargar sigue la identidad visual', PRIMARIO in E("temaCss()"))

    print('10. Exportar (con Bootstrap dentro del ZIP, para usarlo sin internet)')
    pg.click('[data-tab=sitio]')
    if not E("document.querySelector('#t-bs-local').checked"): pg.click('#t-bs-local')
    with pg.expect_download(timeout=120000) as dl:
        pg.click('#btn-export')
    z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    nombres = z.namelist()
    # Copia del resultado para abrirlo después: el proyecto (con «Guardar») y el ZIP exportado
    SALIDA = pathlib.Path.home() / 'Downloads'
    dl.value.save_as(SALIDA / 'quilotoa-sitio.zip')
    with pg.expect_download(timeout=60000) as dj:
        pg.click('#btn-save')
    dj.value.save_as(SALIDA / 'quilotoa.json')
    print(f'  (guardados en {SALIDA}: quilotoa.json y quilotoa-sitio.zip)')
    for f in ('index.html', 'galeria.html', 'tours.html', 'css/site.css', 'js/site.js', 'css/bootstrap.min.css', 'js/bootstrap.bundle.min.js', 'css/fonts/bootstrap-icons.woff2'):
        check(f'ZIP contiene {f}', f in nombres)
    fotos_zip = sorted(n for n in nombres if n.startswith('assets/'))
    limpio = lambda t: re.sub('[^a-z0-9]+', '-', t.lower()).strip('-')
    check('las fotos subidas van a assets con su nombre', all(f'assets/{limpio(f.stem)}.jpg' in nombres for f in FOTOS + [KAYAK]), fotos_zip)
    check('las fotos de internet se descargan a assets con nombre corto', 'assets/lago-quilotoa.jpg' in nombres and 'assets/laguna-de-quilotoa-equador-panoramio-10.jpg' in nombres, fotos_zip)
    check('ningún nombre de archivo pasa de 45 caracteres (rutas largas de Windows)', all(len(n.split('/')[-1]) <= 45 for n in fotos_zip), [n for n in fotos_zip if len(n.split('/')[-1]) > 45])
    check('cada foto se guarda una sola vez aunque se use en varias páginas', fotos_zip.count('assets/acampando-en-la-laguna.jpg') == 1 and len([n for n in fotos_zip if 'lago-quilotoa' in n]) == 1, fotos_zip)
    check('el sitio no depende de Wikimedia (nada quedó enlazado)', not any('upload.wikimedia.org' in z.read(n).decode('utf-8') for n in nombres if n.endswith(('.html', '.css')) and 'bootstrap' not in n))
    ejemplo = [f for f in ('index.html', 'galeria.html', 'tours.html') for t in ('Mi Sitio', 'Característica', 'Primera pregunta', 'Lorem', 'Dirección, Ciudad')
               if t in re.sub(r'<head>.*?</head>', '', z.read(f).decode('utf-8'), flags=re.S)]
    check('no queda texto de ejemplo en el contenido', not ejemplo, ejemplo)
    check('galeria.html lleva los créditos de las fotos', 'Wikimedia Commons' in z.read('galeria.html').decode('utf-8'))
    idx = z.read('index.html').decode()
    check('index.html con su título SEO', f'<title>{seo[0][0]}</title>' in idx)
    check('index.html con su descripción', f'content="{seo[0][1]}"' in idx)
    check('site.css con la identidad elegida', PRIMARIO in z.read('css/site.css').decode())
    check('el sitio no depende del CDN de Bootstrap', 'cdn.jsdelivr' not in idx)
    check('CSS de la página con la regla de móvil', '34px' in z.read('css/index.css').decode())

    print('11. El sitio exportado funciona')
    d = pathlib.Path(tempfile.mkdtemp()); z.extractall(d)
    sp = ctx.new_page(); sp.set_viewport_size({'width': 1366, 'height': 900})
    fallos, err_sitio = [], []
    sp.on('requestfailed', lambda r: r.url.startswith('file:') and fallos.append(r.url))
    sp.on('pageerror', lambda e: err_sitio.append(str(e)))
    for f in ('index.html', 'galeria.html', 'tours.html'):
        sp.goto((d / f).as_uri()); sp.wait_for_timeout(1200)
        rotas = V("return [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src').slice(0, 60))", sp)
        check(f'{f}: todas las imágenes cargan', not rotas, rotas)
    pies = []
    for f in ('index.html', 'galeria.html', 'tours.html'):
        sp.goto((d / f).as_uri()); sp.wait_for_timeout(800)
        pies.append(V("""const p = document.querySelector('footer.pie'), a = p.querySelector('.font-titulo');
            a.scrollIntoView({ behavior: 'instant', block: 'center' });
            const r = a.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return [getComputedStyle(p).backgroundImage.split('/').pop().slice(0, 30), t === a]""", sp))
    check('el pie se ve igual en las 3 páginas (misma foto y texto por encima de la capa oscura)', all(x == pies[0] and x[1] for x in pies), pies)
    sp.goto((d / 'index.html').as_uri()); sp.wait_for_timeout(1200)
    check('hero con la foto de fondo desde assets', 'assets/lago-quilotoa.jpg' in V("return getComputedStyle(document.querySelector('.hero')).backgroundImage", sp))
    check('marca y título editados', V("return [document.querySelector('.navbar-brand').textContent.trim(), document.querySelector('h1').textContent.trim()]", sp) == [FAMILIA, 'Descubre el Quilotoa'])
    check('tipografía de títulos aplicada', 'Playfair' in V("return getComputedStyle(document.querySelector('h1')).fontFamily", sp))
    sp.locator('.galeria-lightbox img').first.click(); sp.wait_for_timeout(400)
    check('la galería amplía la foto al hacer clic', V("return !!document.querySelector('.lb img') && document.querySelector('.lb img').naturalWidth > 0", sp))
    sp.keyboard.press('Escape'); sp.wait_for_timeout(300)
    check('Escape cierra la ampliación', not V("return !!document.querySelector('.lb')", sp))
    check('WhatsApp con el número real', V("return document.querySelector('.whatsapp-flotante').getAttribute('href')", sp) == 'https://wa.me/593987654321')
    sp.locator('.hero a, .hero button').filter(has_text='Ver galería').first.click(); sp.wait_for_timeout(900)
    check('el botón del hero abre galeria.html', sp.url.endswith('galeria.html'), sp.url)
    sp.wait_for_timeout(300)
    n0 = V("return [...document.querySelectorAll('.carousel-item')].findIndex(e => e.classList.contains('active'))", sp)
    sp.locator('.carousel-control-next').first.click(); sp.wait_for_timeout(900)
    check('el carrusel pasa a la siguiente foto', V("return [...document.querySelectorAll('.carousel-item')].findIndex(e => e.classList.contains('active'))", sp) != n0)
    sp.locator('a.nav-link', has_text='Tours').first.click(); sp.wait_for_timeout(900)
    check('el menú lleva a tours.html', sp.url.endswith('tours.html'), sp.url)
    check('tours.html marca «Tours» como activo', V("return document.querySelector('.nav-link.active').textContent.trim()", sp) == 'Tours')
    sp.locator('.accordion-button').nth(1).click(); sp.wait_for_timeout(700)
    check('el acordeón abre la segunda pregunta', V("return document.querySelectorAll('.accordion-collapse.show').length >= 1 && document.querySelectorAll('.accordion-collapse')[1].classList.contains('show')", sp))
    check('el mapa muestra el lugar turístico', 'Quilotoa' in V("return (document.querySelector('iframe[src*=\"maps\"]') || {}).src || ''", sp))
    sp.fill('input[type=email]', 'no-es-correo')
    check('el formulario valida el correo', not V("return document.querySelector('input[type=email]').checkValidity()", sp))
    sp.locator('a.nav-link', has_text='Inicio').first.click(); sp.wait_for_timeout(900)
    check('el menú vuelve a index.html', sp.url.endswith('index.html'), sp.url)
    check('ningún archivo local falló al cargar', not fallos, fallos[:5])
    check('el sitio exportado no tiene errores de JavaScript', not err_sitio, err_sitio[:3])

    print('12. Sitio exportado en un celular')
    sm = ctx.new_page(); sm.set_viewport_size({'width': 390, 'height': 844})
    sm.goto((d / 'index.html').as_uri()); sm.wait_for_timeout(1000)
    check('móvil: el título usa 34px', V("return getComputedStyle(document.querySelector('h1')).fontSize", sm) == '34px')
    check('móvil: el menú empieza plegado', not V("return document.querySelector('.navbar-collapse').classList.contains('show')", sm))
    sm.click('.navbar-toggler'); sm.wait_for_timeout(700)
    check('móvil: la hamburguesa abre el menú', V("return document.querySelector('.navbar-collapse').classList.contains('show')", sm))
    check('móvil: sin desbordar a lo ancho', V("return document.documentElement.scrollWidth <= window.innerWidth + 1", sm), V("return [document.documentElement.scrollWidth, window.innerWidth]", sm))

    check('sin errores de JavaScript en el editor', not err, err[:5])
    print(f'\nRESULTADO: {len(OK)} correctas, {len(FAIL)} fallidas')
    if FAIL: print('Fallidas:', *FAIL, sep='\n  - ')
    b.close()
