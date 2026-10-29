/* =====================================================================
   Biblioteca de componentes (Bootstrap 5.3)
   Los marcadores __UID__ se reemplazan por un id único al soltar el bloque
   (acordeones, carruseles, modales, pestañas, etc.).
===================================================================== */
const add = (cat, id, label, icon, content, extra = {}) =>
  editor.Blocks.add(id, { label, category: CAT[cat], media: `<i class="bi bi-${icon}"></i>`, content, ...extra });

/* ---------- Estructura ---------- */
add('est', 'container',       'Contenedor',        'square',              '<div class="container py-4"></div>');
add('est', 'container-fluid', 'Contenedor fluido', 'arrows-fullscreen',   '<div class="container-fluid py-4"></div>');
add('est', 'section',         'Sección <section>', 'layout-text-window',  '<section class="py-5"><div class="container"></div></section>');

/* Estructura semántica: estas etiquetas describen QUÉ es cada parte de la
   página. Un <div> no significa nada; <header>, <nav>, <main>, <article>,
   <aside> y <footer> sí, y de eso dependen los lectores de pantalla y los
   buscadores. Cualquier contenedor ya puesto se puede convertir después
   con la propiedad «Etiqueta HTML» del panel derecho. */
add('est', 'sec-header',  'Encabezado <header>', 'window-sidebar',             '<header class="py-4"><div class="container"></div></header>');
add('est', 'sec-nav',     'Navegación <nav>',    'list',                       '<nav class="py-2"><div class="container"></div></nav>');
add('est', 'sec-main',    'Principal <main>',    'file-text',                  '<main class="py-4"><div class="container"></div></main>');
add('est', 'sec-article', 'Artículo <article>',  'file-richtext',              '<article class="py-4"><div class="container"></div></article>');
add('est', 'sec-aside',   'Lateral <aside>',     'layout-sidebar-inset-reverse','<aside class="py-4"><div class="container"></div></aside>');
add('est', 'sec-footer',  'Pie <footer>',        'window-dock',                '<footer class="py-4"><div class="container"></div></footer>');
add('est', 'sec-figure',  'Figura <figure>',     'image-alt',                  `<figure class="figure"><img src="${PH(700, 480)}" class="figure-img img-fluid rounded" alt="Describe la imagen"><figcaption class="figure-caption">Pie de imagen.</figcaption></figure>`);
add('est', 'row',             'Fila',              'distribute-horizontal','<div class="row"><div class="col py-3"></div></div>');
add('est', 'col',             'Columna',           'layout-sidebar-inset','<div class="col py-3"></div>');
add('est', 'cols-2',          '2 columnas',        'layout-split',        '<div class="row"><div class="col-md-6 py-3"></div><div class="col-md-6 py-3"></div></div>');
add('est', 'cols-3',          '3 columnas',        'layout-three-columns','<div class="row"><div class="col-md-4 py-3"></div><div class="col-md-4 py-3"></div><div class="col-md-4 py-3"></div></div>');
add('est', 'cols-4',          '4 columnas',        'grid',                '<div class="row"><div class="col-md-3 py-3"></div><div class="col-md-3 py-3"></div><div class="col-md-3 py-3"></div><div class="col-md-3 py-3"></div></div>');
add('est', 'cols-8-4',        '8 + 4',             'layout-sidebar-reverse','<div class="row"><div class="col-md-8 py-3"></div><div class="col-md-4 py-3"></div></div>');
add('est', 'cols-4-8',        '4 + 8',             'layout-sidebar',      '<div class="row"><div class="col-md-4 py-3"></div><div class="col-md-8 py-3"></div></div>');
add('est', 'flex-row',        'Flex horizontal',   'arrow-left-right',    '<div class="d-flex gap-3 align-items-center py-3"></div>');
add('est', 'flex-col',        'Flex vertical',     'arrow-down-up',       '<div class="d-flex flex-column gap-3 py-3"></div>');
add('est', 'divider',         'Separador',         'dash-lg',             '<hr class="my-4">');
add('est', 'spacer',          'Espaciador',        'arrows-expand',       '<div class="py-4"></div>');

