/* =====================================================================
   Efectos: contador animado, tarjetas 3D, degradado en movimiento y
   colores automáticos de los separadores con forma.
   Todo se puede aplicar a lo que ya está construido (sin rehacerlo):
     · Propiedades → «Contar al aparecer» (textos con un número)
     · Propiedades → «Inclinar en 3D al pasar el ratón»
     · Estilo → «Degradado en movimiento»
   Los efectos con JavaScript van en archivos propios del sitio exportado
   (js/contadores.js, js/tarjetas-3d.js) y solo en las páginas que los usan.
===================================================================== */

/* ---------- Runtime: contador animado ----------
   Cuenta desde 0 hasta la cifra cuando aparece en pantalla. Respeta lo que
   rodea al número («+1.200», «98%», «4,9»): solo cambia el número. Sin
   IntersectionObserver o con «reducir movimiento» la cifra queda tal cual. */
const RUNTIME_CONTADORES = `(function(){
  var d=document;
  if(!('IntersectionObserver' in window)) return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var leer=function(t){
    var m=t.match(/\\d+(?:[.,]\\d+)*/); if(!m) return null;
    var s=m[0], o={antes:t.slice(0,m.index), despues:t.slice(m.index+s.length), sep:'', dec:'', decs:0, n:0};
    if(/^\\d{1,3}([.,]\\d{3})+$/.test(s)){ o.sep=s.charAt(s.search(/[.,]/)); o.n=parseInt(s.replace(/[.,]/g,''),10); }
    else if(/[.,]/.test(s)){ o.dec=s.match(/[.,]/)[0]; o.decs=s.split(o.dec)[1].length; o.n=parseFloat(s.replace(o.dec,'.')); }
    else o.n=parseInt(s,10);
    return o;
  };
  var fmt=function(v,o){
    var s;
    if(o.decs) s=v.toFixed(o.decs).replace('.',o.dec);
    else{ s=String(Math.round(v)); if(o.sep) s=s.replace(/\\B(?=(\\d{3})+(?!\\d))/g,o.sep); }
    return o.antes+s+o.despues;
  };
  var animar=function(el){
    var o=el.__contador, ms=parseInt(el.getAttribute('data-duracion'),10)||1800, t0=null;
    var paso=function(t){
      if(t0===null) t0=t;
      var p=Math.min(1,(t-t0)/ms), e=1-Math.pow(1-p,3);
      el.textContent=fmt(o.n*e,o);
      if(p<1) requestAnimationFrame(paso);
      else{ el.textContent=o.texto; el.removeAttribute('aria-label'); }
    };
    requestAnimationFrame(paso);
  };
  var io=new IntersectionObserver(function(en){
    en.forEach(function(x){ if(x.isIntersecting){ io.unobserve(x.target); animar(x.target); } });
  },{threshold:0.4});
  [].forEach.call(d.querySelectorAll('[data-contador="si"], .dato:not([data-contador])'),function(el){
    if(el.children.length) return;
    var t=el.textContent, o=leer(t);
    if(!o||!o.n) return;
    o.texto=t; el.__contador=o;
    el.setAttribute('aria-label',t.trim());
    el.textContent=fmt(0,o);
    io.observe(el);
  });
})();`;

/* ---------- Runtime: tarjetas 3D ----------
   Se inclinan siguiendo al ratón, con un brillo suave. Solo con ratón
   (en pantallas táctiles no hay «pasar por encima») y sin «reducir movimiento». */
