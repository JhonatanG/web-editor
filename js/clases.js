/* =====================================================================
   Explorador de clases
   Catálogo de las clases de Bootstrap 5 y de las del sitio, con una
   descripción breve de cada una. Se buscan en español («centrar»,
   «sombra»), se previsualizan al pasar el ratón y se añaden con un clic.
   Las clases de un mismo grupo se reemplazan entre sí (mt-1 → mt-3).
===================================================================== */
const CLASES = [];        // { c: clase, d: descripción, cat, g: grupo excluyente, k: palabras extra }
const CATS_CLASES = [];   // [{ id, nombre, icono }]

function defCat(id, nombre, icono) { CATS_CLASES.push({ id, nombre, icono }); }
function def(cat, g, lista, k = '') {
  lista.forEach(([c, d, kk]) => CLASES.push({ c, d, cat, g: g || null, k: (k + ' ' + (kk || '')).trim() }));
}

const PUNTOS = { sm: 'móvil horizontal (≥576px)', md: 'tablet (≥768px)', lg: 'portátil (≥992px)', xl: 'escritorio (≥1200px)' };
const TAM_ESP = ['0 (nada)', '1 (4px)', '2 (8px)', '3 (16px)', '4 (24px)', '5 (48px)'];
const COLORES = { primary: 'azul principal', secondary: 'gris', success: 'verde (éxito)', danger: 'rojo (peligro)', warning: 'amarillo (aviso)', info: 'celeste (información)', light: 'claro', dark: 'oscuro' };

/* ---------- Texto ---------- */
defCat('texto', 'Texto', 'fonts');
def('texto', 'align', [
  ['text-start', 'Alinea el texto a la izquierda'], ['text-center', 'Centra el texto'], ['text-end', 'Alinea el texto a la derecha']
], 'alinear alineación');
Object.entries(PUNTOS).forEach(([bp, n]) => def('texto', 'align-' + bp, [
  [`text-${bp}-start`, `Texto a la izquierda desde ${n}`], [`text-${bp}-center`, `Texto centrado desde ${n}`], [`text-${bp}-end`, `Texto a la derecha desde ${n}`]
], 'alinear responsive'));
def('texto', 'fw', [
  ['fw-light', 'Letra fina'], ['fw-normal', 'Grosor normal (quita la negrita)'], ['fw-semibold', 'Seminegrita'], ['fw-bold', 'Negrita'], ['fw-bolder', 'Más negrita que el elemento padre']
], 'grosor peso fuente');
def('texto', 'fst', [['fst-italic', 'Cursiva'], ['fst-normal', 'Quita la cursiva']], 'italica');
def('texto', 'tt', [['text-uppercase', 'TODO EN MAYÚSCULAS'], ['text-lowercase', 'todo en minúsculas'], ['text-capitalize', 'Primera Letra De Cada Palabra En Mayúscula']], 'mayusculas minusculas');
def('texto', 'td', [['text-decoration-none', 'Quita el subrayado (ideal para enlaces)'], ['text-decoration-underline', 'Subraya el texto'], ['text-decoration-line-through', 'Tacha el texto (precios anteriores)']], 'subrayado');
def('texto', 'fs', [1, 2, 3, 4, 5, 6].map(n => [`fs-${n}`, `Tamaño de letra ${n} (1 = el más grande, como un h1; 6 = como un h6)`]), 'tamaño letra fuente grande pequeña');
def('texto', 'display', [1, 2, 3, 4, 5, 6].map(n => [`display-${n}`, `Título gigante de portada, nivel ${n} (1 = el más grande)`]), 'titulo enorme hero');
def('texto', 'hcomo', [1, 2, 3, 4, 5, 6].map(n => [`h${n}`, `Se ve como un título h${n} sin cambiar la etiqueta HTML`]), 'titulo aspecto');
def('texto', 'lh', [['lh-1', 'Interlineado muy junto'], ['lh-sm', 'Interlineado reducido'], ['lh-base', 'Interlineado normal'], ['lh-lg', 'Interlineado amplio']], 'espacio entre lineas');
def('texto', null, [
  ['lead', 'Párrafo destacado: letra algo más grande y ligera, para introducciones'],
  ['small', 'Texto pequeño'],
  ['text-truncate', 'Corta el texto largo con «…» en una sola línea'],
  ['text-nowrap', 'Impide que el texto salte de línea'],
  ['text-break', 'Parte palabras o enlaces muy largos para que no se salgan'],
  ['font-monospace', 'Letra de ancho fijo, como código'],
  ['user-select-all', 'Un clic selecciona todo el texto (útil para copiar códigos)'],
  ['user-select-none', 'Impide seleccionar el texto']
]);

