/* =====================================================================
   Revisar y publicar
   El BORRADOR es lo que se edita (se guarda solo en este navegador). Una
   PUBLICACIÓN es una versión inmutable en el servidor: se prepara completa,
   el servidor la verifica y solo entonces se activa. Si algo falla, sigue
   en línea la versión anterior. El historial permite activar cualquier
   versión anterior, compartir enlaces de vista previa que caducan y
   recuperar el proyecto de una versión en el editor.
===================================================================== */
const CLAVE_SRV = 'bs5-editor-clave';
const claveServidor = () => { try { return sessionStorage.getItem(CLAVE_SRV) || localStorage.getItem(CLAVE_SRV) || ''; } catch (e) { return ''; } };
function guardarClave(v, recordar) {
  try {
    sessionStorage.setItem(CLAVE_SRV, v);
    if (recordar) localStorage.setItem(CLAVE_SRV, v); else localStorage.removeItem(CLAVE_SRV);
  } catch (e) { /* sin almacenamiento */ }
}
async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  const srv = servidorPublicacion();
  if (!srv) throw new Error('No hay servidor de publicación configurado');
  let r;
  try {
    r = await fetch(srv + ruta, { method: metodo, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + claveServidor() },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  } catch (e) { const err = new Error('No se pudo conectar con el servidor de publicación (' + srv + ').'); err.sinRed = true; throw err; }
  let j = {};
  try { j = await r.json(); } catch (e) { j = {}; }
  if (!r.ok || j.ok === false) { const err = new Error(j.error || `El servidor respondió ${r.status}`); err.status = r.status; err.datos = j; throw err; }
  return j;
}
const fecha = (t) => t ? new Date(t * 1000).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const kb = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round((n || 0) / 1024)) + ' KB';

/* ---------- Archivos a publicar: los mismos del ZIP ---------- */
async function paqueteDePublicacion() {
  const sitio = await generarSitio({ modo: 'publicar', ...opcionesExportacion() });
  const archivos = [], huellas = [];
  let bytes = 0;
  for (const [ruta, a] of sitio.archivos) {
    const u8 = await bytesDe(a);
    const sha = await sha256Hex(u8);
    bytes += u8.length;
    huellas.push(`${ruta}:${sha}`);
    archivos.push({ ruta, base64: aBase64(u8), sha256: sha });
  }
  huellas.sort();
  const huella = await sha256Hex(new TextEncoder().encode(huellas.join('\n')));
  return { sitio, archivos, huella, bytes };
}
function proyectoParaGuardar() {
  const p = editor.getProjectData();
  p.__tema = TEMA; p.__publicacion = { ...PUB }; p.__formato = FORMATO_PROYECTO;
  return JSON.stringify(p);
}

