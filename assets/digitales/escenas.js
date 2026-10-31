/* Escenas animadas: una por ejemplo. Cada función recibe los valores de los sensores
   v = [entrada1, entrada2, entrada3] y `on` (el actuador está encendido) y devuelve el
   contenido de un SVG de 300 × 190. Las animaciones se activan con la clase .on del SVG
   y están definidas en estilos.css. */
(function (raiz) {
  'use strict';

  function E(x, y, tam, emoji, extra) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + tam + '" text-anchor="middle"' + (extra || '') + '>' + emoji + '</text>';
  }
  function T(x, y, txt, cls) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" class="' + (cls || 'esc-rotulo') + '">' + txt + '</text>';
  }
  function giro(x, y, tam, emoji) {
    return '<g class="gira" style="transform-origin:' + x + 'px ' + (y - tam * 0.35) + 'px">' + E(x, y, tam, emoji) + '</g>';
  }

  var ESCENAS = {
    /* 1 · Tanque: nivel según sensores; la bomba hace circular el agua cuando está encendida. */
    tanque: function (v) {
      var A = v[0], B = v[1], P = v[2];
      var inc = A && B, nivel = inc ? 0.55 : A ? 0.92 : B ? 0.15 : 0.55, h = Math.round(100 * nivel);
      return '<rect x="24" y="30" width="96" height="110" rx="6" class="esc-pared"/>' +
        '<rect x="27" y="' + (137 - h) + '" width="90" height="' + h + '" rx="3" class="esc-agua"/>' +
        T(72, 22, 'Tanque') +
        (A ? T(72, 48, 'LLENO', 'esc-aviso') : '') + (B ? T(72, 132, 'BAJO', 'esc-aviso') : '') +
        (inc ? E(72, 90, 30, '⚠️') : '') +
        '<path d="M205 140 H160 V52 H120" class="esc-tubo"/><path d="M205 140 H160 V52 H120" class="esc-flujo solo-on"/>' +
        '<circle cx="220" cy="140" r="25" class="esc-motor"/>' + giro(220, 150, 26, '⚙️') + T(220, 182, 'Bomba') +
        E(262, 40, 24, '🔑', ' opacity="' + (P ? 1 : 0.2) + '"') + T(262, 58, 'permiso');
    },

    /* 2 · Garaje: cielo de día o de noche, vehículo y puerta que sube. */
    garaje: function (v) {
      var S = v[0], D = v[1], P = v[2];
      return '<rect x="0" y="0" width="300" height="190" class="' + (D ? 'esc-dia' : 'esc-noche') + '"/>' +
        E(255, 40, 30, D ? '☀️' : '🌙') +
        '<rect x="50" y="55" width="150" height="110" class="esc-pared"/><rect x="50" y="48" width="150" height="14" class="esc-techo"/>' +
        '<rect x="70" y="72" width="110" height="93" class="esc-interior"/>' +
        '<rect x="70" y="72" width="110" height="93" class="esc-puerta puerta"/>' +
        '<g class="esc-rayas puerta"><path d="M70 92H180M70 112H180M70 132H180M70 152H180"/></g>' +
        (S ? E(235, 160, 34, '🚗') : '') + T(125, 182, 'Garaje') +
        E(30, 38, 24, '🔑', ' opacity="' + (P ? 1 : 0.2) + '"') + T(30, 56, 'permiso');
    },

    /* 3 · Prensa: baja solo si se activa; la barrera muestra una mano si está interrumpida. */
    prensa: function (v) {
      var B1 = v[0], B2 = v[1], S = v[2];
      return '<rect x="40" y="158" width="220" height="12" class="esc-mesa"/>' +
        '<rect x="125" y="140" width="50" height="18" rx="3" class="esc-pieza"/>' +
        '<g class="piston"><rect x="140" y="30" width="20" height="62" class="esc-vastago"/><rect x="118" y="92" width="64" height="16" rx="3" class="esc-placa"/></g>' +
        '<line x1="70" y1="124" x2="230" y2="124" class="' + (S ? 'esc-haz mal' : 'esc-haz') + '"/>' +
        (S ? E(150, 132, 30, '✋') : '') + T(150, 116, 'barrera', 'esc-rotulo') +
        '<circle cx="45" cy="130" r="18" class="' + (B1 ? 'esc-boton si' : 'esc-boton') + '"/>' + E(45, 138, 22, '🖐️', ' opacity="' + (B1 ? 1 : 0.35) + '"') +
        '<circle cx="255" cy="130" r="18" class="' + (B2 ? 'esc-boton si' : 'esc-boton') + '"/>' + E(255, 138, 22, '🖐️', ' opacity="' + (B2 ? 1 : 0.35) + '"') +
        T(45, 168, 'izq.') + T(255, 168, 'der.') + T(150, 186, 'Prensa');
    },

    /* 4 · Extractor: ducto que se calienta, flujo del ventilador principal y purga. */
    extractor: function (v) {
      var Tm = v[0], F = v[1], P = v[2];
      return '<rect x="0" y="0" width="300" height="190" class="' + (Tm ? 'esc-calido' : 'esc-frio') + '"/>' +
        '<rect x="30" y="70" width="240" height="60" rx="8" class="esc-ducto"/>' +
        E(70, 110, 30, '🌬️', ' opacity="' + (F ? 1 : 0.2) + '"') + T(70, 140, F ? 'flujo normal' : 'sin flujo') +
        '<g class="solo-on">' + E(215, 112, 22, '➡️') + '</g>' +
        giro(165, 117, 44, '🌀') + T(165, 152, 'extractor') +
        E(35, 40, 30, '🌡️', ' opacity="' + (Tm ? 1 : 0.3) + '"') + T(35, 58, Tm ? 'calor' : 'normal') +
        E(260, 40, 26, '🧹', ' opacity="' + (P ? 1 : 0.2) + '"') + T(260, 58, 'purga');
    },

    /* 5 · Pasillo: oscuro o iluminado, persona y pulsador. */
    pasillo: function (v, on) {
      var Pe = v[0], L = v[1], Pu = v[2];
      return '<rect x="0" y="0" width="300" height="190" class="' + (on ? 'esc-sala-luz' : L ? 'esc-sala-dia' : 'esc-sala-noche') + '"/>' +
        '<rect x="0" y="150" width="300" height="40" class="esc-piso"/>' +
        '<rect x="22" y="28" width="56" height="62" rx="4" class="' + (L ? 'esc-ventana dia' : 'esc-ventana') + '"/>' + E(50, 68, 30, L ? '☀️' : '🌙') + T(50, 106, L ? 'luz natural' : 'oscuro') +
        '<circle cx="165" cy="48" r="38" class="glow esc-halo"/>' + E(165, 62, 40, '💡', ' opacity="' + (on ? 1 : 0.45) + '"') +
        (Pe ? E(135, 150, 44, '🚶') : '') +
        '<rect x="232" y="95" width="30" height="30" rx="6" class="' + (Pu ? 'esc-boton si' : 'esc-boton') + '"/>' + E(247, 116, 22, '🔘') + T(247, 140, 'pulsador');
    },

    /* 6 · Calentador: agua fría o tibia, sol, horario y resistencia. */
    calentador: function (v) {
      var Fr = v[0], S = v[1], H = v[2];
      return '<rect x="95" y="34" width="90" height="116" rx="12" class="esc-pared"/>' +
        '<rect x="99" y="38" width="82" height="108" rx="9" class="' + (Fr ? 'esc-agua-fria' : 'esc-agua-tibia') + '"/>' +
        T(140, 22, Fr ? 'agua fría' : 'agua tibia') +
        '<g class="solo-on">' + E(140, 135, 30, '🔥') + E(122, 70, 20, '♨️') + E(160, 85, 20, '♨️') + '</g>' +
        '<rect x="115" y="128" width="50" height="8" rx="3" class="esc-resistencia"/>' + T(140, 170, 'resistencia') +
        E(245, 55, 38, '☀️', ' opacity="' + (S ? 1 : 0.2) + '"') + T(245, 74, S ? 'hay sol' : 'sin sol') +
        E(40, 55, 30, '🕒', ' opacity="' + (H ? 1 : 0.25) + '"') + T(40, 74, 'horario') + T(40, 86, 'económico');
    },

    /* 7 · Cortacésped: zona, lluvia, horario y robot que corta. */
    cortacesped: function (v) {
      var B = v[0], L = v[1], H = v[2];
      return '<rect x="0" y="0" width="300" height="190" class="' + (L ? 'esc-jardin-lluvia' : 'esc-jardin') + '"/>' +
        '<rect x="45" y="75" width="210" height="90" rx="6" class="esc-zona"/>' + T(150, 92, 'zona del robot') +
        '<g class="solo-on esc-cortando">' + E(120, 150, 14, '🌿') + E(180, 150, 14, '🌿') + '</g>' +
        '<g class="robot">' + E(B ? 150 : 275, B ? 145 : 150, 40, '🤖') + '</g>' + (B ? '' : T(275, 168, 'fuera')) +
        (L ? '<g class="lluvia">' + E(90, 40, 28, '🌧️') + E(150, 34, 28, '🌧️') + E(210, 40, 28, '🌧️') + '</g>' : '') +
        E(30, 40, 26, '🕒', ' opacity="' + (H ? 1 : 0.25) + '"') + T(30, 58, 'horario');
    },

    /* 8 · Invernadero: calor, humedad, ciclo programado y ventilador. */
    invernadero: function (v) {
      var Te = v[0], Hu = v[1], Ci = v[2];
      return '<rect x="0" y="0" width="300" height="190" class="' + (Te ? 'esc-calido' : 'esc-frio') + '"/>' +
        '<path d="M50 160 V80 L150 30 L250 80 V160 Z" class="esc-vidrio"/>' +
        E(95, 150, 30, '🌱') + E(150, 150, 30, '🌱') + E(205, 150, 30, '🌱') +
        (Hu ? E(100, 100, 24, '💧') + E(140, 82, 24, '💧') : '') +
        giro(210, 108, 36, '🌀') + T(210, 124, 'ventilador') +
        E(26, 40, 28, '🌡️', ' opacity="' + (Te ? 1 : 0.3) + '"') + T(26, 56, Te ? 'calor' : 'normal') +
        E(272, 40, 26, '🕒', ' opacity="' + (Ci ? 1 : 0.25) + '"') + T(272, 58, 'ciclo');
    },

    /* 9 · Cinta: la banda avanza, las cajas se mueven; un atasco la bloquea. */
    cinta: function (v) {
      var C = v[0], O = v[1], M = v[2];
      return '<rect x="25" y="118" width="250" height="20" rx="10" class="esc-banda"/>' +
        '<line x1="38" y1="128" x2="262" y2="128" class="esc-banda-linea belt-line"/>' +
        '<circle cx="38" cy="128" r="12" class="esc-rodillo"/><circle cx="262" cy="128" r="12" class="esc-rodillo"/>' +
        (C ? '<g class="caja">' + E(60, 112, 36, '📦') + '</g>' : T(60, 108, 'sin caja')) +
        (O ? E(185, 112, 40, '🚧') : '') + (O ? T(185, 96, 'ATASCO', 'esc-aviso') : '') +
        '<circle cx="262" cy="60" r="22" class="' + (M ? 'esc-boton si' : 'esc-boton') + '"/>' + E(262, 68, 24, '⚙️', ' opacity="' + (M ? 1 : 0.3) + '"') + T(250, 100, 'motor') + T(250, 111, 'posterior') +
        T(150, 170, 'Cinta alimentadora');
    },

    /* 10 · Cloro: tubería con agua, nivel de cloro y bomba dosificadora. */
    cloro: function (v) {
      var F = v[0], Cl = v[1], Pe = v[2];
      return '<rect x="15" y="118" width="270" height="26" rx="6" class="esc-tuberia"/>' +
        (F ? '<line x1="25" y1="131" x2="275" y2="131" class="esc-flujo-agua belt-line"/>' : '') +
        T(150, 164, F ? 'el agua circula' : 'no circula agua') +
        '<rect x="115" y="22" width="70" height="52" rx="8" class="esc-pared"/>' +
        '<rect x="119" y="' + (Cl ? 34 : 56) + '" width="62" height="' + (Cl ? 36 : 14) + '" rx="5" class="esc-cloro"/>' + T(150, 16, Cl ? 'cloro suficiente' : 'cloro bajo') +
        '<path d="M150 74 V118" class="esc-tubo"/>' +
        '<g class="solo-on gotas">' + E(150, 96, 16, '💧') + E(150, 112, 16, '💧') + '</g>' +
        E(40, 60, 26, '🕒', ' opacity="' + (Pe ? 1 : 0.25) + '"') + T(40, 78, 'periodo') + T(40, 90, 'dosificación');
    },

    /* 11 · Bomba de reserva: la principal falla, la auxiliar entra si hay reserva y permiso. */
    bomba: function (v) {
      var F = v[0], R = v[1], P = v[2];
      return '<rect x="14" y="52" width="82" height="58" rx="8" class="esc-pared"/>' + T(55, 44, 'Principal') +
        (F ? E(55, 92, 30, '❌') : E(55, 92, 28, '✅')) + T(55, 128, F ? 'falló' : 'funciona') +
        '<rect x="110" y="30" width="62" height="52" rx="8" class="esc-pared"/>' + T(141, 22, R ? 'reserva' : 'sin reserva') +
        '<rect x="114" y="' + (R ? 40 : 66) + '" width="54" height="' + (R ? 38 : 12) + '" rx="5" class="esc-agua"/>' +
        '<path d="M141 82 V140 H206" class="esc-tubo"/><path d="M141 82 V140 H206" class="esc-flujo solo-on"/>' +
        '<circle cx="230" cy="140" r="25" class="esc-motor"/>' + giro(230, 150, 26, '⚙️') + T(230, 182, 'Auxiliar') +
        E(268, 52, 24, '🔑', ' opacity="' + (P ? 1 : 0.2) + '"') + T(268, 70, 'permiso');
    }
  };

  /* Escena neutra (sin salida conocida): se muestra con el actuador en reposo. */
  function dibujar(id, v, on) {
    var f = ESCENAS[id];
    return '<svg viewBox="0 0 300 190" class="escena-svg' + (on ? ' on' : '') + '" role="img" aria-label="Escena del problema">' + f(v, on) + '</svg>';
  }

  var Escenas = { ESCENAS: ESCENAS, dibujar: dibujar };
  if (typeof module !== 'undefined' && module.exports) module.exports = Escenas;
  else raiz.Escenas = Escenas;
})(typeof window !== 'undefined' ? window : globalThis);
