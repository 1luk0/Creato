import { embed } from './embeddingService.js';
import VectorTranscripciones from '../models/VectorTranscripciones.js';

const VECTOR_INDEX = 'rag_transcripciones';

/**
 * Recupera los chunks más similares a la consulta usando $vectorSearch.
 * @param {string} queryText  Pregunta del usuario
 * @param {string|null} estrategia  Filtra por estrategia de chunking (opcional)
 * @param {number} limit  Número de chunks a devolver (default 3)
 * @returns {Promise<Array>} Chunks con _id, transcripcion_id, contenido_segmento, metadata y score
 */
export async function retrieve(queryText, estrategia = null, limit = 3) {
  const queryVector = await embed(queryText);

  const vectorSearchStage = {
    $vectorSearch: {
      index: VECTOR_INDEX,
      path: 'vector_embedding',
      queryVector,
      numCandidates: limit * 10,
      limit,
      ...(estrategia && { filter: { 'metadata.estrategia_chunking': estrategia } })
    }
  };

  const pipeline = [
    vectorSearchStage,
    {
      $project: {
        _id: 1,
        transcripcion_id: 1,
        contenido_segmento: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ];

  return VectorTranscripciones.aggregate(pipeline);
}
