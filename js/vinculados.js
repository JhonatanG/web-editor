/* =====================================================================
   Componentes vinculados (menú, pie, tarjetas y llamadas a la acción)

   Un componente vinculado tiene UN principal y varias instancias, que
   pueden estar en cualquier página. Todo vive en el propio modelo de
   GrapesJS, así que se guarda, se deshace y se exporta con el proyecto:

     raíz      data-vinculo="v-xxxx"   (identifica al grupo)
               vinculoRol: 'principal' | 'instancia'   (propiedad, no atributo)
               vinculoNombre, vinculoTipo              (en el principal)
               vOvr: { clave: { texto?, href?, src?, alt? } }  (en cada instancia)
     piezas    data-vk="k3"            (clave estable de lo que se puede sobrescribir)

   Al editar el principal, los cambios se copian a las instancias (también
   los estilos de Tablet y Móvil). En una instancia solo se pueden cambiar
   las propiedades autorizadas: texto, enlace e imagen. Lo que se cambia
   queda como «sobrescrito» y se puede volver a heredar.

   La copia a las instancias NO entra en el historial de deshacer: deshacer
   un cambio del principal lo vuelve a propagar, así las instancias nunca
   quedan desfasadas del principal.
===================================================================== */
const VINC = 'data-vinculo';
const VK = 'data-vk';
const TIPOS_VINC = { menu: 'Menú', pie: 'Pie de página', tarjeta: 'Tarjeta', cta: 'Llamada a la acción', seccion: 'Sección' };
const PROPS_AUT = { texto: 'Texto', href: 'Enlace', src: 'Imagen', alt: 'Texto alternativo' };

const attrDe = (c, k) => ((c && c.get && c.get('attributes')) || {})[k];
const vidDe = (c) => attrDe(c, VINC) || '';
const rolDe = (c) => (c && c.get && c.get('vinculoRol')) || (vidDe(c) ? 'instancia' : '');

function raizVinculo(c) {
  for (let x = c; x; x = x.parent && x.parent()) if (vidDe(x)) return x;
  return null;
}
// Todas las piezas de un grupo, en todas las páginas (sobre el modelo)
function piezasDe(vid) {
  const out = [];
  editor.Pages.getAll().forEach(page => {
    const raiz = page.getMainComponent();
    if (raiz) buscarComp(raiz, c => vidDe(c) === vid).forEach(comp => out.push({ page, comp }));
  });
  return out;
}
function todosLosVinculos() {
  const grupos = new Map();
  editor.Pages.getAll().forEach(page => {
    const raiz = page.getMainComponent();
    if (!raiz) return;
    buscarComp(raiz, c => !!vidDe(c)).forEach(comp => {
      const vid = vidDe(comp);
      if (!grupos.has(vid)) grupos.set(vid, { vid, principal: null, instancias: [] });
      const g = grupos.get(vid);
      if (comp.get('vinculoRol') === 'principal' && !g.principal) g.principal = { page, comp };
      else g.instancias.push({ page, comp });
    });
  });
  return [...grupos.values()];
}
const principalDe = (vid) => { const p = piezasDe(vid).find(x => x.comp.get('vinculoRol') === 'principal'); return p ? p.comp : null; };
const nombreVinculo = (vid) => { const m = principalDe(vid); return (m && m.get('vinculoNombre')) || 'Componente vinculado'; };

/* ---------- Qué se puede sobrescribir en una instancia ---------- */
const TIPOS_TEXTO = ['text', 'link', 'btn-text', 'label'];
const esTextual = (c) => !!c && TIPOS_TEXTO.includes(c.get('type'));
function propsAutorizadas(c) {
  const t = tagDe(c), out = [];
  if (t === 'img') out.push('src', 'alt');
  if (t === 'a') out.push('href');
  if (esTextual(c)) out.push('texto');
  return out;
}
function valoresDe(c) {
  const v = {}, a = (c && c.get('attributes')) || {};
  propsAutorizadas(c).forEach(p => {
    if (p === 'texto') v.texto = c.getInnerHTML ? c.getInnerHTML() : '';
    else if (p === 'src') v.src = c.get('src') || a.src || '';
    else v[p] = a[p] === undefined ? '' : String(a[p]);
  });
  return v;
}
function ponerValor(c, prop, val) {
  if (prop === 'texto') c.components(val);
  else if (prop === 'src') { c.set('src', val); c.addAttributes({ src: val }); }
  else c.addAttributes({ [prop]: val });
}

