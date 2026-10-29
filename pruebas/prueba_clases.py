"""Explorador de clases: buscar, ver la descripción, previsualizar y añadir.
Requiere: pip install playwright, y servir la carpeta en http://127.0.0.1:8765"""
from playwright.sync_api import sync_playwright

OK, FAIL = [], []
def check(n, c, x=''):
    (OK if c else FAIL).append(n)
    print(('  OK   ' if c else '  FALLA ') + n + (f'  -> {x}' if x != '' and not c else ''))

LISTO = '(() => { try { return editor.Canvas.getDocument().body && editor.Pages.getAll().length > 0; } catch (e) { return false; } })()'

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    pg = b.new_page(viewport={'width': 1600, 'height': 900})
    err = []
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('http://127.0.0.1:8765/index.html')
    pg.wait_for_function(LISTO, timeout=60000)
    pg.wait_for_timeout(1500)
    def E(js):
        return pg.evaluate(f'(() => {{ const r = ({js}); return (r && typeof r === "object" && !Array.isArray(r)) ? true : r; }})()')
    E("editor.Modal.close()")
    E("editor.setComponents('<section><div class=\"caja\"><p>Hola</p></div></section><img src=\"x.png\" alt=\"x\"><a href=\"#\">Ir</a>')")
    pg.wait_for_timeout(400)
    clases = lambda q: E(f"buscarComp(editor.getWrapper(), {q})[0].getClasses()")
    filas = lambda: pg.locator('#cls-lista .cls-fila code').all_inner_texts()

    print('1. Sugerencias según el elemento')
    E("editor.select(buscarComp(editor.getWrapper(), c => tagDe(c) === 'img')[0])"); pg.click('[data-tab=style]'); pg.wait_for_timeout(300)
    check('el explorador aparece al seleccionar', pg.is_visible('#clases-box'))
    check('para una imagen sugiere img-fluid y rounded-circle', {'img-fluid', 'rounded-circle'} <= set(filas()), filas())
    check('cada clase trae una descripción', 'sin deformarse' in pg.inner_text('#cls-lista'))
    E("editor.select(buscarComp(editor.getWrapper(), c => tagDe(c) === 'a')[0])"); pg.click('[data-tab=style]'); pg.wait_for_timeout(300)
    check('para un enlace sugiere clases de botón', 'btn-primary' in filas(), filas())
    E("editor.select(buscarComp(editor.getWrapper(), c => tagDe(c) === 'div')[0])"); pg.wait_for_timeout(300)
    check('para una caja sugiere container, d-flex…', {'container', 'd-flex'} <= set(filas()), filas())
    check('una clase propia aparece como aplicada y explicada', 'caja' in pg.inner_text('#cls-aplicadas') and 'propia' in pg.inner_text('#cls-aplicadas'))

    print('2. Búsqueda en español')
    for q, esperada in [('centrar', 'text-center'), ('centrar vertical', 'align-items-center'), ('sombra', 'shadow'),
                        ('ocultar movil', 'd-md-block'), ('margen abajo', 'mb-3'), ('redondear', 'rounded-circle'), ('mt-3', 'mt-3')]:
        pg.fill('#cls-buscar', q); pg.wait_for_timeout(150)
        check(f'buscar «{q}» encuentra {esperada}', esperada in filas(), filas()[:8])
    pg.fill('#cls-buscar', 'mt-3'); pg.wait_for_timeout(150)
    check('la coincidencia exacta sale primero', filas()[0] == 'mt-3', filas()[:3])

    print('3. Vista previa al pasar el ratón')
    pg.fill('#cls-buscar', 'shadow-lg'); pg.wait_for_timeout(150)
    pg.locator('#cls-lista .cls-fila').first.hover(); pg.wait_for_timeout(200)
    check('al pasar el ratón la clase se ve en el lienzo', E("buscarComp(editor.getWrapper(), c => tagDe(c) === 'div')[0].getEl().classList.contains('shadow-lg')"))
    check('…pero no se guarda en el proyecto', 'shadow-lg' not in clases("c => tagDe(c) === 'div'"))
    pg.mouse.move(5, 450); pg.wait_for_timeout(200)
    check('al salir, la vista previa desaparece', not E("buscarComp(editor.getWrapper(), c => tagDe(c) === 'div')[0].getEl().classList.contains('shadow-lg')"))

    print('4. Añadir, reemplazar y quitar')
    pg.locator('#cls-lista .cls-fila').first.click(); pg.wait_for_timeout(200)
    check('clic añade la clase', 'shadow-lg' in clases("c => tagDe(c) === 'div'"))
    check('la fila queda marcada como puesta', pg.locator('#cls-lista .cls-fila.puesta').count() == 1)
    pg.fill('#cls-buscar', 'shadow-sm'); pg.wait_for_timeout(150); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    k = clases("c => tagDe(c) === 'div'")
    check('Enter añade la primera; shadow-sm reemplaza a shadow-lg', 'shadow-sm' in k and 'shadow-lg' not in k, k)
    pg.fill('#cls-buscar', 'mt-2'); pg.keyboard.press('Enter'); pg.fill('#cls-buscar', 'mb-4'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    pg.fill('#cls-buscar', 'mt-5'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    k = clases("c => tagDe(c) === 'div'")
    check('mt-5 reemplaza a mt-2 pero respeta mb-4', 'mt-5' in k and 'mt-2' not in k and 'mb-4' in k, k)
    pg.fill('#cls-buscar', 'mt-5'); pg.wait_for_timeout(150); pg.locator('#cls-lista .cls-fila').first.click(); pg.wait_for_timeout(200)
    check('clic sobre una clase puesta la quita', 'mt-5' not in clases("c => tagDe(c) === 'div'"))
    pg.locator('#cls-aplicadas [data-quitar="mb-4"]').click(); pg.wait_for_timeout(200)
    check('la ✕ de «aplicadas» quita la clase', 'mb-4' not in clases("c => tagDe(c) === 'div'"))
    pg.fill('#cls-buscar', 'mi-clase'); pg.wait_for_timeout(150)
    check('una clase que no existe se ofrece como nueva', pg.locator('#cls-lista .cls-nueva').count() == 1)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    check('…y se añade', 'mi-clase' in clases("c => tagDe(c) === 'div'"))
    check('se ve en el HTML exportable', 'mi-clase' in E("editor.getHtml()") and 'shadow-sm' in E("editor.getHtml()"))

    print('5. Categorías')
    pg.fill('#cls-buscar', ''); pg.click('.cls-cat[data-cat=responsive]'); pg.wait_for_timeout(150)
    check('la categoría «Según la pantalla» lista d-md-none', 'd-md-none' in filas())
    pg.click('.cls-cat[data-cat=proyecto]'); pg.wait_for_timeout(150)
    check('«Del proyecto» lista las clases propias', {'caja', 'mi-clase'} <= set(filas()), filas())
    pg.click('.cls-cat[data-cat=sitio]'); pg.wait_for_timeout(150)
    check('«Del sitio» explica las clases de las plantillas', 'btn-sitio' in filas() and 'eyebrow' in filas())
    E("editor.select(null)"); pg.wait_for_timeout(200)
    check('sin selección el explorador se oculta', not pg.is_visible('#clases-box'))
    E("editor.select(buscarComp(editor.getWrapper(), c => tagDe(c) === 'div')[0])"); pg.wait_for_timeout(300)
    pg.screenshot(path='pruebas/clases-explorador.png')

    check('sin errores de JavaScript', not err, err[:5])
    print(f'\nRESULTADO: {len(OK)} correctas, {len(FAIL)} fallidas')
    b.close()
