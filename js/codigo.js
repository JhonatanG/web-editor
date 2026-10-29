/* =====================================================================
   Visor de código
   Pestañas con el HTML, el CSS y el JavaScript de la página actual (lo
   mismo que va en el ZIP), y dos tutores que leen ESA página y explican:
   - cómo funciona el JavaScript del sitio, parte por parte;
   - qué hace el CSS para que el diseño se adapte a móvil, tablet y escritorio.
===================================================================== */

/* ---------- Ayudantes ---------- */
// Bloque de código pequeño para los tutores (sin resaltado: se lee mejor así)
const bloqueCodigo = (txt) => `<pre class="cod-pre"><code>${SIN_HTML(txt.trim())}</code></pre>`;
const contar = (txt, re) => (txt.match(re) || []).length;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Puntos de quiebre de Bootstrap 5: desde qué ancho de pantalla se aplica cada prefijo
const PUNTOS_BS = {
  sm:  { px: 576,  nombre: 'móvil horizontal' },
  md:  { px: 768,  nombre: 'tablet' },
  lg:  { px: 992,  nombre: 'portátil' },
  xl:  { px: 1200, nombre: 'escritorio' },
  xxl: { px: 1400, nombre: 'pantalla grande' }
};
const desde = (bp) => `desde ${PUNTOS_BS[bp].px}px (${PUNTOS_BS[bp].nombre})`;