// Da una clave estable (data-vk) a cada pieza sobrescribible que aún no la tenga.
// Los textos dentro de otro texto no reciben clave propia: los cubre su contenedor.
function asignarClaves(raiz) {
  let max = 0;
  recorrer(raiz, x => { const k = attrDe(x, VK); if (k && /^k\d+$/.test(k)) max = Math.max(max, +k.slice(1)); });
  const dentroDeTexto = (x) => { for (let p = x.parent(); p && p !== raiz; p = p.parent()) if (esTextual(p)) return true; return false; };
  recorrer(raiz, x => {
    if (x === raiz || attrDe(x, VK) || !propsAutorizadas(x).length) return;
    if (esTextual(x) && dentroDeTexto(x) && tagDe(x) !== 'a') return;
    x.addAttributes({ [VK]: 'k' + (++max) });
  });
}
const piezaPorClave = (raiz, k) => buscarComp(raiz, x => attrDe(x, VK) === k)[0] || null;

/* ---------- Bloqueo de las instancias ----------
   Una instancia no se reorganiza ni se estiliza por su cuenta: su forma la
   decide el principal. Solo quedan editables los textos con clave. */
const PROPS_BLOQUEO = ['draggable', 'droppable', 'removable', 'copyable', 'stylable', 'editable'];
function bloquearInstancia(raiz) {
  raiz.set({ droppable: false, stylable: false });
  recorrer(raiz, x => {
    if (x === raiz) return;
    x.set({ draggable: false, droppable: false, removable: false, copyable: false, stylable: false,
      editable: esTextual(x) && !!attrDe(x, VK) });
  });
}
function desbloquear(raiz) {
  recorrer(raiz, x => {
    let def = {};
    try { def = (typeof x.defaults === 'function' ? x.defaults() : x.defaults) || {}; } catch (e) { def = {}; }
    const v = {};
    PROPS_BLOQUEO.forEach(p => { v[p] = def[p] !== undefined ? def[p] : true; });
    if (x === raiz) { delete v.draggable; delete v.removable; delete v.copyable; delete v.editable; }
    x.set(v);
  });
}

/* ---------- Copiar el principal a una instancia ---------- */
function borrarReglasDe(raiz) {
  recorrer(raiz, x => {
    try { editor.Css.getRules('#' + x.getId()).forEach(r => editor.Css.remove(r)); } catch (e) { /* sin reglas */ }
  });
}
function reconstruirInstancia(inst, principal, page) {
  borrarReglasDe(inst);
  const ma = { ...(principal.get('attributes') || {}) };
  const propio = attrDe(inst, 'id');
  delete ma.id;
  if (propio) ma.id = propio;
  inst.setAttributes(ma);
  inst.setClass(principal.getClasses());
  inst.components(principal.components().map(h => h.toHTML()).join(''));
  copiarEstilos(principal, inst);
  aplicarSobrescritos(inst);
  bloquearInstancia(inst);
  inst.set('vinculoRol', 'instancia');
  const raiz = page && page.getMainComponent();
  if (raiz) {
    if (ES_NAV(inst)) marcarActivo(raiz, archivoDePagina(page));
    repararReferencias(raiz);
  }
}
function aplicarSobrescritos(inst) {
  const ovr = inst.get('vOvr') || {};
  Object.keys(ovr).forEach(k => {
    const x = piezaPorClave(inst, k);
    if (!x) return;
    Object.entries(ovr[k]).forEach(([p, v]) => { if (propsAutorizadas(x).includes(p)) ponerValor(x, p, v); });
  });
}

