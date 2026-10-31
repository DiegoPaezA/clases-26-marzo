/* content.js: contenido de las Guías 2, 3 y 4 (Programación 1, 10 ELE, Periodo 4) como datos. */
(function (root) {
'use strict';

/* ---------- constructores ---------- */
const P = html => ({ t: 'p', html });
const H = text => ({ t: 'h', text });
const NOTE = (html, k) => ({ t: 'note', html, k: k || 'info' });
const UL = items => ({ t: 'ul', items });
const CODE = (id, o) => Object.assign({ t: 'code', id }, o);
const FREE = (id, label, o) => Object.assign({ t: 'free', id, label }, o);
const CHK = (id, title, items) => ({ t: 'chk', id, title, items });
// Tabla "Dato / Tu respuesta" con columnas opcionales de observación y comparación.
// rows: [{ q, area?, ph?, obs?, cmp?, opt? }]
function ANS(id, rows, o) {
  o = o || {};
  const hasObs = rows.some(r => r.obs);
  const head = [o.col1 || 'Dato', o.col2 || 'Tu respuesta'];
  if (hasObs) head.push(o.col3 || 'Observado');
  return {
    t: 'tbl', id, head,
    rows: rows.map((r, i) => {
      const fid = id + '.' + (i + 1);
      const cells = [r.q, { f: fid, type: r.type || 'area', ph: r.ph, label: r.label || r.q.replace(/<[^>]+>/g, ''), opt: r.opt }];
      if (hasObs) {
        if (r.obs) {
          const oc = { obs: Object.assign({}, r.obs), id: fid + '~o', label: 'Observado: ' + (r.label || r.q.replace(/<[^>]+>/g, '')) };
          if (r.cmp) oc.cmpWith = fid;
          if (r.cmpRef) oc.cmpWith = r.cmpRef;
          cells.push(oc);
        } else cells.push('');
      }
      return { cells };
    }),
  };
}
const EVAL = rows => ({ t: 'rubric', rows });

/* ---------- biblioteca por defecto ---------- */
const DEFAULT_DEC = `string decidirEstado(int lectura, int umbral) {
  // EJEMPLO: reemplaza esta función por la de tu proyecto (Guía 1)
  if (lectura < umbral) {
    return "ENCENDIDO";
  }
  return "APAGADO";
}`;

/* ---------- códigos base ---------- */
const C_G2_F1 = `#include <fstream>
#include <iostream>
using namespace std;

int main() {
  ofstream archivo("datos.txt");
  archivo << "Lectura de prueba" << endl;
  archivo << 350 << endl;
  archivo.close();
  return 0;
}`;

const C_G2_APP = `ofstream archivo("datos.txt", ios::app);
archivo << "Nueva lectura: " << 512 << endl;
archivo.close();`;

const C_G2_OPEN = `ofstream archivo("datos.txt", ios::app);
if (archivo.is_open()) {
  archivo << "Nueva lectura" << endl;
  archivo.close();
} else {
  cout << "No fue posible abrir el archivo" << endl;
}`;

const C_G2_READ = `ifstream archivo("datos.txt");
string linea;
int cantidad = 0;
while (getline(archivo, linea)) {
  cout << linea << endl;
  cantidad++;
}
archivo.close();
cout << "Total de lineas: " << cantidad << endl;`;

const C_G2_F3 = `#include <fstream>
#include <iostream>
#include <cstdlib>
#include <ctime>
using namespace std;

int leerSensorSimulado() {
  return rand() % 1024;
}

// Agrega aquí tu función decidirEstado() de la Guía 1.

void guardarEnLog(int numeroLectura, int valor, string estado) {
  ofstream log("registro.txt", ios::app);
  if (log.is_open()) {
    log << numeroLectura << "," << valor << "," << estado << endl;
    log.close();
  } else {
    cout << "Error al abrir registro.txt" << endl;
  }
}

int main() {
  srand(time(0));
  for (int i = 1; i <= 10; i++) {
    int valor = leerSensorSimulado();
    string estado = "TODO"; // reemplaza con decidirEstado(...)
    guardarEnLog(i, valor, estado);
  }
  return 0;
}`;

const C_G2_F4 = `#include <fstream>
#include <iostream>
#include <cstdlib>
#include <ctime>
using namespace std;

int leerSensorSimulado() {
  return rand() % 1024;
}

// Agrega aquí tu función decidirEstado() de la Guía 1.

void guardarEnLog(int numeroLectura, int valor, string estado) {
  ofstream log("registro.txt", ios::app);
  if (log.is_open()) {
    log << numeroLectura << "," << valor << "," << estado << endl;
    log.close();
  } else {
    cout << "Error al abrir registro.txt" << endl;
  }
}

int contarRegistros() {
  ifstream archivo("registro.txt");
  string linea;
  int contador = 0;
  while (getline(archivo, linea)) {
    contador++;
  }
  archivo.close();
  return contador;
}

int main() {
  srand(time(0));
  for (int i = 1; i <= 10; i++) {
    int valor = leerSensorSimulado();
    string estado = "TODO"; // reemplaza con decidirEstado(...)
    guardarEnLog(i, valor, estado);
  }
  // RETO: integra contarRegistros() aquí y muestra el total en pantalla.
  return 0;
}`;

const C_G3_F1 = `#include <iostream>
using namespace std;

int main() {
  int contador = 0;
  int intervalo = 4;

  for (int i = 1; i <= 12; i++) {
    contador++;
    cout << "Vuelta " << i << ": el programa sigue activo" << endl;

    if (contador >= intervalo) {
      cout << " -> Revisar sensor" << endl;
      contador = 0;
    }
  }
  return 0;
}`;

const C_G3_F2 = `int contadorSensor = 0;
int contadorEstado = 0;
int intervaloSensor = 5;
int intervaloEstado = 2;

for (int i = 1; i <= 10; i++) {
  contadorSensor++;
  contadorEstado++;

  if (contadorEstado >= intervaloEstado) {
    cout << "Actualizando indicador en vuelta " << i << endl;
    contadorEstado = 0;
  }
  if (contadorSensor >= intervaloSensor) {
    cout << "Leyendo sensor en vuelta " << i << endl;
    contadorSensor = 0;
  }
}`;

const C_G3_F3 = `#include <fstream>
#include <iostream>
#include <cstdlib>
#include <ctime>
using namespace std;

int leerSensorSimulado() {
  return rand() % 1024;
}

// Agrega aquí decidirEstado() de la Guía 1.

// Agrega aquí guardarEnLog() de la Guía 2.

int main() {
  srand(time(0));
  int contador = 0;
  int intervalo = 5; // ajusta según tu proyecto
  int numeroLectura = 0;

  for (int i = 1; i <= 50; i++) {
    contador++;
    // El resto del programa podría ejecutar otras tareas aquí.

    if (contador >= intervalo) {
      numeroLectura++;
      int valor = leerSensorSimulado();
      string estado = "TODO"; // reemplaza con decidirEstado(...)
      // Llama aquí a guardarEnLog(numeroLectura, valor, estado);
      contador = 0;
    }
  }
  return 0;
}`;

const C_G3_F4 = `#include <fstream>
#include <iostream>
#include <cstdlib>
#include <ctime>
using namespace std;

int leerSensorSimulado() {
  return rand() % 1024;
}

// Agrega aquí decidirEstado() de la Guía 1.

// Agrega aquí guardarEnLog() de la Guía 2.

int main() {
  srand(time(0));
  int contador = 0;
  int intervalo = 5;      // intervalo de la lectura del sensor
  int numeroLectura = 0;

  // RETO: agrega aquí un segundo contador (y su intervalo) para una tarea
  // que solo muestre "Sistema activo", sin escribir en el archivo.

  for (int i = 1; i <= 50; i++) {
    contador++;

    if (contador >= intervalo) {
      numeroLectura++;
      int valor = leerSensorSimulado();
      string estado = "TODO"; // reemplaza con decidirEstado(...)
      // Llama aquí a guardarEnLog(numeroLectura, valor, estado);
      contador = 0;
    }
  }
  return 0;
}`;

const C_G4 = `#include <fstream>
#include <iostream>
#include <cstdlib>
#include <ctime>
using namespace std;

int leerSensorSimulado() {
  return rand() % 1024;
}

// Agrega aquí decidirEstado() (Guía 1).
// Agrega aquí guardarEnLog() (Guía 2).
// Agrega aquí contarRegistros() (Guía 2).

int main() {
  srand(time(0));
  int contador = 0;
  int intervalo = /* TODO */;
  int numeroLectura = 0;

  for (int i = 1; i <= 50; i++) {
    contador++;

    if (contador >= intervalo) {
      numeroLectura++;
      int valor = leerSensorSimulado();
      string estado = decidirEstado(/* TODO */);
      guardarEnLog(/* TODO */);
      contador = 0;
    }
  }
  cout << "Registros guardados: " << contarRegistros() << endl;
  return 0;
}`;

const TOOLS_DEC = { k: 'lib', fn: 'decidirEstado', label: 'Insertar mi decidirEstado()' };
const TOOLS_LOG = { k: 'fromEd', fn: 'guardarEnLog', ed: 'g2.f3', label: 'Insertar mi guardarEnLog() (Guía 2)' };
const TOOLS_CNT = { k: 'fromEd', fn: 'contarRegistros', ed: 'g2.f4', label: 'Insertar mi contarRegistros() (Guía 2)' };

/* ---------- reportes ---------- */
const REPORTS = {
  g2c1: { guide: 'g2', title: 'Guía 2 · Archivos Externos', sub: 'Clase 1: Fases 1 y 2, Reto guiado y Actividad complementaria en casa' },
  g2c2: { guide: 'g2', title: 'Guía 2 · Archivos Externos', sub: 'Clase 2: Fases 3 y 4, y resultados esperados' },
  g3c1: { guide: 'g3', title: 'Guía 3 · Simulando Temporización', sub: 'Clase 1: Fases 1 y 2, Reto de diseño y Actividad complementaria en casa' },
  g3c2: { guide: 'g3', title: 'Guía 3 · Simulando Temporización', sub: 'Clase 2: Fases 3 y 4, y resultados esperados' },
  g4: { guide: 'g4', title: 'Guía 4 · Cierre: Banco de Pruebas de Escritorio', sub: 'Cierre de periodo: Fases 1 a 4' },
};

/* ---------- guías ---------- */
const GUIDES = [
/* =================================================================== GUÍA 2 */
{
  id: 'g2', n: 2, title: 'Archivos Externos',
  kicker: 'Guía 2 de 4 · Periodo 4 · Clases 3-4 + Casa',
  duration: '2 clases de 110 min + tarea complementaria',
  intro: 'Ya tienes funciones capaces de producir una lectura simulada y decidir un estado. El siguiente paso es conservar información de lo que ocurre. En esta guía aprenderás a crear archivos de texto, agregar datos sin borrar lo anterior y leerlos nuevamente. Después usarás esas operaciones para construir un registro (log) de tu sistema y comprobar que realmente contiene los datos esperados.',
  eval: [
    ['Cognitivo (evaluación)', 'Fases 1 y 2', 'Distingue escritura, append y lectura; explica cómo se recorre un archivo línea por línea.'],
    ['Procedimental (tarea)', 'Actividad Complementaria en Casa', 'Relaciona el registro de datos con necesidades reales de seguimiento del proyecto.'],
    ['Procedimental (otras)', 'Fases 3 y 4', 'Implementa funciones de escritura y verificación de archivos y comprueba sus resultados.'],
    ['Actitudinal', 'Fases 3 y 4', 'Prueba su programa con evidencia, identifica inconsistencias y realiza ajustes antes de entregar.'],
  ],
  classes: [
    { id: 'c1', title: 'Clase 1', rep: 'g2c1', blocks: [
      H('Fase 1 · Comprende cómo un programa escribe información en un archivo'),
      P('La librería <code>&lt;fstream&gt;</code> permite trabajar con archivos. <code>ofstream</code> abre un flujo de salida para escribir; <code>ifstream</code> abre un flujo de entrada para leer. Abrir un archivo sin <code>ios::app</code> normalmente reemplaza su contenido. Abrirlo con <code>ios::app</code> agrega información al final, lo que resulta útil cuando queremos conservar un historial.'),
      CODE('g2.f1', { title: 'Escribir en datos.txt', code: C_G2_F1, req: true }),
      P('<b>Prueba guiada:</b> ejecuta el programa, abre <code>datos.txt</code> (panel “Archivos del programa”, debajo del editor) y observa el contenido. Luego cambia 350 por otro valor y vuelve a ejecutar. ¿Qué ocurrió con el contenido anterior? Esta observación te permite distinguir entre reemplazar y acumular datos.'),
      ANS('g2.t1', [
        { q: '¿Qué líneas aparecen en <code>datos.txt</code> después de la primera ejecución?', obs: { mode: 'snap', k: 'file', file: 'datos.txt' } },
        { q: '¿Qué ocurre con el contenido anterior al ejecutar de nuevo sin <code>ios::app</code>?' },
        { q: '¿Por qué es recomendable cerrar el archivo con <code>close()</code> al terminar?' },
      ], { col3: 'Contenido real de datos.txt' }),
      H('Ejemplo sencillo · Agregar datos sin borrar el historial'),
      CODE('g2.app', { title: 'Agregar con ios::app', code: C_G2_APP, wrap: true }),
      P('Con <code>ios::app</code> cada nueva ejecución agrega una línea al final. Esto permite construir un historial de lecturas. Sin embargo, también debes comprobar que el archivo se abrió correctamente antes de escribir.'),
      CODE('g2.open', { title: 'Comprobar que el archivo se abrió', code: C_G2_OPEN, wrap: true }),
      H('Fase 2 · Lee un archivo y verifica su contenido'),
      P('Leer un archivo no significa conocer de antemano cuántas líneas tiene. Por eso se usa <code>getline()</code> dentro de un <code>while</code>: el ciclo continúa mientras pueda obtener una nueva línea. A partir de esa idea también puedes contar cuántos registros existen.'),
      CODE('g2.read', { title: 'Leer línea por línea', code: C_G2_READ, wrap: true }),
      ANS('g2.t2', [
        { q: 'Si el archivo tiene 6 líneas, ¿qué valor final tendrá <code>cantidad</code>?' },
        { q: '¿Qué instrucción hace que el programa avance línea por línea?' },
        { q: '¿Qué pasaría si el archivo no existe o no puede abrirse? ¿Cómo podrías detectarlo?' },
      ]),
      H('Reto guiado · Diseña un registro útil, no solo un archivo'),
      P('Antes de programar, define qué información debe tener cada línea del registro. Un formato consistente facilita leer los datos después. Por ejemplo: <code>numeroLectura</code>, <code>valorSensor</code>, <code>estado</code>. Puedes separarlos con coma para que cada línea conserve siempre la misma estructura.'),
      ANS('g2.t3', [
        { q: '¿Qué datos tendrá cada línea del registro de tu proyecto?' },
        { q: '¿Qué separador usarás entre los datos?', type: 'text' },
        { q: 'Escribe un ejemplo realista de una línea completa', type: 'text' },
        { q: '¿Qué dato te permitiría saber en qué orden ocurrieron las lecturas?' },
      ]),
      H('Actividad Complementaria en Casa'),
      P('Piensa en el uso real del registro de tu proyecto y responde:'),
      FREE('g2.casa.1', '1. ¿Para qué podría servir revisar el historial después de varias horas o varios días?'),
      FREE('g2.casa.2', '2. ¿Qué información sería indispensable conservar para explicar por qué el sistema tomó una decisión?'),
      FREE('g2.casa.3', '3. Si el archivo creciera demasiado, ¿qué estrategia sencilla propondrías para organizar mejor los registros?'),
    ] },
    { id: 'c2', title: 'Clase 2', rep: 'g2c2', blocks: [
      H('Fase 3 · Convierte la escritura del registro en una función'),
      P('En lugar de repetir las instrucciones de archivo dentro de <code>main()</code>, encapsula esa responsabilidad en una función. De esta forma <code>main()</code> se concentra en coordinar el sistema y <code>guardarEnLog()</code> se concentra en registrar los datos.'),
      CODE('g2.f3', { title: 'Programa con guardarEnLog()', code: C_G2_F3, req: true, tools: [TOOLS_DEC] }),
      P('<b>Primera prueba:</b> antes de ejecutar, elimina <code>registro.txt</code> si existe (botón “Borrar” del panel de archivos). Luego ejecuta una vez y verifica que haya 10 líneas. Ejecuta una segunda vez sin borrar el archivo y predice cuántas líneas habrá ahora.'),
      ANS('g2.t4', [
        { q: 'Cantidad de líneas esperada después de la primera ejecución', type: 'num', obs: { mode: 'snap', k: 'lines', file: 'registro.txt', label: 'Registrar tras la 1.ª ejecución' }, cmp: true },
        { q: 'Cantidad esperada después de la segunda ejecución con <code>ios::app</code>', type: 'num', obs: { mode: 'snap', k: 'lines', file: 'registro.txt', label: 'Registrar tras la 2.ª ejecución' }, cmp: true },
        { q: '¿El formato generado coincide con el que diseñaste? ¿Qué ajustaste?' },
        { q: '¿Qué comportamiento tendría el programa si quitaras <code>ios::app</code>?' },
      ], { col3: 'Líneas reales en registro.txt' }),
      H('Fase 4 · Reto de lógica: usa el archivo para obtener información'),
      P('Un registro es más útil cuando puedes analizarlo. El siguiente programa incluye <code>contarRegistros()</code>, que cuenta cuántas líneas contiene el archivo. Complétalo y úsalo para verificar automáticamente que tu programa produjo la cantidad de registros esperada.'),
      CODE('g2.f4', { title: 'Programa con contarRegistros()', code: C_G2_F4, req: true, tools: [TOOLS_DEC, TOOLS_LOG] }),
      P('<b>Reto:</b> integra <code>contarRegistros()</code> al final de <code>main()</code> y muestra en pantalla el total. Si terminas antes, intenta un desafío adicional: cuenta cuántas líneas contienen un estado específico. Puedes investigar la expresión <code>linea.find("ALERTA") != string::npos</code> y explicar con tus palabras qué hace antes de usarla.'),
      FREE('g2.f4.exp', 'Espacio para explicar tu solución o registrar los ajustes realizados', { rows: 5 }),
      FREE('g2.f4.extra', 'Desafío adicional (opcional): ¿qué hace <code>linea.find("ALERTA") != string::npos</code> y cómo lo usaste?', { rows: 3, opt: true }),
      CHK('g2.res', 'Resultados esperados (entregable)', [
        { id: 'g2.res.1', label: 'Pruebas de escritura, reemplazo y modo append documentadas.' },
        { id: 'g2.res.2', label: 'Diseño del formato del registro de tu proyecto.' },
        { id: 'g2.res.3', label: 'Respuestas de la Actividad Complementaria en Casa.' },
        { id: 'g2.res.4', label: 'Programa que genera registros con estructura consistente y verifica la cantidad de líneas mediante una función.' },
      ]),
    ] },
  ],
},

/* =================================================================== GUÍA 3 */
{
  id: 'g3', n: 3, title: 'Simulando Temporización',
  kicker: 'Guía 3 de 4 · Periodo 4 · Clases 5-6 + Casa',
  duration: '2 clases de 110 min + tarea complementaria',
  intro: 'Tu programa ya puede leer datos simulados, tomar decisiones y guardar un registro. Ahora necesitas controlar cuándo se ejecutan esas acciones. En un sistema real no siempre conviene leer un sensor en cada vuelta del programa. En esta guía usarás contadores para representar intervalos y comprenderás la diferencia entre detener un programa y permitir que varias tareas continúen avanzando. Esta idea prepara el paso posterior hacia <code>millis()</code> en Arduino.',
  eval: [
    ['Cognitivo (evaluación)', 'Fases 1 y 2', 'Explica el funcionamiento de contadores e intervalos y predice cuándo se ejecuta cada tarea.'],
    ['Procedimental (tarea)', 'Actividad Complementaria en Casa', 'Diferencia espera bloqueante y temporización no bloqueante en Arduino.'],
    ['Procedimental (otras)', 'Fases 3 y 4', 'Integra temporización, funciones y archivos, y coordina dos tareas con intervalos distintos.'],
    ['Actitudinal', 'Fases 2 a 4', 'Justifica decisiones de diseño, contrasta predicciones con resultados y corrige inconsistencias.'],
  ],
  classes: [
    { id: 'c1', title: 'Clase 1', rep: 'g3c1', blocks: [
      H('Fase 1 · Usa un contador como temporizador simulado'),
      P('Cada vuelta de un ciclo puede representar una unidad de tiempo simulada. Si incrementas un contador en cada vuelta y solo ejecutas una acción cuando alcanza un intervalo, puedes controlar la frecuencia de esa acción sin detener completamente el resto del programa.'),
      CODE('g3.f1', { title: 'Contador como temporizador', code: C_G3_F1, req: true }),
      P('<b>Antes de ejecutar</b>, predice en qué vueltas aparecerá el mensaje “Revisar sensor”. Después ejecuta y compara. Si <code>intervalo</code> vale 4 y el ciclo tiene 12 vueltas, deberías poder justificar el número de revisiones sin depender del computador.'),
      {
        t: 'tbl', id: 'g3.t1', head: ['Vuelta', '¿Se revisa el sensor? (predicción)', 'Justificación', 'Resultado de la ejecución'],
        rows: [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ cells: [
          String(n),
          { f: 'g3.t1.' + n + '.s', type: 'select', opts: ['Sí', 'No'], label: 'Vuelta ' + n + ': ¿se revisa el sensor?' },
          { f: 'g3.t1.' + n + '.j', type: 'text', label: 'Vuelta ' + n + ': justificación' },
          { obs: { mode: 'live', k: 'vuelta', ed: 'g3.f1', n }, id: 'g3.t1.' + n + '~o', label: 'Vuelta ' + n + ': resultado de la ejecución', cmpWith: 'g3.t1.' + n + '.s' },
        ] })),
      },
      ANS('g3.t1b', [
        { q: '¿Cuántas veces se revisa el sensor en 12 vueltas con <code>intervalo = 4</code>?', type: 'num', obs: { mode: 'live', k: 'count', ed: 'g3.f1', re: 'Revisar sensor' }, cmp: true },
        { q: '¿Qué cambia si <code>intervalo = 3</code>?' },
        { q: '¿Por qué <code>contador</code> vuelve a 0 después de ejecutar la tarea?' },
      ], { col3: 'Resultado de la ejecución' }),
      H('Fase 2 · Comprende la idea de varias tareas sin bloquear'),
      P('Un sistema embebido suele atender más de una tarea. Por ejemplo, puede revisar un sensor con cierta frecuencia y actualizar un indicador con otra. Para simularlo puedes usar dos contadores independientes. Ninguna tarea necesita detener por completo a la otra.'),
      CODE('g3.f2', { title: 'Dos contadores independientes', code: C_G3_F2, wrap: true, req: true }),
      P('<b>Reto de predicción:</b> sin ejecutar el código, identifica en qué vueltas se actualiza el indicador y en cuáles se lee el sensor. Después comprueba la predicción. La meta no es memorizar el código, sino seguir el estado de cada contador.'),
      ANS('g3.t2', [
        { q: 'Vueltas en las que se actualiza el indicador', type: 'text', obs: { mode: 'live', k: 'list', ed: 'g3.f2', re: 'Actualizando indicador en vuelta (\\d+)' }, cmp: true },
        { q: 'Vueltas en las que se lee el sensor', type: 'text', obs: { mode: 'live', k: 'list', ed: 'g3.f2', re: 'Leyendo sensor en vuelta (\\d+)' }, cmp: true },
        { q: '¿En qué vuelta ocurren las dos tareas al mismo tiempo?', type: 'text', obs: { mode: 'live', k: 'both', ed: 'g3.f2', re: 'Actualizando indicador en vuelta (\\d+)', re2: 'Leyendo sensor en vuelta (\\d+)' }, cmp: true },
        { q: '¿Qué ventaja tiene usar contadores independientes?' },
      ], { col3: 'Resultado de la ejecución' }),
      H('Reto de diseño · Elige un intervalo para tu proyecto'),
      P('Define con tu grupo una frecuencia de revisión razonable. No siempre “más rápido” es mejor: leer demasiado puede producir datos innecesarios; leer demasiado lento puede hacer que el sistema reaccione tarde.'),
      ANS('g3.t3', [
        { q: '¿Cada cuánto debería revisarse el sensor en el sistema real?' },
        { q: '¿Por qué ese intervalo tiene sentido para el fenómeno que estás observando?' },
        { q: '¿Qué riesgo existe si se revisa con demasiada frecuencia?' },
        { q: '¿Qué riesgo existe si se revisa con muy poca frecuencia?' },
      ]),
      H('Actividad Complementaria en Casa'),
      P('Investiga la diferencia entre <code>delay()</code> y <code>millis()</code> en Arduino y responde con tus propias palabras. No copies una definición sin entenderla: piensa en qué ocurre con las otras tareas del programa mientras se espera.'),
      FREE('g3.casa.1', '1. ¿Qué hace <code>delay()</code> con la ejecución del programa mientras transcurre el tiempo indicado?'),
      FREE('g3.casa.2', '2. ¿Qué información entrega <code>millis()</code> y por qué permite decidir si ya pasó un intervalo sin detener el programa?'),
      FREE('g3.casa.3', '3. Escribe un ejemplo cotidiano en el que bloquear todas las demás tareas durante una espera sería un problema.'),
    ] },
    { id: 'c2', title: 'Clase 2', rep: 'g3c2', blocks: [
      H('Fase 3 · Integra temporización, funciones y registro'),
      P('Ahora une lo desarrollado en las Guías 1 y 2. El sensor solo debe leerse cuando se cumpla el intervalo. En ese momento el programa obtiene una lectura, decide el estado y guarda el registro. En las demás vueltas el programa sigue avanzando, aunque no se registre una nueva lectura.'),
      CODE('g3.f3', { title: 'Programa integrado', code: C_G3_F3, req: true, tools: [TOOLS_DEC, TOOLS_LOG] }),
      P('Antes de ejecutar, borra <code>registro.txt</code> y calcula cuántas lecturas esperas obtener con 50 vueltas. Después comprueba el archivo de registro. Si 50 no es múltiplo exacto del intervalo, piensa qué ocurre con las vueltas que quedan al final.'),
      ANS('g3.t4', [
        { q: 'Intervalo usado en tu programa', type: 'num' },
        { q: 'Número de lecturas que predices antes de ejecutar', type: 'num' },
        { q: 'Número de líneas obtenidas realmente en el registro', type: 'num', obs: { mode: 'snap', k: 'lines', file: 'registro.txt', label: 'Tomar de registro.txt' }, cmpRef: 'g3.t4.2' },
        { q: '¿Coinciden? Si no, explica la diferencia' },
        { q: '¿Tu contador se parece más al comportamiento de <code>delay()</code> o al de <code>millis()</code>? Justifica' },
      ], { col3: 'Líneas reales en registro.txt' }),
      H('Fase 4 · Reto de lógica: dos tareas con intervalos diferentes'),
      P('Amplía tu simulación para que exista una segunda tarea que no escriba en el archivo. Por ejemplo, mostrar “Sistema activo” cada 2 o 3 vueltas mientras el sensor se revisa con otro intervalo. Debes usar contadores separados y demostrar que ambas tareas pueden coincidir en algunas vueltas sin bloquearse entre sí.'),
      CODE('g3.f4', { title: 'Dos tareas con intervalos distintos', code: C_G3_F4, req: true, tools: [TOOLS_DEC, TOOLS_LOG, { k: 'copyEd', ed: 'g3.f3', label: 'Copiar mi programa de la Fase 3' }] }),
      FREE('g3.f4.exp', 'Describe los dos intervalos elegidos, predice las coincidencias y registra el resultado', { rows: 5 }),
      CHK('g3.res', 'Resultados esperados (entregable)', [
        { id: 'g3.res.1', label: 'Predicciones y comprobaciones de los ejemplos de temporización simulada.' },
        { id: 'g3.res.2', label: 'Justificación del intervalo seleccionado para el proyecto.' },
        { id: 'g3.res.3', label: 'Respuestas de la Actividad Complementaria en Casa sobre delay() y millis().' },
        { id: 'g3.res.4', label: 'Programa integrado que registra lecturas solo al cumplirse el intervalo y reto de dos tareas con contadores independientes.' },
      ]),
    ] },
  ],
},

/* =================================================================== GUÍA 4 */
{
  id: 'g4', n: 4, title: 'Cierre: Banco de Pruebas de Escritorio',
  kicker: 'Guía 4 de 4 · Periodo 4 · Cierre de periodo',
  duration: '1 clase de 110 min (cierre de periodo)',
  intro: 'En las tres guías anteriores construiste piezas que ahora deben trabajar como un sistema: funciones propias, lectura simulada, decisión por umbral, registro en archivo y temporización. El cierre no consiste únicamente en unir código. Primero vas a probar la lógica con valores controlados; después ejecutarás la simulación completa y analizarás si el resultado coincide con lo que esperabas. Esa secuencia (probar una parte, integrar y verificar) es una práctica básica de desarrollo de software.',
  eval: [
    ['Cognitivo (evaluación)', 'Fases 1 y 2', 'Diseña casos de prueba, razona sobre condiciones de frontera e integra la lógica del sistema de forma coherente.'],
    ['Procedimental (otras)', 'Fases 2 y 3', 'Construye y verifica el banco de pruebas; contrasta predicciones con resultados y documenta el paso a Arduino.'],
    ['Actitudinal', 'Fase 4', 'Entrega evidencia completa, organizada y técnicamente verificable del trabajo realizado durante el periodo.'],
  ],
  classes: [
    { id: 'c1', title: 'Cierre de periodo', rep: 'g4', blocks: [
      H('Fase 1 · Diseña pruebas antes de ejecutar la simulación'),
      P('Los valores aleatorios son útiles para simular, pero dificultan repetir exactamente una prueba. Por eso primero debes comprobar tu función de decisión con valores conocidos. Una prueba de frontera usa valores cercanos al umbral porque allí suelen aparecer errores con operadores como <code>&lt;</code>, <code>&lt;=</code>, <code>&gt;</code> o <code>&gt;=</code>.'),
      P('Ejemplo: si la regla es “ENCENDIDO cuando lectura &lt; 400”, los valores 399, 400 y 401 permiten comprobar qué ocurre justo antes, en el límite y justo después.'),
      { t: 'g4tests', id: 'g4.t',
        ex: [[399, 'ENCENDIDO'], [400, 'APAGADO'], [401, 'APAGADO']],
        cases: ['Bajo', 'Umbral - 1', 'Umbral', 'Umbral + 1', 'Alto'] },
      H('Fase 2 · Construye el banco de pruebas completo'),
      P('Reúne las funciones de las Guías 1 a 3 y organiza <code>main()</code> para que coordine el sistema. Antes de escribir código nuevo, revisa qué responsabilidad tiene cada pieza. Una función debe hacer una tarea concreta y <code>main()</code> debe encargarse principalmente de conectarlas.'),
      {
        t: 'tbl', id: 'g4.piezas', head: ['Pieza del programa', 'Responsabilidad', '¿Lista?'],
        rows: [
          ['<code>leerSensorSimulado()</code>', 'Generar una lectura dentro del rango definido'],
          ['<code>decidirEstado()</code>', 'Aplicar la regla del umbral y devolver un estado'],
          ['<code>guardarEnLog()</code>', 'Agregar una línea al archivo sin borrar el historial'],
          ['<code>contarRegistros()</code>', 'Verificar cuántas líneas fueron guardadas'],
          ['Temporización simulada', 'Determinar cuándo se ejecuta una nueva lectura'],
        ].map((r, i) => ({ cells: [r[0], r[1], { f: 'g4.piezas.' + (i + 1), type: 'check', label: r[0].replace(/<[^>]+>/g, '') + ' lista' }] })),
      },
      P('Usa este esqueleto como guía de organización. Los TODO indican decisiones que tú debes completar con el código construido previamente; no es una solución lista para copiar. Los botones insertan tus funciones de las guías anteriores en el lugar indicado.'),
      CODE('g4.main', { title: 'Banco de pruebas completo', code: C_G4, req: true, tools: [TOOLS_DEC, TOOLS_LOG, TOOLS_CNT] }),
      P('<b>Verificación obligatoria:</b> antes de ejecutar, predice cuántos registros debería producir tu configuración. Luego borra el registro anterior, ejecuta el programa y compara la predicción con <code>contarRegistros()</code>. Si no coincide, no cambies valores al azar: revisa paso a paso el contador, el intervalo y el lugar donde se reinicia.'),
      ANS('g4.t2', [
        { q: '¿El programa compila sin errores? Si hubo errores, anota el último que corregiste', obs: { mode: 'live', k: 'compile', ed: 'g4.main' } },
        { q: 'Intervalo usado y número de registros esperados', type: 'text' },
        { q: 'Número de registros obtenidos', type: 'num', obs: { mode: 'live', k: 'num', ed: 'g4.main', re: 'Registros guardados:\\s*(\\d+)' } },
        { q: '¿Coinciden la predicción y el resultado? Explica' },
        { q: '¿Los estados observados respetan la regla del umbral en tus casos de prueba?' },
      ], { col3: 'Resultado de la ejecución' }),
      H('Reto final · Cambia una condición y predice el efecto'),
      P('Realiza un pequeño experimento controlado. Cambia solo una variable del sistema (el umbral o el intervalo) y escribe qué esperas que cambie antes de ejecutar. Después compara la predicción con el resultado. La idea es demostrar que comprendes la relación entre una decisión de programación y el comportamiento observable del sistema.'),
      ANS('g4.t3', [
        { q: 'Variable que cambiaste', type: 'text' },
        { q: 'Valor original y valor nuevo', type: 'text' },
        { q: 'Predicción antes de ejecutar' },
        { q: 'Resultado observado' },
        { q: 'Explicación de la relación entre el cambio y el resultado' },
      ]),
      H('Fase 3 · De escritorio a Arduino real: compara qué permanece y qué cambia'),
      P('La lógica validada en el computador no se traslada de forma idéntica al hardware. Algunas funciones pueden conservarse casi iguales, mientras que otras deben reemplazar la simulación por instrucciones propias de Arduino. Completa la tabla con base en lo trabajado también en Circuitos 1.'),
      {
        t: 'tbl', id: 'g4.ard', head: ['Elemento', 'En el programa de escritorio', 'En el Arduino real'],
        rows: [
          ['Lectura del sensor', '<code>rand()</code> genera un valor simulado'],
          ['Temporización', 'Contadores de iteraciones'],
          ['Registro de lecturas', 'Archivo de texto en el computador'],
          ['Decisión del estado', 'Regla de umbral ya probada'],
          ['Salida o actuador', 'Texto mostrado en pantalla'],
        ].map((r, i) => ({ cells: [r[0], r[1], { f: 'g4.ard.' + (i + 1), type: 'area', label: r[0] + ': en el Arduino real' }] })),
      },
      P('Responde también: ¿qué parte de tu programa podría conservar prácticamente la misma lógica al pasar a Arduino y cuál tendría que cambiar por depender directamente del hardware? Justifica con un ejemplo concreto.'),
      FREE('g4.ard.resp', 'Respuesta argumentada', { rows: 6 }),
      H('Fase 4 · Entrega final'),
      P('Reúne la evidencia final del periodo. Esta página genera el reporte con el código fuente, los resultados de las pruebas y tus respuestas, por lo que ya no necesitas entregar archivos adicionales. Marca cada elemento cuando lo hayas verificado:'),
      CHK('g4.res', 'Evidencia del reporte final', [
        { id: 'g4.res.1', label: 'Código fuente completo del banco de pruebas, compilando sin errores (editor de la Fase 2).' },
        { id: 'g4.res.2', label: 'Tabla de casos de frontera y resultados de las pruebas de decisión (Fase 1).' },
        { id: 'g4.res.3', label: 'Verificación del número de registros generado por la simulación (Fase 2).' },
        { id: 'g4.res.4', label: 'Experimento final con una variable modificada y análisis de su efecto (Reto final).' },
        { id: 'g4.res.5', label: 'Comparación entre el programa de escritorio y la versión en Arduino (Fase 3).' },
      ]),
      FREE('g4.obs', 'Observaciones finales del equipo (opcional)', { rows: 3, opt: true }),
    ] },
  ],
},
];

root.P1_CONTENT = { GUIDES, REPORTS, DEFAULT_DEC };
}(typeof self !== 'undefined' ? self : this));
