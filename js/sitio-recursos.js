/* =====================================================================
   Sitio web: tipografías de Google, CSS base y JS base
   (site.css y site.js se incluyen en el lienzo y en el ZIP exportado)
===================================================================== */
const FUENTES = [
  { nombre: 'Montserrat',         gf: 'Montserrat:wght@300;400;500;600;700',           css: "'Montserrat', sans-serif" },
  { nombre: 'Playfair Display',   gf: 'Playfair+Display:ital,wght@0,400;0,600;0,700;1,400', css: "'Playfair Display', serif" },
  { nombre: 'Poppins',            gf: 'Poppins:wght@300;400;500;600;700',              css: "'Poppins', sans-serif" },
  { nombre: 'Lora',               gf: 'Lora:ital,wght@0,400;0,600;1,400',              css: "'Lora', serif" },
  { nombre: 'Raleway',            gf: 'Raleway:wght@300;400;600;700',                  css: "'Raleway', sans-serif" },
  { nombre: 'Open Sans',          gf: 'Open+Sans:wght@300;400;600;700',                css: "'Open Sans', sans-serif" },
  { nombre: 'Roboto',             gf: 'Roboto:wght@300;400;500;700',                   css: "'Roboto', sans-serif" },
  { nombre: 'Merriweather',       gf: 'Merriweather:wght@300;400;700',                 css: "'Merriweather', serif" },
  { nombre: 'Cormorant Garamond', gf: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400', css: "'Cormorant Garamond', serif" },
  { nombre: 'DM Serif Display',   gf: 'DM+Serif+Display',                              css: "'DM Serif Display', serif" },
  { nombre: 'Inter',              gf: 'Inter:wght@300;400;500;600',                    css: "'Inter', sans-serif" },
  { nombre: 'Nunito',             gf: 'Nunito:wght@300;400;600;700',                   css: "'Nunito', sans-serif" },
  { nombre: 'Oswald',             gf: 'Oswald:wght@300;400;600',                       css: "'Oswald', sans-serif" }
];
const gfUrl = (lista) => 'https://fonts.googleapis.com/css2?' + lista.map(f => 'family=' + f.gf).join('&') + '&display=swap';

const SITE_CSS = `
:root{
  --sitio-primario:#3b5bdb;
  --sitio-osc:#1b2559;
  --sitio-claro:#f4f6fb;
  --sitio-acento:#f59f00;
  --sitio-fondo:#ffffff;
  --sitio-radio:1rem;
  --fuente-texto:'Montserrat',system-ui,-apple-system,'Segoe UI',sans-serif;
  --fuente-titulos:'Playfair Display',Georgia,serif;
}
html{scroll-behavior:smooth}
/* Al saltar a un ancla, deja aire para que el menú fijo no tape el titular */
[id]{scroll-margin-top:92px}
@media (max-width:991.98px){[id]{scroll-margin-top:76px}}
body{font-family:var(--fuente-texto);color:#2b2b2b;background:var(--sitio-fondo);-webkit-font-smoothing:antialiased}
.font-titulo{font-family:var(--fuente-titulos);font-weight:600;letter-spacing:.01em}
.font-texto{font-family:var(--fuente-texto)}
.eyebrow{display:inline-block;letter-spacing:.32em;text-transform:uppercase;font-size:.72rem;font-weight:600;color:var(--sitio-acento)}
.seccion{padding:5.5rem 0}
.fondo-claro{background-color:var(--sitio-claro)}
.fondo-osc{background-color:var(--sitio-osc);color:#fff}
.texto-acento{color:var(--sitio-acento)}
.texto-primario{color:var(--sitio-primario)}

/* Botones */
.btn-sitio,.btn-sitio-claro,.btn-sitio-borde{display:inline-block;border-radius:50rem;padding:.8rem 1.9rem;font-size:.78rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;border:2px solid transparent;transition:all .3s ease;cursor:pointer}
.btn-sitio{background:var(--sitio-primario);border-color:var(--sitio-primario);color:#fff}
.btn-sitio:hover{background:var(--sitio-osc);border-color:var(--sitio-osc);color:#fff}
.btn-sitio-claro{background:#fff;border-color:#fff;color:var(--sitio-osc)}
.btn-sitio-claro:hover{background:transparent;color:#fff}
.btn-sitio-borde{background:transparent;border-color:#fff;color:#fff}
.btn-sitio-borde:hover{background:#fff;color:var(--sitio-osc)}

/* Menú transparente que se vuelve sólido al bajar */
.nav-transparente{padding:1rem 0;transition:background-color .35s,box-shadow .35s,padding .35s;background:linear-gradient(rgba(0,0,0,.6),rgba(0,0,0,0))}
.nav-transparente.nav-solido{background:var(--sitio-osc);box-shadow:0 4px 18px rgba(0,0,0,.25);padding:.55rem 0}
.nav-transparente .navbar-brand{font-family:var(--fuente-titulos);font-size:1.5rem;font-weight:700;letter-spacing:.04em;color:#fff}
.nav-transparente .nav-link{color:rgba(255,255,255,.88);font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:.5rem .65rem;white-space:nowrap;border-bottom:2px solid transparent}
.nav-transparente .nav-link:hover,.nav-transparente .nav-link.active{color:#fff}
.nav-transparente .nav-link.active{border-bottom-color:var(--sitio-acento)}
@media (max-width:1199.98px){
  .nav-transparente .navbar-collapse{background:var(--sitio-osc);margin-top:.75rem;padding:1rem;border-radius:.75rem}
  .nav-transparente .nav-link.active{border-bottom-color:transparent;color:var(--sitio-acento)}
}
.barra-superior{background:var(--sitio-osc);color:rgba(255,255,255,.85);font-size:.78rem;padding:.5rem 0}
.barra-superior a{color:inherit;text-decoration:none;margin-left:1rem}

/* Hero y capas de color */
.hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;overflow:hidden;background-size:cover;background-position:center;background-color:var(--sitio-osc)}
.hero-interno{min-height:55vh}
.hero-video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0}
iframe.hero-video{top:50%;left:50%;width:100vw;height:56.25vw;min-width:177.78vh;min-height:100%;transform:translate(-50%,-50%) scale(1.2);border:0;pointer-events:none}
iframe.hero-video[src*="youtube"]{opacity:0;transition:opacity .8s ease}
iframe.hero-video[src*="youtube"].yt-ve{opacity:1}
.overlay{position:absolute;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,.45);z-index:1}
.hero-contenido{position:relative;z-index:2;max-width:880px;padding:7rem 1.5rem 5rem}
.hero h1{font-family:var(--fuente-titulos);font-weight:600;font-size:clamp(2.4rem,5.5vw,4.6rem);line-height:1.1;text-shadow:0 2px 24px rgba(0,0,0,.35)}
.hero .lead{font-size:clamp(1rem,1.6vw,1.25rem);font-weight:300}
.scroll-hint{display:inline-flex;flex-direction:column;align-items:center;gap:.4rem;color:#fff;text-decoration:none;font-size:.72rem;letter-spacing:.25em;text-transform:uppercase;opacity:.85}
.scroll-hint i{animation:rebote 1.8s infinite}
@keyframes rebote{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}

/* Tarjetas con imagen */
.tarjeta-img{position:relative;overflow:hidden;border-radius:var(--sitio-radio);aspect-ratio:3/4;color:#fff;background:var(--sitio-osc)}
.tarjeta-img.horizontal{aspect-ratio:4/3}
.tarjeta-img img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;transition:transform .9s ease}
.tarjeta-img:hover img{transform:scale(1.07)}
.tarjeta-img .tarjeta-cuerpo{position:absolute;left:0;right:0;bottom:0;padding:1.6rem 1.4rem;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.78))}
.tarjeta-img h3,.tarjeta-img h4{font-family:var(--fuente-titulos);margin-bottom:.35rem}
.tarjeta-img .stretched-link{color:#fff;font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.6)}

/* Secciones */
.img-redondeada{border-radius:calc(var(--sitio-radio) * 1.25);width:100%;aspect-ratio:4/3;object-fit:cover;box-shadow:0 20px 50px rgba(0,0,0,.18)}
.parallax{position:relative;background-size:cover;background-position:center;background-repeat:no-repeat;color:#fff;background-color:var(--sitio-osc)}
@media (min-width:992px){.parallax{background-attachment:fixed}}
.dato{font-family:var(--fuente-titulos);font-size:clamp(2.4rem,4vw,3.6rem);line-height:1;color:var(--sitio-acento)}
.cita-texto{font-family:var(--fuente-titulos);font-style:italic;font-size:clamp(1.25rem,2.4vw,1.9rem);line-height:1.5;max-width:820px;margin:0 auto}
.cita-autor{letter-spacing:.3em;text-transform:uppercase;font-size:.8rem;font-weight:700;color:var(--sitio-acento)}
.carousel-citas .carousel-control-prev-icon,.carousel-citas .carousel-control-next-icon{filter:invert(1)}
.testimonio{margin:0;background:#fff;border-radius:var(--sitio-radio);padding:2rem;height:100%;box-shadow:0 8px 30px rgba(0,0,0,.06)}
.testimonio .estrellas{color:var(--sitio-acento);letter-spacing:.15em}
.avatar{width:52px;height:52px;border-radius:50%;object-fit:cover}
.producto{border-radius:var(--sitio-radio);overflow:hidden;box-shadow:0 10px 35px rgba(0,0,0,.09);height:100%;background:#fff}
.producto .foto{overflow:hidden}
.producto img{aspect-ratio:4/3;object-fit:cover;width:100%;display:block;transition:transform .8s}
.producto:hover img{transform:scale(1.05)}
.servicios i{color:var(--sitio-primario);margin-right:.3rem}
.servicios span{margin-right:.9rem;white-space:nowrap}
.newsletter .form-control{border-radius:50rem;padding:.8rem 1.4rem;border:0}
.barra-rapida{background:#fff;box-shadow:0 10px 40px rgba(0,0,0,.12);padding:1.5rem 0;position:relative;z-index:5}

/* Pie de página */
.pie{position:relative;color:rgba(255,255,255,.82);background-size:cover;background-position:center;background-color:var(--sitio-osc)}
.pie .overlay{background:rgba(13,18,48,.88)}
.pie a{color:rgba(255,255,255,.82);text-decoration:none}
.pie a:hover{color:#fff}
.pie h5,.pie .pie-titulo{font-family:var(--fuente-titulos);color:#fff;margin-bottom:1rem}
.pie ul{list-style:none;padding:0;margin:0}
.pie address{font-style:normal}
.pie li{margin-bottom:.5rem}
.pie .redes a{display:inline-flex;width:40px;height:40px;border:1px solid rgba(255,255,255,.35);border-radius:50%;align-items:center;justify-content:center;margin-left:.4rem;transition:all .3s}
.pie .redes a:hover{background:var(--sitio-acento);border-color:var(--sitio-acento)}

/* Galería y botón flotante */
.galeria-item{margin:0;overflow:hidden;border-radius:.75rem;aspect-ratio:1/1}
.galeria-item img{width:100%;height:100%;object-fit:cover;cursor:zoom-in;transition:transform .6s ease}
.galeria-item:hover img{transform:scale(1.08)}
.lb{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:2rem}
.lb img{max-width:100%;max-height:100%;border-radius:.5rem}
/* En pantallas angostas el espacio grande entre columnas (g-5) se salía de la pantalla */
@media (max-width:767.98px){.row.g-5,.row.gx-5{--bs-gutter-x:1.5rem}}
.whatsapp-flotante{position:fixed;right:22px;bottom:22px;width:58px;height:58px;border-radius:50%;background:#25d366;color:#fff;font-size:30px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.3);z-index:1030;text-decoration:none;transition:transform .3s}
.whatsapp-flotante:hover{transform:scale(1.1);color:#fff}

/* Pista deslizable con scroll-snap (tarjetas que se detienen alineadas) */
.pista-wrap{position:relative}
.pista{display:flex;gap:1.25rem;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding:.25rem .25rem 1.5rem;scrollbar-width:thin}
.pista>*{flex:0 0 clamp(220px,74vw,300px);scroll-snap-align:start}
.pista-bots{display:flex;gap:.5rem;flex:none}
.pista-bots button{width:40px;height:40px;border-radius:50%;border:1px solid rgba(0,0,0,.16);background:#fff;color:#2b2b2b;cursor:pointer;font-size:1.1rem;line-height:1;transition:all .25s}
.pista-bots button:hover{border-color:var(--sitio-primario);color:var(--sitio-primario)}
.fondo-osc .pista-bots button{background:transparent;border-color:rgba(255,255,255,.4);color:#fff}

/* Cinta de logos de prensa (bucle continuo) */
.cinta-marco{overflow:hidden;padding:1.75rem 0;border-top:1px solid rgba(0,0,0,.08);border-bottom:1px solid rgba(0,0,0,.08)}
.fondo-osc .cinta-marco{border-color:rgba(255,255,255,.14)}
.cinta{display:flex;gap:3.5rem;width:max-content;animation:cinta-desliza 32s linear infinite}
.cinta span{font-family:var(--fuente-titulos);font-size:1.05rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;white-space:nowrap;opacity:.55}
@keyframes cinta-desliza{to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.cinta{animation:none}.cinta-marco{overflow-x:auto}}

/* Animaciones al aparecer (solo si el navegador las admite; se activan con data-reveal) */
.js-reveal [data-reveal]:not([data-reveal=""]){opacity:0;transition:opacity .9s ease,transform .9s ease;will-change:opacity,transform}
.js-reveal [data-reveal="fade-up"]{transform:translateY(32px)}
.js-reveal [data-reveal="fade-left"]{transform:translateX(-40px)}
.js-reveal [data-reveal="fade-right"]{transform:translateX(40px)}
.js-reveal [data-reveal="zoom"]{transform:scale(.94)}
.js-reveal [data-reveal].visible{opacity:1;transform:none}
`;

const HEAD_JS = "if('IntersectionObserver' in window&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))document.documentElement.classList.add('js-reveal');";

const SITE_JS = `(function(){
  var d=document;
  var nav=d.querySelector('.nav-transparente');
  if(nav){
    var f=function(){ nav.classList.toggle('nav-solido', window.scrollY>40); };
    f();
    window.addEventListener('scroll',f,{passive:true});
  }
  var els=[].slice.call(d.querySelectorAll('[data-reveal]:not([data-reveal=""])'));
  if(els.length){
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(en){
        en.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add('visible'); io.unobserve(x.target); } });
      },{threshold:0.12});
      els.forEach(function(el){ io.observe(el); });
    }else{
      els.forEach(function(el){ el.classList.add('visible'); });
    }
  }
  /* Botones que saltan a una sección: un <button> no navega solo. */
  d.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('[data-ir-a]'):null;
    if(!b) return;
    var sel=b.getAttribute('data-ir-a');
    if(!sel) return;
    if(sel.charAt(0)!=='#'){ e.preventDefault(); location.href=sel; return; }
    var dest=null;
    try{ dest=d.querySelector(sel); }catch(err){ dest=null; }
    if(!dest) return;
    e.preventDefault();
    dest.scrollIntoView({behavior:'smooth',block:'start'});
    if(history.replaceState) history.replaceState(null,'',sel);
  });
  /* Cierra el menú desplegado en móvil al saltar a una sección */
  d.addEventListener('click',function(e){
    var a=e.target.closest?e.target.closest('a[href^="#"]'):null;
    if(!a||a.getAttribute('href')==='#') return;
    var abierto=d.querySelector('.navbar-collapse.show');
    if(abierto&&abierto.contains(a)&&window.bootstrap&&window.bootstrap.Collapse){
      window.bootstrap.Collapse.getOrCreateInstance(abierto).hide();
    }
  });
  d.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('[data-pista]'):null;
    if(!b) return;
    var wrap=b.closest('.pista-wrap'); if(!wrap) return;
    var pista=wrap.querySelector('.pista'); if(!pista) return;
    var primera=pista.firstElementChild;
    var paso=primera?primera.getBoundingClientRect().width+20:300;
    pista.scrollBy({left:(b.getAttribute('data-pista')==='ant'?-paso:paso),behavior:'smooth'});
  });
  d.addEventListener('click',function(e){
    var img=e.target.closest?e.target.closest('.galeria-lightbox img'):null;
    if(!img) return;
    var lb=d.createElement('div');
    lb.className='lb';
    var big=d.createElement('img');
    big.src=img.currentSrc||img.src;
    big.alt=img.alt||'';
    lb.appendChild(big);
    var key=function(ev){ if(ev.key==='Escape') close(); };
    var close=function(){ if(lb.parentNode) lb.parentNode.removeChild(lb); d.removeEventListener('keydown',key); };
    lb.addEventListener('click',close);
    d.addEventListener('keydown',key);
    d.body.appendChild(lb);
  });
  (${bucleFondoYT})(window);
})();
`;

/* Video de fondo de YouTube: al terminar, YouTube muestra recuadros con otros
   videos antes de repetir. Se habla con el reproductor por postMessage
   (enablejsapi=1) y se vuelve al inicio un poco antes del final, así esos
   recuadros nunca aparecen. Además, mientras carga YouTube muestra sus botones
   (anterior, pausa, siguiente): el video queda invisible (se ve la imagen del
   hero) y aparece con un fundido solo cuando ya se está reproduciendo.
   Va en site.js y también se usa en el lienzo. */
function bucleFondoYT(w) {
  var d = w.document;
  var esFondoYT = function (f) { return f && f.tagName === 'IFRAME' && f.classList.contains('hero-video') && /youtube(-nocookie)?\.com\/embed\//.test(f.src); };
  var fondos = function () { return [].filter.call(d.querySelectorAll('iframe.hero-video'), esFondoYT); };
  var enviar = function (f, msg) { try { f.contentWindow.postMessage(JSON.stringify(msg), '*'); } catch (e) {} };
  // El reproductor solo responde si se le avisa cuando ya está listo: se repite
  // el aviso (como hace la API oficial de YouTube) hasta que conteste.
  var mostrar = function (f, si) {
    clearTimeout(f._fundido);
    if (si) f._fundido = setTimeout(function () { f.classList.add('yt-ve'); }, 600);
    else f.classList.remove('yt-ve');
  };
  var escuchar = function (f) {
    clearInterval(f._avisos);
    f._listo = false;
    // Se oculta solo si cambió el video: el «load» puede llegar después de que
    // YouTube ya avisó que reproduce, y no lo vuelve a avisar.
    if (f._srcVisto !== f.src) { f._srcVisto = f.src; f._estado = null; mostrar(f, false); }
    // Si el reproductor nunca informa su estado (sin la API), se muestra igual a los 6 s
    clearTimeout(f._respaldo);
    f._respaldo = setTimeout(function () { if (f._estado == null) mostrar(f, true); }, 6000);
    var n = 0;
    f._avisos = setInterval(function () {
      if (f._listo || ++n > 60 || !f.isConnected) { clearInterval(f._avisos); return; }
      enviar(f, { event: 'listening', id: 1, channel: 'widget' });
    }, 250);
  };
  // Videos guardados antes de este cambio: se les activa la API
  fondos().forEach(function (f) {
    if (!/[?&]enablejsapi=1/.test(f.src)) f.src += (f.src.indexOf('?') < 0 ? '?' : '&') + 'enablejsapi=1';
    else escuchar(f);
  });
  // load no burbujea, pero se captura: sirve también para iframes que se agregan después
  d.addEventListener('load', function (e) { if (esFondoYT(e.target)) escuchar(e.target); }, true);
  var alRecibir = function (e) {
    if (!/youtube/.test(e.origin)) return;
    var m; try { m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    var f = fondos().filter(function (x) { return x.contentWindow === e.source; })[0];
    if (!f || !m) return;
    f._listo = true;
    // Estados de YouTube: 1 reproduciendo; -1, 0, 2 y 5 sin reproducir (botones a la vista)
    var estado = m.event === 'onStateChange' ? m.info : (m.info && typeof m.info.playerState === 'number' ? m.info.playerState : null);
    if (estado !== null) f._estado = estado;
    if (estado === 1) mostrar(f, true);
    else if (estado === -1 || estado === 0 || estado === 2 || estado === 5) mostrar(f, false);
    if (!m.info) return;
    if (m.info.duration) f._duracion = m.info.duration;
    var t = m.info.currentTime;
    if (m.info.playerState === 0 || (f._duracion && typeof t === 'number' && f._duracion - t < 1.2)) {
      enviar(f, { event: 'command', func: 'seekTo', args: [0, true] });
      enviar(f, { event: 'command', func: 'playVideo', args: [] });
    }
  };
  // YouTube contesta a la ventana que envió el aviso: en el sitio es la misma
  // página; en el editor, la ventana del editor y no la del lienzo.
  w.addEventListener('message', alRecibir);
  if (window !== w) window.addEventListener('message', alRecibir);
}

/* =====================================================================
   Identidad visual del sitio
   Reescribe las variables de :root de site.css. Un solo valor repercute
   en botones, títulos, fondos, tarjetas y pie, tanto en el lienzo del
   editor como en el ZIP exportado.
===================================================================== */
const TEMA_CLAVE = 'bs5-editor-tema';
const TEMA_DEF = {
  primario: '#3b5bdb', osc: '#1b2559', claro: '#f4f6fb', acento: '#f59f00', fondo: '#ffffff',
  titulos: 'Playfair Display', texto: 'Montserrat', radio: 16
};
let TEMA = { ...TEMA_DEF };
try {
  const g = localStorage.getItem(TEMA_CLAVE);
  if (g) TEMA = { ...TEMA_DEF, ...JSON.parse(g) };
} catch (e) { /* almacenamiento bloqueado: se usa el tema por defecto */ }

const fuentePorNombre = (n) => FUENTES.find(f => f.nombre === n) || FUENTES[0];
const temaFuentes = () => [...new Set([fuentePorNombre(TEMA.titulos), fuentePorNombre(TEMA.texto)])];
const temaCss = () => `:root{`
  + `--sitio-primario:${TEMA.primario};`
  + `--sitio-osc:${TEMA.osc};`
  + `--sitio-claro:${TEMA.claro};`
  + `--sitio-acento:${TEMA.acento};`
  + `--sitio-fondo:${TEMA.fondo};`
  + `--sitio-radio:${TEMA.radio}px;`
  + `--fuente-titulos:${fuentePorNombre(TEMA.titulos).css};`
  + `--fuente-texto:${fuentePorNombre(TEMA.texto).css}`
  + `}`;

const TEMA_PRESETS = [
  { nombre: 'Azul corporativo', primario: '#3b5bdb', osc: '#1b2559', claro: '#f4f6fb', acento: '#f59f00', fondo: '#ffffff', titulos: 'Playfair Display', texto: 'Montserrat', radio: 16 },
  { nombre: 'Selva', primario: '#0e6e66', osc: '#102a24', claro: '#f1f6f3', acento: '#d2a03c', fondo: '#ffffff', titulos: 'Lora', texto: 'Raleway', radio: 20 },
  { nombre: 'Tierra', primario: '#a8533a', osc: '#2f1d16', claro: '#faf4ee', acento: '#c9962f', fondo: '#fffdf8', titulos: 'Cormorant Garamond', texto: 'Nunito', radio: 8 },
  { nombre: 'Noche', primario: '#6c5ce7', osc: '#12121c', claro: '#f3f2fa', acento: '#00cec9', fondo: '#ffffff', titulos: 'DM Serif Display', texto: 'Inter', radio: 24 },
  { nombre: 'Océano', primario: '#0a7ea4', osc: '#0b2a3a', claro: '#eef6fa', acento: '#f4a261', fondo: '#ffffff', titulos: 'Merriweather', texto: 'Open Sans', radio: 14 },
  { nombre: 'Editorial', primario: '#111111', osc: '#1a1a1a', claro: '#f5f5f3', acento: '#c0392b', fondo: '#fcfcfa', titulos: 'Oswald', texto: 'Roboto', radio: 0 }
];
