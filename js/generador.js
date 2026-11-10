/* =====================================================================
   Generador del sitio
   UNA sola forma de convertir el proyecto en HTML, CSS, JavaScript y
   recursos. La usan los tres destinos:
     previa    documentos autocontenidos para el iframe aislado del editor
               (CSS y JS en línea, imágenes subidas como data:)
     zip       archivos para descargar (recursos en assets/)
     publicar  los mismos archivos del ZIP, que el servidor verifica y activa
   Lo único que cambia entre destinos es cómo se empaquetan los archivos y a
   dónde envían los formularios.
===================================================================== */
const RUNTIME_FORMULARIOS = '(' + runtimeFormularios.toString() + ')(window);\n';
const RUNTIME_PREVIA = '(' + runtimePrevia.toString() + ')(window);';
// Fases posteriores (interacciones…) añaden aquí sus scripts: { archivo, codigo, usa(html) }
const RUNTIMES_EXTRA = [];

/* ---------- Ajustes de publicación (viajan con el proyecto) ---------- */
const servidorPublicacion = () => {
  try { const s = localStorage.getItem('bs5-editor-servidor'); if (s) return s.replace(/\/+$/, ''); } catch (e) { /* sin almacenamiento */ }
  return /^https?:$/.test(location.protocol) ? location.origin : '';
};
function endpointFormulario(modo) {
  if (modo === 'previa') return '';
  if (PUB.formDestino === 'url') return PUB.formUrl || '';
  if (PUB.formDestino === 'correo') return PUB.formCorreo ? 'mailto:' + PUB.formCorreo : '';
  if (!PUB.slug) return '';
  if (modo === 'publicar') return '/api/formularios/' + PUB.slug;
  const srv = servidorPublicacion();
  return srv ? srv + '/api/formularios/' + PUB.slug : '';
}

/* ---------- Páginas ---------- */
const ATTR_EDITOR = ['data-vk', 'data-vinculo', 'data-archivo-editor'];
function prepararCuerpo(html, modo, avisos, archivo) {
  const doc = new DOMParser().parseFromString(/<body[\s>]/i.test(html) ? html : `<body>${html}</body>`, 'text/html');
  ATTR_EDITOR.forEach(a => doc.querySelectorAll(`[${a}]`).forEach(e => e.removeAttribute(a)));
  let usaForm = false;
  doc.querySelectorAll('form[data-formulario]').forEach(f => {
    usaForm = true;
    const propio = (f.getAttribute('data-destino-url') || '').trim();
    const ep = propio || endpointFormulario(modo);
    const tipo = modo === 'previa' ? 'previa' : propio ? (propio.startsWith('mailto:') ? 'correo' : 'url') : (PUB.formDestino || 'servicio');
    f.setAttribute('data-destino', tipo);
    f.setAttribute('method', 'post');
    if (ep) { f.setAttribute('data-endpoint', ep); f.setAttribute('action', ep); }
    else {
      f.removeAttribute('data-endpoint');
      if (modo !== 'previa') avisos.push({ tipo: 'formulario', archivo, msg: 'Un formulario no tiene a dónde enviar los mensajes: publica el sitio o elige un destino en Sitio → Formularios.' });
    }
    if (!f.querySelector('input[name="_web"]')) {
      const t = doc.createElement('div');
      t.className = 'campo-trampa';
      t.setAttribute('aria-hidden', 'true');
      t.innerHTML = '<label>Deja este campo vacío <input type="text" name="_web" tabindex="-1" autocomplete="off"></label>';
      f.appendChild(t);
    }
    if (!f.querySelector('.form-estado')) {
      const e = doc.createElement('div');
      e.className = 'form-estado';
      e.setAttribute('role', 'status');
      e.setAttribute('aria-live', 'polite');
      f.appendChild(e);
    }
  });
  const attrs = [...doc.body.attributes].map(a => ` ${a.name}="${SIN_HTML(a.value)}"`).join('');
  return { attrs, inner: doc.body.innerHTML, usaForm };
}

function paginasDelSitio(modo, avisos) {
  if (typeof propagarPendientes === 'function') propagarPendientes();
  const usados = new Set();
  return editor.Pages.getAll().map((page) => {
    const base = archivoDePagina(page).replace(/\.html$/, '');
    let n = base, k = 2;
    while (usados.has(n)) n = base + '-' + (k++);
    usados.add(n);
    const comp = page.getMainComponent();
    const html = editor.getHtml({ component: comp });
    const css = editor.getCss({ component: comp }) || '';
    const js = editor.getJs ? (editor.getJs({ component: comp }) || '') : '';
    const cuerpo = prepararCuerpo(html, modo, avisos, n + '.html');
    return { page, n, archivo: n + '.html', titulo: page.get('seoTitulo') || nombrePagina(page), desc: page.get('seoDesc') || '', ...cuerpo, css, js };
  });
}

