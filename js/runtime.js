/* =====================================================================
   Código que corre en el SITIO (vista previa, ZIP y publicación)
   Se escribe como funciones normales y el generador las copia con
   .toString(): así hay una sola versión y se comporta igual en los tres.
   Sin dependencias y en JavaScript compatible con navegadores antiguos.
===================================================================== */

/* ---------- Formularios: validación, envío y estados ----------
   <form data-formulario="contacto" data-destino="servicio|url|correo|previa" data-endpoint="…">
   · valida en el navegador (mensajes en español junto a cada campo);
   · pide un token al servidor al cargar (cuenta el tiempo mínimo de llenado);
   · incluye un campo trampa invisible (_web) contra robots;
   · muestra «Enviando…», éxito o error en una zona aria-live. */
function runtimeFormularios(w) {
  var d = w.document;
  var forms = [].slice.call(d.querySelectorAll('form[data-formulario]'));
  if (!forms.length) return;
  var MSG = {
    valueMissing: 'Este campo es obligatorio.',
    typeMismatch: 'Revisa el formato (por ejemplo, nombre@dominio.com).',
    tooShort: 'Es demasiado corto.', tooLong: 'Es demasiado largo.',
    patternMismatch: 'El formato no es válido.'
  };
  var mensajeDe = function (c) {
    var v = c.validity;
    for (var k in MSG) if (v[k]) return (k === 'typeMismatch' && c.type !== 'email') ? 'El formato no es válido.' : MSG[k];
    return c.validationMessage || 'Revisa este campo.';
  };
  forms.forEach(function (f, n) {
    f.setAttribute('novalidate', '');
    var destino = f.getAttribute('data-destino') || 'servicio';
    var endpoint = f.getAttribute('data-endpoint') || '';
    var estado = f.querySelector('.form-estado');
    if (!estado) {
      estado = d.createElement('div');
      estado.className = 'form-estado';
      estado.setAttribute('role', 'status');
      estado.setAttribute('aria-live', 'polite');
      f.appendChild(estado);
    }
    var boton = f.querySelector('[type=submit]') || f.querySelector('button:not([type=button])');
    var trampa = f.querySelector('input[name="_web"]');
    var pedirToken = function () {
      if (destino !== 'servicio' || !endpoint || !w.fetch) return Promise.resolve('');
      return w.fetch(endpoint + '/token').then(function (r) { return r.json(); })
        .then(function (j) { return j.token || ''; })['catch'](function () { return ''; });
    };
    var token = pedirToken();
    var poner = function (clase, texto) { estado.className = 'form-estado ' + clase; estado.textContent = texto; };
    var limpiar = function () {
      [].forEach.call(f.querySelectorAll('[aria-invalid]'), function (c) {
        c.removeAttribute('aria-invalid');
        c.classList.remove('is-invalid');
        var e = d.getElementById(c.getAttribute('data-error-id') || '');
        if (e) e.parentNode.removeChild(e);
        var db = (c.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== c.getAttribute('data-error-id'); }).join(' ');
        if (db) c.setAttribute('aria-describedby', db); else c.removeAttribute('aria-describedby');
      });
    };
    var marcar = function (c, texto) {
      var id = 'err-' + n + '-' + (c.name || c.id || Math.random().toString(36).slice(2, 6));
      c.setAttribute('aria-invalid', 'true');
      c.classList.add('is-invalid');
      c.setAttribute('data-error-id', id);
      c.setAttribute('aria-describedby', ((c.getAttribute('aria-describedby') || '') + ' ' + id).trim());
      var e = d.createElement('div');
      e.className = 'invalid-feedback d-block';
      e.id = id;
      e.textContent = texto;
      c.parentNode.insertBefore(e, c.nextSibling);
    };
    var ocupado = function (si) {
      if (boton) { boton.disabled = si; if (si) boton.setAttribute('aria-busy', 'true'); else boton.removeAttribute('aria-busy'); }
      f.setAttribute('aria-busy', si ? 'true' : 'false');
    };
    var exito = function (t) { ocupado(false); poner('ok', t || f.getAttribute('data-msg-ok') || '¡Gracias! Recibimos tu mensaje y te responderemos pronto.'); };
    var fallo = function (t, errores) {
      ocupado(false);
      var primero = null;
      if (errores) for (var k in errores) {
        var c = f.querySelector('[name="' + k.replace(/"/g, '') + '"]');
        if (c) { marcar(c, errores[k]); primero = primero || c; }
      }
      poner('error', t || f.getAttribute('data-msg-error') || 'No se pudo enviar. Inténtalo de nuevo en unos minutos.');
      if (primero) primero.focus();
    };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      limpiar();
      var malos = [].filter.call(f.elements, function (c) { return c.willValidate && !c.checkValidity(); });
      if (malos.length) {
        malos.forEach(function (c) { marcar(c, mensajeDe(c)); });
        poner('error', malos.length === 1 ? 'Revisa el campo marcado.' : 'Revisa los ' + malos.length + ' campos marcados.');
        malos[0].focus();
        return;
      }
      var campos = {}, requeridos = [];
      [].forEach.call(f.elements, function (c) {
        if (!c.name || c.name.charAt(0) === '_' || c.disabled || c.type === 'file' || c.type === 'submit' || c.type === 'button') return;
        if ((c.type === 'checkbox' || c.type === 'radio') && !c.checked) { if (!(c.name in campos)) campos[c.name] = ''; return; }
        campos[c.name] = campos[c.name] ? campos[c.name] + ', ' + c.value : c.value;
        if (c.required) requeridos.push(c.name);
      });
      ocupado(true);
      poner('enviando', 'Enviando…');
      if (destino === 'previa') {
        setTimeout(function () { exito('Vista previa: el formulario funciona, pero aquí no se envía. En el sitio publicado el mensaje llegará al servidor.'); }, 350);
        return;
      }
      if (destino === 'correo') {
        var cuerpo = Object.keys(campos).map(function (k) { return k + ': ' + campos[k]; }).join('\n');
        w.location.href = endpoint + (endpoint.indexOf('?') < 0 ? '?' : '&') + 'subject=' + encodeURIComponent(d.title) + '&body=' + encodeURIComponent(cuerpo);
        exito('Se abrió tu programa de correo con el mensaje listo para enviar.');
        return;
      }
      if (!endpoint || !w.fetch) { fallo('Este formulario todavía no tiene a dónde enviar los mensajes.'); return; }
      token.then(function (tk) {
        return w.fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ campos: campos, _token: tk, _web: trampa ? trampa.value : '', _requeridos: requeridos,
            _formulario: f.getAttribute('data-formulario'), _pagina: w.location.pathname })
        });
      }).then(function (r) {
        return r.json()['catch'](function () { return {}; }).then(function (j) { return { r: r, j: j }; });
      }).then(function (x) {
        if (x.r.ok && x.j.ok !== false) { f.reset(); exito(); token = pedirToken(); }
        else fallo(x.j.error, x.j.errores);
      })['catch'](function () { fallo('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'); });
    });
  });
}

