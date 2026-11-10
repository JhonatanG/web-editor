/* =====================================================================
   Secciones: la entrada principal del panel izquierdo
   Secciones completas (hero, servicios, portafolio, testimonios,
   preguntas frecuentes, contacto…) con una miniatura que usa los colores
   y las tipografías del proyecto. Se insertan:
     · al final de la página, antes o después de la sección seleccionada
       (con el botón + o la tecla Enter), o
     · en cualquier punto del lienzo, arrastrándolas.
   Cada inserción es UN paso de deshacer: el HTML, los id únicos y la
   estructura semántica se aplican en el mismo ciclo.
   Los bloques sueltos (filas, columnas, textos…) siguen en «Bloques».
===================================================================== */
const SEC_EXTRA = (() => {
  const IMG = (w, h, col, txt) => svgEjemplo(w, h, col, txt);
  const C = ['3b5bdb', '4c6ef5', '5c7cfa', '364fc7', '4263eb', '1b2559'];
  const S = {};
  S.heroDividido = () => `
<section class="seccion hero-dividido fondo-claro" id="inicio">
  <div class="container">
<div class="row align-items-center g-5">
  <div class="col-lg-6" data-reveal="fade-up">
    <span class="eyebrow">Bienvenido</span>
    <h1 class="font-titulo display-4 mt-3 mb-4">Un título claro para tu propuesta</h1>
    <p class="lead text-secondary mb-4">Explica en una frase qué haces, para quién y por qué conviene elegirte.</p>
    <div class="d-flex flex-wrap gap-3"><a href="contacto.html" class="btn-sitio">Contáctanos</a><a href="#servicios" class="btn-sitio-linea">Ver servicios</a></div>
  </div>
  <div class="col-lg-6"><img class="img-redondeada" src="${IMG(900, 675, C[0], 'Imagen principal')}" alt="Imagen principal"></div>
</div>
  </div>
</section>`;
  S.serviciosIconos = () => `
<section class="seccion" id="servicios">
  <div class="container">
<div class="text-center mb-5"><span class="eyebrow">Servicios</span><h2 class="font-titulo display-6 mt-3">Cómo podemos ayudarte</h2><p class="text-secondary col-lg-7 mx-auto">Resume en una línea lo que ofreces. Cada tarjeta explica un servicio.</p></div>
<div class="row g-4">
  ${[['lightbulb', 'Asesoría', 'Te ayudamos a definir qué necesitas y cómo lograrlo.'], ['brush', 'Diseño', 'Creamos una imagen clara y coherente para tu marca.'], ['gear', 'Desarrollo', 'Construimos soluciones a medida, rápidas y seguras.']]
    .map(([i, t, d]) => `
  <div class="col-md-6 col-lg-4" data-reveal="fade-up"><article class="servicio-ico"><span class="servicio-ico-i" aria-hidden="true"><i class="bi bi-${i}"></i></span><h3 class="h5 font-titulo">${t}</h3><p class="text-secondary mb-0">${d}</p></article></div>`).join('')}
</div>
  </div>
</section>`;
  S.portafolio = () => `
<section class="seccion" id="portafolio">
  <div class="container">
<div class="text-center mb-5"><span class="eyebrow">Portafolio</span><h2 class="font-titulo display-6 mt-3">Proyectos recientes</h2><p class="text-secondary col-lg-7 mx-auto">Una selección de trabajos. Cambia cada imagen, título y enlace por los tuyos.</p></div>
<div class="row g-4">
  ${[['Identidad de marca', 'Diseño'], ['Tienda en línea', 'Desarrollo'], ['Campaña digital', 'Comunicación'], ['Aplicación móvil', 'Desarrollo'], ['Fotografía de producto', 'Diseño'], ['Sitio institucional', 'Desarrollo']]
    .map(([t, cat], i) => `
  <div class="col-md-6 col-lg-4" data-reveal="fade-up"><article class="proyecto"><img src="${IMG(800, 600, C[i % 6], t)}" alt="${t}"><div class="proyecto-cuerpo"><span class="proyecto-cat">${cat}</span><h3 class="h5 font-titulo mt-2">${t}</h3><p class="small text-secondary mb-3">Qué se hizo, para quién y qué resultado tuvo.</p><a href="#" class="proyecto-enlace">Ver proyecto</a></div></article></div>`).join('')}
</div>
  </div>
</section>`;
  S.faq = () => `
<section class="seccion fondo-claro" id="preguntas">
  <div class="container" style="max-width:820px">
<div class="text-center mb-5"><span class="eyebrow">Ayuda</span><h2 class="font-titulo display-6 mt-3">Preguntas frecuentes</h2></div>
<div class="accordion acordeon-sitio" id="__UID__">
  ${[['¿Cuánto tarda un proyecto?', 'Depende del alcance. Un sitio sencillo suele estar listo en dos a cuatro semanas.'], ['¿Qué necesito para empezar?', 'Una idea clara de lo que quieres comunicar, tus textos y tus imágenes. Te ayudamos con el resto.'], ['¿Ofrecen mantenimiento?', 'Sí. Podemos actualizar contenidos y revisar que todo funcione cada mes.']]
    .map(([p, r], i) => `
  <div class="accordion-item"><h3 class="accordion-header"><button class="accordion-button${i ? ' collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#__UID__-${i + 1}" aria-expanded="${i ? 'false' : 'true'}" aria-controls="__UID__-${i + 1}">${p}</button></h3>
    <div id="__UID__-${i + 1}" class="accordion-collapse collapse${i ? '' : ' show'}" data-bs-parent="#__UID__"><div class="accordion-body">${r}</div></div></div>`).join('')}
</div>
  </div>
</section>`;
  S.cta = () => `
<section class="seccion-cta fondo-osc" aria-labelledby="__UID__-t">
  <div class="container">
<div class="cta-caja">
  <div><h2 class="font-titulo h1 mb-2" id="__UID__-t">¿Listo para empezar?</h2><p class="mb-0 opacity-75">Cuéntanos tu idea y te respondemos en menos de un día hábil.</p></div>
  <a href="contacto.html" class="btn-sitio-claro">Hablemos</a>
</div>
  </div>
</section>`;
  return S;
})();

