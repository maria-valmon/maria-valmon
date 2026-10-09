# Valmon

App personal para el móvil: lectura y aprendizaje (salud mental), salud física, salud emocional, relaciones personales y proyectos.

- `valmon.html`: el código de la app (un solo archivo, sin dependencias).
- `./build.sh` genera `index.html`, la versión que se sirve en el servidor y se instala en el móvil (Compartir → Añadir a pantalla de inicio).
- De momento los datos se guardan en el propio navegador (`localStorage`). Cuando haya servidor se pasarán a una base de datos.

## Pregúntale a Claude
En Relaciones y en Aprendizaje hay un botón que pide recomendaciones personalizadas a Claude (capacidad `sample` de los artefactos de claude.ai). Solo aparece cuando la app se abre desde Claude; en el servidor propio se oculta y queda el contenido fijo (libros, textos y recursos verificados).

## Pendiente
- Servidor + base de datos y sincronización entre dispositivos.
- Hevy: importar entrenos con su API (requiere Hevy Pro y una clave de API, desde el servidor).
- Apple Salud: pasos, peso y entrenos. Necesita envolver la app como nativa (por ejemplo con Capacitor) para usar HealthKit.
- Ajustar el plan a las máquinas del gimnasio.