/* =====================================================================
   1. Tutor de JavaScript
   Cada parte de site.js: qué hace, cómo lo hace y si esta página la usa.
===================================================================== */
const PARTES_JS = [
  {
    titulo: 'La envoltura: una función que se ejecuta sola',
    siempre: true,
    que: 'Todo site.js está dentro de una función que se llama a sí misma al cargar la página. Así sus variables (<code>d</code>, <code>nav</code>, <code>els</code>…) no chocan con las de otros scripts, como Bootstrap.',
    como: 'Los paréntesis del final <code>()</code> ejecutan la función en cuanto el navegador la lee. El script va al final del <code>&lt;body&gt;</code>, así que cuando corre, todo el HTML ya existe y se puede buscar con <code>querySelector</code>.',
    codigo: `(function(){
  var d = document;      // atajo para no escribir "document" cada vez
  // ... todo el código del sitio ...
})();                    // <- estos paréntesis la ejecutan`,
    concepto: 'IIFE (función autoejecutable) y ámbito de variables.'
  },
  {
    titulo: 'Menú transparente que se vuelve sólido al bajar',
    usa: (h) => contar(h, /nav-transparente/g),
    unidad: ['menú', 'menús'],
    que: 'Arriba de todo el menú es transparente, encima del hero. Al bajar más de 40px se le pone fondo para que se siga leyendo sobre el contenido.',
    como: 'Escucha el evento <code>scroll</code> de la ventana y, cada vez que cambia, mira cuánto se bajó (<code>window.scrollY</code>). <code>classList.toggle(clase, condición)</code> pone la clase si la condición es verdadera y la quita si es falsa. El CSS de <code>.nav-solido</code> hace el resto. <code>{passive:true}</code> le dice al navegador que no vamos a bloquear el desplazamiento, así no se traba en el móvil.',
    codigo: `var nav = d.querySelector('.nav-transparente');
if (nav) {
  var f = function(){
    nav.classList.toggle('nav-solido', window.scrollY > 40);
  };
  f();                                   // estado correcto al cargar
  window.addEventListener('scroll', f, {passive:true});
}`,
    concepto: 'Eventos, classList y separar estilo (CSS) de comportamiento (JS).'
  },
  {
    titulo: 'Animaciones al aparecer',
    usa: (h) => contar(h, /data-reveal="(?!")[^"]+"/g),
    unidad: ['elemento animado', 'elementos animados'],
    que: 'Los elementos con «Animación al aparecer» (atributo <code>data-reveal</code>) empiezan invisibles y entran suavemente cuando llegan a la pantalla al bajar.',
    como: 'Un <code>IntersectionObserver</code> vigila los elementos y avisa cuando al menos el 12% de uno es visible (<code>threshold:0.12</code>). Entonces le pone la clase <code>visible</code>; la transición está en el CSS. Con <code>unobserve</code> deja de vigilarlo: la animación pasa una sola vez. Antes, un script en el <code>&lt;head&gt;</code> pone la clase <code>js-reveal</code> en <code>&lt;html&gt;</code> solo si el navegador puede animar y la persona no pidió «reducir movimiento»: si el JavaScript falla, el contenido nunca se queda oculto.',
    codigo: `var io = new IntersectionObserver(function(entradas){
  entradas.forEach(function(x){
    if (x.isIntersecting) {
      x.target.classList.add('visible');  // el CSS hace la animación
      io.unobserve(x.target);             // solo la primera vez
    }
  });
}, {threshold: 0.12});
els.forEach(function(el){ io.observe(el); });`,
    concepto: 'IntersectionObserver y mejora progresiva (sin JS, todo se ve igual).'
  },
  {
    titulo: 'Botones que llevan a una sección o a otra página',
    usa: (h) => contar(h, /data-ir-a=/g),
    unidad: ['botón', 'botones'],
    que: 'Un <code>&lt;button&gt;</code> no navega solo como un enlace. Cuando en el editor eliges «Ir a» en un botón, se le pone <code>data-ir-a</code> y este código hace el salto.',
    como: 'En vez de poner un evento en cada botón, escucha <strong>un solo</strong> <code>click</code> en todo el documento y con <code>closest(\'[data-ir-a]\')</code> averigua si el clic fue dentro de uno de esos botones (delegación de eventos: sirve también para botones que se agreguen después). Si el destino es <code>#seccion</code>, baja suavemente con <code>scrollIntoView</code> y actualiza la dirección con <code>history.replaceState</code>; si es otra página, cambia <code>location.href</code>.',
    codigo: `d.addEventListener('click', function(e){
  var b = e.target.closest('[data-ir-a]');
  if (!b) return;                         // el clic no fue en un botón así
  var sel = b.getAttribute('data-ir-a');
  if (sel.charAt(0) !== '#') { location.href = sel; return; }
  d.querySelector(sel).scrollIntoView({behavior:'smooth', block:'start'});
});`,
    concepto: 'Delegación de eventos, atributos data-* y la API History.'
  },
  {
    titulo: 'Cerrar el menú del móvil al elegir una opción',
    usa: (h) => contar(h, /navbar-collapse/g),
    unidad: ['menú plegable', 'menús plegables'],
    que: 'En el móvil el menú se abre con la hamburguesa. Si tocas una opción que lleva a una sección de la misma página, el menú se cierra solo para que veas adónde llegaste.',
    como: 'Escucha los clics en enlaces que empiezan con <code>#</code>. Si el enlace está dentro del menú abierto (<code>.navbar-collapse.show</code>), usa la API de Bootstrap <code>bootstrap.Collapse</code> para cerrarlo con su animación.',
    codigo: `var abierto = d.querySelector('.navbar-collapse.show');
if (abierto && abierto.contains(a)) {
  bootstrap.Collapse.getOrCreateInstance(abierto).hide();
}`,
    concepto: 'Usar la API de JavaScript de Bootstrap desde tu propio código.'
  },
  {
    titulo: 'Carrusel de tarjetas con flechas',
    usa: (h) => contar(h, /data-pista=/g),
    unidad: ['flecha', 'flechas'],
    que: 'Las flechas de una fila de tarjetas desplazable mueven la fila una tarjeta a la izquierda o a la derecha.',
    como: 'Mide el ancho de la primera tarjeta con <code>getBoundingClientRect()</code> (más 20px de separación) y desplaza el contenedor esa distancia con <code>scrollBy</code>. Si la flecha es «ant», el número va en negativo. En el móvil también se puede deslizar con el dedo porque es un desplazamiento normal del navegador.',
    codigo: `var paso = primera.getBoundingClientRect().width + 20;
pista.scrollBy({
  left: (b.getAttribute('data-pista') === 'ant' ? -paso : paso),
  behavior: 'smooth'
});`,
    concepto: 'Medir elementos y desplazar con scrollBy.'
  },
  {
    titulo: 'Galería con ampliación (lightbox)',
    usa: (h) => contar(h, /galeria-lightbox/g),
    unidad: ['galería', 'galerías'],
    que: 'Al hacer clic en una foto de la galería se abre en grande sobre la página; se cierra con un clic o con la tecla Esc.',
    como: 'Crea los elementos desde JavaScript con <code>createElement</code> (un fondo <code>.lb</code> y una imagen grande), los añade al <code>&lt;body&gt;</code> y, al cerrar, los quita. <code>currentSrc</code> toma la versión de la imagen que el navegador eligió. El evento de teclado se quita al cerrar (<code>removeEventListener</code>) para no acumular escuchas.',
    codigo: `var lb = d.createElement('div');
lb.className = 'lb';
var big = d.createElement('img');
big.src = img.currentSrc || img.src;
lb.appendChild(big);
lb.addEventListener('click', close);
d.body.appendChild(lb);`,
    concepto: 'Crear y quitar elementos del DOM.'
  },
  {
    titulo: 'Video de fondo de YouTube sin interrupciones',
    usa: (h) => contar(h, /<iframe[^>]*hero-video[^>]*youtube|<iframe[^>]*youtube[^>]*hero-video/g),
    unidad: ['video de fondo', 'videos de fondo'],
    que: 'Al terminar un video, YouTube muestra recuadros con otros videos. Este código vuelve el video al inicio un poco antes del final, así esos recuadros nunca aparecen.',
    como: 'El reproductor está en otro sitio (un <code>&lt;iframe&gt;</code>), así que no se puede tocar directamente: se le habla con <code>postMessage</code>, mensajes de texto en JSON entre ventanas. Primero se le avisa que queremos escuchar (<code>listening</code>) y él contesta varias veces por segundo con el tiempo actual (<code>currentTime</code>). Cuando faltan menos de 1,2 segundos, se le envía la orden <code>seekTo(0)</code>.',
    codigo: `// pedirle al reproductor que nos cuente su estado
f.contentWindow.postMessage(JSON.stringify(
  {event:'listening', id:1, channel:'widget'}), '*');

window.addEventListener('message', function(e){
  var m = JSON.parse(e.data);
  if (duracion - m.info.currentTime < 1.2) {
    enviar(f, {event:'command', func:'seekTo', args:[0, true]});
  }
});`,
    concepto: 'Comunicación entre ventanas con postMessage.'
  }
];