/* ---------- Colores ---------- */
defCat('color', 'Colores', 'palette');
def('color', 'tc', [
  ...Object.entries(COLORES).map(([k, n]) => [`text-${k}`, `Texto en color ${n}`]),
  ['text-body', 'Texto en el color normal de la página'], ['text-body-secondary', 'Texto gris suave (notas, fechas)'],
  ['text-white', 'Texto blanco (sobre fondos oscuros)'], ['text-black', 'Texto negro'],
  ['text-white-50', 'Texto blanco semitransparente'], ['text-black-50', 'Texto negro semitransparente']
], 'color letra texto');
def('color', 'bg', [
  ...Object.entries(COLORES).map(([k, n]) => [`bg-${k}`, `Fondo de color ${n}`]),
  ['bg-white', 'Fondo blanco'], ['bg-black', 'Fondo negro'], ['bg-body-tertiary', 'Fondo gris muy suave'], ['bg-transparent', 'Fondo transparente']
], 'color fondo');
def('color', 'tbg', Object.entries(COLORES).map(([k, n]) => [`text-bg-${k}`, `Fondo ${n} con el color de texto que mejor se lee encima`]), 'color fondo contraste etiqueta');
def('color', null, [['bg-gradient', 'Añade un degradado suave sobre el color de fondo']], 'degradado');
def('color', 'bgop', [['bg-opacity-75', 'Color de fondo al 75%'], ['bg-opacity-50', 'Color de fondo al 50%'], ['bg-opacity-25', 'Color de fondo al 25%'], ['bg-opacity-10', 'Color de fondo al 10%']], 'transparencia');

/* ---------- Espaciado ---------- */
defCat('espacio', 'Espaciado', 'arrows-expand');
const LADOS = { '': 'en los 4 lados', t: 'arriba', b: 'abajo', s: 'a la izquierda', e: 'a la derecha', x: 'a izquierda y derecha', y: 'arriba y abajo' };
Object.entries(LADOS).forEach(([l, n]) => {
  def('espacio', 'm' + l, [...TAM_ESP.map((t, i) => [`m${l}-${i}`, `Margen (espacio por fuera) ${n}: ${t}`]),
    [`m${l}-auto`, l === 'x' ? 'Margen automático a los lados: centra un bloque con ancho fijo' : `Margen automático ${n} (empuja el elemento)`]], 'margen separar fuera espacio');
  def('espacio', 'p' + l, TAM_ESP.map((t, i) => [`p${l}-${i}`, `Relleno (espacio por dentro) ${n}: ${t}`]), 'relleno padding dentro espacio');
});
def('espacio', 'gap', TAM_ESP.map((t, i) => [`gap-${i}`, `Separación entre los hijos de un flex o grid: ${t}`]), 'separacion hueco');

