# Valmon

App personal para el móvil: lectura y aprendizaje (salud mental), salud física, salud emocional, relaciones personales y proyectos.

- `valmon.html`: el código de la app (un solo archivo, sin dependencias).
- `./build.sh` genera `index.html`, la versión que se sirve en el servidor y se instala en el móvil (Compartir → Añadir a pantalla de inicio).
- Datos: cuando la app se abre desde Claude se sincronizan con la base de datos privada del artefacto (capacidad `db`, colección `valmon`, un documento por sección, solo la dueña puede leer y escribir). Claude puede leerlos y actualizarlos actuando en nombre de la dueña. El navegador guarda una copia (`localStorage`) para funcionar sin conexión; antes de cada escritura se lee la nube y se fusiona elemento a elemento, así que no se pisan cambios de otro dispositivo o de Claude. Los entrenos se guardan en forma compacta y, si una sección se acerca al límite de tamaño de un documento, lo más antiguo se copia primero a documentos de archivo por mes (`valmon-archivo/<sección>-AAAA-MM`) y después se quita de la app; si aun así no cabe, la sección se queda pendiente en el dispositivo (nunca se pisa con lo de la nube) y Ajustes lo avisa.
- Entrenos: registro serie a serie (kg y repeticiones, calentamientos aparte), sugerencia de progresión doble y récords; Progreso con el 1RM estimado de cada ejercicio.
- Hevy: importar el CSV de Hevy (Ajustes → Exportar datos) cuantas veces quieras; no duplica, respeta lo que corriges en la app y no recupera lo que borras. Con Hevy Pro, `tools/hevy-sync.mjs` sincroniza cada día desde su API (ver `tools/README.md`).
- Apple Salud: un Atajo del iPhone abre la app con los pasos, las kcal activas y el peso del día en la dirección (`#s_AAAA-MM-DD_PASOS_KCAL_PESOx10`) o los deja en el portapapeles para pegarlos; un enlace antiguo del mismo día no pisa datos más nuevos.
- Dieta: menús de 2 semanas (A/B) con gramos en crudo y tabla nutricional verificada; lista de la compra cada 5 días (incluye lo que se cocina en tanda el domingo y el miércoles) con las tareas de buscar hueco e ir a comprar.

## Pregúntale a Claude
En Relaciones y en Aprendizaje hay un botón que pide recomendaciones personalizadas a Claude (capacidad `sample` de los artefactos de claude.ai). Solo aparece cuando la app se abre desde Claude; en el servidor propio se oculta y queda el contenido fijo (libros, textos y recursos verificados).

## Pendiente
- Servidor propio (ahora la app vive como artefacto de Claude, con su base de datos).
- Apple Salud sin Atajo: necesitaría envolver la app como nativa (por ejemplo con Capacitor) para usar HealthKit.
- Ajustar el plan a las máquinas del gimnasio.
