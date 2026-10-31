/* Piezas de interfaz compartidas: ayudantes, progreso, dibujo del circuito y acordeón. */
(function (raiz) {
  'use strict';
  var M = raiz.Motor;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---- ecuaciones en LaTeX (KaTeX local: assets/katex, funciona sin conexión en GitHub Pages) ----
     Convención única: negación con barra \overline{A}, AND con \cdot, OR con +, subíndices T_1. */
  function llave(s, i) { // posición de la llave que cierra la abierta en s[i]
    for (var d = 0; i < s.length; i++) { if (s[i] === '{') d++; else if (s[i] === '}' && --d === 0) return i; }
    return s.length;
  }
  function plano(tex) { // lectura para pantalla y respaldo si KaTeX no carga
    var s = tex, i;
    while ((i = s.indexOf('\\overline{')) >= 0) {
      var f = llave(s, i + 9);
      s = s.slice(0, i) + 'no (' + s.slice(i + 10, f) + ')' + s.slice(f + 1);
    }
    return s.replace(/\\text\{([^}]*)\}/g, '$1').replace(/_\{([^}]*)\}/g, '$1').replace(/_(\w)/g, '$1')
      .replace(/\\cdot/g, '·').replace(/\\square/g, '?').replace(/\\left|\\right/g, '').replace(/\\ /g, ' ').replace(/\\,/g, ' ');
  }
  function mat(tex) { return '<span class="mat" data-tex="' + esc(tex) + '">' + esc(plano(tex)) + '</span>'; }
  function t(str) { // texto con ecuaciones entre signos $...$
    return String(str).split(/\$([^$]+)\$/).map(function (p, i) { return i % 2 ? mat(p) : esc(p); }).join('');
  }
  function mates(raiz) {
    $$('.mat:not([data-ok])', raiz).forEach(function (el) {
      var tex = el.getAttribute('data-tex');
      el.setAttribute('data-ok', '1');
      if (!window.katex) return;
      try {
        window.katex.render(tex, el, { throwOnError: false, output: 'html' });
        el.setAttribute('role', 'img'); el.setAttribute('aria-label', plano(tex));
      } catch (e) { el.textContent = plano(tex); }
    });
  }

  /* ---- progreso (solo insignias; las respuestas no se guardan en esta página de prueba) ---- */
  /* Dentro de la guía publicada el progreso vive en el estado de la guía (UI.integrado = true), no aquí. */
  var KEY = 'digitales1-ejercicios-v1', prog = {};
  try { prog = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { prog = {}; }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (e) { /* sin almacenamiento */ } }
  var pausa = false; // el verificador docente no debe dejar insignias en el progreso real
  function marcar(clave, campo) { if (pausa) return; prog[clave] = prog[clave] || {}; prog[clave][campo] = true; if (!UI.integrado) guardar(); }
  function pausar(v) { pausa = !!v; }
  function leer(clave) { return prog[clave] || {}; }
  function reiniciarProgreso() { prog = {}; guardar(); }

  /* ---- dibujo del circuito (esqueleto de 3 entradas y 2 compuertas) ---- */
  var SY = [50, 150, 250], X1 = 240, X2 = 368, XN = 154;

  function diseno(st) {
    var p = M.PARES[st.grupo][0], q = M.PARES[st.grupo][1], r = M.RESTO[st.grupo];
    var y1 = (SY[p] + SY[q]) / 2, yr = SY[r];
    return { p: p, q: q, r: r, y1: y1, yr: yr, y2: (y1 + yr) / 2 };
  }
  function hilo(pts, val) {
    var cls = (val === null || val === undefined) ? 'vq' : 'v' + val;
    return '<path class="hilo ' + cls + '" d="M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L') + '"/>';
  }
  function pastilla(x, y, val) {
    if (val === null || val === undefined) return '';
    return '<circle cx="' + x + '" cy="' + y + '" r="11" class="pill-bg' + val + '"/><text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" class="pill">' + val + '</text>';
  }
  function forma(op, x, y, num) {
    var s;
    if (!op) {
      s = '<rect x="' + x + '" y="' + (y - 28) + '" width="58" height="56" rx="10" class="compuerta vacia"/>' +
        '<text x="' + (x + 29) + '" y="' + (y + 9) + '" class="t-compuerta" style="font-size:26px">?</text>';
    } else if (op === 'AND') {
      s = '<path class="compuerta" d="M' + x + ' ' + (y - 28) + ' H' + (x + 30) + ' A28 28 0 0 1 ' + (x + 30) + ' ' + (y + 28) + ' H' + x + ' Z"/>' +
        '<text x="' + (x + 26) + '" y="' + (y + 6) + '" class="t-compuerta">AND</text>';
    } else {
      s = '<path class="compuerta" d="M' + x + ' ' + (y - 28) + ' Q' + (x + 34) + ' ' + (y - 28) + ' ' + (x + 58) + ' ' + y + ' Q' + (x + 34) + ' ' + (y + 28) + ' ' + x + ' ' + (y + 28) + ' Q' + (x + 18) + ' ' + y + ' ' + x + ' ' + (y - 28) + ' Z"/>' +
        '<text x="' + (x + 24) + '" y="' + (y + 6) + '" class="t-compuerta">OR</text>';
    }
    return s + '<circle cx="' + (x + 29) + '" cy="' + (y - 42) + '" r="12" class="num-bg"/><text x="' + (x + 29) + '" y="' + (y - 37) + '" text-anchor="middle" class="num-comp">' + num + '</text>';
  }

  /* Devuelve el circuito completo: SVG con cables + botones NOT sobre cada cable. */
  function circuito(spec, st, v, bloqueado) {
    var ev = M.evaluar(st, v), L = diseno(st), i, s;
    var arriba = SY[L.p] < SY[L.q] ? L.p : L.q, abajo = arriba === L.p ? L.q : L.p;
    var pin = {}; pin[arriba] = L.y1 - 14; pin[abajo] = L.y1 + 14;
    var carril = {}; carril[arriba] = 196; carril[abajo] = 214;
    var g1Arriba = L.y1 < L.yr;
    var pinG1 = g1Arriba ? L.y2 - 14 : L.y2 + 14, pinR = g1Arriba ? L.y2 + 14 : L.y2 - 14;
    var desc = 'Circuito ' + M.formula(spec, st).replace(/\?/g, 'sin elegir') + '. Salida ' + (ev.out === null ? 'sin definir' : ev.out) + '.';

    s = '<svg viewBox="0 0 520 300" role="img" aria-label="' + esc(desc) + '">';
    for (i = 0; i < 3; i++) {
      var sy = SY[i], val = v[i], lit = ev.lit[i], ruta;
      s += hilo([[64, sy], [st.neg[i] ? 112 : XN, sy]], val);
      if (i === L.r) ruta = [[XN, sy], [340, sy], [340, pinR], [X2, pinR]];
      else ruta = [[XN, sy], [carril[i], sy], [carril[i], pin[i]], [X1, pin[i]]];
      s += hilo(ruta, lit);
      if (st.neg[i]) {
        s += '<path class="compuerta" d="M112 ' + (sy - 15) + ' L112 ' + (sy + 15) + ' L142 ' + sy + ' Z"/><circle cx="148" cy="' + sy + '" r="6" class="compuerta"/>';
      }
      s += pastilla(176, sy, lit);
    }
    s += hilo([[X1 + 58, L.y1], [334, L.y1], [334, pinG1], [X2, pinG1]], ev.g1);
    s += pastilla(316, L.y1, ev.g1);
    s += hilo([[X2 + 58, L.y2], [470, L.y2]], ev.out) + pastilla(448, L.y2, ev.out);
    s += forma(st.g1, X1, L.y1, 1) + forma(st.g2, X2, L.y2, 2);
    for (i = 0; i < 3; i++) {
      var k = spec.entradas[i].k;
      s += '<rect x="1" y="' + (SY[i] - 22) + '" width="62" height="44" rx="10" class="caja-sensor v' + v[i] + '"/>' +
        '<text x="32" y="' + (SY[i] + (k.length > 3 ? 6 : 8)) + '" class="t-sensor"' + (k.length > 3 ? ' style="font-size:15px"' : '') + '>' + k + '</text>';
    }
    s += '<circle cx="494" cy="' + L.y2 + '" r="24" class="salida-c ' + (ev.out === null ? 'q' : ev.out ? 'on' : '') + '"/>' +
      '<text x="494" y="' + (L.y2 + 7) + '" class="t-sensor">Y</text></svg>';

    var botones = '';
    for (i = 0; i < 3; i++) {
      if (bloqueado && !st.neg[i]) continue;
      botones += '<button type="button" class="btn-not" data-act="not" data-i="' + i + '" aria-pressed="' + (st.neg[i] ? 'true' : 'false') + '"' +
        (bloqueado ? ' disabled' : '') + ' style="left:' + (130 / 520 * 100) + '%;top:' + (SY[i] / 300 * 100) + '%"' +
        ' aria-label="Cable de ' + esc(spec.entradas[i].nombre) + ' (' + spec.entradas[i].k + '): ' + (st.neg[i] ? 'quitar el NOT' : 'poner un NOT') + '">' +
        (st.neg[i] ? '' : '+NOT') + '</button>';
    }
    return '<div class="circ">' + s + botones + '</div>';
  }

  /* ---- acordeón de actividades (una abierta a la vez, contenido creado al abrir) ---- */
  function acordeon(host, items, claveProg) {
    host.innerHTML = '';
    var lista = document.createElement('div'); lista.className = 'lista-ej'; host.appendChild(lista);
    var api = { items: [], abrir: null };
    items.forEach(function (it, n) {
      var cont = document.createElement('div'); cont.className = 'ej'; cont.dataset.id = it.id;
      var cab = document.createElement('button'); cab.type = 'button'; cab.className = 'ej-cab'; cab.setAttribute('aria-expanded', 'false');
      var cuerpo = document.createElement('div'); cuerpo.className = 'ej-cuerpo'; cuerpo.hidden = true;
      cont.appendChild(cab); cont.appendChild(cuerpo); lista.appendChild(cont);
      var entrada = { id: it.id, el: cont, cuerpo: cuerpo, creado: false, instancia: null };
      function pintaCab() {
        var p = leer(claveProg(it)), b = '';
        if (it.insignias) b = it.insignias(p);
        cab.innerHTML = '<span class="num">' + (it.num || n + 1) + '</span><span class="tit">' + esc(it.titulo) + '<small>' + esc(it.sub || '') + '</small></span>' + b;
      }
      entrada.refrescar = pintaCab; pintaCab();
      function alternar(abrir) {
        var ab = abrir === undefined ? cuerpo.hidden : abrir;
        api.items.forEach(function (o) { o.cuerpo.hidden = true; o.el.classList.remove('abierto'); o.el.querySelector('.ej-cab').setAttribute('aria-expanded', 'false'); });
        if (ab) {
          cuerpo.hidden = false; cont.classList.add('abierto'); cab.setAttribute('aria-expanded', 'true');
          if (!entrada.creado) { entrada.creado = true; entrada.instancia = it.crear(cuerpo, pintaCab); }
        }
      }
      entrada.alternar = alternar;
      cab.addEventListener('click', function () { alternar(); });
      api.items.push(entrada);
    });
    api.abrir = function (id) { api.items.forEach(function (o) { if (o.id === id) o.alternar(true); }); };
    return api;
  }

  var UI = {
    integrado: false, $: $, $$: $$, cap: cap, esc: esc, mat: mat, t: t, mates: mates, plano: plano, marcar: marcar, pausar: pausar, leer: leer, reiniciarProgreso: reiniciarProgreso,
    circuito: circuito, hilo: hilo, pastilla: pastilla, acordeon: acordeon
  };
  raiz.UI = UI;
})(window);