/* ---------- Bordes y sombras ---------- */
defCat('borde', 'Bordes y sombras', 'border-style');
def('borde', null, [
  ['border', 'Borde fino en los 4 lados'], ['border-0', 'Quita todos los bordes'],
  ['border-top', 'Borde solo arriba'], ['border-bottom', 'Borde solo abajo'], ['border-start', 'Borde solo a la izquierda'], ['border-end', 'Borde solo a la derecha']
], 'borde linea');
def('borde', 'bc', [...Object.entries(COLORES).map(([k, n]) => [`border-${k}`, `Borde de color ${n} (úsala junto a «border»)`]), ['border-white', 'Borde blanco']], 'color borde');
def('borde', 'bw', [1, 2, 3, 4, 5].map(n => [`border-${n}`, `Grosor del borde: ${n}px`]), 'grosor borde');
def('borde', 'rnd', [
  ['rounded', 'Esquinas redondeadas'], ['rounded-0', 'Esquinas rectas'], ['rounded-1', 'Esquinas apenas redondeadas'], ['rounded-3', 'Esquinas bastante redondeadas'],
  ['rounded-4', 'Esquinas muy redondeadas'], ['rounded-5', 'Esquinas redondeadas al máximo'], ['rounded-circle', 'Círculo (para fotos cuadradas, como avatares)'], ['rounded-pill', 'Forma de píldora (botones, etiquetas)']
], 'redondear esquinas circulo');
def('borde', 'sh', [['shadow-none', 'Sin sombra'], ['shadow-sm', 'Sombra suave'], ['shadow', 'Sombra normal'], ['shadow-lg', 'Sombra grande y marcada']], 'sombra relieve elevar');

/* ---------- Tamaño ---------- */
defCat('tamano', 'Tamaño', 'aspect-ratio');
def('tamano', 'w', [['w-25', 'Ancho: 25% del contenedor'], ['w-50', 'Ancho: la mitad del contenedor'], ['w-75', 'Ancho: 75% del contenedor'], ['w-100', 'Ancho completo (100%)'], ['w-auto', 'Ancho automático según el contenido']], 'ancho');
def('tamano', 'h', [['h-25', 'Alto: 25% del contenedor'], ['h-50', 'Alto: la mitad'], ['h-75', 'Alto: 75%'], ['h-100', 'Alto completo del contenedor'], ['h-auto', 'Alto automático']], 'alto altura');
def('tamano', null, [
  ['mw-100', 'Nunca más ancho que su contenedor'], ['mh-100', 'Nunca más alto que su contenedor'],
  ['min-vh-100', 'Al menos tan alto como la pantalla (portadas)'], ['vh-100', 'Exactamente el alto de la pantalla'], ['vw-100', 'Exactamente el ancho de la pantalla']
], 'pantalla completa');

/* ---------- Distribución ---------- */
defCat('flex', 'Distribución (flex)', 'distribute-horizontal');
def('flex', 'd', [
  ['d-flex', 'Pone a los hijos en fila y permite alinearlos (flexbox)'], ['d-inline-flex', 'Como d-flex, pero ocupa solo lo necesario'],
  ['d-block', 'Se muestra como bloque (ocupa toda la línea)'], ['d-inline-block', 'En línea, pero acepta ancho, alto y márgenes'],
  ['d-inline', 'En línea con el texto'], ['d-grid', 'Cuadrícula: apila hijos (con gap, botones a todo el ancho)'], ['d-none', 'Oculta el elemento']
], 'mostrar ocultar display');
def('flex', 'fd', [['flex-row', 'Hijos en fila (horizontal)'], ['flex-column', 'Hijos en columna (uno debajo de otro)'], ['flex-row-reverse', 'Fila en orden inverso'], ['flex-column-reverse', 'Columna en orden inverso']], 'direccion vertical horizontal');
Object.entries(PUNTOS).forEach(([bp, n]) => def('flex', 'fd-' + bp, [[`flex-${bp}-row`, `Hijos en fila desde ${n} (en pantallas menores, en columna)`], [`flex-${bp}-column`, `Hijos en columna desde ${n}`]], 'responsive direccion'));
def('flex', 'jc', [
  ['justify-content-start', 'Hijos al inicio de la fila'], ['justify-content-center', 'Hijos centrados horizontalmente'], ['justify-content-end', 'Hijos al final de la fila'],
  ['justify-content-between', 'Hijos repartidos: el primero al inicio y el último al final'], ['justify-content-around', 'Hijos con el mismo espacio alrededor'], ['justify-content-evenly', 'Hijos con espacios exactamente iguales']
], 'centrar horizontal repartir alinear');
def('flex', 'ai', [
  ['align-items-start', 'Hijos alineados arriba'], ['align-items-center', 'Hijos centrados verticalmente'], ['align-items-end', 'Hijos alineados abajo'],
  ['align-items-baseline', 'Hijos alineados por la línea del texto'], ['align-items-stretch', 'Hijos estirados a la misma altura']
], 'centrar vertical alinear');
def('flex', 'as', [['align-self-start', 'Este elemento arriba (dentro de un flex)'], ['align-self-center', 'Este elemento centrado verticalmente'], ['align-self-end', 'Este elemento abajo']], 'alinear');
def('flex', 'fw', [['flex-wrap', 'Si no caben, los hijos pasan a la siguiente línea'], ['flex-nowrap', 'Los hijos siempre en una sola línea']], 'saltar linea envolver');
def('flex', 'ord', [['order-first', 'Muestra este elemento el primero'], ['order-last', 'Muestra este elemento el último']], 'orden');
def('flex', null, [['flex-grow-1', 'Ocupa todo el espacio libre de la fila'], ['flex-fill', 'Reparte el espacio por igual con sus hermanos'], ['flex-shrink-0', 'No se encoge aunque falte espacio']], 'crecer');
def('flex', 'fl', [['float-start', 'Flota a la izquierda (el texto la rodea)'], ['float-end', 'Flota a la derecha (el texto la rodea)'], ['float-none', 'Quita el flotado']], 'flotar');

