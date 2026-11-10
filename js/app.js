/* =====================================================================
   Barra superior
===================================================================== */
const marcar = (btn, on) => btn.classList.toggle('active', !!on);

// Dispositivos
$$('[data-device]').forEach(btn => btn.addEventListener('click', () => {
  editor.setDevice(btn.dataset.device);
  $$('[data-device]').forEach(b => marcar(b, b === btn));
  ajustarEscala();
  setTimeout(abrirMenuDeSeleccion, 250);
}));

// Deshacer / rehacer
$('#btn-undo').onclick = () => editor.UndoManager.undo();
$('#btn-redo').onclick = () => editor.UndoManager.redo();

// Bordes
$('#btn-borders').onclick = (e) => {
  const btn = e.currentTarget;
  if (editor.Commands.isActive('sw-visibility')) editor.stopCommand('sw-visibility');
  else editor.runCommand('sw-visibility');
  marcar(btn, editor.Commands.isActive('sw-visibility'));
};

// Vista previa
function vistaPrevia(on) {
  document.body.classList.toggle('is-preview', on);
  marcar($('#btn-preview'), on);
  if (estiloEditor) estiloEditor.disabled = on;
  if (estiloPrevia) estiloPrevia.disabled = !on;
  try {
    if (on) {
      editor.stopCommand('sw-visibility');
      editor.getModel().stopDefault();
    } else {
      editor.getModel().runDefault();
      if ($('#btn-borders').classList.contains('active')) editor.runCommand('sw-visibility');
    }
  } catch (err) { /* sin efecto */ }
  const doc = editor.Canvas.getDocument();
  if (on) doc && doc.querySelectorAll('.ed-abierto').forEach(el => el.classList.remove('ed-abierto'));
  else {
    cerrarAbiertos(doc);
    if (doc) doc.querySelectorAll('.lb').forEach(el => el.remove());   // foto ampliada en la vista previa
    setTimeout(abrirMenuDeSeleccion, 400);
  }
  // El lienzo cambia de ancho (con o sin paneles): se recalcula la escala
  setTimeout(() => { ajustarEscala(); editor.refresh(); }, 60);
}
$('#btn-preview').onclick = () => vistaPrevia(!document.body.classList.contains('is-preview'));
$('#preview-exit').onclick = () => vistaPrevia(false);

// Código
$('#btn-code').onclick = abrirCodigo;

// Importar HTML
/* El HTML pegado puede venir de cualquier sitio: antes de entrar al lienzo se
   quitan scripts, manejadores on…, enlaces javascript:, <base>, <meta refresh>
   y objetos incrustados. Lo quitado se informa. */
