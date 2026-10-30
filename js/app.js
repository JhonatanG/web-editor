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
$('#btn-import').onclick = () => {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <p class="imp-hint">Pega el HTML (puede incluir <code>&lt;style&gt;</code>). Reemplaza el contenido de la página actual.</p>
    <textarea class="imp-ta" placeholder="&lt;div class=&quot;container&quot;&gt;…&lt;/div&gt;"></textarea>
    <div style="text-align:right;margin-top:10px"><button class="tb-btn primary">Importar</button></div>`;
  wrap.querySelector('button').onclick = () => {
    const v = wrap.querySelector('textarea').value.trim();
    if (!v) return;
    editor.setComponents(v);
    editor.Modal.close();
    const hechos = aplicarSemantica(editor.getWrapper());
    toast('HTML importado' + (hechos.length ? '. Semántica: ' + hechos.join(', ') + '.' : ''), 4000);
  };
  editor.Modal.open({ title: 'Importar HTML', content: wrap });
};

/* ---------- Guardar / abrir proyecto (.json) ---------- */
function guardarJSON() {
  // La identidad visual viaja dentro del .json: así el estudiante la conserva
  // al cambiar de computadora en el laboratorio.
  const proyecto = editor.getProjectData();
  proyecto.__tema = TEMA;
  descargar(new Blob([JSON.stringify(proyecto)], { type: 'application/json' }), 'proyecto-bootstrap.json');
  toast('Copia descargada: proyecto-bootstrap.json');
}
$('#btn-save').onclick = guardarJSON;

const inputAbrir = document.createElement('input');
inputAbrir.type = 'file';
inputAbrir.accept = '.json,application/json';
inputAbrir.style.display = 'none';
inputAbrir.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const proyecto = JSON.parse(reader.result);
      if (proyecto && proyecto.__tema) {
        TEMA = { ...TEMA_DEF, ...proyecto.__tema };
        delete proyecto.__tema;
        try { localStorage.setItem(TEMA_CLAVE, JSON.stringify(TEMA)); } catch (err2) { /* sin almacenamiento */ }
      }
      editor.loadProjectData(proyecto);
      renderPages();
      pintarTemaUI();
      pintarTema();
      editor.store();
      toast('Proyecto abierto');
    } catch (err) {
      alert('El archivo no es un proyecto válido.');
    }
  };
  reader.readAsText(file);
  inputAbrir.value = '';
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
const CLAVES_AJUSTES = [TEMA_CLAVE, 'bs5-editor-bs-local', 'bs5-editor-assets-ext', 'bs5-editor-colores', SEM_CLAVE];

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
      <li>Empieza con una <b>plantilla</b> o arrastra <b>componentes</b> desde el panel izquierdo al lienzo.</li>
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
