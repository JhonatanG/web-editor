/* =====================================================================
   Tipos de componente propios
   Se registran como plugin para que existan ANTES de cargar el proyecto
   guardado: así un botón o un video de fondo ya guardado se reconoce bien.
===================================================================== */
function tiposPropios(ed) {
  /* ---------- Botones ----------
     El tipo "button" del plugin de formularios reemplazaba el contenido del
     botón (por ejemplo el ícono de hamburguesa) por el texto "Send".
     Se sustituye por dos tipos que respetan el contenido original. */
  const dc = ed.DomComponents;
  const soloTexto = (el) => el.childNodes.length > 0 && [...el.childNodes].every(n => n.nodeType === 3);
  const traits = ['id', 'title', {
    type: 'select', name: 'type', label: 'Tipo',
    options: [
      { id: 'button', name: 'Botón' },
      { id: 'submit', name: 'Enviar (submit)' },
      { id: 'reset',  name: 'Restablecer' }
    ]
  }];
  dc.addType('btn-text', {
    extend: 'text',
    isComponent: el => el.tagName === 'BUTTON' && soloTexto(el) && { type: 'btn-text' },
    model: { defaults: { tagName: 'button', traits } }
  });
  dc.addType('btn-plain', {
    extend: 'default',
    isComponent: el => el.tagName === 'BUTTON' && !soloTexto(el) && { type: 'btn-plain' },
    model: { defaults: { tagName: 'button', droppable: true, traits } }
  });

  // Enlaces: propiedades en español y casilla para abrir en otra pestaña
  dc.addType('link', {
    model: {
      defaults: {
        traits: [
          { type: 'text', name: 'href', label: 'Dirección (URL)', placeholder: 'https://… o pagina.html' },
          { type: 'checkbox', name: 'target', label: 'Abrir en pestaña nueva', valueTrue: '_blank', valueFalse: '' },
          { type: 'text', name: 'title', label: 'Texto al pasar el ratón', placeholder: 'Opcional' }
        ]
      }
    }
  });

  // Video de fondo del hero (clase hero-video): <video> para .mp4 o archivos,
  // <iframe> para YouTube y Vimeo (un <video> no puede reproducir esos enlaces)
  ed.DomComponents.addType('video-fondo', {
    isComponent: el => (el.tagName === 'VIDEO' || el.tagName === 'IFRAME') && el.classList && el.classList.contains('hero-video') && { type: 'video-fondo' },
    extend: 'default',
    model: {
      defaults: {
        tagName: 'video',
        droppable: false,
        attributes: { autoplay: true, muted: true, loop: true, playsinline: true },
        // El enlace del video se cambia solo en el recuadro «Video de fondo»
        // (un campo src aquí no sabría convertir YouTube/Vimeo a <iframe>)
        traits: [
          { type: 'text', name: 'poster', label: 'Imagen de portada (poster)' }
        ]
      }
    }
  });
}

/* =====================================================================
   Editor
===================================================================== */
const editor = grapesjs.init({
  container: '#gjs',
  height: '100%',
  width: 'auto',
  fromElement: false,
  telemetry: false,
  panels: { defaults: [] },

  // Interfaz de GrapesJS en español (lo que no esté aquí queda en inglés)
  i18n: {
    locale: 'es', detectLocale: false, localeFallback: 'en',
    messages: { es: {
      assetManager: { addButton: 'Añadir imagen', inputPlh: 'https://sitio.com/imagen.jpg', modalTitle: 'Elegir imagen', uploadTitle: 'Arrastra aquí tus imágenes o haz clic para elegirlas' },
      domComponents: { names: { '': 'Caja', wrapper: 'Cuerpo', text: 'Texto', comment: 'Comentario', image: 'Imagen', video: 'Video', label: 'Etiqueta', link: 'Enlace', map: 'Mapa', table: 'Tabla', row: 'Fila de tabla', cell: 'Celda', tbody: 'Cuerpo de tabla', thead: 'Encabezado de tabla', tfoot: 'Pie de tabla' } },
      layerManager: { layers: 'Capas' },
      selectorManager: { label: 'Clases', selected: 'Seleccionado', emptyState: '- Estado -', states: { hover: 'Al pasar el ratón', active: 'Al hacer clic', 'nth-of-type(2n)': 'Pares' } },
      styleManager: {
        empty: 'Selecciona un elemento del lienzo para cambiar su estilo', layer: 'Capa', fileButton: 'Imágenes',
        sectors: { general: 'General', layout: 'Disposición', typography: 'Texto y tipografía', decorations: 'Fondo, bordes y sombras', extra: 'Efectos', flex: 'Flex (alinear hijos)', dimension: 'Tamaño y espacios' },
        properties: {
          float: 'Flotar', display: 'Visualización', position: 'Posición', top: 'Arriba', right: 'Derecha', left: 'Izquierda', bottom: 'Abajo',
          width: 'Ancho', height: 'Alto', 'max-width': 'Ancho máximo', 'min-height': 'Alto mínimo', margin: 'Margen (exterior)', padding: 'Relleno (interior)',
          'font-family': 'Fuente', 'font-size': 'Tamaño de letra', 'font-weight': 'Grosor', 'letter-spacing': 'Espacio entre letras', color: 'Color del texto',
          'line-height': 'Interlineado', 'text-align': 'Alineación', 'text-shadow': 'Sombra del texto', 'background-color': 'Color de fondo',
          'border-radius': 'Redondeo de esquinas', border: 'Borde', 'box-shadow': 'Sombra', background: 'Fondo (imagen)', opacity: 'Opacidad',
          transition: 'Transición', transform: 'Transformación', perspective: 'Perspectiva',
          'margin-top': 'Arriba', 'margin-right': 'Derecha', 'margin-bottom': 'Abajo', 'margin-left': 'Izquierda', 'padding-top': 'Arriba', 'padding-right': 'Derecha', 'padding-bottom': 'Abajo', 'padding-left': 'Izquierda',
          'border-top-left-radius': 'Arriba izq.', 'border-top-right-radius': 'Arriba der.', 'border-bottom-left-radius': 'Abajo izq.', 'border-bottom-right-radius': 'Abajo der.', 'border-width': 'Grosor', 'border-style': 'Estilo', 'border-color': 'Color',
          'background-image': 'Imagen', 'background-repeat': 'Repetir', 'background-position': 'Posición', 'background-attachment': 'Fija al desplazar', 'background-size': 'Tamaño', 'text-decoration': 'Subrayado', 'font-style': 'Cursiva',
          'flex-direction': 'Dirección', 'flex-wrap': 'Salto de línea', 'justify-content': 'Alinear en horizontal', 'align-items': 'Alinear en vertical', 'align-content': 'Alinear líneas', order: 'Orden', 'flex-basis': 'Base', 'flex-grow': 'Crecer', 'flex-shrink': 'Encoger', 'align-self': 'Alinear este'
        }
      },
      traitManager: {
        empty: 'Selecciona un elemento del lienzo para ver sus propiedades', label: 'Propiedades',
        traits: { labels: { id: 'Id', alt: 'Texto alternativo', title: 'Título', href: 'Dirección (URL)', target: 'Abrir en', placeholder: 'Texto de ayuda', name: 'Nombre', required: 'Obligatorio', value: 'Valor', type: 'Tipo', src: 'Origen', poster: 'Portada', autoplay: 'Reproducir solo', loop: 'Repetir', controls: 'Controles' },
          options: { target: { false: 'Esta ventana', _blank: 'Pestaña nueva' } } }
      }
    } }
  },

  storageManager: {
    type: 'idb',
    autosave: true,
    autoload: true,
    stepsBeforeSave: 1     // guarda tras cada cambio: cerrar la pestaña no pierde nada
  },

  plugins: [almacenIDB, 'grapesjs-plugin-forms', 'grapesjs-custom-code', 'grapesjs-parser-postcss', tiposPropios],
  pluginsOpts: {
    // Los bloques de formulario los definimos nosotros con clases de Bootstrap 5.
    // El plugin solo aporta los tipos de componente y sus propiedades (name, placeholder, required…).
    'grapesjs-plugin-forms': { blocks: [] },
    'grapesjs-custom-code': { blockCustomCode: { label: 'Código HTML/JS', category: CAT.adv } }
  },

  // Las imágenes subidas se guardan dentro del proyecto (base64) y al
  // exportar se extraen a la carpeta assets/. Sin esto, «Subir» no hacía nada.
  assetManager: {
    embedAsBase64: true,
    upload: false,
    uploadText: 'Arrastra aquí tus imágenes o haz clic para elegirlas',
    addBtnText: 'Añadir imagen por URL',
    modalTitle: 'Elegir imagen'
  },

  blockManager:    { appendTo: '#blocks' },
  layerManager:    { appendTo: '#layers' },
  selectorManager: { appendTo: '#selectors', componentFirst: true },
  styleManager:    { appendTo: '#styles' },
  traitManager:    { appendTo: '#traits' },

  // Selector de color: se muestra en <body> para que los paneles laterales
  // (con overflow oculto) no lo recorten, y con una paleta de colores de Bootstrap.
  colorPicker: {
    appendTo: 'body',
    showPalette: true,
    showAlpha: true,
    showInput: true,
    showInitial: true,
    allowEmpty: true,
    showSelectionPalette: true,
    maxSelectionSize: 10,
    preferredFormat: 'hex',
    localStorageKey: 'bs5-editor-colores',
    palette: [
      ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545', '#fd7e14'],
      ['#ffc107', '#198754', '#20c997', '#0dcaf0', '#212529', '#6c757d'],
      ['#adb5bd', '#dee2e6', '#f8f9fa', '#ffffff', '#000000', '#7c5cff']
    ]
  },

  deviceManager: {
    devices: [
      { id: 'desktop', name: 'Escritorio', width: '' },
      { id: 'tablet',  name: 'Tablet', width: '768px', widthMedia: '991px' },
      { id: 'mobile',  name: 'Móvil',  width: '375px', widthMedia: '575px' }
    ]
  },

  canvas: {
    styles: [
      'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
      'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
      gfUrl(FUENTES)
    ],
    scripts: [
      'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
    ]
  }
});