// Componentes de Bootstrap que funcionan solo con atributos data-bs-*
const BS_DATA = {
  collapse: 'abre y cierra el menú hamburguesa o los acordeones',
  dropdown: 'despliega menús de opciones',
  modal: 'abre ventanas emergentes',
  tab: 'cambia de pestaña',
  pill: 'cambia de pestaña (estilo píldora)',
  offcanvas: 'abre paneles laterales',
  tooltip: 'muestra textos de ayuda',
  carousel: 'pasa las diapositivas del carrusel'
};

function tutorJs(html, jsPagina) {
  const usados = [], noUsados = [];
  PARTES_JS.forEach(p => {
    const n = p.siempre ? 1 : p.usa(html);
    (n ? usados : noUsados).push({ p, n });
  });
  const tarjeta = ({ p, n }, activo) => `
    <div class="tut-card ${activo ? '' : 'apagada'}">
      <div class="tut-h"><span>${p.titulo}</span>
        <span class="tut-tag ${activo ? 'si' : ''}">${activo ? (p.siempre ? 'Siempre' : 'En esta página: ' + plural(n, ...p.unidad)) : 'No se usa en esta página'}</span></div>
      <p><b>¿Qué hace?</b> ${p.que}</p>
      <p><b>¿Cómo lo hace?</b> ${p.como}</p>
      ${bloqueCodigo(p.codigo)}
      <p class="tut-concepto"><i class="bi bi-mortarboard"></i> Concepto: ${p.concepto}</p>
    </div>`;

  const tipos = {};
  (html.match(/data-bs-(?:toggle|ride)="([a-z]+)"/g) || []).forEach(m => {
    const t = m.match(/"([a-z]+)"/)[1];
    tipos[t] = (tipos[t] || 0) + 1;
  });
  const bs = Object.entries(tipos);

  return `
    <p class="tut-intro">El sitio usa JavaScript en tres capas: <b>Bootstrap</b> (menús, carruseles, modales), <b>site.js</b> (lo propio de este editor) y, si los agregaste, tus scripts del bloque «Código HTML/JS». Aquí se explica cada parte <b>leyendo tu página actual</b>: arriba lo que se usa, abajo lo que no.</p>

    <div class="tut-card">
      <div class="tut-h"><span>Capa 1 · Bootstrap: interacción sin escribir código</span><span class="tut-tag ${bs.length ? 'si' : ''}">${bs.length ? 'En esta página: ' + bs.reduce((a, [, n]) => a + n, 0) : 'No se usa'}</span></div>
      <p>El archivo <code>bootstrap.bundle.min.js</code> busca en el HTML atributos como <code>data-bs-toggle</code> y les da comportamiento solo. Por eso un menú hamburguesa funciona sin que escribas JavaScript: el botón dice <em>qué</em> hacer (<code>collapse</code>) y <em>sobre qué</em> elemento (<code>data-bs-target</code>).</p>
      ${bs.length ? `<ul class="tut-lista">${bs.map(([t, n]) => `<li><code>data-bs-toggle="${t}"</code> × ${n}: ${BS_DATA[t] || 'componente de Bootstrap'}</li>`).join('')}</ul>` : ''}
      ${bloqueCodigo(`<button data-bs-toggle="collapse" data-bs-target="#menu">☰</button>
<div class="collapse navbar-collapse" id="menu"> ... </div>`)}
      <p class="tut-concepto"><i class="bi bi-mortarboard"></i> Concepto: comportamiento declarativo con atributos data-*.</p>
    </div>

    <h4 class="tut-sub">Capa 2 · site.js, parte por parte</h4>
    ${usados.map(x => tarjeta(x, true)).join('')}
    ${noUsados.length ? `<details class="tut-mas"><summary>Partes de site.js que esta página no usa (${noUsados.length})</summary>${noUsados.map(x => tarjeta(x, false)).join('')}</details>` : ''}

    <h4 class="tut-sub">Capa 3 · Tu propio código</h4>
    ${jsPagina.trim()
      ? `<div class="tut-card"><p>Esta página tiene JavaScript propio (bloque «Código HTML/JS»). Al exportar va en su propio archivo, después de site.js:</p>${bloqueCodigo(jsPagina.slice(0, 1500))}</div>`
      : '<p class="hint">Esta página no tiene JavaScript propio. Si lo necesitas, arrastra el bloque «Código HTML/JS» (Avanzado).</p>'}

    <div class="tut-card">
      <div class="tut-h"><span>¿En qué orden se carga todo?</span></div>
      ${bloqueCodigo(`<head>
  <script>/* añade la clase js-reveal a <html> */</script>
</head>
<body>
  ... tu contenido ...
  <script src="bootstrap.bundle.min.js"></script>  <!-- 1. Bootstrap -->
  <script src="js/site.js"></script>               <!-- 2. site.js   -->
  <script src="js/pagina.js"></script>             <!-- 3. tu código -->
</body>`)}
      <p>Los scripts van al final del <code>&lt;body&gt;</code> para que la página se vea antes de que se descargue el JavaScript, y para que cuando se ejecuten el HTML ya esté completo. El orden importa: site.js usa <code>bootstrap.Collapse</code>, así que Bootstrap tiene que cargarse antes.</p>
    </div>`;
}

