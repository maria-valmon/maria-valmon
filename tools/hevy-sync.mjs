#!/usr/bin/env node
// Sincronización de Hevy → Valmon (API v1 de Hevy; solo funciona con Hevy Pro).
//
//   Traer cambios:  HEVY_API_KEY=… node tools/hevy-sync.mjs --since 2026-10-01T00:00:00Z --out /tmp/hevy.json
//   Fusionar:       node tools/hevy-sync.mjs --merge /tmp/salud.json /tmp/hevy.json --out /tmp/salud-nuevo.json
//
// El primer paso usa GET /v1/workouts/events (cambios y borrados desde una fecha) y GET /v1/exercise_templates
// (grupo muscular de cada ejercicio). El segundo toma el documento valmon/salud de la app y añade, actualiza o
// borra los entrenos de Hevy sin tocar el resto. Las reglas de ejercicios son las mismas que usa la app
// (app/valmon.html: HEVY_TO_EX y hashId); si cambian allí, cámbialas aquí.
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const out = opt('--out');
const emit = obj => { const txt = JSON.stringify(obj, null, 1); if (out) writeFileSync(out, txt); else process.stdout.write(txt + '\n'); };

const HEVY_TO_EX = [
  [/side plank|plancha lateral/i, null], [/hip thrust.*(machine|m[aá]quina)|glute drive/i, 'hipthrust'], [/hip thrust|glute bridge|empuje de cadera/i, 'hipbarra'],
  [/romanian|\brdl\b|rumano/i, 'rdl'], [/bulgarian|b[uú]lgara/i, 'bulgara'], [/leg curl|curl femoral/i, 'femoral'], [/hip abduct|abducci[oó]n|abductora/i, 'abduccion'],
  [/glute kickback|patada de gl[uú]teo|cable kickback/i, 'patada'], [/back extension|hyperextension|hiperextensi/i, 'hiper'], [/leg press|prensa/i, 'prensa'],
  [/lat pulldown|jal[oó]n al pecho/i, 'jalon'], [/incline.*(dumbbell|db).*press|press inclinado/i, 'pressincl'], [/chest supported|seal row|remo con apoyo/i, 'remoapoyo'],
  [/seated (cable )?row|cable row|remo sentado/i, 'remo'], [/(dumbbell|db).*shoulder press|press de hombro/i, 'presshombro'], [/lateral raise|elevaciones laterales/i, 'laterales'],
  [/face pull/i, 'facepull'], [/chest press|press de pecho/i, 'presspecho'], [/pallof/i, 'pallof'], [/dead ?bug/i, 'deadbug'], [/farmer|granjero/i, 'granjero'],
  [/\bplank|plancha/i, 'plancha'], [/goblet|sumo squat/i, 'goblet'], [/step.?up/i, 'stepup'], [/leg extension|extensi[oó]n de cu[aá]driceps/i, 'extcuad'],
  [/bicep curl|curl de b[ií]ceps/i, 'curl'], [/tricep(s)? pushdown|extensi[oó]n de tr[ií]ceps/i, 'triceps'], [/calf raise|gemelo/i, 'gemelo'], [/treadmill|cinta/i, 'cinta'],
];
const hevyToEx = name => { for (const [re, id] of HEVY_TO_EX) if (re.test(name)) return id; return null; };
const hashId = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const MUSCLE = { glutes: 'gluteos', abductors: 'gluteos', hamstrings: 'isquios', quadriceps: 'cuadriceps', adductors: 'aductores', calves: 'gemelos', lats: 'espalda',
  upper_back: 'espalda', traps: 'trapecio', shoulders: 'hombros', chest: 'pecho', biceps: 'biceps', triceps: 'triceps', abdominals: 'abdomen', lower_back: 'lumbar' };