const RUNTIME_TARJETAS_3D = `(function(){
  var m=window.matchMedia;
  if(!m||!m('(hover: hover) and (pointer: fine)').matches||m('(prefers-reduced-motion: reduce)').matches) return;
  var MAX=10;
  [].forEach.call(document.querySelectorAll('[data-inclinar="si"]'),function(el){
    if(getComputedStyle(el).position==='static') el.style.position='relative';
    var brillo=document.createElement('span');
    brillo.className='brillo-3d'; brillo.setAttribute('aria-hidden','true');
    el.appendChild(brillo);
    var raf=0;
    el.addEventListener('pointermove',function(e){
      var r=el.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(function(){
        el.classList.add('inclinando');
        el.style.transform='perspective(900px) rotateX('+((0.5-y)*MAX).toFixed(2)+'deg) rotateY('+((x-0.5)*MAX).toFixed(2)+'deg) scale(1.02)';
        el.style.setProperty('--bx',(x*100).toFixed(1)+'%');
        el.style.setProperty('--by',(y*100).toFixed(1)+'%');
      });
    });
    el.addEventListener('pointerleave',function(){
      cancelAnimationFrame(raf);
      el.classList.remove('inclinando');
      el.style.transform='';
    });
  });
})();`;

RUNTIMES_EXTRA.push(
  { archivo: 'contadores.js', codigo: RUNTIME_CONTADORES, usa: (html) => /data-contador="si"|class="[^"]*\bdato\b/.test(html) },
  { archivo: 'tarjetas-3d.js', codigo: RUNTIME_TARJETAS_3D, usa: (html) => /data-inclinar="si"/.test(html) }
);

/* ---------- Propiedades: contar al aparecer e inclinar en 3D ---------- */
const textoPlano = (c) => { try { const el = c.getEl(); return el ? el.textContent : ''; } catch (e) { return ''; } };
editor.on('component:selected', (c) => {
  if (!c || !c.getTrait || (c.is && c.is('wrapper'))) return;
  // Un texto con un número (sin otros elementos dentro) puede contar al aparecer
  const el = c.getEl && c.getEl();
  if (c.is('text') && el && !el.children.length && /\d/.test(textoPlano(c)) && !c.getTrait('data-contador')) {
    // Las cifras «.dato» de antes ya cuentan solas: se deja escrito para que la casilla lo muestre
    if (tieneClase(c, 'dato') && !c.getAttributes()['data-contador']) editor.UndoManager.skip(() => c.addAttributes({ 'data-contador': 'si' }));
    c.addTrait({ type: 'checkbox', name: 'data-contador', label: 'Contar desde 0 al aparecer', valueTrue: 'si', valueFalse: 'no' });
  }
  // Cajas y tarjetas (no textos sueltos ni imágenes) pueden inclinarse en 3D
  const tag = tagDe(c);
  if (!c.is('text') && ['div', 'article', 'a', 'figure', 'li', 'aside'].includes(tag) && !c.getTrait('data-inclinar')) {
    c.addTrait({ type: 'checkbox', name: 'data-inclinar', label: 'Inclinar en 3D al pasar el ratón', valueTrue: 'si', valueFalse: 'no' });
  }
});

/* ---------- Separadores: color automático al insertarlos ----------
   La forma toma el color de fondo de la sección en la que «entra»: la de
   abajo (o la de arriba si está volteado). El resto es transparente. */
function colorDeFondo(el) {
  const win = el && el.ownerDocument.defaultView;
  for (let e = el; e && win; e = e.parentElement) {
    const cs = win.getComputedStyle(e);
    const m = cs.backgroundColor.match(/[\d.]+/g);
    if (m && (m.length < 4 || +m[3] > 0.5)) return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
    if (e !== el) break;   // solo el propio elemento; si no tiene, el fondo de la página
  }
  const body = el && el.ownerDocument.body;
  const m = body && win.getComputedStyle(body).backgroundColor.match(/[\d.]+/g);
  return m && (m.length < 4 || +m[3] > 0.5) ? '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('') : '#ffffff';
}
function colorearSeparador(c) {
  if (!c || c.get('type') !== 'separador-forma' || c.get('sf-auto')) return;
  const padre = c.parent();
  if (!padre) return;
  const hermanos = padre.components();
  const i = hermanos.indexOf(c);
  const visible = (x) => x && x.getEl && x.getEl() && !['style', 'script'].includes(tagDe(x));
  let antes = null, despues = null;
  for (let k = i - 1; k >= 0 && !antes; k--) if (visible(hermanos.at(k))) antes = hermanos.at(k);
  for (let k = i + 1; k < hermanos.length && !despues; k++) if (visible(hermanos.at(k))) despues = hermanos.at(k);
  const volteado = c.getAttributes()['data-invertido'] === 'si';
  const vecina = volteado ? antes : despues;
  // Sin sección vecina todavía (p. ej. al final de la página): se espera a
  // que se añada una; mientras, usa el color claro del sitio
  if (!vecina) return;
  editor.UndoManager.skip(() => {
    c.set('sf-auto', true);
    c.set({ 'sf-forma': colorDeFondo(vecina.getEl()) });
  });
}
editor.on('component:add', (c) => {
  if (!c || !c.get) return;
  setTimeout(() => {
    if (c.get('type') === 'separador-forma') colorearSeparador(c);
    // Una sección nueva puede ser la vecina que esperaba un separador
    const p = c.parent && c.parent();
    if (p) p.components().forEach(x => { if (x !== c && x.get('type') === 'separador-forma' && !x.get('sf-auto')) colorearSeparador(x); });
  }, 60);
});

