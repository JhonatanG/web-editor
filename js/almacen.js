/* =====================================================================
   Almacenamiento del proyecto en IndexedDB
   (localStorage se llena con 5 MB; con imágenes o videos no alcanza)
===================================================================== */
let reiniciando = false;   // true mientras se borra todo para empezar de nuevo
const DB_NOMBRE = 'bs5-editor';
const conDB = (modo, fn) => new Promise((ok, err) => {
  const r = indexedDB.open(DB_NOMBRE, 1);
  r.onupgradeneeded = () => r.result.createObjectStore('proyecto');
  r.onerror = () => err(r.error);
  r.onsuccess = () => {
    const db = r.result;
    const t = db.transaction('proyecto', modo);
    const q = fn(t.objectStore('proyecto'));
    t.oncomplete = () => { db.close(); ok(q && q.result); };
    t.onerror = t.onabort = () => { db.close(); err(t.error); };
  };
});
const almacenIDB = (ed) => {
  ed.Storage.add('idb', {
    async load() {
      try { const d = await conDB('readonly', s => s.get(STORAGE_KEY)); if (d) return d; } catch (e) { /* sigue */ }
      try { const old = localStorage.getItem(STORAGE_KEY); if (old) return JSON.parse(old); } catch (e) { /* sigue */ }
      return {};
    },
    async store(data) {
      // Durante un reinicio no se vuelve a escribir: si no, el autoguardado
      // podría regrabar el proyecto justo después de borrarlo.
      if (reiniciando) return;
      await conDB('readwrite', s => s.put(data, STORAGE_KEY));
    }
  });
};

/* ---------- Datos del proyecto que no son de GrapesJS ----------
   Viajan dentro del proyecto (IndexedDB y .json):
     __formato      versión del formato (los .json anteriores no la tienen: 1)
     __publicacion  sitio, destino de los formularios… (nunca claves)        */
const FORMATO_PROYECTO = 2;
const PUB_DEF = { slug: '', nombre: '', formDestino: 'servicio', formUrl: '', formCorreo: '' };
let PUB = { ...PUB_DEF };
function leerPublicacion(d) {
  const p = (d && typeof d.__publicacion === 'object' && d.__publicacion) || {};
  PUB = { ...PUB_DEF };
  Object.keys(PUB_DEF).forEach(k => { if (typeof p[k] === 'string') PUB[k] = p[k].slice(0, 300); });
  if (!['servicio', 'url', 'correo'].includes(PUB.formDestino)) PUB.formDestino = 'servicio';
  leerPrecarga(d);
}

/* Pantalla de carga del sitio (logo mientras carga y efecto de salida) */
const PRE_DEF = { activo: false, fuente: 'menu', logo: '', texto: '', fondo: 'claro', color: '#ffffff', anim: 'pulso', salida: 'desvanecer', minimo: 600, unaVez: true };
const PRE_OPCIONES = {
  fuente: ['menu', 'imagen', 'texto'],
  fondo: ['claro', 'osc', 'primario', 'personal'],
  anim: ['pulso', 'giro', 'barra', 'puntos', 'ninguna'],
  salida: ['desvanecer', 'subir', 'cortina', 'zoom', 'ninguna']
};
let PRE = { ...PRE_DEF };
function leerPrecarga(d) {
  const p = (d && typeof d.__precarga === 'object' && d.__precarga) || {};
  PRE = { ...PRE_DEF };
  Object.keys(PRE_DEF).forEach(k => { if (typeof p[k] === typeof PRE_DEF[k]) PRE[k] = p[k]; });
  Object.keys(PRE_OPCIONES).forEach(k => { if (!PRE_OPCIONES[k].includes(PRE[k])) PRE[k] = PRE_DEF[k]; });
  if (!/^#[0-9a-f]{6}$/i.test(PRE.color)) PRE.color = PRE_DEF.color;
  if (!/^(data:image\/|https?:\/\/)/i.test(PRE.logo)) PRE.logo = '';
  PRE.texto = PRE.texto.slice(0, 80);
  PRE.minimo = Math.max(0, Math.min(3000, Math.round(PRE.minimo) || 0));
}
const alGuardarProyecto = (d) => ({ ...d, __formato: FORMATO_PROYECTO, __publicacion: { ...PUB }, __precarga: { ...PRE } });
const alCargarProyecto = (d) => {
  leerPublicacion(d);
  if (d) { delete d.__publicacion; delete d.__precarga; delete d.__formato; }
  return d;
};