/* ---------- Solo en la vista previa del editor ----------
   La vista previa vive en un iframe aislado (sin acceso al editor). Los
   enlaces entre páginas se piden al editor por postMessage. */
function runtimePrevia(w) {
  var d = w.document;
  w.__modoPrevia = true;
  var pedir = function (m) { m.__previa = 1; w.parent.postMessage(m, '*'); };
  w.__navegar = function (u) { pedir({ tipo: 'ir', destino: String(u) }); };
  d.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.hasAttribute('data-bs-toggle')) return;
    var h = a.getAttribute('href') || '';
    if (!h || h.charAt(0) === '#') return;
    e.preventDefault();
    if (/^(https?:)?\/\//i.test(h)) pedir({ tipo: 'externo', url: h });
    else if (/^[a-z][a-z0-9+.-]*:/i.test(h)) pedir({ tipo: 'aviso', texto: 'Los enlaces ' + h.split(':')[0] + ': funcionan en el sitio publicado.' });
    else w.__navegar(h);
  });
  var ir = function () {
    var h = w.__hashInicial;
    if (!h) return;
    var el = null;
    try { el = d.getElementById(decodeURIComponent(h)); } catch (x) { el = null; }
    if (el) el.scrollIntoView();
  };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', ir); else ir();
}

/* =====================================================================
   Interacciones: «Cuando ocurre → sobre este elemento → ejecuta esta acción»
   Las reglas viven en el elemento de origen, como datos JSON:
     data-int='[{ "id": "r1", "evento": "clic",
                  "condicion": { "variable": "plan", "op": "igual", "valor": "pro" },
                  "acciones": [{ "tipo": "alternar", "objetivo": "i-menu" }] }]'
   y los destinos se nombran con una referencia estable: data-iid="i-menu".
   El estado de un destino es data-estado="abierto|cerrado|<otro>".
===================================================================== */
var INT_EVENTOS = ['clic', 'foco', 'visible'];
var INT_ACCIONES = ['abrir', 'cerrar', 'alternar', 'navegar', 'estado', 'variable'];
// Valida la ESTRUCTURA de las reglas (no mira el documento). Devuelve las
// reglas válidas, ya limpias, y la lista de errores en español.
function validarReglasInt(datos) {
  var res = { reglas: [], errores: [] };
  var nombre = /^[a-z][a-z0-9-]{0,30}$/;
  var ref = /^[A-Za-z][\w-]{0,60}$/;
  var texto = function (v) { return typeof v === 'string' && v.length <= 200; };
  if (typeof datos === 'string') { try { datos = JSON.parse(datos); } catch (e) { res.errores.push('Los datos no son JSON válido'); return res; } }
  if (!datos || typeof datos.length !== 'number') { res.errores.push('Se esperaba una lista de reglas'); return res; }
  for (var i = 0; i < datos.length && i < 20; i++) {
    var r = datos[i], n = 'Regla ' + (i + 1) + ': ';
    if (!r || typeof r !== 'object') { res.errores.push(n + 'no es un objeto'); continue; }
    if (INT_EVENTOS.indexOf(r.evento) < 0) { res.errores.push(n + 'evento desconocido «' + r.evento + '»'); continue; }
    var limpia = { id: (typeof r.id === 'string' && ref.test(r.id)) ? r.id : 'r' + (i + 1), evento: r.evento, acciones: [] };
    if (r.evento === 'visible') limpia.unaVez = r.unaVez !== false;
    if (r.condicion) {
      var c = r.condicion;
      if (!c || !nombre.test(c.variable || '') || ['igual', 'distinto', 'vacia', 'definida'].indexOf(c.op) < 0 || (c.valor !== undefined && !texto(c.valor))) {
        res.errores.push(n + 'la condición no es válida'); continue;
      }
      limpia.condicion = { variable: c.variable, op: c.op, valor: c.valor === undefined ? '' : c.valor };
    }
    var acc = r.acciones;
    if (!acc || typeof acc.length !== 'number' || !acc.length) { res.errores.push(n + 'no tiene acciones'); continue; }
    var malas = 0;
    for (var j = 0; j < acc.length && j < 8; j++) {
      var a = acc[j];
      if (!a || INT_ACCIONES.indexOf(a.tipo) < 0) { malas++; continue; }
      var x = { tipo: a.tipo };
      if (a.tipo === 'abrir' || a.tipo === 'cerrar' || a.tipo === 'alternar' || a.tipo === 'estado') {
        if (a.objetivo !== undefined && a.objetivo !== '' && !ref.test(a.objetivo)) { malas++; continue; }
        x.objetivo = a.objetivo || '';
      }
      if (a.tipo === 'estado') { if (!nombre.test(a.valor || '')) { malas++; continue; } x.valor = a.valor; }
      if (a.tipo === 'navegar') {
        var u = String(a.valor || '').trim();
        if (!u || u.length > 300 || /^(javascript|data|vbscript):/i.test(u) || !/^(#[\w-]+|https?:\/\/\S+|mailto:\S+|tel:[\d+ ()-]+|[\w./-]+\.html(#[\w-]+)?)$/i.test(u)) { malas++; continue; }
        x.valor = u;
      }
      if (a.tipo === 'variable') { if (!nombre.test(a.nombre || '') || !texto(a.valor === undefined ? '' : a.valor)) { malas++; continue; } x.nombre = a.nombre; x.valor = a.valor === undefined ? '' : a.valor; }
      limpia.acciones.push(x);
    }
    if (malas) res.errores.push(n + malas + ' acción(es) no válida(s)');
    if (limpia.acciones.length) res.reglas.push(limpia);
  }
  return res;
}

function runtimeInteracciones(w) {
  var d = w.document;
  var reducir = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (!reducir) d.documentElement.classList.add('int-movimiento');
  var vars = {};
  try { vars = JSON.parse(w.sessionStorage.getItem('int-variables') || '{}') || {}; } catch (e) { vars = {}; }
  var guardarVars = function () { try { w.sessionStorage.setItem('int-variables', JSON.stringify(vars)); } catch (e) { /* sin almacenamiento */ } };
  var porRef = function (id) { try { return d.querySelector('[data-iid="' + id + '"]'); } catch (e) { return null; } };
  var ENFOCABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var abierto = function (el) { return el.getAttribute('data-estado') !== 'cerrado'; };
  var esModal = function (el) { return el.getAttribute('data-int-tipo') === 'modal' || el.getAttribute('role') === 'dialog'; };
  var sincronizar = function (el) {
    if (!el.id) return;
    [].forEach.call(d.querySelectorAll('[aria-controls]'), function (b) {
      if ((' ' + b.getAttribute('aria-controls') + ' ').indexOf(' ' + el.id + ' ') >= 0 && !esModal(el)) b.setAttribute('aria-expanded', abierto(el) ? 'true' : 'false');
    });
  };
  var pila = [];   // modales abiertos (el último es el de arriba)
  var abrir = function (el, origen) {
    if (esModal(el)) {
      if (abierto(el)) return;
      pila.push({ el: el, volver: origen || d.activeElement });
      el.setAttribute('data-estado', 'abierto');
      d.documentElement.classList.add('int-modal-abierto');
      var f = el.querySelector(ENFOCABLE);
      if (!f) { el.setAttribute('tabindex', '-1'); f = el; }
      setTimeout(function () { f.focus(); }, 0);
      return;
    }
    el.setAttribute('data-estado', 'abierto');
    sincronizar(el);
  };
  var cerrar = function (el) {
    if (esModal(el)) {
      if (!abierto(el)) return;
      el.setAttribute('data-estado', 'cerrado');
      var i = -1;
      for (var k = 0; k < pila.length; k++) if (pila[k].el === el) i = k;
      var volver = i >= 0 ? pila.splice(i, 1)[0].volver : null;
      if (!pila.length) d.documentElement.classList.remove('int-modal-abierto');
      if (volver && volver.focus) volver.focus();
      return;
    }
    var teniaFoco = el.contains(d.activeElement);
    el.setAttribute('data-estado', 'cerrado');
    sincronizar(el);
    if (teniaFoco) {
      var b = el.id && d.querySelector('[aria-controls~="' + el.id + '"]');
      if (b) b.focus();
    }
  };
  var navegar = function (u) {
    if (u.charAt(0) === '#') {
      var dest = d.getElementById(u.slice(1));
      if (dest) {
        dest.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' });
        if (!dest.hasAttribute('tabindex') && !dest.matches(ENFOCABLE)) dest.setAttribute('tabindex', '-1');
        dest.focus({ preventScroll: true });
      }
      return;
    }
    if (w.__navegar) w.__navegar(u); else w.location.href = u;
  };
  var cumple = function (c) {
    if (!c) return true;
    var v = vars[c.variable];
    if (c.op === 'igual') return String(v === undefined ? '' : v) === c.valor;
    if (c.op === 'distinto') return String(v === undefined ? '' : v) !== c.valor;
    if (c.op === 'vacia') return v === undefined || v === '';
    return v !== undefined && v !== '';
  };
  var ejecutar = function (regla, origen) {
    if (!cumple(regla.condicion)) return;
    regla.acciones.forEach(function (a) {
      var el = a.objetivo ? porRef(a.objetivo) : origen;
      if (a.tipo === 'variable') { vars[a.nombre] = a.valor; guardarVars(); d.documentElement.setAttribute('data-var-' + a.nombre, a.valor); return; }
      if (a.tipo === 'navegar') { navegar(a.valor); return; }
      if (!el) return;
      if (a.tipo === 'abrir') abrir(el, origen);
      else if (a.tipo === 'cerrar') cerrar(el);
      else if (a.tipo === 'alternar') { if (abierto(el)) cerrar(el); else abrir(el, origen); }
      else if (a.tipo === 'estado') { el.setAttribute('data-estado', a.valor); sincronizar(el); }
    });
  };
  // Variables guardadas en la sesión: se reflejan en <html data-var-…> para el CSS
  for (var nv in vars) d.documentElement.setAttribute('data-var-' + nv, vars[nv]);
  var vistos = typeof w.IntersectionObserver === 'function' ? new w.IntersectionObserver(function (en) {
    en.forEach(function (x) {
      if (!x.isIntersecting) return;
      (x.target.__intVisible || []).forEach(function (r) { if (!r.__hecha || !r.unaVez) { r.__hecha = true; ejecutar(r, x.target); } });
    });
  }, { threshold: 0.25 }) : null;
  [].forEach.call(d.querySelectorAll('[data-int]'), function (el) {
    var v = validarReglasInt(el.getAttribute('data-int'));
    if (v.errores.length && w.console) w.console.warn('Interacciones no válidas en', el, v.errores);
    v.reglas.forEach(function (r) {
      if (r.evento === 'clic') {
        // Un elemento que no es botón ni enlace también se activa con el teclado
        if (!el.matches('a[href], button, input, select, textarea, summary')) {
          if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
          if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
          el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ejecutar(r, el); }
          });
        }
        el.addEventListener('click', function (e) {
          var h = el.getAttribute('href');
          if (el.tagName === 'A' && (!h || h === '#' || r.acciones.some(function (a) { return a.tipo !== 'variable' && a.tipo !== 'estado'; }))) e.preventDefault();
          ejecutar(r, el);
        });
      } else if (r.evento === 'foco') {
        el.addEventListener('focusin', function () { ejecutar(r, el); });
      } else if (r.evento === 'visible') {
        if (vistos) { (el.__intVisible = el.__intVisible || []).push(r); vistos.observe(el); } else ejecutar(r, el);
      }
    });
  });
  // Estado inicial de los controles (aria-expanded) según su destino
  [].forEach.call(d.querySelectorAll('[data-estado][id]'), sincronizar);
  // Teclado: Escape cierra el modal de arriba o el menú/panel donde está el foco;
  // Tab no sale de un modal abierto.
  d.addEventListener('keydown', function (e) {
    var top = pila.length ? pila[pila.length - 1].el : null;
    if (e.key === 'Escape') {
      if (top) { e.preventDefault(); cerrar(top); return; }
      var p = d.activeElement && d.activeElement.closest ? d.activeElement.closest('[data-int-tipo="menu"][data-estado="abierto"]') : null;
      if (p) { e.preventDefault(); cerrar(p); }
      return;
    }
    if (e.key === 'Tab' && top) {
      var f = [].filter.call(top.querySelectorAll(ENFOCABLE), function (x) { return x.offsetParent !== null || x === d.activeElement; });
      if (!f.length) { e.preventDefault(); return; }
      var primero = f[0], ultimo = f[f.length - 1];
      if (e.shiftKey && (d.activeElement === primero || !top.contains(d.activeElement))) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && (d.activeElement === ultimo || !top.contains(d.activeElement))) { e.preventDefault(); primero.focus(); }
    }
  });
  // Clic en el fondo de un modal (fuera de su caja) lo cierra
  d.addEventListener('click', function (e) {
    var top = pila.length ? pila[pila.length - 1].el : null;
    if (top && e.target === top) cerrar(top);
  });
  // Acordeón: flechas, Inicio y Fin entre sus botones
  d.addEventListener('keydown', function (e) {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].indexOf(e.key) < 0) return;
    var g = e.target.closest ? e.target.closest('[data-int-teclas="acordeon"]') : null;
    if (!g || !e.target.matches('button[aria-controls]')) return;
    var bs = [].slice.call(g.querySelectorAll('button[aria-controls]'));
    var i = bs.indexOf(e.target);
    var n = e.key === 'Home' ? 0 : e.key === 'End' ? bs.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length;
    e.preventDefault();
    bs[n].focus();
  });
}
