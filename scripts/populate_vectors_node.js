// Pobla los embeddings reales (384 dims) en vector_transcripciones
// Ejecutar: node scripts/populate_vectors_node.js
// Requiere HF_API_TOKEN en .env

import 'dotenv/config';
import mongoose from 'mongoose';
import { embed } from '../src/services/embeddingService.js';
import VectorTranscripciones from '../src/models/VectorTranscripciones.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Conectado a Atlas\n');

const chunks = await VectorTranscripciones.find({}).select('_id contenido_segmento vector_embedding');
console.log(`📦 Chunks a procesar: ${chunks.length}\n`);

let ok = 0;
let skip = 0;

for (const chunk of chunks) {
  if (chunk.vector_embedding.length === 384) {
    console.log(`  ⏭  ${chunk._id} — ya tiene 384 dims, omitido`);
    skip++;
    continue;
  }

  try {
    const vector = await embed(chunk.contenido_segmento);
    await VectorTranscripciones.updateOne(
      { _id: chunk._id },
      { $set: { vector_embedding: vector } }
    );
    console.log(`  ✅ ${chunk._id} — ${vector.length} dims`);
    ok++;
    // Pausa mínima para no saturar el tier gratuito de HF
    await new Promise(r => setTimeout(r, 300));
  } catch (e) {
    console.error(`  ❌ ${chunk._id} — ${e.message}`);
  }
}

await mongoose.disconnect();
console.log(`\nResumen: ${ok} actualizados, ${skip} ya correctos`);