let propagando = false;
function propagarVinculo(vid) {
  const m = principalDe(vid);
  if (!m) return 0;
  let n = 0;
  propagando = true;
  try {
    editor.UndoManager.skip(() => {
      asignarClaves(m);
      piezasDe(vid).forEach(({ page, comp }) => {
        if (comp === m) return;
        reconstruirInstancia(comp, m, page);
        n++;
      });
    });
  } finally { propagando = false; }
  return n;
}

const pendientes = new Map();
function programarPropagacion(vid) {
  clearTimeout(pendientes.get(vid));
  pendientes.set(vid, setTimeout(() => { pendientes.delete(vid); propagarVinculo(vid); pintarCajaVinculo(); }, 350));
}
// Antes de guardar, exportar o cambiar de página no puede quedar nada a medias
function propagarPendientes() {
  [...pendientes.keys()].forEach(vid => { clearTimeout(pendientes.get(vid)); pendientes.delete(vid); propagarVinculo(vid); });
}

/* ---------- Escuchar los cambios ---------- */
function alCambiar(c) {
  if (propagando || !c || !c.get) return;
  const r = raizVinculo(c);
  if (!r) return;
  if (rolDe(r) === 'principal') { programarPropagacion(vidDe(r)); return; }
  registrarSobrescrito(r, c);
}
// En una instancia: lo que difiere del principal queda sobrescrito; lo que vuelve
// a ser igual, deja de estarlo.
function registrarSobrescrito(inst, pieza) {
  const k = attrDe(pieza, VK);
  if (!k || pieza === inst) return;
  const m = principalDe(vidDe(inst));
  const mp = m && piezaPorClave(m, k);
  if (!mp) return;
  const vi = valoresDe(pieza), vm = valoresDe(mp);
  const dif = {};
  Object.keys(vi).forEach(p => { if (vi[p] !== vm[p]) dif[p] = vi[p]; });
  const ovr = { ...(inst.get('vOvr') || {}) };
  if (Object.keys(dif).length) ovr[k] = dif; else delete ovr[k];
  if (JSON.stringify(ovr) !== JSON.stringify(inst.get('vOvr') || {})) inst.set('vOvr', ovr);
  pintarCajaVinculo();
}
['component:update:components', 'component:update:attributes', 'component:update:classes', 'component:update:src', 'component:styleUpdate']
  .forEach(ev => editor.on(ev, alCambiar));
editor.on('rte:disable', (v) => alCambiar(v && (v.model || v)));
// Al duplicar el principal (Ctrl+D), la copia es una instancia más
editor.on('component:clone', (c) => { if (c && c.get && c.get('vinculoRol') === 'principal') c.set('vinculoRol', 'instancia'); });
editor.on('page:select', propagarPendientes);

/* ---------- Normalizar: copias pegadas, páginas nuevas, proyectos abiertos ---------- */
// Un componente con data-vinculo pero sin rol (llegó como HTML: página nueva,
// pegado…) es una instancia: hereda los estilos del principal y se bloquea.
function normalizarVinculos() {
  let n = 0;
  todosLosVinculos().forEach(g => {
    if (!g.principal) return;   // huérfano: se ofrece convertir uno en principal
    g.instancias.forEach(({ page, comp }) => {
      if (comp.get('vinculoRol') === 'instancia' && comp.get('vinculoListo')) return;
      reconstruirInstancia(comp, g.principal.comp, page);
      comp.set('vinculoListo', true);
      n++;
    });
  });
  return n;
}
editor.on('load', () => setTimeout(() => {
  editor.UndoManager.skip(() => { propagando = true; try { normalizarVinculos(); } finally { propagando = false; } });
  pintarEstadoVinculos();
}, 400));
editor.on('page:add', () => setTimeout(() => { propagando = true; try { normalizarVinculos(); } finally { propagando = false; } }, 0));

