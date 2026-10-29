/* =====================================================================
   Páginas
   La primera página siempre es index.html; las demás se llaman como su
   nombre convertido a minúsculas y sin tildes (Galería → galeria.html).
===================================================================== */
function nombrePagina(p) { return p.get('name') || p.getId(); }

function archivoDePagina(p) {
  const todas = editor.Pages.getAll();
  return todas.indexOf(p) === 0 ? 'index.html' : slug(nombrePagina(p)) + '.html';
}

// Dos páginas con el mismo archivo se pisarían al exportar y los enlaces
// irían siempre a la primera: se busca un nombre libre.
function nombreLibre(nombre, excepto) {
  const ocupados = new Set(editor.Pages.getAll().filter(p => p !== excepto).map(archivoDePagina));
  let base = nombre.trim(), n = nombre.trim(), k = 2;
  if (slug(base) === 'index') base = n = base + ' 2';
  while (ocupados.has(slug(n) + '.html')) n = `${base} ${k++}`;
  return n;
}

// Cambia en TODAS las páginas los enlaces que iban a un archivo por otro
// (al renombrar una página los menús no quedan rotos).
function reenlazar(viejo, nuevo) {
  let n = 0;
  editor.Pages.getAll().forEach(p => {
    buscarComp(p.getMainComponent(), ES_ENLAZABLE).forEach(c => {
      const a = c.get('attributes') || {};
      ['href', 'data-ir-a'].forEach(k => {
        const v = a[k];
        if (typeof v !== 'string') return;
        const [archivo, hash] = v.split('#');
        if (archivo === viejo) { c.addAttributes({ [k]: nuevo + (hash !== undefined ? '#' + hash : '') }); n++; }
      });
    });
  });
  return n;
}

// Enlaces que apuntan a un archivo que ya no existe en el sitio
function enlacesA(archivo) {
  let n = 0;
  editor.Pages.getAll().forEach(p => buscarComp(p.getMainComponent(), ES_ENLAZABLE).forEach(c => {
    const a = c.get('attributes') || {};
    if ([a.href, a['data-ir-a']].some(v => typeof v === 'string' && v.split('#')[0] === archivo)) n++;
  }));
  return n;
}

function renombrarPagina(p) {
  const n = prompt('Nuevo nombre de la página (sin .html):', nombrePagina(p));
  if (!n || !n.trim()) return;
  const viejo = archivoDePagina(p);
  p.set('name', nombreLibre(n, p));
  const nuevo = archivoDePagina(p);
  const cambiados = viejo !== nuevo ? reenlazar(viejo, nuevo) : 0;
  renderPages();
  editor.store();
  toast(cambiados ? `Página renombrada a ${nuevo}. Se actualizaron ${cambiados} enlace(s).` : `Página renombrada a ${nuevo}`, 3000);
}

function duplicarPagina(p) {
  const raiz = p.getMainComponent();
  const html = raiz ? raiz.components().map(c => c.toHTML()).join('') : '';
  const copia = editor.Pages.add({
    name: nombreLibre(nombrePagina(p) + ' copia'),
    component: html,
    seoTitulo: p.get('seoTitulo') || '', seoDesc: p.get('seoDesc') || ''
  });
  editor.Pages.select(copia);
  marcarActivo(copia.getMainComponent(), archivoDePagina(copia));
  aplicarSemantica(copia.getMainComponent());
  renderPages();
  editor.store();
  toast('Página duplicada: ' + archivoDePagina(copia));
}

// Título de la pestaña y descripción para buscadores (van en el <head> al exportar)
function ajustesPagina(p) {
  const w = document.createElement('div');
  const tit = p.get('seoTitulo') || '', desc = p.get('seoDesc') || '';
  w.innerHTML = `
    <label class="f-lbl">Título de la pestaña del navegador</label>
    <input class="f-in" id="pg-tit" maxlength="70" placeholder="${SIN_HTML(nombrePagina(p))} · Mi Sitio" value="${SIN_HTML(tit)}">
    <div class="f-count" id="pg-tit-n"></div>
    <label class="f-lbl">Descripción (la que muestra Google bajo el título)</label>
    <textarea class="f-in" id="pg-desc" maxlength="170" placeholder="Una o dos frases que resuman esta página.">${SIN_HTML(desc)}</textarea>
    <div class="f-count" id="pg-desc-n"></div>
    <p class="hint">Archivo: <b>${archivoDePagina(p)}</b>. Si dejas el título vacío se usa el nombre de la página.</p>
    <div style="text-align:right;margin-top:10px"><button class="tb-btn primary" id="pg-ok"><i class="bi bi-check-lg"></i> Guardar</button></div>`;
  const cuenta = (inp, out, max) => { const f = () => { out.textContent = `${inp.value.length} / ${max}`; }; inp.addEventListener('input', f); f(); };
  cuenta(w.querySelector('#pg-tit'), w.querySelector('#pg-tit-n'), 70);
  cuenta(w.querySelector('#pg-desc'), w.querySelector('#pg-desc-n'), 170);
  w.querySelector('#pg-ok').onclick = () => {
    p.set({ seoTitulo: w.querySelector('#pg-tit').value.trim(), seoDesc: w.querySelector('#pg-desc').value.trim() });
    editor.store();
    editor.Modal.close();
    toast('Ajustes de la página guardados');
  };
  editor.Modal.open({ title: 'Ajustes de ' + archivoDePagina(p), content: w });
}

