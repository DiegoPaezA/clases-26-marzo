/* Motor lógico de la página de prueba de Digitales (guías 1, 2 y 3).
   Sin DOM: se puede cargar en el navegador (global Motor) o en Node (verificar.cjs).

   Un circuito del estudiante es siempre el mismo esqueleto de tres entradas y dos compuertas:
     estado = { neg:[0|1,0|1,0|1], grupo:0|1, g1:'AND'|'OR'|null, g2:'AND'|'OR'|null }
   · neg[i]   → el cable de la entrada i pasa por un NOT.
   · grupo 0  → la compuerta 1 junta las entradas 1 y 2; la compuerta 2 junta ese resultado con la 3.
   · grupo 1  → la compuerta 1 junta las entradas 2 y 3; la compuerta 2 junta ese resultado con la 1.
   · null     → el estudiante todavía no eligió esa compuerta (circuito incompleto). */
(function (raiz) {
  'use strict';

  var OPS = {
    AND: function (a, b) { return a && b ? 1 : 0; },
    OR: function (a, b) { return a || b ? 1 : 0; },
    NAND: function (a, b) { return a && b ? 0 : 1; },
    NOR: function (a, b) { return a || b ? 0 : 1; },
    XOR: function (a, b) { return a !== b ? 1 : 0; },
    NOT: function (a) { return a ? 0 : 1; }
  };
  var PARES = [[0, 1], [1, 2]];
  var RESTO = [2, 0];
  var SIMBOLO = { AND: '·', OR: '+' };

  function filas(n) {
    var r = [], i, b, f;
    for (i = 0; i < (1 << n); i++) {
      f = [];
      for (b = n - 1; b >= 0; b--) f.push((i >> b) & 1);
      r.push(f);
    }
    return r;
  }

  function indice(spec, k) {
    for (var i = 0; i < spec.entradas.length; i++) if (spec.entradas[i].k === k) return i;
    return -1;
  }

  function litCumple(spec, l, v) { return v[indice(spec, l[0])] === l[1]; }

  /* Salida que EXIGE la regla del problema (se calcula desde las rutas en lenguaje natural). */
  function requerido(spec, v) {
    return spec.rutas.some(function (r) {
      return r.lits.every(function (l) { return litCumple(spec, l, v); });
    }) ? 1 : 0;
  }

  /* Evalúa el circuito del estudiante. Si falta una compuerta, la salida es null. */
  function evaluar(st, v) {
    var lit = v.map(function (x, i) { return st.neg[i] ? OPS.NOT(x) : x; });
    var p = PARES[st.grupo][0], q = PARES[st.grupo][1], r = RESTO[st.grupo];
    var g1 = st.g1 ? OPS[st.g1](lit[p], lit[q]) : null;
    var out = (st.g1 && st.g2) ? OPS[st.g2](g1, lit[r]) : null;
    return { lit: lit, g1: g1, out: out, completo: out !== null };
  }

  function faltantes(st) {
    var f = [];
    if (!st.g1) f.push(1);
    if (!st.g2) f.push(2);
    return f;
  }

  /* Filas donde el circuito no coincide con la regla. */
  function filasFallidas(spec, st) {
    return filas(spec.entradas.length).filter(function (v) {
      return evaluar(st, v).out !== requerido(spec, v);
    });
  }

  function equivalente(spec, st) {
    return evaluar(st, [0, 0, 0]).completo && filasFallidas(spec, st).length === 0;
  }

  function copiar(st) {
    return { neg: st.neg.slice(), grupo: st.grupo, g1: st.g1, g2: st.g2 };
  }

  /* Todos los cambios de UNA sola pieza que se pueden hacer a un circuito. */
  function ediciones(st) {
    var out = [], i;
    for (i = 0; i < 3; i++) {
      var a = copiar(st); a.neg[i] = a.neg[i] ? 0 : 1;
      out.push({ tipo: 'not', i: i, st: a });
    }
    var g = copiar(st); g.grupo = g.grupo ? 0 : 1;
    out.push({ tipo: 'grupo', st: g });
    ['g1', 'g2'].forEach(function (cual) {
      ['AND', 'OR'].forEach(function (op) {
        if (st[cual] !== op) {
          var c = copiar(st); c[cual] = op;
          out.push({ tipo: 'andor', g: cual === 'g1' ? 1 : 2, st: c });
        }
      });
    });
    return out;
  }

  /* Busca la reparación más corta (1 o 2 piezas). Sirve para dar una pista concreta y para
     comprobar que cada circuito dañado de la guía 3 se arregla cambiando una sola pieza. */
  function sugerencia(spec, st) {
    var faltan = faltantes(st);
    if (faltan.length) return { tipo: 'incompleto', faltan: faltan, pasos: null };
    if (equivalente(spec, st)) return { tipo: 'ok', pasos: 0 };
    var uno = ediciones(st).filter(function (e) { return equivalente(spec, e.st); });
    if (uno.length) return { tipo: uno[0].tipo, i: uno[0].i, g: uno[0].g, pasos: 1, opciones: uno.length };
    var dos = false;
    ediciones(st).forEach(function (e) {
      ediciones(e.st).forEach(function (e2) { if (equivalente(spec, e2.st)) dos = true; });
    });
    return { tipo: dos ? 'varios' : 'lejos', pasos: dos ? 2 : null };
  }

  /* Los 64 circuitos posibles del esqueleto que cumplen la regla (la solución no es única). */
  function soluciones(spec) {
    var out = [], n, g, a, b;
    for (n = 0; n < 8; n++) {
      for (g = 0; g < 2; g++) {
        for (a = 0; a < 2; a++) {
          for (b = 0; b < 2; b++) {
            var st = {
              neg: [(n >> 2) & 1, (n >> 1) & 1, n & 1],
              grupo: g, g1: a ? 'OR' : 'AND', g2: b ? 'OR' : 'AND'
            };
            if (equivalente(spec, st)) out.push(st);
          }
        }
      }
    }
    return out;
  }

  /* Expresión en texto plano (solo para lectores de pantalla y pruebas): (no A · B) · T1 */
  function formula(spec, st) {
    var t = function (i) { return (st.neg[i] ? 'no ' : '') + spec.entradas[i].k; };
    var p = PARES[st.grupo][0], q = PARES[st.grupo][1], r = RESTO[st.grupo];
    var a = '(' + t(p) + ' ' + (SIMBOLO[st.g1] || '?') + ' ' + t(q) + ')';
    return st.grupo === 0
      ? a + ' ' + (SIMBOLO[st.g2] || '?') + ' ' + t(r)
      : t(r) + ' ' + (SIMBOLO[st.g2] || '?') + ' ' + a;
  }

  /* Nombre de una entrada en LaTeX: T1 → T_1, Tterm → T_{\text{term}}. */
  function texK(k) {
    if (k === 'Tterm') return 'T_{\\text{term}}';
    var m = k.match(/^([A-Za-z])(\d)$/);
    return m ? m[1] + '_' + m[2] : k;
  }

  /* La misma expresión en LaTeX. La negación SIEMPRE se escribe con barra: \overline{A}. */
  function formulaTex(spec, st) {
    var t = function (i) { var v = texK(spec.entradas[i].k); return st.neg[i] ? '\\overline{' + v + '}' : v; };
    var simbolo = function (op) { return op === 'AND' ? ' \\cdot ' : op === 'OR' ? ' + ' : ' \\square '; };
    var p = PARES[st.grupo][0], q = PARES[st.grupo][1], r = RESTO[st.grupo];
    var a = '(' + t(p) + simbolo(st.g1) + t(q) + ')';
    return st.grupo === 0 ? a + simbolo(st.g2) + t(r) : t(r) + simbolo(st.g2) + a;
  }

  /* La misma expresión como HTML simple (para los informes descargables, que no cargan KaTeX): barra encima = NOT. */
  function formulaHtml(spec, st) {
    var h = function (k) { return k === 'Tterm' ? 'T<sub>term</sub>' : k.replace(/^([A-Za-z])(\d)$/, '$1<sub>$2</sub>'); };
    var t = function (i) { var v = h(spec.entradas[i].k); return st.neg[i] ? '<span style="text-decoration:overline">' + v + '</span>' : v; };
    var simbolo = function (op) { return op === 'AND' ? ' · ' : op === 'OR' ? ' + ' : ' □ '; };
    var p = PARES[st.grupo][0], q = PARES[st.grupo][1], r = RESTO[st.grupo];
    var a = '(' + t(p) + simbolo(st.g1) + t(q) + ')';
    return 'Y = ' + (st.grupo === 0 ? a + simbolo(st.g2) + t(r) : t(r) + simbolo(st.g2) + a);
  }

  /* Explica en palabras por qué la regla pide 1 o 0 en una combinación. */
  function porQueFila(spec, v) {
    var y = requerido(spec, v);
    var txt = function (l) { return '«' + l[2] + '»'; };
    if (spec.rutas.length === 1) {
      var falla = spec.rutas[0].lits.filter(function (l) { return !litCumple(spec, l, v); });
      return y ? 'Se cumplen todas las condiciones.'
        : 'No se activa porque falla ' + falla.map(txt).join(' y ') + '.';
    }
    var ok = spec.rutas.filter(function (r) { return r.lits.every(function (l) { return litCumple(spec, l, v); }); });
    if (y) return 'Se activa por la ruta «' + ok.map(function (r) { return r.nombre; }).join('» y por «') + '».';
    return 'No se activa: ' + spec.rutas.map(function (r) {
      var f = r.lits.filter(function (l) { return !litCumple(spec, l, v); });
      return 'en «' + r.nombre + '» falla ' + txt(f[0]);
    }).join('; ') + '.';
  }

  /* Cada condición de la regla con su marca ✔/✘ para una combinación (apoyo para predecir). */
  function condicionesFila(spec, v) {
    return spec.rutas.map(function (r) {
      return {
        ruta: r.nombre,
        lits: r.lits.map(function (l) { return { texto: l[2], ok: litCumple(spec, l, v) }; })
      };
    });
  }

  /* Tabla de verdad que está escrita en el texto original del docente (para contrastar). */
  function tablaDeTextoOriginal(texto) {
    var tabla = [];
    texto.split('\n').forEach(function (ln) {
      var m = ln.match(/^\|\s*([01])\s*\|\s*([01])\s*\|\s*([01])\s*\|\s*([01])\s*\|/);
      if (m) tabla.push([+m[1], +m[2], +m[3], +m[4]]);
    });
    return tabla;
  }

  var Motor = {
    OPS: OPS, filas: filas, indice: indice, requerido: requerido, evaluar: evaluar,
    faltantes: faltantes, filasFallidas: filasFallidas, equivalente: equivalente, copiar: copiar,
    ediciones: ediciones, sugerencia: sugerencia, soluciones: soluciones, formula: formula, formulaTex: formulaTex, formulaHtml: formulaHtml, texK: texK,
    porQueFila: porQueFila, condicionesFila: condicionesFila, tablaDeTextoOriginal: tablaDeTextoOriginal,
    PARES: PARES, RESTO: RESTO
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Motor;
  else raiz.Motor = Motor;
})(typeof window !== 'undefined' ? window : globalThis);