/* =====================================================================
   2. Tutor de diseño adaptable (responsive)
===================================================================== */
// Explica una clase de Bootstrap que cambia según el ancho de pantalla
function explicarClaseBP(c) {
  let m;
  if ((m = c.match(/^col-(sm|md|lg|xl|xxl)-(\d+|auto)$/))) {
    const k = m[2];
    const parte = k === 'auto' ? 'el ancho de su contenido' : `${k} de las 12 columnas${k === '12' ? ' (todo el ancho)' : k === '6' ? ' (la mitad)' : k === '4' ? ' (un tercio)' : k === '3' ? ' (un cuarto)' : ''}`;
    return `${desde(m[1])} ocupa ${parte}. En pantallas más angostas ocupa todo el ancho y las columnas se apilan una debajo de otra.`;
  }
  if ((m = c.match(/^row-cols-(sm|md|lg|xl|xxl)-(\d)$/))) return `${desde(m[1])} pone ${m[2]} elementos por fila.`;
  if ((m = c.match(/^row-cols-(\d)$/))) return `${m[1]} elementos por fila en todas las pantallas (es el punto de partida en el móvil).`;
  if ((m = c.match(/^col-(\d+)$/))) return `Ocupa ${m[1]}/12 en todas las pantallas, también en el móvil.`;
  if ((m = c.match(/^navbar-expand-(sm|md|lg|xl|xxl)$/))) return `El menú se muestra en línea ${desde(m[1])}; en pantallas más angostas se pliega detrás del botón hamburguesa.`;
  if ((m = c.match(/^d-(sm|md|lg|xl|xxl)-(none|block|flex|inline|inline-block|grid|inline-flex)$/))) return m[2] === 'none' ? `Se oculta ${desde(m[1])}.` : `Se muestra (${m[2]}) ${desde(m[1])}. Si además tiene <code>d-none</code>, está oculto en pantallas más pequeñas.`;
  if ((m = c.match(/^(text|justify-content|align-items|flex|order|float|m[tbsexy]?|p[tbsexy]?|g[xy]?|gap)-(sm|md|lg|xl|xxl)-(.+)$/))) return `Aplica <code>${m[1]}-${m[3]}</code> solo ${desde(m[2])}. Antes de ese ancho rige la versión sin prefijo.`;
  return '';
}

