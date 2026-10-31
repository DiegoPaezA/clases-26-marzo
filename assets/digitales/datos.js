/* Contenido de la página de prueba de Digitales.
   Los diez ejemplos son los originales del docente (ejemplos/digitales/ejemplos_digitales.json),
   escritos en lenguaje de todos los días. La regla de cada problema está en `rutas`:
     · cada ruta es un grupo de condiciones unidas por «y» (AND);
     · si hay varias rutas, basta con que se cumpla una (OR).
   Cada condición es [entrada, valor que debe tener, texto en lenguaje natural].
   La tabla de verdad se calcula desde ahí y se contrasta con el texto original en el verificador. */
(function (raiz) {
  'use strict';

  var N = function (st) { return st; };

  var EJERCICIOS = [
    {
      id: 'tanque', orig: 1, titulo: 'Tanque de agua del colegio', escena: 'tanque',
      situacion: 'El tanque del colegio abastece los baños. Una bomba lo llena, pero solo debe trabajar cuando es seguro hacerlo.',
      actuador: { nombre: 'Bomba de agua', on: 'La bomba está ENCENDIDA y llena el tanque.', off: 'La bomba está APAGADA.' },
      entradas: [
        { k: 'A', nombre: 'Tanque lleno', icono: '📈', si: 'El tanque está lleno', no: 'El tanque no está lleno' },
        { k: 'B', nombre: 'Nivel bajo', icono: '📉', si: 'El nivel está por debajo del mínimo', no: 'El nivel no está bajo' },
        { k: 'T1', nombre: 'Permiso de llenado', icono: '🔑', si: 'El permiso de llenado está activo', no: 'No hay permiso de llenado' }
      ],
      rutas: [{ nombre: 'llenar', lits: [
        ['B', 1, 'el nivel del agua está bajo'],
        ['A', 0, 'el tanque NO está lleno'],
        ['T1', 1, 'el permiso de llenado está activo']] }],
      ecuacion: 'Y=\\overline{A}\\cdot B\\cdot T_1',
      solucion: N({ neg: [1, 0, 0], grupo: 0, g1: 'AND', g2: 'AND' }),
      ejemploDistinto: 'Una lavadora arranca si la puerta está cerrada Y hay agua Y NO hay desbordamiento: $\\text{puerta}\\cdot\\text{agua}\\cdot\\overline{\\text{desbordamiento}}$.',
      porQue: 'Las tres condiciones deben cumplirse a la vez, por eso se usan compuertas AND. «El tanque NO está lleno» se logra con un NOT sobre A. Si por una falla los sensores «lleno» y «nivel bajo» llegaran en 1 al mismo tiempo, el NOT deja $\\overline{A}=0$ y la bomba se apaga: es una medida de seguridad.',
      defecto: { tipo: 'not', estado: N({ neg: [0, 0, 0], grupo: 0, g1: 'AND', g2: 'AND' }),
        sintoma: 'La bomba casi nunca arranca: el sensor «lleno» entra al circuito sin invertir.', caso: [0, 1, 1] }
    },
    {
      id: 'garaje', orig: 2, titulo: 'Puerta del garaje escolar', escena: 'garaje',
      situacion: 'El vehículo de mantenimiento debe poder entrar al garaje. De día entra sin problema; de noche necesita un permiso especial.',
      actuador: { nombre: 'Motor de la puerta', on: 'La puerta SE ABRE.', off: 'La puerta permanece CERRADA.' },
      entradas: [
        { k: 'S', nombre: 'Vehículo presente', icono: '🚗', si: 'Hay un vehículo frente a la puerta', no: 'No hay vehículo' },
        { k: 'L', nombre: 'Es de día', icono: '☀️', si: 'Es de día', no: 'Es de noche' },
        { k: 'T1', nombre: 'Permiso nocturno', icono: '🔑', si: 'El permiso nocturno está activo', no: 'No hay permiso nocturno' }
      ],
      rutas: [
        { nombre: 'vehículo de día', lits: [['S', 1, 'hay un vehículo'], ['L', 1, 'es de día']] },
        { nombre: 'vehículo de noche con permiso', lits: [['S', 1, 'hay un vehículo'], ['L', 0, 'es de noche'], ['T1', 1, 'el permiso nocturno está activo']] }
      ],
      ecuacion: 'Y=S\\cdot L+S\\cdot\\overline{L}\\cdot T_1=S\\cdot(L+T_1)',
      solucion: N({ neg: [0, 0, 0], grupo: 1, g1: 'OR', g2: 'AND' }),
      ejemploDistinto: 'Una tienda abre su puerta si hay un cliente Y (la tienda está en horario O hay un permiso especial): $\\text{cliente}\\cdot(\\text{horario}+\\text{permiso})$.',
      claveSimplificar: 'La señal S aparece en las dos rutas: sin vehículo nunca se abre. Sácala como «factor común» y mira qué queda para combinar: ¿de día, o permiso nocturno?',
      porQue: 'Este ejercicio se puede resolver de forma simplificada. S debe estar siempre presente (es factor común de las dos rutas). Después basta con que sea de día O haya permiso nocturno. Por eso queda un OR dentro de un AND con S, y el circuito corto da lo mismo que la regla larga en las ocho filas.',
      defecto: { tipo: 'andor', estado: N({ neg: [0, 0, 0], grupo: 1, g1: 'AND', g2: 'AND' }),
        sintoma: 'De día, con un vehículo presente y sin permiso nocturno, la puerta no abre.', caso: [1, 1, 0] }
    },
    {
      id: 'prensa', orig: 3, titulo: 'Prensa con dos botones', escena: 'prensa',
      situacion: 'En el taller, una prensa solo debe bajar si el operador usa las dos manos. Así no puede tener una mano debajo.',
      actuador: { nombre: 'Prensa', on: 'La prensa BAJA.', off: 'La prensa se queda ARRIBA.' },
      entradas: [
        { k: 'B1', nombre: 'Botón izquierdo', icono: '🖐️', si: 'Botón izquierdo presionado', no: 'Botón izquierdo suelto' },
        { k: 'B2', nombre: 'Botón derecho', icono: '🖐️', si: 'Botón derecho presionado', no: 'Botón derecho suelto' },
        { k: 'S1', nombre: 'Barrera interrumpida', icono: '🚧', si: 'Hay algo en la barrera (peligro)', no: 'La barrera está libre' }
      ],
      rutas: [{ nombre: 'bajar', lits: [
        ['B1', 1, 'el botón izquierdo está presionado'],
        ['B2', 1, 'el botón derecho está presionado'],
        ['S1', 0, 'la barrera NO está interrumpida']] }],
      ecuacion: 'Y=B_1\\cdot B_2\\cdot\\overline{S_1}',
      solucion: N({ neg: [0, 0, 1], grupo: 0, g1: 'AND', g2: 'AND' }),
      ejemploDistinto: 'Un ascensor se mueve si la puerta está cerrada Y se pulsó un piso Y NO hay sobrepeso.',
      porQue: 'Con AND entre los dos botones el operador está obligado a usar las dos manos. La barrera vale 1 cuando hay peligro, así que para permitir el movimiento hay que invertirla con NOT: la prensa baja solo si la barrera NO está interrumpida.',
      defecto: { tipo: 'andor', estado: N({ neg: [0, 0, 1], grupo: 0, g1: 'OR', g2: 'AND' }),
        sintoma: 'La prensa baja con un solo botón presionado.', caso: [1, 0, 0] }
    },
    {
      id: 'extractor', orig: 4, titulo: 'Extractor de aire del taller', escena: 'extractor',
      situacion: 'Un conducto del taller tiene un extractor auxiliar. Debe ayudar cuando el aire se calienta y el ventilador principal falla, y además se enciende en cada ciclo de purga.',
      actuador: { nombre: 'Extractor auxiliar', on: 'El extractor está GIRANDO.', off: 'El extractor está DETENIDO.' },
      entradas: [
        { k: 'Tterm', nombre: 'Temperatura alta', icono: '🌡️', si: 'La temperatura está alta', no: 'La temperatura es normal' },
        { k: 'F', nombre: 'Flujo normal', icono: '🌬️', si: 'El ventilador principal sopla bien', no: 'El ventilador principal falló' },
        { k: 'T1', nombre: 'Ciclo de purga', icono: '🧹', si: 'El ciclo de purga está activo', no: 'No hay ciclo de purga' }
      ],
      rutas: [
        { nombre: 'calor sin flujo', lits: [['Tterm', 1, 'la temperatura está alta'], ['F', 0, 'NO hay flujo normal de aire']] },
        { nombre: 'purga', lits: [['T1', 1, 'el ciclo de purga está activo']] }
      ],
      ecuacion: 'Y=(T_{\\text{term}}\\cdot\\overline{F})+T_1',
      solucion: N({ neg: [0, 1, 0], grupo: 0, g1: 'AND', g2: 'OR' }),
      ejemploDistinto: 'Una alarma suena si (la puerta está abierta Y es de noche) O si alguien presiona el botón de pánico: $(\\text{puerta}\\cdot\\text{noche})+\\text{pánico}$.',
      porQue: 'Hay dos rutas para encender el extractor. La primera exige dos cosas a la vez (calor Y falta de flujo): un AND con NOT en F. La segunda, la purga, funciona por sí sola: llega directo a un OR final. Por eso la purga enciende el extractor sin importar lo demás.',
      defecto: { tipo: 'grupo', estado: N({ neg: [0, 1, 0], grupo: 1, g1: 'AND', g2: 'OR' }),
        sintoma: 'El extractor se enciende con temperatura alta aunque el ventilador principal funcione bien.', caso: [1, 1, 0] }
    },
    {
      id: 'pasillo', orig: 5, titulo: 'Luz del pasillo', escena: 'pasillo',
      situacion: 'La lámpara del pasillo debe encenderse cuando alguien camina en la oscuridad. Un pulsador de paso también puede encenderla en cualquier momento.',
      actuador: { nombre: 'Lámpara del pasillo', on: 'La lámpara está ENCENDIDA.', off: 'La lámpara está APAGADA.' },
      entradas: [
        { k: 'P', nombre: 'Persona detectada', icono: '🚶', si: 'Se detecta movimiento', no: 'No se detecta a nadie' },
        { k: 'L', nombre: 'Hay luz natural', icono: '☀️', si: 'Hay luz natural', no: 'Está oscuro' },
        { k: 'T1', nombre: 'Pulsador de paso', icono: '🔘', si: 'El pulsador está activado', no: 'El pulsador está sin activar' }
      ],
      rutas: [
        { nombre: 'alguien en la oscuridad', lits: [['P', 1, 'se detecta movimiento'], ['L', 0, 'NO hay luz natural']] },
        { nombre: 'pulsador', lits: [['T1', 1, 'el pulsador está activado']] }
      ],
      ecuacion: 'Y=(P\\cdot\\overline{L})+T_1',
      solucion: N({ neg: [0, 1, 0], grupo: 0, g1: 'AND', g2: 'OR' }),
      ejemploDistinto: 'Un portón abre si (llega un auto Y hay espacio) O si el guardia usa el control: $(\\text{auto}\\cdot\\text{espacio})+\\text{control}$.',
      porQue: 'La lámpara tiene dos formas de encender: presencia en la oscuridad (AND con la luz invertida) o el pulsador, que funciona solo. Por eso el pulsador llega directo al OR final.',
      defecto: { tipo: 'grupo', estado: N({ neg: [0, 1, 0], grupo: 1, g1: 'AND', g2: 'OR' }),
        sintoma: 'La luz se enciende cuando pasa alguien aunque haya luz natural.', caso: [1, 1, 0] }
    },
    {
      id: 'calentador', orig: 6, titulo: 'Calentador de agua con resistencia', escena: 'calentador',
      situacion: 'Un depósito se calienta con energía solar. Una resistencia eléctrica ayuda solo cuando el sol no alcanza y la tarifa de energía es económica.',
      actuador: { nombre: 'Resistencia eléctrica', on: 'La resistencia está ENCENDIDA y calienta el agua.', off: 'La resistencia está APAGADA.' },
      entradas: [
        { k: 'T', nombre: 'Agua fría', icono: '🧊', si: 'El agua está fría', no: 'El agua no está fría' },
        { k: 'S', nombre: 'Hay sol', icono: '☀️', si: 'Hay sol suficiente', no: 'No hay sol suficiente' },
        { k: 'T1', nombre: 'Horario económico', icono: '🕒', si: 'Estamos en horario económico', no: 'Fuera del horario económico' }
      ],
      rutas: [{ nombre: 'calentar', lits: [
        ['T', 1, 'el agua está fría'],
        ['S', 0, 'NO hay sol suficiente'],
        ['T1', 1, 'estamos en horario económico']] }],
      ecuacion: 'Y=T\\cdot\\overline{S}\\cdot T_1',
      solucion: N({ neg: [0, 1, 0], grupo: 0, g1: 'AND', g2: 'AND' }),
      ejemploDistinto: 'Un riego automático funciona si la tierra está seca Y NO está lloviendo Y es de mañana.',
      porQue: 'El sol ya calienta el agua gratis, por eso la resistencia solo trabaja cuando NO hay sol: S entra invertida. Las tres condiciones deben darse juntas, así que todo se une con AND.',
      defecto: { tipo: 'not', estado: N({ neg: [0, 0, 0], grupo: 0, g1: 'AND', g2: 'AND' }),
        sintoma: 'La resistencia se enciende cuando hay sol y se queda apagada cuando falta.', caso: [1, 0, 1] }
    },
    {
      id: 'cortacesped', orig: 7, titulo: 'Robot cortacésped', escena: 'cortacesped',
      situacion: 'Un robot cuida el jardín del colegio. Debe trabajar solo dentro de su zona, con tiempo seco y en el horario autorizado.',
      actuador: { nombre: 'Cuchilla y motor', on: 'El robot está CORTANDO el césped.', off: 'El robot está DETENIDO.' },
      entradas: [
        { k: 'B', nombre: 'Dentro de la zona', icono: '🏡', si: 'El robot está dentro de la zona', no: 'El robot está fuera de la zona' },
        { k: 'L', nombre: 'Lluvia', icono: '🌧️', si: 'Está lloviendo', no: 'No llueve' },
        { k: 'T1', nombre: 'Horario permitido', icono: '🕒', si: 'Estamos en horario de trabajo', no: 'Fuera del horario de trabajo' }
      ],
      rutas: [{ nombre: 'cortar', lits: [
        ['B', 1, 'el robot está dentro de la zona'],
        ['L', 0, 'NO está lloviendo'],
        ['T1', 1, 'estamos en horario de trabajo']] }],
      ecuacion: 'Y=B\\cdot\\overline{L}\\cdot T_1',
      solucion: N({ neg: [0, 1, 0], grupo: 0, g1: 'AND', g2: 'AND' }),
      ejemploDistinto: 'Un toldo se extiende si hay sol Y NO hay viento fuerte Y es horario de apertura.',
      porQue: 'La lluvia es una razón para PARAR, así que el sensor se invierte: «no llueve» = $\\overline{L}$. Las tres condiciones se exigen a la vez con AND.',
      defecto: { tipo: 'not', estado: N({ neg: [0, 0, 0], grupo: 0, g1: 'AND', g2: 'AND' }),
        sintoma: 'El robot corta bajo la lluvia y se queda quieto cuando el día está seco.', caso: [1, 1, 1] }
    },
    {
      id: 'invernadero', orig: 8, titulo: 'Ventilación del invernadero', escena: 'invernadero',
      situacion: 'Las plantas del invernadero necesitan aire fresco. El ventilador debe encender si hace calor, o si hay mucha humedad durante el ciclo programado.',
      actuador: { nombre: 'Ventilador', on: 'El ventilador está GIRANDO.', off: 'El ventilador está DETENIDO.' },
      entradas: [
        { k: 'T', nombre: 'Temperatura alta', icono: '🌡️', si: 'Hace demasiado calor', no: 'La temperatura es normal' },
        { k: 'H', nombre: 'Humedad alta', icono: '💧', si: 'La humedad está alta', no: 'La humedad es normal' },
        { k: 'T1', nombre: 'Ciclo de ventilación', icono: '🕒', si: 'El ciclo programado está activo', no: 'El ciclo programado está inactivo' }
      ],
      rutas: [
        { nombre: 'calor', lits: [['T', 1, 'hace demasiado calor']] },
        { nombre: 'humedad en el ciclo', lits: [['H', 1, 'la humedad está alta'], ['T1', 1, 'el ciclo programado está activo']] }
      ],
      ecuacion: 'Y=T+(H\\cdot T_1)',
      solucion: N({ neg: [0, 0, 0], grupo: 1, g1: 'AND', g2: 'OR' }),
      ejemploDistinto: 'Un ventilador de baño enciende si hay vapor O (hay humedad Y el temporizador está activo): $\\text{vapor}+(\\text{humedad}\\cdot\\text{temporizador})$.',
      porQue: 'Si hace demasiado calor, el ventilador debe encender sin importar nada más: por eso T llega directo al OR final. La humedad solo cuenta durante el ciclo programado: H y T1 pasan antes por un AND.',
      defecto: { tipo: 'grupo', estado: N({ neg: [0, 0, 0], grupo: 0, g1: 'AND', g2: 'OR' }),
        sintoma: 'El ventilador gira solo porque el ciclo está activo, aunque no haga calor ni haya humedad.', caso: [0, 0, 1] }
    },
    {
      id: 'cinta', orig: 9, titulo: 'Cinta para ordenar cajas', escena: 'cinta',
      situacion: 'Una cinta lleva cajas hacia otra máquina. Solo debe avanzar cuando es seguro hacerlo.',
      actuador: { nombre: 'Motor de la cinta', on: 'La cinta AVANZA.', off: 'La cinta está DETENIDA.' },
      entradas: [
        { k: 'C', nombre: 'Caja lista', icono: '📦', si: 'Hay una caja lista', no: 'No hay caja' },
        { k: 'O', nombre: 'Atasco', icono: '🚧', si: 'Hay un atasco', no: 'No hay atasco' },
        { k: 'T1', nombre: 'Motor posterior listo', icono: '⚙️', si: 'El motor posterior ya está a velocidad', no: 'El motor posterior aún no está listo' }
      ],
      rutas: [{ nombre: 'avanzar', lits: [
        ['C', 1, 'hay una caja lista'],
        ['O', 0, 'NO hay atasco'],
        ['T1', 1, 'el motor posterior está listo']] }],
      ecuacion: 'Y=C\\cdot\\overline{O}\\cdot T_1',
      solucion: N({ neg: [0, 1, 0], grupo: 0, g1: 'AND', g2: 'AND' }),
      ejemploDistinto: 'La barrera de un parqueadero sube si hay un carro Y NO hay obstáculo Y el motor está listo.',
      porQue: 'Las tres condiciones deben cumplirse a la vez (AND). El atasco es un problema: vale 1 cuando existe, así que se invierte para exigir que NO exista.',
      defecto: { tipo: 'andor', estado: N({ neg: [0, 1, 0], grupo: 0, g1: 'OR', g2: 'AND' }),
        sintoma: 'La cinta arranca aunque no haya ninguna caja lista.', caso: [0, 0, 1] }
    },
    {
      id: 'cloro', orig: 10, titulo: 'Cloro para la piscina', escena: 'cloro',
      situacion: 'Una bomba agrega cloro al agua de la piscina del colegio. Solo debe hacerlo cuando el agua circula, el cloro está bajo y es el periodo seguro de dosificación.',
      actuador: { nombre: 'Bomba dosificadora', on: 'La bomba está AGREGANDO cloro.', off: 'La bomba está APAGADA.' },
      entradas: [
        { k: 'F', nombre: 'Agua circulando', icono: '🌊', si: 'El agua circula por la tubería', no: 'No circula agua' },
        { k: 'C', nombre: 'Cloro suficiente', icono: '🧪', si: 'El nivel de cloro es adecuado', no: 'El cloro está bajo' },
        { k: 'T1', nombre: 'Periodo de dosificación', icono: '🕒', si: 'Es el periodo de dosificación', no: 'Fuera del periodo de dosificación' }
      ],
      rutas: [{ nombre: 'dosificar', lits: [
        ['F', 1, 'el agua circula por la tubería'],
        ['C', 0, 'el cloro NO es suficiente (está bajo)'],
        ['T1', 1, 'es el periodo de dosificación']] }],
      ecuacion: 'Y=F\\cdot\\overline{C}\\cdot T_1',
      solucion: N({ neg: [0, 1, 0], grupo: 0, g1: 'AND', g2: 'AND' }),
      ejemploDistinto: 'Un dispensador de jabón sale si hay una mano Y el depósito NO está vacío Y el sistema está activo.',
      porQue: 'Si la bomba dosifica sin agua circulando, el cloro se queda concentrado en un solo punto. Por eso las tres condiciones se exigen juntas. El sensor de cloro vale 1 cuando HAY suficiente, así que para detectar «cloro bajo» se invierte con NOT.',
      defecto: { tipo: 'andor', estado: N({ neg: [0, 1, 0], grupo: 0, g1: 'AND', g2: 'OR' }),
        sintoma: 'La bomba agrega cloro con solo el periodo activo, aunque el agua no circule.', caso: [0, 1, 1] }
    },
    {
      /* Ejercicio del banco de la guía 2 que no estaba entre los diez originales: simplificación por absorción. */
      id: 'bomba', orig: 11, soloArmar: true, titulo: 'Bomba de reserva', escena: 'bomba',
      situacion: 'La cisterna tiene una bomba principal y otra de reserva. La de reserva solo debe arrancar cuando la principal falla, hay reserva disponible y el operador dio permiso.',
      actuador: { nombre: 'Bomba auxiliar', on: 'La bomba auxiliar ARRANCA.', off: 'La bomba auxiliar sigue APAGADA.' },
      entradas: [
        { k: 'F', nombre: 'Falla de la principal', icono: '⚠️', si: 'La bomba principal falló', no: 'La bomba principal funciona' },
        { k: 'R', nombre: 'Reserva disponible', icono: '🛢️', si: 'Hay agua de reserva', no: 'No hay agua de reserva' },
        { k: 'T1', nombre: 'Permiso de operación', icono: '🔑', si: 'El permiso de operación está activo', no: 'No hay permiso de operación' }
      ],
      rutas: [{ nombre: 'arrancar la auxiliar', lits: [
        ['F', 1, 'la bomba principal falló'],
        ['R', 1, 'hay agua de reserva'],
        ['T1', 1, 'el permiso de operación está activo']] }],
      ecuacion: 'Y=F\\cdot R\\cdot(T_1+T_1\\cdot R)=F\\cdot R\\cdot T_1',
      solucion: N({ neg: [0, 0, 0], grupo: 0, g1: 'AND', g2: 'AND' }),
      ejemploDistinto: 'Un portón eléctrico abre si hay un control Y la batería está cargada Y el seguro está quitado.',
      claveSimplificar: 'En el enunciado original el permiso aparece dos veces: «T1» y «T1 · R». La segunda rama no agrega nada nuevo (eso se llama absorción), así que las tres condiciones se exigen juntas.',
      porQue: 'La rama T1·R ya está «absorbida» por T1: cada vez que vale 1, T1 también vale 1. Por eso la regla se reduce a tres condiciones simultáneas: falla, reserva y permiso. Tres señales que deben cumplirse a la vez se unen con AND, y no hace falta ningún NOT.'
    }
  ];

  /* Tipos de error de la guía 3 y cómo se reconocen. */
  var TIPOS_ERROR = {
    not: {
      etiqueta: 'Falta un NOT (o sobra uno)',
      detalle: 'Una condición que dice «NO…» entra sin invertir, o una que no lo necesita está invertida.',
      porque: 'Un NOT mal puesto vuelve al revés una condición: el circuito reacciona justo al contrario en esa señal.'
    },
    andor: {
      etiqueta: 'Una compuerta es AND y debía ser OR (o al revés)',
      detalle: 'Las condiciones se juntan con la compuerta equivocada.',
      porque: 'AND exige todas las condiciones a la vez; OR se conforma con una. Si cambian, el circuito se activa de más o de menos.'
    },
    grupo: {
      etiqueta: 'Las compuertas juntan las señales en otro orden',
      detalle: 'Las señales correctas están mezcladas en el orden equivocado (como poner mal un paréntesis).',
      porque: 'Con un AND y un OR, no es lo mismo (X · Y) + Z que X · (Y + Z): cambia qué señales se juntan primero.'
    }
  };

  /* Palabras de la vida diaria → compuerta. */
  var PALABRAS = [
    { gate: 'AND', simbolo: '\\cdot', frase: 'y · además · con · siempre que · todas a la vez', ayuda: 'Deben cumplirse TODAS las condiciones.' },
    { gate: 'OR', simbolo: '+', frase: 'o · o bien · también · cualquiera de las dos', ayuda: 'Basta con que se cumpla UNA (o ambas).' },
    { gate: 'NOT', simbolo: '\\overline{A}', frase: 'no · sin · falta · ausencia · en lugar de', ayuda: 'Invierte la señal: 1 se vuelve 0 y 0 se vuelve 1.' }
  ];

  /* ---------- Guía 1 ---------- */
  var COMPUERTAS = [
    { id: 'AND', nombre: 'AND', lee: 'Y', entradas: 2,
      analogia: 'Una caja fuerte con dos llaves: solo abre si giras las dos.',
      regla: 'Sale 1 solo si TODAS las entradas valen 1.',
      ejemplo: 'Un cajero entrega dinero solo si metes la tarjeta Y escribes la clave.' },
    { id: 'OR', nombre: 'OR', lee: 'O', entradas: 2,
      analogia: 'Dos timbres para la misma puerta: suena si pulsas uno, el otro o los dos.',
      regla: 'Sale 1 si AL MENOS UNA entrada vale 1.',
      ejemplo: 'Una alarma suena si se abre la puerta O se rompe la ventana.' },
    { id: 'NOT', nombre: 'NOT', lee: 'NO', entradas: 1,
      analogia: 'Un interruptor «al revés»: si le entra 1, sale 0; si le entra 0, sale 1.',
      regla: 'Siempre da lo contrario de la entrada.',
      ejemplo: 'El aviso «sala libre» se enciende cuando NO hay personas.' },
    { id: 'NAND', nombre: 'NAND', lee: 'NO-Y', entradas: 2,
      analogia: 'Es un AND con un NOT al final: da exactamente lo contrario de AND.',
      regla: 'Sale 0 solo cuando las dos entradas valen 1. En los demás casos sale 1.',
      ejemplo: 'Una luz de advertencia se apaga solo cuando los dos seguros están puestos.' },
    { id: 'NOR', nombre: 'NOR', lee: 'NO-O', entradas: 2,
      analogia: 'Es un OR con un NOT al final: da exactamente lo contrario de OR.',
      regla: 'Sale 1 solo cuando NINGUNA entrada vale 1.',
      ejemplo: 'La luz «todo en calma» se enciende solo si ningún sensor detecta nada.' },
    { id: 'XOR', nombre: 'XOR', lee: 'O exclusivo', entradas: 2,
      analogia: 'La luz de una escalera con dos interruptores (uno abajo y otro arriba): cada uno la cambia.',
      regla: 'Sale 1 cuando las entradas son DIFERENTES.',
      ejemplo: 'La luz de una escalera cambia de estado cada vez que mueves cualquiera de los dos interruptores.' }
  ];

  var QUIZ_COMPUERTAS = [
    { q: 'Un cajero entrega dinero solo si metes la tarjeta Y escribes la clave correcta.', r: 'AND',
      por: 'Se necesitan las dos cosas a la vez: eso es AND.' },
    { q: 'Una alarma debe sonar si se abre la puerta O se rompe la ventana (o ambas).', r: 'OR',
      por: 'Con una sola condición ya basta: eso es OR.' },
    { q: 'El semáforo peatonal se pone en verde cuando el semáforo de los carros NO está en verde.', r: 'NOT',
      por: 'Una sola señal que se invierte: eso es NOT.' },
    { q: 'La luz de una escalera cambia cada vez que mueves cualquiera de los dos interruptores.', r: 'XOR',
      por: 'Se enciende cuando los interruptores están en posiciones DIFERENTES: eso es XOR.' },
    { q: 'La luz «todo en calma» se enciende solo cuando NINGUNO de los dos sensores detecta algo.', r: 'NOR',
      por: 'Es un OR (alguno detecta) con el resultado invertido: eso es NOR.' },
    { q: 'Una máquina funciona siempre, excepto cuando las dos manos presionan los botones al mismo tiempo.', r: 'NAND',
      por: 'Es un AND (los dos presionados) con el resultado invertido: eso es NAND.' }
  ];

  /* De Morgan en lenguaje cotidiano. */
  var DE_MORGAN = [
    { id: 'dm1', izq: '\\overline{A\\cdot B}', der: '\\overline{A}+\\overline{B}',
      f: function (a, b) { return (a && b) ? 0 : 1; }, g: function (a, b) { return (a ? 0 : 1) || (b ? 0 : 1) ? 1 : 0; },
      historia: '«No es cierto que traje el cuaderno Y la tarea» significa lo mismo que «Me falta el cuaderno O me falta la tarea».' },
    { id: 'dm2', izq: '\\overline{A+B}', der: '\\overline{A}\\cdot\\overline{B}',
      f: function (a, b) { return (a || b) ? 0 : 1; }, g: function (a, b) { return (!a && !b) ? 1 : 0; },
      historia: '«No es cierto que llueva O haga frío» significa lo mismo que «No llueve Y no hace frío».' }
  ];

  var PREGUNTAS_DM = [
    { q: 'Al meter la negación dentro del paréntesis de $\\overline{A\\cdot B}$, el AND se convierte en…', ops: ['OR', 'AND', 'XOR'], r: 0,
      por: 'La negación «reparte» y cambia AND por OR: $\\overline{A\\cdot B}=\\overline{A}+\\overline{B}$.' },
    { q: 'Al meter la negación dentro del paréntesis de $\\overline{A+B}$, el OR se convierte en…', ops: ['OR', 'AND', 'NOT'], r: 1,
      por: 'La negación «reparte» y cambia OR por AND: $\\overline{A+B}=\\overline{A}\\cdot\\overline{B}$.' },
    { q: '¿Qué le pasa a cada variable (A y B) cuando la negación entra al paréntesis?', ops: ['Queda igual', 'Se niega: $\\overline{A}$ y $\\overline{B}$', 'Desaparece'], r: 1,
      por: 'Cada variable recibe su propio NOT: $\\overline{A}$ y $\\overline{B}$.' }
  ];

  /* Simplificación en escalera. Cada paso ofrece tres expresiones; solo una es equivalente. */
  var ESCALERA = [
    { id: 'e1', titulo: 'Quitar la señal que sobra', inicio: { txt: 'A\\cdot B+A\\cdot\\overline{B}', f: function (a, b) { return (a && b) || (a && !b) ? 1 : 0; } },
      idea: 'Las dos partes comparten A. Reúnelas y mira qué pasa con $B$ y $\\overline{B}$.',
      pasos: [
        { ley: 'Factor común', formula: 'X\\cdot Y+X\\cdot Z=X\\cdot(Y+Z)',
          ops: [{ txt: 'A\\cdot(B+\\overline{B})', f: function (a, b) { return a && (b || !b) ? 1 : 0; } },
                { txt: 'A\\cdot B\\cdot\\overline{B}', f: function (a, b) { return a && b && !b ? 1 : 0; } },
                { txt: 'A\\cdot B+\\overline{B}', f: function (a, b) { return (a && b) || !b ? 1 : 0; } }] },
        { ley: 'Complemento', formula: 'X+\\overline{X}=1',
          ops: [{ txt: 'A\\cdot 1', f: function (a) { return a ? 1 : 0; } },
                { txt: 'A\\cdot 0', f: function () { return 0; } },
                { txt: 'A+1', f: function () { return 1; } }] },
        { ley: 'Identidad', formula: 'X\\cdot 1=X',
          ops: [{ txt: 'A', f: function (a) { return a ? 1 : 0; } },
                { txt: '1', f: function () { return 1; } },
                { txt: '0', f: function () { return 0; } }] }
      ] },
    { id: 'e2', titulo: 'Una señal y su contraria', inicio: { txt: 'A+\\overline{A}\\cdot B', f: function (a, b) { return a || (!a && b) ? 1 : 0; } },
      idea: 'Si A ya vale 1, no importa lo demás. Si A vale 0, solo importa B.',
      pasos: [
        { ley: 'Distributiva', formula: 'X+Y\\cdot Z=(X+Y)\\cdot(X+Z)',
          ops: [{ txt: '(A+\\overline{A})\\cdot(A+B)', f: function (a, b) { return (a || !a) && (a || b) ? 1 : 0; } },
                { txt: '(A+\\overline{A})\\cdot B', f: function (a, b) { return (a || !a) && b ? 1 : 0; } },
                { txt: 'A\\cdot(\\overline{A}+B)', f: function (a, b) { return a && (!a || b) ? 1 : 0; } }] },
        { ley: 'Complemento', formula: 'X+\\overline{X}=1',
          ops: [{ txt: '1\\cdot(A+B)', f: function (a, b) { return a || b ? 1 : 0; } },
                { txt: '0\\cdot(A+B)', f: function () { return 0; } },
                { txt: 'A\\cdot(A+B)', f: function (a) { return a ? 1 : 0; } }] },
        { ley: 'Identidad', formula: '1\\cdot X=X',
          ops: [{ txt: 'A+B', f: function (a, b) { return a || b ? 1 : 0; } },
                { txt: 'A\\cdot B', f: function (a, b) { return a && b ? 1 : 0; } },
                { txt: 'B', f: function (a, b) { return b ? 1 : 0; } }] }
      ] },
    { id: 'e3', titulo: 'Absorción', inicio: { txt: 'A\\cdot(A+B)', f: function (a, b) { return a && (a || b) ? 1 : 0; } },
      idea: 'Piensa en A = 0 (¿qué da todo?) y en A = 1 (¿qué aporta B?).',
      pasos: [
        { ley: 'Absorción', formula: 'X\\cdot(X+Y)=X',
          ops: [{ txt: 'A', f: function (a) { return a ? 1 : 0; } },
                { txt: 'A+B', f: function (a, b) { return a || b ? 1 : 0; } },
                { txt: 'A\\cdot B', f: function (a, b) { return a && b ? 1 : 0; } }] }
      ] }
  ];

  var LEYES = [
    { ley: 'Identidad', f: 'X\\cdot 1=X\\quad X+0=X' },
    { ley: 'Complemento', f: 'X+\\overline{X}=1\\quad X\\cdot\\overline{X}=0' },
    { ley: 'Factor común', f: 'X\\cdot Y+X\\cdot Z=X\\cdot(Y+Z)' },
    { ley: 'Distributiva', f: 'X+Y\\cdot Z=(X+Y)\\cdot(X+Z)' },
    { ley: 'Absorción', f: 'X\\cdot(X+Y)=X\\quad X+X\\cdot Y=X' },
    { ley: 'De Morgan', f: '\\overline{X\\cdot Y}=\\overline{X}+\\overline{Y}\\quad \\overline{X+Y}=\\overline{X}\\cdot\\overline{Y}' }
  ];

  var Datos = {
    EJERCICIOS: EJERCICIOS, TIPOS_ERROR: TIPOS_ERROR, PALABRAS: PALABRAS, COMPUERTAS: COMPUERTAS,
    QUIZ_COMPUERTAS: QUIZ_COMPUERTAS, DE_MORGAN: DE_MORGAN, PREGUNTAS_DM: PREGUNTAS_DM,
    ESCALERA: ESCALERA, LEYES: LEYES
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Datos;
  else raiz.Datos = Datos;
})(typeof window !== 'undefined' ? window : globalThis);
