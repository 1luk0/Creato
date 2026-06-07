import { embed } from './embeddingService.js';
import { generarRespuesta } from './llmService.js';
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

/**
 * Construye el prompt para Gemini con los chunks recuperados como contexto.
 * @param {string} queryText  Pregunta original del usuario
 * @param {Array}  chunks     Resultados de retrieve()
 * @returns {string} Prompt completo
 */
export function buildPrompt(queryText, chunks) {
  const contexto = chunks.map((c, i) => {
    const inicio = c.metadata?.minuto_inicio ?? '?';
    const fin    = c.metadata?.minuto_fin    ?? '?';
    return `[Fragmento ${i + 1} — ${inicio}s a ${fin}s]\n${c.contenido_segmento}`;
  }).join('\n\n');

  return `Eres un asistente educativo de la plataforma Kreato. Responde la pregunta del estudiante usando ÚNICAMENTE la información de los fragmentos de video proporcionados. Cita el timestamp del video cuando sea relevante.

CONTEXTO (fragmentos de transcripción):
${contexto}

PREGUNTA: ${queryText}

RESPUESTA:`;
}

/**
 * Pipeline RAG completo para transcripciones: embed → retrieve → buildPrompt → Gemini.
 * @param {string}      queryText   Pregunta del usuario
 * @param {string|null} estrategia  Estrategia de chunking a usar (null = sin filtro)
 * @param {number}      limit       Chunks a recuperar (default 3)
 * @returns {Promise<{respuesta: string, chunks: Array}>}
 */
export async function ragQuery(queryText, estrategia = null, limit = 3) {
  const chunks = await retrieve(queryText, estrategia, limit);
  if (!chunks.length) {
    return {
      respuesta: 'No encontré fragmentos relevantes en las transcripciones disponibles.',
      chunks: []
    };
  }
  const prompt   = buildPrompt(queryText, chunks);
  const respuesta = await generarRespuesta(prompt);
  return { respuesta, chunks };
}
