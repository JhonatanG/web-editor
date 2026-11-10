/* =====================================================================
   Exportar sitio completo (todas las páginas) en ZIP
===================================================================== */
const EXT_MIME = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp',
  'image/svg+xml': 'svg', 'image/avif': 'avif', 'image/bmp': 'bmp', 'image/x-icon': 'ico',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogv', 'video/quicktime': 'mov',
  'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'application/pdf': 'pdf'
};
const extDeMime = (m) => EXT_MIME[m.toLowerCase()] || ((m.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'bin');
const tipoDeMime = (m) => m.startsWith('image/') ? 'imagen' : m.startsWith('video/') ? 'video' : m.startsWith('audio/') ? 'audio' : 'archivo';

const RE_TAG_MEDIA = /<(?:img|video|source|audio)\b[^>]*>/gi;
const RE_ATTR_URL  = /\b(?:src|poster)\s*=\s*["'](https?:\/\/[^"']+)["']/gi;
// url(…) del CSS y de los estilos en línea (allí las comillas llegan como &quot;)
const RE_CSS_URL   = /url\(\s*(?:["']|&quot;)?(https?:\/\/[^"'()\s]+?)(?:["']|&quot;)?\s*\)/gi;
// Archivos incrustados: los subidos (base64) y las imágenes SVG de ejemplo (texto)
const RE_DATA_B64  = /data:([a-z]+\/[a-z0-9.+-]+)?(?:;[a-z0-9-]+=[^;,"'\s]*)*;base64,([A-Za-z0-9+\/=]+)/gi;
const RE_DATA_SVG  = /data:image\/svg\+xml(?:;charset=[a-z0-9-]+)?,([^"'()\s&]+)/gi;

function urlsExternas(html, css) {
  const set = new Set();
  (html.match(RE_TAG_MEDIA) || []).forEach(tag => { for (const m of tag.matchAll(RE_ATTR_URL)) set.add(m[1]); });
  for (const m of (css || '').matchAll(RE_CSS_URL)) set.add(m[1]);
  return [...set];
}

// Nombre original de cada archivo subido: la galería guarda el de las imágenes
// y los videos lo llevan en data-archivo (que no se exporta).
function nombresConocidos(html) {
  const m = new Map();
  editor.Assets.getAll().forEach((a) => {
    const src = a.getSrc ? a.getSrc() : a.get('src');
    if (a.get('name') && String(src).startsWith('data:')) m.set(src, a.get('name'));
  });
  (html.match(/<[^>]*\bdata-archivo="[^"]*"[^>]*>/gi) || []).forEach((tag) => {
    const d = tag.match(/\ssrc="(data:[^"]+)"/i);
    if (d) m.set(d[1], tag.match(/data-archivo="([^"]*)"/i)[1]);
  });
  return m;
}

// Nombres cortos: Windows no abre rutas de más de 260 caracteres y el sitio suele
// descomprimirse en carpetas ya largas (OneDrive…). Se quita el «1280px-» de las
// miniaturas de Wikimedia y se recorta a 40 caracteres.
const limpioArchivo = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/^\d+px-/, '').replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40).replace(/-+$/, '');
// «foto.jpg» de https://sitio.com/img/foto.jpg?w=800 (vacío si la URL no trae nombre)
const nombreDeUrl = (url) => {
  try {
    const n = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    return /\.[a-z0-9]{2,5}$/i.test(n) ? n : '';
  } catch (e) { return ''; }
};

function crearContexto(zip) {
  const cont = {}, usados = new Set();
  return {
    zip, conocidos: new Map(), datos: new Map(), ext: new Map(), fallidos: [],
    // Conserva el nombre original (sin tildes ni espacios) y nunca repite uno
    nombre(mime, original) {
      const m = String(original || '').match(/^(.*?)(?:\.([a-z0-9]{1,5}))?$/i);
      let base = limpioArchivo(m[1]);
      const ext = (m[2] || extDeMime(mime)).toLowerCase();
      if (!base) { const t = tipoDeMime(mime); cont[t] = (cont[t] || 0) + 1; base = `${t}-${cont[t]}`; }
      let n = `${base}.${ext}`, k = 2;
      while (usados.has(n)) n = `${base}-${k++}.${ext}`;
      usados.add(n);
      return n;
    }
  };
}

async function traerExterno(url, ctx) {
  if (ctx.ext.has(url)) return ctx.ext.get(url);
  let nombre = null;
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 30000);
    const r = await fetch(url.replace(/&amp;/g, '&'), { signal: ac.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const blob = await r.blob();
    const mime = (blob.type || '').split(';')[0];
    if (/^(image|video|audio)\//.test(mime)) {
      nombre = ctx.nombre(mime, nombreDeUrl(url));
      ctx.zip.file('assets/' + nombre, blob);
    }
  } catch (e) {
    ctx.fallidos.push(url);
  }
  ctx.ext.set(url, nombre);
  return nombre;
}

// Saca a la carpeta assets los archivos incrustados (data:) y, si se pide, los enlazados por URL.
async function procesarTexto(texto, prefijo, ctx, conExternos) {
  const guardar = (clave, mime, contenido, opciones) => {
    let nombre = ctx.datos.get(clave);
    if (!nombre) {
      nombre = ctx.nombre(mime, ctx.conocidos.get(clave));
      ctx.datos.set(clave, nombre);
      ctx.zip.file('assets/' + nombre, contenido, opciones);
    }
    return prefijo + 'assets/' + nombre;
  };
  texto = texto.replace(RE_DATA_B64, (m, mime, b64) => guardar(m, mime || 'application/octet-stream', b64, { base64: true }));
  texto = texto.replace(RE_DATA_SVG, (m, cuerpo) => {
    let svg;
    try { svg = decodeURIComponent(cuerpo); } catch (e) { return m; }
    return guardar(m, 'image/svg+xml', svg);
  });
  if (conExternos) {
    for (const url of urlsExternas(texto, texto)) {
      const nombre = await traerExterno(url, ctx);
      if (nombre) texto = texto.split(url).join(prefijo + 'assets/' + nombre);
    }
  }
  return texto;
}

/* Empaqueta Bootstrap y los iconos dentro del ZIP, para que el sitio
   exportado no dependa de un CDN. */
const BS_VER = '5.3.3', BI_VER = '1.11.3';
const CDN_BS = {
  css: `https://cdn.jsdelivr.net/npm/bootstrap@${BS_VER}/dist/css/bootstrap.min.css`,
  js:  `https://cdn.jsdelivr.net/npm/bootstrap@${BS_VER}/dist/js/bootstrap.bundle.min.js`,
  ico: `https://cdn.jsdelivr.net/npm/bootstrap-icons@${BI_VER}/font/bootstrap-icons.min.css`,
  w2:  `https://cdn.jsdelivr.net/npm/bootstrap-icons@${BI_VER}/font/fonts/bootstrap-icons.woff2`,
  w1:  `https://cdn.jsdelivr.net/npm/bootstrap-icons@${BI_VER}/font/fonts/bootstrap-icons.woff`
};

async function empaquetarBootstrap(zip) {
  const pedir = async (url, como) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status + ' al descargar ' + url);
    return como === 'blob' ? r.blob() : r.text();
  };
  const [css, js, ico] = await Promise.all([
    pedir(CDN_BS.css), pedir(CDN_BS.js), pedir(CDN_BS.ico)
  ]);
  zip.file('css/bootstrap.min.css', css);
  zip.file('js/bootstrap.bundle.min.js', js);
  // Los iconos piden sus tipografías con rutas relativas y un hash de versión:
  // se dejan en css/fonts/ y se les quita la cadena de consulta.
  zip.file('css/bootstrap-icons.min.css',
    ico.replace(/\.\/fonts\//g, 'fonts/')
       .replace(/(fonts\/bootstrap-icons\.woff2?)\?[^"')]*/g, '$1'));
  const [w2, w1] = await Promise.all([
    pedir(CDN_BS.w2, 'blob'), pedir(CDN_BS.w1, 'blob')
  ]);
  zip.file('css/fonts/bootstrap-icons.woff2', w2);
  zip.file('css/fonts/bootstrap-icons.woff', w1);
}

// El ZIP sale del mismo generador que la vista previa y la publicación (js/generador.js)
const opcionesExportacion = () => ({
  bsLocal: !!($('#t-bs-local') && $('#t-bs-local').checked),
  // Lo subido desde el computador siempre va a assets; lo de internet, si está activado en «Sitio»
  conExternos: !!($('#t-assets-ext') && $('#t-assets-ext').checked)
});
async function exportarZip() {
  if (typeof JSZip === 'undefined') { alert('No se pudo cargar JSZip (revisa tu conexión).'); return; }
  const btn = $('#btn-export');
  const textoBtn = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Exportando…';
  try {
    const o = opcionesExportacion();
    let sitio;
    try {
      sitio = await generarSitio({ modo: 'zip', ...o });
    } catch (e) {
      if (o.bsLocal && /bootstrap/i.test(String(e && e.message))) {
        console.error(e);
        alert('No se pudieron descargar los archivos de Bootstrap para incluirlos en el ZIP.\n' +
              'Revisa tu conexión o desactiva la casilla en la pestaña «Sitio».\n\n' + (e.message || e));
        return;
      }
      throw e;
    }
    const zip = new JSZip();
    sitio.archivos.forEach((a, ruta) => {
      if (a.base64 !== undefined) zip.file(ruta, a.base64, { base64: true });
      else zip.file(ruta, a.blob !== undefined ? a.blob : a.texto);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    descargar(blob, 'sitio-bootstrap.zip');
    const nAssets = [...sitio.archivos.keys()].filter(f => f.startsWith('assets/')).length;
    toast(nAssets ? `Sitio exportado con ${nAssets} archivo(s) en assets` : 'Sitio exportado');
    if (sitio.fallidos.length) {
      alert('No se pudieron descargar ' + sitio.fallidos.length + ' archivo(s) enlazados (el servidor no permite descargarlos desde el navegador). Se dejaron como enlaces:\n\n' +
        sitio.fallidos.slice(0, 8).join('\n') + (sitio.fallidos.length > 8 ? '\n…' : ''));
    }
  } catch (err) {
    console.error(err);
    alert('No se pudo exportar el sitio: ' + (err && err.message ? err.message : err));
  } finally {
    btn.disabled = false;
    btn.innerHTML = textoBtn;
  }
}
$('#btn-export').onclick = exportarZip;
