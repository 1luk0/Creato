import Transcripciones      from '../models/Transcripciones.js';
import VectorTranscripciones from '../models/VectorTranscripciones.js';
import { embedBatch }        from './embeddingService.js';
import {
  fixedSizeChunks,
  sentenceWindowChunks,
  semanticChunks
} from './chunkingService.js';
import { nuevoIdUuid } from '../utils/ids.js';

const ESTRATEGIAS = ['fixed_size_v1', 'sentence_window_v1', 'semantic_split_v1'];

async function aplicarEstrategia(lineas, estrategia) {
  switch (estrategia) {
    case 'fixed_size_v1':      return fixedSizeChunks(lineas);
    case 'sentence_window_v1': return sentenceWindowChunks(lineas);
    case 'semantic_split_v1':  return semanticChunks(lineas);
    default: throw new Error(`Estrategia desconocida: ${estrategia}`);
  }
}

// Procesa una transcripción con una estrategia: borra chunks anteriores de esa
// estrategia, genera nuevos chunks, los embeddea en batch y los guarda.
export async function procesarTranscripcion(transcripcionId, estrategia) {
  console.log(`\n[ingestaService] procesarTranscripcion — id: ${transcripcionId} | estrategia: ${estrategia}`);

  const trans = await Transcripciones.findById(transcripcionId);
  if (!trans) throw new Error(`Transcripción '${transcripcionId}' no encontrada`);
  if (!trans.lineas?.length) throw new Error(`La transcripción '${transcripcionId}' no tiene líneas`);

  // Borrar chunks anteriores de esta estrategia para esta transcripción
  const { deletedCount } = await VectorTranscripciones.deleteMany({
    transcripcion_id:               transcripcionId,
    'metadata.estrategia_chunking': estrategia
  });
  console.log(`[ingestaService]   chunks eliminados: ${deletedCount}`);

  // Generar chunks con la estrategia elegida
  const chunks = await aplicarEstrategia(trans.lineas, estrategia);
  console.log(`[ingestaService]   chunks generados: ${chunks.length}`);

  if (!chunks.length) {
    return { transcripcion_id: transcripcionId, estrategia, chunks_eliminados: deletedCount, chunks_generados: 0 };
  }

  // Embeddear todos los textos en una sola llamada batch
  const textos   = chunks.map(c => c.contenido);
  const vectores = await embedBatch(textos);

  // Construir documentos para insertar
  const docs = chunks.map((chunk, i) => ({
    _id:                nuevoIdUuid(),
    transcripcion_id:   transcripcionId,
    contenido_segmento: chunk.contenido,
    vector_embedding:   vectores[i],
    metadata: {
      minuto_inicio:        chunk.minuto_inicio,
      minuto_fin:           chunk.minuto_fin,
      estrategia_chunking:  estrategia
    }
  }));

  await VectorTranscripciones.insertMany(docs);
  console.log(`[ingestaService] ✅ ${docs.length} chunks guardados en vector_transcripciones`);

  const longitudes = chunks.map(c => c.contenido.split(/\s+/).length);
  const promedio   = Math.round(longitudes.reduce((a, b) => a + b, 0) / longitudes.length);

  return {
    transcripcion_id:  transcripcionId,
    estrategia,
    chunks_eliminados: deletedCount,
    chunks_generados:  docs.length,
    longitud_promedio_palabras: promedio
  };
}

// Ejecuta las 3 estrategias en secuencia sobre la misma transcripción.
export async function procesarTodasEstrategias(transcripcionId) {
  console.log(`\n[ingestaService] procesarTodasEstrategias — id: ${transcripcionId}`);
  const resultados = {};

  for (const estrategia of ESTRATEGIAS) {
    resultados[estrategia] = await procesarTranscripcion(transcripcionId, estrategia);
  }

  console.log(`[ingestaService] ✅ procesarTodasEstrategias completo`);
  return { transcripcion_id: transcripcionId, resultados };
}