const localDate = iso => new Intl.DateTimeFormat('sv-SE', { timeZone: process.env.TZ_VALMON || 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

function convert(w, templates) {
  const ex = [];
  for (const e of w.exercises || []) {
    const log = (e.sets || []).map(s => ({ kg: Math.round((s.weight_kg || 0) * 10) / 10, reps: Math.round(s.reps || s.duration_seconds || 0), warm: s.type === 'warmup' })).filter(s => s.reps > 0).slice(0, 30);
    const sets = log.filter(s => !s.warm).length; if (!sets) continue;
    const title = String(e.title || 'Ejercicio').slice(0, 80), id = hevyToEx(title);
    if (id) { ex.push({ id, sets, log }); continue; }
    const t = templates.get(e.exercise_template_id), m = {};
    if (t) { for (const g of t.secondary_muscle_groups || []) if (MUSCLE[g]) m[MUSCLE[g]] = Math.max(m[MUSCLE[g]] || 0, 0.5); if (MUSCLE[t.primary_muscle_group]) m[MUSCLE[t.primary_muscle_group]] = 1; }
    ex.push({ id: 'hv-' + hashId(title.toLowerCase()), n: title, m, sets, log });
  }
  return { id: 'hevy-' + w.id, date: localDate(w.start_time), name: String(w.title || 'Entreno de Hevy').slice(0, 80), src: 'hevy', ex };
}

async function fetchMode() {
  const KEY = process.env.HEVY_API_KEY, BASE = (process.env.HEVY_API_BASE || 'https://api.hevyapp.com').replace(/\/$/, '');
  if (!KEY) { console.error('Falta la variable HEVY_API_KEY (la clave de hevy.com/settings?developer).'); process.exit(2); }
  const since = opt('--since') || new Date(Date.now() - 30 * 864e5).toISOString();
  async function get(path, params) {
    const url = new URL(BASE + path); for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
    for (let attempt = 0; ; attempt++) {
      const r = await fetch(url, { headers: { 'api-key': KEY, accept: 'application/json' } });
      if (r.ok) return r.json();
      if (r.status === 401 || r.status === 403) { console.error(`Hevy rechaza la clave (${r.status}): revisa HEVY_API_KEY y que la cuenta tenga Hevy Pro.`); process.exit(3); }
      if ((r.status === 429 || r.status >= 500) && attempt < 3) { await new Promise(res => setTimeout(res, 1000 * 2 ** attempt)); continue; }
      throw new Error(`Hevy respondió ${r.status} en ${path}`);
    }
  }
  const templates = new Map();
  for (let page = 1, count = 1; page <= count; page++) { const r = await get('/v1/exercise_templates', { page, pageSize: 100 }); count = r.page_count || 1; for (const t of r.exercise_templates || []) templates.set(t.id, t); }
  const upserts = new Map(), deletes = new Set();
  for (let page = 1, count = 1; page <= count; page++) {
    const r = await get('/v1/workouts/events', { page, pageSize: 10, since }); count = r.page_count || 1;
    for (const ev of r.events || []) {
      if (ev.type === 'updated' && ev.workout) { const w = convert(ev.workout, templates); if (w.ex.length && !deletes.has(w.id)) upserts.set(w.id, upserts.get(w.id) || w); }
      else if (ev.type === 'deleted' && ev.id) { deletes.add('hevy-' + ev.id); upserts.delete('hevy-' + ev.id); }
    }
  }
  emit({ since, until: new Date().toISOString(), upserts: [...upserts.values()], deletes: [...deletes] });
}

function mergeMode() {
  const [saludPath, hevyPath] = [args[args.indexOf('--merge') + 1], args[args.indexOf('--merge') + 2]];
  let doc = JSON.parse(readFileSync(saludPath, 'utf8')); if (doc && doc.data && doc.id) doc = doc.data; // lo que guarda ArtifactData con out_dir
  const hevy = JSON.parse(readFileSync(hevyPath, 'utf8'));
  const workouts = Array.isArray(doc.workouts) ? doc.workouts : [];
  const del = new Set(hevy.deletes || []), up = new Map((hevy.upserts || []).map(w => [w.id, w]));
  // un entreno importado antes por CSV (mismo día y nombre) se sustituye por el de la API, para no tenerlo dos veces
  const fromCSV = w => w.src === 'hevy' && !/^hevy-[0-9a-f]{8}-[0-9a-f]{4}-/i.test(w.id); // los de la API llevan el UUID de Hevy
  const dupCSV = w => fromCSV(w) && [...up.values()].some(u => u.date === w.date && u.name === w.name);
  const kept = workouts.filter(w => !del.has(w.id) && !up.has(w.id) && !dupCSV(w));
  doc.workouts = [...kept, ...up.values()].sort((a, b) => a.date.localeCompare(b.date));
  doc.hevy = { ...(doc.hevy || {}), apiAt: hevy.until || new Date().toISOString() };
  delete doc._at;
  emit(doc);
  console.error(`Hevy: ${up.size} entrenos añadidos o actualizados, ${[...del].filter(id => workouts.some(w => w.id === id)).length} borrados.`);
}

if (args.includes('--merge')) mergeMode(); else fetchMode().catch(e => { console.error(e.message); process.exit(1); });
