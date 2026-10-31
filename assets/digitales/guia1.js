/* Guía 1 · Compuertas y álgebra de Boole, con ejercicios escritos paso a paso.
   1A Conoce las seis compuertas · 1B De Morgan con historias · 1C Simplificar en escalera. */
(function (raiz) {
  'use strict';
  var M = raiz.Motor, D = raiz.Datos, UI = raiz.UI, esc = UI.esc;

  function claveDe(b) { return ['act', 'g', 'r', 'c', 'v', 'i', 'n'].map(function (a) { return b.getAttribute('data-' + a); }).join('|'); }
  /* Recupera el avance guardado: solo se aceptan las claves que ya existen en el estado inicial y con el mismo tipo. */
  function restaurar(S, ini) {
    if (!ini || typeof ini !== 'object' || Array.isArray(ini)) return;
    Object.keys(S).forEach(function (k) {
      var v = ini[k];
      if (v === undefined || v === null) return;
      if (typeof v !== typeof S[k] || Array.isArray(v) !== Array.isArray(S[k])) return;
      S[k] = JSON.parse(JSON.stringify(v));
    });
  }
  function montar(host, S, render, acc, alCambiar, opts) {
    function pinta() {
      var a = document.activeElement, k = (a && host.contains(a) && a.getAttribute('data-act')) ? claveDe(a) : null;
      render();
      UI.mates(host);
      if (k) { var el = UI.$$('[data-act]', host).filter(function (b) { return claveDe(b) === k; })[0]; if (el && !el.disabled) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } } }
      if (alCambiar) alCambiar();
      if (opts && opts.alGuardar) opts.alGuardar(S, host.getAttribute('data-hecho') === '1');
    }
    host.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-act]');
      if (!b || !host.contains(b) || b.disabled) return;
      var f = acc[b.getAttribute('data-act')];
      if (f) { f(b); pinta(); }
    });
    pinta();
  }
  function bin(act, attrs, valor, bloq, etiqueta) {
    return '<div class="bin" role="group" aria-label="' + esc(etiqueta) + '">' + [0, 1].map(function (x) {
      return '<button type="button" data-act="' + act + '" ' + attrs + ' data-v="' + x + '" aria-pressed="' + (valor === x) + '"' + (bloq ? ' disabled' : '') + '>' + x + '</button>';
    }).join('') + '</div>';
  }
  /* Interruptor que se pulsa: parece un interruptor (pista visual), dice qué pasará al pulsarlo y late hasta el primer toque. */
  function interruptor(act, k, etiq, val, attrs, llamar) {
    return '<button type="button" class="sensor' + (llamar ? ' llamar' : '') + '" data-act="' + act + '" ' + (attrs || '') + ' aria-pressed="' + (val ? 'true' : 'false') + '" aria-label="Entrada ' + k + ', ' + (val ? 'encendida (1)' : 'apagada (0)') + '. Pulsa para ' + (val ? 'apagarla' : 'encenderla') + '.">' +
      '<span class="ic" aria-hidden="true">🔌</span><span class="tx"><b>' + esc(etiq) + ' <span class="tag">' + k + '</span></b><small>' + (val ? 'Encendida (1)' : 'Apagada (0)') + '</small>' +
      '<small class="accion">👆 Pulsa para ' + (val ? 'apagarla' : 'encenderla') + '</small></span><span class="sw" aria-hidden="true"><i>' + val + '</i></span></button>';
  }
  function usoInterruptores() {
    return '<p class="uso-interruptor"><b>👆 Pulsa cada interruptor</b> para encenderlo (1) o apagarlo (0). Mira abajo cómo cambian los resultados y las lámparas.</p>';
  }

  /* ---------- dibujo de una compuerta con lámpara ---------- */
  function svgPuerta(id, a, b, out) {
    var dos = id !== 'NOT', x = 120, y = 85, s = '<svg viewBox="0 0 330 170" class="svg-puerta" role="img" aria-label="Compuerta ' + id + ' con sus entradas y una lámpara de salida">';
    var ys = dos ? [55, 115] : [85], bub = id === 'NAND' || id === 'NOR' || id === 'NOT';
    ys.forEach(function (yy, i) {
      var val = i === 0 ? a : b;
      s += UI.hilo([[50, yy], [id === 'XOR' ? x - 12 : x - 2, yy]], val) +
        '<rect x="1" y="' + (yy - 18) + '" width="48" height="36" rx="9" class="caja-sensor v' + val + '"/><text x="25" y="' + (yy + 7) + '" class="t-sensor">' + (i ? 'B' : 'A') + '</text>';
    });
    if (id === 'AND' || id === 'NAND') s += '<path class="compuerta" d="M' + x + ' ' + (y - 36) + ' H' + (x + 36) + ' A36 36 0 0 1 ' + (x + 36) + ' ' + (y + 36) + ' H' + x + ' Z"/>';
    else if (id === 'NOT') s += '<path class="compuerta" d="M' + x + ' ' + (y - 30) + ' L' + x + ' ' + (y + 30) + ' L' + (x + 62) + ' ' + y + ' Z"/>';
    else s += '<path class="compuerta" d="M' + x + ' ' + (y - 36) + ' Q' + (x + 44) + ' ' + (y - 36) + ' ' + (x + 72) + ' ' + y + ' Q' + (x + 44) + ' ' + (y + 36) + ' ' + x + ' ' + (y + 36) + ' Q' + (x + 22) + ' ' + y + ' ' + x + ' ' + (y - 36) + ' Z"/>';
    if (id === 'XOR') s += '<path class="compuerta" style="fill:none" d="M' + (x - 12) + ' ' + (y - 36) + ' Q' + (x + 10) + ' ' + y + ' ' + (x - 12) + ' ' + (y + 36) + '"/>';
    var fin = id === 'NOT' ? x + 62 : (id === 'AND' || id === 'NAND') ? x + 72 : x + 72;
    if (bub) { s += '<circle cx="' + (fin + 7) + '" cy="' + y + '" r="7" class="compuerta"/>'; fin += 14; }
    s += UI.hilo([[fin, y], [250, y]], out);
    s += '<circle cx="285" cy="' + y + '" r="30" class="salida-c ' + (out ? 'on' : '') + '"/><text x="285" y="' + (y + 12) + '" text-anchor="middle" font-size="32">' + (out ? '💡' : '⚫') + '</text>';
    s += '<text x="' + (x + 36) + '" y="160" class="t-compuerta">' + id + '</text></svg>';
    return s;
  }
  function salidaCompuerta(id, a, b) { return id === 'NOT' ? M.OPS.NOT(a) : M.OPS[id](a, b); }

  /* ======================= 1A · LAS SEIS COMPUERTAS ======================= */
  function Guia1A(host, alCambiar, opts) {
    var S = { sel: 'AND', a: 0, b: 0, pred: {}, est: {}, hecha: {}, quiz: {}, todoQuiz: false, tocado: false, err: 0 };
    restaurar(S, opts && opts.inicial);
    function filasDe(id) { return id === 'NOT' ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]]; }
    function info() { return D.COMPUERTAS.filter(function (c) { return c.id === S.sel; })[0]; }
    function nHechas() { return Object.keys(S.hecha).length; }
    function quizOk() { return D.QUIZ_COMPUERTAS.every(function (q, i) { return S.quiz[i] === q.r; }); }

    function render() {
      var g = info(), out = salidaCompuerta(g.id, S.a, S.b), filas = filasDe(g.id), pr = S.pred[g.id] || (S.pred[g.id] = filas.map(function () { return null; }));
      var est = S.est[g.id];
      var h = '<p class="situacion">Cada compuerta decide una salida (1 = encendido, 0 = apagado) según sus entradas. Conoce las seis una por una: primero <b>juega</b>, luego <b>predice</b>.</p>' +
        '<div class="sel-compuerta" role="group" aria-label="Elige una compuerta">' + D.COMPUERTAS.map(function (c) {
          return '<button type="button" data-act="sel" data-g="' + c.id + '"' + (c.id === S.sel ? ' aria-current="true"' : '') + (S.hecha[c.id] ? ' class="dom"' : '') + '>' + c.nombre + '</button>';
        }).join('') + '</div>' +
        '<p class="subtle">Compuertas dominadas: <b>' + nHechas() + ' de 6</b></p>' +
        '<div class="caja guia"><h4>' + g.nombre + ' <span class="subtle">· se lee «' + g.lee + '»</span></h4><p><b>Piensa en esto:</b> ' + esc(g.analogia) + '</p><p><b>Regla:</b> ' + esc(g.regla) + '</p><p class="subtle"><b>Ejemplo real:</b> ' + esc(g.ejemplo) + '</p></div>' +
        '<h4>1 · Juega</h4>' + usoInterruptores() + '<div class="mini-lab"><div><div class="sensores">' + interruptor('ent', 'A', 'Entrada', S.a, 'data-i="0"', !S.tocado) + (g.entradas === 2 ? interruptor('ent', 'B', 'Entrada', S.b, 'data-i="1"', !S.tocado) : '') + '</div>' +
        (g.entradas === 1 ? '<p class="leyenda">NOT solo tiene una entrada.</p>' : '') + '</div><div class="panel">' + svgPuerta(g.id, S.a, g.entradas === 2 ? S.b : 0, out) +
        '<p class="leyenda" role="status">' + (g.entradas === 2 ? 'A = ' + S.a + ' y B = ' + S.b : 'A = ' + S.a) + ' → <b>salida ' + out + '</b>: la lámpara está ' + (out ? 'encendida' : 'apagada') + '.</p></div></div>' +
        '<h4>2 · Predice</h4><p>Sin mirar el dibujo, completa la tabla de <b>' + g.nombre + '</b>. Recuerda la regla: <i>' + esc(g.regla) + '</i></p>' +
        '<div class="tabla-wrap"><table class="tv"><thead><tr><th>A</th>' + (g.entradas === 2 ? '<th>B</th>' : '') + '<th>Salida de ' + g.nombre + '</th><th>Resultado</th></tr></thead><tbody>' +
        filas.map(function (f, r) {
          var e = est && est[r];
          var correcta = salidaCompuerta(g.id, f[0], f[1]);
          return '<tr class="' + (e || '') + '">' + f.map(function (x) { return '<td class="cel' + x + '">' + x + '</td>'; }).join('') + '<td>' + bin('pred', 'data-g="' + g.id + '" data-r="' + r + '"', pr[r], e === 'ok', 'Salida de la fila ' + (r + 1)) + '</td>' +
            '<td class="exp">' + (e === 'ok' ? '<span class="est ok">✔</span> ' + f.map(function (x, i) { return (i ? 'B' : 'A') + '=' + x; }).join(', ') + ' → ' + correcta : e === 'mal' ? '<span class="est mal">✘</span> Vuelve a leer la regla y prueba esta fila arriba en «Juega».' : '<span class="subtle">—</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        (S.hecha[g.id] ? '<div class="fb ok"><b>✔ ¡' + g.nombre + ' dominada!</b> ' + esc(g.regla) + '</div>' : (est ? '<div class="fb mal">Hay filas en rojo. Corrígelas y vuelve a comprobar.</div>' : '')) +
        '<div class="fila-btn"><button type="button" class="btn primario" data-act="chk" data-g="' + g.id + '"' + (pr.indexOf(null) >= 0 ? ' disabled' : '') + '>Comprobar ' + g.nombre + '</button></div>';

      if (nHechas() < 6) h += '<div class="caja aviso">🔒 Cuando domines las seis compuertas se abre el <b>reto de situaciones</b>.</div>';
      else {
        h += '<h4>3 · Reto: ¿qué compuerta usarías?</h4>';
        D.QUIZ_COMPUERTAS.forEach(function (q, i) {
          var resp = S.quiz[i];
          h += '<div class="caja"><p><b>' + (i + 1) + '.</b> ' + esc(q.q) + '</p><div class="sel-compuerta" role="group" aria-label="Respuesta a la situación ' + (i + 1) + '">' +
            D.COMPUERTAS.map(function (c) {
              var cls = resp === c.id ? (c.id === q.r ? 'dom' : '') : '';
              return '<button type="button" data-act="quiz" data-i="' + i + '" data-v="' + c.id + '"' + (resp === q.r ? ' disabled' : '') + (resp === c.id ? ' aria-current="true"' : '') + ' class="' + cls + '">' + c.nombre + '</button>';
            }).join('') + '</div>' +
            (resp ? '<div class="fb ' + (resp === q.r ? 'ok' : 'mal') + '">' + (resp === q.r ? '✔ ' + esc(q.por) : '✘ No es ' + resp + '. Piensa si necesitas «todas», «alguna», «lo contrario» o «diferentes».') + '</div>' : '') + '</div>';
        });
        if (quizOk()) h += '<div class="fb ok" data-fin="1"><b>🎉 Guía 1A completa.</b> Ya reconoces las seis compuertas por su comportamiento.</div>';
      }
      host.setAttribute('data-hecho', (nHechas() === 6 && quizOk()) ? '1' : '0');
      host.innerHTML = h;
      if (nHechas() === 6 && quizOk()) UI.marcar('g1:1A', 'circ');
    }
    var acc = {
      sel: function (b) { S.sel = b.getAttribute('data-g'); S.a = 0; S.b = 0; },
      ent: function (b) { S.tocado = true; if (b.getAttribute('data-i') === '0') S.a = S.a ? 0 : 1; else S.b = S.b ? 0 : 1; },
      pred: function (b) { var g = b.getAttribute('data-g'), r = +b.getAttribute('data-r'); S.pred[g][r] = +b.getAttribute('data-v'); if (S.est[g]) S.est[g][r] = null; delete S.hecha[g]; },
      chk: function (b) {
        var g = b.getAttribute('data-g'), filas = filasDe(g);
        S.est[g] = filas.map(function (f, r) { return S.pred[g][r] === salidaCompuerta(g, f[0], f[1]) ? 'ok' : 'mal'; });
        if (S.est[g].every(function (e) { return e === 'ok'; })) S.hecha[g] = true; else { delete S.hecha[g]; S.err++; }
      },
      quiz: function (b) { var i = +b.getAttribute('data-i'); S.quiz[i] = b.getAttribute('data-v'); if (S.quiz[i] !== D.QUIZ_COMPUERTAS[i].r) S.err++; }
    };
    montar(host, S, render, acc, alCambiar, opts);
    return { host: host, S: S };
  }

  /* ======================= 1B · DE MORGAN ======================= */
  function Guia1B(host, alCambiar, opts) {
    var S = { a: 0, b: 0, pred: {}, est: {}, ok: {}, q: {}, tocado: false, err: 0 };
    restaurar(S, opts && opts.inicial);
    function quizOk() { return D.PREGUNTAS_DM.every(function (p, i) { return S.q[i] === p.r; }); }
    function render() {
      var h = '<p class="situacion">A veces una frase con «no es cierto que…» se puede decir de otra forma <b>sin cambiar su significado</b>. En lógica digital eso se llama <b>ley de De Morgan</b>: dos circuitos distintos que siempre dan la misma salida.</p>' +
        '<h4>1 · Míralo</h4>' + usoInterruptores() + '<div class="sensores">' + interruptor('ent', 'A', 'Entrada', S.a, 'data-i="0"', !S.tocado) + interruptor('ent', 'B', 'Entrada', S.b, 'data-i="1"', !S.tocado) + '</div>' +
        '<div class="mini-lab">' + D.DE_MORGAN.map(function (dm) {
          var izq = dm.f(S.a, S.b), der = dm.g(S.a, S.b);
          var na = S.a ? 0 : 1, nb = S.b ? 0 : 1;
          var paso = dm.id === 'dm1'
            ? ['A\\cdot B=' + (S.a && S.b ? 1 : 0), '\\text{NOT}\\to ' + izq, '\\overline{A}=' + na + ',\\ \\overline{B}=' + nb, '\\overline{A}+\\overline{B}=' + der]
            : ['A+B=' + (S.a || S.b ? 1 : 0), '\\text{NOT}\\to ' + izq, '\\overline{A}=' + na + ',\\ \\overline{B}=' + nb, '\\overline{A}\\cdot\\overline{B}=' + der];
          return '<div class="panel"><h4>' + UI.mat(dm.izq + '=' + dm.der) + '</h4><p class="subtle">' + esc(dm.historia) + '</p>' +
            '<p><b>Camino 1:</b> ' + UI.mat(paso[0]) + ' → ' + UI.mat(paso[1]) + '</p><p><b>Camino 2:</b> ' + UI.mat(paso[2]) + ' → ' + UI.mat(paso[3]) + '</p>' +
            '<p><span class="lampara ' + (izq ? 'on' : '') + '" aria-hidden="true">' + (izq ? '💡' : '⚫') + '</span> = <span class="lampara ' + (der ? 'on' : '') + '" aria-hidden="true">' + (der ? '💡' : '⚫') + '</span> ' +
            '<b role="status">' + (izq === der ? 'Siempre iguales ✔' : 'Distintas') + '</b></p></div>';
        }).join('') + '</div>' +
        '<h4>2 · Predice y comprueba</h4><p>Completa las dos columnas de cada ley. Si conoces la regla, la segunda columna sale sola.</p>';
      D.DE_MORGAN.forEach(function (dm) {
        var pr = S.pred[dm.id] || (S.pred[dm.id] = [[null, null], [null, null], [null, null], [null, null]]), est = S.est[dm.id];
        h += '<div class="tabla-wrap"><table class="tv"><thead><tr><th>A</th><th>B</th><th>' + UI.mat(dm.izq) + '</th><th>' + UI.mat(dm.der) + '</th><th>Resultado</th></tr></thead><tbody>' +
          [[0, 0], [0, 1], [1, 0], [1, 1]].map(function (f, r) {
            var e = est && est[r];
            return '<tr class="' + (e || '') + '"><td class="cel' + f[0] + '">' + f[0] + '</td><td class="cel' + f[1] + '">' + f[1] + '</td>' +
              '<td>' + bin('pred', 'data-g="' + dm.id + '" data-r="' + r + '" data-c="0"', pr[r][0], e === 'ok', UI.plano(dm.izq) + ' fila ' + (r + 1)) + '</td>' +
              '<td>' + bin('pred', 'data-g="' + dm.id + '" data-r="' + r + '" data-c="1"', pr[r][1], e === 'ok', UI.plano(dm.der) + ' fila ' + (r + 1)) + '</td>' +
              '<td>' + (e === 'ok' ? '<span class="est ok">✔</span>' : e === 'mal' ? '<span class="est mal">✘</span> revisa' : '<span class="subtle">—</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' +
          '<div class="fila-btn"><button type="button" class="btn primario" data-act="chk" data-g="' + dm.id + '"' + (JSON.stringify(pr).indexOf('null') >= 0 ? ' disabled' : '') + '>Comprobar ' + UI.mat(dm.izq + '=' + dm.der) + '</button>' +
          (S.ok[dm.id] ? '<span class="fb ok">✔ Las dos columnas son idénticas: ¡esa es la ley!</span>' : '') + '</div>';
      });
      h += '<h4>3 · Resume la ley</h4>';
      D.PREGUNTAS_DM.forEach(function (p, i) {
        var resp = S.q[i];
        h += '<div class="caja"><p><b>' + (i + 1) + '.</b> ' + UI.t(p.q) + '</p><div class="opciones-q">' + p.ops.map(function (o, j) {
          var cls = resp === j ? (j === p.r ? 'bien' : 'mal') : '';
          return '<button type="button" class="' + cls + '" data-act="q" data-i="' + i + '" data-v="' + j + '"' + (resp === p.r ? ' disabled' : '') + '>' + UI.t(o) + '</button>';
        }).join('') + '</div>' + (resp !== undefined ? '<div class="fb ' + (resp === p.r ? 'ok' : 'mal') + '">' + (resp === p.r ? '✔ ' + UI.t(p.por) : '✘ Mira las dos columnas de las tablas: ¿qué cambió al pasar de un lado al otro?') + '</div>' : '') + '</div>';
      });
      var fin = S.ok.dm1 && S.ok.dm2 && quizOk();
      if (fin) h += '<div class="fb ok" data-fin="1"><b>🎉 Guía 1B completa.</b> Recuerda: la negación entra al paréntesis, <b>cambia AND por OR</b> (o al revés) y se aplica a cada variable.</div>';
      host.setAttribute('data-hecho', fin ? '1' : '0');
      host.innerHTML = h;
      if (fin) UI.marcar('g1:1B', 'circ');
    }
    var acc = {
      ent: function (b) { S.tocado = true; if (b.getAttribute('data-i') === '0') S.a = S.a ? 0 : 1; else S.b = S.b ? 0 : 1; },
      pred: function (b) { var g = b.getAttribute('data-g'); S.pred[g][+b.getAttribute('data-r')][+b.getAttribute('data-c')] = +b.getAttribute('data-v'); S.est[g] = null; delete S.ok[g]; },
      chk: function (b) {
        var g = b.getAttribute('data-g'), dm = D.DE_MORGAN.filter(function (x) { return x.id === g; })[0];
        S.est[g] = [[0, 0], [0, 1], [1, 0], [1, 1]].map(function (f, r) {
          return (S.pred[g][r][0] === dm.f(f[0], f[1]) && S.pred[g][r][1] === dm.g(f[0], f[1])) ? 'ok' : 'mal';
        });
        if (S.est[g].every(function (e) { return e === 'ok'; })) S.ok[g] = true; else { delete S.ok[g]; S.err++; }
      },
      q: function (b) { var i = +b.getAttribute('data-i'); S.q[i] = +b.getAttribute('data-v'); if (S.q[i] !== D.PREGUNTAS_DM[i].r) S.err++; }
    };
    montar(host, S, render, acc, alCambiar, opts);
    return { host: host, S: S };
  }

  /* ======================= 1C · ESCALERA DE SIMPLIFICACIÓN ======================= */
  function Guia1C(host, alCambiar, opts) {
    var S = { prob: {}, fb: {}, err: 0 };
    D.ESCALERA.forEach(function (e) { S.prob[e.id] = 0; });
    restaurar(S, opts && opts.inicial);
    function equiv(f, g) { return [0, 1].every(function (a) { return [0, 1].every(function (b) { return f(a, b) === g(a, b); }); }); }
    function previa(e, n) { return n === 0 ? e.inicio.f : e.pasos[n - 1].ops[0].f; }
    function exprActual(e, n) { return n === 0 ? e.inicio.txt : e.pasos[n - 1].ops[0].txt; }
    function render() {
      var todos = D.ESCALERA.every(function (e) { return S.prob[e.id] >= e.pasos.length; });
      var h = '<p class="situacion">Simplificar es <b>escribir lo mismo con menos piezas</b>. Lo haremos como una escalera: en cada peldaño eliges la expresión que <b>sigue siendo equivalente</b>, y la página te dice qué ley usaste.</p>' +
        '<div class="caja guia"><b>Cómo leer:</b> <span class="tag">' + UI.mat('\\cdot') + '</span> es AND, <span class="tag">+</span> es OR y una <b>barra encima</b>, como en ' + UI.mat('\\overline{A}') + ', es NOT («no A»). Primero se resuelven los paréntesis, luego el AND y al final el OR.</div>' +
        '<details class="caja guia"><summary><b>Ver las leyes que vamos a usar</b></summary><table class="leyes"><tbody>' + D.LEYES.map(function (l) { return '<tr><td><b>' + l.ley + '</b></td><td>' + UI.mat(l.f) + '</td></tr>'; }).join('') + '</tbody></table></details>' +
        '<div class="ladder">';
      D.ESCALERA.forEach(function (e, pi) {
        var n = S.prob[e.id], fin = n >= e.pasos.length;
        h += '<div class="caja"><h4>Problema ' + (pi + 1) + ' · ' + esc(e.titulo) + '</h4><p>Simplifica: <span class="actual">' + UI.mat(e.inicio.txt) + '</span></p><p class="subtle">💡 ' + UI.t(e.idea) + '</p>';
        for (var s = 0; s < n; s++) h += '<div class="paso hecho">✔ Paso ' + (s + 1) + ': <span class="actual">' + UI.mat(e.pasos[s].ops[0].txt) + '</span> <span class="subtle">· ' + esc(e.pasos[s].ley) + ': ' + UI.mat(e.pasos[s].formula) + '</span></div>';
        if (!fin) {
          var paso = e.pasos[n], orden = [0, 1, 2], rot = (pi + n) % 3;
          orden = orden.slice(rot).concat(orden.slice(0, rot));
          h += '<div class="paso"><p>Ahora tienes <span class="actual">' + UI.mat(exprActual(e, n)) + '</span>. <b>Paso ' + (n + 1) + ': ¿cuál expresión es equivalente?</b></p><div class="opciones-q">' +
            orden.map(function (j) { return '<button type="button" data-act="op" data-g="' + e.id + '" data-i="' + j + '">' + UI.mat(paso.ops[j].txt) + '</button>'; }).join('') + '</div>' +
            (S.fb[e.id] ? '<div class="fb mal" data-estado="mal">' + S.fb[e.id] + '</div>' : '') + '</div>';
        } else {
          h += '<div class="fb ok" data-estado="ok"><b>✔ Resultado: ' + UI.mat(exprActual(e, n)) + '</b>. Compruébalo con la tabla:</div>' +
            '<div class="tabla-wrap"><table class="tv"><thead><tr><th>A</th><th>B</th><th>' + UI.mat(e.inicio.txt) + '</th><th>' + UI.mat(exprActual(e, n)) + '</th><th></th></tr></thead><tbody>' +
            [[0, 0], [0, 1], [1, 0], [1, 1]].map(function (f) {
              var x = e.inicio.f(f[0], f[1]), y = previa(e, n)(f[0], f[1]);
              return '<tr class="ok"><td>' + f[0] + '</td><td>' + f[1] + '</td><td>' + x + '</td><td>' + y + '</td><td><span class="est ok">✔</span></td></tr>';
            }).join('') + '</tbody></table></div><p class="leyenda">Las dos columnas son iguales en las cuatro filas: simplificaste sin cambiar el circuito.</p>';
        }
        h += '</div>';
      });
      h += '</div>' + (todos ? '<div class="fb ok" data-fin="1"><b>🎉 Guía 1C completa.</b> Simplificar = quitar piezas que no cambian el resultado.</div>' : '');
      host.setAttribute('data-hecho', todos ? '1' : '0');
      host.innerHTML = h;
      if (todos) UI.marcar('g1:1C', 'circ');
    }
    var acc = {
      op: function (b) {
        var id = b.getAttribute('data-g'), e = D.ESCALERA.filter(function (x) { return x.id === id; })[0], n = S.prob[id], j = +b.getAttribute('data-i');
        var op = e.pasos[n].ops[j], ant = previa(e, n);
        if (equiv(op.f, ant)) { S.prob[id] = n + 1; S.fb[id] = ''; }
        else {
          S.err++;
          var c = [[0, 0], [0, 1], [1, 0], [1, 1]].filter(function (f) { return op.f(f[0], f[1]) !== ant(f[0], f[1]); })[0];
          S.fb[id] = '✘ <b>' + UI.mat(op.txt) + '</b> no es equivalente: con A = ' + c[0] + ' y B = ' + c[1] + ' da ' + op.f(c[0], c[1]) + ', pero <b>' + UI.mat(exprActual(e, n)) + '</b> da ' + ant(c[0], c[1]) + '. Prueba otra opción.';
        }
      }
    };
    montar(host, S, render, acc, alCambiar, opts);
    return { host: host, S: S };
  }

  raiz.Guia1 = { A: Guia1A, B: Guia1B, C: Guia1C };
})(window);