// Media queries de un CSS: [{ cond, selectores }]
function mediaQueries(css) {
  const out = [];
  let i = 0;
  while ((i = css.indexOf('@media', i)) !== -1) {
    const a = css.indexOf('{', i);
    if (a < 0) break;
    const cond = css.slice(i + 6, a).trim();
    let prof = 1, j = a + 1;
    while (j < css.length && prof) { if (css[j] === '{') prof++; else if (css[j] === '}') prof--; j++; }
    const cuerpo = css.slice(a + 1, j - 1);
    const selectores = (cuerpo.match(/[^{}]+(?=\{)/g) || []).map(s => s.trim()).filter(Boolean);
    out.push({ cond, selectores, cuerpo });
    i = j;
  }
  return out;
}

// Traduce la condición de una media query a palabras
function condicionEnPalabras(cond) {
  const partes = [];
  let m;
  if ((m = cond.match(/max-width:\s*([\d.]+)px/))) {
    const px = Math.floor(parseFloat(m[1]));
    const quien = px <= 480 ? 'móviles' : px <= 576 ? 'móviles' : px <= 768 ? 'móviles y tablets pequeñas' : px <= 992 ? 'móviles y tablets' : 'móviles, tablets y portátiles pequeños';
    partes.push(`pantallas de <b>hasta ${px}px</b> (${quien})`);
  }
  if ((m = cond.match(/min-width:\s*([\d.]+)px/))) partes.push(`pantallas de <b>${Math.floor(parseFloat(m[1]))}px o más</b>`);
  if (/prefers-reduced-motion/.test(cond)) partes.push('personas que activaron <b>«reducir movimiento»</b> en su sistema (accesibilidad)');
  if (/orientation:\s*portrait/.test(cond)) partes.push('pantallas <b>en vertical</b>');
  if (/orientation:\s*landscape/.test(cond)) partes.push('pantallas <b>en horizontal</b>');
  if (/hover:\s*none/.test(cond)) partes.push('pantallas táctiles (sin ratón)');
  return partes.join(' y ') || SIN_HTML(cond);
}

// Técnicas de CSS fluido que se adaptan solas, sin media queries
const TECNICAS_FLUIDAS = [
  { re: /clamp\([^)]*\)/, titulo: 'Tamaños con clamp()', txt: '<code>clamp(mínimo, ideal, máximo)</code> hace que un tamaño crezca con la pantalla sin pasarse de los límites. El valor ideal suele ir en <code>vw</code> (1vw = 1% del ancho de la ventana). Así un título es grande en escritorio y legible en el móvil, <b>sin ninguna media query</b>.' },
  { re: /(?:^|[\s:(])-?[\d.]+v[wh]\b/, titulo: 'Unidades relativas a la ventana (vw, vh)', txt: '<code>100vh</code> es el alto completo de la ventana y <code>50vw</code> la mitad de su ancho. El hero usa <code>min-height:100vh</code> para llenar la pantalla en cualquier dispositivo.' },
  { re: /object-fit:\s*cover/, titulo: 'Imágenes y videos que recortan sin deformarse', txt: '<code>object-fit:cover</code> llena el recuadro y recorta lo que sobra, como una foto de portada. En una pantalla vertical (móvil) se recortan los lados; en una horizontal, arriba y abajo.' },
  { re: /aspect-ratio:/, titulo: 'Proporción fija con aspect-ratio', txt: '<code>aspect-ratio:4/3</code> mantiene la forma de una tarjeta aunque cambie su ancho: el alto se calcula solo.' },
  { re: /max-width:\s*\d+(px|rem|%)/, titulo: 'Ancho máximo (max-width)', txt: 'Con <code>max-width</code> un bloque puede encogerse en el móvil, pero en pantallas grandes deja de crecer y las líneas de texto no quedan demasiado largas para leer.' },
  { re: /flex-wrap:\s*wrap|flex-wrap/, titulo: 'Flex que salta de línea', txt: 'Con <code>flex-wrap:wrap</code>, si los elementos no caben en una fila pasan a la siguiente en vez de apretarse. Así una fila de botones se convierte en dos en el móvil.' }
];

function tutorAdaptable(html, cssSitio, cssPagina) {
  const cssTodo = cssSitio + '\n' + cssPagina;

  // Clases con punto de quiebre que usa esta página
  const clases = {};
  (html.match(/class="[^"]*"/g) || []).forEach(a => a.slice(7, -1).split(/\s+/).forEach(c => {
    const e = explicarClaseBP(c);
    if (e) clases[c] = clases[c] || { n: 0, e }, clases[c].n++;
  }));
  const listaClases = Object.entries(clases).sort((a, b) => b[1].n - a[1].n);
  const n = (re) => contar(html, re);
  const usaGrid = n(/class="[^"]*\brow\b/g);
  const usaContainer = n(/class="[^"]*\bcontainer(?:-fluid)?\b/g);
  const usaImgFluid = n(/img-fluid/g);
  const usaDisplay = n(/class="[^"]*\b(display-\d|h[1-6]|fs-[1-4])\b/g) + n(/<h[1-3]\b/g);

  const mqSitio = mediaQueries(cssSitio);
  const mqPagina = mediaQueries(cssPagina);
  const tecnicas = TECNICAS_FLUIDAS.filter(t => t.re.test(cssTodo)).map(t => {
    const linea = (cssTodo.match(new RegExp('[^{};]*' + t.re.source + '[^;}]*', 'm')) || [''])[0].trim();
    return { ...t, linea };
  });

  const tablaPuntos = `<table class="tut-tabla">
    <tr><th>Prefijo</th><th>Se aplica desde</th><th>Pensado para</th></tr>
    <tr><td><i>(ninguno)</i></td><td>0px</td><td>móvil: el punto de partida</td></tr>
    ${Object.entries(PUNTOS_BS).map(([k, v]) => `<tr><td><code>-${k}-</code></td><td>${v.px}px</td><td>${v.nombre}</td></tr>`).join('')}
  </table>`;

  const tarjetaMq = (mq, origen) => `<div class="tut-mq">
      <div><code>@media ${SIN_HTML(mq.cond)}</code></div>
      <p>Solo se aplica en ${condicionEnPalabras(mq.cond)}. Cambia: ${mq.selectores.slice(0, 6).map(s => `<code>${SIN_HTML(s.length > 50 ? s.slice(0, 50) + '…' : s)}</code>`).join(', ')}${mq.selectores.length > 6 ? ` y ${mq.selectores.length - 6} más` : ''}.</p>
      ${origen === 'pagina' ? bloqueCodigo(`@media ${mq.cond} {\n  ${mq.cuerpo.trim().replace(/}\s*/g, '}\n  ').slice(0, 600)}\n}`) : ''}
    </div>`;

  return `
    <p class="tut-intro">Un diseño <b>adaptable</b> (responsive) es una sola página que se reorganiza según el ancho de la pantalla. No hay una versión para móvil y otra para computadora: es el mismo HTML, y el <b>CSS</b> decide cómo se ve en cada tamaño. Estas son las piezas que lo logran en <b>tu página actual</b>:</p>

    <div class="tut-btns">
      <span>Pruébalo en el lienzo:</span>
      <button class="tb-btn" data-ver-disp="mobile"><i class="bi bi-phone"></i> Móvil</button>
      <button class="tb-btn" data-ver-disp="tablet"><i class="bi bi-tablet"></i> Tablet</button>
      <button class="tb-btn" data-ver-disp="desktop"><i class="bi bi-display"></i> Escritorio</button>
    </div>

    <div class="tut-card">
      <div class="tut-h"><span>Paso 1 · La etiqueta viewport</span><span class="tut-tag si">Siempre</span></div>
      <p>Sin esta línea, el móvil «finge» ser una pantalla de 980px y muestra la página diminuta. Con ella, el ancho de la página es el ancho real del teléfono y las reglas de abajo pueden actuar. El editor la pone en el <code>&lt;head&gt;</code> de cada página exportada.</p>
      ${bloqueCodigo('<meta name="viewport" content="width=device-width, initial-scale=1">')}
    </div>

    <div class="tut-card">
      <div class="tut-h"><span>Paso 2 · Primero el móvil (mobile first)</span></div>
      <p>Bootstrap escribe primero los estilos para el móvil y luego <b>añade</b> cambios a medida que la pantalla crece, con <code>@media (min-width: …)</code>. Una clase sin prefijo (<code>col-12</code>) vale para todas las pantallas; una con prefijo (<code>col-md-6</code>) se activa <b>desde</b> ese ancho hacia arriba.</p>
      ${tablaPuntos}
    </div>

    <div class="tut-card">
      <div class="tut-h"><span>Paso 3 · La cuadrícula de 12 columnas</span><span class="tut-tag ${usaGrid ? 'si' : ''}">${usaGrid ? 'En esta página: ' + plural(usaGrid, 'fila', 'filas') : 'No se usa'}</span></div>
      <p>Cada <code>.row</code> se divide en 12 partes. Las columnas dicen cuántas partes ocupan en cada tamaño de pantalla. Por ejemplo, tres tarjetas lado a lado en escritorio que en el móvil quedan una debajo de otra:</p>
      ${bloqueCodigo(`<div class="row">
  <div class="col-12 col-md-6 col-lg-4">...</div>   <!-- móvil: 12/12 · tablet: 6/12 · portátil: 4/12 -->
  <div class="col-12 col-md-6 col-lg-4">...</div>
  <div class="col-12 col-md-6 col-lg-4">...</div>
