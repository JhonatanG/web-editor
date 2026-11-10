/* =====================================================================
   Inspector adaptable
   Dos cosas distintas que antes iban juntas:
     · el ANCHO que se previsualiza (arrastrando el borde del lienzo o
       escribiendo un número), y
     · el RANGO de estilos que se edita: Escritorio (todos los tamaños),
       Tablet (≤ 991 px) o Móvil (≤ 575 px).
   Por defecto el rango sigue al ancho, pero se puede fijar: así se puede
   ver la página a 820 px mientras se editan los estilos de Móvil.

   «Ajustes adaptables» (pestaña Estilo) muestra lo más usado al adaptar
   un diseño —columnas, orden, alineación, separación, tamaños y
   tipografía— e indica de dónde sale cada valor:
     local      ajuste guardado para el rango que se edita (se puede quitar)
     heredado   viene de un rango más ancho (Escritorio → Tablet → Móvil)
     diseño     no hay ajuste: lo dan las clases de Bootstrap o site.css
   Escribe en las mismas reglas #id + @media que el panel de GrapesJS, así
   que conserva las reglas existentes y se exporta igual.
===================================================================== */
const RANGOS = [
  { id: 'escritorio', nombre: 'Escritorio', detalle: 'todos los tamaños', media: '', widthMedia: '', dispositivo: 'desktop', ancho: 1280 },
  { id: 'tablet', nombre: 'Tablet', detalle: '≤ 991 px', media: '(max-width: 991px)', widthMedia: '991px', dispositivo: 'tablet', ancho: 768 },
  { id: 'movil', nombre: 'Móvil', detalle: '≤ 575 px', media: '(max-width: 575px)', widthMedia: '575px', dispositivo: 'mobile', ancho: 375 }
];
const rangoPorWidthMedia = (wm) => RANGOS.find(r => r.widthMedia === (wm || '')) || RANGOS[0];
const rangoParaAncho = (w) => (w <= 575 ? RANGOS[2] : w <= 991 ? RANGOS[1] : RANGOS[0]);
function rangoActual() { const d = editor.Devices.getSelected(); return rangoPorWidthMedia(d && d.get('widthMedia')); }
let rangoFijo = null;   // null: el rango sigue al ancho

/* ---------- Ancho personalizado del lienzo ----------
   GrapesJS solo redimensiona el lienzo al CAMBIAR de dispositivo, así que se
   alternan dos dispositivos «libres» con el ancho y el rango pedidos. */
let turnoLibre = 0;
function ponerVista(ancho, rango) {
  ancho = Math.round(Math.min(2560, Math.max(320, ancho)));
  rango = rango || rangoFijo || rangoParaAncho(ancho);
  const estandar = RANGOS.find(r => r.ancho === ancho && r === rango);
  if (estandar) { elegirDispositivo(estandar.dispositivo); return; }
  const id = 'libre-' + (turnoLibre = 1 - turnoLibre);
  const d = editor.Devices.get(id) || editor.Devices.add({ id, name: 'Personalizado' });
  d.set({ width: ancho + 'px', widthMedia: rango.widthMedia });
  editor.setDevice(id);
  $$('[data-device]').forEach(b => marcar(b, false));
  ajustarEscala();
  pintarControlesVista();
}
function elegirDispositivo(id) {
  editor.setDevice(id);
  $$('[data-device]').forEach(b => marcar(b, b.dataset.device === id));
  ajustarEscala();
  pintarControlesVista();
}
// El ancho pedido (el del dispositivo) y no el del marco: este se anima
// durante ~0,3 s y leerlo a mitad devolvía un valor intermedio.
function anchoVisto() {
  const d = editor.Devices.getSelected();
  const pedido = parseInt(d && d.get('width'), 10);
  if (pedido) return pedido;
  const win = editor.Canvas.getWindow();
  return Math.round((win && win.innerWidth) || anchoDelDispositivo());
}