/* ---------- Cuadrícula ---------- */
defCat('grid', 'Cuadrícula', 'grid-3x3-gap');
def('grid', 'cont', [['container', 'Contenedor centrado con ancho máximo según la pantalla'], ['container-fluid', 'Contenedor a todo el ancho']], 'contenedor centrar');
def('grid', null, [['row', 'Fila de la cuadrícula: sus hijos son columnas «col-…»']], 'fila columnas');
def('grid', 'col', [['col', 'Columna que reparte el espacio por igual'], ['col-auto', 'Columna del ancho de su contenido'],
  ...[1, 2, 3, 4, 6, 8, 12].map(n => [`col-${n}`, `Columna de ${n}/12 en todas las pantallas`])], 'columna ancho');
Object.entries(PUNTOS).forEach(([bp, n]) => def('grid', 'col-' + bp, [3, 4, 6, 8, 12].map(k => [`col-${bp}-${k}`,
  `Desde ${n}: ocupa ${k}/12${k === 12 ? ' (todo el ancho)' : k === 6 ? ' (la mitad)' : k === 4 ? ' (un tercio)' : k === 3 ? ' (un cuarto)' : ''}; antes, todo el ancho`]), 'columna responsive'));
def('grid', 'rc', [1, 2, 3, 4].map(n => [`row-cols-${n}`, `Fila: cada hijo ocupa 1/${n} (${n} por fila)`]), 'columnas por fila');
Object.entries(PUNTOS).forEach(([bp, n]) => def('grid', 'rc-' + bp, [2, 3, 4].map(k => [`row-cols-${bp}-${k}`, `Fila: ${k} hijos por fila desde ${n}`]), 'columnas por fila responsive'));
def('grid', 'gut', TAM_ESP.map((t, i) => [`g-${i}`, `Separación entre columnas de la fila: ${t}`]), 'separacion canal gutter');

/* ---------- Mostrar / ocultar según pantalla ---------- */
defCat('responsive', 'Según la pantalla', 'phone');
Object.entries(PUNTOS).forEach(([bp, n]) => def('responsive', 'd-' + bp, [
  [`d-${bp}-none`, `Se oculta desde ${n}`], [`d-${bp}-block`, `Se muestra (bloque) desde ${n}; combínala con d-none para ocultarlo antes`], [`d-${bp}-flex`, `Se vuelve flex desde ${n}`]
], 'ocultar mostrar movil celular tablet escritorio responsive'));
def('responsive', null, [['d-print-none', 'No aparece al imprimir la página']], 'imprimir');

