/* =====================================================================
   Interacciones (pestaña del panel derecho)
   Modelo:  Cuando ocurre  →  sobre este elemento  →  ejecuta esta acción
     eventos   clic (también Enter/espacio), foco, entra en pantalla
     acciones  abrir, cerrar, abrir o cerrar, ir a, cambiar de estado,
               guardar variable
     condición «solo si la variable X es / no es Y»
   Las reglas se guardan validadas en el elemento de origen (data-int) y los
   destinos con una referencia estable (data-iid), que se mantiene al copiar
   y se renueva al duplicar. El mismo código (js/runtime.js) las ejecuta en
   la vista previa, en el ZIP y en el sitio publicado.
===================================================================== */
const RUNTIME_INTERACCIONES = '(function(){\nvar INT_EVENTOS=' + JSON.stringify(INT_EVENTOS) + ', INT_ACCIONES=' + JSON.stringify(INT_ACCIONES) + ';\n' +
  validarReglasInt.toString() + '\n(' + runtimeInteracciones.toString() + ')(window);\n})();\n';
RUNTIMES_EXTRA.push({ archivo: 'interacciones.js', codigo: RUNTIME_INTERACCIONES, usa: (html) => /\sdata-int="/.test(html) });

const NOMBRES_EVENTO = { clic: 'clic (o Enter / espacio)', foco: 'recibe el foco', visible: 'entra en pantalla' };
const NOMBRES_ACCION = { abrir: 'abrir', cerrar: 'cerrar', alternar: 'abrir o cerrar', navegar: 'ir a', estado: 'cambiar el estado de', variable: 'guardar la variable' };
const CON_OBJETIVO = ['abrir', 'cerrar', 'alternar', 'estado'];

const reglasDe = (c) => { const v = attrs(c)['data-int']; if (!v) return []; return validarReglasInt(v).reglas; };
const iidDe = (c) => attrs(c)['data-iid'] || '';
function asegurarIid(c) {
  let id = iidDe(c);
  if (!id) { id = 'i-' + Math.random().toString(36).slice(2, 8); c.addAttributes({ 'data-iid': id }); }
  return id;
}
function nombreElemento(c) {
  if (!c) return '(no existe)';
  const n = attrs(c)['data-int-nombre'] || attrs(c)['aria-label'];
  const t = (textoDe(c) || '').slice(0, 28);
  return n || (t ? `${tagDe(c)} «${t}»` : (c.getName ? c.getName() : tagDe(c)));
}
const porIid = (raiz, id) => buscarComp(raiz, c => iidDe(c) === id)[0] || null;

// Guarda las reglas del elemento (siempre validadas) y deja accesible el control
function guardarReglas(c, reglas) {
  const v = validarReglasInt(reglas);
  if (!v.reglas.length) c.removeAttributes('data-int');
  else c.addAttributes({ 'data-int': JSON.stringify(v.reglas) });
  const raiz = editor.getWrapper();
  // Un botón o enlace que abre/cierra algo anuncia qué controla y si está abierto
  v.reglas.forEach(r => r.acciones.forEach(a => {
    if (!['abrir', 'alternar'].includes(a.tipo) || !a.objetivo) return;
    const obj = porIid(raiz, a.objetivo);
    if (!obj || !['a', 'button'].includes(tagDe(c))) return;
    if (!attrs(obj).id) obj.addAttributes({ id: a.objetivo });
    const modal = attrs(obj)['data-int-tipo'] === 'modal' || attrs(obj).role === 'dialog';
    c.addAttributes(modal ? { 'aria-haspopup': 'dialog', 'aria-controls': attrs(obj).id } : { 'aria-controls': attrs(obj).id, 'aria-expanded': attrs(obj)['data-estado'] === 'cerrado' ? 'false' : 'true' });
  }));
  return v;
}

/* ---------- Duplicar: nuevas referencias, las internas siguen apuntando dentro ---------- */
let remapeo = null;
editor.on('component:clone', (c) => {
  if (!c || !c.get) return;
  if (!remapeo) { remapeo = new Map(); setTimeout(() => { remapeo = null; }, 0); }
  const nuevos = new Set(remapeo.values());
  recorrer(c, x => {
    const id = iidDe(x);
    if (!id || nuevos.has(id)) return;
    const n = 'i-' + Math.random().toString(36).slice(2, 8);
    remapeo.set(id, n);
    x.addAttributes({ 'data-iid': n });
  });
  recorrer(c, x => {
    const v = attrs(x)['data-int'];
    if (!v) return;
    const reglas = validarReglasInt(v).reglas;
    let cambio = false;
    reglas.forEach(r => r.acciones.forEach(a => { if (a.objetivo && remapeo.has(a.objetivo)) { a.objetivo = remapeo.get(a.objetivo); cambio = true; } }));
    if (cambio) x.addAttributes({ 'data-int': JSON.stringify(reglas) });
  });
});

/* ---------- Lienzo: lo que está cerrado se muestra mientras se edita ---------- */
function estiloLienzoInt(doc) {
  if (!doc || !doc.head || doc.getElementById('ed-int')) return;
  const st = doc.createElement('style');
  st.id = 'ed-int';
  st.textContent = '.int-panel.ed-int-abierto[data-estado],.menu-int-panel.ed-int-abierto[data-estado]{display:block!important;outline:2px dashed #a08bff;outline-offset:-2px}' +
    '.menu-int-panel.ed-int-abierto{display:flex!important}.int-modal.ed-int-abierto[data-estado]{display:flex!important;position:absolute}' +
    '[data-int]{box-shadow:inset 0 0 0 1px rgba(124,92,255,.35)}';
  doc.head.appendChild(st);
}
editor.on('canvas:frame:load', (a) => estiloLienzoInt(a && a.window && a.window.document));
editor.on('load', () => estiloLienzoInt(editor.Canvas.getDocument()));
function mostrarCerradosDeSeleccion() {
  const doc = editor.Canvas.getDocument();
  if (!doc || document.body.classList.contains('is-preview')) return;
  doc.querySelectorAll('.ed-int-abierto').forEach(e => e.classList.remove('ed-int-abierto'));
  const c = editor.getSelected();
  if (!c || !c.getEl || !c.getEl()) return;
  const abrir = (el) => el && el.classList && el.classList.add('ed-int-abierto');
  for (let el = c.getEl(); el && el.nodeType === 1; el = el.parentElement) if (el.hasAttribute('data-estado')) abrir(el);
  reglasDe(c).forEach(r => r.acciones.forEach(a => { if (a.objetivo) abrir(doc.querySelector(`[data-iid="${CSS.escape(a.objetivo)}"]`)); }));
}
editor.on('component:selected component:deselected', () => setTimeout(mostrarCerradosDeSeleccion, 0));

/* ---------- Panel ---------- */
let eligiendo = null;   // { origen, regla, accion }
const OPCION = (v, t, sel) => `<option value="${SIN_HTML(v)}" ${sel ? 'selected' : ''}>${SIN_HTML(t)}</option>`;
function opcionesObjetivo(c, actual) {
  const raiz = editor.getWrapper();
  const lista = buscarComp(raiz, x => !!iidDe(x) && x !== c);
  let html = OPCION('', 'este elemento', !actual);
  lista.forEach(x => { html += OPCION(iidDe(x), nombreElemento(x), iidDe(x) === actual); });
  if (actual && !lista.some(x => iidDe(x) === actual) && actual !== iidDe(c)) html += OPCION(actual, '⚠ elemento que ya no existe', true);
  return html + OPCION('__elegir', '🎯 Elegir en el lienzo…', false);
}
function filaAccion(c, a, j) {
  const t = a.tipo;
  return `<div class="int-accion" data-j="${j}">
    <span class="int-k">${j ? 'y' : 'ejecuta'}</span>
    <select data-campo="tipo" aria-label="Acción">${Object.entries(NOMBRES_ACCION).map(([k, n]) => OPCION(k, n, k === t)).join('')}</select>
    ${CON_OBJETIVO.includes(t) ? `<select data-campo="objetivo" aria-label="Sobre qué elemento">${opcionesObjetivo(c, a.objetivo || '')}</select>` : ''}
    ${t === 'estado' ? `<input data-campo="valor" value="${SIN_HTML(a.valor || 'activo')}" aria-label="Nombre del estado" placeholder="activo" spellcheck="false">` : ''}
    ${t === 'navegar' ? `<input data-campo="valor" value="${SIN_HTML(a.valor || '')}" aria-label="Destino" placeholder="#seccion, pagina.html o https://…" list="int-destinos" spellcheck="false">` : ''}
    ${t === 'variable' ? `<input data-campo="nombre" value="${SIN_HTML(a.nombre || '')}" aria-label="Nombre de la variable" placeholder="plan" spellcheck="false"><span class="int-k">=</span><input data-campo="valor" value="${SIN_HTML(a.valor || '')}" aria-label="Valor" placeholder="pro" spellcheck="false">` : ''}
    <button class="int-x" data-quitar-accion="${j}" title="Quitar esta acción" aria-label="Quitar esta acción"><i class="bi bi-x"></i></button>
  </div>`;
}
function pintarInteracciones() {
  const box = $('#int-panel');
  if (!box) return;
  const c = editor.getSelected();
  if (!c || (c.is && c.is('wrapper'))) {
    box.innerHTML = `<p class="hint" style="padding:10px">Selecciona un elemento del lienzo (un botón, un enlace, una tarjeta…) para decir qué pasa cuando alguien interactúa con él.</p>${listaDePagina()}`;
    enlazarLista(box);
    return;
  }
  const crudo = attrs(c)['data-int'];
  const val = crudo ? validarReglasInt(crudo) : { reglas: [], errores: [] };
  const reglas = val.reglas;
  const raiz = editor.getWrapper();
  const rotas = [];
  reglas.forEach(r => r.acciones.forEach(a => { if (a.objetivo && !porIid(raiz, a.objetivo)) rotas.push(a.objetivo); }));
  const destinoDe = buscarComp(raiz, x => reglasDe(x).some(r => r.acciones.some(a => a.objetivo && a.objetivo === iidDe(c))));
  const destinos = [...editor.Pages.getAll().map(archivoDePagina), ...anclasDePagina().map(a => '#' + a.id)];
  box.innerHTML = `
    <div class="int-cab"><b><i class="bi bi-lightning-charge"></i> ${SIN_HTML(nombreElemento(c))}</b>
      <span class="hint">Cuando ocurre → sobre este elemento → ejecuta esta acción</span></div>
    ${val.errores.length ? `<p class="pub-error" style="margin:8px 10px">Se ignoraron datos no válidos: ${SIN_HTML(val.errores.join('; '))}</p>` : ''}
    ${rotas.length ? `<p class="pub-error" style="margin:8px 10px">Una acción apunta a un elemento que ya no existe. Elige otro destino.</p>` : ''}
    <datalist id="int-destinos">${destinos.map(d => OPCION(d, d, false)).join('')}</datalist>
    ${reglas.map((r, i) => `<div class="int-regla" data-i="${i}">
      <div class="int-linea"><span class="int-k">Cuando</span><select data-campo="evento" aria-label="Cuándo">${INT_EVENTOS.map(e => OPCION(e, NOMBRES_EVENTO[e], e === r.evento)).join('')}</select>
        <span class="int-k">sobre este elemento</span><button class="int-x" data-quitar-regla="${i}" title="Quitar la interacción" aria-label="Quitar la interacción"><i class="bi bi-trash"></i></button></div>
      <div class="int-linea int-cond"><label class="t-check"><input type="checkbox" data-campo="cond" ${r.condicion ? 'checked' : ''}><span>solo si</span></label>
        ${r.condicion ? `<input data-campo="cvar" value="${SIN_HTML(r.condicion.variable)}" aria-label="Variable" placeholder="variable" spellcheck="false">
        <select data-campo="cop" aria-label="Comparación">${[['igual', 'es'], ['distinto', 'no es'], ['vacia', 'está vacía'], ['definida', 'tiene valor']].map(([k, n]) => OPCION(k, n, k === r.condicion.op)).join('')}</select>
        ${['igual', 'distinto'].includes(r.condicion.op) ? `<input data-campo="cval" value="${SIN_HTML(r.condicion.valor)}" aria-label="Valor" placeholder="valor" spellcheck="false">` : ''}` : '<span class="hint" style="margin:0">(siempre)</span>'}</div>
      ${r.acciones.map((a, j) => filaAccion(c, a, j)).join('')}
      <button class="tb-btn int-mas" data-mas-accion="${i}"><i class="bi bi-plus"></i> otra acción</button>
    </div>`).join('')}
    <div style="padding:8px 10px"><button class="tb-btn primary" id="int-nueva"><i class="bi bi-plus-lg"></i> Añadir interacción</button></div>
    ${destinoDe.length ? `<div class="int-objetivo"><b><i class="bi bi-bullseye"></i> Lo controlan ${destinoDe.length} elemento(s)</b>
      <label class="t-check"><input type="checkbox" id="int-cerrado" ${attrs(c)['data-estado'] === 'cerrado' ? 'checked' : ''}><span>Empieza cerrado (oculto hasta que se abra)</span></label></div>` : ''}
    ${listaDePagina()}`;
  enlazarPanel(box, c, reglas);
  enlazarLista(box);
}
function enlazarPanel(box, c, reglas) {
  const guardar = () => { guardarReglas(c, reglas); pintarInteracciones(); mostrarCerradosDeSeleccion(); };
  box.querySelector('#int-nueva').onclick = () => {
    reglas.push({ id: 'r' + (reglas.length + 1), evento: 'clic', acciones: [{ tipo: 'alternar', objetivo: '' }] });
    guardar();
  };
  box.querySelectorAll('.int-regla').forEach(div => {
    const r = reglas[+div.dataset.i];
    div.querySelectorAll('[data-campo]').forEach(el => {
      const accion = el.closest('.int-accion');
      el.addEventListener('change', () => {
        const v = el.type === 'checkbox' ? el.checked : el.value.trim();
        if (accion) {
          const a = r.acciones[+accion.dataset.j];
          if (el.dataset.campo === 'tipo') { Object.keys(a).forEach(k => delete a[k]); a.tipo = v; if (CON_OBJETIVO.includes(v)) a.objetivo = ''; if (v === 'estado') a.valor = 'activo'; if (v === 'variable') { a.nombre = 'opcion'; a.valor = 'si'; } if (v === 'navegar') a.valor = '#'; }
          else if (el.dataset.campo === 'objetivo' && v === '__elegir') { eligiendo = { origen: c, regla: +div.dataset.i, accion: +accion.dataset.j }; toast('Haz clic en el elemento del lienzo que quieres controlar (Esc cancela)', 4000); return; }
          else a[el.dataset.campo] = el.dataset.campo === 'nombre' ? slug(v).replace(/_/g, '-') : v;
        } else if (el.dataset.campo === 'evento') r.evento = v;
        else if (el.dataset.campo === 'cond') { if (v) r.condicion = { variable: 'opcion', op: 'igual', valor: 'si' }; else delete r.condicion; }
        else if (el.dataset.campo === 'cvar') r.condicion.variable = slug(v).replace(/_/g, '-');
        else if (el.dataset.campo === 'cop') r.condicion.op = v;
        else if (el.dataset.campo === 'cval') r.condicion.valor = v;
        const prueba = validarReglasInt(reglas);
        if (prueba.errores.length) { toast('No válido: ' + prueba.errores[0], 4000); pintarInteracciones(); return; }
        guardar();
      });
    });
  });
  box.querySelectorAll('[data-quitar-regla]').forEach(b => b.onclick = () => { reglas.splice(+b.dataset.quitarRegla, 1); guardar(); });
  box.querySelectorAll('[data-quitar-accion]').forEach(b => b.onclick = () => {
    const r = reglas[+b.closest('.int-regla').dataset.i];
    r.acciones.splice(+b.dataset.quitarAccion, 1);
    if (!r.acciones.length) reglas.splice(reglas.indexOf(r), 1);
    guardar();
  });
  box.querySelectorAll('[data-mas-accion]').forEach(b => b.onclick = () => { reglas[+b.dataset.masAccion].acciones.push({ tipo: 'abrir', objetivo: '' }); guardar(); });
  const cerrado = box.querySelector('#int-cerrado');
  if (cerrado) cerrado.onchange = () => {
    if (cerrado.checked) { c.addAttributes({ 'data-estado': 'cerrado' }); if (!['menu', 'modal'].includes(attrs(c)['data-int-tipo'])) c.addClass('int-panel'); }
    else c.addAttributes({ 'data-estado': 'abierto' });
    buscarComp(editor.getWrapper(), x => reglasDe(x).some(r => r.acciones.some(a => a.objetivo === iidDe(c)))).forEach(x => guardarReglas(x, reglasDe(x)));
    mostrarCerradosDeSeleccion();
  };
}
// Elegir el destino haciendo clic en el lienzo
editor.on('component:selected', (c) => {
  if (!eligiendo || !c || c === eligiendo.origen) return;
  const { origen, regla, accion } = eligiendo;
  eligiendo = null;
  const reglas = reglasDe(origen);
  const a = reglas[regla] && reglas[regla].acciones[accion];
  if (!a) return;
  a.objetivo = asegurarIid(c);
  if (['abrir', 'alternar', 'cerrar'].includes(a.tipo) && !attrs(c)['data-estado']) {
    c.addAttributes({ 'data-estado': 'abierto' });
    if (!['menu', 'modal'].includes(attrs(c)['data-int-tipo'])) c.addClass('int-panel');
  }
  guardarReglas(origen, reglas);
  setTimeout(() => { editor.select(origen); showTab('right', 'interacciones'); toast('Destino elegido: ' + nombreElemento(c)); }, 0);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && eligiendo) { eligiendo = null; toast('Elección cancelada'); } });

// Todas las interacciones de la página, para encontrarlas y ver si hay rotas
function listaDePagina() {
  const raiz = editor.getWrapper();
  const con = buscarComp(raiz, x => !!attrs(x)['data-int']);
  if (!con.length) return '';
  return `<div class="int-lista"><div class="ov-title"><i class="bi bi-list-check"></i> En esta página (${con.length})</div>
    ${con.map((x, i) => {
      const v = validarReglasInt(attrs(x)['data-int']);
      const rota = v.errores.length || v.reglas.some(r => r.acciones.some(a => a.objetivo && !porIid(raiz, a.objetivo)));
      const resumenR = v.reglas.map(r => `${NOMBRES_EVENTO[r.evento].split(' ')[0]} → ${r.acciones.map(a => NOMBRES_ACCION[a.tipo] + (a.objetivo ? ' ' + nombreElemento(porIid(raiz, a.objetivo)) : '')).join(', ')}`).join(' · ');
      return `<button class="int-item ${rota ? 'rota' : ''}" data-ver-int="${i}" title="${SIN_HTML(resumenR)}"><i class="bi bi-${rota ? 'exclamation-triangle' : 'lightning-charge'}"></i> <span>${SIN_HTML(nombreElemento(x))}</span><small>${SIN_HTML(resumenR)}</small></button>`;
    }).join('')}</div>`;
}
function enlazarLista(box) {
  const con = buscarComp(editor.getWrapper(), x => !!attrs(x)['data-int']);
  box.querySelectorAll('[data-ver-int]').forEach(b => b.onclick = () => { const c = con[+b.dataset.verInt]; editor.select(c); const el = c.getEl(); if (el) el.scrollIntoView({ block: 'center' }); });
}
editor.on('component:selected component:deselected page:select', () => setTimeout(pintarInteracciones, 0));
editor.on('component:update:attributes', (c) => { if (c === editor.getSelected() && !eligiendo) setTimeout(pintarInteracciones, 0); });
editor.on('load', pintarInteracciones);

/* ---------- Revisión: reglas rotas antes de publicar ---------- */
REVISIONES_EXTRA.push((pagina, raiz) => {
  const out = [];
  buscarComp(raiz, x => !!attrs(x)['data-int']).forEach(x => {
    const v = validarReglasInt(attrs(x)['data-int']);
    if (v.errores.length) out.push({ nivel: 'error', tipo: 'interaccion', comp: x, msg: 'Interacción con datos no válidos: ' + v.errores.join('; ') });
    v.reglas.forEach(r => r.acciones.forEach(a => {
      if (a.objetivo && !porIid(raiz, a.objetivo)) out.push({ nivel: 'error', tipo: 'interaccion', comp: x, msg: `La interacción de «${nombreElemento(x)}» intenta ${NOMBRES_ACCION[a.tipo]} un elemento que ya no existe.` });
    }));
  });
  return out;
});

/* ---------- Menú móvil, acordeón y modal listos para usar ---------- */
const INT_REGLA = (acciones) => SIN_HTML(JSON.stringify([{ id: 'r1', evento: 'clic', acciones }]));
const SEC_INT = {
  menu: () => `
<header class="menu-int">
  <nav class="container menu-int-barra" aria-label="Menú principal">
<a class="menu-int-marca" href="index.html">Mi Sitio</a>
<button type="button" class="menu-int-boton" data-iid="__UID__-boton" aria-controls="__UID__-panel" aria-expanded="false" aria-label="Menú" data-int="${INT_REGLA([{ tipo: 'alternar', objetivo: '__UID__-panel' }])}"><span class="menu-int-icono" aria-hidden="true"></span></button>
<ul class="menu-int-panel" id="__UID__-panel" data-iid="__UID__-panel" data-int-tipo="menu" data-int-nombre="Opciones del menú" data-estado="cerrado">
  <li><a class="nav-link" href="index.html">Inicio</a></li>
  <li><a class="nav-link" href="servicios.html">Servicios</a></li>
  <li><a class="nav-link" href="portafolio.html">Portafolio</a></li>
  <li><a class="nav-link" href="contacto.html">Contacto</a></li>
</ul>
  </nav>
</header>`,
  acordeon: () => `
<section class="seccion fondo-claro" id="preguntas">
  <div class="container" style="max-width:820px">
<div class="text-center mb-5"><span class="eyebrow">Ayuda</span><h2 class="font-titulo display-6 mt-3">Preguntas frecuentes</h2></div>
<div class="int-acordeon" data-int-teclas="acordeon">
  ${[['¿Cuánto tarda un proyecto?', 'Depende del alcance. Un sitio sencillo suele estar listo en dos a cuatro semanas.'], ['¿Qué necesito para empezar?', 'Tus textos, tus imágenes y una idea clara de lo que quieres comunicar.'], ['¿Ofrecen mantenimiento?', 'Sí: actualizamos contenidos y revisamos que todo funcione cada mes.']]
    .map(([p, r], i) => `
  <div class="int-acordeon-item"><h3 class="int-acordeon-titulo"><button type="button" class="int-acordeon-boton" id="__UID__-b${i + 1}" data-iid="__UID__-b${i + 1}" aria-controls="__UID__-p${i + 1}" aria-expanded="false" data-int="${INT_REGLA([{ tipo: 'alternar', objetivo: '__UID__-p' + (i + 1) }])}">${p}</button></h3>
    <div class="int-acordeon-panel int-panel" id="__UID__-p${i + 1}" data-iid="__UID__-p${i + 1}" role="region" aria-labelledby="__UID__-b${i + 1}" data-int-nombre="Respuesta ${i + 1}" data-estado="cerrado"><p class="mb-0">${r}</p></div></div>`).join('')}
</div>
  </div>
</section>`,
  modal: () => `
<section class="seccion text-center" aria-labelledby="__UID__-t">
  <div class="container" style="max-width:760px">
<h2 class="font-titulo display-6" id="__UID__-t">¿Quieres una cotización?</h2>
<p class="text-secondary mb-4">Mira qué incluye y pídela en un minuto.</p>
<button type="button" class="btn-sitio" data-iid="__UID__-abrir" aria-haspopup="dialog" aria-controls="__UID__-modal" data-int="${INT_REGLA([{ tipo: 'abrir', objetivo: '__UID__-modal' }])}">Ver qué incluye</button>
<div class="int-modal" id="__UID__-modal" data-iid="__UID__-modal" data-int-tipo="modal" data-int-nombre="Ventana de cotización" role="dialog" aria-modal="true" aria-labelledby="__UID__-mt" data-estado="cerrado">
  <div class="int-modal-caja">
    <h3 class="font-titulo h4" id="__UID__-mt">Qué incluye la cotización</h3>
    <ul class="text-secondary"><li>Reunión inicial para entender tu proyecto</li><li>Propuesta de diseño y plazos</li><li>Precio cerrado, sin sorpresas</li></ul>
    <div class="d-flex flex-wrap gap-2 justify-content-end mt-4">
      <button type="button" class="btn-sitio-linea" data-iid="__UID__-cerrar" data-int="${INT_REGLA([{ tipo: 'cerrar', objetivo: '__UID__-modal' }])}">Cerrar</button>
      <a class="btn-sitio" href="contacto.html">Pedir cotización</a>
    </div>
  </div>
</div>
  </div>
</section>`
};
CATS_SEC.splice(CATS_SEC.findIndex(c => c.id === 'vinculados'), 0, { id: 'interactivos', nombre: 'Interactivos (accesibles)', icono: 'lightning-charge' });
[['sec-menu-int', 'Menú móvil accesible', SEC_INT.menu], ['sec-acordeon-int', 'Acordeón accesible', SEC_INT.acordeon], ['sec-modal-int', 'Modal accesible', SEC_INT.modal]].forEach(([id, nombre, html]) => {
  SECCIONES.push({ id, cat: 'interactivos', nombre, html });
  add('sec', id, nombre, 'lightning-charge', html());
});
// Las preguntas frecuentes también ofrecen la versión accesible
SECCIONES.push({ id: 'sec-acordeon-int-faq', cat: 'faq', nombre: 'Preguntas frecuentes (accesible, sin Bootstrap JS)', html: SEC_INT.acordeon, bloque: 'sec-acordeon-int' });