/* ---------- Estilo: degradado en movimiento ---------- */
(() => {
  const box = $('#deg-box');
  if (!box) return;
  const colores = [...box.querySelectorAll('input[type=color]')];
  const vel = $('#deg-vel'), velTxt = $('#deg-vel-txt');
  const POR_DEFECTO = ['#ee7752', '#e73c7e', '#23a6d5', '#23d5ab'];
  const destino = () => { const c = editor.getSelected(); return c && c !== editor.getWrapper() && !c.is('text') ? c : null; };
  const leer = () => {
    const c = destino();
    box.style.display = c ? '' : 'none';
    if (!c) return;
    const tiene = tieneClase(c, 'degradado-anim');
    const lista = (c.getAttributes()['data-degradado'] || '').split(',').filter(Boolean);
    const base = lista.length === 4 ? lista : [TEMA.primario || POR_DEFECTO[0], TEMA.acento || POR_DEFECTO[1], TEMA.osc || POR_DEFECTO[2], POR_DEFECTO[3]];
    colores.forEach((inp, i) => { inp.value = base[i]; });
    const seg = parseInt(c.getStyle()['animation-duration'], 10) || 16;
    vel.value = seg; velTxt.textContent = seg + ' s';
    $('#deg-poner').innerHTML = tiene ? '<i class="bi bi-check-lg"></i> Actualizar' : '<i class="bi bi-plus-lg"></i> Poner degradado';
    $('#deg-quitar').style.display = tiene ? '' : 'none';
  };
  editor.on('component:selected component:deselected', leer);
  vel.addEventListener('input', () => { velTxt.textContent = vel.value + ' s'; });
  const aplicar = () => {
    const c = destino();
    if (!c) return;
    const cols = colores.map(x => x.value);
    const st = { ...c.getStyle() };
    st['background-image'] = `linear-gradient(-45deg,${cols.join(',')})`;
    st['animation-duration'] = vel.value + 's';
    c.setStyle(st);
    c.addAttributes({ 'data-degradado': cols.join(',') });
    c.addClass('degradado-anim');
    leer();
    toast('Degradado en movimiento aplicado. Ctrl+Z lo quita.');
  };
  $('#deg-poner').onclick = aplicar;
  colores.forEach(x => x.addEventListener('change', () => { if (tieneClase(destino() || editor.getWrapper(), 'degradado-anim')) aplicar(); }));
  vel.addEventListener('change', () => { if (tieneClase(destino() || editor.getWrapper(), 'degradado-anim')) aplicar(); });
  $('#deg-quitar').onclick = () => {
    const c = destino();
    if (!c) return;
    const st = { ...c.getStyle() };
    if (/gradient/.test(st['background-image'] || '')) delete st['background-image'];
    delete st['animation-duration'];
    c.setStyle(st);
    c.removeClass('degradado-anim');
    c.removeAttributes('data-degradado');
    leer();
    toast('Degradado quitado');
  };
})();
