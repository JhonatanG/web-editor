/* =====================================================================
   HTML semántico
   El sitio se va estructurando solo mientras se construye:

     <header>  menú y barra superior del sitio
     <main>    todo el contenido (secciones, artículos, formularios…)
     <footer>  pie de página

   Además, al soltar un bloque:
     · los títulos se ajustan para no saltar niveles (h2 → h4 pasa a h3)
       sin cambiar su tamaño visual, y nunca queda más de un <h1>;
     · las etiquetas de formulario se asocian a su campo (for / id);
     · los enlaces y botones que solo tienen un ícono reciben un nombre
       (aria-label) y los iframe un título.

   El botón «Semántica» de la barra superior revisa la página, muestra su
   esquema (regiones y títulos) y corrige con un clic lo que se pueda.
   Se puede desactivar en la pestaña «Sitio».
===================================================================== */
const SEM_CLAVE = 'bs5-editor-semantica';
let SEMANTICA_AUTO = true;
try { SEMANTICA_AUTO = localStorage.getItem(SEM_CLAVE) !== '0'; } catch (e) { /* sin almacenamiento */ }

const esTitulo = (c) => /^h[1-6]$/.test(tagDe(c));
const nivelDe = (c) => +tagDe(c).slice(1);
const attrs = (c) => c.get('attributes') || {};
const textoDe = (c) => { try { return c.toHTML().replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim(); } catch (e) { return ''; } };
const resumen = (t, n = 48) => (t.length > n ? t.slice(0, n - 1) + '…' : t) || '(vacío)';
const esEspacio = (c) => c.is && c.is('textnode') && !String(c.get('content') || '').trim();

function mover(c, destino, at) {
  if (!c || !destino || c === destino) return;
  if (c.parent() === destino && (at === undefined || c.index() === at)) return;
  const opts = at === undefined ? {} : { at };
  if (typeof c.move === 'function') c.move(destino, opts);
  else { c.remove({ temporary: true }); destino.append(c, opts); }
}

// Cambia la etiqueta (h4 → h3, main → section…) sin perder contenido,
// clases, id ni estilos. Con conservar, un título mantiene su tamaño
// anterior gracias a la clase de Bootstrap del nivel original (h4, h5…).
function reetiquetar(comp, tag, conservar = true) {
  const actual = tagDe(comp);
  if (!comp || !actual || actual === tag || !comp.parent()) return comp;
  const estabaSel = editor.getSelected() === comp;
  const html = comp.toHTML()
    .replace(new RegExp('^<' + actual + '\\b', 'i'), '<' + tag)
    .replace(new RegExp('</' + actual + '>\\s*$', 'i'), '</' + tag + '>');
  const nuevos = comp.replaceWith(html);
  const nuevo = Array.isArray(nuevos) ? nuevos[0] : nuevos;
  if (nuevo && conservar && /^h[1-6]$/.test(actual) && /^h[1-6]$/.test(tag) &&
      !nuevo.getClasses().some(k => /^(h[1-6]|display-\d|fs-\d)$/.test(k))) nuevo.addClass(actual);
  if (nuevo && estabaSel) editor.select(nuevo);
  return nuevo || comp;
}

/* ---------- Estructura de la página: header / main / footer ---------- */
const ES_FLOTANTE = (c) => tieneClase(c, 'whatsapp-flotante') || ['script', 'style', 'link', 'meta', 'template'].includes(tagDe(c));
const ES_HERO = (c) => tieneClase(c, 'hero') || tieneClase(c, 'hero-interno');

function clasificar(raiz) {
  const hijos = raiz.components().models.filter(c => !esEspacio(c));
  const cab = hijos.find(c => tagDe(c) === 'header' && !ES_HERO(c)) || null;
  const main = hijos.find(c => tagDe(c) === 'main') || null;
  const paraCab = hijos.filter(c => tagDe(c) === 'nav' || tieneClase(c, 'barra-superior'));
  const pies = hijos.filter(c => tagDe(c) === 'footer');
  const flot = hijos.filter(ES_FLOTANTE);
  const contenido = hijos.filter(c => c !== cab && c !== main && !paraCab.includes(c) && !pies.includes(c) && !flot.includes(c));
  return { hijos, cab, main, paraCab, pies, flot, contenido };
}

