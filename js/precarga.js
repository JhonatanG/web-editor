/* =====================================================================
   Pantalla de carga (Sitio → Pantalla de carga)
   Muestra el logo (el del menú, otra imagen o un texto) mientras la página
   carga y luego sale con un efecto. Es un ajuste del sitio entero: viaja
   en el proyecto (__precarga) y el generador lo añade a todas las páginas.
     · marcado al principio de <body>, antes de que se pinte nada
     · CSS al final de site.css, solo si está activada
     · js/precarga.js la quita al terminar la carga (como mucho a los 8 s)
   Sin JavaScript no se muestra (<noscript>) y con «reducir movimiento»
   sale con un fundido corto, sin animaciones.
===================================================================== */

const CSS_PRECARGA = `/* ---------- Pantalla de carga ---------- */
html.pl-cargando{overflow:hidden}
html.pl-cargando body [data-reveal]:not([data-reveal=""]){opacity:0!important}
.precarga{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:var(--pl-fondo);color:var(--pl-tinta);transition:opacity .6s ease,transform .8s cubic-bezier(.77,0,.18,1),visibility 0s linear .85s;animation:pl-seguro .4s linear 9s forwards}
.pl-visto .precarga{display:none}
.pl-centro{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:24px;padding:0 16px;transition:opacity .35s ease,transform .6s ease}
.pl-marca{display:flex;align-items:center;justify-content:center}
.pl-logo{display:block;width:auto;height:auto;max-width:min(240px,62vw);max-height:120px;object-fit:contain}
.pl-texto{font-family:var(--fuente-titulos);font-size:clamp(1.7rem,6vw,2.8rem);font-weight:700;line-height:1.1;letter-spacing:.01em;text-align:center;overflow-wrap:anywhere}
.pl-anim-pulso .pl-marca{animation:pl-pulso 1.5s ease-in-out infinite}
.pl-giro{width:34px;height:34px;border-radius:50%;border:3px solid currentColor;border-right-color:transparent;animation:pl-gira .8s linear infinite}
.pl-barra{position:relative;width:min(180px,50vw);height:3px;border-radius:3px;overflow:hidden}
.pl-barra::before{content:"";position:absolute;inset:0;background:currentColor;opacity:.2}
.pl-barra i{position:absolute;top:0;bottom:0;left:0;width:40%;border-radius:3px;background:currentColor;animation:pl-barra 1.2s ease-in-out infinite}
.pl-puntos{display:flex;gap:8px}
.pl-puntos i{width:9px;height:9px;border-radius:50%;background:currentColor;animation:pl-punto 1s ease-in-out infinite}
.pl-puntos i:nth-child(2){animation-delay:.15s}
.pl-puntos i:nth-child(3){animation-delay:.3s}
.precarga.pl-saliendo{pointer-events:none;visibility:hidden}
.precarga.pl-saliendo .pl-centro{opacity:0}
.pl-sale-desvanecer.pl-saliendo{opacity:0}
.pl-sale-subir.pl-saliendo{transform:translateY(-100%)}
.pl-sale-zoom.pl-saliendo{opacity:0;transform:scale(1.12)}
.pl-sale-zoom.pl-saliendo .pl-centro{transform:scale(1.35)}
.pl-sale-cortina{background:transparent}
.pl-mitad{position:absolute;left:0;right:0;height:50.5%;background:var(--pl-fondo);transition:transform .85s cubic-bezier(.77,0,.18,1) .1s}
.pl-mitad-a{top:0}
.pl-mitad-b{bottom:0}
.pl-sale-cortina.pl-saliendo{transition-delay:0s,0s,1s}
.pl-sale-cortina.pl-saliendo .pl-mitad-a{transform:translateY(-100%)}
.pl-sale-cortina.pl-saliendo .pl-mitad-b{transform:translateY(100%)}
.pl-sale-ninguna.pl-saliendo{display:none}
@keyframes pl-pulso{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.07);opacity:.72}}
@keyframes pl-gira{to{transform:rotate(360deg)}}
@keyframes pl-barra{from{transform:translateX(-100%)}to{transform:translateX(250%)}}
@keyframes pl-punto{0%,80%,100%{transform:scale(.55);opacity:.35}40%{transform:scale(1);opacity:1}}
@keyframes pl-seguro{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion:reduce){
  .pl-marca,.pl-giro,.pl-barra i,.pl-puntos i{animation:none!important}
  .precarga,.pl-mitad,.pl-centro{transition:opacity .3s ease,visibility 0s linear .3s!important}
  .precarga.pl-saliendo{opacity:0;transform:none!important}
  .precarga.pl-saliendo .pl-mitad{transform:none!important}
}`;