const siteCssCompleto = () => SITE_CSS + '\n\n/* Identidad visual elegida en el panel «Sitio» del editor.\n   Cambia estos valores y cambia el sitio entero. */\n' + temaCss() + '\n';
const escScript = (t) => String(t).replace(/<\/script/gi, '<\\/script');

// Documento HTML completo de una página. inline: CSS y JS dentro del HTML (vista previa)
function documentoPagina(p, o) {
  const css = (href, txt) => o.inline ? `<style>${txt}</style>` : `<link href="${href}" rel="stylesheet">`;
  const js = (src, txt) => o.inline ? `<script>${escScript(txt)}<\/script>` : `<script src="${src}"><\/script>`;
  const nombresTema = temaFuentes().map(f => f.nombre);
  const usadas = FUENTES.filter(f => nombresTema.includes(f.nombre) || (p.css + p.inner).includes(f.nombre));
  const idMain = (p.inner.match(/<main\b[^>]*\bid="([^"]+)"/i) || [])[1];
  const saltar = idMain ? `<a class="visually-hidden-focusable position-absolute top-0 start-0 m-2 p-2 bg-white text-dark rounded" style="z-index:2000" href="#${idMain}">Saltar al contenido</a>` : '';
  const extras = RUNTIMES_EXTRA.filter(r => r.usa(p.inner));
  const scripts =
    (o.bsLocal && !o.inline ? '<script src="js/bootstrap.bundle.min.js"><\/script>' : `<script src="${CDN_BS.js}"><\/script>`) +
    js('js/site.js', SITE_JS) +
    (p.usaForm ? js('js/formularios.js', RUNTIME_FORMULARIOS) : '') +
    extras.map(r => js('js/' + r.archivo, r.codigo)).join('') +
    (p.js.trim() ? js(`js/${p.n}.js`, p.js) : '');
  const previa = o.inline ? `<script>window.__hashInicial=${JSON.stringify(o.hash || '')};${RUNTIME_PREVIA}<\/script>` : '';
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${SIN_HTML(p.titulo)}</title>${p.desc ? `
<meta name="description" content="${SIN_HTML(p.desc)}">` : ''}
<link href="${o.bsLocal && !o.inline ? 'css/bootstrap.min.css' : CDN_BS.css}" rel="stylesheet">
<link href="${o.bsLocal && !o.inline ? 'css/bootstrap-icons.min.css' : CDN_BS.ico}" rel="stylesheet">
<link href="${gfUrl(usadas)}" rel="stylesheet">
${css('css/site.css', siteCssCompleto())}
${css(`css/${p.n}.css`, p.css)}
<script>${HEAD_JS}<\/script>${previa}
</head>
<body${p.attrs}>${saltar}${p.inner}${scripts}</body>
</html>`;
}

/* ---------- Qué depende de servicios externos ---------- */
function dependenciasExternas(paginas, o) {
  const todo = paginas.map(p => p.inner + p.css).join('\n');
  const dep = [];
  if (!o.bsLocal) dep.push({ que: 'Bootstrap e iconos', donde: 'cdn.jsdelivr.net', nota: 'Actívalo en Sitio → Exportación para incluirlos en el ZIP.' });
  dep.push({ que: 'Tipografías', donde: 'fonts.googleapis.com', nota: 'Sin conexión se usan las tipografías de respaldo.' });
  if (paginas.some(p => p.usaForm)) {
    const ep = endpointFormulario(o.modo);
    dep.push({ que: 'Formulario de contacto', donde: ep ? ep.replace(/^mailto:/, 'correo: ') : 'sin destino configurado',
      nota: o.modo === 'publicar' ? 'Lo recibe el servidor de publicación.' : PUB.formDestino === 'servicio' ? 'Necesita el servidor de publicación en línea para recibir los mensajes.' : 'Usa el destino elegido en Sitio → Formularios.' });
  }
  if (/class="[^"]*\bfondo-particulas\b/i.test(todo)) dep.push({ que: 'Fondo de partículas', donde: 'cdn.jsdelivr.net (tsParticles)', nota: 'Sin conexión el fondo queda liso; el contenido se ve igual.' });
  if (/youtube(-nocookie)?\.com|player\.vimeo\.com/i.test(todo)) dep.push({ que: 'Videos', donde: 'YouTube / Vimeo', nota: 'Se reproducen desde esos servicios.' });
  if (/maps\.google|google\.com\/maps/i.test(todo)) dep.push({ que: 'Mapa', donde: 'Google Maps', nota: 'Se carga desde Google.' });
  if (/wa\.me\//i.test(todo)) dep.push({ que: 'Botón de WhatsApp', donde: 'wa.me', nota: 'Abre WhatsApp.' });
  if (!o.conExternos && /(src|poster)="https?:|url\((&quot;|["'])?https?:/i.test(todo)) dep.push({ que: 'Imágenes enlazadas', donde: 'otros sitios', nota: 'Activa «Copiar a assets…» en Sitio → Exportación para incluirlas.' });
  return dep;
}

/* ---------- Generar ----------
   Devuelve { paginas, archivos: Map(ruta → {texto}|{base64}|{blob}), avisos, dependencias } */
async function generarSitio(o = {}) {
  o = { modo: 'zip', bsLocal: false, conExternos: false, ...o };
  const avisos = [];
  const paginas = paginasDelSitio(o.modo, avisos);
  const dependencias = dependenciasExternas(paginas, o);
  if (o.modo === 'previa') {
    const documentos = new Map();
    paginas.forEach(p => documentos.set(p.archivo, (hash) => documentoPagina(p, { ...o, inline: true, hash })));
    return { paginas, documentos, avisos, dependencias };
  }
  const archivos = new Map();
  const zipLike = { files: {}, file(ruta, contenido, op) {
    this.files[ruta] = true;
    archivos.set(ruta, op && op.base64 ? { base64: contenido } : contenido instanceof Blob ? { blob: contenido } : { texto: String(contenido) });
  } };
  if (o.bsLocal) await empaquetarBootstrap(zipLike);
  zipLike.file('css/site.css', siteCssCompleto());
  zipLike.file('js/site.js', SITE_JS);
  if (paginas.some(p => p.usaForm)) zipLike.file('js/formularios.js', RUNTIME_FORMULARIOS);
  RUNTIMES_EXTRA.forEach(r => { if (paginas.some(p => r.usa(p.inner))) zipLike.file('js/' + r.archivo, r.codigo); });
  const ctx = crearContexto(zipLike);
  paginas.forEach(p => {
    nombresConocidos(p.inner).forEach((n, src) => ctx.conocidos.set(src, n));
    p.inner = p.inner.replace(/\sdata-archivo="[^"]*"/gi, '');
  });
  for (const p of paginas) {
    p.inner = await procesarTexto(p.inner, '', ctx, o.conExternos);
    p.attrs = await procesarTexto(p.attrs, '', ctx, o.conExternos);
    p.css = await procesarTexto(p.css, '../', ctx, o.conExternos);
    zipLike.file(p.archivo, documentoPagina(p, { ...o, inline: false }));
    zipLike.file(`css/${p.n}.css`, p.css);
    if (p.js.trim()) zipLike.file(`js/${p.n}.js`, p.js);
  }
  zipLike.file('LEEME.txt', leemeDelSitio(paginas, dependencias, o));
  return { paginas, archivos, avisos, dependencias, fallidos: ctx.fallidos };
}

function leemeDelSitio(paginas, dependencias, o) {
  return `Sitio creado con el Editor Bootstrap 5
=========================================

Abre index.html en el navegador o sube TODA la carpeta a cualquier
alojamiento web (no necesita servidor especial).

Páginas:
${paginas.map(p => `  - ${p.archivo}  (${p.titulo})`).join('\n')}

Funciones que dependen de un servicio externo:
${dependencias.map(d => `  - ${d.que}: ${d.donde}. ${d.nota}`).join('\n') || '  (ninguna)'}

Carpetas:
  css/      site.css (identidad visual) y un .css por página
  js/       site.js (menú, animaciones…)${dependencias.some(d => d.que.startsWith('Formulario')) ? ', formularios.js (envío del formulario)' : ''}
  assets/   imágenes, videos y archivos del sitio
`;
}

// Huella del sitio generado: la misma cuenta que hace el servidor al publicar
async function sha256Hex(buf) {
  const h = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function bytesDe(a) {
  if (a.texto !== undefined) return new TextEncoder().encode(a.texto);
  if (a.base64 !== undefined) { const s = atob(a.base64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  return new Uint8Array(await a.blob.arrayBuffer());
}
function aBase64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