/* =====================================================================
   Correcciones y ayudas del editor
===================================================================== */

/* ---------- 1. Colores: las clases de utilidad de Bootstrap (bg-*, text-*,
   border-*) usan !important y ganan a cualquier estilo del panel.
   Al cambiar el color desde el panel se quitan las que entran en conflicto. ---------- */
(() => {
  const UTIL = {
    'background-color': /^(bg-(?!opacity|gradient).+|text-bg-.+)$/,
    'color': /^(text-(primary|secondary|success|danger|warning|info|light|dark|body|muted|white|black|body-secondary|body-tertiary|body-emphasis|.+-emphasis)|link-.+|text-bg-.+)$/,
    'border-color': /^border-(primary|secondary|success|danger|warning|info|light|dark|white|black)$/,
    'border-width': /^border-[1-5]$/
  };
  // border, border-bottom… pintan con var(--bs-border-*) y !important: el
  // valor del panel solo llega a esos bordes copiándolo en la variable.
  const LADO = /^border(-top|-bottom|-start|-end)?$/;
  const VAR = { 'border-color': '--bs-border-color', 'border-width': '--bs-border-width', 'border-style': '--bs-border-style' };
  const aVariables = (comp) => {
    if (!comp.getClasses().some(c => LADO.test(c))) return;
    const st = comp.getStyle(), nuevo = { ...st };
    Object.entries(VAR).forEach(([prop, nom]) => {
      if (st[prop]) nuevo[nom] = st[prop]; else delete nuevo[nom];
    });
    if (JSON.stringify(nuevo) !== JSON.stringify(st)) comp.setStyle(nuevo);
  };
  // Los eventos no siempre dicen qué propiedad cambió: se revisan todas
  const liberar = (comp) => {
    if (!comp || !comp.getClasses || !comp.getStyle) return;
    const st = comp.getStyle();
    Object.entries(UTIL).forEach(([prop, re]) => {
      if (st[prop]) comp.getClasses().filter(c => re.test(c)).forEach(c => comp.removeClass(c));
    });
    aVariables(comp);
  };
  editor.on('component:styleUpdate', comp => liberar(comp));
  editor.on('style:property:update', () => liberar(editor.getSelected()));
  // «Borde» escribe grosor, estilo y color por separado: elegir solo el color
  // ya no pone «border: 0 solid …», que borraba los bordes que el elemento tenía.
  editor.on('load', () => {
    const b = editor.StyleManager.getProperty('decorations', 'border');
    if (b) b.set('detached', true);
  });
})();

