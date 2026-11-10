"""Los videos de fondo del hero nunca suenan: en el lienzo, tras recargar un
proyecto guardado sin «muted», y en el sitio exportado (video, YouTube, Vimeo)."""
import io, pathlib, sys, tempfile, zipfile
from playwright.sync_api import sync_playwright
from comun import Editor, check, resumen

VF = "c.get('type') === 'video-fondo'"
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1600, 'height': 950}, accept_downloads=True)
    ed = Editor(ctx)
    pg, E, V = ed.pg, ed.E, ed.V
    ed.empezar_de_cero()
    for s in ('s-hero-video', 'sec-hero-marco'):
        pg.click(f'.sec-card[data-sec="{s}"] .sec-ins'); pg.wait_for_timeout(500)
    el = lambda i: f"{ed.comp(VF, i)}.getEl()"
    E(f"(ponerVideo({ed.comp(VF, 0)}, 'https://example.com/fondo.mp4'), 1)"); pg.wait_for_timeout(500)
    check('en el lienzo el video de fondo está silenciado', E(f"{el(0)}.muted === true && {el(0)}.defaultMuted === true"))
    E(f"({el(0)}.muted = false, {el(0)}.volume = 1, {el(0)}.dispatchEvent(new Event('play')), 1)"); pg.wait_for_timeout(300)
    check('si algo le activa el sonido, se vuelve a silenciar', E(f"{el(0)}.muted === true && {el(0)}.volume === 0"))
    E(f"(ponerVideo({ed.comp(VF, 1)}, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 1)"); pg.wait_for_timeout(500)
    check('YouTube va con mute=1', 'mute=1' in E(f"{ed.comp(VF, 1)}.getAttributes().src"))
    print('Proyecto guardado sin «muted»')
    E(f"({ed.comp(VF, 0)}.removeAttributes('muted'), editor.store(), 1)"); pg.wait_for_timeout(1500)
    pg.reload(); ed.esperar(); E("editor.Modal.close()"); pg.wait_for_timeout(600)
    check('al reabrirlo recupera «muted» y está silenciado', E(f"!!{ed.comp(VF, 0)}.getAttributes().muted && {el(0)}.muted === true"))
    E(f"(ponerVideo({ed.comp(VF, 1)}, 'https://vimeo.com/76979871'), 1)"); pg.wait_for_timeout(400)
    with pg.expect_download(timeout=120000) as dl:
        pg.click('#btn-export')
    z = zipfile.ZipFile(io.BytesIO(open(dl.value.path(), 'rb').read()))
    idx = z.read('index.html').decode('utf-8')
    check('en el ZIP el <video> lleva muted', '<video' in idx and all('muted' in t for t in idx.split('<video')[1:]))
    check('y Vimeo va con muted=1', 'muted=1' in idx)
    d = pathlib.Path(tempfile.mkdtemp()); z.extractall(d)
    zp = ctx.new_page(); err = []
    zp.on('pageerror', lambda e: err.append(str(e)))
    zp.goto((d / 'index.html').as_uri()); zp.wait_for_timeout(1500)
    check('en el sitio exportado el video está silenciado', zp.evaluate("[...document.querySelectorAll('video.hero-video')].every(v => v.muted)"))
    check('sin errores de JavaScript', not err and not ed.errores, (err + ed.errores)[:3])
    b.close()
sys.exit(0 if resumen() else 1)