/* ---------- Bloques de sitio web (secciones completas listas para usar) ---------- */
const SITIO = (() => {
  const IMG = (w, h, col, txt) => svgEjemplo(w, h, col, txt);
  const BG = (w, h, col) => svgEjemplo(w, h, col, ''); // sin texto, para fondos
  const COLORES = ['3b5bdb', '4c6ef5', '5c7cfa', '364fc7', '4263eb', '1b2559'];
  const L = {};

  /* ----- Navegación ----- */
  L.nav = (act = 'index') => {
    const a = (k) => (act === k ? ' active' : '');
    return `
<nav class="navbar navbar-expand-xl nav-transparente fixed-top" data-bs-theme="dark" aria-label="Menú principal">
  <div class="container">
<a class="navbar-brand" href="index.html">Mi Sitio</a>
<button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#__UID__" aria-controls="__UID__" aria-expanded="false" aria-label="Menú"><span class="navbar-toggler-icon"></span></button>
<div class="collapse navbar-collapse" id="__UID__">
  <ul class="navbar-nav mx-auto mb-2 mb-xl-0">
    <li class="nav-item"><a class="nav-link${a('index')}" href="index.html">Inicio</a></li>
    <li class="nav-item"><a class="nav-link" href="#">Nosotros</a></li>
    <li class="nav-item"><a class="nav-link${a('servicios')}" href="servicios.html">Servicios</a></li>
    <li class="nav-item"><a class="nav-link" href="#">Proyectos</a></li>
    <li class="nav-item"><a class="nav-link${a('galeria')}" href="galeria.html">Galería</a></li>
    <li class="nav-item"><a class="nav-link${a('contacto')}" href="contacto.html">Contacto</a></li>
  </ul>
  <div class="d-flex align-items-center gap-3">
    <div class="dropdown">
      <a class="btn btn-sm btn-outline-light rounded-pill px-3 dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-globe2 me-1"></i>ES</a>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><a class="dropdown-item" href="#">English</a></li>
        <li><a class="dropdown-item" href="#">Français</a></li>
        <li><a class="dropdown-item" href="#">Español</a></li>
      </ul>
    </div>
    <a href="contacto.html" class="btn-sitio-claro">Contáctanos</a>
  </div>
</div>
  </div>
</nav>`;
  };

  L.topbar = () => `
<div class="barra-superior">
  <div class="container d-flex flex-wrap justify-content-between align-items-center gap-2">
<div><i class="bi bi-telephone me-1"></i> +000 000 000 000 <a href="#"><i class="bi bi-envelope me-1"></i> contacto@misitio.com</a></div>
<div><a href="#" aria-label="Facebook"><i class="bi bi-facebook"></i></a><a href="#" aria-label="Instagram"><i class="bi bi-instagram"></i></a><a href="#" aria-label="YouTube"><i class="bi bi-youtube"></i></a></div>
  </div>
</div>`;

  L.idioma = () => `
<div class="dropdown">
  <a class="btn btn-sm btn-outline-secondary rounded-pill px-3 dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-globe2 me-1"></i>ES</a>
  <ul class="dropdown-menu">
<li><a class="dropdown-item" href="#">English</a></li>
<li><a class="dropdown-item" href="#">Français</a></li>
<li><a class="dropdown-item" href="#">Español</a></li>
  </ul>
</div>`;

  /* ----- Cabeceras ----- */
  L.hero = () => `
<section class="hero" id="inicio">
  <video class="hero-video" data-gjs-type="video-fondo" autoplay muted loop playsinline poster="${BG(1600, 900, '1b2559')}"></video>
  <div class="overlay"></div>
  <div class="hero-contenido">
<span class="eyebrow">Bienvenido</span>
<h1 class="mt-3 mb-4" data-reveal="fade-up">Título principal de tu sitio web</h1>
<p class="lead mb-5">Escribe una frase corta que explique de qué trata tu proyecto. Para cambiar el video de fondo, selecciona esta sección y usa «Video de fondo» en Estilo.</p>
<div class="d-flex flex-wrap gap-3 justify-content-center">
  <a href="contacto.html" class="btn-sitio-claro">Contáctanos</a>
  <a href="#" class="btn-sitio-borde">Saber más</a>
</div>
<div class="mt-5"><a href="#intro" class="scroll-hint"><span>Descubre más</span><i class="bi bi-chevron-double-down fs-5"></i></a></div>
  </div>
</section>`;

  L.heroImg = () => `
<section class="hero" id="inicio" style="background-image:url(${BG(1600, 900, '3b5bdb')})">
  <div class="overlay"></div>
  <div class="hero-contenido">
<span class="eyebrow">Bienvenido</span>
<h1 class="mt-3 mb-4" data-reveal="fade-up">Un título claro que atrape al visitante</h1>
<p class="lead mb-5">Describe en una frase qué ofrece tu proyecto. Cambia la imagen de fondo con una URL en la pestaña Estilo.</p>
<a href="contacto.html" class="btn-sitio-claro">Empezar</a>
  </div>
</section>`;

  L.banner = (titulo = 'Título de la página', sub = 'Mi Sitio', color = '3b5bdb') => `
<section class="hero hero-interno" style="background-image:url(${BG(1600, 700, color)})">
  <div class="overlay"></div>
  <div class="hero-contenido">
<span class="eyebrow">${sub}</span>
<h1 class="mt-3">${titulo}</h1>
  </div>
</section>`;

  /* ----- Contenido ----- */
  L.intro = () => `
<section class="seccion text-center" id="intro">
  <div class="container" style="max-width:820px">
<span class="eyebrow" data-reveal="fade-up">Presentación</span>
<h2 class="font-titulo display-6 mt-3 mb-4" data-reveal="fade-up">Presenta tu proyecto en una frase</h2>
<p class="fs-5 text-secondary" data-reveal="fade-up">Explica quién eres, qué haces y por qué vale la pena seguir leyendo. Reemplaza este texto por el tuyo.</p>
  </div>
</section>`;

  L.tarjeta = (t = 'Título', s = 'Descripción breve', c = '3b5bdb') => `
<article class="tarjeta-img"><img src="${IMG(600, 800, c, t)}" alt="${t}"><div class="tarjeta-cuerpo"><h3 class="h4">${t}</h3><p class="small mb-2">${s}</p><a href="#" class="stretched-link">Ver más</a></div></article>`;

  L.destacados = () => `
<section class="seccion fondo-claro" id="destacados">
  <div class="container">
<div class="text-center mb-5"><span class="eyebrow">Qué hacemos</span><h2 class="font-titulo display-6 mt-3">Lo que ofrecemos</h2></div>
<div class="row g-4">
  ${[['Diseño', 'Ideas creativas'], ['Desarrollo', 'Soluciones a medida'], ['Soporte', 'Siempre contigo'], ['Consultoría', 'Asesoría experta']].map(([t, s], i) => `
  <div class="col-sm-6 col-lg-3" data-reveal="fade-up"><article class="tarjeta-img"><img src="${IMG(600, 800, COLORES[i], t)}" alt="${t}"><div class="tarjeta-cuerpo"><h3 class="h4">${t}</h3><p class="small mb-2">${s}</p><a href="#" class="stretched-link">Ver más</a></div></article></div>`).join('')}
</div>
  </div>
</section>`;

  const split = ({ inverso, fondo, eyebrow, titulo, texto, enlace, color, etiqueta }) => `
<section class="seccion ${fondo}">
  <div class="container">
<div class="row align-items-center g-5${inverso ? ' flex-lg-row-reverse' : ''}">
  <div class="col-lg-6" data-reveal="${inverso ? 'fade-right' : 'fade-left'}"><img class="img-redondeada" src="${IMG(900, 675, color, etiqueta)}" alt="${etiqueta}"></div>
  <div class="col-lg-6" data-reveal="fade-up">
    <span class="eyebrow">${eyebrow}</span>
    <h2 class="font-titulo display-6 mt-3 mb-4">${titulo}</h2>
    <p class="text-secondary mb-4">${texto}</p>
    <a href="#" class="btn-sitio">${enlace}</a>
  </div>
</div>
  </div>
</section>`;
  L.splitIzq = () => split({ inverso: false, fondo: '', eyebrow: 'Sobre nosotros', titulo: 'Título de la sección', texto: 'Cuenta tu historia, lo que te hace especial y lo que verán tus visitantes. Reemplaza este texto y la imagen por los tuyos (puedes usar una URL).', enlace: 'Saber más', color: COLORES[0], etiqueta: 'Imagen' });
  L.splitDer = () => split({ inverso: true, fondo: 'fondo-claro', eyebrow: 'Descubre', titulo: 'Otro título de sección', texto: 'Alterna secciones con la imagen a la izquierda y a la derecha para dar ritmo a la página.', enlace: 'Saber más', color: COLORES[2], etiqueta: 'Imagen' });
  L.mision = () => split({ inverso: true, fondo: 'fondo-claro', eyebrow: 'Misión', titulo: 'Nuestra misión', texto: 'Describe aquí el propósito de tu proyecto, a quién ayuda y qué problema resuelve.', enlace: 'Conocer más', color: COLORES[1], etiqueta: 'Misión' });
  L.servicio = () => split({ inverso: false, fondo: '', eyebrow: 'Servicios', titulo: 'Lo que hacemos mejor', texto: 'Resume tu servicio o producto principal: en qué consiste, para quién es y qué beneficios ofrece.', enlace: 'Ver servicios', color: COLORES[3], etiqueta: 'Servicio' });
  L.valores = () => split({ inverso: true, fondo: 'fondo-claro', eyebrow: 'Valores', titulo: 'Lo que nos guía', texto: 'Cuenta en qué creen, cómo trabajan y qué compromiso tienen con las personas que confían en ustedes.', enlace: 'Ver más', color: COLORES[4], etiqueta: 'Valores' });

  L.parallax = () => `
<section class="seccion parallax" style="background-image:url(${BG(1600, 900, '1b2559')});padding:8rem 0">
  <div class="overlay"></div>
  <div class="container position-relative text-center" style="z-index:2">
<span class="eyebrow">Cifras</span>
<h2 class="font-titulo display-5 mt-3 mb-4" data-reveal="fade-up">Resultados que hablan</h2>
<p class="lead col-lg-8 mx-auto mb-5" data-reveal="fade-up">Muestra los números más importantes de tu proyecto sobre una imagen de fondo fija.</p>
<div class="row g-4 justify-content-center" data-reveal="fade-up">
  <div class="col-6 col-md-3"><div class="dato">+120</div><div class="small text-uppercase mt-2" style="letter-spacing:.2em">proyectos</div></div>
  <div class="col-6 col-md-3"><div class="dato">15</div><div class="small text-uppercase mt-2" style="letter-spacing:.2em">años de experiencia</div></div>
  <div class="col-6 col-md-3"><div class="dato">100%</div><div class="small text-uppercase mt-2" style="letter-spacing:.2em">compromiso</div></div>
</div>
  </div>
</section>`;

  const prod = (n, d, c, serv) => `
  <div class="col-md-6 col-lg-4" data-reveal="fade-up">
    <article class="producto">
      <div class="foto"><img src="${IMG(800, 600, c, n)}" alt="${n}"></div>
      <div class="p-4">
        <h3 class="font-titulo h4">${n}</h3>
        <p class="text-secondary small">${d}</p>
        <p class="servicios small mb-4">${serv}</p>
        <a href="contacto.html" class="btn-sitio">Consultar</a>
      </div>
    </article>
  </div>`;
  const SERV = '<span><i class="bi bi-check2-circle"></i>Característica 1</span><span><i class="bi bi-check2-circle"></i>Característica 2</span><span><i class="bi bi-check2-circle"></i>Característica 3</span>';
  L.productos = () => `
<section class="seccion fondo-claro" id="servicios">
  <div class="container">
<div class="text-center mb-5"><span class="eyebrow">Servicios</span><h2 class="font-titulo display-6 mt-3">Nuestros servicios</h2></div>
<div class="row g-4">
  ${prod('Servicio básico', 'Descripción breve de lo que incluye este servicio o producto.', COLORES[0], SERV)}
  ${prod('Servicio estándar', 'Más funciones y beneficios para quienes necesitan algo más completo.', COLORES[3], SERV)}
  ${prod('Servicio premium', 'La opción más completa, con atención personalizada.', COLORES[4], SERV)}
</div>
  </div>
</section>`;

  L.barraRapida = () => `
<section class="barra-rapida" aria-labelledby="__UID__-t">
  <div class="container">
    <h2 class="visually-hidden" id="__UID__-t">Consulta rápida</h2>
<form class="row g-3 align-items-end" method="post" action="#">
  <div class="col-md-3"><label class="form-label small text-uppercase" for="__UID__-desde">Desde</label><input type="date" class="form-control" id="__UID__-desde" name="desde"></div>
  <div class="col-md-3"><label class="form-label small text-uppercase" for="__UID__-hasta">Hasta</label><input type="date" class="form-control" id="__UID__-hasta" name="hasta"></div>
  <div class="col-md-3"><label class="form-label small text-uppercase" for="__UID__-cant">Cantidad</label><select class="form-select" id="__UID__-cant" name="cantidad"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5 o más</option></select></div>
  <div class="col-md-3 d-grid"><button type="submit" class="btn-sitio">Consultar</button></div>
</form>
  </div>
</section>`;

  L.citas = () => `
<section class="seccion fondo-claro">
  <div class="container">
<div class="text-center mb-4"><span class="eyebrow">Citas</span><h2 class="font-titulo display-6 mt-3">Lo que dicen de nosotros</h2></div>
<div id="__UID__" class="carousel slide carousel-citas" data-bs-ride="carousel">
  <div class="carousel-inner">
    <div class="carousel-item active text-center px-5 py-3"><figure class="m-0"><blockquote class="cita-texto mb-0"><p class="mb-0">“Una cita breve de un cliente, aliado o medio que respalde tu proyecto.”</p></blockquote><figcaption class="cita-autor mt-4">Nombre o medio</figcaption></figure></div>
    <div class="carousel-item text-center px-5 py-3"><figure class="m-0"><blockquote class="cita-texto mb-0"><p class="mb-0">“Otra frase destacada que genere confianza en quien visita tu sitio.”</p></blockquote><figcaption class="cita-autor mt-4">Nombre o medio</figcaption></figure></div>
    <div class="carousel-item text-center px-5 py-3"><figure class="m-0"><blockquote class="cita-texto mb-0"><p class="mb-0">“Una tercera opinión para completar el carrusel.”</p></blockquote><figcaption class="cita-autor mt-4">Nombre o medio</figcaption></figure></div>
  </div>
  <button class="carousel-control-prev" type="button" data-bs-target="#__UID__" data-bs-slide="prev"><span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Anterior</span></button>
  <button class="carousel-control-next" type="button" data-bs-target="#__UID__" data-bs-slide="next"><span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Siguiente</span></button>
</div>
  </div>
</section>`;

  const testi = (n, fecha, txt) => `
  <div class="col-md-4" data-reveal="fade-up">
    <figure class="testimonio">
      <div class="estrellas mb-3" role="img" aria-label="5 de 5 estrellas">★★★★★</div>
      <blockquote class="mb-0"><p class="text-secondary">“${txt}”</p></blockquote>
      <figcaption class="d-flex align-items-center gap-3 mt-4"><img class="avatar" src="${IMG(104, 104, '5c7cfa', n[0])}" alt="${n}"><div><div class="fw-semibold">${n}</div><small class="text-secondary">${fecha}</small></div></figcaption>
    </figure>
  </div>`;
  L.testimonios = () => `
<section class="seccion" id="testimonios">
  <div class="container">
<div class="text-center mb-5"><span class="eyebrow">Opiniones</span><h2 class="font-titulo display-6 mt-3">Lo que dicen nuestros clientes</h2></div>
<div class="row g-4">
  ${testi('María P.', 'Cliente', 'Una experiencia excelente. El equipo fue atento y el resultado superó lo que esperábamos.')}
  ${testi('John S.', 'Cliente', 'Muy profesionales. Todo estuvo bien organizado y llegó a tiempo.')}
  ${testi('Claire D.', 'Cliente', 'Lo recomiendo sin dudar: buen trato, calidad y precios justos.')}
</div>
  </div>
</section>`;

  L.categorias = () => `
<section class="seccion fondo-claro">
  <div class="container">
<div class="text-center mb-5"><span class="eyebrow">Explora</span><h2 class="font-titulo display-6 mt-3">Categorías</h2></div>
<div class="row g-4">
  ${[['Categoría 1', 'Descripción breve'], ['Categoría 2', 'Descripción breve'], ['Categoría 3', 'Descripción breve']].map(([t, s], i) => `
  <div class="col-md-4" data-reveal="fade-up"><article class="tarjeta-img horizontal"><img src="${IMG(800, 600, COLORES[i + 1], t)}" alt="${t}"><div class="tarjeta-cuerpo"><h3 class="h4">${t}</h3><p class="small mb-2">${s}</p><a href="#" class="stretched-link">Ver más</a></div></article></div>`).join('')}
</div>
  </div>
</section>`;

  L.pista = () => `
<section class="seccion" id="experiencias">
  <div class="container">
<div class="d-flex justify-content-between align-items-end gap-3 mb-4">
  <div>
    <span class="eyebrow">Solo aquí</span>
    <h2 class="font-titulo display-6 mt-3 mb-0">Experiencias destacadas</h2>
  </div>
  <div class="pista-bots">
    <button type="button" data-pista="ant" aria-label="Anterior"><i class="bi bi-chevron-left"></i></button>
    <button type="button" data-pista="sig" aria-label="Siguiente"><i class="bi bi-chevron-right"></i></button>
  </div>
</div>
<div class="pista-wrap">
  <div class="pista">
    ${['Primera experiencia', 'Segunda experiencia', 'Tercera experiencia', 'Cuarta experiencia', 'Quinta experiencia']
      .map((t, i) => `<article class="tarjeta-img horizontal"><img src="${IMG(600, 450, COLORES[i % 6], 'Foto ' + (i + 1))}" alt="${t}"><div class="tarjeta-cuerpo"><h3 class="h4">${t}</h3><p class="small mb-2">Describe en una línea de qué se trata.</p><a href="#" class="stretched-link">Ver más</a></div></article>`).join('')}
  </div>
</div>
<p class="text-secondary small mb-0">Se desliza con el dedo, con la rueda del ratón o con las flechas. Las tarjetas se detienen alineadas.</p>
  </div>
</section>`;

  L.prensa = () => `
<section class="seccion fondo-claro" id="prensa">
  <div class="container">
    <h2 class="visually-hidden">En los medios</h2>
<blockquote class="text-center mb-5" data-reveal="fade-up">
  <p class="cita-texto mb-3">Una frase breve de un medio o de un cliente, suficiente para dar confianza sin robar protagonismo.</p>
  <span class="cita-autor">Nombre del medio</span>
</blockquote>
<div class="cinta-marco">
  <div class="cinta">
    <span>Medio uno</span><span>Medio dos</span><span>Medio tres</span><span>Medio cuatro</span><span>Medio cinco</span><span>Medio seis</span>
    <span aria-hidden="true">Medio uno</span><span aria-hidden="true">Medio dos</span><span aria-hidden="true">Medio tres</span><span aria-hidden="true">Medio cuatro</span><span aria-hidden="true">Medio cinco</span><span aria-hidden="true">Medio seis</span>
  </div>
</div>
<p class="text-secondary small text-center mt-3 mb-0">La lista va <b>dos veces</b>: al llegar a la mitad el bucle reinicia en un punto idéntico y la costura no se nota. La segunda copia lleva aria-hidden para que un lector de pantalla no la repita.</p>
  </div>
</section>`;

  L.galeria = () => `
<section class="seccion" id="galeria">
  <div class="container">
<div class="text-center mb-5"><span class="eyebrow">Imágenes</span><h2 class="font-titulo display-6 mt-3">Galería</h2></div>
<div class="row g-3 galeria-lightbox">
  ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `
  <div class="col-6 col-md-4" data-reveal="zoom"><figure class="galeria-item"><img src="${IMG(800, 800, COLORES[i % 6], 'Foto ' + (i + 1))}" alt="Foto ${i + 1}"></figure></div>`).join('')}
</div>
  </div>
</section>`;

  L.contacto = () => `
<section class="seccion fondo-claro" id="contacto">
  <div class="container">
<div class="row g-5">
  <div class="col-lg-5">
    <span class="eyebrow">Escríbenos</span>
    <h2 class="font-titulo display-6 mt-3 mb-4">Hablemos</h2>
    <p class="text-secondary mb-4">Cuéntanos en qué podemos ayudarte y te responderemos lo antes posible.</p>
    <address class="m-0">
    <p><i class="bi bi-geo-alt texto-primario me-2"></i>Dirección, Ciudad, País</p>
    <p><i class="bi bi-telephone texto-primario me-2"></i>+000 000 000 000</p>
    <p><i class="bi bi-envelope texto-primario me-2"></i>contacto@misitio.com</p>
    <p><i class="bi bi-clock texto-primario me-2"></i>Lunes a viernes, 8:00 a 18:00</p>
    </address>
  </div>
  <div class="col-lg-7">
    <form class="p-4 p-md-5 bg-white rounded-4 shadow-sm" method="post" action="#">
      <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Nombre</label><input type="text" class="form-control" name="nombre" required></div>
        <div class="col-md-6"><label class="form-label">Correo electrónico</label><input type="email" class="form-control" name="correo" required></div>
        <div class="col-md-6"><label class="form-label">Teléfono</label><input type="tel" class="form-control" name="telefono"></div>
        <div class="col-md-6"><label class="form-label">Asunto</label><input type="text" class="form-control" name="asunto"></div>
        <div class="col-12"><label class="form-label">Mensaje</label><textarea class="form-control" name="mensaje" rows="5"></textarea></div>
        <div class="col-12"><button type="submit" class="btn-sitio">Enviar mensaje</button></div>
      </div>
    </form>
  </div>
</div>
  </div>
</section>`;

  L.mapa = () => `
<section aria-label="Ubicación"><iframe title="Mapa de ubicación" src="https://maps.google.com/maps?q=Quito&t=&z=12&ie=UTF8&iwloc=&output=embed" style="width:100%;height:420px;border:0" loading="lazy"></iframe></section>`;

  L.newsletter = () => `
<section class="seccion fondo-osc newsletter" id="newsletter">
  <div class="container text-center" style="max-width:720px">
<h2 class="font-titulo display-6" data-reveal="fade-up">Recibe nuestras novedades</h2>
<p class="mb-4 opacity-75">Noticias y novedades directo a tu correo.</p>
<form class="row g-2 justify-content-center" method="post" action="#">
  <div class="col-sm-8"><input type="email" class="form-control" name="correo" placeholder="Tu correo electrónico" aria-label="Tu correo electrónico" required></div>
  <div class="col-sm-4 d-grid"><button type="submit" class="btn-sitio-claro">Suscribirme</button></div>
</form>
  </div>
</section>`;

  L.pie = () => `
<footer class="pie" style="background-image:url(${BG(1600, 900, '1b2559')})">
  <div class="overlay"></div>
  <div class="container position-relative py-5" style="z-index:2">
<div class="text-center mb-5">
  <a href="index.html" class="font-titulo fs-2 text-white">Mi Sitio</a>
  <p class="mt-3 mb-0 opacity-75">Una frase corta sobre tu proyecto.</p>
</div>
<div class="row g-4">
  <nav class="col-6 col-lg-3" aria-label="Sitio"><h2 class="pie-titulo h5">Sitio</h2><ul><li><a href="#">Sobre nosotros</a></li><li><a href="servicios.html">Servicios</a></li><li><a href="#">Proyectos</a></li><li><a href="#">Equipo</a></li></ul></nav>
  <nav class="col-6 col-lg-3" aria-label="Recursos"><h2 class="pie-titulo h5">Recursos</h2><ul><li><a href="#">Blog</a></li><li><a href="#">Documentos</a></li><li><a href="#">Preguntas frecuentes</a></li></ul></nav>
  <nav class="col-6 col-lg-3" aria-label="Información"><h2 class="pie-titulo h5">Información</h2><ul><li><a href="galeria.html">Galería</a></li><li><a href="#">Términos y condiciones</a></li><li><a href="contacto.html">Contacto</a></li></ul></nav>
  <div class="col-6 col-lg-3"><h2 class="pie-titulo h5">Contacto</h2><address class="m-0"><ul><li><i class="bi bi-telephone me-2"></i>+000 000 000 000</li><li><i class="bi bi-whatsapp me-2"></i>+000 000 000 000</li><li><i class="bi bi-envelope me-2"></i>contacto@misitio.com</li></ul></address></div>
</div>
<hr class="border-light opacity-25 my-4">
<div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 small">
  <span>© 2026 Mi Sitio. Todos los derechos reservados.</span>
  <div class="redes"><a href="#" aria-label="Facebook"><i class="bi bi-facebook"></i></a><a href="#" aria-label="Instagram"><i class="bi bi-instagram"></i></a><a href="#" aria-label="TikTok"><i class="bi bi-tiktok"></i></a><a href="#" aria-label="YouTube"><i class="bi bi-youtube"></i></a></div>
</div>
  </div>
</footer>`;

  L.whatsapp = () => `<a href="https://wa.me/000000000000" class="whatsapp-flotante" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="bi bi-whatsapp"></i></a>`;

  /* ----- Plantillas ----- */
  const PLANTILLAS = {
    inicio: () => [L.nav('index'), L.hero(), L.intro(), L.destacados(), L.pista(), L.parallax(), L.mision(), L.servicio(), L.valores(), L.prensa(), L.testimonios(), L.categorias(), L.newsletter(), L.pie(), L.whatsapp()],
    servicios: () => [L.nav('servicios'), L.banner('Servicios', 'Lo que ofrecemos', '4263eb'), L.barraRapida(), L.productos(), L.valores(), L.newsletter(), L.pie(), L.whatsapp()],
    galeria: () => [L.nav('galeria'), L.banner('Galería', 'Imágenes', '364fc7'), L.galeria(), L.newsletter(), L.pie(), L.whatsapp()],
    contacto: () => [L.nav('contacto'), L.banner('Contacto', 'Escríbenos', '5c7cfa'), L.contacto(), L.mapa(), L.pie(), L.whatsapp()]
  };

  /* ----- Bloques: cada uno en su categoría ----- */
  const registrar = () => {
  // Navegación
  add('nav', 's-nav',       'Menú transparente',        'menu-up',            L.nav('index'));
  add('nav', 's-topbar',    'Barra superior',           'telephone',          L.topbar());
  add('nav', 's-idioma',    'Selector de idioma',       'translate',          L.idioma());
  // Botones
  add('btn', 's-whatsapp',  'Botón flotante de WhatsApp', 'whatsapp',         L.whatsapp());
  // Formularios
  add('frm', 's-barra',     'Formulario rápido (fechas)', 'calendar-check',   L.barraRapida());
  add('frm', 's-newsletter','Suscripción',              'send',               L.newsletter());
  // Contenido
  add('cnt', 's-tarjeta',   'Tarjeta con imagen',       'card-image',         L.tarjeta());
  // Secciones
  add('sec', 's-hero-video','Hero con video de fondo',  'camera-reels',       L.hero());
  add('sec', 's-hero-img',  'Hero con imagen de fondo', 'image',              L.heroImg());
  add('sec', 's-banner',    'Cabecera de página',       'card-heading',       L.banner());
  add('sec', 's-intro',     'Introducción',             'text-center',        L.intro());
  add('sec', 's-destacados','Destacados (4 tarjetas)',  'grid',               L.destacados());
  add('sec', 's-split-izq', 'Imagen + texto (izq.)',    'layout-sidebar',     L.splitIzq());
  add('sec', 's-split-der', 'Imagen + texto (der.)',    'layout-sidebar-reverse', L.splitDer());
  add('sec', 's-parallax',  'Fondo fijo con cifras',    'bar-chart-line',     L.parallax());
  add('sec', 's-servicios', 'Servicios (3 tarjetas)',   'columns-gap',        L.productos());
  add('sec', 's-categorias','Categorías (3 tarjetas)',  'collection',         L.categorias());
  add('sec', 's-pista',     'Pista deslizable (snap)',  'arrow-left-right',   L.pista());
  add('sec', 's-prensa',    'Prensa y cinta de logos',  'megaphone',          L.prensa());
  add('sec', 's-citas',     'Carrusel de citas',        'chat-quote',         L.citas());
  add('sec', 's-testimonios','Testimonios (3)',         'star-half',          L.testimonios());
  add('sec', 's-contacto',  'Contacto con formulario',  'envelope-paper',     L.contacto());
  add('sec', 's-pie',       'Pie con foto y redes',     'layout-text-window-reverse', L.pie());
  // Media
  add('med', 's-galeria',   'Galería con ampliación',   'images',             L.galeria());

  };

  return { L, PLANTILLAS, registrar };
})();

