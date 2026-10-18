# Guías interactivas · Periodo 4 · 2026

Instituto Técnico Veintiséis de Marzo, Barrancabermeja. Docente: Diego Ricardo Páez Ardila.

Este repositorio reúne las páginas web de estudio del Periodo 4. Cada página es un solo archivo `index.html` que no necesita servidor ni conexión a internet para funcionar.

La portada es `index.html`, en la raíz. Desde ahí los estudiantes eligen su grado y su materia.

## Estructura

```
index.html                                   portada con la descripción de cada página
assets/escudo.png                            escudo del colegio
sexto/concurso/                              Tecnología 6: concurso "¡Conecta!"
octavo/guia-interactiva/                     Tecnología 8: guías de materiales de construcción
octavo/concurso/                             Tecnología 8: concurso "¡Construye!"
decimo/circuitos-1/                          Circuitos 1 (10 ELE)
decimo/digitales-1/                          Digitales 1 (10 ELE)
decimo/formulacion-proyectos/                Formulación de Proyectos (10 ELE)
decimo/programacion-1/                       Programación 1, guías 2 a 4 (10 ELE)
once/dibujo-tecnico/                         Dibujo Técnico, guía 1 (11 ELEC)
once/electronica-programacion-guia-1/        Electrónica 1 + Programación 2, guía 1 (11 ELEC)
once/electronica-programacion-guia-2/        Electrónica 1 + Programación 2, guía 2 (11 ELEC)
```

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub, por ejemplo `clases-26-marzo`.
2. Sube el contenido de esta carpeta a la raíz del repositorio (incluido el archivo oculto `.nojekyll`).
3. En el repositorio entra a Settings, luego Pages. En "Build and deployment" elige "Deploy from a branch", la rama `main` y la carpeta `/ (root)`. Guarda.
4. Espera uno o dos minutos. La portada queda en `https://TU-USUARIO.github.io/clases-26-marzo/` y cada página en su carpeta, por ejemplo `.../decimo/circuitos-1/`.

## Datos de los estudiantes

- El avance y los cuadernos se guardan en `localStorage` del navegador de cada dispositivo. No se envía nada a ningún servidor.
- Cada página usa una clave de guardado propia, por lo que las respuestas de una página no se mezclan con las de otra aunque estén en el mismo sitio.
- Si un estudiante cambia de dispositivo o borra los datos del navegador, pierde su avance.
- En Digitales 1, Circuitos 1 y Tecnología 8, cada guía tiene un informe HTML autónomo que se puede abrir, imprimir o guardar como PDF desde el diálogo de impresión del navegador. También se puede descargar el HTML para abrirlo sin conexión.
- En Digitales 1, las guías 2 y 3 asignan tres problemas fijos por sorteo desde bancos versionados; las escenas físicas de los diez ejemplos originales responden al circuito que construye el estudiante.
- Digitales 1, Circuitos 1 y Tecnología 8 permiten descargar e importar un respaldo JSON de progreso; los respaldos solo se deben restaurar en la misma asignatura y versión de esquema.
- En esas tres materias, las preguntas se responden dentro de cada actividad y «Mis reportes» reúne los informes de las cuatro guías. Los datos se mantienen en ese navegador y no se sincronizan entre dispositivos.

## Actualizar el sitio existente

El sitio está publicado en https://diegopaeza.github.io/clases-26-marzo/ desde la rama `main`, carpeta raíz, con `.nojekyll`. No requiere compilación ni instalar dependencias.

Antes del commit y del push, ejecutar `node scripts/validar_publicacion.cjs` y revisar `git diff --check`. La comprobación valida sintaxis JavaScript, rutas relativas y el catálogo de ejemplos. Después del push, comprobar el despliegue de Pages y las páginas publicadas.

`ejemplos/digitales/ejemplos_digitales.json` conserva el catálogo; la guía utiliza todavía su banco JavaScript incorporado. No se sincronizan automáticamente.

Los temporales (`tmp/`), solucionarios docentes (`output/`) y evidencias locales (`docs/qa/`) se excluyen del repositorio público. Algunas pruebas históricas en `scripts/validation/` requieren esas evidencias locales; no forman una batería reproducible en una clonación nueva. La comprobación de publicación anterior sí es independiente de ellas.

## Para agregar páginas nuevas

1. Crea una carpeta con el patrón `grado/materia/` y deja la página como `index.html`.
2. Si la página guarda progreso, usa una constante `KEY` distinta a las ya existentes.
3. Agrega una tarjeta en `index.html`, dentro de la sección del grado.