function organizar(raiz) {
  if (!raiz) return [];
  const k = clasificar(raiz);
  const esperado = [k.cab, k.main, ...k.pies, ...k.flot].filter(Boolean);
  if (!k.paraCab.length && !k.contenido.length && esperado.every((c, i) => k.hijos[i] === c)) return [];
  const hechos = [];
  raiz.components().models.filter(esEspacio).forEach(c => c.remove());

  let cab = k.cab;
  if (k.paraCab.length) {
    if (!cab) cab = raiz.append('<header class="sitio-cabecera"></header>', { at: 0 })[0];
    k.paraCab.forEach(c => mover(c, cab));
    hechos.push('el menú quedó dentro de <header>');
  }
  let main = k.main;
  if (k.contenido.length) {
    if (!main) main = raiz.append('<main id="contenido"></main>')[0];
    const iMain = k.main ? k.hijos.indexOf(k.main) : Infinity;
    const antes = k.contenido.filter(c => k.hijos.indexOf(c) < iMain);
    const despues = k.contenido.filter(c => k.hijos.indexOf(c) > iMain);
    // Un segundo <main> no puede ir dentro de otro: pasa a ser <section>
    const preparar = (c) => (tagDe(c) === 'main' ? reetiquetar(c, 'section', false) : c);
    antes.forEach((c, i) => mover(preparar(c), main, i));
    despues.forEach(c => mover(preparar(c), main));
    hechos.push(k.contenido.length === 1 ? 'el bloque quedó dentro de <main>' : `${k.contenido.length} bloques quedaron dentro de <main>`);
  }
  [cab, main, ...k.pies, ...k.flot].filter(Boolean).forEach((c, i) => mover(c, raiz, i));
  if (main && !attrs(main).id) main.addAttributes({ id: 'contenido' });
  if (!hechos.length) hechos.push('se ordenaron header, main y footer');
  return hechos;
}

/* ---------- Títulos ---------- */
// Ajusta los títulos de un bloque recién soltado según el título que tiene
// antes en la página: una tarjeta con <h5> bajo un <h2> pasa a <h3>.
function ajustarTitulosDe(comp, raiz) {
  const todos = buscarComp(raiz, esTitulo);
  const propios = [];
  recorrer(comp, c => { if (esTitulo(c)) propios.push(c); });
  if (!propios.length) return [];
  const i0 = todos.indexOf(propios[0]);
  const previo = i0 > 0 ? nivelDe(todos[i0 - 1]) : 0;
  const h1Fuera = todos.some(t => !propios.includes(t) && nivelDe(t) === 1);
  const base = nivelDe(propios[0]);
  const desplazar = previo && base > previo + 1 ? previo + 1 - base : 0;
  const cambios = [];
  propios.forEach(t => {
    let n = Math.min(6, Math.max(1, nivelDe(t) + desplazar));
    if (n === 1 && h1Fuera) n = 2;
    if (n !== nivelDe(t)) cambios.push([t, n]);
  });
  cambios.forEach(([t, n]) => reetiquetar(t, 'h' + n, true));
  return cambios.length ? [cambios.length === 1 ? `un título pasó a <h${cambios[0][1]}>` : `${cambios.length} títulos ajustaron su nivel`] : [];
}

// Recorre toda la página y elimina los saltos de nivel (y los <h1> extra)
function corregirNiveles(raiz) {
  let previo = 0, h1 = false, n = 0;
  const ts = buscarComp(raiz, esTitulo);
  // Sin ningún <h1>, el primer título de la página pasa a serlo
  const sinH1 = !ts.some(t => nivelDe(t) === 1);
  ts.forEach((t, i) => {
    let nv = sinH1 && i === 0 ? 1 : nivelDe(t);
    if (nv === 1 && h1) nv = 2;
    if (previo && nv > previo + 1) nv = previo + 1;
    if (nv === 1) h1 = true;
    if (nv !== nivelDe(t)) { reetiquetar(t, 'h' + nv, true); n++; }
    previo = nv;
  });
  return n;
}

/* ---------- Formularios, íconos e iframes ---------- */
const ES_CONTROL = (c) => ['input', 'select', 'textarea'].includes(tagDe(c)) &&
  !['hidden', 'submit', 'button', 'reset', 'image'].includes(String(attrs(c).type || '').toLowerCase());

