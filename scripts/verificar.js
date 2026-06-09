// Verificador del checklist de la Entrega 2 (solo lectura).
// Ejecutar:  node scripts/verificar.js
// Revisa: dataset, imágenes, dims de vectores, chunking, índice Atlas y claves .env.
// NO modifica nada y NO consume cuota de HF/Gemini (no los llama).

import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TEXT_MIN = 100;
const IMG_MIN = 50;

let pass = 0, warnN = 0, fail = 0;
const ok = (m) => { pass++; console.log('  ✅ ' + m); };
const warn = (m) => { warnN++; console.log('  ⚠️  ' + m); };
const bad = (m) => { fail++; console.log('  ❌ ' + m); };
const mark = (cond, m, soft = false) => cond ? ok(m) : (soft ? warn(m) : bad(m));

const fileExists = (p) => fs.existsSync(path.join(ROOT, p));

async function main() {
  console.log('\n══════════════════════════════════════════════');
  console.log('   VERIFICACIÓN ENTREGA 2 — Kreato RAG');
  console.log('══════════════════════════════════════════════');

  // ── Claves .env ───────────────────────────────────────────
  console.log('\n🔑 Variables de entorno (.env)');
  mark(!!process.env.MONGODB_URI, `MONGODB_URI ${process.env.MONGODB_URI ? 'presente' : 'FALTA'}`);
  mark(!!process.env.HF_API_TOKEN, `HF_API_TOKEN ${process.env.HF_API_TOKEN ? 'presente' : 'FALTA — sin esto no se generan embeddings'}`);
  mark(!!process.env.GEMINI_API_KEY, `GEMINI_API_KEY ${process.env.GEMINI_API_KEY ? 'presente' : 'FALTA — sin esto el LLM no responde'}`);

  if (!process.env.MONGODB_URI) {
    console.log('\n⛔ Sin MONGODB_URI no puedo revisar la base. Fin.');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const count = (c, f = {}) => db.collection(c).countDocuments(f);

  // ── Req 5: Dataset ────────────────────────────────────────
  console.log('\n📦 Req 5 — Dataset');
  const names = (await db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !['contadors', 'tu_coleccion'].includes(n));
  let total = 0;
  for (const n of names) total += await count(n);
  mark(total >= TEXT_MIN, `Documentos totales en la base: ${total} (mín. ${TEXT_MIN})`, true);
  console.log('       (nota: cuenta TODAS las colecciones, no solo "texto" — confirmar criterio con el profe)');

  const pubImg = await count('publicaciones', { imagen_url: { $exists: true, $ne: null } });
  const oeAgg = await db.collection('oferta_encargo').aggregate([
    { $project: { n: { $size: { $ifNull: ['$imagenes', []] } } } },
    { $group: { _id: null, t: { $sum: '$n' } } }
  ]).toArray();
  const oeImg = oeAgg[0]?.t ?? 0;
  const imgs = pubImg + oeImg;
  mark(imgs >= IMG_MIN, `Imágenes: ${imgs} (publicaciones ${pubImg} + oferta_encargo ${oeImg}) — mín. ${IMG_MIN}`);

  // ── Vectores reales (dims) ────────────────────────────────
  console.log('\n🔢 Vectores — dimensiones correctas (no placeholder de 8)');
  const dim = async (c, field) => {
    const d = await db.collection(c).findOne({ [field]: { $exists: true, $type: 'array' } }, { projection: { [field]: 1 } });
    return d?.[field]?.length ?? null;
  };
  const dVT = await dim('vector_transcripciones', 'vector_embedding');
  const dVC = await dim('vector_cursos', 'vector_embedding');
  const dPub = await dim('publicaciones', 'vector_imagen');
  mark(dVT === 384, `vector_transcripciones: ${dVT} dims (esperado 384)`);
  mark(dVC === 384, `vector_cursos: ${dVC} dims (esperado 384)${dVC === 8 ? ' ← PLACEHOLDER' : ''}`, true);
  mark(dPub === 512, `publicaciones.vector_imagen: ${dPub} dims (esperado 512)${dPub === 8 ? ' ← PLACEHOLDER' : ''}`, true);

  // ── Req 6: Chunking & RAG ─────────────────────────────────
  console.log('\n✂️  Req 6 — Chunking & RAG');
  const estr = await db.collection('vector_transcripciones').aggregate([
    { $group: { _id: '$metadata.estrategia_chunking', n: { $sum: 1 }, len: { $avg: { $strLenCP: { $ifNull: ['$contenido_segmento', ''] } } } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  mark(estr.length >= 2, `Estrategias de chunking en datos: ${estr.length} (mín. 2)`);
  for (const e of estr) console.log(`       • ${e._id}: ${e.n} chunks · largo prom ${Math.round(e.len)} chars`);

  const scriptDir = path.join(ROOT, 'scripts');
  const scriptFiles = fs.existsSync(scriptDir) ? fs.readdirSync(scriptDir) : [];
  const chunkFiles = scriptFiles.filter((f) => /chunk|ingest|carga|load|seed/i.test(f));
  mark(chunkFiles.length > 0, chunkFiles.length ? `Script de chunking/carga: ${chunkFiles.join(', ')}` : 'Script de chunking/carga: NO encontrado (solo re-vectoriza)', true);

  mark(fileExists('ENDPOINTS.md'), 'ENDPOINTS.md (API documentada)', true);
  mark(fileExists('src/routes/ragRoutes.js'), 'ragRoutes.js (endpoints RAG)');

  // ── Req 7: funciones de consulta presentes ────────────────
  console.log('\n🔎 Req 7 — Funciones de consulta (en código)');
  const rag = fileExists('src/services/ragService.js') ? fs.readFileSync(path.join(ROOT, 'src/services/ragService.js'), 'utf8') : '';
  for (const fn of ['retrieve', 'retrieveByImage', 'retrieveTextToImage', 'ragQuery']) {
    mark(rag.includes(fn), `ragService.${fn}()`);
  }
  warn('Evidencia de las 5 consultas → correr tests y GUARDAR el output (manual)');

  // ── Índice vectorial Atlas ────────────────────────────────
  console.log('\n📇 Índice vectorial en Atlas');
  let idxVT = null;
  try { idxVT = await db.collection('vector_transcripciones').listSearchIndexes().toArray(); } catch { idxVT = null; }
  if (idxVT === null) {
    warn('No pude listar índices de búsqueda (permiso/tier). Revísalo en Atlas → Search.');
  } else {
    const found = idxVT.find((i) => i.name === 'rag_transcripciones');
    mark(!!found, found ? `rag_transcripciones existe (status: ${found.status ?? found.queryable})` : 'rag_transcripciones NO existe — créalo en Atlas (lo hace Rafa)');
  }

  // ── Revisión manual ───────────────────────────────────────
  console.log('\n📄 Requiere revisión manual (no verificable por código)');
  warn('Req 8 — Conclusión argumentada del experimento de chunking (en el informe)');
  warn('Req 10 — Informe final (arquitectura, resultados, lecciones, comparación relacional)');
  mark(fileExists('README.md'), 'README.md (instrucciones de instalación)', true);

  // ── Resumen ───────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log(`   RESUMEN:   ✅ ${pass}    ⚠️  ${warnN}    ❌ ${fail}`);
  console.log('══════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

main().catch((e) => { console.error('❌ Error:', e.message); process.exit(1); });