/* ---------- Acciones ---------- */
function tipoSugerido(c) {
  if (ES_NAV(c)) return 'menu';
  if (ES_PIE(c)) return 'pie';
  if (['card', 'tarjeta-img', 'producto', 'testimonio', 'proyecto', 'servicio-ico'].some(k => tieneClase(c, k))) return 'tarjeta';
  if (tieneClase(c, 'cta') || tieneClase(c, 'seccion-cta')) return 'cta';
  if (tagDe(c) === 'section') return 'seccion';
  return '';
}
function vincular(comp, tipo, nombre) {
  const vid = 'v-' + Math.random().toString(36).slice(2, 8);
  comp.addAttributes({ [VINC]: vid });
  comp.set({ vinculoRol: 'principal', vinculoTipo: tipo, vinculoNombre: nombre || TIPOS_VINC[tipo] || 'Componente' });
  asignarClaves(comp);
  return vid;
}
// Inserta una instancia de un grupo en un punto (padre + índice)
function insertarInstancia(vid, padre, at) {
  const m = principalDe(vid);
  if (!m || !padre) return null;
  asignarClaves(m);
  const nuevo = padre.append(m.toHTML(), at === undefined ? {} : { at })[0];
  const page = editor.Pages.getSelected();
  propagando = true;
  try { reconstruirInstancia(nuevo, m, page); nuevo.set('vinculoListo', true); } finally { propagando = false; }
  return nuevo;
}
function desvincular(comp) {
  const eraPrincipal = rolDe(comp) === 'principal';
  recorrer(comp, x => x.removeAttributes(VK));
  comp.removeAttributes(VINC);
  comp.unset('vinculoRol'); comp.unset('vOvr'); comp.unset('vinculoListo');
  comp.unset('vinculoNombre'); comp.unset('vinculoTipo');
  desbloquear(comp);
  return eraPrincipal;
}
// Convierte una instancia en el nuevo principal (si el principal se borró, o por decisión)
function hacerPrincipal(comp) {
  const vid = vidDe(comp);
  const anterior = principalDe(vid);
  const nombre = (anterior && anterior.get('vinculoNombre')) || comp.get('vinculoNombre') || 'Componente vinculado';
  const tipo = (anterior && anterior.get('vinculoTipo')) || tipoSugerido(comp) || 'seccion';
  if (anterior && anterior !== comp) { anterior.set('vinculoRol', 'instancia'); anterior.set('vOvr', {}); bloquearInstancia(anterior); }
  desbloquear(comp);
  comp.set({ vinculoRol: 'principal', vinculoNombre: nombre, vinculoTipo: tipo, vOvr: {} });
  propagarVinculo(vid);
}
function restablecer(inst, clave, prop) {
  const ovr = { ...(inst.get('vOvr') || {}) };
  if (clave) {
    if (prop && ovr[clave]) { const o = { ...ovr[clave] }; delete o[prop]; if (Object.keys(o).length) ovr[clave] = o; else delete ovr[clave]; }
    else delete ovr[clave];
  } else Object.keys(ovr).forEach(k => delete ovr[k]);
  inst.set('vOvr', ovr);
  const m = principalDe(vidDe(inst));
  const page = editor.Pages.getAll().find(p => buscarComp(p.getMainComponent(), x => x === inst).length);
  propagando = true;
  try { if (m) reconstruirInstancia(inst, m, page); } finally { propagando = false; }
}
function irAPrincipal(vid) {
  const p = piezasDe(vid).find(x => x.comp.get('vinculoRol') === 'principal');
  if (p) irA(p.page, p.comp);
}

/* ---------- Asistente: vincular menú o pie en varias páginas ----------
   Los proyectos anteriores pueden tener menús distintos en cada página.
   No se tocan solos: se muestra qué páginas tienen uno igual y cuáles uno
   distinto, y la persona decide cuáles vincular. */