function tieneEtiqueta(c, raiz) {
  const a = attrs(c);
  if (a['aria-label'] || a['aria-labelledby'] || a.title) return true;
  if (a.id && buscarComp(raiz, x => tagDe(x) === 'label' && attrs(x).for === a.id).length) return true;
  for (let p = c.parent(); p && p !== raiz; p = p.parent()) if (tagDe(p) === 'label') return true;
  return false;
}
function etiquetarControl(c) {
  const padre = c.parent();
  const lab = padre && padre.components().find(x => tagDe(x) === 'label' && !attrs(x).for);
  if (lab) {
    const id = attrs(c).id || 'campo-' + Math.random().toString(36).slice(2, 7);
    c.addAttributes({ id });
    lab.addAttributes({ for: id });
    return true;
  }
  const t = attrs(c).placeholder || attrs(c).name;
  if (t) { c.addAttributes({ 'aria-label': t }); return true; }
  return false;
}

const ICONOS = {
  facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok', twitter: 'Twitter', 'twitter-x': 'X',
  linkedin: 'LinkedIn', whatsapp: 'WhatsApp', telegram: 'Telegram', github: 'GitHub', pinterest: 'Pinterest', envelope: 'Correo',
  telephone: 'Teléfono', 'geo-alt': 'Ubicación', search: 'Buscar', list: 'Menú', x: 'Cerrar', 'x-lg': 'Cerrar',
  'chevron-left': 'Anterior', 'chevron-right': 'Siguiente', 'arrow-left': 'Anterior', 'arrow-right': 'Siguiente',
  house: 'Inicio', 'house-door': 'Inicio', cart: 'Carrito', person: 'Mi cuenta', globe2: 'Idioma', play: 'Reproducir'
};
function nombreDeIcono(c) {
  let n = '';
  recorrer(c, x => {
    if (n) return;
    const k = (x.getClasses ? x.getClasses() : []).find(k => /^bi-/.test(k));
    if (!k) return;
    const b = k.slice(3).replace(/-(fill|circle|square)$/, '');
    n = ICONOS[b] || ICONOS[b.split('-')[0]] || '';
  });
  return n;
}
const ES_ACCIONABLE = (c) => ['a', 'button'].includes(tagDe(c));
const tieneNombre = (c) => {
  const a = attrs(c);
  if (textoDe(c) || a['aria-label'] || a['aria-labelledby'] || a.title) return true;
  let alt = false;
  recorrer(c, x => { if (tagDe(x) === 'img' && attrs(x).alt) alt = true; });
  return alt;
};

const tituloIframe = (c) => {
  const src = String(attrs(c).src || c.get('src') || '');
  return /maps\.google|google\.com\/maps|openstreetmap/i.test(src) ? 'Mapa de ubicación'
    : /youtube|vimeo/i.test(src) ? 'Video' : 'Contenido incrustado';
};
const ES_IFRAME = (c) => tagDe(c) === 'iframe';

// Arreglos que nunca cambian el aspecto: se aplican solos al soltar un bloque
function arreglosSeguros(comp, raiz) {
  const hechos = [];
  let campos = 0, iconos = 0, iframes = 0;
  recorrer(comp, c => {
    if (ES_CONTROL(c) && !tieneEtiqueta(c, raiz) && etiquetarControl(c)) campos++;
    if (ES_ACCIONABLE(c) && !tieneNombre(c)) { const n = nombreDeIcono(c); if (n) { c.addAttributes({ 'aria-label': n }); iconos++; } }
    if (ES_IFRAME(c) && !attrs(c).title) { c.addAttributes({ title: tituloIframe(c) }); iframes++; }
  });
  if (campos) hechos.push(campos === 1 ? 'un campo quedó asociado a su etiqueta' : `${campos} campos quedaron asociados a su etiqueta`);
  if (iconos) hechos.push(`${iconos} ícono(s) recibieron un nombre accesible`);
  if (iframes) hechos.push('el contenido incrustado recibió un título');
  return hechos;
}

/* ---------- Referencias entre elementos ----------
   GrapesJS no permite repetir un id en todo el proyecto: al copiar el menú
   a otra página (o duplicarla) renombra id="menu" a id="menu-2", pero no
   toca lo que apuntaba a él (data-bs-target="#menu"). Resultado: en móvil
   la hamburguesa no abría el menú en ninguna página salvo la primera, y lo
   mismo con acordeones, carruseles y pestañas copiados. Aquí se reenlazan. */