/* ---------- Texto ---------- */
[1, 2, 3, 4, 5, 6].forEach(n =>
  add('txt', 'h' + n, 'Título H' + n, n <= 3 ? 'type-h' + n : 'fonts', `<h${n}>Título H${n}</h${n}>`));
add('txt', 'display',    'Título grande', 'type',      '<h1 class="display-3 fw-bold">Título grande</h1>');
add('txt', 'paragraph',  'Párrafo',       'paragraph', '<p>Escribe aquí tu texto. Haz doble clic para editarlo.</p>');
add('txt', 'lead',       'Texto destacado','text-paragraph','<p class="lead">Un párrafo destacado que llama la atención.</p>');
add('txt', 'small',      'Texto pequeño', 'fonts',     '<p><small class="text-body-secondary">Texto pequeño o nota al pie.</small></p>');
add('txt', 'link',       'Enlace',        'link-45deg','<a href="#">Enlace</a>');
add('txt', 'quote',      'Cita',          'quote',     '<figure><blockquote class="blockquote"><p>Una cita memorable.</p></blockquote><figcaption class="blockquote-footer">Autor en <cite title="Fuente">Fuente</cite></figcaption></figure>');
add('txt', 'ul',         'Lista',         'list-ul',   '<ul><li>Elemento 1</li><li>Elemento 2</li><li>Elemento 3</li></ul>');
add('txt', 'ol',         'Lista numerada','list-ol',   '<ol><li>Primero</li><li>Segundo</li><li>Tercero</li></ol>');