// En <head>: marca la página como «cargando» antes de pintar nada. Si ya
// se vio en esta visita (y así se eligió), ni siquiera aparece.
const HEAD_PRECARGA = "(function(h){window.__plT0=Date.now();try{if(sessionStorage.getItem('pl-visto')==='1'){h.classList.add('pl-visto');return}}catch(e){}h.classList.add('pl-cargando');setTimeout(function(){h.classList.remove('pl-cargando')},9000)})(document.documentElement);";

const RUNTIME_PRECARGA = `(function(){
  var d=document, h=d.documentElement, el=d.getElementById('precarga');
  if(!el) return;
  if(h.classList.contains('pl-visto')){ el.parentNode.removeChild(el); return; }
  var t0=window.__plT0||Date.now(), min=parseInt(el.getAttribute('data-minimo'),10)||0, hecho=false;
  var quitar=function(){
    if(hecho) return; hecho=true;
    setTimeout(function(){
      try{ if(el.getAttribute('data-una-vez')==='si') sessionStorage.setItem('pl-visto','1'); }catch(e){}
      el.classList.add('pl-saliendo');
      h.classList.remove('pl-cargando');
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); },1300);
    },Math.max(0,min-(Date.now()-t0)));
  };
  if(d.readyState==='complete') quitar(); else window.addEventListener('load',quitar);
  setTimeout(quitar,8000);
})();`;

