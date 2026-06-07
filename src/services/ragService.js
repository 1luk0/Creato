import { embed } from './embeddingService.js';
import { embedImage, embedTextForImage } from './imageEmbeddingService.js';
import { generarRespuesta } from './llmService.js';
import VectorTranscripciones from '../models/VectorTranscripciones.js';
import VectorPerfilCreativo from '../models/VectorPerfilCreativo.js';
import VectorCursos from '../models/VectorCursos.js';
import Publicaciones from '../models/Publicaciones.js';

const VECTOR_INDEX = 'rag_transcripciones';

export async function retrieve(queryText, estrategia = null, limit = 3) {
  console.log(`[ragService] retrieve() iniciado`);
  console.log(`[ragService]   query     : "${queryText}"`);
  console.log(`[ragService]   estrategia: ${estrategia ?? 'ninguna (sin filtro)'}`);
  console.log(`[ragService]   limit     : ${limit}`);

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

  console.log(`[ragService]   $vectorSearch → índice: "${VECTOR_INDEX}" | numCandidates: ${limit * 10}`);

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

  const resultados = await VectorTranscripciones.aggregate(pipeline);

  console.log(`[ragService] ✅ retrieve() completado — ${resultados.length} chunks recuperados`);
  resultados.forEach((r, i) => {
    console.log(`[ragService]   [${i + 1}] id: ${r._id} | score: ${r.score?.toFixed(4)} | estrategia: ${r.metadata?.estrategia_chunking}`);
  });

  return resultados;
}

export function buildPrompt(queryText, chunks) {
  console.log(`[ragService] buildPrompt() — construyendo prompt con ${chunks.length} chunks`);

  const contexto = chunks.map((c, i) => {
    const inicio = c.metadata?.minuto_inicio ?? '?';
    const fin    = c.metadata?.minuto_fin    ?? '?';
    return `[Fragmento ${i + 1} — ${inicio}s a ${fin}s]\n${c.contenido_segmento}`;
  }).join('\n\n');

  const prompt = `Eres un asistente educativo de la plataforma Kreato. Responde la pregunta del estudiante usando ÚNICAMENTE la información de los fragmentos de video proporcionados. Cita el timestamp del video cuando sea relevante.

CONTEXTO (fragmentos de transcripción):
${contexto}

PREGUNTA: ${queryText}

RESPUESTA:`;

  console.log(`[ragService]   prompt construido — ${prompt.length} chars | ${chunks.length} fragmentos`);
  return prompt;
}

export async function ragQuery(queryText, estrategia = null, limit = 3) {
  console.log(`\n[ragService] ══════════════════════════════════════`);
  console.log(`[ragService] ragQuery() INICIO`);
  console.log(`[ragService]   query     : "${queryText}"`);
  console.log(`[ragService]   estrategia: ${estrategia ?? 'ninguna'}`);
  console.log(`[ragService]   limit     : ${limit}`);

  const chunks = await retrieve(queryText, estrategia, limit);

  if (!chunks.length) {
    console.log(`[ragService] ⚠️  Sin chunks — devolviendo respuesta vacía`);
    return {
      respuesta: 'No encontré fragmentos relevantes en las transcripciones disponibles.',
      chunks: []
    };
  }

  const prompt   = buildPrompt(queryText, chunks);
  const respuesta = await generarRespuesta(prompt);

  console.log(`[ragService] ✅ ragQuery() COMPLETO`);
  console.log(`[ragService] ══════════════════════════════════════\n`);

  return { respuesta, chunks };
}

export async function retrieveCreativos(queryText, limit = 5) {
  console.log(`[ragService] retrieveCreativos() — query: "${queryText}" | limit: ${limit}`);

  const queryVector = await embed(queryText);
  console.log(`[ragService]   $vectorSearch → índice: "rag_vector_perfil"`);

  const resultados = await VectorPerfilCreativo.aggregate([
    { $vectorSearch: { index: 'rag_vector_perfil', path: 'vector_embedding', queryVector, numCandidates: limit * 10, limit } },
    { $project: { _id: 1, perfil_creativo_id: 1, tipo: 1, contenido: 1, score: { $meta: 'vectorSearchScore' } } }
  ]);

  console.log(`[ragService] ✅ retrieveCreativos() — ${resultados.length} resultados`);
  resultados.forEach((r, i) => console.log(`[ragService]   [${i + 1}] id: ${r._id} | score: ${r.score?.toFixed(4)}`));
  return resultados;
}

export async function retrieveCursos(queryText, limit = 5) {
  console.log(`[ragService] retrieveCursos() — query: "${queryText}" | limit: ${limit}`);

  const queryVector = await embed(queryText);
  console.log(`[ragService]   $vectorSearch → índice: "rag_vector_cursos"`);

  const resultados = await VectorCursos.aggregate([
    { $vectorSearch: { index: 'rag_vector_cursos', path: 'vector_embedding', queryVector, numCandidates: limit * 10, limit } },
    { $project: { _id: 1, curso_id: 1, tipo: 1, contenido: 1, score: { $meta: 'vectorSearchScore' } } }
  ]);

  console.log(`[ragService] ✅ retrieveCursos() — ${resultados.length} resultados`);
  resultados.forEach((r, i) => console.log(`[ragService]   [${i + 1}] id: ${r._id} | score: ${r.score?.toFixed(4)}`));
  return resultados;
}

export async function retrieveByImage(imageUrl, limit = 5) {
  console.log(`[ragService] retrieveByImage() — url: ${imageUrl} | limit: ${limit}`);

  const queryVector = await embedImage(imageUrl);
  console.log(`[ragService]   $vectorSearch → índice: "rag_publicaciones_img"`);

  const resultados = await Publicaciones.aggregate([
    { $vectorSearch: { index: 'rag_publicaciones_img', path: 'vector_imagen', queryVector, numCandidates: limit * 10, limit } },
    { $project: { _id: 1, creativo_id: 1, imagen_url: 1, descripcion: 1, categorias: 1, score: { $meta: 'vectorSearchScore' } } }
  ]);

  console.log(`[ragService] ✅ retrieveByImage() — ${resultados.length} resultados`);
  resultados.forEach((r, i) => console.log(`[ragService]   [${i + 1}] id: ${r._id} | score: ${r.score?.toFixed(4)}`));
  return resultados;
}

export async function retrieveTextToImage(texto, limit = 5) {
  console.log(`[ragService] retrieveTextToImage() — texto: "${texto}" | limit: ${limit}`);

  const queryVector = await embedTextForImage(texto);
  console.log(`[ragService]   $vectorSearch → índice: "rag_publicaciones_img"`);

  const resultados = await Publicaciones.aggregate([
    { $vectorSearch: { index: 'rag_publicaciones_img', path: 'vector_imagen', queryVector, numCandidates: limit * 10, limit } },
    { $project: { _id: 1, creativo_id: 1, imagen_url: 1, descripcion: 1, categorias: 1, score: { $meta: 'vectorSearchScore' } } }
  ]);

  console.log(`[ragService] ✅ retrieveTextToImage() — ${resultados.length} resultados`);
  resultados.forEach((r, i) => console.log(`[ragService]   [${i + 1}] id: ${r._id} | score: ${r.score?.toFixed(4)}`));
  return resultados;
}