function renderPages() {
  const list = $('#pages');
  if (!list) return;
  list.innerHTML = '';
  const sel = editor.Pages.getSelected();
  const pages = editor.Pages.getAll();
  pages.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'page-row' + (p === sel ? ' active' : '');
    const file = archivoDePagina(p);
    row.innerHTML = `<i class="bi bi-${i === 0 ? 'house-door' : 'file-earmark-code'}"></i><span title="${SIN_HTML(nombrePagina(p))} → ${file}">${file}</span>`;
    row.addEventListener('click', () => editor.Pages.select(p));

    const boton = (icono, titulo, fn) => {
      const b = document.createElement('button');
      b.title = titulo;
      b.innerHTML = `<i class="bi bi-${icono}"></i>`;
      b.addEventListener('click', (ev) => { ev.stopPropagation(); fn(); });
      row.appendChild(b);
    };
    boton('gear', 'Título y descripción (SEO)', () => ajustesPagina(p));
    boton('copy', 'Duplicar', () => duplicarPagina(p));
    if (i > 0) boton('pencil', 'Renombrar', () => renombrarPagina(p));
    if (pages.length > 1) boton('trash', 'Eliminar', () => {
      const rotos = enlacesA(file);
      if (!confirm(`¿Eliminar la página "${file}"?` + (rotos ? `\n\nOjo: hay ${rotos} enlace(s) que llevan a esta página y quedarán rotos.` : ''))) return;
      if (p === editor.Pages.getSelected()) {
        const otra = pages.find(x => x !== p);
        if (otra) editor.Pages.select(otra);
      }
      editor.Pages.remove(p);
      renderPages();
      editor.store();
    });
    list.appendChild(row);
  });
}

/* =====================================================================
   Partes comunes a todas las páginas (menú y pie)
   GrapesJS guarda cada página por separado, así que no existe un
   "componente compartido": lo que hacemos es copiar el original a las
   demás páginas, reemplazando el que ya tuvieran.
   Se busca sobre el MODELO y no con find(): find() solo ve la página que
   está abierta en el lienzo, y en las demás no encontraba el menú viejo,
   así que lo dejaba y añadía otro encima (menús duplicados).
===================================================================== */
const ES_NAV = (c) => tagDe(c) === 'nav' &&
  (tieneClase(c, 'nav-transparente') || tieneClase(c, 'navbar') || tagDe(c.parent()) === 'header');
const ES_PIE = (c) => tagDe(c) === 'footer';

// Marca como activo el enlace del menú que apunta al archivo de esa página
function marcarActivo(raiz, archivo) {
  buscarComp(raiz, c => tieneClase(c, 'nav-link')).forEach(l => {
    const href = ((l.get('attributes') || {}).href || '').split('#')[0];
    l.removeClass('active');
    if (href === archivo) l.addClass('active');
  });
}

function htmlComun(pred) {
  const encontrados = buscarComp(editor.getWrapper(), pred);
  return encontrados.length ? encontrados[0].toHTML() : null;
}

function propagar(pred, alInicio, etiqueta) {
  const html = htmlComun(pred);
  if (!html) {
    alert(`Esta página no tiene ${etiqueta.toLowerCase()}.\nColócalo primero aquí y vuelve a pulsar el botón.`);
    return;
  }
  const actual = editor.Pages.getSelected();
  let n = 0;
  editor.Pages.getAll().forEach(p => {
    if (p === actual) return;
    const raiz = p.getMainComponent();
    if (!raiz) return;
    // Solo los de primer nivel: un <nav> dentro de otro no se toca aparte
    const todos = buscarComp(raiz, pred);
    const dentroDeOtro = (c) => { for (let x = c.parent(); x; x = x.parent()) if (todos.includes(x)) return true; return false; };
    const previos = todos.filter(c => !dentroDeOtro(c));
    if (previos.length) {
      const primero = previos[0];
      const padre = primero.parent() || raiz;
      const idx = primero.index();
      previos.forEach(x => x.remove());
      padre.append(html, { at: idx });
    } else {
      raiz.append(html, alInicio ? { at: 0 } : {});
    }
    marcarActivo(raiz, archivoDePagina(p));
    aplicarSemantica(raiz);
    n++;
  });
  // La página de origen también ajusta su propio enlace activo
  marcarActivo(editor.getWrapper(), archivoDePagina(actual));
  editor.store();
  toast(n ? `${etiqueta} aplicado a ${n} página(s)` : 'No hay otras páginas todavía');
}

$('#sync-nav').onclick = () => propagar(ES_NAV, true, 'El menú');
$('#sync-pie').onclick = () => propagar(ES_PIE, false, 'El pie');

$('#add-page').onclick = () => {
  const n = prompt('Nombre de la nueva página (sin .html):', 'pagina-' + (editor.Pages.getAll().length + 1));
  if (!n || !n.trim()) return;
  const nombre = nombreLibre(n);

  // La página nueva hereda el menú y el pie de la página actual
  const nav = htmlComun(ES_NAV) || '';
  const pie = htmlComun(ES_PIE) || '';
  const cuerpo = `<main id="contenido" class="container py-5"${/fixed-top/.test(nav) ? ' style="margin-top:90px"' : ''}><h1>${SIN_HTML(nombre)}</h1><p class="lead text-secondary">Reemplaza este texto por el contenido de la página.</p></main>`;

  const page = editor.Pages.add({ name: nombre, component: nav + cuerpo + pie });
  editor.Pages.select(page);
  marcarActivo(page.getMainComponent(), archivoDePagina(page));
  aplicarSemantica(page.getMainComponent());
  renderPages();
  editor.store();
  toast(`Página ${archivoDePagina(page)} creada` + (nav || pie ? ' con el menú y el pie heredados' : '') +
    '. Para enlazarla, elige «Ir a» en las propiedades de un enlace.', 4000);
};

['page', 'page:select', 'page:add', 'page:remove', 'page:update'].forEach(ev => editor.on(ev, renderPages));