RUNTIMES_EXTRA.push({ archivo: 'precarga.js', codigo: RUNTIME_PRECARGA, usa: (html) => /<div class="precarga\b/.test(html) });

/* ---------- Qué se muestra ---------- */
// El logo del menú de esa página: su imagen o, si es texto, su texto
function marcaDelMenu(inner) {
  const doc = new DOMParser().parseFromString(`<body>${inner}</body>`, 'text/html');
  const b = doc.querySelector('.navbar-brand');
  if (!b) return null;
  const img = b.querySelector('img');
  if (img && img.getAttribute('src')) return { img: img.getAttribute('src') };
  const t = b.textContent.replace(/\s+/g, ' ').trim();
  return t ? { texto: t } : null;
}
function marcaPrecarga(inner) {
  const menu = marcaDelMenu(inner || '');
  const nombre = PRE.texto || (menu && menu.texto) || PUB.nombre || 'Bienvenido';
  if (PRE.fuente === 'texto') return { texto: nombre };
  if (PRE.fuente === 'imagen' && PRE.logo) return { img: PRE.logo };
  return menu || { texto: nombre };
}
function coloresPrecarga() {
  if (PRE.fondo === 'osc') return ['var(--sitio-osc)', '#ffffff'];
  if (PRE.fondo === 'primario') return ['var(--sitio-primario)', '#ffffff'];
  if (PRE.fondo === 'personal') {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(PRE.color.slice(i, i + 2), 16) / 255);
    return [PRE.color, 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#1b1b1f' : '#ffffff'];
  }
  return ['var(--sitio-fondo)', 'var(--sitio-primario)'];
}
// modo 'previa': no se recuerda la visita, para poder verla cada vez
function marcadoPrecarga(inner, modo) {
  const m = marcaPrecarga(inner);
  const [fondo, tinta] = coloresPrecarga();
  const marca = m.img
    ? `<img class="pl-logo" src="${SIN_HTML(m.img)}" alt="">`
    : `<span class="pl-texto">${SIN_HTML(m.texto)}</span>`;
  const indicador = { giro: '<span class="pl-giro"></span>', barra: '<span class="pl-barra"><i></i></span>', puntos: '<span class="pl-puntos"><i></i><i></i><i></i></span>' }[PRE.anim] || '';
  const mitades = PRE.salida === 'cortina' ? '<span class="pl-mitad pl-mitad-a"></span><span class="pl-mitad pl-mitad-b"></span>' : '';
  const unaVez = PRE.unaVez && modo !== 'previa' ? 'si' : 'no';
  return `<div class="precarga pl-anim-${PRE.anim} pl-sale-${PRE.salida}" id="precarga" aria-hidden="true" data-minimo="${PRE.minimo}" data-una-vez="${unaVez}" style="--pl-fondo:${fondo};--pl-tinta:${tinta}">${mitades}<div class="pl-centro"><div class="pl-marca">${marca}</div>${indicador}</div></div>`;
}

/* ---------- Panel «Sitio» ---------- */
(() => {
  const box = $('#pl-box');
  if (!box) return;
  const activo = $('#pl-activo'), opciones = $('#pl-opciones'), fuente = $('#pl-fuente'), texto = $('#pl-texto');
  const anim = $('#pl-anim'), salida = $('#pl-salida'), fondo = $('#pl-fondo'), color = $('#pl-color');
  const minimo = $('#pl-minimo'), minimoV = $('#pl-minimo-v'), unaVez = $('#pl-unavez'), mini = $('#pl-mini');
  const seg = (ms) => (ms / 1000).toLocaleString('es', { maximumFractionDigits: 1 }) + ' s';
  const htmlPagina = () => { try { return editor.getHtml(); } catch (e) { return ''; } };

  const pintar = () => {
    activo.checked = PRE.activo;
    opciones.hidden = !PRE.activo;
    fuente.value = PRE.fuente; texto.value = PRE.texto; anim.value = PRE.anim; salida.value = PRE.salida;
    fondo.value = PRE.fondo; color.value = PRE.color; color.style.display = PRE.fondo === 'personal' ? '' : 'none';
    minimo.value = PRE.minimo; minimoV.textContent = seg(PRE.minimo); unaVez.checked = PRE.unaVez;
    $('#pl-img-fila').style.display = PRE.fuente === 'imagen' ? '' : 'none';
    texto.style.display = PRE.fuente === 'imagen' ? 'none' : '';
    texto.placeholder = PRE.fuente === 'menu' ? 'Si el menú no tiene logo: nombre del sitio' : 'Nombre del sitio';
    mini.style.backgroundImage = PRE.logo ? `url("${PRE.logo.replace(/"/g, '%22')}")` : '';
    mini.textContent = PRE.logo ? '' : 'Sin imagen';
    const menu = marcaDelMenu(htmlPagina());
    $('#pl-fuente-info').textContent = PRE.fuente === 'menu'
      ? (menu ? (menu.img ? 'Se usa la imagen del logo del menú.' : `Se usa el texto del menú: «${menu.texto}».`) : 'Esta página no tiene menú con logo: se muestra el texto.')
      : PRE.fuente === 'imagen' && !PRE.logo ? 'Elige la imagen (PNG o SVG con fondo transparente se ven mejor).' : '';
  };
  const guardar = () => { pintar(); editor.store(); };

  activo.onchange = () => { PRE.activo = activo.checked; guardar(); if (PRE.activo) probar(); };
  fuente.onchange = () => { PRE.fuente = fuente.value; guardar(); if (PRE.fuente === 'imagen' && !PRE.logo) elegir(); };
  texto.onchange = () => { PRE.texto = texto.value.trim().slice(0, 80); guardar(); };
  anim.onchange = () => { PRE.anim = anim.value; guardar(); probar(); };
  salida.onchange = () => { PRE.salida = salida.value; guardar(); probar(); };
  fondo.onchange = () => { PRE.fondo = fondo.value; guardar(); };
  color.onchange = () => { PRE.color = color.value; guardar(); };
  minimo.oninput = () => { minimoV.textContent = seg(+minimo.value); };
  minimo.onchange = () => { PRE.minimo = +minimo.value; guardar(); };
  unaVez.onchange = () => { PRE.unaVez = unaVez.checked; guardar(); };

  // La imagen se elige del administrador de imágenes (o se sube ahí)
  const elegir = () => {
    editor.AssetManager.open({
      types: ['image'],
      select(asset, completo) {
        const src = asset.getSrc ? asset.getSrc() : asset.get('src');
        if (!/^(data:image\/|https?:\/\/)/i.test(src || '')) { toast('Esa imagen no se puede usar como logo'); return; }
        PRE.logo = src; PRE.fuente = 'imagen'; guardar();
        if (completo !== false) editor.AssetManager.close();
        probar();
      }
    });
  };
  $('#pl-elegir').onclick = elegir;

  // «Ver cómo queda»: se muestra un momento sobre el lienzo y sale con su efecto
  let enCurso = null;
  function probar() {
    let doc;
    try { doc = editor.Canvas.getDocument(); } catch (e) { return; }
    if (!doc || !doc.body) return;
    if (enCurso) enCurso();
    let css = doc.getElementById('pl-prueba-css');
    if (!css) { css = doc.createElement('style'); css.id = 'pl-prueba-css'; doc.head.appendChild(css); }
    css.textContent = CSS_PRECARGA;
    const tmp = doc.createElement('div');
    tmp.innerHTML = marcadoPrecarga(htmlPagina(), 'previa');
    const el = tmp.firstElementChild;
    el.id = 'pl-prueba';
    doc.body.appendChild(el);
    const t1 = setTimeout(() => el.classList.add('pl-saliendo'), Math.max(PRE.minimo, 1600));
    const t2 = setTimeout(() => quitar(), Math.max(PRE.minimo, 1600) + 1300);
    const quitar = () => { clearTimeout(t1); clearTimeout(t2); el.remove(); enCurso = null; };
    enCurso = quitar;
  }
  $('#pl-probar').onclick = probar;

  editor.on('load proyecto:abierto', () => setTimeout(pintar, 300));
  $$('.tabs[data-group=left] button[data-tab=sitio]').forEach(b => b.addEventListener('click', pintar));
  pintar();
})();