/* ---------- Botones ---------- */
[['primary', 'primario'], ['secondary', 'secundario'], ['success', 'éxito'],
 ['danger', 'peligro'], ['warning', 'advertencia'], ['info', 'info']].forEach(([v, n]) =>
  add('btn', 'btn-' + v, 'Botón ' + n, 'hand-index', `<a href="#" class="btn btn-${v}" role="button">Botón</a>`));
add('btn', 'btn-dark',        'Botón oscuro',     'hand-index',       '<a href="#" class="btn btn-dark" role="button">Botón</a>');
add('btn', 'btn-outline',     'Botón contorno',   'hand-index-thumb', '<a href="#" class="btn btn-outline-primary" role="button">Botón</a>');
add('btn', 'btn-lg',          'Botón grande',     'arrows-angle-expand','<a href="#" class="btn btn-primary btn-lg" role="button">Botón grande</a>');
add('btn', 'btn-block',       'Botón ancho total','arrows-expand-vertical','<div class="d-grid"><a href="#" class="btn btn-primary" role="button">Botón ancho total</a></div>');
add('btn', 'btn-group',       'Grupo de botones', 'toggles2',
  '<div class="btn-group" role="group"><a href="#" class="btn btn-primary" role="button">Izquierda</a><a href="#" class="btn btn-primary" role="button">Centro</a><a href="#" class="btn btn-primary" role="button">Derecha</a></div>');

