/* =====================================================================
   Vista previa del sitio
   Muestra EXACTAMENTE lo que sale en el ZIP y en la publicación (mismo
   generador), dentro de un iframe aislado: sandbox sin allow-same-origin,
   así el contenido (scripts propios, código pegado…) no puede leer ni tocar
   el editor ni su almacenamiento. Los enlaces entre páginas los resuelve el
   editor por postMessage. Ctrl+P sigue siendo «probar en el lienzo».
===================================================================== */
const PREVIA_ANCHOS = [['Escritorio', 1280, 'display'], ['Tablet', 768, 'tablet'], ['Móvil', 375, 'phone']];
let previa = null;   // { capa, marco, docs, archivo, ancho }

async function abrirVistaPreviaSitio(archivo) {
  if (previa) cerrarVistaPreviaSitio();
  const sitio = await generarSitio({ modo: 'previa', ...opcionesExportacion() });
  const capa = document.createElement('div');
  capa.className = 'ps-capa';
  capa.setAttribute('role', 'dialog');
  capa.setAttribute('aria-modal', 'true');
  capa.setAttribute('aria-label', 'Vista previa del sitio');
  capa.innerHTML = `
    <div class="ps-barra">
      <b><i class="bi bi-eye"></i> Vista previa</b>
      <label class="ps-pag">Página <select id="ps-pagina">${sitio.paginas.map(p => `<option value="${p.archivo}">${SIN_HTML(p.archivo)}</option>`).join('')}</select></label>
      <div class="ps-anchos" role="group" aria-label="Ancho">${PREVIA_ANCHOS.map(([n, w, i]) => `<button class="tb-btn" data-w="${w}" title="${n} (${w} px)"><i class="bi bi-${i}"></i> ${n}</button>`).join('')}</div>
      <span class="hint ps-nota">El mismo HTML que el ZIP y la publicación. Aislada del editor.</span>
      <span class="grow"></span>
      <button class="tb-btn" id="ps-lienzo" title="Probar en el lienzo (Ctrl+P)"><i class="bi bi-cursor"></i> Probar en el lienzo</button>
      <button class="tb-btn primary" id="ps-cerrar" title="Cerrar (Esc)"><i class="bi bi-x-lg"></i> Cerrar</button>
    </div>
    <div class="ps-zona"><div class="ps-marco"><iframe title="Sitio en vista previa" sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe></div></div>`;
  document.body.appendChild(capa);
  previa = { capa, marco: capa.querySelector('iframe'), docs: sitio.documentos, archivo: '', ancho: 1280, foco: document.activeElement };
  capa.querySelector('#ps-pagina').onchange = (e) => mostrarPaginaPrevia(e.target.value);
  capa.querySelectorAll('[data-w]').forEach(b => b.onclick = () => anchoPrevia(+b.dataset.w));
  capa.querySelector('#ps-cerrar').onclick = cerrarVistaPreviaSitio;
  capa.querySelector('#ps-lienzo').onclick = () => { cerrarVistaPreviaSitio(); vistaPrevia(true); };
  capa.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); cerrarVistaPreviaSitio(); } });
  anchoPrevia(rangoActual ? Math.min(1280, anchoVisto()) : 1280);
  mostrarPaginaPrevia(archivo || archivoDePagina(editor.Pages.getSelected()));
  capa.querySelector('#ps-cerrar').focus();
}
function mostrarPaginaPrevia(destino) {
  if (!previa) return;
  const [archivo, hash] = String(destino).split('#');
  const a = (archivo || previa.archivo).replace(/^\.\//, '').toLowerCase();
  const doc = previa.docs.get(a);
  if (!doc) { toast('El sitio no tiene ninguna página ' + a); return; }
  previa.archivo = a;
  previa.capa.querySelector('#ps-pagina').value = a;
  previa.marco.srcdoc = doc(hash || '');
}
function anchoPrevia(w) {
  if (!previa) return;
  previa.ancho = w;
  previa.capa.querySelectorAll('[data-w]').forEach(b => marcar(b, +b.dataset.w === w));
  const zona = previa.capa.querySelector('.ps-zona');
  const esc = Math.min(1, (zona.clientWidth - 32) / w);
  const m = previa.capa.querySelector('.ps-marco');
  m.style.width = w + 'px';
  m.style.height = Math.round((zona.clientHeight - 24) / esc) + 'px';
  m.style.transform = `scale(${esc})`;
}
function cerrarVistaPreviaSitio() {
  if (!previa) return;
  const foco = previa.foco;
  previa.capa.remove();
  previa = null;
  if (foco && foco.focus) foco.focus();
}
// Mensajes de la vista previa: SOLO los del iframe de la vista previa
window.addEventListener('message', (e) => {
  if (!previa || e.source !== previa.marco.contentWindow) return;
  const m = e.data;
  if (!m || m.__previa !== 1 || typeof m.tipo !== 'string') return;
  if (m.tipo === 'ir' && typeof m.destino === 'string') mostrarPaginaPrevia(m.destino.slice(0, 300));
  else if (m.tipo === 'externo' && /^(https?:)?\/\//i.test(m.url)) window.open(m.url, '_blank', 'noopener');
  else if (m.tipo === 'aviso' && typeof m.texto === 'string') toast(m.texto.slice(0, 160));
});
window.addEventListener('resize', () => previa && anchoPrevia(previa.ancho));
$('#btn-preview').onclick = () => abrirVistaPreviaSitio();
$('#btn-preview').title = 'Vista previa del sitio, aislada del editor · Ctrl+P prueba en el lienzo';
