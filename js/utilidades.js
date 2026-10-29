/* =====================================================================
   Utilidades
===================================================================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const STORAGE_KEY = 'bs5-editor-proyecto';

// Un solo aviso a la vez: si llegan varios seguidos, el nuevo reemplaza al anterior
// en vez de apilarse uno encima de otro en el mismo sitio.
let toastActual = null;
function toast(msg, ms = 2200) {
  if (toastActual) toastActual.remove();
  const t = document.createElement('div');
  t.className = 'app-toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.appendChild(t);
  toastActual = t;
  setTimeout(() => { t.remove(); if (toastActual === t) toastActual = null; }, ms);
}

function showTab(group, tab) {
  $$(`.tabs[data-group="${group}"] button`).forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $$(`.pane[data-group="${group}"]`).forEach(p => p.classList.toggle('active', p.dataset.pane === tab));
}
$$('.tabs button').forEach(btn =>
  btn.addEventListener('click', () => showTab(btn.parentElement.dataset.group, btn.dataset.tab)));

/* Imágenes de ejemplo como SVG incrustado (data URI).
   Antes se pedían a placehold.co: sin internet los bloques y las plantillas
   nacían rotos y el laboratorio quedaba inservible. Ahora no dependen de
   ningún servicio externo. */
const oscurecer = (hex, f) => hex.match(/.{2}/g)
  .map(p => Math.round(parseInt(p, 16) * f).toString(16).padStart(2, '0')).join('');

const svgEjemplo = (w, h, col, txt) => {
  const c2 = oscurecer(col, 0.62);
  const fs = Math.round(Math.min(w, h) / 11);
  const rot = txt
    ? `<text x="50%" y="50%" fill="#ffffff" fill-opacity=".92" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="${fs}" font-weight="600" letter-spacing="1" text-anchor="middle" dominant-baseline="middle">${String(txt).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`
    : '';
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="#${col}"/><stop offset="1" stop-color="#${c2}"/>`
    + `</linearGradient></defs>`
    + `<rect width="${w}" height="${h}" fill="url(#g)"/>${rot}</svg>`;
  // encodeURIComponent deja sin escapar ( ) y ': dentro de un url(...) sin
  // comillas, el ")" de fill="url(#g)" cerraba el url antes de tiempo y el
  // fondo de los héroes, banners y pie quedaba invalidado.
  return 'data:image/svg+xml,' + encodeURIComponent(s)
    .replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27');
};

// Imagen de ejemplo neutra para los bloques sueltos de Bootstrap
const PH = (w, h, txt = '') => svgEjemplo(w, h, '8d99ae', txt);

const slug = s => (s || 'pagina').toString()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/\.html?$/, '')
  .replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'pagina';

function descargar(blob, nombre) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* =====================================================================
   Categorías de componentes
===================================================================== */
const CAT = {
  est: { label: 'Estructura',   open: true, order: 1 },
  txt: { label: 'Texto',        open: false, order: 2 },
  btn: { label: 'Botones',      open: false, order: 3 },
  nav: { label: 'Navegación',   open: false, order: 4 },
  frm: { label: 'Formularios',  open: false, order: 5 },
  cnt: { label: 'Contenido',    open: false, order: 6 },
  sec: { label: 'Secciones',    open: false, order: 7 },
  med: { label: 'Media',        open: false, order: 8 },
  adv: { label: 'Avanzado',     open: false, order: 9 }
};

const SIN_HTML = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Recorre un componente y todos sus descendientes (sobre el modelo, no el DOM:
// así funciona también con páginas que no están abiertas en el lienzo).
function recorrer(comp, fn) {
  fn(comp);
  try { comp.components().forEach(h => recorrer(h, fn)); } catch (e) { /* sin hijos */ }
}
function buscarComp(raiz, pred) {
  const out = [];
  if (raiz) raiz.components().forEach(c => recorrer(c, x => { if (pred(x)) out.push(x); }));
  return out;
}
const tagDe = (c) => ((c && c.get('tagName')) || '').toLowerCase();
const tieneClase = (c, k) => { try { return c.getClasses().includes(k); } catch (e) { return false; } };
