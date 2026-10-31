/* Ejercicio de las guías 2 (armar el circuito) y 3 (detective: encontrar y reparar el fallo).
   Tres etapas por ejercicio, siempre en el mismo orden:
     Guía 2 · 1 Entiende → 2 Predice → 3 Arma
     Guía 3 · 1 Observa  → 2 Diagnostica → 3 Repara                                            */
(function (raiz) {
  'use strict';
  var M = raiz.Motor, D = raiz.Datos, ES = raiz.Escenas, UI = raiz.UI;
  var cap = UI.cap, esc = UI.esc;
  var NUM = ['①', '②'];

  function Ejercicio(spec, modo, host, alCambiar, opts) {
    opts = opts || {};
    var det = modo === 'detective';
    var clave = modo + ':' + spec.id;
    var ent = spec.entradas;
    var S = {
      env: [0, 0, 0], etapa: 1,
      pred: [null, null, null, null, null, null, null, null], predEst: null, predOk: false,
      circ: det ? M.copiar(spec.defecto.estado) : { neg: [0, 0, 0], grupo: spec.solucion.grupo, g1: null, g2: null },
      revisado: false, intentos: 0, veredicto: null, pistas: 0, ayuda: false, resuelto: false,
      tocado: false, casoElegido: false, diag: null, diagOk: false, fbDiag: '', explicacion: ''
    };
    var ultimaClave = null;

    /* ---------- textos ---------- */
    function descr(v) {
      var t = v.map(function (x, i) { var s = x ? ent[i].si : ent[i].no; return s.charAt(0).toLowerCase() + s.slice(1); });
      return t.slice(0, -1).join(', ') + ' y ' + t[t.length - 1];
    }
    function filaTexto(v) {
      return v.map(function (x, i) { return ent[i].nombre + ': ' + (x ? 'sí' : 'no'); }).join(', ');
    }
    function marca(ok) { return '<span class="marca ' + (ok ? 'si' : 'no') + '" role="img" aria-label="' + (ok ? 'se cumple' : 'no se cumple') + '">' + (ok ? '✔' : '✘') + '</span>'; }

    function htmlRegla(v) {
      var unica = spec.rutas.length === 1;
      var h = '<div class="regla"><h4>La regla: ' + esc(spec.actuador.nombre.toLowerCase()) + ' se activa ' +
        (unica ? 'solo si se cumplen <u>TODAS</u> estas condiciones' : 'si se cumple <u>CUALQUIERA</u> de estas rutas') + '</h4>';
      spec.rutas.forEach(function (r, ri) {
        if (!unica) h += (ri ? '<span class="o-sep">— O —</span>' : '') + '<div class="ruta"><b>Ruta ' + (ri + 1) + ' · ' + esc(r.nombre) + ' <span class="subtle">(todas a la vez)</span></b>';
        h += '<ul>';
        r.lits.forEach(function (l) {
          var ok = v[M.indice(spec, l[0])] === l[1];
          h += '<li>' + marca(ok) + '<span>' + esc(cap(l[2])) + ' <span class="tag">' + l[0] + ' = ' + l[1] + '</span></span></li>';
        });
        h += '</ul>' + (unica ? '' : '</div>');
      });
      return h + '</div>';
    }

    function htmlPalabras() {
      return '<details class="caja guia"><summary><b>¿Cómo paso de las palabras a las compuertas?</b></summary><div class="palabras">' +
        D.PALABRAS.map(function (p) {
          return '<div><div class="g">' + p.gate + '<span>' + UI.mat(p.simbolo) + '</span></div><div><i>' + esc(p.frase) + '</i></div><div>' + esc(p.ayuda) + '</div></div>';
        }).join('') + '</div></details>';
    }

    function htmlSensores(leyenda) {
      var h = '<div class="sensores" role="group" aria-label="Sensores: pulsa para cambiar entre 0 y 1">';
      ent.forEach(function (e, i) {
        h += '<button type="button" class="sensor' + (S.tocado ? '' : ' llamar') + '" data-act="sensor" data-i="' + i + '" aria-pressed="' + (S.env[i] ? 'true' : 'false') + '" aria-label="' + esc(e.nombre) + ': ' + (S.env[i] ? e.si : e.no) + '. Pulsa para cambiar.">' +
          '<span class="ic" aria-hidden="true">' + e.icono + '</span><span class="tx"><b>' + esc(e.nombre) + ' <span class="tag">' + e.k + '</span></b><small>' + esc(S.env[i] ? e.si : e.no) + '</small>' +
          '<small class="accion">👆 Pulsa para cambiarlo a ' + (S.env[i] ? '0' : '1') + '</small></span>' +
          '<span class="sw" aria-hidden="true"><i>' + S.env[i] + '</i></span></button>';
      });
      return '<p class="uso-interruptor"><b>👆 Pulsa cada sensor</b> para cambiarlo entre <b>0</b> (no se cumple) y <b>1</b> (sí se cumple). Mira cómo cambian la escena y la regla.</p>' + h + '</div>';
    }

    function cabTabla(extra) {
      return '<tr>' + ent.map(function (e) { return '<th scope="col">' + e.k + '<small>' + esc(e.nombre) + '</small></th>'; }).join('') + extra + '</tr>';
    }

    /* ---------- escena ---------- */
    function htmlEscena(out, mostrarCompara) {
      var req = M.requerido(spec, S.env);
      var chip = out === null
        ? '<span class="chip-est q">Sin circuito completo: el actuador espera</span>'
        : '<span class="chip-est ' + (out ? 'on' : 'off') + '">' + (out ? 'ENCENDIDO' : 'APAGADO') + '</span>';
      var txt = out === null ? 'Elige las compuertas para ver la respuesta.' : (out ? spec.actuador.on : spec.actuador.off);
      var comp = '';
      if (mostrarCompara) {
        if (out === null) comp = '<p class="compara n">Aún no se puede comparar con la regla.</p>';
        else if (out === req) comp = '<p class="compara ok">✔ Con estos sensores la regla pide lo mismo: ' + (req ? 'encendido' : 'apagado') + '.</p>';
        else comp = '<p class="compara mal">✘ Con estos sensores la regla pide ' + (req ? 'ENCENDIDO' : 'APAGADO') + ' y tu circuito da ' + (out ? 'ENCENDIDO' : 'APAGADO') + '.</p>';
      }
      return '<div class="escena-caja">' + ES.dibujar(spec.escena, S.env, out === 1) +
        '<div class="estado-act"><b>' + esc(spec.actuador.nombre) + ':</b> ' + chip + '<span>' + esc(txt) + '</span>' + comp + '</div></div>';
    }

    /* ---------- tablas ---------- */
    function htmlPrediccion() {
      var filas = M.filas(3);
      var h = '<div class="tabla-wrap"><table class="tv"><thead>' + cabTabla('<th scope="col">¿' + esc(cap(spec.actuador.nombre)) + ' encendido?</th><th scope="col">Resultado</th>') + '</thead><tbody>';
      filas.forEach(function (v, r) {
        var est = S.predEst && S.predEst[r];
        var bloq = est === 'ok';
        h += '<tr class="' + (est || '') + '">' + v.map(function (x) { return '<td class="cel' + x + '">' + x + '</td>'; }).join('') +
          '<td><div class="bin" role="group" aria-label="Fila ' + (r + 1) + ': ' + esc(filaTexto(v)) + '">' +
          '<button type="button" data-act="pred" data-r="' + r + '" data-v="0" aria-pressed="' + (S.pred[r] === 0) + '"' + (bloq ? ' disabled' : '') + ' aria-label="Apagado (0)">0</button>' +
          '<button type="button" data-act="pred" data-r="' + r + '" data-v="1" aria-pressed="' + (S.pred[r] === 1) + '"' + (bloq ? ' disabled' : '') + ' aria-label="Encendido (1)">1</button></div></td>' +
          '<td class="exp">' + (est === 'ok' ? '<span class="est ok" aria-hidden="true">✔</span> ' + esc(M.porQueFila(spec, v))
            : est === 'mal' ? '<span class="est mal" aria-hidden="true">✘</span> Revisa cada condición: ' + htmlCond(v) : '<span class="subtle">—</span>') + '</td></tr>';
      });
      return h + '</tbody></table></div>';
    }
    function htmlCond(v) {
      return M.condicionesFila(spec, v).map(function (r) {
        return (spec.rutas.length > 1 ? '<i>' + esc(r.ruta) + ':</i> ' : '') + r.lits.map(function (l) { return (l.ok ? '✔ ' : '✘ ') + esc(l.texto); }).join(' · ');
      }).join(' &nbsp;|&nbsp; ');
    }

    function htmlComparar(clicable) {
      var h = '<div class="tabla-wrap"><table class="tv"><thead>' + cabTabla('<th scope="col">La regla pide</th><th scope="col">Tu circuito</th><th scope="col">' + (clicable ? 'Probar' : '') + '</th>') + '</thead><tbody>';
      M.filas(3).forEach(function (v, r) {
        var req = M.requerido(spec, v), o = M.evaluar(S.circ, v).out;
        var cls = o === null ? '' : (o === req ? 'ok' : 'mal');
        if (v.join('') === S.env.join('')) cls += ' actual';
        h += '<tr class="' + cls + '">' + v.map(function (x) { return '<td class="cel' + x + '">' + x + '</td>'; }).join('') +
          '<td>' + (req ? '1 · ON' : '0 · OFF') + '</td><td>' + (o === null ? '?' : (o ? '1 · ON' : '0 · OFF')) + (o === null ? '' : (o === req ? ' <span class="est ok" aria-label="coincide">✔</span>' : ' <span class="est mal" aria-label="no coincide">✘</span>')) + '</td>' +
          '<td>' + (clicable ? '<button type="button" class="btn suave" data-act="fila" data-r="' + r + '">Probar</button>' : '') + '</td></tr>';
      });
      return h + '</tbody></table></div>';
    }

    /* ---------- circuito y controles ---------- */
    function htmlControles(editable) {
      var h = '';
      [1, 2].forEach(function (g) {
        var L = { p: M.PARES[S.circ.grupo][0], q: M.PARES[S.circ.grupo][1], r: M.RESTO[S.circ.grupo] };
        var cable = function (i) { var k = M.texK(ent[i].k); return UI.mat(S.circ.neg[i] ? '\\overline{' + k + '}' : k); };
        var que = g === 1
          ? 'Junta ' + cable(L.p) + ' con ' + cable(L.q)
          : 'Junta el resultado <b>①</b> con ' + cable(L.r);
        var sel = g === 1 ? S.circ.g1 : S.circ.g2;
        h += '<div class="ctrl-comp"><span class="num" aria-hidden="true">' + g + '</span><div><div>Compuerta ' + g + ': ' + que + '</div><div class="opc" role="group" aria-label="Compuerta ' + g + '">' +
          '<button type="button" data-act="gate" data-g="' + g + '" data-v="AND" aria-pressed="' + (sel === 'AND') + '"' + (editable ? '' : ' disabled') + '><b>AND · Y</b><small>deben cumplirse las dos</small></button>' +
          '<button type="button" data-act="gate" data-g="' + g + '" data-v="OR" aria-pressed="' + (sel === 'OR') + '"' + (editable ? '' : ' disabled') + '><b>OR · O</b><small>basta con una (o las dos)</small></button></div></div></div>';
      });
      if (det) {
        var a = ent[0].k, b = ent[1].k, c = ent[2].k;
        h += '<div class="ctrl-comp"><span class="num" aria-hidden="true">⇄</span><div><div>¿Qué señales se juntan <b>primero</b>?</div><div class="opc" role="group" aria-label="Agrupación">' +
          '<button type="button" data-act="grupo" data-v="0" aria-pressed="' + (S.circ.grupo === 0) + '"' + (editable ? '' : ' disabled') + '><b>' + a + ' con ' + b + '</b><small>y luego con ' + c + '</small></button>' +
          '<button type="button" data-act="grupo" data-v="1" aria-pressed="' + (S.circ.grupo === 1) + '"' + (editable ? '' : ' disabled') + '><b>' + b + ' con ' + c + '</b><small>y luego con ' + a + '</small></button></div></div></div>';
      }
      return h;
    }

    function htmlCircuitoZona(editable, comparar) {
      var out = M.evaluar(S.circ, S.env).out;
      return '<div class="zona-circuito"><div class="panel"><h4>Circuito' + (editable ? ' · ' + (det ? 'repáralo' : 'ármalo') : '') + '</h4>' +
        UI.circuito(spec, S.circ, S.env, !editable) +
        '<p class="leyenda"><i class="a"></i>1 (activo) <i class="b"></i>0 (apagado) <i class="c"></i>falta elegir. ' + (editable ? 'Toca <b>+NOT</b> sobre un cable para invertir esa señal.' : '') + '</p></div>' +
        '<div><h4 style="margin:0 0 6px">Escena</h4>' + htmlEscena(out, comparar) + '</div></div>';
    }

    /* ---------- veredicto y pistas ---------- */
    function nombreCable(i) { return '«' + ent[i].nombre + '» (' + ent[i].k + ')'; }
    function textoSugerencia(sg) {
      if (sg.tipo === 'not') return 'Mira el cable ' + nombreCable(sg.i) + ': ¿necesita un NOT o le sobra uno?';
      if (sg.tipo === 'andor') return 'Mira la compuerta ' + NUM[sg.g - 1] + ': ¿debería ser AND u OR?';
      if (sg.tipo === 'grupo') return 'Mira el orden: ¿qué dos señales deben juntarse primero?';
      if (sg.tipo === 'varios') return 'Hay más de una pieza por corregir. Empieza por la fila roja de arriba.';
      return 'Vuelve a leer la regla y tradúcela con las palabras clave (y → AND, o → OR, no → NOT).';
    }
    function comprobarCircuito() {
      S.intentos++; S.revisado = true;
      var f = M.faltantes(S.circ);
      if (f.length) {
        S.veredicto = { estado: 'incompleto', titulo: 'Todavía falta elegir ' + (f.length === 2 ? 'las dos compuertas' : 'la compuerta ' + NUM[f[0] - 1]),
          cuerpo: 'Toca AND u OR en cada compuerta. Mientras falte una, el circuito no puede responder y los cables aparecen en amarillo.' };
        return;
      }
      var mal = M.filasFallidas(spec, S.circ);
      if (!mal.length) {
        S.resuelto = true; UI.marcar(clave, 'circ'); if (S.ayuda) UI.marcar(clave, 'ayuda');
        S.veredicto = { estado: 'ok', titulo: '✔ ¡Funciona en las 8 combinaciones!' + (S.ayuda ? ' (resuelto con ayuda)' : ''),
          formula: M.formulaTex(spec, S.circ), cuerpo: spec.porQue };
        return;
      }
      var ej = mal.slice(0, 2).map(function (v) {
        var o = M.evaluar(S.circ, v).out, req = M.requerido(spec, v);
        return '<li>Cuando <b>' + esc(descr(v)) + '</b>: tu circuito da <b>' + o + '</b> pero la regla pide <b>' + req + '</b>. ' + esc(M.porQueFila(spec, v)) + '</li>';
      }).join('');
      var sg = M.sugerencia(spec, S.circ);
      S.veredicto = { estado: 'error', titulo: '✘ Tu circuito falla en ' + mal.length + ' de 8 combinaciones',
        lista: ej, ayuda: S.intentos >= 2 ? textoSugerencia(sg) : 'Pulsa «Probar» en la tabla (filas rojas) para ver el fallo en la escena. Si te atascas, usa una pista.' };
    }
    function htmlVeredicto() {
      var v = S.veredicto;
      if (!v) return '';
      var h = '<div class="veredicto ' + v.estado + '" data-estado="' + v.estado + '" role="status"><h4>' + v.titulo + '</h4>';
      if (v.formula) h += '<p>Tu circuito: <span class="formula">' + UI.mat('Y=' + v.formula) + '</span><br>Regla original: <span class="formula">' + UI.mat(spec.ecuacion) + '</span></p>';
      if (v.lista) h += '<ul>' + v.lista + '</ul>';
      if (v.cuerpo) h += '<p>' + (v.estado === 'ok' ? '<b>¿Por qué funciona?</b> ' : '') + UI.t(v.cuerpo) + '</p>';
      if (v.ayuda) h += '<p><b>Pista:</b> ' + esc(v.ayuda) + '</p>';
      if (v.estado === 'ok') h += '<label class="expl"><b>Con tus palabras (opcional, pero tu profesor lo leerá):</b> ' +
        (det ? '¿qué estaba mal y cómo lo arreglaste?' : '¿por qué tu circuito cumple la regla?') +
        '<textarea data-expl rows="3" maxlength="600">' + esc(S.explicacion) + '</textarea></label>';
      return h + '</div>';
    }

    function textoPistas() {
      var unica = spec.rutas.length === 1, p = [];
      if (det) {
        p.push(['Piensa', 'Síntoma: ' + spec.defecto.sintoma + ' Usa «Probar» en una fila roja y mira qué señal cambia el resultado.']);
        p.push(['Recuerda', D.TIPOS_ERROR[spec.defecto.tipo].porque]);
        p.push(['Casi la solución', textoSugerencia(M.sugerencia(spec, S.circ).tipo === 'ok' ? { tipo: 'lejos' } : M.sugerencia(spec, S.circ))]);
      } else {
        p.push(['Piensa', (unica
          ? 'La regla tiene ' + spec.rutas[0].lits.length + ' condiciones unidas por «y» (todas a la vez). Busca las que dicen «NO»: esas necesitan un NOT en su cable.'
          : 'La regla tiene ' + spec.rutas.length + ' rutas unidas por «o»: basta con que se cumpla una. Dentro de cada ruta las condiciones van unidas por «y».') + (spec.claveSimplificar ? ' ' + spec.claveSimplificar : '')]);
        p.push(['Otro ejemplo', 'En otra situación: ' + spec.ejemploDistinto]);
        var nots = spec.solucion.neg.map(function (n, i) { return n ? nombreCable(i) : null; }).filter(Boolean);
        p.push(['Casi la solución', (nots.length ? 'Necesitas NOT en: ' + nots.join(', ') + '.' : 'Ningún cable necesita NOT.') + ' Compuerta ① = ' + spec.solucion.g1 + ', compuerta ② = ' + spec.solucion.g2 + '.']);
      }
      return p;
    }
    function htmlPistas() {
      var t = textoPistas(), h = '<div class="pistas">';
      for (var i = 0; i < S.pistas; i++) h += '<div class="pista"><b>Pista ' + (i + 1) + ' · ' + t[i][0] + '</b>' + UI.t(t[i][1]) + '</div>';
      h += '<div class="fila-btn">';
      if (S.pistas < 3) h += '<button type="button" class="btn suave" data-act="pista">💡 ' + (S.pistas ? 'Otra pista' : 'Necesito una pista') + '</button>';
      else h += '<button type="button" class="btn suave" data-act="solucion">Mostrar la solución (cuenta como «con ayuda»)</button>';
      return h + '</div></div>';
    }

    /* ---------- etapas ---------- */
    function etapaArmar1() {
      return '<div class="zona-circuito"><div>' + htmlRegla(S.env) +
        '<h4 style="margin:12px 0 0">Prueba los sensores</h4>' + htmlSensores(true) + '</div>' +
        '<div><h4 style="margin:0 0 6px">Escena</h4>' + htmlEscena(null, false) +
        '<p class="leyenda">Aquí todavía no hay circuito: cada ✔ o ✘ de la regla cambia cuando mueves los sensores.</p></div></div>' + htmlPalabras() +
        '<div class="caja guia"><b>Tu misión:</b> convertir esta regla en un circuito de compuertas. Primero <b>predices</b> cuándo debe encenderse, y luego lo <b>armas</b> y lo pruebas.</div>' +
        '<div class="fila-btn"><button type="button" class="btn primario" data-act="etapa" data-n="2">Ya entendí la regla → Predecir</button></div>';
    }
    function etapaArmar2() {
      var ok = S.predEst ? S.predEst.filter(function (x) { return x === 'ok'; }).length : 0;
      var msg = '';
      if (S.predOk) msg = '<div class="fb ok"><b>✔ ¡Tabla completa y correcta!</b> Ya sabes en qué combinaciones se enciende. Ahora conviértelo en un circuito.</div>';
      else if (S.predEst) msg = '<div class="fb mal"><b>' + ok + ' de 8 filas bien.</b> Las filas en rojo tienen una condición que no se cumple: revisa los ✔ y ✘ de cada una. Una salida vale 1 solo si se cumple la regla completa.</div>';
      return '<p>Para cada combinación de sensores, ¿el actuador debe estar <b>encendido (1)</b> o <b>apagado (0)</b>? Usa la regla: ' +
        (spec.rutas.length === 1 ? 'se enciende solo si se cumplen todas las condiciones.' : 'se enciende si se cumple cualquiera de las rutas.') + '</p>' +
        '<details class="caja guia"><summary><b>Ver la regla otra vez</b></summary>' + htmlRegla(S.env) + '</details>' +
        htmlPrediccion() + msg +
        '<div class="fila-btn"><button type="button" class="btn primario" data-act="predcheck"' + (S.pred.indexOf(null) >= 0 ? ' disabled' : '') + '>Comprobar mi tabla</button>' +
        (S.pred.indexOf(null) >= 0 ? '<span class="subtle">Marca 0 o 1 en las ocho filas.</span>' : '') +
        (S.predOk ? '<button type="button" class="btn" data-act="etapa" data-n="3">Armar el circuito →</button>' : '') + '</div>';
    }
    function etapaArmar3() {
      return '<details class="caja guia"><summary><b>Ver la regla otra vez</b></summary>' + htmlRegla(S.env) + '</details>' +
        '<h4 style="margin:12px 0 4px">Prueba tu circuito con distintos sensores</h4>' + htmlSensores(false) +
        htmlCircuitoZona(true, S.revisado) + htmlControles(true) +
        '<div class="fila-btn"><button type="button" class="btn primario" data-act="comprobar">Comprobar mi circuito</button>' +
        '<button type="button" class="btn suave" data-act="reiniciarCirc">Empezar de nuevo</button></div>' +
        htmlVeredicto() + (S.revisado ? '<h4>Tu circuito frente a la regla</h4>' + htmlComparar(true) : '') + htmlPalabras() + htmlPistas();
    }

    function etapaDet1() {
      var mal = M.filasFallidas(spec, S.circ).length;
      return '<div class="caja aviso"><b>Síntoma:</b> ' + esc(spec.defecto.sintoma) + '</div>' + htmlRegla(S.env) +
        htmlCircuitoZona(false, true) + '<h4>Prueba de las 8 combinaciones</h4>' +
        '<p>Este circuito falla en <b>' + mal + ' de 8</b> filas (en rojo). Pulsa <b>Probar</b> en una fila roja y mira la escena: ahí se ve el error.</p>' +
        htmlComparar(true) +
        (S.casoElegido ? '<div class="fb ok">✔ Ya viste un caso donde falla. Ahora piensa: ¿qué tipo de error es?</div>' : '') +
        '<div class="fila-btn"><button type="button" class="btn primario" data-act="etapa" data-n="2">Diagnosticar el error →</button></div>';
    }
    function etapaDet2() {
      var h = '<p><b>¿Qué tipo de error tiene este circuito?</b> Recuerda el síntoma: <i>' + esc(spec.defecto.sintoma) + '</i></p><div class="opciones-q">';
      Object.keys(D.TIPOS_ERROR).forEach(function (t) {
        var cls = S.diag === t ? (S.diagOk ? 'bien' : 'mal') : (S.diagOk && t === spec.defecto.tipo ? 'bien' : '');
        h += '<button type="button" class="' + cls + '" data-act="diag" data-v="' + t + '"' + (S.diagOk ? ' disabled' : '') + '><b>' + esc(D.TIPOS_ERROR[t].etiqueta) + '</b><br><small>' + esc(D.TIPOS_ERROR[t].detalle) + '</small></button>';
      });
      h += '</div>' + (S.fbDiag ? '<div class="fb ' + (S.diagOk ? 'ok' : 'mal') + '" data-estado="' + (S.diagOk ? 'ok' : 'mal') + '">' + S.fbDiag + '</div>' : '');
      if (S.diagOk) h += '<div class="fila-btn"><button type="button" class="btn primario" data-act="etapa" data-n="3">Repararlo →</button></div>';
      return h;
    }
    function etapaDet3() {
      return '<div class="caja aviso"><b>Síntoma:</b> ' + esc(spec.defecto.sintoma) + '<br><b>Tipo de error:</b> ' + (S.diagOk ? esc(D.TIPOS_ERROR[spec.defecto.tipo].etiqueta) : '<i>aún sin diagnosticar</i>') + '</div>' +
        htmlSensores(false) + htmlCircuitoZona(true, true) + htmlControles(true) +
        '<div class="fila-btn"><button type="button" class="btn primario" data-act="comprobar">Comprobar la reparación</button>' +
        '<button type="button" class="btn suave" data-act="reiniciarCirc">Volver al circuito dañado</button></div>' +
        htmlVeredicto() + '<h4>Tu circuito frente a la regla</h4>' + htmlComparar(true) + htmlPistas();
    }

    /* ---------- composición ---------- */
    function etapas() {
      var nombres = det ? ['Observa el fallo', 'Diagnostica', 'Repara'] : ['Entiende', 'Predice', 'Arma el circuito'];
      var hechas = det ? [S.casoElegido, S.diagOk, S.resuelto] : [S.etapa > 1 || S.predOk, S.predOk, S.resuelto];
      return '<div class="etapas" role="group" aria-label="Pasos del ejercicio">' + nombres.map(function (n, i) {
        return '<button type="button" class="etapa' + (hechas[i] ? ' hecha' : '') + '" data-act="etapa" data-n="' + (i + 1) + '"' + (S.etapa === i + 1 ? ' aria-current="step"' : '') + '><span class="c">' + (hechas[i] ? '✔' : i + 1) + '</span>' + n + '</button>';
      }).join('') + '</div>';
    }

    function render() {
      var activo = document.activeElement;
      if (activo && host.contains(activo) && activo.getAttribute('data-act')) ultimaClave = claveDe(activo); else ultimaClave = null;
      var cuerpo = det ? [etapaDet1, etapaDet2, etapaDet3][S.etapa - 1]() : [etapaArmar1, etapaArmar2, etapaArmar3][S.etapa - 1]();
      host.setAttribute('data-estado-pred', S.predOk ? 'ok' : 'no');
      host.setAttribute('data-estado-circ', S.resuelto ? 'ok' : 'no');
      host.setAttribute('data-etapa', S.etapa);
      host.innerHTML = '<div class="ejercicio"><p class="situacion">' + esc(spec.situacion) + '</p>' + etapas() + '<div class="etapa-cuerpo">' + cuerpo + '</div></div>';
      UI.mates(host);
      if (ultimaClave) {
        var el = UI.$$('[data-act]', host).filter(function (b) { return claveDe(b) === ultimaClave; })[0];
        if (el && !el.disabled) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
      }
      if (alCambiar) alCambiar();
      guardar();
    }
    function claveDe(b) { return ['act', 'i', 'r', 'v', 'g', 'n'].map(function (a) { return b.getAttribute('data-' + a); }).join('|'); }

    function textoDiagOk(t) { return '<b>✔ Correcto.</b> ' + esc(D.TIPOS_ERROR[t].porque) + ' Ahora repáralo cambiando solo la pieza que falla.'; }

    /* ---------- guardado y recuperación (la guía publicada guarda el avance en el navegador) ---------- */
    function snapshot() {
      return { v: 1, etapa: S.etapa, env: S.env.slice(), pred: S.pred.slice(), predEst: S.predEst ? S.predEst.slice() : null, predOk: S.predOk,
        circ: M.copiar(S.circ), revisado: S.revisado, intentos: S.intentos, pistas: S.pistas, ayuda: S.ayuda, resuelto: S.resuelto,
        casoElegido: S.casoElegido, diag: S.diag, diagOk: S.diagOk, explicacion: S.explicacion };
    }
    function restaurar(x) {
      if (!x || x.v !== 1 || !Array.isArray(x.pred) || x.pred.length !== 8 || !x.circ || !Array.isArray(x.circ.neg) || x.circ.neg.length !== 3) return;
      var op = function (g) { return g === 'AND' || g === 'OR' ? g : null; };
      S.etapa = x.etapa >= 1 && x.etapa <= 3 ? x.etapa | 0 : 1;
      S.env = [0, 1, 2].map(function (i) { return x.env && x.env[i] ? 1 : 0; });
      S.pred = x.pred.map(function (n) { return n === 0 || n === 1 ? n : null; });
      S.predEst = Array.isArray(x.predEst) && x.predEst.length === 8 ? x.predEst.map(function (e) { return e === 'ok' || e === 'mal' ? e : null; }) : null;
      S.predOk = !!x.predOk;
      S.circ = { neg: x.circ.neg.map(function (n) { return n ? 1 : 0; }), grupo: x.circ.grupo ? 1 : 0, g1: op(x.circ.g1), g2: op(x.circ.g2) };
      S.revisado = !!x.revisado; S.intentos = x.intentos | 0; S.pistas = Math.max(0, Math.min(3, x.pistas | 0)); S.ayuda = !!x.ayuda; S.resuelto = !!x.resuelto;
      S.casoElegido = !!x.casoElegido; S.diag = typeof x.diag === 'string' && D.TIPOS_ERROR[x.diag] ? x.diag : null; S.diagOk = !!x.diagOk;
      S.explicacion = typeof x.explicacion === 'string' ? x.explicacion.slice(0, 600) : '';
      if (S.diagOk && S.diag) S.fbDiag = textoDiagOk(S.diag);
      if (S.resuelto && !M.faltantes(S.circ).length && !M.filasFallidas(spec, S.circ).length) {
        S.veredicto = { estado: 'ok', titulo: '✔ ¡Funciona en las 8 combinaciones!' + (S.ayuda ? ' (resuelto con ayuda)' : ''), formula: M.formulaTex(spec, S.circ), cuerpo: spec.porQue };
      } else S.resuelto = false;
    }
    function guardar() { if (opts.alGuardar) opts.alGuardar(snapshot(), S); }

    /* Si el circuito cambia después de comprobarlo, el resultado anterior ya no vale. */
    function invalidar() { if (S.resuelto) { S.resuelto = false; S.veredicto = null; } }

    /* ---------- acciones ---------- */
    var acc = {
      etapa: function (b) { S.etapa = +b.getAttribute('data-n'); },
      sensor: function (b) { S.tocado = true; var i = +b.getAttribute('data-i'); S.env[i] = S.env[i] ? 0 : 1; },
      pred: function (b) {
        var r = +b.getAttribute('data-r'); S.pred[r] = +b.getAttribute('data-v');
        if (S.predEst && S.predEst[r] === 'mal') S.predEst[r] = null;
        S.predOk = false;
      },
      predcheck: function () {
        var filas = M.filas(3);
        S.predEst = filas.map(function (v, r) { return S.pred[r] === M.requerido(spec, v) ? 'ok' : 'mal'; });
        S.predOk = S.predEst.every(function (e) { return e === 'ok'; });
        if (S.predOk) UI.marcar(clave, 'pred');
      },
      not: function (b) { if (S.etapa !== 3) return; invalidar(); var i = +b.getAttribute('data-i'); S.circ.neg[i] = S.circ.neg[i] ? 0 : 1; },
      gate: function (b) { if (S.etapa !== 3) return; invalidar(); S.circ['g' + b.getAttribute('data-g')] = b.getAttribute('data-v'); },
      grupo: function (b) { if (S.etapa !== 3) return; invalidar(); S.circ.grupo = +b.getAttribute('data-v'); },
      comprobar: function () { comprobarCircuito(); },
      reiniciarCirc: function () {
        S.circ = det ? M.copiar(spec.defecto.estado) : { neg: [0, 0, 0], grupo: spec.solucion.grupo, g1: null, g2: null };
        S.veredicto = null; S.revisado = false; S.intentos = 0; S.resuelto = false;
      },
      pista: function () { S.pistas = Math.min(3, S.pistas + 1); },
      solucion: function () { S.circ = M.copiar(spec.solucion); S.ayuda = true; S.veredicto = null; S.resuelto = false; },
      fila: function (b) {
        var r = +b.getAttribute('data-r'), v = M.filas(3)[r];
        S.env = v.slice();
        if (M.evaluar(S.circ, v).out !== M.requerido(spec, v)) S.casoElegido = true;
      },
      diag: function (b) {
        var t = b.getAttribute('data-v'); S.diag = t;
        if (t === spec.defecto.tipo) {
          S.diagOk = true;
          S.fbDiag = textoDiagOk(t);
        } else {
          S.diagOk = false;
          S.fbDiag = '<b>✘ No parece ser eso.</b> «' + esc(D.TIPOS_ERROR[t].etiqueta) + '» significa: ' + esc(D.TIPOS_ERROR[t].detalle.toLowerCase()) + ' Compara con las filas rojas y con el síntoma, y prueba otra opción.';
        }
      }
    };
    host.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-act]');
      if (!b || !host.contains(b) || b.disabled) return;
      var f = acc[b.getAttribute('data-act')];
      if (f) { f(b); render(); }
    });

    host.addEventListener('input', function (ev) {
      var t = ev.target;
      if (t && t.hasAttribute && t.hasAttribute('data-expl')) { S.explicacion = t.value.slice(0, 600); guardar(); }
    });

    restaurar(opts.inicial);
    render();
    return { host: host, S: S, spec: spec, modo: modo, render: render, snapshot: snapshot };
  }

  raiz.Ejercicio = Ejercicio;
})(window);