/* ---------- Ventana ---------- */
const PESTANAS_PUB = [['revision', 'clipboard-check', 'Revisión'], ['publicar', 'cloud-upload', 'Publicar'], ['historial', 'clock-history', 'Historial'], ['mensajes', 'inbox', 'Mensajes'], ['dominio', 'globe2', 'Dominio']];
let pubUI = null;
function abrirPublicar(pestana = 'revision') {
  // GrapesJS puede dejar el contenido de la ventana anterior en el documento:
  // se quita para no duplicar los id de las pestañas.
  document.querySelectorAll('.pub').forEach(x => x.remove());
  const w = document.createElement('div');
  w.className = 'pub';
  const pestanas = SIN_SERVIDOR() ? PESTANAS_PUB.slice(0, 1) : PESTANAS_PUB;
  w.innerHTML = `<div class="cod-tabs" role="tablist">${pestanas.map(([id, ic, t]) => `<button class="cod-tab" role="tab" data-pub="${id}" id="pubt-${id}" aria-controls="pubp-${id}"><i class="bi bi-${ic}"></i> ${t}<span class="pub-n" data-n="${id}"></span></button>`).join('')}</div>
    ${pestanas.map(([id]) => `<div class="pub-pane" role="tabpanel" id="pubp-${id}" aria-labelledby="pubt-${id}" data-pane-pub="${id}" hidden></div>`).join('')}`;
  pubUI = { w, sitio: null, avisos: null, estado: null };
  editor.Modal.open({ title: SIN_SERVIDOR() ? 'Revisar el sitio' : 'Revisar y publicar', content: w });
  const dialogo = document.querySelector('.gjs-mdl-dialog');
  if (dialogo) { dialogo.classList.add('cod-dialog'); editor.once('modal:close', () => { dialogo.classList.remove('cod-dialog'); pubUI = null; }); }
  w.querySelectorAll('[data-pub]').forEach(b => b.onclick = () => mostrarPestanaPub(b.dataset.pub));
  w.querySelector('[role=tablist]').addEventListener('keydown', (e) => {
    const t = [...w.querySelectorAll('[data-pub]')], i = t.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = t[(i + (e.key === 'ArrowRight' ? 1 : t.length - 1)) % t.length]; n.focus(); mostrarPestanaPub(n.dataset.pub); }
  });
  mostrarPestanaPub(pestana);
}
function mostrarPestanaPub(id) {
  if (!pubUI) return;
  const { w } = pubUI;
  w.querySelectorAll('[data-pub]').forEach(b => { const on = b.dataset.pub === id; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  w.querySelectorAll('[data-pane-pub]').forEach(p => { p.hidden = p.dataset.panePub !== id; });
  const pane = w.querySelector(`[data-pane-pub="${id}"]`);
  ({ revision: pintarRevision, publicar: pintarPublicar, historial: pintarHistorial, mensajes: pintarMensajes, dominio: pintarDominio })[id](pane);
}

/* ---------- Revisión ---------- */
const ICONO_AVISO = { error: 'x-circle-fill', aviso: 'exclamation-triangle-fill' };
async function pintarRevision(pane, forzar = false) {
  if (pubUI.avisos && !forzar) { dibujarAvisos(pane); return; }
  pane.innerHTML = '<p class="imp-hint" id="rev-prog" role="status"><i class="bi bi-hourglass-split"></i> Revisando el sitio…</p>';
  const prog = pane.querySelector('#rev-prog');
  pubUI.avisos = await revisarSitio((i, n, archivo, ancho) => { prog.innerHTML = `<i class="bi bi-hourglass-split"></i> Revisando ${archivo} a ${ancho} px (${i}/${n})…`; });
  if (!pubUI) return;
  dibujarAvisos(pane);
}
function dibujarAvisos(pane) {
  const av = pubUI.avisos;
  const err = av.filter(a => a.nivel === 'error').length;
  const n = pubUI.w.querySelector('[data-n="revision"]');
  n.textContent = av.length || '✓';
  n.className = 'pub-n sem-badge ' + (err ? 'err' : av.length ? 'avi' : 'ok');
  const porPagina = new Map();
  av.forEach((a, i) => { const k = archivoDePagina(a.pagina); if (!porPagina.has(k)) porPagina.set(k, []); porPagina.get(k).push([a, i]); });
  pane.innerHTML = `<div class="sem-acciones"><span class="imp-hint" style="margin:0">${av.length ? `${av.length} aviso(s) en ${porPagina.size} página(s)${err ? `, ${err} con error` : ''}.` : '<i class="bi bi-check-circle"></i> Todo en orden: enlaces, anclas, textos alternativos, etiquetas y anchos de 375, 768 y 1280 px.'}</span>
    <span class="grow"></span><button class="tb-btn" id="rev-otra"><i class="bi bi-arrow-repeat"></i> Revisar de nuevo</button>
    ${SIN_SERVIDOR() ? '<button class="tb-btn primary" id="rev-pub"><i class="bi bi-download"></i> Exportar sitio (ZIP)</button>' : '<button class="tb-btn primary" id="rev-pub"><i class="bi bi-cloud-upload"></i> Ir a publicar</button>'}</div>
    ${[...porPagina].map(([archivo, lista]) => `<div class="sem-pag"><i class="bi bi-file-earmark-code"></i> ${SIN_HTML(archivo)}</div>
      ${lista.map(([a, i]) => `<div class="sem-item ${a.nivel === 'error' ? 'error' : 'aviso'}" data-tipo="${a.tipo}"><i class="bi bi-${ICONO_AVISO[a.nivel] || 'info-circle'}"></i><span>${SIN_HTML(a.msg)}</span>
        <button class="tb-btn" data-ir="${i}" title="Ir a la página y seleccionar el elemento"><i class="bi bi-crosshair"></i> Ir</button></div>`).join('')}`).join('')}`;
  pane.querySelector('#rev-otra').onclick = () => pintarRevision(pane, true);
  pane.querySelector('#rev-pub').onclick = () => { if (SIN_SERVIDOR()) { editor.Modal.close(); exportarZip(); } else mostrarPestanaPub('publicar'); };
  pane.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => irAlAviso(av[+b.dataset.ir]));
}

/* ---------- Conexión con el servidor ---------- */
async function estadoServidor() {
  const srv = servidorPublicacion();
  try { const r = await fetch(srv + '/api/estado'); return { ...(await r.json()), srv }; }
  catch (e) { return { ok: false, srv }; }
}
function formConexion(pane, est, alConectar) {
  const div = document.createElement('div');
  div.className = 'pub-caja';
  div.innerHTML = `
    <div class="ov-title"><i class="bi bi-hdd-network"></i> Servidor de publicación</div>
    ${est.ok ? `<p class="hint">Conectado a <b>${SIN_HTML(est.srv)}</b>. Los sitios se publican en <b>&lt;nombre&gt;.${SIN_HTML(est.dominio_base)}</b>.</p>`
      : `<p class="pub-error"><i class="bi bi-exclamation-triangle"></i> No responde ningún servidor en <b>${SIN_HTML(est.srv || '(sin dirección)')}</b>. Arráncalo con <code>python servidor/servidor.py</code> y vuelve a intentarlo. Exportar en ZIP sigue funcionando sin servidor.</p>`}
    <label class="f-lbl" for="pub-srv">Dirección del servidor</label>
    <input class="f-in" id="pub-srv" value="${SIN_HTML(est.srv || '')}" placeholder="https://editor.midominio.com" spellcheck="false">
    <label class="f-lbl" for="pub-clave">Clave del servidor <span class="hint">(la muestra el servidor al arrancar)</span></label>
    <input class="f-in" id="pub-clave" type="password" autocomplete="off" value="">
    <label class="t-check" style="margin-top:8px"><input type="checkbox" id="pub-recordar"><span>Recordarla en este navegador</span></label>
    <div style="text-align:right;margin-top:10px"><button class="tb-btn primary" id="pub-conectar"><i class="bi bi-plug"></i> Conectar</button></div>
    <p class="pub-error" id="pub-con-err" hidden></p>`;
  div.querySelector('#pub-conectar').onclick = async () => {
    const srv = div.querySelector('#pub-srv').value.trim().replace(/\/+$/, '');
    try { localStorage.setItem('bs5-editor-servidor', srv); } catch (e) { /* sin almacenamiento */ }
    guardarClave(div.querySelector('#pub-clave').value.trim(), div.querySelector('#pub-recordar').checked);
    const e = div.querySelector('#pub-con-err');
    try { await api('/api/sesion'); e.hidden = true; alConectar(); }
    catch (err) { e.hidden = false; e.textContent = err.message; }
  };
  pane.appendChild(div);
}

/* ---------- Publicar ---------- */
async function pintarPublicar(pane) {
  pane.innerHTML = '<p class="imp-hint"><i class="bi bi-hourglass-split"></i> Conectando…</p>';
  const est = await estadoServidor();
  if (!pubUI) return;
  pane.innerHTML = '';
  if (!est.ok || !claveServidor()) { formConexion(pane, est, () => pintarPublicar(pane)); return; }
  try { await api('/api/sesion'); }
  catch (e) { if (e.status === 401) { formConexion(pane, est, () => pintarPublicar(pane)); return; } }
  if (!PUB.slug) { formSitio(pane, est); return; }
  let s;
  try { s = (await api('/api/sitios/' + PUB.slug)).sitio; }
  catch (e) {
    if (e.status === 404) { formSitio(pane, est, `El sitio «${PUB.slug}» no existe en este servidor. Créalo de nuevo o elige otro nombre.`); return; }
    pane.innerHTML = `<p class="pub-error">${SIN_HTML(e.message)}</p>`; return;
  }
  pubUI.sitio = s;
  const activa = s.revisiones.find(r => r.estado === 'activa');
  pane.innerHTML = `
    <div class="pub-caja">
      <div class="ov-title"><i class="bi bi-globe2"></i> ${SIN_HTML(s.nombre)}</div>
      <p class="pub-url"><a href="${SIN_HTML(s.url)}" target="_blank" rel="noopener" id="pub-enlace">${SIN_HTML(s.url)}</a>
        ${activa ? `<span class="pub-chip ok">En línea: versión ${activa.numero}</span>` : '<span class="pub-chip">Aún sin publicar</span>'}</p>
      <p class="hint" id="pub-dif"><i class="bi bi-hourglass-split"></i> Comparando el borrador con la versión publicada…</p>
    </div>
    <div class="pub-caja">
      <div class="ov-title"><i class="bi bi-cloud-upload"></i> Nueva versión</div>
      <label class="f-lbl" for="pub-nota">Nota de la versión (opcional)</label>
      <input class="f-in" id="pub-nota" maxlength="200" placeholder="Por ejemplo: nueva sección de testimonios">
      <label class="t-check" style="margin-top:10px"><input type="checkbox" id="pub-activar" checked><span>Activarla en cuanto esté lista. Si la desmarcas, queda preparada para revisarla con un enlace de vista previa.</span></label>
      <div class="pub-acc"><span class="hint" id="pub-avisos"></span><span class="grow"></span>
        <button class="tb-btn primary" id="pub-ya"><i class="bi bi-rocket-takeoff"></i> Preparar y publicar</button></div>
      <div id="pub-prog" role="status" aria-live="polite"></div>
    </div>
    <div class="pub-caja"><div class="ov-title"><i class="bi bi-plug"></i> Dependen de un servicio externo</div><ul class="pub-dep" id="pub-dep"><li class="hint">Calculando…</li></ul></div>`;
  const avisos = pubUI.avisos;
  pane.querySelector('#pub-avisos').innerHTML = avisos ? (avisos.length ? `<i class="bi bi-exclamation-triangle"></i> La revisión encontró ${avisos.length} aviso(s).` : '<i class="bi bi-check-circle"></i> La revisión no encontró problemas.') : 'Aún no se revisó el sitio.';
  paqueteDePublicacion().then(pq => {
    if (!pubUI) return;
    pubUI.paquete = pq;
    pane.querySelector('#pub-dif').innerHTML = !activa ? `Borrador listo: ${pq.archivos.length} archivos, ${kb(pq.bytes)}.`
      : activa.huella === pq.huella ? '<i class="bi bi-check2-all"></i> El borrador es igual a la versión publicada.'
      : `<i class="bi bi-pencil-square"></i> El borrador tiene <b>cambios sin publicar</b> respecto a la versión ${activa.numero}.`;
    pane.querySelector('#pub-dep').innerHTML = pq.sitio.dependencias.map(d => `<li><b>${SIN_HTML(d.que)}</b> · ${SIN_HTML(d.donde)}<br><span class="hint">${SIN_HTML(d.nota)}</span></li>`).join('');
  }).catch(e => { pane.querySelector('#pub-dif').textContent = 'No se pudo preparar el borrador: ' + e.message; });
  pane.querySelector('#pub-ya').onclick = () => publicarAhora(pane);
}
function formSitio(pane, est, aviso = '') {
  const sugerido = slug(PUB.nombre || (editor.Pages.getAll()[0] && editor.Pages.getAll()[0].get('seoTitulo')) || 'mi-sitio').slice(0, 40);
  const div = document.createElement('div');
  div.className = 'pub-caja';
  div.innerHTML = `<div class="ov-title"><i class="bi bi-plus-circle"></i> Crear el sitio en el servidor</div>
    ${aviso ? `<p class="pub-error">${SIN_HTML(aviso)}</p>` : ''}
    <label class="f-lbl" for="pub-nombre">Nombre del sitio</label><input class="f-in" id="pub-nombre" value="${SIN_HTML(PUB.nombre || '')}" placeholder="Mi estudio">
    <label class="f-lbl" for="pub-slug">Dirección</label>
    <div class="pub-slug"><input class="f-in" id="pub-slug" value="${SIN_HTML(sugerido)}" spellcheck="false" pattern="[a-z0-9-]{3,40}"><span>.${SIN_HTML(est.dominio_base)}</span></div>
    <p class="hint">Solo minúsculas, números y guiones. Después podrás conectar un dominio propio.</p>
    <div style="text-align:right"><button class="tb-btn primary" id="pub-crear"><i class="bi bi-check-lg"></i> Crear sitio</button></div>
    <p class="pub-error" id="pub-crear-err" hidden></p>`;
  div.querySelector('#pub-nombre').oninput = (e) => { div.querySelector('#pub-slug').value = slug(e.target.value).slice(0, 40); };
  div.querySelector('#pub-crear').onclick = async () => {
    const s = div.querySelector('#pub-slug').value.trim(), n = div.querySelector('#pub-nombre').value.trim() || s;
    const e = div.querySelector('#pub-crear-err');
    try { await api('/api/sitios', { metodo: 'POST', cuerpo: { slug: s, nombre: n } }); }
    catch (err) { if (err.status !== 409) { e.hidden = false; e.textContent = err.message; return; } }
    PUB.slug = s; PUB.nombre = n;
    editor.store();
    pintarPublicar(div.parentElement);
  };
  pane.appendChild(div);
}
async function publicarAhora(pane) {
  const btn = pane.querySelector('#pub-ya'), prog = pane.querySelector('#pub-prog');
  const err = (pubUI.avisos || []).filter(a => a.nivel === 'error').length;
  if (err && !confirm(`La revisión encontró ${err} error(es). ¿Publicar igualmente?`)) return;
  btn.disabled = true;
  const paso = (t, clase = '') => { prog.className = 'pub-prog ' + clase; prog.innerHTML = t; };
  try {
    paso('<i class="bi bi-hourglass-split"></i> Generando el sitio…');
    const pq = pubUI.paquete || await paqueteDePublicacion();
    paso(`<i class="bi bi-cloud-arrow-up"></i> Subiendo ${pq.archivos.length} archivos (${kb(pq.bytes)}) y verificándolos…`);
    const activar = pane.querySelector('#pub-activar').checked;
    const r = await api(`/api/sitios/${PUB.slug}/revisiones`, { metodo: 'POST',
      cuerpo: { archivos: pq.archivos, proyecto: proyectoParaGuardar(), nota: pane.querySelector('#pub-nota').value.trim(), activar } });
    paso(activar
      ? `<i class="bi bi-check-circle-fill"></i> Versión ${r.numero} publicada y activa en <a href="${SIN_HTML(r.sitio.url)}" target="_blank" rel="noopener">${SIN_HTML(r.sitio.url)}</a>.`
      : `<i class="bi bi-check-circle-fill"></i> Versión ${r.numero} preparada sin activar. Compártela desde Historial con un enlace de vista previa.`, 'ok');
    toast(activar ? `Versión ${r.numero} publicada` : `Versión ${r.numero} preparada`);
    pubUI.paquete = null;
    pubUI.sitio = r.sitio;
  } catch (e) {
    paso(`<i class="bi bi-x-octagon-fill"></i> No se publicó: ${SIN_HTML(e.message)}. La versión que estaba en línea sigue igual.`, 'error');
  } finally { btn.disabled = false; }
}

/* ---------- Historial ---------- */
const ESTADOS = { activa: 'En línea', preparada: 'Preparada', archivada: 'Anterior', fallida: 'Falló' };
async function pintarHistorial(pane) {
  pane.innerHTML = '<p class="imp-hint"><i class="bi bi-hourglass-split"></i> Cargando…</p>';
  if (!PUB.slug || !claveServidor()) { pane.innerHTML = '<p class="imp-hint">Primero conecta el servidor y crea el sitio en la pestaña <b>Publicar</b>.</p>'; return; }
  let s;
  try { s = (await api('/api/sitios/' + PUB.slug)).sitio; } catch (e) { pane.innerHTML = `<p class="pub-error">${SIN_HTML(e.message)}</p>`; return; }
  if (!pubUI) return;
  pubUI.sitio = s;
  const previas = s.previas.filter(p => p.vigente);
  pane.innerHTML = `
    <p class="imp-hint">Cada publicación queda guardada. Activar una versión anterior la vuelve a poner en línea al instante; el borrador no cambia.</p>
    <table class="pub-tabla"><thead><tr><th>Versión</th><th>Fecha</th><th>Nota</th><th>Estado</th><th><span class="visually-hidden">Acciones</span></th></tr></thead><tbody>
    ${s.revisiones.map(r => `<tr class="${r.estado}"><td>v${r.numero}</td><td>${fecha(r.creada)}</td><td>${SIN_HTML(r.nota || '—')}${r.error ? `<br><span class="pub-error">${SIN_HTML(r.error)}</span>` : ''}</td>
      <td><span class="pub-chip ${r.estado === 'activa' ? 'ok' : r.estado === 'fallida' ? 'mal' : ''}">${ESTADOS[r.estado] || r.estado}</span></td>
      <td class="pub-acc-fila">${r.estado === 'fallida' ? '' : `
        ${r.estado !== 'activa' ? `<button class="tb-btn" data-activar="${r.numero}" title="Poner esta versión en línea"><i class="bi bi-arrow-counterclockwise"></i> Activar</button>` : ''}
        <button class="tb-btn" data-previa="${r.numero}" title="Crear un enlace de vista previa que caduca en 24 horas"><i class="bi bi-link-45deg"></i> Vista previa</button>
        <button class="tb-btn" data-abrir="${r.numero}" title="Cargar esta versión en el editor (reemplaza el borrador)"><i class="bi bi-box-arrow-in-down"></i> Al editor</button>`}</td></tr>`).join('') || '<tr><td colspan="5" class="hint">Aún no hay publicaciones.</td></tr>'}
    </tbody></table>
    <div class="ov-title" style="margin-top:14px"><i class="bi bi-link-45deg"></i> Enlaces de vista previa vigentes</div>
    <div id="pub-previas">${previas.map(p => `<div class="sem-item"><i class="bi bi-eye"></i><span>v${p.numero} · caduca ${fecha(p.caduca)}${pubUI.urls && pubUI.urls[p.id] ? `<br><a href="${SIN_HTML(pubUI.urls[p.id])}" target="_blank" rel="noopener" class="pub-url-previa">${SIN_HTML(pubUI.urls[p.id])}</a>` : ''}</span>
      ${pubUI.urls && pubUI.urls[p.id] ? `<button class="tb-btn" data-copiar="${SIN_HTML(pubUI.urls[p.id])}"><i class="bi bi-clipboard"></i> Copiar</button>` : ''}
      <button class="tb-btn" data-revocar="${p.id}"><i class="bi bi-x-circle"></i> Revocar</button></div>`).join('') || '<p class="hint">Ninguno. Solo quien tenga el enlace puede ver la versión, y el enlace deja de funcionar al caducar o al revocarlo.</p>'}</div>`;
  const ok = async (fn, msg) => { try { await fn(); if (msg) toast(msg); } catch (e) { alert(e.message); } pintarHistorial(pane); };
  pane.querySelectorAll('[data-activar]').forEach(b => b.onclick = () => {
    if (!confirm(`¿Poner en línea la versión ${b.dataset.activar}? La versión actual queda en el historial.`)) return;
    ok(() => api(`/api/sitios/${PUB.slug}/activar`, { metodo: 'POST', cuerpo: { numero: +b.dataset.activar } }), `Versión ${b.dataset.activar} en línea`);
  });
  pane.querySelectorAll('[data-previa]').forEach(b => b.onclick = () => ok(async () => {
    const r = await api(`/api/sitios/${PUB.slug}/previas`, { metodo: 'POST', cuerpo: { numero: +b.dataset.previa, horas: 24 } });
    pubUI.urls = { ...(pubUI.urls || {}), [r.id]: r.url };
    try { await navigator.clipboard.writeText(r.url); } catch (e) { /* se muestra igual */ }
  }, 'Enlace de vista previa creado (24 h)'));
  pane.querySelectorAll('[data-revocar]').forEach(b => b.onclick = () => ok(() => api(`/api/sitios/${PUB.slug}/previas/${b.dataset.revocar}`, { metodo: 'DELETE' }), 'Enlace revocado'));
  pane.querySelectorAll('[data-copiar]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copiar); toast('Enlace copiado'); } catch (e) { toast('Selecciona el enlace y cópialo con Ctrl+C'); } });
  pane.querySelectorAll('[data-abrir]').forEach(b => b.onclick = async () => {
    if (!confirm(`¿Cargar la versión ${b.dataset.abrir} en el editor? Reemplaza el borrador actual (descarga antes una copia si la necesitas).`)) return;
    try {
      const r = await fetch(`${servidorPublicacion()}/api/sitios/${PUB.slug}/revisiones/${b.dataset.abrir}/proyecto`, { headers: { Authorization: 'Bearer ' + claveServidor() } });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'No se pudo descargar');
      editor.Modal.close();
      cargarProyecto(await r.json(), `Versión ${b.dataset.abrir} cargada en el editor`);
    } catch (e) { alert(e.message); }
  });
}

/* ---------- Mensajes del formulario ---------- */
async function pintarMensajes(pane) {
  if (!PUB.slug || !claveServidor()) { pane.innerHTML = '<p class="imp-hint">Los mensajes del formulario llegan al servidor de publicación. Conéctalo en la pestaña <b>Publicar</b>.</p>'; return; }
  pane.innerHTML = '<p class="imp-hint"><i class="bi bi-hourglass-split"></i> Cargando…</p>';
  try {
    const { mensajes } = await api(`/api/sitios/${PUB.slug}/mensajes`);
    pane.innerHTML = `<p class="imp-hint">${mensajes.length} mensaje(s) recibidos por los formularios del sitio. También quedan en <code>servidor/datos/buzon/${SIN_HTML(PUB.slug)}/</code>.</p>
      ${mensajes.map(m => `<div class="pub-msj"><div class="hint">${fecha(m.creado)} · ${SIN_HTML(m.formulario)} · ${SIN_HTML(m.origen || '')}</div>
        <dl>${Object.entries(m.datos).map(([k, v]) => `<dt>${SIN_HTML(k)}</dt><dd>${SIN_HTML(v)}</dd>`).join('')}</dl></div>`).join('')}`;
  } catch (e) { pane.innerHTML = `<p class="pub-error">${SIN_HTML(e.message)}</p>`; }
}

/* ---------- Dominio ---------- */
async function pintarDominio(pane) {
  if (!PUB.slug || !claveServidor()) { pane.innerHTML = '<p class="imp-hint">Primero crea el sitio en la pestaña <b>Publicar</b>.</p>'; return; }
  let s;
  try { s = (await api('/api/sitios/' + PUB.slug)).sitio; } catch (e) { pane.innerHTML = `<p class="pub-error">${SIN_HTML(e.message)}</p>`; return; }
  const host = new URL(s.url).host;
  pane.innerHTML = `
    <div class="pub-caja"><div class="ov-title"><i class="bi bi-shield-lock"></i> Dirección gestionada</div>
      <p><a href="${SIN_HTML(s.url)}" target="_blank" rel="noopener">${SIN_HTML(s.url)}</a></p>
      <p class="hint">En producción el servidor va detrás de Caddy, que obtiene certificados HTTPS para cada subdominio automáticamente (ver README).</p></div>
    <div class="pub-caja"><div class="ov-title"><i class="bi bi-globe"></i> Dominio propio</div>
      ${s.dominios.map(d => `<div class="sem-item ${d.verificado ? '' : 'aviso'}"><i class="bi bi-${d.verificado ? 'check-circle-fill' : 'hourglass-split'}"></i>
        <span><b>${SIN_HTML(d.dominio)}</b> · ${d.verificado ? 'verificado' : `pendiente: crea un registro <b>CNAME</b> de <code>${SIN_HTML(d.dominio)}</code> a <code>${SIN_HTML(host.split(':')[0])}</code> (o un registro A a la IP del servidor) y pulsa Verificar`}</span>
        ${d.verificado ? '' : `<button class="tb-btn" data-verificar="${SIN_HTML(d.dominio)}"><i class="bi bi-arrow-repeat"></i> Verificar</button>`}</div>`).join('')}
      <label class="f-lbl" for="dom-nuevo">Añadir dominio</label>
      <div class="ov-row"><input class="f-in" id="dom-nuevo" placeholder="www.midominio.com" spellcheck="false"><button class="tb-btn primary" id="dom-add"><i class="bi bi-plus-lg"></i> Añadir</button></div>
      <p class="pub-error" id="dom-err" hidden></p>
      <p class="hint">El servidor comprueba que el dominio apunta a él pidiendo <code>/.well-known/editor-verificacion/…</code>. Los cambios de DNS los haces tú en tu proveedor de dominio; el editor no los toca.</p></div>`;
  const err = pane.querySelector('#dom-err');
  pane.querySelector('#dom-add').onclick = async () => {
    try { await api(`/api/sitios/${PUB.slug}/dominios`, { metodo: 'POST', cuerpo: { dominio: pane.querySelector('#dom-nuevo').value } }); pintarDominio(pane); }
    catch (e) { err.hidden = false; err.textContent = e.message; }
  };
  pane.querySelectorAll('[data-verificar]').forEach(b => b.onclick = async () => {
    try {
      const r = await api(`/api/sitios/${PUB.slug}/dominios/${b.dataset.verificar}/verificar`, { metodo: 'POST' });
      if (r.ok) { toast('Dominio verificado'); pintarDominio(pane); } else { err.hidden = false; err.textContent = r.error; }
    } catch (e) { err.hidden = false; err.textContent = e.message; }
  });
}

$('#btn-publicar').onclick = () => abrirPublicar('revision');

/* ---------- Formularios: destino por defecto (pestaña «Sitio») ---------- */
(() => {
  const box = $('#form-destino-box');
  if (!box) return;
  const pintar = () => {
    // Sin servidor no hay quien reciba los mensajes: solo correo u otra dirección
    if (SIN_SERVIDOR() && PUB.formDestino === 'servicio') PUB.formDestino = 'correo';
    box.querySelectorAll('input[name=fd]').forEach(r => { r.checked = r.value === PUB.formDestino; });
    $('#fd-url').value = PUB.formUrl; $('#fd-correo').value = PUB.formCorreo;
    $('#fd-url').disabled = PUB.formDestino !== 'url'; $('#fd-correo').disabled = PUB.formDestino !== 'correo';
    const ep = endpointFormulario('zip');
    $('#fd-info').innerHTML = PUB.formDestino === 'servicio'
      ? (PUB.slug ? `Publicado, el formulario envía a este servidor. En el ZIP envía a <b>${SIN_HTML(ep || '(conecta un servidor)')}</b>.` : 'Crea el sitio en «Revisar y publicar» para que el servidor reciba los mensajes.')
      : PUB.formDestino === 'url' ? 'Útil para sitios exportados: Formspree, Getform o tu propio servidor (recibe JSON).' : 'Abre el programa de correo de quien visita, con el mensaje listo.';
  };
  box.querySelectorAll('input[name=fd]').forEach(r => r.onchange = () => { PUB.formDestino = r.value; editor.store(); pintar(); });
  $('#fd-url').onchange = (e) => { const v = e.target.value.trim(); if (v && !/^https:\/\//i.test(v)) { toast('La dirección debe empezar con https://'); e.target.value = PUB.formUrl; return; } PUB.formUrl = v; editor.store(); pintar(); };
  $('#fd-correo').onchange = (e) => { const v = e.target.value.trim(); if (v && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)) { toast('Escribe un correo válido'); e.target.value = PUB.formCorreo; return; } PUB.formCorreo = v; editor.store(); pintar(); };
  editor.on('load proyecto:abierto', () => setTimeout(pintar, 300));
  $$('.tabs[data-group=left] button[data-tab=sitio]').forEach(b => b.addEventListener('click', pintar));
})();

/* ---------- Propiedades de un formulario ---------- */
editor.on('component:selected', (c) => {
  if (!c || tagDe(c) !== 'form' || !c.getTrait) return;
  ['recibe-envios', 'data-destino-url', 'data-msg-ok'].forEach(n => { try { if (c.getTrait(n)) c.removeTrait(n); } catch (e) { /* sigue */ } });
  c.set('recibe-envios', !!attrs(c)['data-formulario'], { silent: true });
  c.addTrait([
    { type: 'checkbox', name: 'recibe-envios', label: 'Recibir envíos', changeProp: true },
    { type: 'text', name: 'data-destino-url', label: 'Enviar a otra dirección', placeholder: 'Opcional: https://… (si no, el de Sitio → Formularios)' },
    { type: 'text', name: 'data-msg-ok', label: 'Mensaje al enviar', placeholder: '¡Gracias! Recibimos tu mensaje…' }
  ], { at: 0 });
});
editor.on('component:update:recibe-envios', (c) => {
  if (c.get('recibe-envios')) c.addAttributes({ 'data-formulario': attrs(c)['data-formulario'] || 'contacto', method: 'post' });
  else c.removeAttributes('data-formulario');
});

/* ---------- Sin servidor: diseñar y exportar ----------
   Si nadie responde en /api/estado (el editor abierto desde Workers, Live
   Server o cualquier alojamiento estático), se ocultan publicar, historial,
   mensajes, dominio y variantes con IA. Queda «Revisar» y el ZIP, y los
   formularios envían por correo o a otra dirección (Formspree…). */
const SIN_SERVIDOR = () => document.body.classList.contains('sin-servidor');
document.body.classList.add('sin-servidor');
(async () => {
  const est = await estadoServidor();
  const hay = !!(est && est.ok === true && est.version);
  document.body.classList.toggle('sin-servidor', !hay);
  const b = $('#btn-publicar');
  b.querySelector('.lbl').textContent = hay ? 'Revisar y publicar' : 'Revisar';
  b.title = hay ? 'Revisar el sitio y publicarlo (historial, vista previa con enlace y restauración)'
    : 'Revisar el sitio: enlaces, anclas, textos alternativos, etiquetas y desbordes. Después, exporta el ZIP.';
  if (!hay && PUB.formDestino === 'servicio') PUB.formDestino = 'correo';
  editor.trigger('servidor:estado', hay);
})();
editor.on('load proyecto:abierto', () => { if (SIN_SERVIDOR() && PUB.formDestino === 'servicio') PUB.formDestino = 'correo'; });