function huellaDe(c) {
  return c ? c.toHTML()
    .replace(/\s(id|data-vk|data-vinculo|aria-controls|data-bs-target|aria-current)="[^"]*"/g, '')
    .replace(/\sclass="([^"]*)"/g, (m, k) => ' class="' + k.split(/\s+/).filter(x => x && x !== 'active').join(' ') + '"')
    .replace(/\s+/g, ' ').replace(/\s(?=>)/g, '') : '';
}
function piezaComunDe(raiz, pred) {
  const todos = buscarComp(raiz, pred);
  return todos.find(c => { for (let x = c.parent(); x; x = x.parent()) if (todos.includes(x)) return false; return true; }) || null;
}
function asistenteVincular(tipo) {
  const pred = tipo === 'menu' ? ES_NAV : ES_PIE;
  const etiqueta = tipo === 'menu' ? 'menú' : 'pie';
  const actual = editor.Pages.getSelected();
  const origen = piezaComunDe(editor.getWrapper(), pred);
  if (!origen) { alert(`Esta página no tiene ${etiqueta}. Colócalo primero aquí.`); return; }
  const vidOrigen = vidDe(origen);
  const huella = huellaDe(origen);
  const filas = editor.Pages.getAll().filter(p => p !== actual).map(p => {
    const c = piezaComunDe(p.getMainComponent(), pred);
    let estado = 'sin', txt = `no tiene ${etiqueta}: se añadirá`;
    if (c && vidOrigen && vidDe(c) === vidOrigen) { estado = 'ya'; txt = 'ya vinculado'; }
    else if (c && huellaDe(c) === huella) { estado = 'igual'; txt = 'idéntico'; }
    else if (c) { estado = 'distinto'; txt = vidDe(c) ? 'vinculado a otro grupo' : 'distinto: conserva el suyo si no lo marcas'; }
    return { p, c, estado, txt };
  });
  const w = document.createElement('div');
  w.innerHTML = `
    <p class="imp-hint">El ${etiqueta} de <b>${archivoDePagina(actual)}</b> será el <b>principal</b>${vidOrigen ? ' (ya lo es)' : ''}. Las páginas marcadas mostrarán una instancia vinculada: al editar el principal, cambiarán todas.</p>
    <div class="vinc-lista">${filas.map((f, i) => `
      <label class="t-check vinc-fila ${f.estado}"><input type="checkbox" data-i="${i}" ${f.estado === 'ya' ? 'checked disabled' : f.estado === 'distinto' ? '' : 'checked'}>
        <span><b>${archivoDePagina(f.p)}</b> · ${f.txt}</span></label>`).join('') || '<p class="hint">No hay otras páginas todavía.</p>'}</div>
    <p class="hint">Las páginas que dejes sin marcar conservan su ${etiqueta} tal como está. Puedes vincularlas más tarde.</p>
    <div style="text-align:right;margin-top:10px"><button class="tb-btn primary" id="vinc-ok"><i class="bi bi-link-45deg"></i> Vincular</button></div>`;
  w.querySelector('#vinc-ok').onclick = () => {
    const marcadas = [...w.querySelectorAll('input[data-i]:checked:not(:disabled)')].map(i => filas[+i.dataset.i]);
    const vid = vidOrigen || vincular(origen, tipo, tipo === 'menu' ? 'Menú principal' : 'Pie de página');
    if (rolDe(origen) !== 'principal') hacerPrincipal(origen);
    propagando = true;
    try {
      marcadas.forEach(({ p, c }) => {
        const raiz = p.getMainComponent();
        let padre, at;
        if (c) { padre = c.parent(); at = c.index(); c.remove(); }
        else if (tipo === 'menu') {
          padre = raiz.components().find(x => tagDe(x) === 'header') || raiz; at = 0;
        } else { padre = raiz; const pies = raiz.components().filter(x => ES_FLOTANTE(x)); at = pies.length ? pies[0].index() : undefined; }
        const nuevo = padre.append(origen.toHTML(), at === undefined ? {} : { at })[0];
        reconstruirInstancia(nuevo, origen, p);
        nuevo.set('vinculoListo', true);
        aplicarSemantica(raiz);
      });
    } finally { propagando = false; }
    marcarActivo(editor.getWrapper(), archivoDePagina(actual));
    editor.Modal.close();
    editor.store();
    pintarEstadoVinculos(); pintarCajaVinculo();
    toast(marcadas.length ? `${etiqueta[0].toUpperCase() + etiqueta.slice(1)} vinculado en ${marcadas.length + 1} página(s)` : `El ${etiqueta} de esta página ahora es el principal`, 3500);
  };
  editor.Modal.open({ title: `Vincular ${etiqueta}`, content: w });
}
$('#vinc-nav').onclick = () => asistenteVincular('menu');
$('#vinc-pie').onclick = () => asistenteVincular('pie');