/* ---------- Posición ---------- */
defCat('pos', 'Posición', 'pin-angle');
def('pos', 'pos', [
  ['position-relative', 'Referencia para colocar hijos con position-absolute'], ['position-absolute', 'Se coloca libremente respecto al padre relativo'],
  ['position-fixed', 'Fijo en la pantalla aunque se haga scroll'], ['position-sticky', 'Se queda pegado al llegar arriba al hacer scroll'], ['position-static', 'Posición normal']
], 'posicion');
def('pos', null, [
  ['top-0', 'Pegado arriba (con position-…)'], ['bottom-0', 'Pegado abajo'], ['start-0', 'Pegado a la izquierda'], ['end-0', 'Pegado a la derecha'],
  ['top-50', 'A la mitad del alto'], ['start-50', 'A la mitad del ancho'], ['translate-middle', 'Centra exactamente (con top-50 y start-50)'],
  ['fixed-top', 'Fijo arriba de la pantalla (menús)'], ['fixed-bottom', 'Fijo abajo de la pantalla'], ['sticky-top', 'Se queda pegado arriba al hacer scroll (menús)']
], 'pegar fijar');
def('pos', 'z', [0, 1, 2, 3].map(n => [`z-${n}`, `Capa ${n}: un número mayor queda por encima`]), 'encima capa');
def('pos', 'ov', [['overflow-hidden', 'Recorta lo que se sale del elemento'], ['overflow-auto', 'Barra de desplazamiento si el contenido no cabe'], ['overflow-visible', 'Deja ver lo que se sale']], 'recortar scroll');

/* ---------- Botones ---------- */
defCat('boton', 'Botones', 'hand-index');
def('boton', null, [['btn', 'Base de botón de Bootstrap: combínala con un color (btn-primary…)']], 'boton');
def('boton', 'btnc', [
  ...Object.entries(COLORES).map(([k, n]) => [`btn-${k}`, `Botón relleno ${n}`]),
  ...Object.entries(COLORES).map(([k, n]) => [`btn-outline-${k}`, `Botón solo con borde ${n}`]),
  ['btn-link', 'Botón con aspecto de enlace']
], 'boton color');
def('boton', 'btns', [['btn-sm', 'Botón pequeño'], ['btn-lg', 'Botón grande']], 'tamaño boton');
def('boton', null, [['stretched-link', 'Hace clicable toda la tarjeta o caja que contiene este enlace']], 'enlace tarjeta clic');

/* ---------- Imágenes ---------- */
defCat('imagen', 'Imágenes y medios', 'image');
def('imagen', null, [['img-fluid', 'La imagen se adapta al ancho disponible sin deformarse'], ['img-thumbnail', 'Imagen con marco blanco y borde redondeado']], 'imagen responsive adaptable');
def('imagen', 'of', [['object-fit-cover', 'Llena el recuadro recortando lo que sobra (sin deformar)'], ['object-fit-contain', 'Se ve entera dentro del recuadro'], ['object-fit-fill', 'Estira la imagen al recuadro (puede deformar)']], 'recortar ajustar');
def('imagen', 'ratio', [['ratio ratio-16x9', 'Proporción 16:9 para videos e iframes (añade las dos clases)'], ['ratio ratio-4x3', 'Proporción 4:3'], ['ratio ratio-1x1', 'Cuadrado']], 'proporcion video');
def('imagen', 'op', [['opacity-100', 'Totalmente visible'], ['opacity-75', 'Algo transparente (75%)'], ['opacity-50', 'Semitransparente (50%)'], ['opacity-25', 'Muy transparente (25%)']], 'transparencia opacidad');