/* ---------- Controles de la barra superior ---------- */
const inAncho = $('#ancho-lienzo'), btnRango = $('#rango-estilos'), menuRango = $('#rango-menu');
function pintarControlesVista() {
  if (document.activeElement !== inAncho) inAncho.value = anchoVisto();
  const r = rangoActual();
  $('#rango-txt').textContent = `Estilos: ${r.nombre}`;
  btnRango.classList.toggle('fijo', !!rangoFijo);
  btnRango.title = `Los cambios de estilo se guardan para ${r.nombre} (${r.detalle})` +
    (rangoFijo ? '. Rango fijado: no cambia al cambiar el ancho.' : '. Sigue al ancho de la vista.');
  colocarAsa();
  pintarAdaptable();
}
inAncho.addEventListener('change', () => { const v = parseInt(inAncho.value, 10); if (v && v !== anchoVisto()) ponerVista(v); });
inAncho.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inAncho.blur(); } });

function pintarMenuRango() {
  const r = rangoActual();
  menuRango.innerHTML = `
    <button role="menuitemradio" aria-checked="${!rangoFijo}" data-r=""><i class="bi bi-magic"></i><span><b>Automático</b><small>El rango sigue al ancho de la vista</small></span></button>
    ${RANGOS.map(x => `<button role="menuitemradio" aria-checked="${!!rangoFijo && rangoFijo === x}" data-r="${x.id}">
      <i class="bi bi-${x.id === 'escritorio' ? 'display' : x.id === 'tablet' ? 'tablet' : 'phone'}"></i>
      <span><b>${x.nombre}</b><small>${x.detalle}${x === r ? ' · ahora' : ''}</small></span></button>`).join('')}
    <p class="hint" style="margin:6px 8px 4px">Escritorio afecta a todos los tamaños; Tablet y Móvil solo a pantallas iguales o más estrechas.</p>`;
  menuRango.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
    rangoFijo = RANGOS.find(x => x.id === b.dataset.r) || null;
    cerrarMenuRango();
    ponerVista(anchoVisto(), rangoFijo || rangoParaAncho(anchoVisto()));
    toast(rangoFijo ? `Editando estilos de ${rangoFijo.nombre} (${rangoFijo.detalle})` : 'El rango de estilos sigue al ancho de la vista');
  });
}
function cerrarMenuRango() { menuRango.hidden = true; btnRango.setAttribute('aria-expanded', 'false'); }
btnRango.onclick = () => {
  const abrir = menuRango.hidden;
  if (!abrir) { cerrarMenuRango(); return; }
  pintarMenuRango();
  const rb = btnRango.getBoundingClientRect();
  menuRango.style.left = Math.min(rb.left, window.innerWidth - 270) + 'px';
  menuRango.style.top = rb.bottom + 'px';
  menuRango.hidden = false;
  btnRango.setAttribute('aria-expanded', 'true');
  menuRango.querySelector('[aria-checked="true"]')?.focus();
};
document.addEventListener('mousedown', (e) => { if (!menuRango.hidden && !e.target.closest('.rango-ctl')) cerrarMenuRango(); });
menuRango.addEventListener('keydown', (e) => {
  const items = [...menuRango.querySelectorAll('[data-r]')];
  const i = items.indexOf(document.activeElement);
  if (e.key === 'Escape') { cerrarMenuRango(); btnRango.focus(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
});
// Los botones Escritorio / Tablet / Móvil de siempre: ancho y rango estándar
$$('[data-device]').forEach(btn => btn.addEventListener('click', () => { rangoFijo = null; setTimeout(pintarControlesVista, 0); }));
editor.on('change:device', () => setTimeout(pintarControlesVista, 0));
editor.on('load canvas:frame:load', () => setTimeout(pintarControlesVista, 300));
window.addEventListener('resize', () => setTimeout(pintarControlesVista, 200));

/* ---------- Asa para arrastrar el borde del lienzo ---------- */
const asa = document.createElement('div');
asa.className = 'lienzo-asa';
asa.tabIndex = 0;
asa.setAttribute('role', 'slider');
asa.setAttribute('aria-label', 'Ancho de la vista previa');
asa.setAttribute('aria-valuemin', '320');
asa.setAttribute('aria-valuemax', '2560');
asa.title = 'Arrastra para cambiar el ancho de la vista (flechas: ±10 px, Mayús: ±50 px)';
asa.innerHTML = '<span></span>';
$('#gjs').appendChild(asa);
function colocarAsa() {
  const f = editor.Canvas.getFrameEl();
  if (!f || document.body.classList.contains('is-preview')) { asa.hidden = true; return; }
  const g = $('#gjs').getBoundingClientRect(), r = f.getBoundingClientRect();
  asa.hidden = false;
  asa.style.left = Math.round(Math.min(r.right, g.right - 8) - g.left) + 'px';
  asa.style.top = Math.round(Math.max(r.top, g.top) - g.top) + 'px';
  asa.style.height = Math.round(Math.min(r.bottom, g.bottom) - Math.max(r.top, g.top)) + 'px';
  const w = anchoVisto();
  asa.setAttribute('aria-valuenow', w);
  asa.setAttribute('aria-valuetext', `${w} píxeles`);
}
// El marco anima su ancho al cambiar de dispositivo: el asa lo sigue mientras cambia
(() => {
  let visto = null;
  const ro = new ResizeObserver(() => colocarAsa());
  const vigilar = () => { const f = editor.Canvas.getFrameEl(); if (f && f !== visto) { if (visto) ro.unobserve(visto); ro.observe(f); visto = f; } };
  editor.on('load canvas:frame:load', () => setTimeout(vigilar, 100));
  $('#gjs').addEventListener('scroll', colocarAsa, true);
})();
(() => {
  let ini = null, raf = 0;
  asa.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    asa.setPointerCapture(e.pointerId);
    ini = { x: e.clientX, w: anchoVisto(), k: escala < 1 ? 1 / escala : 2 };
    document.body.classList.add('arrastrando-ancho');
  });
  asa.addEventListener('pointermove', (e) => {
    if (!ini) return;
    const w = ini.w + (e.clientX - ini.x) * ini.k;
    inAncho.value = Math.round(Math.min(2560, Math.max(320, w)));
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => ponerVista(w));
  });
  const fin = () => { if (!ini) return; ini = null; document.body.classList.remove('arrastrando-ancho'); setTimeout(pintarControlesVista, 450); };
  asa.addEventListener('pointerup', fin);
  asa.addEventListener('pointercancel', fin);
  asa.addEventListener('keydown', (e) => {
    const paso = e.shiftKey ? 50 : 10;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); ponerVista(anchoVisto() + paso); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); ponerVista(anchoVisto() - paso); }
  });
})();