/* ---------- Navegación ---------- */
const navbar = (dark) => `
  <nav class="navbar navbar-expand-md" style="background-color:${dark ? '#212529' : '#f8f9fa'}" ${dark ? 'data-bs-theme="dark"' : ''}>
    <div class="container">
      <a class="navbar-brand" href="#">Mi Sitio</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#__UID__" aria-controls="__UID__" aria-expanded="false" aria-label="Menú">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="__UID__">
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link active" href="index.html">Inicio</a></li>
          <li class="nav-item"><a class="nav-link" href="#">Servicios</a></li>
          <li class="nav-item"><a class="nav-link" href="#">Nosotros</a></li>
          <li class="nav-item"><a class="nav-link" href="#">Contacto</a></li>
        </ul>
      </div>
    </div>
  </nav>`;
add('nav', 'navbar-light', 'Barra clara',  'window-dock', navbar(false));
add('nav', 'navbar-dark',  'Barra oscura', 'window-dock', navbar(true));

// Página con menú lateral: en pantallas menores a "md" el menú se oculta y aparece un botón de hamburguesa.
const sidebar = (dark) => `
  <div class="row g-0 min-vh-100">
    <div class="col-12 d-md-none">
      <nav class="navbar" style="background-color:${dark ? '#212529' : '#f8f9fa'}" ${dark ? 'data-bs-theme="dark"' : ''}>
        <div class="container-fluid">
          <a class="navbar-brand" href="index.html">Mi Sitio</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#__UID__" aria-controls="__UID__" aria-expanded="false" aria-label="Menú">
            <span class="navbar-toggler-icon"></span>
          </button>
        </div>
      </nav>
    </div>
    <div class="col-md-3 col-xl-2 collapse d-md-block menu-lateral" id="__UID__" style="background-color:${dark ? '#212529' : '#f8f9fa'}" ${dark ? 'data-bs-theme="dark"' : ''}>
      <div class="d-flex flex-column p-3 position-sticky top-0">
        <a href="index.html" class="d-none d-md-flex align-items-center mb-3 text-decoration-none fs-4 fw-bold ${dark ? 'text-white' : 'text-body'}"><i class="bi bi-bootstrap-fill me-2"></i><span>Mi Sitio</span></a>
        <hr class="mt-0 d-none d-md-block">
        <ul class="nav nav-pills flex-column gap-1 mb-3">
          <li class="nav-item"><a href="index.html" class="nav-link active"><i class="bi bi-house-door me-2"></i>Inicio</a></li>
          <li class="nav-item"><a href="#" class="nav-link ${dark ? 'text-white' : 'text-body'}"><i class="bi bi-grid me-2"></i>Servicios</a></li>
          <li class="nav-item"><a href="#" class="nav-link ${dark ? 'text-white' : 'text-body'}"><i class="bi bi-people me-2"></i>Nosotros</a></li>
          <li class="nav-item"><a href="#" class="nav-link ${dark ? 'text-white' : 'text-body'}"><i class="bi bi-image me-2"></i>Galería</a></li>
          <li class="nav-item"><a href="#" class="nav-link ${dark ? 'text-white' : 'text-body'}"><i class="bi bi-envelope me-2"></i>Contacto</a></li>
        </ul>
        <hr>
        <small class="text-secondary">© 2026 Mi Sitio</small>
      </div>
    </div>
    <div class="col-md-9 col-xl-10 p-4">
      <h1>Contenido de la página</h1>
      <p class="text-body-secondary">Arrastra aquí tus componentes.</p>
    </div>
  </div>`;
add('nav', 'sidebar-dark',  'Menú lateral oscuro', 'layout-sidebar', sidebar(true));
add('nav', 'sidebar-light', 'Menú lateral claro',  'layout-sidebar', sidebar(false));
add('nav', 'nav-tabs', 'Pestañas', 'segmented-nav', `
  <div>
    <ul class="nav nav-tabs" role="tablist">
      <li class="nav-item" role="presentation"><a class="nav-link active" data-bs-toggle="tab" data-bs-target="#__UID__-1" role="tab" href="#">Uno</a></li>
      <li class="nav-item" role="presentation"><a class="nav-link" data-bs-toggle="tab" data-bs-target="#__UID__-2" role="tab" href="#">Dos</a></li>
      <li class="nav-item" role="presentation"><a class="nav-link" data-bs-toggle="tab" data-bs-target="#__UID__-3" role="tab" href="#">Tres</a></li>
    </ul>
    <div class="tab-content p-3">
      <div class="tab-pane fade show active" id="__UID__-1" role="tabpanel"><p>Contenido de la pestaña uno.</p></div>
      <div class="tab-pane fade" id="__UID__-2" role="tabpanel"><p>Contenido de la pestaña dos.</p></div>
      <div class="tab-pane fade" id="__UID__-3" role="tabpanel"><p>Contenido de la pestaña tres.</p></div>
    </div>
  </div>`);
add('nav', 'nav-pills', 'Píldoras', 'menu-button-wide',
  '<ul class="nav nav-pills"><li class="nav-item"><a class="nav-link active" href="#">Activo</a></li><li class="nav-item"><a class="nav-link" href="#">Enlace</a></li><li class="nav-item"><a class="nav-link" href="#">Enlace</a></li></ul>');
add('nav', 'breadcrumb', 'Migas de pan', 'chevron-double-right',
  '<nav aria-label="breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="#">Inicio</a></li><li class="breadcrumb-item"><a href="#">Sección</a></li><li class="breadcrumb-item active" aria-current="page">Página</li></ol></nav>');
add('nav', 'pagination', 'Paginación', 'three-dots',
  '<nav aria-label="Paginación"><ul class="pagination"><li class="page-item"><a class="page-link" href="#">Anterior</a></li><li class="page-item active"><a class="page-link" href="#">1</a></li><li class="page-item"><a class="page-link" href="#">2</a></li><li class="page-item"><a class="page-link" href="#">3</a></li><li class="page-item"><a class="page-link" href="#">Siguiente</a></li></ul></nav>');
add('nav', 'dropdown', 'Menú desplegable', 'menu-down',
  '<div class="dropdown"><a class="btn btn-secondary dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Menú</a><ul class="dropdown-menu"><li><a class="dropdown-item" href="#">Acción</a></li><li><a class="dropdown-item" href="#">Otra acción</a></li><li><hr class="dropdown-divider"></li><li><a class="dropdown-item" href="#">Algo más</a></li></ul></div>');

/* ---------- Formularios ---------- */
add('frm', 'form-contact', 'Formulario contacto', 'envelope', `
  <form class="p-3" method="post" action="#">
    <div class="mb-3"><label class="form-label">Nombre</label><input type="text" class="form-control" name="nombre" placeholder="Tu nombre" required></div>
    <div class="mb-3"><label class="form-label">Correo electrónico</label><input type="email" class="form-control" name="correo" placeholder="nombre@ejemplo.com" required></div>
    <div class="mb-3"><label class="form-label">Mensaje</label><textarea class="form-control" name="mensaje" rows="4" placeholder="Escribe tu mensaje"></textarea></div>
    <button type="submit" class="btn btn-primary">Enviar mensaje</button>
  </form>`);
add('frm', 'form-login', 'Formulario acceso', 'box-arrow-in-right', `
  <form class="p-3 mx-auto" style="max-width:380px" method="post" action="#">
    <h3 class="mb-3 text-center">Iniciar sesión</h3>
    <div class="form-floating mb-3"><input type="email" class="form-control" id="__UID__-a" name="correo" placeholder="nombre@ejemplo.com"><label for="__UID__-a">Correo electrónico</label></div>
    <div class="form-floating mb-3"><input type="password" class="form-control" id="__UID__-b" name="clave" placeholder="Contraseña"><label for="__UID__-b">Contraseña</label></div>
    <div class="form-check mb-3"><input class="form-check-input" type="checkbox" id="__UID__-c"><label class="form-check-label" for="__UID__-c">Recordarme</label></div>
    <button type="submit" class="btn btn-primary w-100">Entrar</button>
  </form>`);
add('frm', 'form-newsletter', 'Suscripción', 'send', `
  <form class="row g-2 justify-content-center p-3" method="post" action="#">
    <div class="col-auto"><input type="email" class="form-control" name="correo" placeholder="Tu correo electrónico"></div>
    <div class="col-auto"><button type="submit" class="btn btn-primary">Suscribirme</button></div>
  </form>`);
