/* =====================================================================
   Revisión antes de publicar
   Revisa TODO el sitio (no solo la página abierta):
     · enlaces internos a páginas que no existen y anclas (#id) rotas,
       también los botones «Ir a» y los controles de menú, acordeón y modal;
     · imágenes sin texto alternativo;
     · campos de formulario sin etiqueta;
     · desbordamiento horizontal a 375, 768 y 1280 px: la página se dibuja
       a cada ancho en un iframe sin scripts y se buscan los elementos que
       se salen por la derecha.
   Cada aviso lleva a su página y a su elemento.
===================================================================== */
const ANCHOS_REVISION = [375, 768, 1280];
// Otras fases añaden comprobaciones: fn(pagina, raiz) → [{ nivel, tipo, comp, msg }]
const REVISIONES_EXTRA = [];

const idsDe = (raiz) => { const s = new Set(); recorrer(raiz, c => { const id = attrs(c).id; if (id) s.add(String(id)); }); return s; };
const NO_NAVEGA = /^(javascript:|mailto:|tel:|sms:|https?:|\/\/|data:|blob:)/i;

function revisarEnlaces(paginas) {
  const porArchivo = new Map(paginas.map(p => [archivoDePagina(p), p]));
  const ids = new Map(paginas.map(p => [p, idsDe(p.getMainComponent())]));
  const out = [];
  paginas.forEach(p => {
    const raiz = p.getMainComponent();
    recorrer(raiz, c => {
      if (c === raiz) return;
      const a = attrs(c);
      const toggle = a['data-bs-toggle'];
      [['href', a.href], ['data-ir-a', a['data-ir-a']]].forEach(([k, v]) => {
        if (typeof v !== 'string') return;
        v = v.trim();
        if (!v || v === '#' || NO_NAVEGA.test(v) || (toggle && k === 'href')) return;
        const [archivo, hash] = v.split('#');
        let destino = p;
        if (archivo) {
          destino = porArchivo.get(archivo.replace(/^\.\//, '').toLowerCase());
          if (!destino) { out.push({ nivel: 'error', tipo: 'enlace', pagina: p, comp: c, msg: `Enlace a «${archivo}», que no es ninguna página del sitio.` }); return; }
        }
        let id = hash || '';
        try { id = decodeURIComponent(id); } catch (e) { /* tal cual */ }
        if (hash !== undefined && id && !ids.get(destino).has(id)) {
          out.push({ nivel: 'error', tipo: 'ancla', pagina: p, comp: c, msg: `«${v}» lleva a una sección (#${id}) que no existe${destino !== p ? ' en ' + archivoDePagina(destino) : ' en esta página'}.` });
        }
      });
      ['data-bs-target', 'aria-controls'].forEach(k => {
        const v = String(a[k] || '').trim();
        if (!v) return;
        const id = k === 'data-bs-target' ? (/^#[\w-]+$/.test(v) ? v.slice(1) : '') : v.split(/\s+/)[0];
        if (id && !ids.get(p).has(id)) out.push({ nivel: 'error', tipo: 'control', pagina: p, comp: c, msg: `Este botón controla «#${id}», que no existe: el menú, acordeón o modal no se abrirá.` });
      });
    });
  });
  return out;
}

function revisarContenido(paginas) {
  const out = [];
  paginas.forEach(p => {
    const raiz = p.getMainComponent();
    buscarComp(raiz, c => tagDe(c) === 'img').forEach(c => {
      if (attrs(c).alt === undefined || attrs(c).alt === null) out.push({ nivel: 'error', tipo: 'alt', pagina: p, comp: c, msg: 'Imagen sin texto alternativo (alt). Si es decorativa, deja el texto alternativo vacío a propósito.' });
    });
    buscarComp(raiz, ES_CONTROL).forEach(c => {
      if (!tieneEtiqueta(c, raiz)) out.push({ nivel: 'error', tipo: 'etiqueta', pagina: p, comp: c, msg: `Campo «${attrs(c).name || attrs(c).placeholder || tagDe(c)}» sin etiqueta: un lector de pantalla no sabe qué pedir.` });
    });
    buscarComp(raiz, c => tagDe(c) === 'form' && !attrs(c)['data-formulario'] && String(attrs(c).method || '').toLowerCase() === 'post').forEach(c => {
      out.push({ nivel: 'aviso', tipo: 'formulario', pagina: p, comp: c, msg: 'Formulario que no recibe envíos. Actívalo en Propiedades → «Recibir envíos».' });
    });
    REVISIONES_EXTRA.forEach(fn => { try { fn(p, raiz).forEach(x => out.push({ ...x, pagina: p })); } catch (e) { console.warn(e); } });
  });
  return out;
}

/* ---------- Desbordamiento horizontal ---------- */
function docRevision(html, css) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${CDN_BS.css}"><link rel="stylesheet" href="${CDN_BS.ico}"><link rel="stylesheet" href="${gfUrl(temaFuentes())}">
<style>${SITE_CSS}</style><style>${temaCss()}</style><style>${css}</style></head>${html}</html>`;
}
function medirDesborde(doc, ancho) {
  return new Promise((ok) => {
    const f = document.createElement('iframe');
    // Sin allow-scripts: la página se dibuja pero su JavaScript no corre
    f.setAttribute('sandbox', 'allow-same-origin');
    f.setAttribute('aria-hidden', 'true');
    f.setAttribute('tabindex', '-1');
    f.style.cssText = `position:fixed;left:-30000px;top:0;width:${ancho}px;height:900px;border:0;visibility:hidden`;
    let hecho = false;
    const terminar = (r) => { if (hecho) return; hecho = true; f.remove(); ok(r); };
    f.onload = async () => {
      try {
        const d = f.contentDocument;
        try { await Promise.race([d.fonts.ready, new Promise(r => setTimeout(r, 1500))]); } catch (e) { /* sin fuentes */ }
        const W = d.documentElement.clientWidth;
        if (d.documentElement.scrollWidth <= W + 1) { terminar([]); return; }
        const recorta = (el) => {
          for (let x = el.parentElement; x && x !== d.body; x = x.parentElement) {
            const ov = d.defaultView.getComputedStyle(x).overflowX;
            if (ov !== 'visible') return true;
          }
          return false;
        };
        const sale = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > W + 1; };
        const res = [];
        d.body.querySelectorAll('*').forEach(el => {
          if (!sale(el) || recorta(el) || d.defaultView.getComputedStyle(el).position === 'fixed') return;
          if (el.parentElement && el.parentElement !== d.body && sale(el.parentElement) && !recorta(el.parentElement)) return;
          const ref = el.closest('[data-rev]');
          res.push({ rev: ref && ref.getAttribute('data-rev'), px: Math.round(el.getBoundingClientRect().right - W),
            desc: el.tagName.toLowerCase() + (el.classList[0] ? '.' + el.classList[0] : '') });
        });
        terminar(res.slice(0, 6));
      } catch (e) { console.warn(e); terminar([]); }
    };
    setTimeout(() => terminar([]), 12000);
    f.srcdoc = doc;
    document.body.appendChild(f);
  });
}
async function revisarDesbordes(paginas, progreso) {
  const out = [];
  let i = 0;
  for (const p of paginas) {
    const raiz = p.getMainComponent();
    const porCid = new Map();
    recorrer(raiz, c => porCid.set(c.cid, c));
    const html = editor.getHtml({ component: raiz, attributes: (c, a) => ({ ...a, 'data-rev': c.cid }) });
    const css = editor.getCss({ component: raiz }) || '';
    const doc = docRevision(html, css);
    for (const ancho of ANCHOS_REVISION) {
      progreso && progreso(++i, paginas.length * ANCHOS_REVISION.length, archivoDePagina(p), ancho);
      (await medirDesborde(doc, ancho)).forEach(r => {
        const comp = porCid.get(r.rev) || null;
        const nombre = comp ? (comp.getName ? comp.getName() : tagDe(comp)) : r.desc;
        out.push({ nivel: 'aviso', tipo: 'desborde', pagina: p, comp, ancho,
          msg: `A ${ancho} px, «${nombre}» se sale ${r.px} px por la derecha (aparece una barra de desplazamiento horizontal).` });
      });
    }
  }
  return out;
}

async function revisarSitio(progreso) {
  if (typeof propagarPendientes === 'function') propagarPendientes();
  const paginas = editor.Pages.getAll();
  const rapidos = [...revisarEnlaces(paginas), ...revisarContenido(paginas)];
  const desbordes = await revisarDesbordes(paginas, progreso);
  return [...rapidos, ...desbordes];
}

// Lleva al aviso: abre su página, ajusta el ancho si hace falta y selecciona el elemento
function irAlAviso(a) {
  editor.Modal.close();
  if (a.ancho && typeof ponerVista === 'function') ponerVista(a.ancho);
  if (a.comp) irA(a.pagina, a.comp);
  else if (a.pagina !== editor.Pages.getSelected()) editor.Pages.select(a.pagina);
}