const LIMITE_IMPORTAR = 2 * 1024 * 1024;
function sanearHTML(html) {
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  const quitados = {};
  const anota = (k) => { quitados[k] = (quitados[k] || 0) + 1; };
  doc.querySelectorAll('script, object, embed, applet, base, meta[http-equiv], frame, frameset, portal').forEach(el => { anota('<' + el.tagName.toLowerCase() + '>'); el.remove(); });
  doc.querySelectorAll('link').forEach(el => { if ((el.getAttribute('rel') || '').toLowerCase() !== 'stylesheet') { anota('<link>'); el.remove(); } });
  doc.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(a => {
      const n = a.name.toLowerCase(), v = a.value.replace(/[\u0000-\u0020]/g, '').toLowerCase();
      if (n.startsWith('on')) { anota('atributos on…'); el.removeAttribute(a.name); }
      else if (['href', 'src', 'action', 'formaction', 'xlink:href', 'srcdoc', 'data'].includes(n) && (v.startsWith('javascript:') || v.startsWith('vbscript:') || (v.startsWith('data:') && !v.startsWith('data:image/') && !v.startsWith('data:video/') && !v.startsWith('data:audio/')) || n === 'srcdoc')) {
        anota('enlaces peligrosos'); el.removeAttribute(a.name);
      }
    });
  });
  const estilos = [...doc.head.querySelectorAll('style')].map(x => x.outerHTML).join('');
  return { html: estilos + doc.body.innerHTML, quitados };
}
$('#btn-import').onclick = () => {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <p class="imp-hint">Pega el HTML (puede incluir <code>&lt;style&gt;</code>). Reemplaza el contenido de la página actual. Por seguridad se quitan los scripts y los atributos <code>on…</code>.</p>
    <textarea class="imp-ta" placeholder="&lt;div class=&quot;container&quot;&gt;…&lt;/div&gt;"></textarea>
    <div style="text-align:right;margin-top:10px"><button class="tb-btn primary">Importar</button></div>`;
  wrap.querySelector('button').onclick = () => {
    const v = wrap.querySelector('textarea').value.trim();
    if (!v) return;
    if (v.length > LIMITE_IMPORTAR) { alert('El HTML es demasiado grande (más de 2 MB).'); return; }
    const { html, quitados } = sanearHTML(v);
    editor.setComponents(html);
    editor.Modal.close();
    const hechos = aplicarSemantica(editor.getWrapper());
    const q = Object.entries(quitados).map(([k, n]) => `${n} ${k}`).join(', ');
    toast('HTML importado' + (q ? '. Se quitó por seguridad: ' + q + '.' : '') + (hechos.length ? ' Semántica: ' + hechos.join(', ') + '.' : ''), 5000);
  };
  editor.Modal.open({ title: 'Importar HTML', content: wrap });
};

/* ---------- Guardar / abrir proyecto (.json) ---------- */
function guardarJSON() {
  // La identidad visual viaja dentro del .json: así el estudiante la conserva
  // al cambiar de computadora en el laboratorio.
  if (typeof propagarPendientes === 'function') propagarPendientes();
  const proyecto = editor.getProjectData();
  proyecto.__tema = TEMA;
  proyecto.__publicacion = { ...PUB };
  proyecto.__formato = FORMATO_PROYECTO;
  descargar(new Blob([JSON.stringify(proyecto)], { type: 'application/json' }), 'proyecto-bootstrap.json');
  toast('Copia descargada: proyecto-bootstrap.json');
}
$('#btn-save').onclick = guardarJSON;

const inputAbrir = document.createElement('input');
inputAbrir.type = 'file';
inputAbrir.accept = '.json,application/json';
inputAbrir.style.display = 'none';
/* Abre un proyecto (.json de esta versión o de las anteriores) después de
   comprobar que de verdad es un proyecto del editor. */
const LIMITE_PROYECTO = 80 * 1024 * 1024;
function validarProyecto(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return 'no es un objeto JSON';
  if (!Array.isArray(p.pages) || !p.pages.length) return 'no tiene páginas';
  if (p.pages.length > 200) return 'tiene demasiadas páginas';
  for (const pg of p.pages) {
    if (!pg || typeof pg !== 'object') return 'una página no es válida';
    const tieneContenido = Array.isArray(pg.frames) || pg.component !== undefined;
    if (!tieneContenido) return 'una página no tiene contenido';
  }
  if (p.styles !== undefined && !Array.isArray(p.styles) && typeof p.styles !== 'string') return 'los estilos no son válidos';
  if (p.assets !== undefined && !Array.isArray(p.assets)) return 'la lista de recursos no es válida';
  if (p.__formato !== undefined && (typeof p.__formato !== 'number' || p.__formato > FORMATO_PROYECTO)) return 'es de una versión más nueva del editor';
  return '';
}
function cargarProyecto(proyecto, aviso = 'Proyecto abierto') {
  const error = validarProyecto(proyecto);
  if (error) { alert('El archivo no es un proyecto válido: ' + error + '.'); return false; }
  if (proyecto.__tema && typeof proyecto.__tema === 'object') {
    TEMA = { ...TEMA_DEF };
    Object.keys(TEMA_DEF).forEach(k => { if (typeof proyecto.__tema[k] === typeof TEMA_DEF[k]) TEMA[k] = proyecto.__tema[k]; });
    try { localStorage.setItem(TEMA_CLAVE, JSON.stringify(TEMA)); } catch (err2) { /* sin almacenamiento */ }
  }
  leerPublicacion(proyecto);
  const anterior = !proyecto.__formato;
  delete proyecto.__tema; delete proyecto.__publicacion; delete proyecto.__formato;
  editor.loadProjectData(proyecto);
  renderPages();
  pintarTemaUI();
  pintarTema();
  editor.store();
  editor.trigger('proyecto:abierto', { anterior });
  toast(aviso + (anterior ? ' (formato anterior: se conserva tal cual; revisa Páginas → Menú y pie vinculados)' : ''), anterior ? 5000 : 2200);
  return true;
}
inputAbrir.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  inputAbrir.value = '';
  if (file.size > LIMITE_PROYECTO) { alert('El archivo es demasiado grande para ser un proyecto (más de 80 MB).'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    let proyecto;
    try { proyecto = JSON.parse(reader.result); } catch (err) { alert('El archivo no es un proyecto válido: no es JSON.'); return; }
    try { cargarProyecto(proyecto); } catch (err) { console.error(err); alert('No se pudo abrir el proyecto: ' + (err.message || err)); }
  };
  reader.readAsText(file);
});
document.body.appendChild(inputAbrir);
$('#btn-open').onclick = () => inputAbrir.click();

/* =====================================================================
   Empezar de nuevo
   Todo lo que el editor recuerda vive en cinco sitios: el proyecto en
   IndexedDB (y una copia antigua en localStorage), la identidad visual,
   el ajuste de exportación y los colores recientes del selector.
   Un reinicio de verdad tiene que vaciarlos todos.
===================================================================== */
const CLAVES_AJUSTES = [TEMA_CLAVE, 'bs5-editor-bs-local', 'bs5-editor-assets-ext', 'bs5-editor-colores', SEM_CLAVE, 'bs5-editor-servidor', 'bs5-editor-clave'];

async function reiniciar(conAjustes) {
  reiniciando = true;              // corta el autoguardado antes de recargar
  try { await conDB('readwrite', s => s.delete(STORAGE_KEY)); } catch (e) { /* sigue */ }
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* sigue */ }
  if (conAjustes) {
    CLAVES_AJUSTES.forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* sigue */ } });
  }
  location.reload();
}

$('#btn-new').onclick = () => {
  const w = document.createElement('div');
  w.innerHTML = `
    <p class="imp-hint">Esto no se puede deshacer. Si quieres conservar lo que tienes, guarda primero una copia.</p>
    <div style="margin-bottom:14px"><button class="tb-btn" id="rs-copia"><i class="bi bi-save"></i> Guardar copia (.json)</button></div>
    <div class="plantilla" data-modo="todo"><i class="bi bi-trash3"></i><div><b>Empezar de cero</b><span>Borra las páginas, el contenido y también la identidad visual, los ajustes de exportación y los colores recientes. El editor queda como recién abierto.</span></div></div>
    <div class="plantilla" data-modo="paginas"><i class="bi bi-files"></i><div><b>Borrar las páginas, conservar la identidad</b><span>Vacía todo el contenido pero mantiene la paleta, las tipografías y el redondeo que elegiste en la pestaña «Sitio».</span></div></div>
    <div class="plantilla" data-modo="actual"><i class="bi bi-eraser"></i><div><b>Vaciar solo esta página</b><span>Deja en blanco la página abierta. Las demás páginas y la identidad visual no se tocan.</span></div></div>`;

  w.querySelector('#rs-copia').onclick = guardarJSON;

  w.querySelectorAll('.plantilla').forEach(el => {
    el.onclick = async () => {
      const modo = el.dataset.modo;
      if (modo === 'actual') {
        if (!confirm('¿Vaciar el contenido de esta página?')) return;
        editor.setComponents('');
        editor.store();
        editor.Modal.close();
        toast('Página vaciada');
        return;
      }
      const aviso = modo === 'todo'
        ? '¿Borrar TODO, incluida la identidad visual?\nEl editor quedará como recién abierto.'
        : '¿Borrar todas las páginas?\nSe conservará la identidad visual.';
      if (!confirm(aviso)) return;
      editor.Modal.close();
      await reiniciar(modo === 'todo');
    };
  });

  editor.Modal.open({ title: 'Empezar de nuevo', content: w });
};

/* =====================================================================
   Estado del guardado automático
   El proyecto se guarda solo en este navegador después de cada cambio.
===================================================================== */
(() => {
  const el = $('#save-state'), txt = $('#save-state span'), ico = $('#save-state i');
  const pinta = (clase, icono, texto) => { el.className = 'save-state ' + clase; ico.className = 'bi bi-' + icono; txt.textContent = texto; };
  editor.on('storage:start:store', () => pinta('saving', 'arrow-repeat', 'Guardando…'));
  editor.on('storage:end:store', () => pinta('', 'cloud-check', 'Guardado'));
  editor.on('storage:error:store', (e) => {
    console.error(e);
    pinta('error', 'exclamation-triangle', 'No se pudo guardar');
    toast('No se pudo guardar en el navegador. Descarga una copia (.json) para no perder tu trabajo.', 5000);
  });
})();

function guardarAhora() {
  Promise.resolve(editor.store()).then(() => toast('Proyecto guardado en este navegador')).catch(() => {});
}

/* =====================================================================
   Duplicar el componente seleccionado
===================================================================== */
function duplicarSeleccion() {
  const c = editor.getSelected();
  if (!c || (c.is && c.is('wrapper')) || c.get('copyable') === false || !c.parent()) return;
  const copia = c.parent().append(c.clone(), { at: c.index() + 1 });
  editor.select(Array.isArray(copia) ? copia[0] : copia);
  toast('Elemento duplicado');
}

/* =====================================================================
   Ayuda y atajos de teclado
===================================================================== */
const ATAJOS = [
  ['Ctrl + Z / Ctrl + Y', 'Deshacer / rehacer'],
  ['Ctrl + S', 'Guardar ahora (también se guarda solo)'],
  ['Ctrl + Shift + S', 'Descargar copia del proyecto (.json)'],
  ['Ctrl + P', 'Vista previa (Esc para volver)'],
  ['Ctrl + E', 'Exportar el sitio en ZIP'],
  ['Ctrl + D', 'Duplicar el elemento seleccionado'],
  ['Ctrl + B', 'Mostrar / ocultar bordes'],
  ['Supr', 'Borrar el elemento seleccionado'],
  ['Ctrl + C / Ctrl + V', 'Copiar y pegar elementos'],
  ['F1', 'Esta ayuda']
];
function abrirAyuda() {
  const w = document.createElement('div');
  w.innerHTML = `
    <ol class="help-steps">
      <li>Empieza con una <b>plantilla</b> o con las <b>Secciones</b> del panel izquierdo: pulsa <b>+</b> (antes o después de la sección elegida, o al final) o arrástralas al lienzo. Filas, columnas y textos sueltos están en <b>Bloques</b>.</li>
      <li>Vincula el menú, el pie o una tarjeta para editarlos <b>una sola vez</b> en todas las páginas. En cada copia puedes cambiar textos, enlaces e imágenes y volver a heredarlos.</li>
      <li>Para adaptar a móvil, elige el ancho (o arrastra el borde del lienzo) y usa <b>Ajustes adaptables</b> en Estilo: cada valor dice si es propio de ese tamaño o heredado.</li>
      <li>En <b>Interacciones</b> decides qué pasa al hacer clic, al recibir el foco o al aparecer en pantalla. <b>Probar otra variante</b> propone otra versión de la sección elegida.</li>
      <li><b>Revisar y publicar</b> busca enlaces rotos, imágenes sin texto alternativo, campos sin etiqueta y desbordes, y publica versiones que puedes restaurar.</li>
      <li><b>Doble clic</b> sobre un texto para escribir. Doble clic sobre una imagen para cambiarla.</li>
      <li>Con un elemento seleccionado, el panel derecho tiene <b>Estilo</b> (colores, tamaños, márgenes) y <b>Propiedades</b>.</li>
      <li>Para enlazar: selecciona un enlace o botón y en <b>Propiedades → Ir a</b> elige otra página o una sección. Para una web externa, escríbela en «Dirección (URL)».</li>
      <li>En <b>Páginas</b> creas, renombras (los enlaces se actualizan solos) o duplicas páginas, y copias el menú y el pie a todas.</li>
      <li>En <b>Sitio</b> cambias colores y tipografías de todo el sitio a la vez.</li>
      <li>El sitio se arma con <b>HTML semántico</b> solo: el menú va en &lt;header&gt;, el contenido en &lt;main&gt; y el pie en &lt;footer&gt;, y los títulos no saltan niveles. El botón <b>Semántica</b> muestra el esquema de la página y lo que falta (por ejemplo, textos alternativos de imágenes).</li>
      <li>Un título se puede cambiar de nivel (H1–H6) en <b>Propiedades → Nivel del título</b> sin que cambie su tamaño.</li>
      <li>Prueba los enlaces en <b>Vista previa</b> y cuando termines pulsa <b>Exportar sitio (ZIP)</b>.</li>
    </ol>
    <div class="kbd-list">${ATAJOS.map(([k, d]) => `<span>${k.split(' / ').map(x => `<kbd>${x}</kbd>`).join(' / ')}</span><span>${d}</span>`).join('')}</div>
    <p class="hint">Tu trabajo se guarda automáticamente en este navegador. Si cambias de computadora, usa <i class="bi bi-save"></i> para descargar una copia y <i class="bi bi-folder2-open"></i> para abrirla.</p>`;
  editor.Modal.open({ title: 'Ayuda rápida', content: w });
}
$('#btn-help').onclick = abrirAyuda;

// Atajos: se escuchan en la ventana del editor y en la del lienzo (iframe).
// Dentro de un campo de texto solo se atienden los que no estorban al escribir.
function atajo(ev) {
  const k = (ev.key || '').toLowerCase();
  const ctrl = ev.ctrlKey || ev.metaKey;
  const t = ev.target;
  const escribiendo = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName || ''));
  const hecho = () => { ev.preventDefault(); ev.stopPropagation(); };

  if (k === 'escape' && document.body.classList.contains('is-preview')) { hecho(); vistaPrevia(false); return; }
  if (k === 'f1') { hecho(); abrirAyuda(); return; }
  if (!ctrl) return;
  if (k === 's') { hecho(); ev.shiftKey ? guardarJSON() : guardarAhora(); return; }
  if (k === 'p') { hecho(); vistaPrevia(!document.body.classList.contains('is-preview')); return; }
  if (k === 'e') { hecho(); exportarZip(); return; }
  if (escribiendo) return;
  if (k === 'd') { hecho(); duplicarSeleccion(); return; }
  if (k === 'b') { hecho(); $('#btn-borders').click(); }
}
document.addEventListener('keydown', atajo, true);
editor.on('canvas:frame:load', (arg) => {
  const win = arg && arg.window;
  if (win && !win.__atajos) { win.__atajos = true; win.document.addEventListener('keydown', atajo, true); }
});

/* =====================================================================
   Eventos del editor
===================================================================== */
// Imágenes, videos y enlaces se configuran sobre todo en «Propiedades»;
// el resto, en «Estilo». Así el panel muestra lo útil para cada cosa.
editor.on('component:selected', (c) => {
  if (!c || !c.is) return;
  // Quien está configurando interacciones sigue en esa pestaña al elegir otro elemento
  if ($('.tabs[data-group=right] button.active')?.dataset.tab === 'interacciones') return;
  const props = c.is('image') || c.is('video') || c.is('video-fondo') || c.is('link') || c.is('map') || ES_ENLAZABLE(c);
  showTab('right', props ? 'traits' : 'style');
});

editor.on('load', () => {
  const pages = editor.Pages.getAll();
  if (pages.length && !pages[0].get('name')) pages[0].set('name', 'index');
  editor.runCommand('sw-visibility');
  marcar($('#btn-borders'), true);
  const doc = editor.Canvas.getDocument();
  inyectarEstiloCanvas(doc);
  activarAnclasCanvas(doc);
  bloquearHamburguesa(doc);
  if (doc && doc.defaultView && !doc.defaultView.__atajos) { doc.defaultView.__atajos = true; doc.addEventListener('keydown', atajo, true); }
  actualizarAncho();
  renderPages();
  // Primera vez (o proyecto vacío): una bienvenida con las plantillas
  if (proyectoVacio()) setTimeout(() => abrirPlantillas(true), 300);
});