</div>`)}
      <p>Lo que Bootstrap hace por dentro con <code>col-md-6</code>:</p>
      ${bloqueCodigo(`@media (min-width: 768px) {
  .col-md-6 { flex: 0 0 auto; width: 50%; }
}`)}
      ${usaContainer ? `<p><code>.container</code> (${plural(usaContainer, 'vez', 'veces')} en esta página) centra el contenido con un ancho máximo que sube por pasos: 540px, 720px, 960px, 1140px y 1320px. En el móvil ocupa todo el ancho con un pequeño margen a los lados.</p>` : ''}
    </div>

    <div class="tut-card">
      <div class="tut-h"><span>Paso 4 · Las clases adaptables de tu página</span><span class="tut-tag ${listaClases.length ? 'si' : ''}">${listaClases.length ? plural(listaClases.length, 'clase', 'clases') : 'Ninguna'}</span></div>
      ${listaClases.length
        ? `<ul class="tut-lista">${listaClases.slice(0, 25).map(([c, v]) => `<li><code>${c}</code>${v.n > 1 ? ` <span class="tut-n">×${v.n}</span>` : ''} — ${v.e}</li>`).join('')}</ul>${listaClases.length > 25 ? `<p class="hint">…y ${listaClases.length - 25} más.</p>` : ''}`
        : '<p>Esta página todavía no usa clases con prefijo de pantalla. En el explorador de clases, la categoría «Cuadrícula» y «Según la pantalla» tienen las más útiles.</p>'}
    </div>

    <div class="tut-card">
      <div class="tut-h"><span>Paso 5 · Reglas a medida: las media queries</span><span class="tut-tag si">${plural(mqSitio.length + mqPagina.length, 'regla', 'reglas')}</span></div>
      <p>Una <code>@media</code> es un «si…»: el CSS de dentro solo se aplica cuando la pantalla cumple la condición. Bootstrap tiene cientos; estas son las <b>del sitio</b> (archivo <code>css/site.css</code>):</p>
      ${mqSitio.map(mq => tarjetaMq(mq, 'sitio')).join('')}
      ${mqPagina.length
        ? `<p>Y estas son <b>las que creaste tú</b> al dar estilos en las vistas Tablet o Móvil del editor (van en el CSS de la página):</p>${mqPagina.map(mq => tarjetaMq(mq, 'pagina')).join('')}`
        : '<p class="tut-consejo"><i class="bi bi-lightbulb"></i> <b>Tú también puedes crearlas sin escribir código:</b> cambia a la vista <b>Móvil</b> (arriba), selecciona un elemento y cambia su estilo (por ejemplo, el tamaño de letra). El editor escribe solo una <code>@media (max-width: 575px)</code> con ese cambio; en la vista <b>Tablet</b>, una <code>@media (max-width: 991px)</code>. En escritorio el elemento queda como estaba.</p>'}
    </div>

    <div class="tut-card">
      <div class="tut-h"><span>Paso 6 · CSS fluido: se adapta solo</span><span class="tut-tag ${tecnicas.length ? 'si' : ''}">${plural(tecnicas.length, 'técnica', 'técnicas')}</span></div>
      <p>Además de las media queries, hay medidas que se ajustan de forma continua al tamaño de la pantalla:</p>
      ${tecnicas.map(t => `<div class="tut-mq"><b>${t.titulo}</b><p>${t.txt}</p>${t.linea ? bloqueCodigo(t.linea.slice(0, 160)) : ''}</div>`).join('')}
      ${usaImgFluid ? `<div class="tut-mq"><b>Imágenes con img-fluid</b> <span class="tut-n">×${usaImgFluid}</span><p><code>.img-fluid</code> equivale a <code>max-width:100%; height:auto</code>: la imagen nunca es más ancha que su contenedor y conserva su forma.</p></div>` : ''}
      ${usaDisplay ? `<div class="tut-mq"><b>Títulos que se achican solos</b><p>Bootstrap calcula el tamaño de <code>h1</code>–<code>h4</code> y <code>display-*</code> con <code>calc(… + …vw)</code>: en pantallas angostas el título se reduce para que no se corte ninguna palabra.</p></div>` : ''}
    </div>

    <div class="tut-card">
      <div class="tut-h"><span>Resumen: qué pasa al pasar de escritorio a móvil</span></div>
      <ol class="tut-lista">
        <li>El <b>viewport</b> hace que la página use el ancho real del teléfono.</li>
        <li>Las <b>columnas</b> pierden su prefijo activo y vuelven a ocupar todo el ancho: se apilan.</li>
        <li>El <b>menú</b> se pliega en el botón hamburguesa (<code>navbar-expand-*</code>).</li>
        <li>Los <b>títulos y espacios</b> se reducen con <code>clamp()</code>, <code>vw</code> y el tamaño automático de Bootstrap.</li>
        <li>Las <b>media queries</b> del sitio y las tuyas aplican los últimos retoques.</li>
      </ol>
    </div>`;
}

