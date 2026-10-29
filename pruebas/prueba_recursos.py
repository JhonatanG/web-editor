"""Imágenes y videos desde el computador o por URL, y su salida a assets/ al exportar.
Requiere: pip install playwright, y servir la carpeta en http://127.0.0.1:8765"""
import io, os, re, struct, tempfile, zipfile, zlib, pathlib
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
FOTO = tmp / 'Foto de prueba.png';  FOTO.write_bytes(png(40, 30, (200, 40, 40)))
FONDO = tmp / 'Fondo azul.png';     FONDO.write_bytes(png(60, 20, (40, 40, 200)))
VIDEO = tmp / 'Mi video.mp4';       VIDEO.write_bytes(b'\x00\x00\x00\x18ftypmp42' + os.urandom(2000))
SUELTA = tmp / 'suelta.png';         SUELTA.write_bytes(png(20, 20, (250, 200, 0)))
CLIP = tmp / 'clip.mp4';            CLIP.write_bytes(b'\x00\x00\x00\x18ftypmp42' + os.urandom(1500))
TEXTO = tmp / 'notas.txt';          TEXTO.write_text('hola')
EXTERNA = AQUI / 'recurso-externo.png'; EXTERNA.write_bytes(png(10, 10, (0, 160, 0)))
URL_EXT = 'http://127.0.0.1:8765/pruebas/recurso-externo.png'
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
    E("editor.Modal.close()")
    E("(() => { editor.Pages.getAll().slice(1).forEach(p => editor.Pages.remove(p)); editor.setComponents(''); editor.Assets.getAll().reset(); })()")
    pg.wait_for_timeout(400)
    def soltar(bid):
        E(f"(() => {{ const b = editor.Blocks.get('{bid}'); const c = editor.getWrapper().append(b.get('content'))[0]; editor.trigger('block:drag:stop', c, b); return 1; }})()")
        pg.wait_for_timeout(300)
    def elegir(boton, archivo):
        with pg.expect_file_chooser() as fc:
            pg.click(boton)
        fc.value.set_files(str(archivo))
        pg.wait_for_timeout(600)

    print('1. Imagen desde el computador')
    soltar('image')
    E("editor.select(buscarComp(editor.getWrapper(), c => c.is('image'))[0])")
    pg.click('[data-tab=traits]'); pg.wait_for_timeout(200)
    check('al seleccionar una imagen aparece «Subir desde mi computador»', pg.is_visible('#img-subir'))
    elegir('#img-subir', FOTO)
    src = E("buscarComp(editor.getWrapper(), c => c.is('image'))[0].get('src')")
    check('la imagen usa el archivo elegido', src.startswith('data:image/png;base64,'), src[:40])
    check('se ve en el lienzo', E("buscarComp(editor.getWrapper(), c => c.is('image'))[0].getEl().naturalWidth") == 40)
    check('el panel dice el nombre del archivo y que irá a assets', 'Foto de prueba.png' in pg.inner_text('#img-info') and 'assets' in pg.inner_text('#img-info'), pg.inner_text('#img-info'))
    check('queda en la galería con su nombre', E("editor.Assets.getAll().map(a => a.get('name'))") == ['Foto de prueba.png'])
    elegir('#img-subir', TEXTO)
    check('un archivo que no es imagen se rechaza', E("buscarComp(editor.getWrapper(), c => c.is('image'))[0].get('src')") == src)

    print('2. Galería e imagen por URL')
    soltar('image')
    E("editor.select(buscarComp(editor.getWrapper(), c => c.is('image'))[1])"); pg.wait_for_timeout(200)
    pg.click('#img-galeria'); pg.wait_for_timeout(500)
    check('la galería se abre con la imagen subida', pg.locator('.gjs-mdl-content .gjs-am-asset-image').count() == 1)
    pg.locator('.gjs-mdl-content .gjs-am-asset-image').first.click(); pg.wait_for_timeout(400)
    check('elegir de la galería la pone en la imagen y cierra', E("buscarComp(editor.getWrapper(), c => c.is('image'))[1].get('src')") == src and not E("editor.Modal.isOpen()"))
    soltar('image')
    E("editor.select(buscarComp(editor.getWrapper(), c => c.is('image'))[2])"); pg.wait_for_timeout(200)
    pg.fill('#img-url', URL_EXT); pg.click('#img-apply'); pg.wait_for_timeout(400)
    check('imagen por enlace de internet', E("buscarComp(editor.getWrapper(), c => c.is('image'))[2].get('src')") == URL_EXT)
    check('el panel indica que es un enlace de internet', 'internet' in pg.inner_text('#img-info'))

    print('3. Imagen de fondo desde el computador')
    soltar('section')
    E("editor.select(buscarComp(editor.getWrapper(), c => tagDe(c) === 'section')[0])")
    pg.click('[data-tab=style]'); pg.wait_for_timeout(200)
    check('el panel de fondo tiene «Subir desde mi computador»', pg.is_visible('#bg-subir'))
    elegir('#bg-subir', FONDO)
    bg = E("getComputedStyle(buscarComp(editor.getWrapper(), c => tagDe(c) === 'section')[0].getEl()).backgroundImage")
    check('la sección muestra el fondo subido', bg.startswith('url("data:image/png;base64,'), bg[:40])
    check('el panel de fondo muestra el nombre', 'Fondo azul.png' in pg.inner_text('#bg-info'), pg.inner_text('#bg-info'))

    print('4. Video desde el computador')
    soltar('video-file')
    E("editor.select(buscarComp(editor.getWrapper(), c => c.is('video'))[0])")
    pg.click('[data-tab=traits]'); pg.wait_for_timeout(200)
    elegir('#video-subir', VIDEO)
    check('el video usa el archivo elegido', E("buscarComp(editor.getWrapper(), c => c.is('video'))[0].getEl().querySelector('video, iframe').src.startsWith('data:video/mp4')") if E("!!buscarComp(editor.getWrapper(), c => c.is('video'))[0].getEl().querySelector('video')") else E("buscarComp(editor.getWrapper(), c => c.is('video'))[0].getEl().src.startsWith('data:video/mp4')"))
    check('el panel de video muestra el nombre', 'Mi video.mp4' in pg.inner_text('#video-info'), pg.inner_text('#video-info'))
    soltar('s-hero-video')
    E("editor.select(buscarComp(editor.getWrapper(), c => tieneClase(c, 'hero'))[0])"); pg.wait_for_timeout(300)
    check('al seleccionar el hero aparece «Video de fondo»', pg.is_visible('#video-subir') and pg.inner_text('#video-titulo') == 'Video de fondo')
    elegir('#video-subir', VIDEO)
    check('el video de fondo usa el archivo subido', E("buscarComp(editor.getWrapper(), c => c.is('video-fondo'))[0].getAttributes().src.startsWith('data:video/mp4')"))

    print('5. Arrastrar archivos desde el escritorio al lienzo')
    antes = E("buscarComp(editor.getWrapper(), c => c.is('image')).length"), E("buscarComp(editor.getWrapper(), c => c.is('video')).length")
    def arrastrar(nombre, mime, b64):
        pg.evaluate("""async ([nombre, mime, b64]) => {
          const bytes = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
          const dt = new DataTransfer(); dt.items.add(new File([bytes], nombre, { type: mime }));
          const tgt = editor.Canvas.getDocument().querySelector('main') || editor.Canvas.getBody(), r = tgt.getBoundingClientRect();
          const opt = { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + 20, clientY: r.top + 10 };
          const sleep = ms => new Promise(f => setTimeout(f, ms));
          tgt.dispatchEvent(new DragEvent('dragenter', opt)); await sleep(50);
          for (let i = 0; i < 4; i++) { tgt.dispatchEvent(new DragEvent('dragover', opt)); await sleep(50); }
          tgt.dispatchEvent(new DragEvent('drop', opt)); await sleep(50);
        }""", [nombre, mime, __import__('base64').b64encode(open(SUELTA if mime.startswith('image') else CLIP, 'rb').read()).decode()])
        pg.wait_for_timeout(1000)
    arrastrar('Desde escritorio.png', 'image/png', None)
    imgs = E("buscarComp(editor.getWrapper(), c => c.is('image')).map(c => c.get('src').slice(0, 15))")
    check('soltar una foto en el lienzo crea una imagen con ella', len(imgs) == antes[0] + 1 and imgs.count('data:image/png;') >= 3, imgs)
    check('…y queda en la galería', 'Desde escritorio.png' in E("editor.Assets.getAll().map(a => a.get('name'))"))
    arrastrar('Clip.mp4', 'video/mp4', None)
    check('soltar un video en el lienzo crea un video con él', E("buscarComp(editor.getWrapper(), c => c.is('video')).length") == antes[1] + 1)
    check('ningún elemento queda a medio subir', E("buscarComp(editor.getWrapper(), c => !!c.getAttributes()['data-subiendo']).length") == 0)

    print('6. Se guarda en el proyecto')
    E("guardarAhora && guardarAhora()"); pg.wait_for_timeout(800)
    pg.reload(); pg.wait_for_function(LISTO, timeout=60000); pg.wait_for_timeout(1500); E("editor.Modal.close()")
    check('tras recargar, la imagen subida sigue', E("buscarComp(editor.getWrapper(), c => c.is('image'))[0].get('src').startsWith('data:image/png')"))
    check('tras recargar, la galería conserva los nombres', 'Foto de prueba.png' in E("editor.Assets.getAll().map(a => a.get('name'))"))

    print('7. Exportar: todo a la carpeta assets')
    def exportar():
        with pg.expect_download(timeout=60000) as dl:
            E("exportarZip()")
        return zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    z = exportar()
    nombres = [n for n in z.namelist() if n.startswith('assets/')]
    h, css = z.read('index.html').decode(), z.read('css/index.css').decode()
    for f in ['assets/foto-de-prueba.png', 'assets/fondo-azul.png', 'assets/mi-video.mp4', 'assets/desde-escritorio.png', 'assets/clip.mp4', 'assets/recurso-externo.png']:
        check(f'el ZIP incluye {f}', f in nombres, nombres)
    check('la foto subida se exporta idéntica', z.read('assets/foto-de-prueba.png') == FOTO.read_bytes())
    check('el video subido se exporta idéntico', z.read('assets/mi-video.mp4') == VIDEO.read_bytes())
    check('el HTML usa las rutas de assets', 'src="assets/foto-de-prueba.png"' in h and 'assets/mi-video.mp4' in h)
    check('la imagen enlazada de internet también apunta a assets', URL_EXT not in h and 'src="assets/recurso-externo.png"' in h)
    check('el CSS usa ../assets para el fondo', '../assets/fondo-azul.png' in css, re.findall(r'url\([^)]{0,60}', css))
    check('no quedan archivos incrustados (base64) en HTML ni CSS', ';base64,' not in h and ';base64,' not in css)
    check('las imágenes de ejemplo también salen a assets como .svg', 'data:image/svg' not in h and any(n.endswith('.svg') for n in nombres))
    check('no se exporta el atributo interno data-archivo', 'data-archivo' not in h)
    check('una imagen repetida se guarda una sola vez', h.count('assets/foto-de-prueba.png') >= 2 and not any(re.match(r'assets/foto-de-prueba-\d', n) for n in nombres))
    d = tmp / 'sitio'; z.extractall(d)
    vis = ctx.new_page(); vis.goto((d / 'index.html').as_uri()); vis.wait_for_timeout(800)
    check('en el sitio exportado la foto se ve (carga desde assets)', vis.evaluate("[...document.images].filter(i => i.src.includes('assets/foto-de-prueba')).every(i => i.naturalWidth === 40)"))
    check('en el sitio exportado el fondo se ve', vis.evaluate("[...document.querySelectorAll('section')].some(s => getComputedStyle(s).backgroundImage.includes('assets/fondo-azul.png'))"))
    vis.close()

    print('8. Opción: dejar como enlace lo que viene de internet')
    pg.click('[data-tab=sitio]'); pg.uncheck('#t-assets-ext')
    h2 = exportar().read('index.html').decode()
    check('desactivada, la imagen de internet queda como enlace', f'src="{URL_EXT}"' in h2)
    check('…y lo subido desde el computador igual va a assets', 'assets/foto-de-prueba.png' in h2)
    pg.check('#t-assets-ext')

    check('sin errores de JavaScript', not err, err[:5])
    print(f'\nRESULTADO: {len(OK)} correctas, {len(FAIL)} fallidas')
    b.close()
EXTERNA.unlink(missing_ok=True)