add('frm', 'form-empty',  'Formulario vacío', 'ui-checks', '<form class="p-3" method="post" action="#"></form>');
add('frm', 'input-text',  'Campo de texto',   'input-cursor-text', '<div class="mb-3"><label class="form-label">Etiqueta</label><input type="text" class="form-control" name="campo" placeholder="Escribe aquí"></div>');
add('frm', 'input-email', 'Campo de correo',  'at', '<div class="mb-3"><label class="form-label">Correo electrónico</label><input type="email" class="form-control" name="correo" placeholder="nombre@ejemplo.com"></div>');
add('frm', 'input-pass',  'Campo contraseña', 'key', '<div class="mb-3"><label class="form-label">Contraseña</label><input type="password" class="form-control" name="clave"></div>');
add('frm', 'input-float', 'Campo flotante',   'input-cursor', '<div class="form-floating mb-3"><input type="text" class="form-control" id="__UID__" name="campo" placeholder="Campo"><label for="__UID__">Campo</label></div>');
add('frm', 'textarea',    'Área de texto',    'textarea-t', '<div class="mb-3"><label class="form-label">Mensaje</label><textarea class="form-control" name="mensaje" rows="4"></textarea></div>');
add('frm', 'select',      'Lista desplegable','menu-button-wide-fill', '<div class="mb-3"><label class="form-label">Selecciona</label><select class="form-select" name="opcion"><option selected>Elige una opción</option><option value="1">Opción 1</option><option value="2">Opción 2</option><option value="3">Opción 3</option></select></div>');
add('frm', 'checkbox',    'Casilla',          'check-square', '<div class="form-check"><input class="form-check-input" type="checkbox" id="__UID__" name="casilla"><label class="form-check-label" for="__UID__">Casilla</label></div>');
add('frm', 'radio',       'Opción (radio)',   'ui-radios', '<div class="form-check"><input class="form-check-input" type="radio" name="grupo" id="__UID__"><label class="form-check-label" for="__UID__">Opción</label></div>');
add('frm', 'switch',      'Interruptor',      'toggle-on', '<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="__UID__" name="interruptor"><label class="form-check-label" for="__UID__">Interruptor</label></div>');
add('frm', 'input-group', 'Grupo de entrada', 'input-cursor-text', '<div class="input-group mb-3"><span class="input-group-text">@</span><input type="text" class="form-control" name="usuario" placeholder="Usuario"></div>');
add('frm', 'range',       'Rango',            'sliders', '<div class="mb-3"><label class="form-label">Rango</label><input type="range" class="form-range" name="rango"></div>');
add('frm', 'file',        'Subir archivo',    'upload', '<div class="mb-3"><label class="form-label">Archivo</label><input class="form-control" type="file" name="archivo"></div>');
add('frm', 'submit',      'Botón enviar',     'send-check', '<button type="submit" class="btn btn-primary">Enviar</button>');

/* ---------- Contenido ---------- */
add('cnt', 'card', 'Tarjeta', 'card-image', `
  <div class="card">
    <img src="${PH(600,400)}" class="card-img-top" alt="Imagen">
    <div class="card-body">
      <h5 class="card-title">Título de la tarjeta</h5>
      <p class="card-text">Texto de ejemplo para el contenido de la tarjeta.</p>
      <a href="#" class="btn btn-primary">Ver más</a>
    </div>
  </div>`);
add('cnt', 'card-simple', 'Tarjeta simple', 'card-text', `
  <div class="card"><div class="card-body"><h5 class="card-title">Título</h5><h6 class="card-subtitle mb-2 text-body-secondary">Subtítulo</h6><p class="card-text">Contenido de la tarjeta.</p><a href="#" class="card-link">Enlace</a></div></div>`);
add('cnt', 'card-h', 'Tarjeta horizontal', 'card-heading', `
  <div class="card mb-3"><div class="row g-0"><div class="col-md-4"><img src="${PH(400,300)}" class="img-fluid rounded-start h-100 object-fit-cover" alt="Imagen"></div><div class="col-md-8"><div class="card-body"><h5 class="card-title">Título</h5><p class="card-text">Descripción de la tarjeta horizontal.</p><a href="#" class="btn btn-primary btn-sm">Leer más</a></div></div></div></div>`);
add('cnt', 'jumbotron', 'Jumbotron', 'window-fullscreen',
  '<div class="p-5 mb-4 rounded-3" style="background-color:#f8f9fa"><div class="container-fluid py-3"><h1 class="display-5 fw-bold">Título destacado</h1><p class="col-md-8 fs-5">Un mensaje breve para captar la atención.</p><a href="#" class="btn btn-primary btn-lg" role="button">Acción</a></div></div>');
add('cnt', 'alert', 'Alerta', 'exclamation-triangle', '<div class="alert alert-primary" role="alert">Este es un mensaje de alerta. Cambia el color con las clases <b>alert-success</b>, <b>alert-danger</b>, etc.</div>');
add('cnt', 'badge', 'Insignia', 'tag', '<span class="badge text-bg-primary">Nuevo</span>');
add('cnt', 'list-group', 'Lista de grupo', 'list-check',
  '<ul class="list-group"><li class="list-group-item active">Elemento activo</li><li class="list-group-item">Segundo elemento</li><li class="list-group-item">Tercer elemento</li></ul>');
add('cnt', 'accordion', 'Acordeón', 'chevron-expand', `
  <div class="accordion" id="__UID__">
    <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#__UID__-1" aria-expanded="true">Elemento #1</button></h2>
      <div id="__UID__-1" class="accordion-collapse collapse show" data-bs-parent="#__UID__"><div class="accordion-body">Contenido del primer elemento.</div></div></div>
    <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#__UID__-2" aria-expanded="false">Elemento #2</button></h2>
      <div id="__UID__-2" class="accordion-collapse collapse" data-bs-parent="#__UID__"><div class="accordion-body">Contenido del segundo elemento.</div></div></div>
    <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#__UID__-3" aria-expanded="false">Elemento #3</button></h2>
      <div id="__UID__-3" class="accordion-collapse collapse" data-bs-parent="#__UID__"><div class="accordion-body">Contenido del tercer elemento.</div></div></div>
  </div>`);
add('cnt', 'carousel', 'Carrusel', 'images', `
  <div id="__UID__" class="carousel slide" data-bs-ride="carousel">
    <div class="carousel-indicators">
      <button type="button" data-bs-target="#__UID__" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Diapositiva 1"></button>
      <button type="button" data-bs-target="#__UID__" data-bs-slide-to="1" aria-label="Diapositiva 2"></button>
      <button type="button" data-bs-target="#__UID__" data-bs-slide-to="2" aria-label="Diapositiva 3"></button>
    </div>
    <div class="carousel-inner">
      <div class="carousel-item active"><img src="${PH(1200,500,'Diapositiva 1')}" class="d-block w-100" alt="Diapositiva 1"></div>
      <div class="carousel-item"><img src="${PH(1200,500,'Diapositiva 2')}" class="d-block w-100" alt="Diapositiva 2"></div>
      <div class="carousel-item"><img src="${PH(1200,500,'Diapositiva 3')}" class="d-block w-100" alt="Diapositiva 3"></div>
    </div>
    <button class="carousel-control-prev" type="button" data-bs-target="#__UID__" data-bs-slide="prev"><span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Anterior</span></button>
    <button class="carousel-control-next" type="button" data-bs-target="#__UID__" data-bs-slide="next"><span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Siguiente</span></button>
  </div>`);
add('cnt', 'modal', 'Modal', 'window', `
  <div>
    <a class="btn btn-primary" role="button" href="#" data-bs-toggle="modal" data-bs-target="#__UID__">Abrir modal</a>
    <div class="modal fade" id="__UID__" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog"><div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">Título del modal</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
        <div class="modal-body"><p>Contenido del modal.</p></div>
        <div class="modal-footer"><a class="btn btn-secondary" role="button" href="#" data-bs-dismiss="modal">Cerrar</a><a class="btn btn-primary" role="button" href="#">Guardar</a></div>
      </div></div>
    </div>
  </div>`);
add('cnt', 'progress', 'Barra de progreso', 'bar-chart-steps',
  '<div class="progress" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width: 60%">60%</div></div>');
add('cnt', 'spinner', 'Indicador de carga', 'arrow-repeat', '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando…</span></div>');
add('cnt', 'table', 'Tabla', 'table', `
  <div class="table-responsive"><table class="table table-striped table-hover">
    <thead><tr><th scope="col">#</th><th scope="col">Nombre</th><th scope="col">Correo</th></tr></thead>
    <tbody>
      <tr><th scope="row">1</th><td>Ana</td><td>ana@ejemplo.com</td></tr>
      <tr><th scope="row">2</th><td>Luis</td><td>luis@ejemplo.com</td></tr>
      <tr><th scope="row">3</th><td>María</td><td>maria@ejemplo.com</td></tr>
    </tbody>
  </table></div>`);

/* ---------- Secciones prediseñadas ---------- */
add('sec', 'hero', 'Hero centrado', 'window-fullscreen', `
  <section class="py-5 text-center" style="background-color:#f8f9fa"><div class="container py-5">
    <h1 class="display-4 fw-bold">Título principal</h1>
    <p class="lead text-body-secondary col-lg-8 mx-auto">Describe en una frase qué ofreces y por qué es valioso para tus visitantes.</p>
    <div class="d-grid gap-2 d-sm-flex justify-content-sm-center mt-4">
      <a href="#" class="btn btn-primary btn-lg px-4" role="button">Comenzar</a>
      <a href="#" class="btn btn-outline-secondary btn-lg px-4" role="button">Saber más</a>
    </div>
  </div></section>`);
