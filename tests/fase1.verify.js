// Verificación Fase 1 — Modelo VectorTranscripciones
// Ejecutar: node tests/fase1.verify.js

import 'dotenv/config';
import mongoose from 'mongoose';
import VectorTranscripciones from '../src/models/VectorTranscripciones.js';

const ESTRATEGIAS = ['fixed_size_v1', 'semantic_split_v1', 'sentence_window_v1'];

async function verificar() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conexión a Atlas exitosa\n');

  // 1. Conteo total
  const total = await VectorTranscripciones.countDocuments();
  console.log(`📦 Total de chunks en vector_transcripciones: ${total}`);
  console.log(`   Esperado: 24 (6 semantic + 9 fixed_size + 9 sentence_window)\n`);

  // 2. Conteo por estrategia
  console.log('📊 Conteo por estrategia:');
  for (const estrategia of ESTRATEGIAS) {
    const count = await VectorTranscripciones.countDocuments({
      'metadata.estrategia_chunking': estrategia
    });
    console.log(`   ${estrategia.padEnd(22)}: ${count}`);
  }

  // 3. Un documento de ejemplo por estrategia
  console.log('\n📄 Documento de ejemplo por estrategia:');
  for (const estrategia of ESTRATEGIAS) {
    const doc = await VectorTranscripciones.findOne({
      'metadata.estrategia_chunking': estrategia
    }).select('_id transcripcion_id contenido_segmento metadata vector_embedding');

    console.log(`\n── ${estrategia} ──`);
    console.log(`   _id               : ${doc._id}`);
    console.log(`   transcripcion_id  : ${doc.transcripcion_id}`);
    console.log(`   minuto_inicio     : ${doc.metadata.minuto_inicio}s`);
    console.log(`   minuto_fin        : ${doc.metadata.minuto_fin}s`);
    console.log(`   dims embedding    : ${doc.vector_embedding.length}`);
    console.log(`   segmento (50c)    : "${doc.contenido_segmento.substring(0, 50)}..."`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Fase 1 completa — modelo conecta y lee correctamente');
}

verificar().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
