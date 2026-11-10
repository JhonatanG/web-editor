/* =====================================================================
   Variantes con IA: «Probar otra variante» de la sección seleccionada
   1. La sección se envía al servidor como lista plana de nodos (etiqueta,
      clases, texto, atributos). Las imágenes subidas no viajan: van como
      «recurso:N» y se recuperan al volver.
   2. El servidor la pasa al proveedor configurado (o al modo de prueba) y
      devuelve otra lista con el mismo formato, ya validada.
   3. El editor la vuelve a validar, la muestra junto al original (iframes
      sin scripts) y avisa si toca un componente compartido.
   4. Aplicar reemplaza SOLO esa sección, en un paso de deshacer.
   La clave del proveedor vive en el servidor; el navegador nunca la ve.
===================================================================== */
const V_ETIQUETAS = new Set(['section', 'div', 'header', 'footer', 'article', 'aside', 'nav', 'main', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'span', 'a', 'button', 'img', 'ul', 'ol', 'li', 'figure', 'figcaption', 'blockquote', 'strong', 'em', 'small', 'b', 'i', 'br', 'hr',
  'form', 'label', 'input', 'textarea', 'select', 'option', 'address', 'cite', 'video', 'iframe']);
const V_VACIOS = new Set(['img', 'br', 'hr', 'input']);
const V_NO_ENVIAR = /^(data-vk|data-vinculo|data-gjs.*|class)$/;
const V_URL = /^(#[\w-]*|https?:\/\/[^\s"<>]+|mailto:[^\s"<>]+|tel:[\d+ ()-]+|[\w./-]+\.html(#[\w-]+)?|recurso:\d+|imagen-sugerida:[^"<>]{1,120})$/i;

/* ---------- Sección → nodos ---------- */
function nodosDeSeccion(sec) {
  const nodos = [], recursos = [];
  let n = 0;
  const visita = (c, padre) => {
    const tag = tagDe(c);
    if (!tag || (c.is && c.is('textnode'))) return;
    const id = n++;
    const a = { ...(c.get('attributes') || {}) };
    if (tag === 'img') a.src = c.get('src') || a.src || '';
    const atributos = [];
    Object.entries(a).forEach(([k, v]) => {
      if (V_NO_ENVIAR.test(k) || v === undefined || v === null || v === false) return;
      let val = v === true ? '' : String(v);
      if (/^(src|poster|href)$/.test(k) && /^(data:|blob:)/i.test(val)) { recursos.push(val); val = 'recurso:' + (recursos.length - 1); }
      atributos.push({ nombre: k, valor: val });
    });
    const hijos = c.components().filter(h => !(h.is && h.is('textnode')));
    const textual = esTextual(c);
    const texto = textual ? textoDe(c) : c.components().filter(h => h.is && h.is('textnode')).map(h => h.get('content') || '').join(' ').replace(/\s+/g, ' ').trim();
    nodos.push({ id, padre, etiqueta: tag, clases: c.getClasses(), texto, atributos });
    if (!textual) hijos.forEach(h => visita(h, id));
  };
  visita(sec, -1);
  return { nodos, recursos };
}

/* ---------- Nodos → HTML (validado otra vez en el navegador) ---------- */
function htmlDeNodos(nodos, recursos, avisos) {
  const hijos = new Map();
  nodos.forEach(x => { if (!hijos.has(x.padre)) hijos.set(x.padre, []); hijos.get(x.padre).push(x); });
  const raiz = (hijos.get(-1) || [])[0];
  if (!raiz) throw new Error('La propuesta no tiene sección raíz');
  const color = String(TEMA.primario || '#3b5bdb').replace('#', '');
  const valor = (k, v) => {
    if (!/^(src|href|poster|action)$/.test(k)) return v;
    const t = v.trim();
    if (t && !V_URL.test(t)) { avisos.push(`Se quitó una dirección no permitida (${k})`); return null; }
    let m = /^recurso:(\d+)$/.exec(t);
    if (m) return recursos[+m[1]] || null;
    m = /^imagen-sugerida:(.+)$/i.exec(t);
    if (m) return svgEjemplo(1200, 900, color, m[1].slice(0, 60));
    return t;
  };
  const html = (x, prof) => {
    if (prof > 40) return '';
    const tag = String(x.etiqueta).toLowerCase();
    if (!V_ETIQUETAS.has(tag)) { avisos.push(`Se descartó un <${tag}>`); return ''; }
    const cls = (x.clases || []).filter(k => /^[A-Za-z_-][\w-]{0,60}$/.test(k));
    let at = cls.length ? ` class="${SIN_HTML(cls.join(' '))}"` : '';
    (x.atributos || []).forEach(({ nombre, valor: v }) => {
      const k = String(nombre).toLowerCase();
      if (!/^[a-z][a-z0-9-]*$/.test(k) || k.startsWith('on') || k === 'srcdoc') { avisos.push(`Se quitó el atributo ${k}`); return; }
      if (k === 'style' && /expression|javascript:/i.test(v)) return;
      const val = valor(k, String(v));
      if (val === null) return;
      at += ` ${k}="${SIN_HTML(val)}"`;
    });
    if (V_VACIOS.has(tag)) return `<${tag}${at}>`;
    return `<${tag}${at}>${SIN_HTML(x.texto || '')}${(hijos.get(x.id) || []).map(h => html(h, prof + 1)).join('')}</${tag}>`;
  };
  return html(raiz, 0);
}

/* ---------- Componentes compartidos dentro de la sección ---------- */
function compartidosDe(sec) {
  const out = [];
  const r = raizVinculo(sec);
  if (r && r !== sec) out.push({ comp: r, rol: rolDe(r), vid: vidDe(r), dentro: false });
  recorrer(sec, x => { if (vidDe(x)) out.push({ comp: x, rol: rolDe(x), vid: vidDe(x), dentro: true }); });
  return out.map(o => {
    const nom = nombreVinculo(o.vid);
    const n = piezasDe(o.vid).length - 1;
    return o.rol === 'principal'
      ? `«${nom}» es un componente <b>principal</b> con ${n} instancia(s): la variante lo sustituye y esas instancias quedarán sin principal (podrás elegir otro).`
      : `Contiene una instancia de «${nom}»: al aplicar, esta copia <b>dejará de estar vinculada</b>; el principal y las demás páginas no cambian.`;
  });
}

/* ---------- Ventana ---------- */
async function abrirVariantes(sec) {
  if (!sec) { toast('Selecciona primero una sección de la página'); return; }
  document.querySelectorAll('.var').forEach(x => x.remove());
  const nombre = nombreDeSeccion(sec);
  const w = document.createElement('div');
  w.className = 'var';
  w.innerHTML = `
    <div class="var-cab"><span id="var-modo" class="pub-chip">Consultando el servidor…</span>
      <span class="hint" style="margin:0">Solo cambia la sección «${SIN_HTML(nombre)}». Nada se aplica hasta que pulses «Aplicar».</span></div>
    <div class="var-form">
      <div role="radiogroup" aria-label="Qué cambiar" class="var-tipos">
        ${[['composicion', 'layout-three-columns', 'Composición'], ['texto', 'fonts', 'Texto'], ['imagen', 'image', 'Imagen']].map(([v, i, t], k) =>
          `<label class="var-tipo"><input type="radio" name="var-tipo" value="${v}" ${k ? '' : 'checked'}><i class="bi bi-${i}"></i> ${t}</label>`).join('')}
      </div>
      <label class="f-lbl" for="var-instr">Qué te gustaría (opcional)</label>
      <textarea class="f-in" id="var-instr" maxlength="600" rows="2" placeholder="Por ejemplo: más directo, para clientes jóvenes; o la imagen a la izquierda"></textarea>
      <div style="text-align:right;margin-top:8px"><button class="tb-btn primary" id="var-generar"><i class="bi bi-stars"></i> Generar propuesta</button></div>
    </div>
    <div id="var-res" role="status" aria-live="polite"></div>`;
  editor.Modal.open({ title: 'Probar otra variante', content: w });
  const dialogo = document.querySelector('.gjs-mdl-dialog');
  if (dialogo) { dialogo.classList.add('cod-dialog'); editor.once('modal:close', () => dialogo.classList.remove('cod-dialog')); }
  const modo = w.querySelector('#var-modo');
  estadoServidor().then(est => {
    if (!est.ok) { modo.textContent = 'Sin servidor'; modo.className = 'pub-chip mal'; return; }
    modo.textContent = est.ia.modo_prueba ? 'MODO DE PRUEBA · sin IA real' : est.ia.descripcion;
    modo.className = 'pub-chip ' + (est.ia.modo_prueba ? 'prueba' : 'ok');
    modo.title = est.ia.descripcion;
  });
  w.querySelector('#var-generar').onclick = () => generarVariante(w, sec);
}

async function generarVariante(w, sec) {
  const res = w.querySelector('#var-res');
  const btn = w.querySelector('#var-generar');
  const tipo = w.querySelector('input[name=var-tipo]:checked').value;
  if (!claveServidor()) { res.innerHTML = '<p class="pub-error">Conecta primero el servidor en «Revisar y publicar» → Publicar.</p>'; return; }
  const { nodos, recursos } = nodosDeSeccion(sec);
  btn.disabled = true;
  res.innerHTML = '<p class="imp-hint"><i class="bi bi-hourglass-split"></i> Generando la propuesta…</p>';
  let r;
  try {
    r = await api('/api/ia/variante', { metodo: 'POST', cuerpo: { tipo, instrucciones: w.querySelector('#var-instr').value.trim(), nodos,
      pagina: archivoDePagina(editor.Pages.getSelected()), tema: { ...TEMA } } });
  } catch (e) { res.innerHTML = `<p class="pub-error">${SIN_HTML(e.message)}</p>`; btn.disabled = false; return; }
  btn.disabled = false;
  const avisos = [...(r.avisos || [])];
  let propuesta;
  try { propuesta = htmlDeNodos(r.nodos, recursos, avisos); } catch (e) { res.innerHTML = `<p class="pub-error">${SIN_HTML(e.message)}</p>`; return; }
  const original = sec.toHTML();
  const css = editor.getCss({ component: sec }) || '';
  const compartidos = compartidosDe(sec);
  res.innerHTML = `
    <div class="var-resumen ${r.modo_prueba ? 'prueba' : ''}"><b>${SIN_HTML(r.resumen || 'Propuesta')}</b>
      <ul>${(r.cambios || []).map(c => `<li>${SIN_HTML(c)}</li>`).join('')}</ul>
      ${avisos.length ? `<p class="hint">Validación: ${SIN_HTML([...new Set(avisos)].join('; '))}.</p>` : ''}</div>
    <div class="sec-previa-barra" role="group" aria-label="Ancho">
      <button class="tb-btn active" data-ancho="1280"><i class="bi bi-display"></i> Escritorio</button>
      <button class="tb-btn" data-ancho="390"><i class="bi bi-phone"></i> Móvil</button></div>
    <div class="var-comp">
      <figure><figcaption>Original</figcaption><div class="var-marco"><iframe sandbox="" title="Sección original"></iframe></div></figure>
      <figure><figcaption>Propuesta</figcaption><div class="var-marco"><iframe sandbox="" title="Sección propuesta"></iframe></div></figure>
    </div>
    ${compartidos.length ? `<div class="var-aviso"><i class="bi bi-link-45deg"></i><div>${compartidos.map(x => `<p>${x}</p>`).join('')}
      <label class="t-check"><input type="checkbox" id="var-ok-compartido"><span>Entiendo cómo afecta al componente compartido</span></label></div></div>` : ''}
    <div class="sec-previa-acc">
      <button class="tb-btn" id="var-descartar"><i class="bi bi-x-lg"></i> Descartar</button>
      <button class="tb-btn" id="var-otra"><i class="bi bi-arrow-repeat"></i> Otra propuesta</button>
      <button class="tb-btn primary" id="var-aplicar" ${compartidos.length ? 'disabled' : ''}><i class="bi bi-check-lg"></i> Aplicar (Ctrl+Z la deshace)</button>
    </div>`;
  const [fo, fp] = res.querySelectorAll('iframe');
  const doc = (h) => docConTema(h, { extraCss: css + '[data-reveal]{opacity:1!important;transform:none!important}' });
  fo.srcdoc = doc(original);
  fp.srcdoc = doc(propuesta);
  const ajustar = (ancho) => res.querySelectorAll('.var-marco').forEach(m => {
    const f = m.querySelector('iframe'), esc = Math.min(1, (m.clientWidth || 420) / ancho);
    f.style.width = ancho + 'px'; f.style.height = Math.round(360 / esc) + 'px'; f.style.transform = `scale(${esc})`;
  });
  res.querySelectorAll('[data-ancho]').forEach(b => b.onclick = () => { res.querySelectorAll('[data-ancho]').forEach(x => marcar(x, x === b)); ajustar(+b.dataset.ancho); });
  setTimeout(() => ajustar(1280), 0);
  const ok = res.querySelector('#var-ok-compartido');
  if (ok) ok.onchange = () => { res.querySelector('#var-aplicar').disabled = !ok.checked; };
  res.querySelector('#var-descartar').onclick = () => { editor.Modal.close(); toast('Propuesta descartada: la sección no cambió'); };
  res.querySelector('#var-otra').onclick = () => generarVariante(w, sec);
  res.querySelector('#var-aplicar').onclick = () => {
    const nuevo = aplicarVariante(sec, propuesta);
    editor.Modal.close();
    if (nuevo) toast('Variante aplicada. Ctrl+Z vuelve a la versión anterior.', 3500);
  };
}

// Reemplaza la sección en un solo ciclo: un único paso de deshacer
function aplicarVariante(sec, html) {
  if (!sec || !sec.parent()) return null;
  // Primero se quita y luego se añade (no replaceWith): al deshacer, la sección
  // original vuelve cuando la propuesta ya no está, y conserva su id (si no,
  // GrapesJS la renombraba a «servicios-2» y rompía anclas y estilos).
  const padre = sec.parent(), at = sec.index();
  sec.remove();
  const r = padre.append(html, { at });
  const nuevo = Array.isArray(r) ? r[0] : r;
  if (!nuevo) return null;
  aplicarSemantica(editor.getWrapper(), nuevo);
  editor.select(nuevo);
  const id = attrs(sec).id;
  if (id) aplicadas.push({ id, piezas: [sec, nuevo] });
  return nuevo;
}
// Al deshacer o rehacer, GrapesJS devuelve la sección cuando el id aún figura
// como usado por la otra versión y la renombra («servicios-2»): se le
// devuelve su id, sin crear otro paso de historial.
const aplicadas = [];
editor.on('undo redo', () => setTimeout(() => {
  aplicadas.forEach(({ id, piezas }) => {
    const viva = piezas.find(c => c.parent() && buscarComp(editor.getWrapper(), x => x === c).length);
    if (!viva || attrs(viva).id === id || !new RegExp('^' + id.replace(/[-]/g, '\\-') + '-\\d+$').test(attrs(viva).id || '')) return;
    if (buscarComp(editor.getWrapper(), x => x !== viva && attrs(x).id === id).length) return;
    editor.UndoManager.skip(() => viva.addAttributes({ id }));
  });
}, 0));

/* ---------- Botón en el panel derecho ---------- */
(() => {
  const box = document.createElement('div');
  box.className = 'variante-box';
  box.id = 'variante-box';
  box.hidden = true;
  box.innerHTML = '<button class="tb-btn" id="btn-variante"><i class="bi bi-stars"></i> <span>Probar otra variante</span></button>';
  const vinc = $('#vinc-box');
  vinc.parentNode.insertBefore(box, vinc);
  const pintar = () => {
    const c = editor.getSelected();
    const s = c && !(c.is && c.is('wrapper')) ? seccionDe(c) : null;
    box.hidden = !s;
    if (s) box.querySelector('span').textContent = `Probar otra variante de «${nombreDeSeccion(s).slice(0, 28)}»`;
  };
  editor.on('component:selected component:deselected', () => setTimeout(pintar, 0));
  box.querySelector('button').onclick = () => { const c = editor.getSelected(); abrirVariantes(c && seccionDe(c)); };
})();
