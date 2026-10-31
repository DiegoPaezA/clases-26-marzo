// Verificación rápida de Programación 1, sin navegador.
// Uso:  node assets/programacion/verificar.cjs
// Comprueba que el intérprete de C++ (cppjs.js) ejecuta programas y marca errores, y que el
// contenido de las guías (content.js) se carga completo. No toca la interfaz (app.js).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const CJ = require('./cppjs.js');

// content.js es un archivo de navegador que se cuelga de «self»: lo ejecutamos con un objeto vacío.
const ventana = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8'), { self: ventana }, { filename: 'content.js' });
const { GUIDES } = ventana.P1_CONTENT;

const PROGRAMA = (cuerpo) => `#include <iostream>\nusing namespace std;\nint main(){ ${cuerpo} return 0; }`;
let pruebas = 0;
const prueba = (nombre, fn) => { fn(); pruebas++; console.log('  ✔ ' + nombre); };

prueba('un ciclo escribe tres líneas', () => {
  const r = CJ.run(PROGRAMA('for (int i = 1; i <= 3; i++) cout << "vuelta " << i << endl;'), { files: {} });
  assert.deepEqual(r.compileErrors, []);
  assert.equal(r.out.map((o) => o.s).join(''), 'vuelta 1\nvuelta 2\nvuelta 3\n');
  assert.equal(r.exitCode, 0);
});

prueba('un /* TODO */ sin completar es un error de compilación en su línea', () => {
  const r = CJ.run(PROGRAMA('int x = /* TODO */; cout << x;'), { files: {} });
  assert.equal(r.compileErrors.length, 1);
  assert.equal(r.compileErrors[0].line, 3);
});

prueba('las guías 2, 3 y 4 están cargadas', () => {
  assert.equal(GUIDES.length, 3);
  GUIDES.forEach((g) => assert.ok(g.id && g.title, 'guía sin id o título'));
});

console.log(`PASS Programación 1: ${pruebas} pruebas.`);