add('sec', 'hero-img', 'Hero con imagen', 'layout-text-window-reverse', `
  <section class="py-5"><div class="container"><div class="row align-items-center g-5">
    <div class="col-lg-6"><h1 class="display-5 fw-bold">Título con imagen</h1><p class="lead">Un texto de apoyo que explica tu propuesta de valor de forma clara y breve.</p><a href="#" class="btn btn-primary btn-lg" role="button">Comenzar</a></div>
    <div class="col-lg-6"><img src="${PH(700,480)}" class="img-fluid rounded shadow" alt="Imagen"></div>
  </div></div></section>`);
add('sec', 'hero-bg', 'Hero con imagen de fondo', 'image-alt', `
  <section class="py-5 text-center" style="background-image:url(${PH(1600,700)});background-size:cover;background-position:center;color:#ffffff;box-shadow:inset 0 0 0 100vmax rgba(0, 0, 0, 0.5)"><div class="container py-5">
    <h1 class="display-4 fw-bold">Título sobre imagen</h1>
    <p class="lead col-lg-8 mx-auto">Texto sobre una imagen de fondo con una capa de color encima. Ajusta la capa en el panel Estilo.</p>
    <a href="#" class="btn btn-light btn-lg" role="button">Comenzar</a>
  </div></section>`);
add('sec', 'features', 'Características', 'grid-3x3-gap', `
  <section class="py-5"><div class="container">
    <div class="text-center mb-5"><h2 class="fw-bold">Características</h2><p class="text-body-secondary">Lo que hace especial tu proyecto</p></div>
    <div class="row g-4">
      <div class="col-md-4 text-center"><i class="bi bi-lightning-charge fs-1 text-primary"></i><h3 class="h4 mt-3">Rápido</h3><p class="text-body-secondary">Descripción breve de la primera característica.</p></div>
      <div class="col-md-4 text-center"><i class="bi bi-shield-check fs-1 text-primary"></i><h3 class="h4 mt-3">Seguro</h3><p class="text-body-secondary">Descripción breve de la segunda característica.</p></div>
      <div class="col-md-4 text-center"><i class="bi bi-heart fs-1 text-primary"></i><h3 class="h4 mt-3">Fácil de usar</h3><p class="text-body-secondary">Descripción breve de la tercera característica.</p></div>
    </div>
  </div></section>`);
add('sec', 'stats', 'Estadísticas', 'graph-up', `
  <section class="py-5" style="background-color:#f8f9fa"><div class="container"><div class="row text-center g-4">
    <div class="col-6 col-md-3"><div class="display-5 fw-bold text-primary">120+</div><div class="text-body-secondary">Clientes</div></div>
    <div class="col-6 col-md-3"><div class="display-5 fw-bold text-primary">350</div><div class="text-body-secondary">Proyectos</div></div>
    <div class="col-6 col-md-3"><div class="display-5 fw-bold text-primary">15</div><div class="text-body-secondary">Años</div></div>
    <div class="col-6 col-md-3"><div class="display-5 fw-bold text-primary">24/7</div><div class="text-body-secondary">Soporte</div></div>
  </div></div></section>`);
const plan = (nombre, precio, dest) => `
  <div class="col-md-4"><div class="card h-100 text-center ${dest ? 'border-primary shadow' : ''}">
    <div class="card-header ${dest ? 'bg-primary text-white' : ''}">${nombre}</div>
    <div class="card-body"><h2 class="card-title">$${precio}<small class="text-body-secondary fw-light fs-6">/mes</small></h2>
      <ul class="list-unstyled my-4"><li>Característica uno</li><li>Característica dos</li><li>Característica tres</li></ul>
      <a href="#" class="btn ${dest ? 'btn-primary' : 'btn-outline-primary'} w-100" role="button">Elegir plan</a></div>
  </div></div>`;
add('sec', 'pricing', 'Precios', 'currency-dollar', `
  <section class="py-5"><div class="container">
    <div class="text-center mb-5"><h2 class="fw-bold">Planes y precios</h2><p class="text-body-secondary">Elige el plan que mejor se adapte a ti</p></div>
    <div class="row g-4">${plan('Básico', 9, false)}${plan('Profesional', 29, true)}${plan('Empresa', 59, false)}</div>
  </div></section>`);
const testi = (n) => `
  <div class="col-md-4"><div class="card h-100"><div class="card-body">
    <p class="card-text">“Excelente servicio, superó todas mis expectativas.”</p>
    <div class="d-flex align-items-center gap-3 mt-3"><img src="${PH(48,48)}" class="rounded-circle" alt="Foto"><div><div class="fw-semibold">Cliente ${n}</div><small class="text-body-secondary">Cargo, Empresa</small></div></div>
  </div></div></div>`;
add('sec', 'testimonials', 'Testimonios', 'chat-quote', `
  <section class="py-5" style="background-color:#f8f9fa"><div class="container">
    <h2 class="fw-bold text-center mb-5">Lo que dicen nuestros clientes</h2>
    <div class="row g-4">${testi(1)}${testi(2)}${testi(3)}</div>
  </div></section>`);
const miembro = (n) => `
  <div class="col-6 col-md-3 text-center"><img src="${PH(200,200)}" class="rounded-circle mb-3" alt="Miembro ${n}"><h3 class="h5 mb-0">Nombre ${n}</h3><small class="text-body-secondary">Cargo</small></div>`;
add('sec', 'team', 'Equipo', 'people', `
  <section class="py-5"><div class="container">
    <h2 class="fw-bold text-center mb-5">Nuestro equipo</h2>
    <div class="row g-4">${miembro(1)}${miembro(2)}${miembro(3)}${miembro(4)}</div>
  </div></section>`);
add('sec', 'cta', 'Llamado a la acción', 'megaphone', `
  <section class="py-5 text-center" style="background-color:#0d6efd;color:#ffffff"><div class="container py-3">
    <h2 class="fw-bold">¿Listo para comenzar?</h2>
    <p class="lead">Únete hoy y descubre todo lo que podemos hacer por ti.</p>
    <a href="#" class="btn btn-light btn-lg" role="button">Contáctanos</a>
  </div></section>`);
add('sec', 'faq', 'Preguntas frecuentes', 'question-circle', `
  <section class="py-5"><div class="container" style="max-width:800px">
    <h2 class="fw-bold text-center mb-4">Preguntas frecuentes</h2>
    <div class="accordion" id="__UID__">
      <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#__UID__-1" aria-expanded="true">¿Primera pregunta?</button></h2>
        <div id="__UID__-1" class="accordion-collapse collapse show" data-bs-parent="#__UID__"><div class="accordion-body">Respuesta a la primera pregunta.</div></div></div>
      <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#__UID__-2" aria-expanded="false">¿Segunda pregunta?</button></h2>
        <div id="__UID__-2" class="accordion-collapse collapse" data-bs-parent="#__UID__"><div class="accordion-body">Respuesta a la segunda pregunta.</div></div></div>
    </div>
  </div></section>`);
add('sec', 'contact', 'Contacto', 'envelope-paper', `
  <section class="py-5"><div class="container"><div class="row g-5">
    <div class="col-md-5"><h2 class="fw-bold">Contáctanos</h2><p class="text-body-secondary">Escríbenos y te responderemos lo antes posible.</p>
      <p><i class="bi bi-geo-alt me-2"></i>Dirección, Ciudad</p><p><i class="bi bi-envelope me-2"></i>correo@ejemplo.com</p><p><i class="bi bi-telephone me-2"></i>+593 000 000 000</p></div>
    <div class="col-md-7"><form method="post" action="#">
      <div class="row g-3"><div class="col-md-6"><input type="text" class="form-control" name="nombre" placeholder="Nombre"></div><div class="col-md-6"><input type="email" class="form-control" name="correo" placeholder="Correo"></div></div>
      <textarea class="form-control mt-3" name="mensaje" rows="5" placeholder="Mensaje"></textarea>
      <button type="submit" class="btn btn-primary mt-3">Enviar</button>
    </form></div>
  </div></div></section>`);
const foto = (n) => `<div class="col-6 col-md-4"><img src="${PH(500,400,'Foto '+n)}" class="img-fluid rounded" alt="Foto ${n}"></div>`;
add('sec', 'gallery', 'Galería', 'grid-3x3', `
  <section class="py-5"><div class="container"><h2 class="fw-bold text-center mb-4">Galería</h2>
    <div class="row g-3">${foto(1)}${foto(2)}${foto(3)}${foto(4)}${foto(5)}${foto(6)}</div></div></section>`);