/* =====================================================================
   3. Ventana del visor
===================================================================== */
function abrirCodigo() {
  const pagina = editor.Pages.getSelected();
  const comp = pagina.getMainComponent();
  const archivo = archivoDePagina(pagina);
  const base = archivo.replace(/\.html$/, '');
  const html = editor.getHtml({ component: comp });
  const cssPagina = editor.getCss({ component: comp }) || '';
  const cssSitio = SITE_CSS + '\n/* Identidad visual (panel «Sitio») */\n' + temaCss() + '\n';
  const jsPagina = editor.getJs ? (editor.getJs({ component: comp }) || '') : '';
  const jsTodo = '/* ===== js/site.js ===== */\n' + SITE_JS +
    (jsPagina.trim() ? `\n\n/* ===== js/${base}.js (tu código) ===== */\n` + jsPagina : '');
  const cssTodo = `/* ===== css/${base}.css (estilos de esta página) ===== */\n` + (cssPagina || '/* (sin estilos propios) */') +
    '\n\n/* ===== css/site.css (estilos de todo el sitio) ===== */\n' + cssSitio;

  const PESTANAS = [
    { id: 'html', ico: 'filetype-html', txt: 'HTML', codigo: html, modo: 'htmlmixed', archivo },
    { id: 'css', ico: 'filetype-css', txt: 'CSS', codigo: cssTodo, modo: 'css', archivo: `css/${base}.css + css/site.css` },
    { id: 'js', ico: 'filetype-js', txt: 'JavaScript', codigo: jsTodo, modo: 'javascript', archivo: 'js/site.js' + (jsPagina.trim() ? ` + js/${base}.js` : '') },
    { id: 'tjs', ico: 'mortarboard', txt: 'Cómo funciona el JS', tutor: () => tutorJs(html, jsPagina) },
    { id: 'tresp', ico: 'phone', txt: 'Diseño adaptable', tutor: () => tutorAdaptable(html, cssSitio, cssPagina) }
  ];

  const w = document.createElement('div');
  w.className = 'cod-wrap';
  w.innerHTML = `
    <div class="cod-tabs">${PESTANAS.map((p, i) => `<button class="cod-tab ${i === 0 ? 'active' : ''} ${p.tutor ? 'tutor' : ''}" data-cod="${p.id}"><i class="bi bi-${p.ico}"></i> ${p.txt}</button>`).join('')}</div>
    ${PESTANAS.map((p, i) => `<div class="cod-pane ${i === 0 ? 'active' : ''}" data-pane-cod="${p.id}">
      ${p.tutor ? '<div class="tut"></div>' : `<div class="cod-barra"><span><i class="bi bi-file-earmark-code"></i> ${SIN_HTML(p.archivo)}</span><button class="tb-btn" data-copiar="${p.id}"><i class="bi bi-clipboard"></i> Copiar</button></div><div class="cod-editor"></div>`}
    </div>`).join('')}`;

  editor.Modal.open({ title: `Código de ${archivo}`, content: w });
  // Ventana más ancha solo para el visor
  const dialogo = document.querySelector('.gjs-mdl-dialog');
  if (dialogo) {
    dialogo.classList.add('cod-dialog');
    editor.once('modal:close', () => dialogo.classList.remove('cod-dialog'));
  }

  // Visores de código de GrapesJS (CodeMirror), solo lectura
  const visores = {};
  const crearVisor = (p) => {
    if (visores[p.id]) return visores[p.id];
    const ta = document.createElement('textarea');
    w.querySelector(`[data-pane-cod="${p.id}"] .cod-editor`).appendChild(ta);
    const v = editor.CodeManager.createViewer({ codeName: p.modo, readOnly: 1, theme: 'hopscotch', autoBeautify: true, lineWrapping: true, styleActiveLine: false });
    v.init(ta);
    v.setContent(p.codigo);
    return (visores[p.id] = v);
  };
  const mostrar = (id) => {
    w.querySelectorAll('.cod-tab').forEach(b => b.classList.toggle('active', b.dataset.cod === id));
    w.querySelectorAll('.cod-pane').forEach(d => d.classList.toggle('active', d.dataset.paneCod === id));
    const p = PESTANAS.find(x => x.id === id);
    if (p.tutor) {
      const t = w.querySelector(`[data-pane-cod="${id}"] .tut`);
      if (!t.innerHTML) t.innerHTML = p.tutor();
    } else {
      const v = crearVisor(p);
      setTimeout(() => v.editor.refresh(), 0);
    }
  };
  w.querySelectorAll('.cod-tab').forEach(b => b.onclick = () => mostrar(b.dataset.cod));
  w.querySelectorAll('[data-copiar]').forEach(b => b.onclick = async () => {
    const p = PESTANAS.find(x => x.id === b.dataset.copiar);
    const v = visores[p.id];
    try { await navigator.clipboard.writeText(v ? v.editor.getValue() : p.codigo); toast('Código copiado'); }
    catch (e) { toast('No se pudo copiar: selecciona el texto y usa Ctrl+C'); }
  });
  // «Pruébalo en el lienzo»: cierra el visor y cambia de dispositivo
  w.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ver-disp]');
    if (!b) return;
    editor.Modal.close();
    const btn = document.querySelector(`button[data-device="${b.dataset.verDisp}"]`);
    if (btn) btn.click();
  });
  mostrar('html');
}
