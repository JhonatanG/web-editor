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

const limpioArchivo = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
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

async function exportarZip() {
  if (typeof JSZip === 'undefined') { alert('No se pudo cargar JSZip (revisa tu conexión).'); return; }
  const btn = $('#btn-export');
  const zip = new JSZip();
  const bsLocal = !!($('#t-bs-local') && $('#t-bs-local').checked);
  const usados = new Set();
  const paginas = [];

  editor.Pages.getAll().forEach((page) => {
    // El mismo nombre de archivo que usan los enlaces del menú («Ir a»)
    const base = archivoDePagina(page).replace(/\.html$/, '');
    let n = base, k = 2;
    while (usados.has(n)) n = base + '-' + (k++);
    usados.add(n);

    const comp = page.getMainComponent();
    let html = editor.getHtml({ component: comp });
    const css  = editor.getCss({ component: comp }) || '';
    const js   = editor.getJs ? (editor.getJs({ component: comp }) || '') : '';
    if (!/<body[\s>]/i.test(html)) html = `<body>${html}</body>`;

    const scripts =
      (bsLocal
        ? '<script src="js/bootstrap.bundle.min.js"><\/script>'
        : `<script src="${CDN_BS.js}"><\/script>`) +
      '<script src="js/site.js"><\/script>' +
      (js.trim() ? `<script src="js/${n}.js"><\/script>` : '');
    html = html.replace(/<\/body>\s*$/i, scripts + '</body>');
    // Si hay <main id>, el primer Tab ofrece saltar el menú e ir al contenido
    const idMain = (html.match(/<main\b[^>]*\bid="([^"]+)"/i) || [])[1];
    if (idMain) html = html.replace(/<body\b[^>]*>/i, m => m + `<a class="visually-hidden-focusable position-absolute top-0 start-0 m-2 p-2 bg-white text-dark rounded" style="z-index:2000" href="#${idMain}">Saltar al contenido</a>`);
    paginas.push({ n, titulo: page.get('seoTitulo') || nombrePagina(page), desc: page.get('seoDesc') || '', html, css, js });
  });

  // Lo subido desde el computador siempre va a assets; lo de internet, si está activado en «Sitio»
  const conExternos = !!($('#t-assets-ext') && $('#t-assets-ext').checked);

  zip.file('css/site.css', SITE_CSS + '\n\n/* Identidad visual elegida en el panel «Sitio» del editor.\n   Cambia estos valores y cambia el sitio entero. */\n' + temaCss() + '\n');
  zip.file('js/site.js', SITE_JS);
  const ctx = crearContexto(zip);
  paginas.forEach((p) => {
    nombresConocidos(p.html).forEach((n, src) => ctx.conocidos.set(src, n));
    p.html = p.html.replace(/\sdata-archivo="[^"]*"/gi, '');
  });
  const textoBtn = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Exportando…';
  try {
    if (bsLocal) {
      try {
        await empaquetarBootstrap(zip);
      } catch (e) {
        console.error(e);
        alert('No se pudieron descargar los archivos de Bootstrap para incluirlos en el ZIP.\n' +
              'Revisa tu conexión o desactiva la casilla en la pestaña «Sitio».\n\n' + (e.message || e));
        return;
      }
    }
    for (const p of paginas) {
      const html = await procesarTexto(p.html, '', ctx, conExternos);
      const css  = await procesarTexto(p.css, '../', ctx, conExternos);
      // Las tipografías del tema siempre se piden; las demás, solo si aparecen en la página.
      const nombresTema = temaFuentes().map(f => f.nombre);
      const usadas = FUENTES.filter(f => nombresTema.includes(f.nombre) || (p.css + p.html).includes(f.nombre));
      const doc = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${SIN_HTML(p.titulo)}</title>${p.desc ? `
<meta name="description" content="${SIN_HTML(p.desc)}">` : ''}
<link href="${bsLocal ? 'css/bootstrap.min.css' : CDN_BS.css}" rel="stylesheet">
<link href="${bsLocal ? 'css/bootstrap-icons.min.css' : CDN_BS.ico}" rel="stylesheet">
<link href="${gfUrl(usadas)}" rel="stylesheet">
<link href="css/site.css" rel="stylesheet">
<link href="css/${p.n}.css" rel="stylesheet">
<script>${HEAD_JS}<\/script>
</head>
${html}
</html>`;
      zip.file(`${p.n}.html`, doc);
      zip.file(`css/${p.n}.css`, css);
      if (p.js.trim()) zip.file(`js/${p.n}.js`, p.js);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    descargar(blob, 'sitio-bootstrap.zip');
    const nAssets = Object.keys(zip.files).filter(f => f.startsWith('assets/') && !zip.files[f].dir).length;
    toast(nAssets ? `Sitio exportado con ${nAssets} archivo(s) en assets` : 'Sitio exportado');
    if (ctx.fallidos.length) {
      alert('No se pudieron descargar ' + ctx.fallidos.length + ' archivo(s) enlazados (el servidor no permite descargarlos desde el navegador). Se dejaron como enlaces:\n\n' +
        ctx.fallidos.slice(0, 8).join('\n') + (ctx.fallidos.length > 8 ? '\n…' : ''));
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