/* ---------- Catálogo ---------- */
const CATS_SEC = [
  { id: 'hero', nombre: 'Hero y cabeceras', icono: 'window-fullscreen' },
  { id: 'servicios', nombre: 'Servicios', icono: 'columns-gap' },
  { id: 'portafolio', nombre: 'Portafolio', icono: 'images' },
  { id: 'testimonios', nombre: 'Testimonios', icono: 'chat-quote' },
  { id: 'faq', nombre: 'Preguntas frecuentes', icono: 'question-circle' },
  { id: 'contacto', nombre: 'Contacto', icono: 'envelope-paper' },
  { id: 'cta', nombre: 'Llamadas a la acción y cifras', icono: 'megaphone' },
  { id: 'estructura', nombre: 'Menú y pie', icono: 'layout-text-window-reverse' },
  { id: 'vinculados', nombre: 'Componentes vinculados', icono: 'link-45deg' }
];
// bloque: id de un bloque ya registrado; html: plantilla nueva (se registra aquí)
const SECCIONES = [
  { id: 's-hero-video', cat: 'hero', nombre: 'Hero con video de fondo', bloque: 's-hero-video' },
  { id: 's-hero-img', cat: 'hero', nombre: 'Hero con imagen de fondo', bloque: 's-hero-img' },
  { id: 'sec-hero-dividido', cat: 'hero', nombre: 'Hero dividido: texto e imagen', html: SEC_EXTRA.heroDividido },
  { id: 's-banner', cat: 'hero', nombre: 'Cabecera de página interior', bloque: 's-banner' },
  { id: 'hero', cat: 'hero', nombre: 'Hero centrado (Bootstrap)', bloque: 'hero' },
  { id: 'sec-servicios-iconos', cat: 'servicios', nombre: 'Servicios con íconos', html: SEC_EXTRA.serviciosIconos },
  { id: 's-servicios', cat: 'servicios', nombre: 'Servicios con foto y precio', bloque: 's-servicios' },
  { id: 's-destacados', cat: 'servicios', nombre: 'Destacados (4 tarjetas)', bloque: 's-destacados' },
  { id: 's-split-izq', cat: 'servicios', nombre: 'Imagen + texto', bloque: 's-split-izq' },
  { id: 's-split-der', cat: 'servicios', nombre: 'Texto + imagen', bloque: 's-split-der' },
  { id: 's-intro', cat: 'servicios', nombre: 'Presentación centrada', bloque: 's-intro' },
  { id: 'pricing', cat: 'servicios', nombre: 'Planes y precios', bloque: 'pricing' },
  { id: 'sec-portafolio', cat: 'portafolio', nombre: 'Portafolio de proyectos', html: SEC_EXTRA.portafolio },
  { id: 's-galeria', cat: 'portafolio', nombre: 'Galería con ampliación', bloque: 's-galeria' },
  { id: 's-pista', cat: 'portafolio', nombre: 'Pista deslizable', bloque: 's-pista' },
  { id: 's-categorias', cat: 'portafolio', nombre: 'Categorías (3 tarjetas)', bloque: 's-categorias' },
  { id: 's-testimonios', cat: 'testimonios', nombre: 'Testimonios (3)', bloque: 's-testimonios' },
  { id: 's-citas', cat: 'testimonios', nombre: 'Carrusel de citas', bloque: 's-citas' },
  { id: 's-prensa', cat: 'testimonios', nombre: 'Prensa y cinta de logos', bloque: 's-prensa' },
  { id: 'sec-faq', cat: 'faq', nombre: 'Preguntas frecuentes', html: SEC_EXTRA.faq },
  { id: 's-contacto', cat: 'contacto', nombre: 'Contacto con formulario', bloque: 's-contacto' },
  { id: 'sec-contacto-mapa', cat: 'contacto', nombre: 'Contacto con formulario y mapa', html: () => SITIO.L.contacto() + SITIO.L.mapa() },
  { id: 's-newsletter', cat: 'contacto', nombre: 'Suscripción', bloque: 's-newsletter' },
  { id: 'sec-cta', cat: 'cta', nombre: 'Llamada a la acción', html: SEC_EXTRA.cta },
  { id: 's-parallax', cat: 'cta', nombre: 'Cifras sobre fondo fijo', bloque: 's-parallax' },
  { id: 'team', cat: 'cta', nombre: 'Equipo', bloque: 'team' },
  { id: 's-nav', cat: 'estructura', nombre: 'Menú transparente', bloque: 's-nav' },
  { id: 'navbar-light', cat: 'estructura', nombre: 'Menú claro', bloque: 'navbar-light' },
  { id: 's-pie', cat: 'estructura', nombre: 'Pie con foto y redes', bloque: 's-pie' },
  { id: 'footer', cat: 'estructura', nombre: 'Pie sencillo', bloque: 'footer' }
];
const htmlDeSeccion = (s) => {
  if (s.html) return s.html();
  const b = editor.Blocks.get(s.bloque);
  const c = b && b.get('content');
  return typeof c === 'string' ? c : '';
};
// Las secciones nuevas también son bloques (para poder arrastrarlas al lienzo)
SECCIONES.filter(s => s.html).forEach(s => add('sec', s.id, s.nombre, 'window-stack', s.html()));
const bloqueDeSeccion = (s) => editor.Blocks.get(s.bloque || s.id);
const ES_BLOQUE_SECCION = (b) => !!b && SECCIONES.some(s => (s.bloque || s.id) === b.get('id'));