/* ---------- Plegar los paneles laterales ---------- */
function plegar(lado, si) {
  const clase = lado === 'izq' ? 'sin-izq' : 'sin-der';
  const on = si === undefined ? !document.body.classList.contains(clase) : si;
  document.body.classList.toggle(clase, on);
  const b = $(lado === 'izq' ? '#btn-panel-izq' : '#btn-panel-der');
  marcar(b, on);
  b.setAttribute('aria-pressed', String(on));
  try { localStorage.setItem('bs5-editor-' + clase, on ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
  setTimeout(() => { ajustarEscala(); editor.refresh(); pintarControlesVista(); }, 60);
}
$('#btn-panel-izq').onclick = () => plegar('izq');
$('#btn-panel-der').onclick = () => plegar('der');
try {
  if (localStorage.getItem('bs5-editor-sin-izq') === '1') plegar('izq', true);
  if (localStorage.getItem('bs5-editor-sin-der') === '1') plegar('der', true);
} catch (e) { /* sin almacenamiento */ }
CLAVES_AJUSTES.push('bs5-editor-sin-izq', 'bs5-editor-sin-der');
ATAJOS.splice(ATAJOS.length - 1, 0, ['Ctrl + [ / Ctrl + ]', 'Plegar el panel izquierdo / derecho']);
function atajoPaneles(ev) {
  if (!(ev.ctrlKey || ev.metaKey) || ev.altKey) return;
  if (ev.key === '[') { ev.preventDefault(); plegar('izq'); }
  else if (ev.key === ']') { ev.preventDefault(); plegar('der'); }
}
document.addEventListener('keydown', atajoPaneles, true);
editor.on('canvas:frame:load', (a) => { const w = a && a.window; if (w && !w.__paneles) { w.__paneles = true; w.document.addEventListener('keydown', atajoPaneles, true); } });

/* =====================================================================
   Ajustes adaptables
===================================================================== */
const SEL_ID = (c) => '#' + c.getId();
function reglaEn(c, rango) {
  try {
    return rango.media
      ? editor.Css.getRule(SEL_ID(c), { atRuleType: 'media', atRuleParams: rango.media })
      : editor.Css.getRule(SEL_ID(c));
  } catch (e) { return null; }
}
function valorEn(c, rango, prop) {
  const r = reglaEn(c, rango);
  const st = r ? r.getStyle() : (rango.media ? {} : (c.getStyle() || {}));
  return String(st[prop] || '').replace(/\s*!important$/, '').trim();
}
function escribir(c, rango, props) {
  const r = reglaEn(c, rango);
  const st = { ...(r ? r.getStyle() : (rango.media ? {} : c.getStyle() || {})) };
  Object.entries(props).forEach(([k, v]) => { if (v === '' || v == null) delete st[k]; else st[k] = v; });
  if (!rango.media) c.setStyle(st);
  else if (r) r.setStyle(st);
  else editor.Css.setRule(SEL_ID(c), st, { atRuleType: 'media', atRuleParams: rango.media });
  editor.trigger('component:styleUpdate', c);
  try { editor.StyleManager.select(c); } catch (e) { /* el panel de GrapesJS se actualiza solo */ }
}
// De dónde sale el valor de una propiedad para el rango que se edita
function origenProp(c, prop) {
  const actual = rangoActual();
  const hasta = RANGOS.indexOf(actual);
  let valor = '', desde = null;
  for (let i = 0; i <= hasta; i++) { const v = valorEn(c, RANGOS[i], prop); if (v) { valor = v; desde = RANGOS[i]; } }
  if (desde === actual) return { tipo: 'local', valor, desde };
  if (desde) return { tipo: 'heredado', valor, desde };
  const el = c.getEl && c.getEl();
  let cs = '';
  try { cs = el ? el.ownerDocument.defaultView.getComputedStyle(el).getPropertyValue(prop) : ''; } catch (e) { cs = ''; }
  return { tipo: 'diseno', valor: cs, desde: null };
}

// Propiedades priorizadas. tipo: 'sel' (lista), 'txt' (medida libre), 'ali' (botones)
const G_ADAPT = [
  { id: 'fila', titulo: 'Columnas y orden', icono: 'layout-three-columns', cuando: (c, ctx) => ctx.enFila || ctx.enFlex, props: [
    { p: 'columnas', nombre: 'Ancho en la fila', tipo: 'col', cuando: (c, ctx) => ctx.enFila },
    { p: 'order', nombre: 'Orden', tipo: 'sel', op: [['', '—'], ['-1', 'Primero'], ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['99', 'Último']] }
  ] },
  { id: 'ali', titulo: 'Alineación', icono: 'text-center', props: [
    { p: 'text-align', nombre: 'Texto', tipo: 'ali', op: [['left', 'text-left', 'Izquierda'], ['center', 'text-center', 'Centro'], ['right', 'text-right', 'Derecha'], ['justify', 'justify', 'Justificado']] },
    { p: 'justify-content', nombre: 'Hijos en horizontal', tipo: 'sel', cuando: (c, ctx) => ctx.esFlex, op: [['', '—'], ['flex-start', 'Al inicio'], ['center', 'Al centro'], ['flex-end', 'Al final'], ['space-between', 'Repartidos']] },
    { p: 'align-items', nombre: 'Hijos en vertical', tipo: 'sel', cuando: (c, ctx) => ctx.esFlex, op: [['', '—'], ['flex-start', 'Arriba'], ['center', 'Centro'], ['flex-end', 'Abajo'], ['stretch', 'Estirados']] },
    { p: 'flex-direction', nombre: 'Dirección', tipo: 'sel', cuando: (c, ctx) => ctx.esFlex, op: [['', '—'], ['row', 'En fila'], ['column', 'En columna'], ['row-reverse', 'Fila invertida'], ['column-reverse', 'Columna invertida']] }
  ] },
  { id: 'sep', titulo: 'Separación', icono: 'distribute-vertical', props: [
    { p: 'margin-top', nombre: 'Margen arriba', tipo: 'txt' },
    { p: 'margin-bottom', nombre: 'Margen abajo', tipo: 'txt' },
    { p: 'padding-top', nombre: 'Relleno arriba', tipo: 'txt' },
    { p: 'padding-bottom', nombre: 'Relleno abajo', tipo: 'txt' },
    { p: 'padding-left', nombre: 'Relleno a los lados', tipo: 'txt', junto: ['padding-right'] },
    { p: 'gap', nombre: 'Entre hijos', tipo: 'txt', cuando: (c, ctx) => ctx.esFlex || ctx.esGrid }
  ] },
  { id: 'tam', titulo: 'Tamaño', icono: 'arrows-angle-expand', props: [
    { p: 'width', nombre: 'Ancho', tipo: 'txt', cuando: (c, ctx) => !ctx.enFila },
    { p: 'max-width', nombre: 'Ancho máximo', tipo: 'txt' },
    { p: 'min-height', nombre: 'Alto mínimo', tipo: 'txt' },
    { p: 'display', nombre: 'Visible en este rango', tipo: 'vis' }
  ] },
  { id: 'tipo', titulo: 'Tipografía', icono: 'fonts', props: [
    { p: 'font-size', nombre: 'Tamaño de letra', tipo: 'txt' },
    { p: 'font-weight', nombre: 'Grosor', tipo: 'sel', op: [['', '—'], ['300', 'Fino'], ['400', 'Normal'], ['500', 'Medio'], ['600', 'Seminegrita'], ['700', 'Negrita']] },
    { p: 'line-height', nombre: 'Interlineado', tipo: 'txt' },
    { p: 'letter-spacing', nombre: 'Espacio entre letras', tipo: 'txt' }
  ] }
];
const abiertos = new Set(['fila', 'ali', 'sep', 'tipo']);

function contexto(c) {
  const el = c.getEl && c.getEl();
  const cs = (x) => { try { return x ? x.ownerDocument.defaultView.getComputedStyle(x) : null; } catch (e) { return null; } };
  const s = cs(el), sp = cs(el && el.parentElement);
  return {
    el, enFila: !!c.parent() && tieneClase(c.parent(), 'row'),
    enFlex: !!sp && /flex|grid/.test(sp.display),
    esFlex: !!s && /flex/.test(s.display), esGrid: !!s && /grid/.test(s.display)
  };
}
// Ancho de columna como fracción de 12 (lo que hace col-6, col-md-4…)
function columnasDe(c, ctx) {
  const o = origenProp(c, 'width');
  const m = /^([\d.]+)%$/.exec(o.valor);
  if (o.tipo !== 'diseno' && m) return { ...o, n: Math.round(+m[1] * 12 / 100) };
  if (o.tipo !== 'diseno' && o.valor) return { ...o, n: 0 };
  const el = ctx.el, p = el && el.parentElement;
  const n = el && p && p.clientWidth ? Math.round(el.getBoundingClientRect().width / p.getBoundingClientRect().width * 12) : 0;
  return { tipo: 'diseno', valor: n ? `${n}/12` : '', n, desde: null };
}

let adaptT = 0;
function pintarAdaptable() { clearTimeout(adaptT); adaptT = setTimeout(pintarAdaptableYa, 30); }
function pintarAdaptableYa() {
  const box = $('#adapt-box');
  if (!box) return;
  const c = editor.getSelected();
  if (!c || (c.is && c.is('wrapper')) || !c.getEl || !c.getEl()) { box.hidden = true; return; }
  box.hidden = false;
  const r = rangoActual();
  const visto = anchoVisto();
  const cab = `<div class="ad-cab">
      <div class="ad-tit"><i class="bi bi-phone-landscape"></i> Ajustes adaptables</div>
      <div class="ad-rango"><span>Editando: <b>${r.nombre}</b> <small>(${r.detalle})</small></span><span>Vista: <b>${visto} px</b></span></div>
      ${r.media && visto > parseInt(r.widthMedia, 10) ? `<p class="ad-aviso"><i class="bi bi-exclamation-triangle"></i> La vista (${visto} px) es más ancha que el rango que editas: tus cambios no se verán hasta estrechar la vista.</p>` : ''}
      <div class="ad-leyenda"><span class="local">local</span><span class="heredado">heredado</span><span class="diseno">del diseño</span></div>
    </div>`;
  if (c.get('stylable') === false) {
    box.innerHTML = cab + '<p class="hint" style="margin:8px 10px">El estilo de este elemento lo controla su componente principal.</p>';
    return;
  }
  const ctx = contexto(c);
  let html = cab;
  G_ADAPT.forEach(g => {
    if (g.cuando && !g.cuando(c, ctx)) return;
    const filas = g.props.filter(pr => !pr.cuando || pr.cuando(c, ctx)).map(pr => filaAdapt(c, ctx, pr, r)).join('');
    if (!filas) return;
    const n = (filas.match(/ad-fila local/g) || []).length;
    html += `<details class="ad-grupo" data-g="${g.id}" ${abiertos.has(g.id) ? 'open' : ''}><summary><i class="bi bi-${g.icono}"></i> ${g.titulo}${n ? ` <span class="ad-n" title="${n} ajuste(s) propios de ${r.nombre}">${n}</span>` : ''}</summary>${filas}</details>`;
  });
  box.innerHTML = html;
  box.querySelectorAll('details').forEach(d => d.addEventListener('toggle', () => { if (d.open) abiertos.add(d.dataset.g); else abiertos.delete(d.dataset.g); }));
  enlazarAdapt(box, c, ctx);
}
function etiquetaOrigen(o, r) {
  if (o.tipo === 'local') return `<span class="ad-estado" title="Ajuste propio de ${r.nombre}">${r.nombre}</span>`;
  if (o.tipo === 'heredado') return `<span class="ad-estado" title="Heredado de ${o.desde.nombre}: cámbialo aquí para ajustarlo solo en ${r.nombre}">↑ ${o.desde.nombre}</span>`;
  return '<span class="ad-estado" title="Sin ajuste: lo deciden las clases de Bootstrap o site.css">diseño</span>';
}
function filaAdapt(c, ctx, pr, r) {
  const id = 'ad-' + pr.p;
  let o, control;
  if (pr.tipo === 'col') {
    o = columnasDe(c, ctx);
    control = `<select id="${id}" data-p="columnas"><option value="">${o.tipo === 'diseno' && o.n ? `${o.n}/12 (diseño)` : '—'}</option>${[12, 6, 4, 3, 8, 9, 2, 5, 7, 10, 11, 1].map(n => `<option value="${n}" ${o.tipo !== 'diseno' && o.n === n ? 'selected' : ''}>${n}/12 · ${Math.round(n / 12 * 1000) / 10}%</option>`).join('')}<option value="auto" ${o.tipo !== 'diseno' && o.valor === 'auto' ? 'selected' : ''}>Automático</option></select>`;
  } else if (pr.tipo === 'vis') {
    o = origenProp(c, 'display');
    const oculto = o.valor === 'none';
    control = `<label class="ad-sw"><input type="checkbox" id="${id}" data-p="display" ${oculto ? '' : 'checked'}><span>${oculto ? 'Oculto' : 'Visible'}</span></label>`;
    if (o.tipo === 'diseno') o = { ...o, valor: '' };
  } else {
    o = origenProp(c, pr.p);
    if (pr.tipo === 'sel') {
      const ops = pr.op.some(([v]) => v === o.valor) ? pr.op : [...pr.op, [o.valor, o.valor]];
      control = `<select id="${id}" data-p="${pr.p}">${ops.map(([v, t]) => `<option value="${v}" ${(o.tipo !== 'diseno' ? o.valor : '') === v ? 'selected' : ''}>${t}${v === '' && o.tipo === 'diseno' && o.valor ? ` (${o.valor})` : ''}</option>`).join('')}</select>`;
    } else if (pr.tipo === 'ali') {
      const v = o.valor === 'start' ? 'left' : o.valor === 'end' ? 'right' : o.valor;
      control = `<div class="ad-ali" role="group" aria-label="${pr.nombre}">${pr.op.map(([val, ico, t]) => `<button type="button" data-p="${pr.p}" data-v="${val}" class="${v === val ? 'on' : ''}" aria-pressed="${v === val}" title="${t}"><i class="bi bi-${ico}"></i></button>`).join('')}</div>`;
    } else {
      control = `<input id="${id}" data-p="${pr.p}" ${pr.junto ? `data-junto="${pr.junto.join(',')}"` : ''} value="${o.tipo !== 'diseno' ? SIN_HTML(o.valor) : ''}" placeholder="${SIN_HTML(o.tipo === 'diseno' ? o.valor : '')}" spellcheck="false" autocomplete="off">`;
    }
  }
  const quitar = o.tipo === 'local' ? `<button class="ad-reset" data-reset="${pr.p}" ${pr.junto ? `data-junto="${pr.junto.join(',')}"` : ''} title="Quitar el ajuste de ${r.nombre}: vuelve a heredar"><i class="bi bi-arrow-counterclockwise"></i></button>` : '<span class="ad-reset-vacio"></span>';
  return `<div class="ad-fila ${o.tipo}" data-fila="${pr.p}"><label for="${id}">${pr.nombre}</label>${control}${etiquetaOrigen(o, r)}${quitar}</div>`;
}
function enlazarAdapt(box, c, ctx) {
  const r = rangoActual();
  const poner = (p, v, junto) => {
    const props = { [p]: v };
    (junto || []).forEach(k => { props[k] = v; });
    if (p === 'columnas') {
      escribir(c, r, v === '' ? { flex: '', width: '', 'max-width': '' } : v === 'auto' ? { flex: '1 0 0%', width: 'auto' } : { flex: '0 0 auto', width: (Math.round(+v / 12 * 1e6) / 1e4) + '%' });
    } else escribir(c, r, props);
    pintarAdaptable();
  };
  box.querySelectorAll('select[data-p]').forEach(s => s.onchange = () => poner(s.dataset.p, s.value));
  box.querySelectorAll('input[data-p]:not([type=checkbox])').forEach(i => {
    const ok = () => {
      const v = i.value.trim();
      const val = /^-?[\d.]+$/.test(v) && !['font-weight', 'line-height', 'order'].includes(i.dataset.p) ? v + 'px' : v;
      poner(i.dataset.p, val, i.dataset.junto ? i.dataset.junto.split(',') : null);
    };
    i.addEventListener('change', ok);
    i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); i.blur(); } });
  });
  box.querySelectorAll('input[type=checkbox][data-p=display]').forEach(i => i.onchange = () => poner('display', i.checked ? '' : 'none'));
  box.querySelectorAll('.ad-ali button').forEach(b => b.onclick = () => poner(b.dataset.p, b.dataset.v));
  box.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => {
    const p = b.dataset.reset;
    const props = p === 'columnas' ? { flex: '', width: '' } : { [p]: '' };
    if (b.dataset.junto) b.dataset.junto.split(',').forEach(k => { props[k] = ''; });
    escribir(c, r, props);
    pintarAdaptable();
    toast(`Ajuste de ${r.nombre} quitado: vuelve a heredar`);
  });
}
editor.on('component:selected component:deselected component:styleUpdate undo redo', pintarAdaptable);
editor.on('style:property:update', pintarAdaptable);