// Resumen en la pestaña Páginas: qué está vinculado y qué difiere entre páginas
function pintarEstadoVinculos() {
  const box = $('#vinc-estado');
  if (!box) return;
  const lineas = [];
  [['menu', ES_NAV, 'Menú'], ['pie', ES_PIE, 'Pie']].forEach(([, pred, nom]) => {
    const piezas = editor.Pages.getAll().map(p => piezaComunDe(p.getMainComponent(), pred)).filter(Boolean);
    if (!piezas.length) return;
    const vids = new Set(piezas.map(vidDe).filter(Boolean));
    const huellas = new Set(piezas.filter(c => !vidDe(c)).map(huellaDe));
    if (vids.size === 1 && piezas.every(vidDe)) lineas.push(`<span class="ok"><i class="bi bi-link-45deg"></i> ${nom} vinculado en ${piezas.length} página(s)</span>`);
    else if (vids.size) lineas.push(`<span class="avi"><i class="bi bi-link"></i> ${nom}: ${piezas.filter(vidDe).length} vinculado(s), ${piezas.filter(c => !vidDe(c)).length} suelto(s)</span>`);
    else if (huellas.size > 1) lineas.push(`<span class="avi"><i class="bi bi-exclamation-triangle"></i> ${nom}: hay ${huellas.size} versiones distintas entre páginas</span>`);
    else if (piezas.length > 1) lineas.push(`<span><i class="bi bi-files"></i> ${nom}: copias iguales sin vincular</span>`);
  });
  box.innerHTML = lineas.join('');
}
['page:add', 'page:remove', 'page:select'].forEach(ev => editor.on(ev, () => setTimeout(pintarEstadoVinculos, 50)));