add('sec', 'footer', 'Pie de página', 'layout-text-window-reverse', `
  <footer class="py-5" style="background-color:#212529;color:#f8f9fa"><div class="container">
    <div class="row">
      <div class="col-md-4"><h2 class="h5">Mi Sitio</h2><p class="text-secondary">Breve descripción de tu proyecto o empresa.</p></div>
      <div class="col-md-4"><h2 class="h5">Enlaces</h2><ul class="list-unstyled"><li><a href="index.html" class="link-light text-decoration-none">Inicio</a></li><li><a href="#" class="link-light text-decoration-none">Servicios</a></li><li><a href="#" class="link-light text-decoration-none">Contacto</a></li></ul></div>
      <div class="col-md-4"><h2 class="h5">Contacto</h2><p class="text-secondary mb-1">correo@ejemplo.com</p><p class="text-secondary">+593 000 000 000</p></div>
    </div>
    <hr class="border-secondary">
    <p class="text-center text-secondary mb-0">© 2026 Mi Sitio. Todos los derechos reservados.</p>
  </div></footer>`);

/* ---------- Media ---------- */
add('med', 'image', 'Imagen', 'image', { type: 'image', attributes: { class: 'img-fluid' } }, { select: true, activate: true });
add('med', 'image-round', 'Imagen redonda', 'person-circle', { type: 'image', attributes: { class: 'img-fluid rounded-circle' } }, { select: true, activate: true });
add('med', 'video', 'Video (YouTube / Vimeo)', 'play-btn',
  { type: 'video', src: 'https://www.youtube.com/embed/jNQXAC9IVRw', style: { height: '350px', width: '100%' } }, { select: true });
add('med', 'video-file', 'Video (archivo o URL .mp4)', 'camera-video',
  { type: 'video', provider: 'so', controls: 1, style: { height: '350px', width: '100%' } }, { select: true });
add('med', 'map', 'Mapa', 'geo-alt', { type: 'map', style: { height: '350px', width: '100%' } }, { select: true });
add('med', 'icon', 'Ícono', 'star', '<i class="bi bi-star-fill fs-1 text-warning"></i>');
add('med', 'placeholder', 'Imagen de ejemplo', 'card-image', `<img src="${PH(600,400)}" class="img-fluid" alt="Imagen de ejemplo">`);

SITIO.registrar();

/* ---------- IDs únicos al soltar un bloque ----------
   Primero se reemplazan los marcadores __UID__ y DESPUÉS se buscan id
   repetidos: al revés, se comparaban id que todavía no eran definitivos. */
/* ---------- id repetidos ----------
   Dos secciones con el mismo id rompen las anclas: el navegador salta
   siempre a la primera. Al soltar un bloque que trae un id ya usado se
   renombra, y se corrigen los enlaces internos de ese mismo bloque. */
function renombrarIdsRepetidos(comp) {
  if (!comp || !comp.components) return;

  const dentro = new Set();
  recorrer(comp, c => dentro.add(c));

  const ocupados = new Set();
  const w = editor.getWrapper();
  if (w) w.components().forEach(c => recorrer(c, x => {
    if (dentro.has(x)) return;
    const id = (x.get('attributes') || {}).id;
    if (id) ocupados.add(id);
  }));

  const cambios = new Map();
  recorrer(comp, c => {
    const id = (c.get('attributes') || {}).id;
    if (!id) return;
    if (!ocupados.has(id)) { ocupados.add(id); return; }
    let n = 2, nuevo = id + '-' + n;
    while (ocupados.has(nuevo)) { n++; nuevo = id + '-' + n; }
    ocupados.add(nuevo);
    cambios.set('#' + id, '#' + nuevo);
    c.addAttributes({ id: nuevo });
  });

  if (!cambios.size) return;
  recorrer(comp, c => {
    const a = c.get('attributes') || {};
    ['href', 'data-ir-a'].forEach(k => {
      if (a[k] && cambios.has(a[k])) c.addAttributes({ [k]: cambios.get(a[k]) });
    });
  });
  toast(cambios.size === 1 ? 'Había un id repetido: se renombró' : `Había ${cambios.size} id repetidos: se renombraron`);
}

editor.on('block:drag:stop', (component) => {
  if (!component || !component.components) return;
  const uid = 'u' + Math.random().toString(36).slice(2, 8);
  recorrer(component, (c) => {
    const attrs = { ...(c.get('attributes') || {}) };
    let changed = false;
    Object.keys(attrs).forEach(k => {
      if (typeof attrs[k] === 'string' && attrs[k].includes('__UID__')) {
        attrs[k] = attrs[k].replace(/__UID__/g, uid);
        changed = true;
      }
    });
    if (changed) c.setAttributes(attrs);
  });
  renombrarIdsRepetidos(component);
});

/* =====================================================================
   Búsqueda de componentes
===================================================================== */
$('#q').addEventListener('input', (e) => {
  const t = e.target.value.trim().toLowerCase();
  $$('#blocks .gjs-block').forEach(el =>
    el.style.display = (!t || el.textContent.toLowerCase().includes(t)) ? '' : 'none');
  try {
    editor.Blocks.getCategories().forEach(c => c.set('open', t ? true : c.get('label') === 'Estructura'));
  } catch (err) { /* sin efecto */ }
  $$('#blocks .gjs-block-category').forEach(cat => {
    const hay = $$('.gjs-block', cat).some(b => b.style.display !== 'none');
    cat.style.display = hay ? '' : 'none';
  });
});

// Plantillas
function unico(html) {
  const u = 'u' + Math.random().toString(36).slice(2, 8);
  return html.replace(/__UID__/g, u);
}
function aplicarPlantilla(modo) {
  const P = SITIO.PLANTILLAS;
  const armar = (k) => P[k]().map(unico).join('\n');
  if (modo === 'completo') editor.Pages.select(editor.Pages.getAll()[0]);
  editor.setComponents(armar('inicio'));
  if (modo === 'completo') {
    const existentes = editor.Pages.getAll().map(p => slug(nombrePagina(p)));
    [['Servicios', 'servicios'], ['Galería', 'galeria'], ['Contacto', 'contacto']].forEach(([nombre, k]) => {
      if (!existentes.includes(slug(nombre))) editor.Pages.add({ name: nombre, component: armar(k) });
    });
    editor.Pages.select(editor.Pages.getAll()[0]);
  }
  // Cada página queda con header / main / footer
  (modo === 'completo' ? editor.Pages.getAll() : [editor.Pages.getSelected()])
    .forEach(p => aplicarSemantica(p.getMainComponent()));
  renderPages();
  editor.store();
  toast(modo === 'completo' ? 'Sitio de 4 páginas creado' : 'Página de inicio creada');
}
const paginaVacia = () => { const w = editor.getWrapper(); return !w || !w.components().length; };
const proyectoVacio = () => editor.Pages.getAll().length <= 1 && paginaVacia();

// bienvenida = true la primera vez que se abre el editor sin nada hecho
function abrirPlantillas(bienvenida = false) {
  const w = document.createElement('div');
  w.innerHTML = `
    ${bienvenida ? '<p class="imp-hint" style="font-size:14px;color:#fff">¡Hola! Con este editor armas un sitio web completo arrastrando piezas, sin escribir código. ¿Cómo quieres empezar?</p>' : ''}
    <p class="imp-hint">Todo se puede editar después: textos, imágenes, colores, fuentes y secciones.</p>
    <div class="plantilla" data-modo="completo"><i class="bi bi-collection"></i><div><b>Sitio web completo (4 páginas)</b><span>Inicio, Servicios, Galería y Contacto, ya enlazadas entre sí, con menú, pie de página y botón de WhatsApp. Reemplaza el contenido de la página de inicio.</span></div></div>
    <div class="plantilla" data-modo="inicio"><i class="bi bi-house-door"></i><div><b>Solo una página de inicio</b><span>Menú, hero con video, destacados, servicios, testimonios y pie. Reemplaza el contenido de la página actual.</span></div></div>
    <div class="plantilla" data-modo="blanco"><i class="bi bi-file-earmark"></i><div><b>Página en blanco</b><span>Empieza desde cero arrastrando componentes del panel izquierdo (pestaña «Componentes»).</span></div></div>
    ${bienvenida ? '<p class="hint">Puedes volver a abrir esta ventana con el botón «Plantillas» y ver la ayuda con <b>F1</b>.</p>' : ''}`;
  w.querySelectorAll('.plantilla').forEach(el => el.addEventListener('click', () => {
    const modo = el.dataset.modo;
    if (modo === 'blanco') {
      if (!paginaVacia() && !confirm('¿Vaciar el contenido de la página actual?')) return;
      editor.setComponents('');
      editor.Modal.close();
      showTab('left', 'blocks');
      toast('Arrastra un componente del panel izquierdo al lienzo', 3500);
      return;
    }
    if (!paginaVacia() && !confirm('Esto reemplaza el contenido de la página actual. ¿Continuar?')) return;
    editor.Modal.close();
    aplicarPlantilla(modo);
  }));
  editor.Modal.open({ title: bienvenida ? 'Bienvenido al editor' : 'Plantillas', content: w });
}
$('#btn-templates').onclick = () => abrirPlantillas(false);
