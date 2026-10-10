# Herramientas de Valmon

## Sincronización automática con Hevy (`hevy-sync.mjs`)

Trae los entrenos de Hevy (con kg, repeticiones y calentamientos) a la app. Usa la API v1 de Hevy, que **solo funciona con Hevy Pro**.

### Qué hace falta (una vez)
1. Clave de la API: créala en https://hevy.com/settings?developer.
2. En los ajustes del entorno de Claude Code de este repositorio:
   - guarda la clave como secreto con el nombre `HEVY_API_KEY`;
   - en *Acceso a la red*, permite el dominio `api.hevyapp.com`.
3. Pide a Claude que cree la rutina diaria (abajo).

### Cómo funciona
```
# 1. Cambios de Hevy desde una fecha (entrenos nuevos, editados o borrados)
HEVY_API_KEY=… node tools/hevy-sync.mjs --since 2026-10-01T00:00:00Z --out /tmp/hevy.json
# 2. Fusionar con el documento valmon/salud de la app (descargado con ArtifactData)
node tools/hevy-sync.mjs --merge /tmp/valmon/valmon/salud.json /tmp/hevy.json --out /tmp/salud-nuevo.json
```
Los entrenos de la API se guardan con el id `hevy-<id de Hevy>`. Si antes se importó el mismo entreno por CSV (mismo día y nombre), se sustituye. Los ejercicios del plan se reconocen por nombre (mismas reglas que `HEVY_TO_EX` en `app/valmon.html`); el resto se guarda con su nombre y los músculos de su plantilla de Hevy.

### Prompt de la rutina diaria
> Sincroniza Hevy con Valmon (https://claude.ai/artifact/1umegouBvkUFTjAV2T88c4).
> 1. Lee con ArtifactData el documento `valmon/salud` usando `out_dir: /tmp/valmon` y apunta su `version`.
> 2. Toma como `since` el campo `hevy.apiAt` del documento (o hace 30 días si no existe) y ejecuta `node tools/hevy-sync.mjs --since <since> --out /tmp/hevy.json`.
> 3. Ejecuta `node tools/hevy-sync.mjs --merge /tmp/valmon/valmon/salud.json /tmp/hevy.json --out /tmp/salud-nuevo.json`.
> 4. Escribe `valmon/salud` con ArtifactData `set`, `file_path: /tmp/salud-nuevo.json` e `if_version` con la versión del paso 1. Si la versión cambió, repite desde el paso 1.
> No toques ningún otro documento. Si falta `HEVY_API_KEY` o Hevy rechaza la clave, dilo en el resumen.

La app fusiona por id los cambios que lleguen a la vez desde el móvil, así que la rutina no pisa lo que se apunte allí.
