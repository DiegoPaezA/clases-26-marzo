/* Puente entre los ejercicios nuevos (Ejercicio) y la guía publicada de Digitales 1.
   La guía conserva su sorteo de tres problemas, su estado guardado y sus informes; este archivo
   solo dice qué ejercicio nuevo corresponde a cada problema del banco, guarda el avance dentro de
   la actividad (a.nuevo) y escribe la parte del informe de ese ejercicio. */
(function (raiz) {
  'use strict';
  var M = raiz.Motor, D = raiz.Datos, UI = raiz.UI;
  UI.integrado = true;

  /* problema del banco de la guía → ejercicio nuevo. En la guía 2 se arma el circuito; en la 3 se repara. */
  var MAPA = {
    2: { g2_tanque: 'tanque', g2_invernadero: 'invernadero', g2_extractor_auxiliar: 'extractor', g2_pasillo: 'pasillo', g2_cinta: 'cinta', g2_garaje: 'garaje', g2_bomba: 'bomba' },
    3: { g3_cortacesped: 'cortacesped', g3_calentador: 'calentador', g3_prensa: 'prensa', g3_cinta_or: 'cinta', g3_pasillo_paren: 'pasillo', g3_dosis_paren: 'cloro' }
  };

  function especificacion(task) {
    var id = MAPA[task.g] && MAPA[task.g][task.problemId || ''];
    if (!id) return null;
    var spec = D.EJERCICIOS.filter(function (e) { return e.id === id; })[0];
    if (!spec || (task.g === 3 && !spec.defecto)) return null;
    return spec;
  }
  var LETRA = { D1A: 'A', D1B: 'B', D1C: 'C' };
  function soporta(task) { return !!task && ((task.g === 1 && !!LETRA[task.id]) || ((task.g === 2 || task.g === 3) && !!especificacion(task))); }
  function modoDe(task) { return task.g === 3 ? 'detective' : 'armar'; }

  function resumen(spec, modo, snap, previo) {
    var det = modo === 'detective';
    var ok = det ? !!(snap.diagOk && snap.resuelto) : !!(snap.predOk && snap.resuelto);
    return {
      v: 1, ejercicio: spec.id, modo: modo, snap: snap, ok: ok, tabla: !!snap.predOk, circuito: !!snap.resuelto, diagnostico: !!snap.diagOk,
      ayuda: !!snap.ayuda, intentos: Math.max(snap.total | 0, snap.intentos | 0), pistas: snap.pistas | 0,
      actualizado: new Date().toISOString(), resueltoEn: ok ? ((previo && previo.resueltoEn) || new Date().toISOString()) : null
    };
  }

  /* Dibuja el ejercicio dentro de `host` y guarda cada cambio en state.activities[task.id].nuevo. */
  /* Guía 1: tres actividades (compuertas, De Morgan, escalera) que guardan su estado completo. */
  function montarG1(task, host, act, alCambiar) {
    var letra = LETRA[task.id];
    host.classList.add('d1x');
    var previo = act(task.id).nuevo;
    var inicial = previo && previo.g1 === letra ? previo.snap : null;
    var ultimo = inicial ? JSON.stringify(inicial) : null, primero = true;
    return raiz.Guia1[letra](host, function () { UI.mates(host); }, {
      inicial: inicial,
      alGuardar: function (S, hecho) {
        var js = JSON.stringify(S);
        if (primero) { primero = false; if (ultimo === null) { ultimo = js; return; } }
        if (js === ultimo) return;
        ultimo = js;
        var a = act(task.id), ant = a.nuevo;
        a.nuevo = { v: 1, g1: letra, snap: JSON.parse(js), ok: !!hecho, errores: S.err | 0, actualizado: new Date().toISOString(),
          resueltoEn: hecho ? ((ant && ant.resueltoEn) || new Date().toISOString()) : null };
        if (alCambiar) alCambiar(a.nuevo);
      }
    });
  }

  function montar(task, host, act, alCambiar) {
    if (task.g === 1) return montarG1(task, host, act, alCambiar);
    var spec = especificacion(task), modo = modoDe(task);
    host.classList.add('d1x');
    var primero = true, ultimo = null;
    var previo = act(task.id).nuevo;
    var inicial = previo && previo.ejercicio === spec.id && previo.modo === modo ? previo.snap : null;
    ultimo = inicial ? JSON.stringify(inicial) : null;
    var ej = raiz.Ejercicio(spec, modo, host, function () { UI.mates(host); }, {
      inicial: inicial,
      alGuardar: function (snap) {
        var js = JSON.stringify(snap);
        if (primero) { primero = false; if (ultimo === null) { ultimo = js; return; } }
        if (js === ultimo) return;
        ultimo = js;
        var a = act(task.id);
        a.nuevo = resumen(spec, modo, snap, a.nuevo);
        if (alCambiar) alCambiar(a.nuevo);
      }
    });
    return ej;
  }

  function pendientes(task, a) {
    var n = a && a.nuevo, det = task.g === 3, out = [];
    if (task.g === 1) return pendientesG1(task, a);
    if (!n) { out.push(det ? 'falta observar, diagnosticar y reparar el circuito' : 'falta completar la tabla y armar el circuito'); return out; }
    if (det) { if (!n.diagnostico) out.push('falta diagnosticar el tipo de error'); }
    else if (!n.tabla) out.push('falta completar y comprobar la tabla de verdad');
    if (!n.circuito) out.push(det ? 'falta reparar el circuito hasta que funcione en las 8 combinaciones' : 'falta armar un circuito que funcione en las 8 combinaciones');
    return out;
  }

  var esc = UI.esc;
  function pendientesG1(task, a) {
    var n = a && a.nuevo, S = n && n.snap, out = [];
    if (!S) return ['falta trabajar esta actividad'];
    if (task.id === 'D1A') {
      var f = D.COMPUERTAS.filter(function (c) { return !S.hecha || !S.hecha[c.id]; }).map(function (c) { return c.nombre; });
      if (f.length) out.push('falta predecir correctamente la tabla de: ' + f.join(', '));
      var q = D.QUIZ_COMPUERTAS.filter(function (x, i) { return !S.quiz || S.quiz[i] !== x.r; }).length;
      if (q) out.push('faltan ' + q + ' situaciones por clasificar con la compuerta correcta');
    } else if (task.id === 'D1B') {
      ['dm1', 'dm2'].forEach(function (g, i) { if (!S.ok || !S.ok[g]) out.push('falta completar la tabla de la ley ' + (i + 1) + ' de De Morgan'); });
      var qb = D.PREGUNTAS_DM.filter(function (x, i) { return !S.q || S.q[i] !== x.r; }).length;
      if (qb) out.push('faltan ' + qb + ' preguntas de De Morgan');
    } else {
      D.ESCALERA.forEach(function (e) { var k = S.prob && S.prob[e.id] || 0; if (k < e.pasos.length) out.push('falta terminar «' + e.titulo + '» (' + k + ' de ' + e.pasos.length + ' pasos)'); });
    }
    return out;
  }
  function informeG1(task, a, titulo) {
    var n = a.nuevo, S = n && n.snap, h = '<section><h2>' + esc(titulo) + '</h2>';
    if (!S) return h + '<p>Pendiente: todavía no se trabajó esta actividad.</p></section>';
    h += '<p><b>Estado:</b> ' + (n.ok ? 'Comprobado' : 'En curso') + ' · <b>Respuestas equivocadas antes de acertar:</b> ' + (S.err | 0) + '</p>';
    var tabla = function (cab, filas) { return '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' + filas.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'; };
    if (task.id === 'D1A') {
      h += '<h3>Compuertas dominadas</h3>' + tabla(['Compuerta', 'Se lee', 'Tabla predicha', 'Resultado'], D.COMPUERTAS.map(function (c) {
        var ok = !!(S.hecha && S.hecha[c.id]), p = S.pred && S.pred[c.id];
        return [esc(c.nombre), esc(c.lee), p ? esc('salidas: ' + p.map(function (x) { return x === null || x === undefined ? '?' : x; }).join(' ')) + ' (filas en orden 00, 01, 10, 11)' : 'Sin intentar', ok ? 'Correcta' : 'Pendiente'];
      }));
      h += '<h3>Situaciones de la vida diaria</h3>' + tabla(['Situación', 'Respuesta del estudiante', 'Correcta'], D.QUIZ_COMPUERTAS.map(function (q, i) {
        var r = S.quiz && S.quiz[i];
        return [esc(q.q), r ? esc(r) : 'Sin responder', esc(q.r) + (r === q.r ? ' ✔' : '')];
      }));
    } else if (task.id === 'D1B') {
      h += D.DE_MORGAN.map(function (dm) {
        var ok = !!(S.ok && S.ok[dm.id]), p = S.pred && S.pred[dm.id];
        return '<h3>' + texHtml(dm.izq + '=' + dm.der) + '</h3><p>' + esc(dm.historia) + '</p>' + tabla(['A', 'B', 'Predicción de la primera expresión', 'Predicción de la segunda'],
          [[0, 0], [0, 1], [1, 0], [1, 1]].map(function (f, r) { var x = p && p[r]; return [f[0], f[1], x && x[0] !== null && x[0] !== undefined ? x[0] : '?', x && x[1] !== null && x[1] !== undefined ? x[1] : '?']; })) +
          '<p><b>Resultado:</b> ' + (ok ? 'Tabla correcta: las dos expresiones coinciden en las cuatro filas.' : 'Pendiente') + '</p>';
      }).join('');
      h += '<h3>Preguntas de comprobación</h3>' + tabla(['Pregunta', 'Respuesta del estudiante', 'Correcta'], D.PREGUNTAS_DM.map(function (q, i) {
        var r = S.q && S.q[i];
        return [texHtml(q.q.replace(/\$/g, '')), r === undefined ? 'Sin responder' : texHtml(q.ops[r].replace(/\$/g, '')), texHtml(q.ops[q.r].replace(/\$/g, '')) + (r === q.r ? ' ✔' : '')];
      }));
    } else {
      h += '<h3>Simplificación paso a paso</h3>' + D.ESCALERA.map(function (e) {
        var k = Math.min(S.prob && S.prob[e.id] || 0, e.pasos.length);
        var filas = [['Inicio', texHtml(e.inicio.txt), '—']].concat(e.pasos.slice(0, k).map(function (p, i) { return ['Paso ' + (i + 1), texHtml(p.ops[0].txt), esc(p.ley)]; }));
        return '<h3>' + esc(e.titulo) + ' (' + k + ' de ' + e.pasos.length + ' pasos)</h3>' + tabla(['Paso', 'Expresión elegida', 'Ley usada'], filas);
      }).join('');
    }
    return h + '</section>';
  }
  /* Ecuación TeX de los datos → HTML sin KaTeX (barra encima = NOT), para el informe. */
  function texHtml(t) {
    return esc(t).replace(/\+/g, ' + ').replace(/=/g, ' = ').replace(/\\cdot/g, ' · ').replace(/\\square/g, '□')
      .replace(/_\{\\text\{([^}]*)\}\}/g, '<sub>$1</sub>').replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(/_(\w)/g, '<sub>$1</sub>')
      .replace(/\\overline\{([^{}]*)\}/g, '<span style="text-decoration:overline">$1</span>');
  }
  function si(x) { return x ? 'Sí' : 'No'; }

  /* Sección del informe (HTML simple: el informe también se descarga y no carga KaTeX). */
  function informe(task, a, titulo) {
    if (task.g === 1) return informeG1(task, a, titulo);
    var spec = especificacion(task), n = a.nuevo, det = task.g === 3, snap = n && n.snap;
    var h = '<section><h2>' + esc(titulo) + '</h2><p>' + esc(spec.situacion) + '</p>';
    if (!snap) return h + '<p>Pendiente: todavía no se trabajó este ejercicio.</p></section>';
    h += '<p><b>Estado:</b> ' + (n.ok ? 'Comprobado' + (n.ayuda ? ' con ayuda' : '') : 'En curso') + '</p>';
    var f = M.filas(3), nombres = spec.entradas.map(function (e) { return esc(e.nombre) + ' (' + esc(e.k) + ')'; });
    var circ = snap.circ;
    if (!det) {
      h += '<h3>Tabla de verdad predicha</h3><table><thead><tr>' + nombres.map(function (x) { return '<th>' + x + '</th>'; }).join('') +
        '<th>La regla pide</th><th>Predicción</th><th>Resultado</th></tr></thead><tbody>' +
        f.map(function (v, r) {
          var req = M.requerido(spec, v), p = snap.pred[r];
          return '<tr>' + v.map(function (x) { return '<td>' + x + '</td>'; }).join('') + '<td>' + req + '</td><td>' + (p === 0 || p === 1 ? p : 'Pendiente') + '</td><td>' + (p === req ? 'Correcta' : p === null ? '—' : 'Incorrecta') + '</td></tr>';
        }).join('') + '</tbody></table>';
    } else {
      h += '<h3>Diagnóstico</h3><table><tbody><tr><th>Síntoma observado</th><td>' + esc(spec.defecto.sintoma) + '</td></tr>' +
        '<tr><th>Tipo de error elegido</th><td>' + (snap.diag ? esc(D.TIPOS_ERROR[snap.diag].etiqueta) + (snap.diagOk ? ' (correcto)' : ' (no coincide)') : 'Pendiente') + '</td></tr>' +
        '<tr><th>Circuito dañado</th><td>' + M.formulaHtml(spec, spec.defecto.estado) + '</td></tr></tbody></table>';
    }
    var completo = !M.faltantes(circ).length;
    var nots = circ.neg.map(function (x, i) { return x ? spec.entradas[i].k : null; }).filter(Boolean);
    h += '<h3>' + (det ? 'Circuito reparado' : 'Circuito armado') + '</h3><table><tbody><tr><th>Expresión</th><td>' + (completo ? M.formulaHtml(spec, circ) : 'Incompleto: falta elegir compuertas') + '</td></tr>' +
      '<tr><th>NOT puestos en</th><td>' + (nots.length ? esc(nots.join(', ')) : 'ninguno') + '</td></tr>' +
      '<tr><th>Funciona en las 8 combinaciones</th><td>' + (n.circuito ? 'Sí' : 'No') + '</td></tr>' +
      '<tr><th>Regla original</th><td>' + texHtml(spec.ecuacion) + '</td></tr></tbody></table>';
    h += '<h3>Apoyos usados</h3><table><tbody><tr><th>Veces que comprobó el circuito</th><td>' + (n.intentos | 0) + '</td></tr>' +
      '<tr><th>Pistas abiertas (de 3)</th><td>' + (n.pistas | 0) + '</td></tr>' +
      '<tr><th>Solución asistida</th><td>' + si(n.ayuda) + '</td></tr></tbody></table>';
    if (snap.explicacion && String(snap.explicacion).trim()) h += '<h3>Explicación del estudiante</h3><p>' + esc(snap.explicacion) + '</p>';
    return h + '</section>';
  }

  /* Resumen al principio del informe: una mirada rápida para el docente. */
  function resumenInforme(tareas, actividades, comprobada, titulo) {
    var filas = tareas.map(function (t) {
      var a = actividades[t.id] || {}, n = a.nuevo, ok = comprobada(t, a);
      var estado = ok ? (n && n.ayuda ? 'Comprobada con ayuda' : 'Comprobada') : (n || Object.keys(a.answers || {}).length ? 'En curso' : 'Pendiente');
      var apoyo = n ? (n.g1 ? 'Errores: ' + (n.errores | 0) : 'Comprobaciones: ' + (n.intentos | 0) + ' · Pistas: ' + (n.pistas | 0)) : '—';
      var fecha = n && n.resueltoEn ? new Date(n.resueltoEn).toLocaleString('es-CO') : '—';
      return '<tr><td>' + esc(titulo(t)) + '</td><td>' + estado + '</td><td>' + esc(apoyo) + '</td><td>' + esc(fecha) + '</td></tr>';
    });
    var hechas = tareas.filter(function (t) { return comprobada(t, actividades[t.id] || {}); }).length;
    return '<h2>Resumen</h2><p><b>' + hechas + ' de ' + tareas.length + '</b> actividades comprobadas.</p><table><thead><tr><th>Actividad</th><th>Estado</th><th>Apoyos / errores</th><th>Comprobada el</th></tr></thead><tbody>' + filas.join('') + '</tbody></table>';
  }

  raiz.D1X = { resumenInforme: resumenInforme, texHtml: texHtml, MAPA: MAPA, soporta: soporta, especificacion: especificacion, modoDe: modoDe, montar: montar, pendientes: pendientes, informe: informe };
})(window);