// En «Bloques» quedan los bloques estructurales: las secciones completas viven aquí.
function pintarBloquesEstructurales() {
  const ocultos = new Set(SECCIONES.map(s => s.bloque || s.id));
  const catDe = (b) => { const c = b.get('category'); return (c && (c.get ? c.get('label') : c.label)) || ''; };
  try {
    editor.Blocks.render(editor.Blocks.getAll().filter(b => !ocultos.has(b.get('id')) && catDe(b) !== CAT.sec.label));
  } catch (e) { console.warn('No se pudo filtrar Bloques', e); }
}
editor.on('load', () => setTimeout(pintarBloquesEstructurales, 0));

/* ---------- Documento de vista previa con la identidad del proyecto ---------- */
function docConTema(cuerpo, { extraCss = '', scripts = '' } = {}) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${CDN_BS.css}"><link rel="stylesheet" href="${CDN_BS.ico}"><link rel="stylesheet" id="fuentes" href="${gfUrl(temaFuentes())}">
<style>${SITE_CSS}</style><style id="tema">${temaCss()}</style>
<style>body{margin:0}.fixed-top{position:absolute!important}.whatsapp-flotante{position:absolute}${extraCss}</style></head>
<body>${cuerpo}${scripts}</body></html>`;
}

/* ---------- Dónde insertar ---------- */
// La sección (hijo directo de main, o header/footer de la página) que contiene c
function seccionDe(c) {
  const w = editor.getWrapper();
  for (let x = c; x && x !== w; x = x.parent()) {
    const p = x.parent();
    if (!p) return null;
    if (tagDe(x) === 'main' && p === w) return null;
    if (p === w || (tagDe(p) === 'main' && p.parent() === w)) return x;
  }
  return null;
}
const nombreDeSeccion = (s) => {
  if (!s) return '';
  const r = raizVinculo(s);
  if (r === s) return nombreVinculo(vidDe(s));
  return tituloDe(s) || (s.getName ? s.getName() : tagDe(s));
};
let modoDestino = 'final';
function seccionObjetivo() { const c = editor.getSelected(); return c ? seccionDe(c) : null; }
function pintarDestino() {
  const box = $('#sec-destino');
  if (!box) return;
  const s = seccionObjetivo();
  if (!s && modoDestino !== 'final') modoDestino = 'final';
  const nom = s ? SIN_HTML(nombreDeSeccion(s)).slice(0, 34) : '';
  const op = (v, txt, dis) => `<label class="${dis ? 'dis' : ''}"><input type="radio" name="sec-dest" value="${v}" ${modoDestino === v ? 'checked' : ''} ${dis ? 'disabled' : ''}><span>${txt}</span></label>`;
  box.innerHTML = `<div class="sec-dest-tit"><i class="bi bi-cursor"></i> Insertar</div>
    ${op('antes', s ? `antes de «${nom}»` : 'antes de la sección seleccionada', !s)}
    ${op('despues', s ? `después de «${nom}»` : 'después de la sección seleccionada', !s)}
    ${op('final', 'al final de la página', false)}
    <p class="hint" style="margin:6px 0 0">O arrastra una sección al punto exacto del lienzo.</p>`;
  box.querySelectorAll('input').forEach(i => i.onchange = () => { modoDestino = i.value; });
}
editor.on('component:selected', () => {
  if (seccionObjetivo() && modoDestino === 'final') modoDestino = 'despues';
  pintarDestino();
});
editor.on('component:deselected page:select', () => setTimeout(pintarDestino, 0));
editor.on('load', pintarDestino);

/* ---------- Insertar (un solo paso de deshacer) ---------- */
function puntoDeInsercion(modo) {
  const w = editor.getWrapper();
  const ref = seccionObjetivo();
  if ((modo === 'antes' || modo === 'despues') && ref) return { padre: ref.parent(), at: ref.index() + (modo === 'despues' ? 1 : 0) };
  const main = w.components().find(c => tagDe(c) === 'main');
  return { padre: main || w, at: undefined };
}
function trasInsertar(nuevos) {
  const w = editor.getWrapper();
  nuevos.forEach(c => renombrarIdsRepetidos(c));
  aplicarSemantica(w, nuevos[0]);
  const c = nuevos.find(x => x.parent()) || null;
  if (!c) return null;
  editor.select(c);
  const el = c.getEl && c.getEl();
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return c;
}
function insertarSeccion(s, modo = modoDestino) {
  const html = unico(htmlDeSeccion(s));
  if (!html) return null;
  const { padre, at } = puntoDeInsercion(modo);
  const r = padre.append(html, at === undefined ? {} : { at });
  const c = trasInsertar(Array.isArray(r) ? r : [r]);
  toast(`«${s.nombre}» insertada. Ctrl+Z la quita.`);
  return c;
}
function insertarVinculado(vid, modo = modoDestino) {
  const { padre, at } = puntoDeInsercion(modo);
  const c = insertarInstancia(vid, padre, at);
  if (!c) return null;
  trasInsertar([c]);
  toast(`Instancia de «${nombreVinculo(vid)}» insertada`);
  return c;
}
// Al arrastrar una sección, la estructura se ordena en el mismo paso que la
// inserción (semantica.js lo hace en el siguiente ciclo para el resto de bloques)
editor.on('block:drag:stop', (comp, block) => {
  if (!comp || !comp.parent || !ES_BLOQUE_SECCION(block)) return;
  aplicarSemantica(editor.getWrapper(), comp.parent() ? comp : null);
});

/* ---------- Panel ---------- */
const miniaturas = new Set();
let observador = null;
function pintarMiniatura(caja, html) {
  if (caja.querySelector('iframe')) return;
  const f = document.createElement('iframe');
  f.setAttribute('tabindex', '-1');
  f.setAttribute('aria-hidden', 'true');
  f.setAttribute('loading', 'lazy');
  f.srcdoc = docConTema(unico(html), { extraCss: 'html,body{overflow:hidden;pointer-events:none}' });
  caja.appendChild(f);
  miniaturas.add(f);
  escalarMiniatura(caja);
}
function escalarMiniatura(caja) { caja.style.setProperty('--s', (caja.clientWidth || 230) / 1280); }
function refrescarMiniaturas() {
  miniaturas.forEach(f => {
    if (!f.isConnected) { miniaturas.delete(f); return; }
    try {
      const d = f.contentDocument;
      d.getElementById('tema').textContent = temaCss();
      d.getElementById('fuentes').href = gfUrl(temaFuentes());
    } catch (e) { /* aún cargando */ }
  });
}
// Repinta las miniaturas cuando cambia la identidad visual del sitio
(() => {
  const original = pintarTema;
  let t = null;
  pintarTema = function () { original(); clearTimeout(t); t = setTimeout(refrescarMiniaturas, 150); };
})();

function tarjetaSeccion({ clave, nombre, html, insertar, arrastre }) {
  const d = document.createElement('div');
  d.className = 'sec-card';
  d.tabIndex = 0;
  d.dataset.sec = clave;
  d.setAttribute('role', 'button');
  d.setAttribute('aria-label', `${nombre}. Enter para insertar, espacio para ver la vista previa`);
  d.innerHTML = `<div class="sec-mini"></div><div class="sec-pie"><span>${SIN_HTML(nombre)}</span>
    <button class="sec-ver" title="Vista previa" tabindex="-1"><i class="bi bi-eye"></i></button>
    <button class="sec-ins" title="Insertar" tabindex="-1"><i class="bi bi-plus-lg"></i></button></div>`;
  d.dataset.html = '';
  d._html = html;
  const ver = () => vistaPreviaSeccion(nombre, html(), insertar);
  d.querySelector('.sec-ins').onclick = (e) => { e.stopPropagation(); insertar(modoDestino); };
  d.querySelector('.sec-ver').onclick = (e) => { e.stopPropagation(); ver(); };
  d.addEventListener('click', ver);
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); insertar(modoDestino); }
    else if (e.key === ' ') { e.preventDefault(); ver(); }
  });
  if (arrastre) {
    d.draggable = true;
    d.addEventListener('dragstart', (ev) => { try { editor.Blocks.startDrag(arrastre, ev); } catch (e) { console.warn(e); } });
    d.addEventListener('dragend', () => { try { editor.Blocks.endDrag(); } catch (e) { /* sin efecto */ } });
  }
  if (observador) observador.observe(d); else pintarMiniatura(d.querySelector('.sec-mini'), html());
  return d;
}

function pintarPanelSecciones() {
  const cont = $('#secciones');
  if (!cont) return;
  cont.innerHTML = '';
  if (!observador && 'IntersectionObserver' in window) {
    observador = new IntersectionObserver((en) => en.forEach(x => {
      if (!x.isIntersecting) return;
      observador.unobserve(x.target);
      pintarMiniatura(x.target.querySelector('.sec-mini'), x.target._html());
    }), { root: cont.closest('.pane'), rootMargin: '200px' });
  }
  CATS_SEC.forEach(cat => {
    const grupo = document.createElement('section');
    grupo.className = 'sec-cat';
    grupo.dataset.cat = cat.id;
    grupo.innerHTML = `<h3 class="sec-cat-tit"><i class="bi bi-${cat.icono}"></i> ${cat.nombre}</h3><div class="sec-grid"></div>`;
    const grid = grupo.querySelector('.sec-grid');
    if (cat.id === 'vinculados') {
      grid.id = 'sec-vinculados';
      cont.appendChild(grupo);
      return;
    }
    SECCIONES.filter(s => s.cat === cat.id).forEach(s => grid.appendChild(tarjetaSeccion({
      clave: s.id, nombre: s.nombre, html: () => htmlDeSeccion(s),
      insertar: (modo) => insertarSeccion(s, modo), arrastre: bloqueDeSeccion(s)
    })));
    cont.appendChild(grupo);
  });
  refrescarListaVinculados();
}
refrescarListaVinculados = function () {
  const grid = $('#sec-vinculados');
  if (!grid) return;
  grid.innerHTML = '';
  const grupos = todosLosVinculos().filter(g => g.principal);
  if (!grupos.length) {
    grid.innerHTML = '<p class="hint" style="grid-column:1/-1;margin:0 4px 8px">Aún no hay componentes vinculados. Selecciona un menú, un pie, una tarjeta o una sección y pulsa <b>Vincular</b> en el panel derecho.</p>';
    return;
  }
  grupos.forEach(g => {
    const m = g.principal.comp;
    grid.appendChild(tarjetaSeccion({
      clave: g.vid, nombre: `${m.get('vinculoNombre') || 'Vinculado'} · ${g.instancias.length + 1} uso(s)`,
      html: () => m.toHTML(), insertar: (modo) => insertarVinculado(g.vid, modo)
    }));
  });
};
editor.on('load', () => setTimeout(() => { pintarPanelSecciones(); }, 50));
editor.on('page:select page:add', () => setTimeout(refrescarListaVinculados, 100));

// Buscador de secciones
$('#sec-q').addEventListener('input', (e) => {
  const t = normal(e.target.value.trim());
  $$('#secciones .sec-cat').forEach(g => {
    let hay = false;
    $$('.sec-card', g).forEach(card => {
      const ok = !t || normal(card.textContent).includes(t) || normal(g.querySelector('.sec-cat-tit').textContent).includes(t);
      card.style.display = ok ? '' : 'none';
      hay = hay || ok;
    });
    g.style.display = hay || (!t && g.dataset.cat === 'vinculados') ? '' : 'none';
  });
});
$('#ir-bloques').onclick = (e) => { e.preventDefault(); showTab('left', 'blocks'); $('#q').focus(); };
new ResizeObserver(() => $$('#secciones .sec-mini').forEach(escalarMiniatura)).observe($('#secciones'));

/* ---------- Vista previa grande ---------- */
function vistaPreviaSeccion(nombre, html, insertar) {
  const w = document.createElement('div');
  const s = seccionObjetivo();
  const nom = s ? SIN_HTML(nombreDeSeccion(s)).slice(0, 30) : '';
  w.className = 'sec-previa';
  w.innerHTML = `
    <div class="sec-previa-barra" role="group" aria-label="Ancho de la vista previa">
      <button class="tb-btn active" data-ancho="1280"><i class="bi bi-display"></i> Escritorio</button>
      <button class="tb-btn" data-ancho="390"><i class="bi bi-phone"></i> Móvil</button>
      <span class="hint" style="margin:0 0 0 auto">Con los colores y tipografías de tu sitio</span>
    </div>
    <div class="sec-previa-marco"><iframe title="Vista previa de ${SIN_HTML(nombre)}"></iframe></div>
    <div class="sec-previa-acc">
      ${s ? `<button class="tb-btn" data-modo="antes"><i class="bi bi-arrow-bar-up"></i> Antes de «${nom}»</button>
      <button class="tb-btn" data-modo="despues"><i class="bi bi-arrow-bar-down"></i> Después de «${nom}»</button>` : ''}
      <button class="tb-btn primary" data-modo="final"><i class="bi bi-plus-lg"></i> Al final de la página</button>
    </div>`;
  const f = w.querySelector('iframe');
  f.srcdoc = docConTema(unico(html));
  const marco = w.querySelector('.sec-previa-marco');
  const ajustar = (ancho) => {
    const disp = marco.clientWidth || 860;
    const esc = Math.min(1, disp / ancho);
    f.style.width = ancho + 'px';
    f.style.height = Math.round(520 / esc) + 'px';
    f.style.transform = `scale(${esc})`;
    marco.style.height = '520px';
  };
  w.querySelectorAll('[data-ancho]').forEach(b => b.onclick = () => {
    w.querySelectorAll('[data-ancho]').forEach(x => x.classList.toggle('active', x === b));
    ajustar(+b.dataset.ancho);
  });
  w.querySelectorAll('[data-modo]').forEach(b => b.onclick = () => { editor.Modal.close(); insertar(b.dataset.modo); });
  editor.Modal.open({ title: 'Sección: ' + nombre, content: w });
  const dialogo = document.querySelector('.gjs-mdl-dialog');
  if (dialogo) { dialogo.classList.add('cod-dialog'); editor.once('modal:close', () => dialogo.classList.remove('cod-dialog')); }
  setTimeout(() => ajustar(1280), 0);
}
