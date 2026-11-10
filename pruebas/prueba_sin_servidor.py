"""Editor sin servidor (alojamiento estático: Cloudflare Workers, Live Server…).
Sirve la carpeta con un servidor de archivos sin API y comprueba que solo
quedan diseñar, revisar y exportar: sin publicar ni variantes con IA, los
formularios envían por correo y el ZIP funciona.
Uso: python pruebas/prueba_sin_servidor.py   (arranca su propio servidor estático)"""
import io, pathlib, socket, subprocess, sys, tempfile, time, zipfile
from playwright.sync_api import sync_playwright
from comun import Editor, check, resumen

RAIZ = pathlib.Path(__file__).resolve().parent.parent
s = socket.socket(); s.bind(('127.0.0.1', 0)); PUERTO = s.getsockname()[1]; s.close()
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PUERTO), '--bind', '127.0.0.1'], cwd=RAIZ,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome')
        ctx = b.new_context(viewport={'width': 1600, 'height': 950}, accept_downloads=True)
        ed = Editor(ctx, f'http://127.0.0.1:{PUERTO}/index.html')
        pg, E, V = ed.pg, ed.E, ed.V
        ed.empezar_de_cero()
        pg.wait_for_timeout(800)
        check('detecta que no hay servidor', E("document.body.classList.contains('sin-servidor')"))
        check('el botón queda como «Revisar»', pg.inner_text('#btn-publicar').strip() == 'Revisar')
        for sec in ('s-nav', 's-hero-img', 's-contacto'):
            pg.click(f'.sec-card[data-sec="{sec}"] .sec-ins'); pg.wait_for_timeout(300)
        ed.sel("tagDe(c) === 'h1'")
        check('no aparece «Probar otra variante»', not pg.is_visible('#btn-variante'))
        pg.click('[data-tab=sitio]'); pg.wait_for_timeout(300)
        check('formularios: sin la opción «servidor» y con «correo» elegido',
              not pg.is_visible('#form-destino-box input[value=servicio]') and pg.is_checked('#form-destino-box input[value=correo]'))
        pg.fill('#fd-correo', 'hola@miestudio.com'); pg.press('#fd-correo', 'Tab'); pg.wait_for_timeout(200)
        pg.click('#btn-publicar'); pg.wait_for_function("document.querySelector('#pubp-revision .sem-acciones') && !document.querySelector('#rev-prog')", timeout=90000)
        check('la ventana solo tiene la pestaña Revisión', V("return [...document.querySelectorAll('.pub [data-pub]')].map(b => b.dataset.pub)") == ['revision'])
        check('la revisión funciona sin servidor', 'galeria.html' in pg.inner_text('#pubp-revision') or 'Todo en orden' in pg.inner_text('#pubp-revision'))
        with pg.expect_download(timeout=120000) as dl:
            pg.click('#rev-pub')
        z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
        idx = z.read('index.html').decode('utf-8')
        check('el botón final de la revisión exporta el ZIP', 'index.html' in z.namelist() and 'js/formularios.js' in z.namelist())
        check('el formulario del ZIP envía por correo (no a un servidor)', 'data-destino="correo"' in idx and 'mailto:hola@miestudio.com' in idx and '/api/formularios' not in idx)
        d = pathlib.Path(tempfile.mkdtemp()); z.extractall(d)
        zp = ctx.new_page(); err = []
        zp.on('pageerror', lambda e: err.append(str(e)))
        zp.goto((d / 'index.html').as_uri()); zp.wait_for_load_state('networkidle')
        check('el ZIP abre sin errores', zp.locator('h1').count() == 1 and not err, err[:2])
        check('sin errores de JavaScript en el editor', not ed.errores, ed.errores[:3])
        b.close()
finally:
    srv.terminate()
sys.exit(0 if resumen() else 1)
