# Valmon

App personal para el móvil: lectura y aprendizaje (salud mental), salud física, salud emocional, relaciones personales y proyectos.

- `valmon.html`: el código de la app (un solo archivo, sin dependencias).
- `./build.sh` genera `index.html`, la versión que se sirve en el servidor y se instala en el móvil (Compartir → Añadir a pantalla de inicio).
- Datos: cuando la app se abre desde Claude se sincronizan con la base de datos privada del artefacto (capacidad `db`, colección `valmon`, un documento por sección, solo la dueña puede leer y escribir). Claude puede leerlos y actualizarlos actuando en nombre de la dueña. El navegador guarda una copia (`localStorage`) para funcionar sin conexión; antes de cada escritura se lee la nube y se fusiona elemento a elemento, así que no se pisan cambios de otro dispositivo o de Claude.
- Dieta: menús de 2 semanas (A/B) con gramos en crudo y tabla nutricional verificada; lista de la compra cada 5 días (incluye lo que se cocina en tanda el domingo y el miércoles) con las tareas de buscar hueco e ir a comprar.

## Pregúntale a Claude
En Relaciones y en Aprendizaje hay un botón que pide recomendaciones personalizadas a Claude (capacidad `sample` de los artefactos de claude.ai). Solo aparece cuando la app se abre desde Claude; en el servidor propio se oculta y queda el contenido fijo (libros, textos y recursos verificados).

## Pendiente
- Servidor + base de datos y sincronización entre dispositivos.
- Hevy: importar entrenos con su API (requiere Hevy Pro y una clave de API, desde el servidor).
- Apple Salud: pasos, peso y entrenos. Necesita envolver la app como nativa (por ejemplo con Capacitor) para usar HealthKit.
- Ajustar el plan a las máquinas del gimnasio.
