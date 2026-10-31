/* Copia de la página para usarla sin conexión.
   La página está repartida en archivos (estilos y scripts). Para que el estudiante se lleve UN solo
   .html, se lee el index.html tal como lo sirve el servidor y se reemplaza cada hoja de estilos enlazada
   y cada script externo por su contenido. Solo funciona desde una dirección http(s): un archivo abierto
   con file:// no puede leerse a sí mismo. Por eso la copia descargada (que ya trae todo dentro) no
   vuelve a ofrecer descargarse: el archivo que tiene el estudiante ya es la copia. */
(function (raiz) {
  'use strict';

  // En una copia autónoma no queda ningún archivo externo que incrustar.
  var AUTONOMA = !document.querySelector('link[rel="stylesheet"][href], script[src]');

  function texto(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' en ' + url);
      return r.text();
    });
  }

  // Devuelve el HTML con cada hoja de estilos y cada script externo incrustados en su mismo lugar.
  function juntar(html, base) {
    var re = /<link\b[^>]*\brel=["']stylesheet["'][^>]*>|<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>\s*<\/script>/gi;
    var piezas = [], cursor = 0, m;
    while ((m = re.exec(html))) {
      var ref = /(?:href|src)=["']([^"']+)["']/i.exec(m[0])[1];
      piezas.push(html.slice(cursor, m.index));
      piezas.push({ css: /^<link/i.test(m[0]), url: new URL(ref, base).href });
      cursor = m.index + m[0].length;
    }
    piezas.push(html.slice(cursor));
    return Promise.all(piezas.map(function (p) {
      if (typeof p === 'string') return p;
      return texto(p.url).then(function (t) {
        // un «</script» dentro de una cadena de texto debe escribirse «<\/script» para no cerrar el bloque
        return p.css ? '<style>' + t + '</style>' : '<script>' + t.replace(/<\/script/gi, '<\\/script') + '</script>';
      });
    })).then(function (a) { return a.join(''); });
  }

  function descargar(nombre) {
    if (AUTONOMA) {
      return Promise.reject(new Error('Esta página ya es la copia para usar sin conexión. Comparte el archivo tal como lo descargaste.'));
    }
    var base = location.href.split('#')[0];
    return texto(base).then(function (html) { return juntar(html, base); }).then(function (html) {
      var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }, function () {
      throw new Error('No se pudo preparar la copia. Abre la página desde su dirección publicada y vuelve a intentarlo.');
    });
  }

  raiz.CopiaPagina = { descargar: descargar, juntar: juntar, autonoma: AUTONOMA };
}(window));