const REFS_ALMOHADILLA = ['data-bs-target', 'data-bs-parent', 'href', 'data-ir-a'];
const REFS_ID = ['aria-controls', 'for', 'aria-labelledby', 'aria-describedby'];
function repararReferencias(raiz) {
  if (!raiz) return 0;
  const ids = new Set();
  raiz.components().forEach(c => recorrer(c, x => { const id = attrs(x).id; if (id) ids.add(id); }));
  const renombrado = (id) => {
    if (!id || ids.has(id)) return null;
    const cand = [...ids].filter(x => x.startsWith(id + '-') && /^\d+$/.test(x.slice(id.length + 1)));
    return cand.length === 1 ? cand[0] : null;
  };
  let n = 0;
  raiz.components().forEach(c => recorrer(c, x => {
    const a = attrs(x), cambios = {};
    REFS_ALMOHADILLA.forEach(k => {
      const v = a[k];
      if (typeof v !== 'string' || !/^#[\w-]+$/.test(v)) return;
      const r = renombrado(v.slice(1));
      if (r) cambios[k] = '#' + r;
    });
    REFS_ID.forEach(k => {
      const v = a[k];
      if (typeof v !== 'string' || !v.trim()) return;
      const partes = v.trim().split(/\s+/);
      const nuevas = partes.map(id => renombrado(id) || id);
      if (nuevas.join(' ') !== partes.join(' ')) cambios[k] = nuevas.join(' ');
    });
    if (Object.keys(cambios).length) { x.addAttributes(cambios); n++; }
  }));
  return n;
}
editor.on('load', () => setTimeout(() => {
  let n = 0;
  editor.Pages.getAll().forEach(p => { n += repararReferencias(p.getMainComponent()); });
  if (n) { editor.store(); console.info(`Se reenlazaron ${n} referencias rotas entre páginas`); }
}, 300));

/* ---------- Punto de entrada ---------- */
// raiz: página a ordenar. comp: el bloque recién soltado (si lo hay).
function aplicarSemantica(raiz, comp = null, { avisar = false } = {}) {
  if (!raiz) return [];
  repararReferencias(raiz);          // siempre: no es estilo, es que funcione
  if (!SEMANTICA_AUTO) return [];
  let hechos = [];
  try {
    hechos = hechos.concat(organizar(raiz));
    if (comp && comp.parent()) {
      hechos = hechos.concat(ajustarTitulosDe(comp, raiz));
      hechos = hechos.concat(arreglosSeguros(comp, raiz));
    } else if (!comp) {
      raiz.components().forEach(c => { hechos = hechos.concat(arreglosSeguros(c, raiz)); });
    }
  } catch (e) { console.warn('Semántica:', e); }
  if (avisar && hechos.length) toast('HTML semántico: ' + hechos.join(', ') + '.', 4000);
  programarRevision();
  return hechos;
}

editor.on('block:drag:stop', (comp) => {
  if (!comp || !comp.parent) return;
  // El bloque puede haberse reemplazado (cambio de etiqueta): se busca por su raíz
  setTimeout(() => aplicarSemantica(editor.getWrapper(), comp.parent() ? comp : null, { avisar: true }), 0);
});
// Mover un elemento existente al nivel superior de la página también reordena
editor.on('component:drag:end', (ev) => {
  const w = editor.getWrapper();
  if (ev && ev.parent === w) setTimeout(() => aplicarSemantica(w, null, { avisar: true }), 0);
});

/* =====================================================================
   Revisión: problemas, esquema y arreglos con un clic
===================================================================== */
function revisar(raiz) {
  const out = [];
  const add = (nivel, msg, comp, arreglo, txt) => out.push({ nivel, msg, comp, arreglo, txt });
  if (!raiz) return out;
  const k = clasificar(raiz);
  const ordenar = () => organizar(raiz);
  if (k.contenido.length && !k.main) add('error', 'Falta <main>: el contenido principal no está marcado.', k.contenido[0], ordenar, 'Crear <main>');
  else if (k.contenido.length) add('error', `${k.contenido.length} bloque(s) están fuera de <main>.`, k.contenido[0], ordenar, 'Mover a <main>');
  if (k.paraCab.length) add('aviso', 'El menú no está dentro de un <header>.', k.paraCab[0], ordenar, 'Meter en <header>');
  const mains = buscarComp(raiz, c => tagDe(c) === 'main');
  if (mains.length > 1) add('error', `Hay ${mains.length} <main>; solo puede haber uno por página.`, mains[1],
    () => { mains.slice(1).forEach(m => reetiquetar(m, 'section', false)); organizar(raiz); }, 'Convertir en <section>');

  const ts = buscarComp(raiz, esTitulo);
  const h1s = ts.filter(t => nivelDe(t) === 1);
  if (!h1s.length) add('error', 'La página no tiene título principal <h1>.', ts[0] || null,
    ts.length ? () => reetiquetar(ts[0], 'h1', true) : null, ts.length ? 'Convertir el primero en <h1>' : '');
  if (h1s.length > 1) add('aviso', `Hay ${h1s.length} títulos <h1>; lo correcto es uno por página.`, h1s[1], () => corregirNiveles(raiz), 'Corregir niveles');
  let previo = 0, saltos = 0;
  ts.forEach(t => {
    const nv = nivelDe(t);
    if (previo && nv > previo + 1 && saltos++ < 6) add('aviso', `Salto de <h${previo}> a <h${nv}>: «${resumen(textoDe(t), 40)}».`, t, () => corregirNiveles(raiz), 'Corregir niveles');
    if (!textoDe(t)) add('aviso', `Título <h${nv}> vacío.`, t);
    previo = nv;
  });

  buscarComp(raiz, c => tagDe(c) === 'img').forEach(c => {
    const a = attrs(c);
    if (a.alt === undefined || a.alt === null) add('error', 'Imagen sin texto alternativo (alt).', c, null, '');
  });
  buscarComp(raiz, ES_ACCIONABLE).forEach(c => {
    if (tieneNombre(c)) return;
    const n = nombreDeIcono(c);
    add('error', `${tagDe(c) === 'a' ? 'Enlace' : 'Botón'} sin texto: un lector de pantalla no sabe qué hace.`, c,
      n ? () => c.addAttributes({ 'aria-label': n }) : null, n ? `Nombrarlo «${n}»` : '');
  });
  buscarComp(raiz, ES_IFRAME).forEach(c => {
    if (!attrs(c).title) add('aviso', 'Contenido incrustado (iframe) sin título.', c, () => c.addAttributes({ title: tituloIframe(c) }), 'Añadir título');
  });
  buscarComp(raiz, ES_CONTROL).forEach(c => {
    if (!tieneEtiqueta(c, raiz)) add('aviso', `Campo «${attrs(c).name || tagDe(c)}» sin etiqueta asociada.`, c, () => etiquetarControl(c), 'Asociar etiqueta');
  });
  buscarComp(raiz, c => ['section', 'article', 'aside'].includes(tagDe(c))).forEach(c => {
    if (!buscarComp(c, esTitulo).length && !attrs(c)['aria-label'] && !attrs(c)['aria-labelledby'])
      add('consejo', `<${tagDe(c)}> sin título: añade un encabezado (puede ser oculto con visually-hidden).`, c);
  });
  const vacios = buscarComp(raiz, c => tagDe(c) === 'a' && attrs(c).href === '#' && !attrs(c)['data-bs-toggle'] && attrs(c).role !== 'button');
  if (vacios.length) add('consejo', `${vacios.length} enlace(s) sin destino (href="#"). Elige uno en «Propiedades → Ir a».`, vacios[0]);
  return out;
}

// Regiones y títulos de la página, con sangría: el «índice» que ve un lector de pantalla
const REGIONES = { header: 'Encabezado', nav: 'Navegación', main: 'Contenido principal', section: 'Sección', article: 'Artículo', aside: 'Lateral', footer: 'Pie', form: 'Formulario', figure: 'Figura', address: 'Datos de contacto' };
function esquema(raiz) {
  const lineas = [];
  const visita = (c, prof) => {
    if (lineas.length > 160) return;
    const t = tagDe(c);
    if (REGIONES[t]) {
      if (t !== 'figure' && t !== 'address' && t !== 'form') lineas.push({ prof, tag: t, txt: attrs(c)['aria-label'] || '', comp: c, region: true });
      c.components().forEach(h => visita(h, prof + 1));
      return;
    }
    if (esTitulo(c)) { lineas.push({ prof, tag: t, txt: resumen(textoDe(c), 60), comp: c }); return; }
    c.components().forEach(h => visita(h, prof));
  };
  raiz.components().forEach(c => visita(c, 0));
  return lineas;
}

/* ---------- Indicador en la barra superior ---------- */
let temporizador = null;
function programarRevision() {
  clearTimeout(temporizador);
  temporizador = setTimeout(pintarIndicador, 700);
}
function pintarIndicador() {
  const el = $('#sem-count');
  if (!el) return;
  let probs = [];
  try { probs = revisar(editor.getWrapper()).filter(p => p.nivel !== 'consejo'); } catch (e) { return; }
  const err = probs.filter(p => p.nivel === 'error').length;
  el.textContent = probs.length ? String(probs.length) : '✓';
  el.className = 'sem-badge ' + (err ? 'err' : probs.length ? 'avi' : 'ok');
  $('#btn-semantica').title = probs.length
    ? `HTML semántico: ${probs.length} cosa(s) por mejorar en esta página. Clic para verlas.`
    : 'HTML semántico: esta página está bien estructurada';
}
editor.on('component:add component:remove component:update:tagName component:update:attributes page:select load', programarRevision);

/* ---------- Ventana de revisión ---------- */
function irA(pagina, comp) {
  const elegir = () => {
    if (!comp) return;
    editor.select(comp);
    const el = comp.getEl && comp.getEl();
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  editor.Modal.close();
  if (pagina !== editor.Pages.getSelected()) { editor.Pages.select(pagina); setTimeout(elegir, 700); } else elegir();
}

function abrirSemantica(todas = false) {
  const paginas = todas ? editor.Pages.getAll() : [editor.Pages.getSelected()];
  const w = document.createElement('div');
  const ICO = { error: 'x-circle-fill', aviso: 'exclamation-triangle-fill', consejo: 'lightbulb' };
  let html = `<p class="imp-hint">Las etiquetas semánticas dicen <b>qué es</b> cada parte (encabezado, menú, contenido, pie…). De eso dependen los lectores de pantalla y los buscadores.
    ${SEMANTICA_AUTO ? 'El editor ya ordena solo la estructura mientras construyes; aquí ves lo que falta.' : '<b>La estructura automática está desactivada</b> (pestaña «Sitio»).'}</p>
    <div class="sem-acciones">
      <button class="tb-btn primary" id="sem-todo"><i class="bi bi-magic"></i> Corregir todo lo automático</button>
      <label class="t-check"><input type="checkbox" id="sem-todas" ${todas ? 'checked' : ''}><span>Revisar todas las páginas</span></label>
    </div>`;
  const registro = [];
  paginas.forEach(p => {
    const raiz = p.getMainComponent();
    const probs = revisar(raiz);
    html += `<div class="sem-pag"><i class="bi bi-file-earmark-code"></i> ${archivoDePagina(p)}
      <span class="sem-badge ${probs.some(x => x.nivel === 'error') ? 'err' : probs.some(x => x.nivel === 'aviso') ? 'avi' : 'ok'}">${probs.filter(x => x.nivel !== 'consejo').length || '✓'}</span></div>`;
    if (!probs.length) html += '<p class="hint" style="margin:4px 0 10px">Todo en orden.</p>';
    probs.forEach(pr => {
      const i = registro.push({ ...pr, pagina: p }) - 1;
      html += `<div class="sem-item ${pr.nivel}"><i class="bi bi-${ICO[pr.nivel]}"></i><span>${SIN_HTML(pr.msg)}</span>
        ${pr.comp ? `<button class="tb-btn" data-ver="${i}" title="Seleccionarlo en el lienzo"><i class="bi bi-crosshair"></i></button>` : ''}
        ${pr.arreglo ? `<button class="tb-btn" data-fix="${i}">${SIN_HTML(pr.txt || 'Corregir')}</button>` : ''}</div>`;
    });
  });
  const pagActual = editor.Pages.getSelected();
  html += `<div class="ov-title" style="margin-top:16px"><i class="bi bi-diagram-3"></i> Esquema de ${archivoDePagina(pagActual)}</div><div class="sem-tree">`;
  const lineas = esquema(pagActual.getMainComponent());
  if (!lineas.length) html += '<p class="hint">La página está vacía.</p>';
  lineas.forEach((l, i) => {
    html += `<div class="sem-linea ${l.region ? 'region' : 'titulo'}" style="padding-left:${l.prof * 16 + 6}px" data-linea="${i}">
      <code>&lt;${l.tag}&gt;</code> <span>${l.region ? REGIONES[l.tag] + (l.txt ? ' · ' + SIN_HTML(l.txt) : '') : SIN_HTML(l.txt)}</span></div>`;
  });
  html += '</div>';
  w.innerHTML = html;

  w.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => { const r = registro[+b.dataset.ver]; irA(r.pagina, r.comp); });
  w.querySelectorAll('[data-fix]').forEach(b => b.onclick = () => {
    const r = registro[+b.dataset.fix];
    try { r.arreglo(); } catch (e) { console.warn(e); }
    editor.store(); programarRevision();
    abrirSemantica(w.querySelector('#sem-todas').checked);
    toast('Corregido');
  });
  w.querySelectorAll('[data-linea]').forEach(d => d.onclick = () => irA(pagActual, lineas[+d.dataset.linea].comp));
  w.querySelector('#sem-todas').onchange = (e) => abrirSemantica(e.target.checked);
  w.querySelector('#sem-todo').onclick = () => {
    let n = 0;
    paginas.forEach(p => {
      const raiz = p.getMainComponent();
      n += organizar(raiz).length ? 1 : 0;
      raiz.components().forEach(c => { n += arreglosSeguros(c, raiz).length; });
      n += corregirNiveles(raiz);
      revisar(raiz).filter(x => x.arreglo && x.nivel !== 'consejo').forEach(x => { try { x.arreglo(); n++; } catch (e) { /* sigue */ } });
    });
    editor.store(); programarRevision();
    abrirSemantica(w.querySelector('#sem-todas').checked);
    toast(n ? 'Estructura semántica corregida' : 'No había nada que corregir automáticamente');
  };
  editor.Modal.open({ title: 'HTML semántico', content: w });
}
$('#btn-semantica').onclick = () => abrirSemantica(false);

/* ---------- Ajuste en la pestaña «Sitio» ---------- */
(() => {
  const chk = $('#t-semantica');
  if (!chk) return;
  chk.checked = SEMANTICA_AUTO;
  chk.addEventListener('change', () => {
    SEMANTICA_AUTO = chk.checked;
    try { localStorage.setItem(SEM_CLAVE, chk.checked ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
    if (SEMANTICA_AUTO) aplicarSemantica(editor.getWrapper(), null, { avisar: true });
  });
})();

/* ---------- «Nivel del título» en Propiedades ---------- */
editor.on('component:selected', (c) => {
  if (!c || !esTitulo(c) || !c.getTrait) return;
  try { if (c.getTrait('nivel-titulo')) c.removeTrait('nivel-titulo'); } catch (e) { /* sigue */ }
  c.set('nivel-titulo', tagDe(c), { silent: true });
  c.addTrait({
    type: 'select', name: 'nivel-titulo', label: 'Nivel del título', changeProp: true,
    options: [1, 2, 3, 4, 5, 6].map(n => ({ id: 'h' + n, value: 'h' + n, name: `H${n}${n === 1 ? ' (uno por página)' : ''}`, label: 'H' + n }))
  }, { at: 0 });
});
editor.on('component:update:nivel-titulo', (c) => {
  const v = c.get('nivel-titulo');
  if (!v || v === tagDe(c)) return;
  // Fuera del evento de cambio: reemplazar el componente DENTRO de su propio
  // evento dejaba la selección en el título viejo y el cambio no se veía.
  setTimeout(() => {
    if (!c.parent()) return;
    const nuevo = reetiquetar(c, v, true);
    editor.select(nuevo);
    programarRevision();
    toast(`Ahora es <${v}>. Conserva su tamaño; cámbialo en «Estilo» si quieres.`, 3000);
  }, 0);
});

/* ---------- Capas: nombre de cada región según su etiqueta ---------- */
(() => {
  const NOMBRES = { ...REGIONES, h1: 'Título H1', h2: 'Título H2', h3: 'Título H3', h4: 'Título H4', h5: 'Título H5', h6: 'Título H6', blockquote: 'Cita', ul: 'Lista', ol: 'Lista numerada', li: 'Elemento de lista' };
  try {
    const proto = editor.Components.getType('default').model.prototype;
    const base = proto.getName;
    proto.getName = function (...args) {
      const propio = this.get('name') || this.get('custom-name');
      const n = NOMBRES[(this.get('tagName') || '').toLowerCase()];
      return !propio && n ? n : base.apply(this, args);
    };
  } catch (e) { console.warn('No se pudieron renombrar las capas', e); }
})();