/* ---------- Caja «Componente vinculado» en el panel derecho ---------- */
function pintarCajaVinculo() {
  const box = $('#vinc-box');
  if (!box) return;
  const c = editor.getSelected();
  const r = c && raizVinculo(c);
  if (!c || (c.is && c.is('wrapper'))) { box.hidden = true; return; }
  if (!r) {
    const cand = ['menu', 'pie', 'tarjeta', 'cta', 'seccion'].includes(tipoSugerido(c)) ? c : null;
    if (!cand) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = `<div class="vinc-cab"><i class="bi bi-link-45deg"></i> <span>¿Lo usarás en varios sitios?</span>
      <button class="tb-btn" id="vb-crear" title="Convertir en componente vinculado"><i class="bi bi-link"></i> Vincular</button></div>`;
    box.querySelector('#vb-crear').onclick = () => {
      const tipo = tipoSugerido(c);
      const nombre = prompt('Nombre del componente vinculado:', TIPOS_VINC[tipo] || 'Componente');
      if (nombre === null) return;
      vincular(c, tipo, nombre.trim() || TIPOS_VINC[tipo]);
      editor.store(); pintarCajaVinculo(); pintarEstadoVinculos(); refrescarListaVinculados();
      toast('Componente vinculado creado. Insértalo en otras páginas desde Secciones → Vinculados.', 4000);
    };
    return;
  }
  const vid = vidDe(r);
  const piezas = piezasDe(vid);
  const nombre = SIN_HTML(nombreVinculo(vid));
  box.hidden = false;
  if (rolDe(r) === 'principal') {
    const paginas = new Set(piezas.map(p => p.page)).size;
    box.innerHTML = `<div class="vinc-cab principal"><i class="bi bi-link-45deg"></i>
      <span><b>${nombre}</b> · principal<br><small>${piezas.length - 1} instancia(s) en ${paginas} página(s). Lo que cambies aquí se copia a todas.</small></span></div>
      <div class="vinc-acc"><button class="tb-btn" id="vb-renombrar"><i class="bi bi-pencil"></i> Renombrar</button>
      <button class="tb-btn" id="vb-desv" title="Este deja de ser principal; las instancias quedan sueltas"><i class="bi bi-scissors"></i> Desvincular todo</button></div>`;
    box.querySelector('#vb-renombrar').onclick = () => {
      const n = prompt('Nombre del componente vinculado:', nombreVinculo(vid));
      if (n && n.trim()) { r.set('vinculoNombre', n.trim()); pintarCajaVinculo(); refrescarListaVinculados(); }
    };
    box.querySelector('#vb-desv').onclick = () => {
      if (!confirm(`¿Desvincular «${nombreVinculo(vid)}» en todas las páginas? Cada copia quedará suelta, tal como se ve ahora.`)) return;
      piezas.forEach(({ comp }) => desvincular(comp));
      editor.store(); pintarCajaVinculo(); pintarEstadoVinculos(); refrescarListaVinculados();
    };
    return;
  }
  const m = principalDe(vid);
  const ovr = r.get('vOvr') || {};
  const k = attrDe(c, VK);
  const aut = c !== r ? propsAutorizadas(c) : [];
  const fila = (p) => {
    const local = k && ovr[k] && p in ovr[k];
    return `<div class="vinc-prop ${local ? 'local' : 'heredado'}"><span>${PROPS_AUT[p]}</span>
      <em>${local ? 'propio de esta página' : 'heredado'}</em>
      ${local ? `<button class="tb-btn" data-rest="${p}" title="Volver a heredar del principal"><i class="bi bi-arrow-counterclockwise"></i></button>` : ''}</div>`;
  };
  const nOvr = Object.keys(ovr).length;
  box.innerHTML = `<div class="vinc-cab"><i class="bi bi-link-45deg"></i>
    <span>Instancia de <b>${nombre}</b>${m ? '' : ' <em class="vinc-huerfano">(sin principal)</em>'}<br>
    <small>Aquí puedes cambiar textos, enlaces e imágenes. El resto se edita en el principal.</small></span></div>
    ${k && aut.length ? `<div class="vinc-props">${aut.map(fila).join('')}</div>` : ''}
    ${c !== r && !k ? '<p class="hint" style="margin:6px 0 0">Esta parte la controla el principal.</p>' : ''}
    <div class="vinc-acc">
      ${m ? '<button class="tb-btn" id="vb-ir"><i class="bi bi-box-arrow-up-right"></i> Editar el principal</button>' : '<button class="tb-btn primary" id="vb-prin"><i class="bi bi-star"></i> Hacer principal</button>'}
      ${nOvr ? `<button class="tb-btn" id="vb-rest" title="Quitar todos los cambios propios de esta instancia"><i class="bi bi-arrow-counterclockwise"></i> Heredar todo (${nOvr})</button>` : ''}
      <button class="tb-btn" id="vb-desv" title="Esta copia deja de seguir al principal"><i class="bi bi-scissors"></i> Desvincular</button>
    </div>`;
  box.querySelectorAll('[data-rest]').forEach(b => b.onclick = () => {
    restablecer(r, k, b.dataset.rest);
    const x = piezaPorClave(r, k);
    if (x) editor.select(x);
    editor.store(); pintarCajaVinculo();
    toast(PROPS_AUT[b.dataset.rest] + ' heredado del principal');
  });
  const b = (id) => box.querySelector(id);
  if (b('#vb-ir')) b('#vb-ir').onclick = () => irAPrincipal(vid);
  if (b('#vb-prin')) b('#vb-prin').onclick = () => { hacerPrincipal(r); editor.store(); pintarCajaVinculo(); };
  if (b('#vb-rest')) b('#vb-rest').onclick = () => { restablecer(r); editor.select(r); editor.store(); pintarCajaVinculo(); toast('La instancia vuelve a heredar todo'); };
  b('#vb-desv').onclick = () => { desvincular(r); editor.store(); pintarCajaVinculo(); pintarEstadoVinculos(); toast('Instancia desvinculada'); };
}
editor.on('component:selected component:deselected', () => setTimeout(pintarCajaVinculo, 0));

// La lista de «Vinculados» de la pestaña Secciones (la define secciones.js)
let refrescarListaVinculados = () => {};