/* ---------- Accesibilidad ---------- */
defCat('acc', 'Accesibilidad', 'universal-access');
def('acc', null, [
  ['visually-hidden', 'Oculto a la vista, pero lo leen los lectores de pantalla'],
  ['visually-hidden-focusable', 'Oculto hasta que se llega con el teclado (enlaces «Saltar al contenido»)'],
  ['pe-none', 'No responde a clics'], ['pe-auto', 'Vuelve a responder a clics']
], 'oculto lector pantalla');

/* ---------- Del sitio (plantillas de este editor) ---------- */
defCat('sitio', 'Del sitio', 'stars');
def('sitio', null, [
  ['seccion', 'Sección con mucho aire arriba y abajo (relleno amplio)'],
  ['eyebrow', 'Antetítulo pequeño, espaciado y en mayúsculas con el color de acento'],
  ['font-titulo', 'Usa la tipografía de títulos elegida en «Sitio»'], ['font-texto', 'Usa la tipografía de texto elegida en «Sitio»'],
  ['texto-primario', 'Texto con el color principal del sitio'], ['texto-acento', 'Texto con el color de acento del sitio'],
  ['img-redondeada', 'Foto 4:3 con esquinas redondeadas y sombra'], ['avatar', 'Foto pequeña y redonda (52px) para personas'],
  ['dato', 'Número grande para cifras destacadas (500+, 20 años…)'], ['parallax', 'Sección con imagen de fondo fija al hacer scroll'],
  ['overlay', 'Capa oscura sobre toda la caja (pon el padre en position-relative)']
], 'sitio tema identidad');
def('sitio', 'fondo-sitio', [['fondo-claro', 'Fondo claro del tema del sitio'], ['fondo-osc', 'Fondo oscuro del tema con texto blanco']], 'fondo color tema');
def('sitio', 'btnsitio', [
  ['btn-sitio', 'Botón píldora con el color principal del sitio'], ['btn-sitio-claro', 'Botón píldora blanco (sobre fondos oscuros)'], ['btn-sitio-borde', 'Botón píldora con borde blanco (sobre fotos)']
], 'boton');

/* ---------- Sugerencias según lo seleccionado ---------- */
const SUGERIDAS = {
  imagen: ['img-fluid', 'rounded', 'rounded-circle', 'shadow', 'img-thumbnail', 'w-100', 'object-fit-cover', 'd-block', 'mx-auto', 'img-redondeada'],
  boton:  ['btn', 'btn-primary', 'btn-outline-primary', 'btn-lg', 'btn-sm', 'btn-sitio', 'rounded-pill', 'w-100', 'text-decoration-none', 'stretched-link'],
  texto:  ['text-center', 'fw-bold', 'text-uppercase', 'lead', 'fs-4', 'text-body-secondary', 'texto-primario', 'font-titulo', 'mb-0', 'eyebrow'],
  columna:['col-md-6', 'col-lg-4', 'col-lg-3', 'col', 'col-12', 'd-flex', 'align-items-center', 'text-center', 'mb-4', 'order-first'],
  fila:   ['row', 'g-4', 'row-cols-md-2', 'row-cols-lg-3', 'align-items-center', 'justify-content-center'],
  caja:   ['container', 'd-flex', 'justify-content-center', 'align-items-center', 'gap-3', 'py-5', 'text-center', 'shadow', 'rounded', 'seccion', 'fondo-claro', 'fondo-osc']
};
function tipoParaSugerir(c) {
  if (c.is('image')) return 'imagen';
  const tag = tagDe(c), cls = c.getClasses();
  if (tag === 'a' || tag === 'button' || c.is('link') || cls.some(k => /^btn/.test(k))) return 'boton';
  if (cls.includes('row')) return 'fila';
  if (cls.some(k => /^col(-|$)/.test(k))) return 'columna';
  if (c.is('text') || /^(h[1-6]|p|span|small|strong|em|li|blockquote|label)$/.test(tag)) return 'texto';
  return 'caja';
}