/* ---------- 2. Selector de color: se coloca junto al cuadro pulsado ---------- */
(() => {
  let punto = { x: window.innerWidth - 40, y: 200 };
  document.addEventListener('mousedown', (e) => { punto = { x: e.clientX, y: e.clientY }; }, true);
  const colocar = (el) => {
    if (el.classList.contains('sp-hidden')) return;
    const w = el.offsetWidth, h = el.offsetHeight, m = 8;
    let left = punto.x - w - 14;
    if (left < m) left = Math.min(punto.x + 14, window.innerWidth - w - m);
    const top = Math.min(Math.max(m, punto.y - 30), Math.max(m, window.innerHeight - h - m));
    el.style.setProperty('position', 'fixed', 'important');
    el.style.setProperty('left', left + 'px', 'important');
    el.style.setProperty('top', top + 'px', 'important');
  };
  new MutationObserver(() => {
    document.querySelectorAll('.sp-container:not(.sp-hidden)').forEach(colocar);
  }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
})();

/* ---------- 3. Lienzo: estilos propios del editor ----------
   El menú plegado (hamburguesa) se ve cerrado, igual que en el sitio real.
   Para editar sus opciones basta seleccionar la hamburguesa o cualquier
   cosa de dentro (también desde «Capas»): el editor lo despliega con la
   clase ed-abierto, que solo existe en el lienzo y nunca se guarda.
   En la vista previa estos estilos se desactivan. */
const BPS = { sm: 575.98, md: 767.98, lg: 991.98, xl: 1199.98, xxl: 1399.98 };
let estiloEditor = null, estiloPrevia = null;
function inyectarEstiloCanvas(doc) {
  if (!doc || !doc.head) return;
  let st = doc.getElementById('ed-extra');
  if (!st) {
    st = doc.createElement('style');
    st.id = 'ed-extra';
    st.textContent = Object.entries(BPS).map(([k, px]) =>
      `@media (max-width:${px}px){.navbar-expand-${k} .navbar-collapse.ed-abierto{display:block !important;}}`
    ).join('\n') +
      '\n.navbar:not([class*="navbar-expand"]) .navbar-collapse.ed-abierto{display:block !important;}' +
      '\n@media (max-width:767.98px){.menu-lateral.ed-abierto{display:block !important;}}' +
      '\n.ed-abierto{outline:2px dashed #a08bff;outline-offset:-2px}' +
      '\n.nav-transparente.fixed-top{position:absolute !important;}';
    doc.head.appendChild(st);
  }
  let ss = doc.getElementById('ed-site');
  if (!ss) {
    ss = doc.createElement('style');
    ss.id = 'ed-site';
    ss.textContent = SITE_CSS;
    doc.head.appendChild(ss);
  }
  // El tema va después de site.css para que sus variables ganen.
  let tv = doc.getElementById('ed-tema');
  if (!tv) {
    tv = doc.createElement('style');
    tv.id = 'ed-tema';
    doc.head.appendChild(tv);
  }
  tv.textContent = temaCss();
  // GrapesJS bloquea los clics en videos e iframes (gjs-no-pointer) para poder
  // seleccionarlos; en la vista previa se reactivan para poder reproducirlos.
  let pv = doc.getElementById('ed-previa');
  if (!pv) {
    pv = doc.createElement('style');
    pv.id = 'ed-previa';
    pv.textContent = '.gjs-no-pointer{pointer-events:auto !important}';
    doc.head.appendChild(pv);
  }
  estiloEditor = st;
  estiloPrevia = pv;
  st.disabled = document.body.classList.contains('is-preview');
  pv.disabled = !st.disabled;
}

// Repinta el tema en el lienzo actual (al mover un control del panel «Sitio»)
function pintarTema() {
  try {
    const doc = editor.Canvas.getDocument();
    if (!doc || !doc.head) return;
    let tv = doc.getElementById('ed-tema');
    if (!tv) {
      tv = doc.createElement('style');
      tv.id = 'ed-tema';
      doc.head.appendChild(tv);
    }
    tv.textContent = temaCss();
  } catch (e) { /* el lienzo aún no está listo */ }
}
/* ---------- Enlaces dentro del lienzo ----------
   GrapesJS cancela la navegación de los enlaces en el lienzo (si no, al
   editar un menú se saldría de la página). En Vista previa la resolvemos
   a mano: #seccion desplaza, pagina.html abre esa página del proyecto
   (manteniendo la vista previa) y una web externa se abre en otra pestaña. */
let saltoPendiente = '';      // #seccion a la que ir cuando cargue la otra página
let ultimoAvisoEnlace = 0;
function seguirEnlace(doc, destino) {
  const [archivo, hash] = destino.split('#');
  if (!archivo) {                                       // #seccion en esta página
    let el = null;
    try { el = doc.querySelector('#' + CSS.escape(hash)); } catch (e) { el = null; }
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else toast('En esta página no hay ninguna sección con id ' + hash);
    return;
  }
  if (esExterno(destino)) {
    if (/^https?:|^\/\//i.test(destino)) window.open(destino, '_blank', 'noopener');
    else toast('Enlace ' + destino.split(':')[0] + ': funciona en el sitio publicado');
    return;
  }
  const pag = editor.Pages.getAll().find(p => archivoDePagina(p) === archivo.toLowerCase());
  if (!pag) { toast('El sitio no tiene ninguna página ' + archivo); return; }
  if (pag === editor.Pages.getSelected()) { seguirEnlace(doc, hash ? '#' + hash : '#'); if (!hash) doc.defaultView.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  saltoPendiente = hash || '';
  editor.Pages.select(pag);
}
function activarAnclasCanvas(doc) {
  if (!doc || doc.__anclasListas) return;
  doc.__anclasListas = true;
  doc.addEventListener('click', (ev) => {
    const t = ev.target && ev.target.closest ? ev.target.closest('a[href], [data-ir-a]') : null;
    if (!t) return;
    const destino = (t.getAttribute('data-ir-a') || t.getAttribute('href') || '').trim();
    // Los controles de Bootstrap (menú, pestañas, modales…) usan href="#": se dejan pasar
    if (!destino || destino === '#' || /^javascript:/i.test(destino) || t.hasAttribute('data-bs-toggle')) return;
    if (!document.body.classList.contains('is-preview')) {
      // En modo edición el clic sirve para seleccionar y editar el enlace.
      if (Date.now() - ultimoAvisoEnlace > 15000) {
        ultimoAvisoEnlace = Date.now();
        toast('Este enlace va a «' + destino + '». Pruébalo en «Vista previa» (Ctrl+P).', 3000);
      }
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    seguirEnlace(doc, destino);
  }, true);   // fase de captura: corre antes que los manejadores de GrapesJS
}

editor.on('canvas:frame:load', (arg) => {
  const win = arg && arg.window;
  const el = arg && arg.el;
  const doc = (win && win.document) || (el && el.contentDocument);
  inyectarEstiloCanvas(doc);
  activarAnclasCanvas(doc);
  bloquearHamburguesa(doc);
  if (doc && doc.defaultView) bucleFondoYT(doc.defaultView);
  setTimeout(actualizarAncho, 100);
  // Llegamos desde un enlace pagina.html#seccion de la vista previa
  if (saltoPendiente && doc) {
    const h = saltoPendiente; saltoPendiente = '';
    setTimeout(() => seguirEnlace(doc, '#' + h), 350);
  }
});

/* ---------- Menú plegado: desplegarlo mientras se edita ----------
   Se abre al seleccionar la hamburguesa o algo de dentro del menú, y se
   cierra al seleccionar cualquier otra cosa. Mientras se edita, el clic en
   la hamburguesa NO llega a Bootstrap: si no, el menú se abría y se cerraba
   por su cuenta y quedaba desincronizado. */
const SEL_PLEGABLE = '.navbar-collapse, .menu-lateral';
function plegableDe(el) {
  if (!el || !el.closest) return null;
  const dentro = el.closest(SEL_PLEGABLE);
  if (dentro) return dentro;
  const tg = el.closest('.navbar-toggler, [data-bs-toggle="collapse"]');
  if (!tg) return null;
  const sel = tg.getAttribute('data-bs-target') || tg.getAttribute('href') || '';
  let destino = null;
  try { destino = sel && sel !== '#' ? el.ownerDocument.querySelector(sel) : null; } catch (e) { destino = null; }
  return destino && destino.matches(SEL_PLEGABLE) ? destino : null;
}
let avisoMenu = false;
function abrirMenuDeSeleccion() {
  const doc = editor.Canvas.getDocument();
  if (!doc || document.body.classList.contains('is-preview')) return;
  bloquearHamburguesa(doc);
  const c = editor.getSelected();
  const abrir = plegableDe(c && c.getEl && c.getEl());
  doc.querySelectorAll('.ed-abierto').forEach(el => { if (el !== abrir) el.classList.remove('ed-abierto'); });
  if (!abrir) return;
  const plegado = doc.defaultView.getComputedStyle(abrir).display === 'none';
  abrir.classList.add('ed-abierto');
  if (plegado && !avisoMenu) {
    avisoMenu = true;
    toast('Menú desplegado para que edites sus opciones. Selecciona otra cosa para plegarlo.', 3500);
  }
}
editor.on('component:selected component:deselected', () => setTimeout(abrirMenuDeSeleccion, 0));

function bloquearHamburguesa(doc) {
  const win = doc && doc.defaultView;
  if (!win || win.__hamburguesa) return;
  win.__hamburguesa = true;
  // Bootstrap 5.3 escucha en document EN FASE DE CAPTURA, antes que nadie.
  // Por eso se intercepta aún antes, en window: durante ese clic se le
  // esconde el data-bs-toggle (Bootstrap no lo reconoce) y se repone al
  // instante. GrapesJS recibe el clic normal y selecciona la hamburguesa.
  win.addEventListener('click', (ev) => {
    if (document.body.classList.contains('is-preview')) return;
    const tg = ev.target && ev.target.closest ? ev.target.closest('.navbar-toggler[data-bs-toggle]') : null;
    if (!tg) return;
    const v = tg.getAttribute('data-bs-toggle');
    tg.removeAttribute('data-bs-toggle');
    setTimeout(() => tg.setAttribute('data-bs-toggle', v), 0);
  }, true);
}

// Al salir de la vista previa se pliegan los menús y desplegables que el
// usuario abrió probando el sitio; si no, se quedaban abiertos en el diseño.
function cerrarAbiertos(doc) {
  if (!doc) return;
  const bs = doc.defaultView && doc.defaultView.bootstrap;
  doc.querySelectorAll('.collapse.show').forEach(el => {
    if (!el.matches(SEL_PLEGABLE)) return;
    try { bs && bs.Collapse ? bs.Collapse.getOrCreateInstance(el, { toggle: false }).hide() : el.classList.remove('show'); }
    catch (e) { el.classList.remove('show'); }
  });
  doc.querySelectorAll('.dropdown-menu.show').forEach(m => {
    const t = m.parentElement && m.parentElement.querySelector('[data-bs-toggle="dropdown"]');
    try { if (t && bs && bs.Dropdown) bs.Dropdown.getOrCreateInstance(t).hide(); else m.classList.remove('show'); }
    catch (e) { m.classList.remove('show'); }
  });
}

/* ---------- Escritorio real en el lienzo ----------
   Con los paneles abiertos al lienzo le quedan ~880 px: menos que el
   punto «xl» (1200 px) de Bootstrap. El menú salía como hamburguesa y las
   columnas col-lg se apilaban, pero en la vista previa (pantalla entera)
   todo pasaba a horizontal. Ahora en «Escritorio» el lienzo mide siempre
   1280 px de verdad y se muestra a escala para que quepa. */
const ANCHO_ESCRITORIO = 1280;
let escala = 1;
function ajustarEscala() {
  const gjs = $('#gjs');
  if (!gjs) return;
  const disponible = gjs.clientWidth - 24;
  const esEscritorio = (editor.getDevice() || 'desktop') === 'desktop';
  escala = esEscritorio && disponible > 0 && disponible < ANCHO_ESCRITORIO
    ? Math.max(0.35, disponible / ANCHO_ESCRITORIO) : 1;
  gjs.classList.toggle('escalado', escala < 1);
  gjs.style.setProperty('--z', escala);
  try { editor.Canvas.setZoom(escala * 100); } catch (e) { /* versión sin zoom */ }
  // El marco cambia de ancho con una animación: se mide al terminar
  setTimeout(actualizarAncho, 60);
  setTimeout(actualizarAncho, 500);
}
window.addEventListener('resize', () => setTimeout(ajustarEscala, 120));
editor.on('load', () => setTimeout(ajustarEscala, 50));

// Al volver a una página ya abierta antes, su lienzo no se recarga y no hay
// canvas:frame:load: se revisa aquí para no perder el salto ni los estilos.
editor.on('page:select', () => setTimeout(() => {
  const doc = editor.Canvas.getDocument();
  if (!doc || !doc.head || !doc.body) return;
  inyectarEstiloCanvas(doc);
  activarAnclasCanvas(doc);
  bloquearHamburguesa(doc);
  if (saltoPendiente && doc.readyState === 'complete') {
    const h = saltoPendiente; saltoPendiente = '';
    seguirEnlace(doc, '#' + h);
  }
}, 400));

/* ---------- 4. Panel «Sitio»: identidad visual y ajustes de exportación ---------- */
let pintarTemaUI = () => {};
(() => {
  const CAMPOS = [['primario', 't-primario'], ['osc', 't-osc'], ['claro', 't-claro'], ['acento', 't-acento'], ['fondo', 't-fondo']];
  const selTit = $('#t-titulos'), selTex = $('#t-texto');
  const rango = $('#t-radio'), rangoVal = $('#t-radio-v');

  FUENTES.forEach(f => {
    selTit.add(new Option(f.nombre, f.nombre));
    selTex.add(new Option(f.nombre, f.nombre));
  });

  const hexValido = (v) => /^#[0-9a-f]{6}$/i.test(v);

  function pintarUI() {
    CAMPOS.forEach(([clave, id]) => {
      $('#' + id).value = TEMA[clave];
      $('#' + id + '-x').value = TEMA[clave];
    });
    selTit.value = TEMA.titulos;
    selTex.value = TEMA.texto;
    rango.value = TEMA.radio;
    rangoVal.textContent = TEMA.radio + ' px';
  }

  function guardar() {
    try { localStorage.setItem(TEMA_CLAVE, JSON.stringify(TEMA)); } catch (e) { /* sin almacenamiento */ }
    pintarTema();
  }

  // Paletas predefinidas
  const cajaPresets = $('#t-presets');
  TEMA_PRESETS.forEach(p => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 't-preset';
    b.title = `${p.nombre} · ${p.titulos} + ${p.texto}`;
    b.innerHTML = `<span class="mu"><i style="background:${p.primario}"></i><i style="background:${p.osc}"></i><i style="background:${p.acento}"></i></span><span>${p.nombre}</span>`;
    b.addEventListener('click', () => {
      TEMA = { ...TEMA, ...p };
      delete TEMA.nombre;
      pintarUI(); guardar();
      toast('Identidad aplicada: ' + p.nombre);
    });
    cajaPresets.appendChild(b);
  });

  // Colores: selector y campo de texto van sincronizados
  CAMPOS.forEach(([clave, id]) => {
    const color = $('#' + id), texto = $('#' + id + '-x');
    color.addEventListener('input', () => {
      TEMA[clave] = color.value;
      texto.value = color.value;
      guardar();
    });
    texto.addEventListener('change', () => {
      const v = texto.value.trim();
      if (!hexValido(v)) { texto.value = TEMA[clave]; return; }
      TEMA[clave] = v.toLowerCase();
      color.value = TEMA[clave];
      guardar();
    });
  });

  selTit.addEventListener('change', () => { TEMA.titulos = selTit.value; guardar(); });
  selTex.addEventListener('change', () => { TEMA.texto = selTex.value; guardar(); });
  rango.addEventListener('input', () => {
    TEMA.radio = +rango.value;
    rangoVal.textContent = TEMA.radio + ' px';
    guardar();
  });

  $('#t-reset').addEventListener('click', () => {
    TEMA = { ...TEMA_DEF };
    pintarUI(); guardar();
    toast('Identidad restablecida');
  });

  // Ajuste de exportación: empaquetar Bootstrap dentro del ZIP
  const chk = $('#t-bs-local');
  try { chk.checked = localStorage.getItem('bs5-editor-bs-local') === '1'; } catch (e) { /* sin almacenamiento */ }
  chk.addEventListener('change', () => {
    try { localStorage.setItem('bs5-editor-bs-local', chk.checked ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
  });

  // …y copiar a assets lo enlazado de internet (activado si no se dijo lo contrario)
  const ext = $('#t-assets-ext');
  try { ext.checked = localStorage.getItem('bs5-editor-assets-ext') !== '0'; } catch (e) { /* sin almacenamiento */ }
  ext.addEventListener('change', () => {
    try { localStorage.setItem('bs5-editor-assets-ext', ext.checked ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
  });

  pintarTemaUI = pintarUI;   // para repintar al abrir un proyecto .json
  pintarUI();
  editor.on('load', pintarTema);
})();

/* ---------- 5. Capa de color sobre el fondo (imagen) ----------
   Se implementa con una sombra interior gigante: se dibuja sobre el fondo
   (incluida la imagen) y debajo del contenido. */
(() => {
  const box = $('#overlay-box'), col = $('#ov-color'), op = $('#ov-op'), val = $('#ov-val');
  const RE = /^inset\s+0(?:px)?\s+0(?:px)?\s+0(?:px)?\s+100vmax\s+rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;
  const aHex = (r, g, b) => '#' + [r, g, b].map(n => Number(n).toString(16).padStart(2, '0')).join('');
  const aRgb = (h) => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  // El cuerpo de la página queda fuera: una sombra interior de 100vmax
  // sobre el body tiñe la página entera y parece que el contenido
  // desapareciera. El fondo de la página se cambia en la pestaña «Sitio».
  const esCuerpo = (c) => !!c && ((c.is && c.is('wrapper')) || c === editor.getWrapper());
  function leer() {
    const c = editor.getSelected();
    box.style.display = (c && !esCuerpo(c)) ? '' : 'none';
    if (!c || esCuerpo(c)) return;
    const m = RE.exec(String(c.getStyle()['box-shadow'] || '').trim());
    if (m) {
      col.value = aHex(m[1], m[2], m[3]);
      op.value = Math.round((m[4] === undefined ? 1 : parseFloat(m[4])) * 100);
    } else {
      op.value = 0;
    }
    val.textContent = op.value + '%';
  }
  function aplicar() {
    const c = editor.getSelected();
    if (!c || esCuerpo(c)) return;
    const a = op.value / 100;
    val.textContent = op.value + '%';
    const st = { ...c.getStyle() };
    const actual = String(st['box-shadow'] || '').trim();
    if (a === 0) {
      if (!actual || RE.test(actual)) { delete st['box-shadow']; c.setStyle(st); }
    } else {
      const [r, g, b] = aRgb(col.value);
      st['box-shadow'] = `inset 0 0 0 100vmax rgba(${r}, ${g}, ${b}, ${a})`;
      c.setStyle(st);
    }
  }
  col.addEventListener('input', () => { if (+op.value === 0) op.value = 50; aplicar(); });
  op.addEventListener('input', aplicar);
  $('#ov-clear').onclick = () => { op.value = 0; aplicar(); };
  editor.on('component:selected component:deselected component:styleUpdate', leer);
  editor.on('load', leer);
})();

/* ---------- 6. Imágenes y videos: desde tu computador o por URL ----------
   Lo que se sube queda guardado dentro del proyecto y, al exportar, sale a
   la carpeta assets/ con su nombre original. */
const MB = 1024 * 1024;
const LIMITE = { image: 15 * MB, video: 50 * MB };
const esURL = v => /^https?:\/\//i.test(v || '');
// En el campo de enlace solo se muestran direcciones (no archivos incrustados ni la imagen de muestra)
const sinData = v => /^(data:|<)/i.test(String(v || '').trim()) ? '' : String(v || '');

// Un único selector de archivos oculto para todos los botones «Subir»
const elegirArchivo = (() => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.hidden = true; inp.id = 'archivo-local';
  document.body.appendChild(inp);
  let alElegir = null;
  inp.addEventListener('change', () => {
    const f = inp.files[0];
    inp.value = '';
    if (f && alElegir) alElegir(f);
  });
  return (accept, fn) => { inp.accept = accept; alElegir = fn; inp.click(); };
})();

const leerArchivo = f => new Promise((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(r.result);
  r.onerror = () => mal(r.error);
  r.readAsDataURL(f);
});

// Comprueba el archivo y lo devuelve como data: (o null si no sirve)
async function cargarArchivo(f, tipo) {
  if (!(f.type || '').startsWith(tipo + '/')) {
    toast(tipo === 'video' ? `«${f.name}» no es un video` : `«${f.name}» no es una imagen`);
    return null;
  }
  if (f.size > LIMITE[tipo] &&
      !confirm(`«${f.name}» pesa ${Math.round(f.size / MB)} MB y puede volver lento el editor.\n¿Cargarlo de todos modos?`)) return null;
  const src = await leerArchivo(f);
  // Las imágenes quedan en la galería para volver a usarlas
  if (tipo === 'image' && !editor.Assets.get(src)) editor.Assets.add({ type: 'image', src, name: f.name });
  return src;
}
const subirArchivo = (tipo, fn) => elegirArchivo(tipo + '/*', async (f) => {
  const src = await cargarArchivo(f, tipo);
  if (src) fn(src, f.name);
});

// Galería: las imágenes ya subidas (y la opción de subir más)
const abrirGaleria = fn => editor.Assets.open({
  types: ['image'],
  select(asset) { fn(asset.getSrc(), asset.get('name')); editor.Assets.close(); }
});

// Texto que explica de dónde sale el recurso del elemento seleccionado
function origenDe(src, nombre) {
  if (!src) return '';
  if (String(src).startsWith('data:')) {
    const n = nombre || (editor.Assets.get(src) && editor.Assets.get(src).get('name'));
    return `<i class="bi bi-pc-display"></i> ${n ? SIN_HTML(n) : 'Archivo de tu computador'} · al exportar va a <b>assets/</b>`;
  }
  if (esURL(src)) return '<i class="bi bi-globe2"></i> Enlace de internet';
  return '';
}

/* 6a. Imagen */
(() => {
  const box = $('#img-box'), url = $('#img-url'), info = $('#img-info');
  const sel = () => { const c = editor.getSelected(); return c && c.is && c.is('image') ? c : null; };
  const mostrar = () => {
    const c = sel();
    box.style.display = c ? '' : 'none';
    if (!c) return;
    const src = c.get('src') || c.getAttributes().src || '';
    url.value = sinData(src);
    info.innerHTML = origenDe(src);
  };
  editor.on('component:selected component:deselected component:update:src', mostrar);
  const poner = (src) => {
    const c = sel();
    if (!c) return;
    c.set('src', src);
    c.addAttributes({ src });
    mostrar();
    toast(src.startsWith('data:') ? 'Imagen cargada desde tu computador' : 'Imagen actualizada');
  };
  $('#img-subir').onclick = () => subirArchivo('image', poner);
  $('#img-galeria').onclick = () => abrirGaleria(poner);
  const aplicar = () => {
    const v = url.value.trim();
    if (!v) return;
    if (!esURL(v)) { toast('El enlace debe empezar con http:// o https://'); return; }
    poner(v);
  };
  $('#img-apply').onclick = aplicar;
  url.addEventListener('keydown', (e) => { if (e.key === 'Enter') aplicar(); });
})();

/* 6b. Imagen de fondo de cualquier elemento */
(() => {
  const box = $('#bg-box'), url = $('#bg-url'), info = $('#bg-info');
  const RE = /url\(\s*["']?([^"')]+?)["']?\s*\)/i;
  const leer = () => {
    const c = editor.getSelected();
    box.style.display = c ? '' : 'none';
    if (!c) return;
    const m = RE.exec(String(c.getStyle()['background-image'] || ''));
    url.value = m ? sinData(m[1]) : '';
    info.innerHTML = m ? origenDe(m[1]) : '';
  };
  editor.on('component:selected component:deselected component:styleUpdate', leer);
  editor.on('load', leer);
  const poner = (src) => {
    const c = editor.getSelected();
    if (!c) return;
    const st = { ...c.getStyle() };
    st['background-image'] = `url("${src}")`;
    if (!st['background-size']) st['background-size'] = 'cover';
    if (!st['background-position']) st['background-position'] = 'center';
    if (!st['background-repeat']) st['background-repeat'] = 'no-repeat';
    c.setStyle(st);
    leer();
    toast('Imagen de fondo aplicada');
  };
  $('#bg-subir').onclick = () => subirArchivo('image', poner);
  $('#bg-galeria').onclick = () => abrirGaleria(poner);
  const aplicar = () => {
    const v = url.value.trim();
    if (!v) return;
    if (!esURL(v)) { toast('El enlace debe empezar con http:// o https://'); return; }
    poner(v);
  };
  $('#bg-apply').onclick = aplicar;
  url.addEventListener('keydown', (e) => { if (e.key === 'Enter') aplicar(); });
  $('#bg-clear').onclick = () => {
    const c = editor.getSelected();
    if (!c) return;
    const st = { ...c.getStyle() };
    delete st['background-image'];
    c.setStyle(st);
    leer();
  };
})();

/* 6c. Video: YouTube, Vimeo, enlace .mp4 o un archivo de tu computador */
function analizarVideo(url) {
  url = (url || '').trim();
  let m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  if (m) return { provider: 'yt', videoId: m[1] };
  m = url.match(/vimeo\.com\/(?:video\/|.*\/)?(\d{5,})/i);
  if (m) return { provider: 'vi', videoId: m[1] };
  return { provider: 'so', src: url };
}
// Dirección del reproductor de YouTube o Vimeo en modo fondo:
// automático, sin sonido, en bucle y sin controles.
function urlFondo(v) {
  return v.provider === 'yt'
    ? `https://www.youtube.com/embed/${v.videoId}?autoplay=1&mute=1&loop=1&playlist=${v.videoId}&controls=0&rel=0&playsinline=1&disablekb=1&modestbranding=1&iv_load_policy=3&enablejsapi=1`
    : `https://player.vimeo.com/video/${v.videoId}?background=1&autoplay=1&loop=1&muted=1`;
}
// El video de fondo cambia de etiqueta según el origen: <iframe> para
// YouTube/Vimeo y <video> para archivos. Devuelve el componente resultante.
function ponerVideoFondo(c, src) {
  const v = src.startsWith('data:') ? { provider: 'so' } : analizarVideo(src);
  const esIframe = c.get('tagName') === 'iframe';
  const { class: clase, id } = c.getAttributes();
  const base = { type: 'video-fondo', attributes: { class: clase || 'hero-video', ...(id ? { id } : {}) } };
  if (v.provider === 'so') {
    // Sin src (video quitado) queda el <video> vacío: se ve la imagen de fondo de la sección
    const conSrc = src ? { src } : {};
    if (!esIframe) {
      if (src) c.addAttributes(conSrc);
      else { c.removeAttributes('src'); const el = c.getEl(); if (el) { el.removeAttribute('src'); el.load && el.load(); } }
      return c;
    }
    return c.replaceWith({ ...base, tagName: 'video',
      attributes: { ...base.attributes, ...conSrc, autoplay: true, muted: true, loop: true, playsinline: true } })[0];
  }
  const attrs = { ...base.attributes, src: urlFondo(v), title: 'Video de fondo', frameborder: '0',
    allow: 'autoplay; fullscreen; picture-in-picture', tabindex: '-1', 'aria-hidden': 'true' };
  if (esIframe) { c.setAttributes(attrs); return c; }
  return c.replaceWith({ ...base, tagName: 'iframe', attributes: attrs })[0];
}
// El bloque de video de GrapesJS trae campos «provider», «videoId» y «src» en
// Propiedades; pegar un enlace ahí no funciona, así que se quitan y el enlace
// se cambia solo en el recuadro «Video». El resto de campos va en español.
const ETIQUETAS_VIDEO = { autoplay: 'Reproducir solo', loop: 'Repetir', muted: 'Sin sonido', controls: 'Mostrar controles', color: 'Color del reproductor', rel: 'Videos relacionados', modestbranding: 'Logo discreto', poster: 'Imagen de portada' };
function limpiarTraitsVideo(c) {
  if (!c || !c.is || !c.is('video')) return;
  c.removeTrait(['provider', 'videoId', 'src']);
  c.getTraits().forEach(t => { const e = ETIQUETAS_VIDEO[t.get('name')]; if (e) t.set('label', e); });
}
// Pone un video (data: o URL) en un componente de video o de video de fondo.
// Con src vacío, quita el video.
// data-archivo guarda el nombre original para la carpeta assets (no se exporta).
function ponerVideo(c, src, nombre) {
  if (c.is('video-fondo')) {
    const eraSeleccionado = editor.getSelected() === c;
    c = ponerVideoFondo(c, src);
    if (eraSeleccionado) editor.select(c);
  }
  else {
    c.set(!src ? { provider: 'so', src: '' } : src.startsWith('data:') ? { provider: 'so', src } : analizarVideo(src));
    // Al cambiar de proveedor GrapesJS rehace los campos de Propiedades:
    // se vuelve a seleccionar para que se apliquen los ajustes de siempre.
    if (editor.getSelected() === c) { editor.select(null); editor.select(c); }
    else limpiarTraitsVideo(c);
  }
  if (nombre) c.addAttributes({ 'data-archivo': nombre });
  else c.removeAttributes('data-archivo');
}
(() => {
  const box = $('#video-box'), url = $('#video-url'), info = $('#video-info');
  // Un video seleccionado, o el video de fondo de la sección seleccionada
  const objetivo = () => {
    const c = editor.getSelected();
    if (!c || !c.is) return null;
    if (c.is('video') || c.is('video-fondo')) return c;
    if (c === editor.getWrapper()) return null;
    const esFondo = x => x.is && x.is('video-fondo');
    const dentro = buscarComp(c, esFondo)[0];
    if (dentro) return dentro;
    // Al hacer clic en el hero se selecciona la capa oscura (.overlay) o el
    // contenido, que están AL LADO del video, no lo contienen: se busca en los hermanos.
    const padre = c.parent();
    return (padre && padre !== editor.getWrapper() && padre.components().find(esFondo)) || null;
  };
  const srcDe = c => c.is('video-fondo') ? (c.getAttributes().src || '') : (c.get('src') || '');
  const mostrar = () => {
    const c = objetivo();
    box.style.display = c ? '' : 'none';
    if (!c) return;
    // El video de fondo de una sección se ofrece en «Estilo», junto a su imagen de fondo
    const enEstilo = c !== editor.getSelected();
    const destino = enEstilo ? $('#bg-box') : $('#traits');
    if (box.nextElementSibling !== destino) destino.parentNode.insertBefore(box, destino);
    $('#video-titulo').textContent = c.is('video-fondo') ? 'Video de fondo' : 'Video';
    const src = srcDe(c);
    url.value = c.is('video') && c.get('provider') !== 'so' ? (c.getSrcResult ? c.getSrcResult() : '') : sinData(src);
    info.innerHTML = src ? origenDe(src, c.getAttributes()['data-archivo']) : '';
  };
  editor.on('component:selected', limpiarTraitsVideo);
  editor.on('component:selected component:deselected', mostrar);
  const quitar = () => {
    const c = objetivo();
    if (!c) return;
    ponerVideo(c, '');
    mostrar();
    toast('Video quitado');
  };
  const aplicar = () => {
    const c = objetivo();
    const v = url.value.trim();
    if (!c) return;
    if (!v) { quitar(); return; }
    if (!esURL(v)) { toast('El enlace debe empezar con http:// o https://'); return; }
    ponerVideo(c, v);
    mostrar();
    toast('Video actualizado');
  };
  $('#video-apply').onclick = aplicar;
  $('#video-quitar').onclick = quitar;
  url.addEventListener('keydown', (e) => { if (e.key === 'Enter') aplicar(); });
  $('#video-subir').onclick = () => {
    const c = objetivo();
    if (c) subirArchivo('video', (src, nombre) => { ponerVideo(c, src, nombre); mostrar(); toast('Video cargado desde tu computador'); });
  };
})();

/* 6d. Arrastrar archivos del computador al lienzo: imágenes y videos */
(() => {
  const pendientes = new Map();
  let n = 0;
  editor.on('canvas:dragdata', (dt, res) => {
    const files = [...((dt && dt.files) || [])];
    if (!files.length) return;
    res.setContent(files.map((f) => {
      const tipo = (f.type || '').split('/')[0];
      if (tipo !== 'image' && tipo !== 'video') return null;
      const k = 'f' + (++n);
      pendientes.set(k, { f, tipo });
      return tipo === 'image'
        ? { type: 'image', attributes: { 'data-subiendo': k } }
        : { type: 'video', provider: 'so', attributes: { 'data-subiendo': k } };
    }).filter(Boolean));
  });
  editor.on('canvas:drop', () => setTimeout(() => {
    buscarComp(editor.getWrapper(), c => !!c.getAttributes()['data-subiendo']).forEach(async (c) => {
      const k = c.getAttributes()['data-subiendo'];
      const p = pendientes.get(k);
      pendientes.delete(k);
      c.removeAttributes('data-subiendo');
      const src = p && await cargarArchivo(p.f, p.tipo);
      if (!src) { c.remove(); return; }
      if (p.tipo === 'image') { c.set('src', src); c.addAttributes({ src }); }
      else ponerVideo(c, src, p.f.name);
      editor.select(c);
      toast(`«${p.f.name}» añadido`);
    });
    if (typeof aplicarSemantica === 'function') aplicarSemantica(editor.getWrapper());
  }, 0));
})();

/* ---------- 7. Indicador de ancho / punto de corte de Bootstrap ---------- */
function actualizarAncho() {
  const f = editor.Canvas.getFrameEl();
  const out = document.getElementById('bp-info');
  if (!f || !out) return;
  // Ancho REAL de la página dentro del lienzo (sin la escala de pantalla)
  const win = editor.Canvas.getWindow();
  const w = Math.round((win && win.innerWidth) || f.getBoundingClientRect().width / escala);
  const bp = w < 576 ? 'xs' : w < 768 ? 'sm' : w < 992 ? 'md' : w < 1200 ? 'lg' : w < 1400 ? 'xl' : 'xxl';
  out.textContent = `${w}px · ${bp}` + (escala < 1 ? ` · ${Math.round(escala * 100)}%` : '');
  out.title = escala < 1
    ? `El lienzo muestra un escritorio real de ${w}px reducido al ${Math.round(escala * 100)}% para que quepa en tu pantalla.`
    : 'Ancho del lienzo y punto de corte de Bootstrap (xs, sm, md, lg, xl, xxl)';
}
window.addEventListener('resize', () => setTimeout(actualizarAncho, 120));

// El administrador de selectores se dibuja dos veces con appendTo: se deja solo uno
(() => {
  const box = $('#selectors');
  const limpiar = () => $$('.gjs-clm-tags', box).slice(1).forEach(el => el.remove());
  new MutationObserver(limpiar).observe(box, { childList: true, subtree: true });
  editor.on('load', limpiar);
  limpiar();
})();

/* =====================================================================
   Etiqueta HTML semántica
   Convierte un contenedor ya colocado en <section>, <header>, <nav>…
   sin perder su contenido, sus clases ni su id.
===================================================================== */
const ETIQUETAS = [
  ['div', 'div (sin significado)'], ['section', 'section — sección temática'],
  ['header', 'header — encabezado'], ['nav', 'nav — navegación'],
  ['main', 'main — contenido principal'], ['article', 'article — contenido independiente'],
  ['aside', 'aside — contenido lateral'], ['footer', 'footer — pie'],
  ['figure', 'figure — figura con pie']
];
const ES_CONTENEDOR = (c) => {
  const t = (c.get('tagName') || '').toLowerCase();
  return ETIQUETAS.some(([e]) => e === t);
};

function cambiarEtiqueta(comp, tag) {
  if (!comp || !tag) return;
  const actual = (comp.get('tagName') || '').toLowerCase();
  if (tag === actual) return;
  const padre = comp.parent();
  if (!padre) return;
  const idx = comp.index();
  const attrs = comp.getAttributes() || {};
  const atrStr = Object.keys(attrs)
    .filter(k => k !== 'id' || attrs[k])
    .filter(k => attrs[k] !== undefined && attrs[k] !== '' && attrs[k] !== false)
    .map(k => `${k}="${String(attrs[k]).replace(/"/g, '&quot;')}"`)
    .join(' ');
  const dentro = comp.components().map(h => h.toHTML()).join('');
  comp.remove();
  const creados = padre.append(`<${tag}${atrStr ? ' ' + atrStr : ''}>${dentro}</${tag}>`, { at: idx });
  const nuevo = Array.isArray(creados) ? creados[0] : creados;
  if (nuevo) editor.select(nuevo);
  toast('Convertido en <' + tag + '>');
}

editor.on('component:selected', (c) => {
  if (!c || !c.getTrait || (c.is && c.is('wrapper')) || !ES_CONTENEDOR(c)) return;
  if (!c.getTrait('etiqueta-html')) {
    c.addTrait({
      type: 'select', name: 'etiqueta-html', label: 'Etiqueta HTML', changeProp: true,
      options: ETIQUETAS.map(([id, name]) => ({ id, value: id, name, label: name }))
    });
  }
  c.set('etiqueta-html', (c.get('tagName') || 'div').toLowerCase(), { silent: true });
});
editor.on('component:update:etiqueta-html', (c) => {
  const v = c.get('etiqueta-html');
  if (v && v !== (c.get('tagName') || '').toLowerCase()) cambiarEtiqueta(c, v);
});

/* =====================================================================
   Destino de los enlaces y botones
   Un desplegable con TODAS las páginas del sitio y las secciones (id) de
   la página actual. Elegir una opción arma el href solo; para una web
   externa basta escribirla en «Dirección (URL)».
   El desplazamiento suave y el margen bajo el menú fijo ya están
   resueltos en site.css.
===================================================================== */
// Texto del primer titular que haya dentro, para etiquetar el ancla de forma legible
function tituloDe(comp) {
  let txt = '';
  const busca = (c) => {
    if (txt) return;
    const t = (c.get('tagName') || '').toLowerCase();
    if (/^h[1-6]$/.test(t)) {
      const v = (c.getEl && c.getEl() ? c.getEl().textContent : '') || '';
      txt = v.trim().replace(/\s+/g, ' ').slice(0, 42);
      return;
    }
    try { c.components().forEach(busca); } catch (e) { /* sin hijos */ }
  };
  try { comp.components().forEach(busca); } catch (e) { /* sin hijos */ }
  return txt;
}

function anclasDePagina() {
  const out = [];
  const w = editor.getWrapper();
  if (!w) return out;
  const vistos = new Set();
  const visita = (c) => {
    try {
      // get('attributes') trae SOLO los atributos reales del HTML.
      // getAttributes() añadiría los id que GrapesJS inventa al aplicar
      // un estilo (#iwej, #ikxi7v…), que no son anclas de nadie.
      const a = c.get('attributes') || {};
      const t = (c.get('tagName') || '').toLowerCase();
      if (a.id && !vistos.has(a.id) &&
          ['section', 'header', 'footer', 'main', 'article', 'aside', 'div', 'nav'].includes(t)) {
        vistos.add(a.id);
        out.push({ id: a.id, etiqueta: t, titulo: tituloDe(c) });
      }
      c.components().forEach(visita);
    } catch (e) { /* componente sin hijos */ }
  };
  w.components().forEach(visita);
  return out;
}

// Un <button> no navega solo: se le marca data-ir-a y site.js hace el salto.
const ES_ENLAZABLE = (c) => ['a', 'button'].includes(tagDe(c));
const destinoActual = (c) => {
  const a = c.get('attributes') || {};
  const v = String(a['data-ir-a'] || a.href || '');
  return v === '#' ? '' : v;
};
const esExterno = (v) => /^(https?:|mailto:|tel:|\/\/)/i.test(v);

function opcionesDestino(actual) {
  const op = (value, name) => ({ id: value, value, name: SIN_HTML(name), label: SIN_HTML(name) });
  const opciones = [op('', '— elige un destino —')];
  const paginas = editor.Pages.getAll();
  paginas.forEach(p => {
    const f = archivoDePagina(p);
    opciones.push(op(f, '📄 Página: ' + f));
  });
  const anclas = anclasDePagina();
  anclas.forEach(a => opciones.push(op('#' + a.id, '↓ Sección: ' + (a.titulo ? `${a.titulo} (#${a.id})` : `#${a.id} (${a.etiqueta})`))));
  // Destinos que ya tenía y no están en la lista: se muestran igual para que
  // se vea el enlace (o el enlace roto) en vez de un desplegable en blanco.
  if (actual && !opciones.some(o => o.value === actual)) {
    if (esExterno(actual)) opciones.push(op(actual, '🌐 Externo: ' + actual.slice(0, 40)));
    else opciones.push(op(actual, '⚠ ' + actual.slice(0, 40) + ' (no existe en el sitio)'));
  }
  return opciones;
}

function ponerTraitDestino(c) {
  if (!c || !c.getTrait || !ES_ENLAZABLE(c)) return;
  try { if (c.getTrait('destino')) c.removeTrait('destino'); } catch (e) { /* sigue */ }
  const actual = destinoActual(c);
  // El valor va ANTES de crear la propiedad: el desplegable se dibuja al
  // añadirla y, si no, mostraba «elige un destino» aunque ya tuviera uno.
  c.set('destino', actual, { silent: true });
  c.addTrait({ type: 'select', name: 'destino', label: 'Ir a', changeProp: true, options: opcionesDestino(actual) }, { at: 0 });
}
editor.on('component:selected', ponerTraitDestino);
// Si cambia la dirección escrita a mano, el desplegable se actualiza
editor.on('component:update:attributes', (c) => {
  if (c === editor.getSelected() && ES_ENLAZABLE(c) && (c.get('destino') || '') !== destinoActual(c)) ponerTraitDestino(c);
});

editor.on('component:update:destino', (c) => {
  if (!c || !ES_ENLAZABLE(c)) return;
  const v = c.get('destino') || '';
  if (v === destinoActual(c)) return;
  const esBoton = tagDe(c) === 'button';
  if (!v) {
    if (esBoton) c.removeAttributes('data-ir-a'); else c.addAttributes({ href: '#' });
    return;
  }
  if (esBoton) c.addAttributes({ 'data-ir-a': v, type: 'button' });
  else c.addAttributes({ href: v });
  toast((v.startsWith('#') ? 'Salta a la sección ' : 'Lleva a ') + v + '. Pruébalo en «Vista previa».');
});

// Propiedad "Animación al aparecer" para cualquier componente
editor.on('component:selected', (c) => {
  if (!c || !c.getTrait || (c.is && c.is('wrapper')) || c.getTrait('data-reveal')) return;
  c.addTrait({
    type: 'select', name: 'data-reveal', label: 'Animación al aparecer',
    options: [
      { id: '', value: '', label: 'Ninguna', name: 'Ninguna' },
      { id: 'fade-up', value: 'fade-up', label: 'Subir y aparecer', name: 'Subir y aparecer' },
      { id: 'fade-in', value: 'fade-in', label: 'Solo aparecer', name: 'Solo aparecer' },
      { id: 'fade-left', value: 'fade-left', label: 'Entrar desde la izquierda', name: 'Entrar desde la izquierda' },
      { id: 'fade-right', value: 'fade-right', label: 'Entrar desde la derecha', name: 'Entrar desde la derecha' },
      { id: 'zoom', value: 'zoom', label: 'Zoom suave', name: 'Zoom suave' }
    ]
  });
});

// Tipografías de Google en el panel de estilo
editor.on('load', () => {
  try {
    const prop = editor.StyleManager.getProperty('typography', 'font-family');
    if (!prop) return;
    const nuevos = FUENTES.map(f => ({ id: f.css, label: f.nombre }));
    const previos = (prop.getOptions ? prop.getOptions() : prop.get('options')) || [];
    const rest = previos.filter(o => !nuevos.some(n => n.label === (o.label || o.name)));
    prop.set('options', [...nuevos, ...rest]);
  } catch (e) { console.warn('No se pudieron cargar las fuentes', e); }
});
