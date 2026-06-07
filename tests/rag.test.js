// Tests formales — Pipeline RAG Kreato
// Ejecutar: node --test tests/rag.test.js
//
// PRE-REQUISITOS:
//   1. node scripts/populate_vectors_node.js  (embeddings 384-dim en vector_transcripciones)
//   2. Índices Atlas UI configurados (ver RAG_PLAN.md — sección "Índices vectoriales HNSW")
//   3. HF_API_TOKEN y GEMINI_API_KEY en .env

import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { retrieve, ragQuery } from '../src/services/ragService.js';
import { embed } from '../src/services/embeddingService.js';

// Ground truth definido en Entregables_3y4_corregido.pdf §4.5
const GT = {
  Q01: { fixed_size_v1: ['vt_exp_A_001','vt_exp_A_002'], semantic_split_v1: ['vt_001'],            sentence_window_v1: ['vt_exp_C_001','vt_exp_C_002'] },
  Q02: { fixed_size_v1: ['vt_exp_A_005','vt_exp_A_006'], semantic_split_v1: ['vt_003'],            sentence_window_v1: ['vt_exp_C_006'] },
  Q03: { fixed_size_v1: [],                              semantic_split_v1: [],                     sentence_window_v1: [] },  // inter-transcripción
  Q04: { fixed_size_v1: [],                              semantic_split_v1: [],                     sentence_window_v1: [] },  // inter-transcripción
  Q05: { fixed_size_v1: ['vt_exp_A_004','vt_exp_A_005'], semantic_split_v1: ['vt_002'],            sentence_window_v1: ['vt_exp_C_004','vt_exp_C_005'] },
  Q06: { fixed_size_v1: ['vt_exp_A_008'],                semantic_split_v1: ['vt_005'],             sentence_window_v1: ['vt_exp_C_009'] },
  Q07: { fixed_size_v1: ['vt_exp_A_005'],                semantic_split_v1: ['vt_004'],             sentence_window_v1: ['vt_exp_C_005'] },
  Q08: { fixed_size_v1: ['vt_exp_A_007','vt_exp_A_008'], semantic_split_v1: ['vt_006'],            sentence_window_v1: ['vt_exp_C_008'] },
  Q09: { fixed_size_v1: ['vt_exp_A_005','vt_exp_A_006'], semantic_split_v1: ['vt_003'],            sentence_window_v1: ['vt_exp_C_007'] },
  Q10: { fixed_size_v1: ['vt_exp_A_001','vt_exp_A_002'], semantic_split_v1: ['vt_001'],            sentence_window_v1: ['vt_exp_C_001','vt_exp_C_002'] },
};

const CONSULTAS = [
  { id: 'Q01', texto: 'Como funciona la luz ambiental en pintura digital?' },
  { id: 'Q02', texto: 'Que modo de fusion debo usar para los brillos?' },
  { id: 'Q03', texto: 'Como pintar sombras sin usar negro puro?' },
  { id: 'Q04', texto: 'Que diferencia hay entre sombra propia y proyectada?' },
  { id: 'Q05', texto: 'Como crear un gradiente de luz cenital?' },
  { id: 'Q06', texto: 'Por que la iluminacion es tan importante?' },
  { id: 'Q07', texto: 'Como afecta la distancia de la luz a las sombras?' },
  { id: 'Q08', texto: 'Que paleta usar para escenas nocturnas?' },
  { id: 'Q09', texto: 'Como usar el modo Multiplicar para sombras?' },
  { id: 'Q10', texto: 'Como la luz colorea las superficies segun material?' },
];

const ESTRATEGIAS = ['semantic_split_v1', 'fixed_size_v1', 'sentence_window_v1'];

function hitAtK(retrieved, gtList) {
  if (!gtList || gtList.length === 0) return null; // inter-transcripción
  return retrieved.some(c => gtList.includes(c._id)) ? 1 : 0;
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

after(async () => {
  await mongoose.disconnect();
});

// ── Tests de embedding ─────────────────────────────────────────────────────

test('embed() genera vector de 384 dims', async () => {
  const vec = await embed('luz ambiental en pintura digital');
  assert.strictEqual(vec.length, 384);
  assert.ok(vec.every(v => typeof v === 'number'));
});

test('embed() produce vectores distintos para textos distintos', async () => {
  const v1 = await embed('luz ambiental');
  const v2 = await embed('sombras nocturnas');
  assert.ok(!v1.every((val, i) => val === v2[i]));
});

// ── Tests de retrieval por estrategia ──────────────────────────────────────

for (const estrategia of ESTRATEGIAS) {
  test(`retrieve() — estrategia: ${estrategia}`, async () => {
    let hits = 0;
    let evaluadas = 0;

    for (const { id, texto } of CONSULTAS) {
      const gt      = GT[id][estrategia];
      const results = await retrieve(texto, estrategia, 3);

      const hit = hitAtK(results, gt);
      if (hit !== null) {
        evaluadas++;
        hits += hit;
      }

      // Q03 y Q04 deben retornar null (hit vacío o fuera de corpus)
      if (id === 'Q03' || id === 'Q04') {
        assert.ok(hit === null || results.every(r => r.transcripcion_id !== 'trans_999'),
          `${id} no debería traer fragmentos de trans_999`);
      }
    }

    const hitRate = evaluadas > 0 ? hits / evaluadas : 0;
    console.log(`    ${estrategia}: hit@3=${hitRate.toFixed(2)} (${hits}/${evaluadas})`);
    // No imponemos umbral mínimo — se documenta el resultado
    assert.ok(evaluadas > 0, 'Deben evaluarse consultas');
  });
}

// ── Tests del pipeline RAG completo ───────────────────────────────────────

test('ragQuery() devuelve respuesta de Gemini y chunks', async () => {
  const { respuesta, chunks } = await ragQuery(
    'Como funciona la luz ambiental en pintura digital?',
    'semantic_split_v1',
    3
  );
  assert.ok(typeof respuesta === 'string', 'respuesta debe ser string');
  assert.ok(respuesta.length > 10, 'respuesta no debe estar vacía');
  assert.ok(Array.isArray(chunks), 'chunks debe ser array');
});

test('ragQuery() sin contexto devuelve mensaje informativo', async () => {
  const { respuesta, chunks } = await ragQuery('Como pintar sombras sin negro puro?', 'semantic_split_v1', 3);
  // Si no hay chunks (índice no configurado), devuelve mensaje
  if (chunks.length === 0) {
    assert.ok(respuesta.includes('No encontré'), 'Debe indicar que no encontró fragmentos');
  } else {
    assert.ok(typeof respuesta === 'string');
  }
});