/* ---------- Búsqueda ---------- */
const normal = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// «centrar» encuentra «centra», «ocultar» encuentra «oculto»…
const raizDe = t => t.length > 5 ? t.slice(0, Math.max(4, t.length - 2)) : t;
CLASES.forEach(x => { x.texto = normal(`${x.c} ${x.d} ${x.k}`); });
function buscarClases(q) {
  const ts = normal(q).split(/\s+/).filter(Boolean);
  if (!ts.length) return [];
  const exacta = normal(q).trim();
  return CLASES
    .filter(x => ts.every(t => x.texto.includes(raizDe(t))))
    .sort((a, b) => (b.c === exacta) - (a.c === exacta) || (b.c.startsWith(exacta)) - (a.c.startsWith(exacta)));
}
const infoClase = c => CLASES.find(x => x.c === c || x.c.split(' ').includes(c));

/* ---------- Panel ---------- */
(() => {
  const box = $('#clases-box'), q = $('#cls-buscar'), lista = $('#cls-lista'), cats = $('#cls-cats'), aplicadas = $('#cls-aplicadas');
  let cat = 'sugeridas', previa = null;

  cats.innerHTML = [{ id: 'sugeridas', nombre: 'Sugeridas', icono: 'lightbulb' }, ...CATS_CLASES, { id: 'proyecto', nombre: 'Del proyecto', icono: 'folder2' }]
    .map(k => `<button class="cls-cat" data-cat="${k.id}"><i class="bi bi-${k.icono}"></i> ${k.nombre}</button>`).join('');

  const sel = () => editor.getSelected();
  const tiene = (c, nombre) => nombre.split(' ').every(k => c.getClasses().includes(k));
  // Clases de un mismo grupo que hay que quitar al poner esta
  const rivales = (c, x) => !x.g ? [] : CLASES.filter(o => o.g === x.g && o.c !== x.c).flatMap(o => o.c.split(' '))
    .filter(k => c.getClasses().includes(k) && !x.c.split(' ').includes(k));

  // Clases usadas en el proyecto que no están en el catálogo
  function delProyecto() {
    const usadas = new Set();
    editor.Pages.getAll().forEach(p => recorrer(p.getMainComponent(), x => x.getClasses().forEach(k => usadas.add(k))));
    editor.Css.getRules().forEach(r => r.getSelectors().forEach(s => s.get('type') === 1 && usadas.add(s.get('name'))));
    return [...usadas].filter(k => k && !/^gjs-/.test(k) && !infoClase(k)).sort()
      .map(k => ({ c: k, d: editor.Css.getRules('.' + k).length ? 'Clase con estilos propios de este proyecto' : 'Clase usada en el proyecto (sin estilos propios en el editor)', cat: 'proyecto' }));
  }

  function filas() {
    const c = sel();
    const t = q.value.trim();
    if (t) return buscarClases(t).slice(0, 80);
    if (cat === 'sugeridas') return SUGERIDAS[tipoParaSugerir(c)].map(infoClase).filter(Boolean);
    if (cat === 'proyecto') return delProyecto();
    return CLASES.filter(x => x.cat === cat);
  }

  function pintarAplicadas() {
    const c = sel();
    const ks = c.getClasses();
    aplicadas.innerHTML = ks.length
      ? ks.map(k => { const i = infoClase(k); return `<div class="cls-ap" title="${SIN_HTML(i ? i.d : 'Clase propia')}"><code>${SIN_HTML(k)}</code><span>${SIN_HTML(i ? i.d : 'Clase propia del proyecto')}</span><button data-quitar="${SIN_HTML(k)}" title="Quitar"><i class="bi bi-x-lg"></i></button></div>`; }).join('')
      : '<p class="hint" style="margin:0 0 8px">Este elemento aún no tiene clases.</p>';
  }

  function pintar() {
    const c = sel();
    box.style.display = c ? '' : 'none';
    if (!c) return;
    pintarAplicadas();
    $$('.cls-cat', cats).forEach(b => b.classList.toggle('activa', !q.value.trim() && b.dataset.cat === cat));
    const t = q.value.trim(), xs = filas();
    let html = xs.map(x => `<button class="cls-fila${tiene(c, x.c) ? ' puesta' : ''}" data-clase="${SIN_HTML(x.c)}">
        <code>${SIN_HTML(x.c)}</code><span>${SIN_HTML(x.d)}</span><i class="bi ${tiene(c, x.c) ? 'bi-check-circle-fill' : 'bi-plus-circle'}"></i></button>`).join('');
    // Lo escrito, si no existe, se puede añadir como clase nueva
    if (t && /^-?[a-zA-Z_][\w-]*$/.test(t) && !xs.some(x => x.c === t))
      html = `<button class="cls-fila cls-nueva" data-clase="${SIN_HTML(t)}"><code>${SIN_HTML(t)}</code><span>Añadir como clase nueva (luego dale estilo abajo)</span><i class="bi bi-plus-circle"></i></button>` + html;
    lista.innerHTML = html || `<p class="hint">No hay clases que coincidan con «${SIN_HTML(t)}». Prueba con otra palabra: centrar, sombra, margen, ocultar…</p>`;
  }

  // Vista previa: se prueba la clase en el lienzo sin tocar el proyecto
  function previsualizar(nombre) {
    quitarPrevia();
    const c = sel(), el = c && c.getEl();
    if (!el || tiene(c, nombre)) return;
    const x = infoClase(nombre) || { c: nombre };
    const fuera = rivales(c, x).filter(k => el.classList.contains(k));
    fuera.forEach(k => el.classList.remove(k));
    const nuevas = nombre.split(' ').filter(k => !el.classList.contains(k));
    nuevas.forEach(k => el.classList.add(k));
    previa = { el, nuevas, fuera };
    editor.refresh();
  }
  function quitarPrevia() {
    if (!previa) return;
    previa.nuevas.forEach(k => previa.el.classList.remove(k));
    previa.fuera.forEach(k => previa.el.classList.add(k));
    previa = null;
    editor.refresh();
  }

  function alternar(nombre) {
    const c = sel();
    if (!c) return;
    quitarPrevia();
    const x = infoClase(nombre) || { c: nombre };
    if (tiene(c, nombre)) {
      nombre.split(' ').forEach(k => c.removeClass(k));
    } else {
      const fuera = rivales(c, x);
      fuera.forEach(k => c.removeClass(k));
      c.addClass(nombre.split(' '));
      toast(fuera.length ? `«${nombre}» reemplaza a «${fuera.join(' ')}»` : `Clase «${nombre}» añadida`, 1800);
    }
    pintar();
  }

  lista.addEventListener('click', (e) => { const b = e.target.closest('.cls-fila'); if (b) alternar(b.dataset.clase); });
  lista.addEventListener('mouseover', (e) => { const b = e.target.closest('.cls-fila'); if (b && (!previa || b.dataset.clase !== previa.nombre)) { previsualizar(b.dataset.clase); if (previa) previa.nombre = b.dataset.clase; } });
  lista.addEventListener('mouseleave', quitarPrevia);
  aplicadas.addEventListener('click', (e) => {
    const b = e.target.closest('[data-quitar]');
    if (b) { sel().removeClass(b.dataset.quitar); pintar(); }
  });
  cats.addEventListener('click', (e) => {
    const b = e.target.closest('.cls-cat');
    if (!b) return;
    cat = b.dataset.cat; q.value = ''; pintar();
    b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    lista.scrollTop = 0;
  });
  // La rueda del ratón desliza la fila de categorías
  cats.addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { cats.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  q.addEventListener('input', pintar);
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const b = $('.cls-fila', lista); if (b) alternar(b.dataset.clase); }
    if (e.key === 'Escape') { q.value = ''; pintar(); }
  });

  editor.on('component:selected component:deselected', () => { quitarPrevia(); q.value = ''; pintar(); });
  editor.on('component:update:classes', () => { if (!previa) pintar(); });
  pintar();
})();
