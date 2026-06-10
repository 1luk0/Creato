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
  console.log(`\n[ragService] ══ retrieveByImage() ══`);
  console.log(`[ragService]   url   : ${imageUrl}`);
  console.log(`[ragService]   limit : ${limit}`);

  // 1. Generar embedding de la imagen
  console.log(`[ragService]   ⏳ Descargando y embeddiendo imagen...`);
  let queryVector;
  try {
    queryVector = await embedImage(imageUrl);
  } catch (e) {
    console.error(`[ragService]   ❌ embedImage() falló: ${e.message}`);
    throw e;
  }
  console.log(`[ragService]   ✅ embedImage() OK — dims: ${queryVector.length} | primeros 3: [${queryVector.slice(0,3).map(v=>v.toFixed(4)).join(', ')}]`);

  // 2. Contar publicaciones con vector_imagen válido en DB
  const totalConVector = await Publicaciones.countDocuments({ vector_imagen: { $exists: true, $not: { $size: 0 } } });
  console.log(`[ragService]   📊 publicaciones con vector_imagen: ${totalConVector}`);

  // 3. Ejecutar $vectorSearch
  const pipeline = [
    {
      $vectorSearch: {
        index:         'rag_publicaciones_img',
        path:          'vector_imagen',
        queryVector,
        numCandidates: Math.max(limit * 10, 50),
        limit,
      }
    },
    { $project: { _id: 1, creativo_id: 1, imagen_url: 1, descripcion: 1, categorias: 1, score: { $meta: 'vectorSearchScore' } } }
  ];

  console.log(`[ragService]   🔍 $vectorSearch → índice: "rag_publicaciones_img" | numCandidates: ${Math.max(limit * 10, 50)}`);

  let resultados;
  try {
    resultados = await Publicaciones.aggregate(pipeline);
  } catch (e) {
    console.error(`[ragService]   ❌ $vectorSearch falló: ${e.message}`);
    throw e;
  }

  if (resultados.length === 0) {
    console.warn(`[ragService]   ⚠️  0 resultados — posibles causas:`);
    console.warn(`[ragService]      1. El índice "rag_publicaciones_img" no existe en Atlas UI`);
    console.warn(`[ragService]      2. El índice tiene numDimensions distinto de 512`);
    console.warn(`[ragService]      3. El índice aún está construyéndose (estado BUILDING)`);
  } else {
    console.log(`[ragService]   ✅ ${resultados.length} publicaciones similares encontradas`);
    resultados.forEach((r, i) => console.log(`[ragService]      [${i+1}] ${r._id} | score: ${r.score?.toFixed(4)} | ${r.imagen_url?.slice(0,60)}`));
  }

  console.log(`[ragService] ══ retrieveByImage() FIN ══\n`);
  return resultados;
}

// Analiza el rendimiento de las 3 estrategias de chunking con UNA sola llamada a vectorSearch.
// Agrupa los top-N resultados por estrategia y cruza con stats globales de los chunks en DB.
export async function analizarChunking(queryText, topN = 50) {
  console.log(`\n[ragService] ══ analizarChunking() ══`);
  console.log(`[ragService]   query: "${queryText}" | topN: ${topN}`);

  const queryVector = await embed(queryText);
  console.log(`[ragService]   ✅ query embeddida — ${queryVector.length} dims`);

  // ── Pipeline: 1 vectorSearch → project score → group por estrategia ──────
  const pipeline = [
    {
      $vectorSearch: {
        index:         VECTOR_INDEX,
        path:          'vector_embedding',
        queryVector,
        numCandidates: Math.max(topN * 3, 150),
        limit:         topN,
      }
    },
    {
      $project: {
        estrategia: '$metadata.estrategia_chunking',
        score:      { $meta: 'vectorSearchScore' },
        longitud:   { $strLenCP: '$contenido_segmento' },
        segmento:   { $substr: ['$contenido_segmento', 0, 120] },
      }
    },
    {
      $group: {
        _id:                  '$estrategia',
        en_top:               { $sum: 1 },
        score_ponderado:      { $avg: '$score' },
        score_max:            { $max: '$score' },
        score_min:            { $min: '$score' },
        longitud_promedio_top:{ $avg: '$longitud' },
        mejor_chunk:          { $first: '$segmento' },
      }
    },
    { $sort: { score_ponderado: -1 } }
  ];

  console.log(`[ragService]   🔍 ejecutando pipeline (vectorSearch → group)...`);
  const porEstrategia = await VectorTranscripciones.aggregate(pipeline);
  console.log(`[ragService]   ✅ ${porEstrategia.length} estrategias en top-${topN}`);

  // ── Stats globales (sin vectorSearch — solo aggregate sobre la colección) ──
  const statsGlobales = await VectorTranscripciones.aggregate([
    {
      $group: {
        _id:           '$metadata.estrategia_chunking',
        total_chunks:  { $sum: 1 },
        longitud_prom: { $avg: { $strLenCP: '$contenido_segmento' } },
        longitud_max:  { $max: { $strLenCP: '$contenido_segmento' } },
        longitud_min:  { $min: { $strLenCP: '$contenido_segmento' } },
      }
    }
  ]);

  const statsMap = Object.fromEntries(statsGlobales.map(s => [s._id, s]));

  // ── Combinar resultados ───────────────────────────────────────────────────
  const ranking = porEstrategia.map((e, i) => {
    const g = statsMap[e._id] ?? {};
    const resultado = {
      posicion:              i + 1,
      estrategia:            e._id,
      en_top:                e.en_top,
      porcentaje_top:        Number(((e.en_top / topN) * 100).toFixed(1)),
      score_ponderado:       Number(e.score_ponderado.toFixed(4)),
      score_max:             Number(e.score_max.toFixed(4)),
      score_min:             Number(e.score_min.toFixed(4)),
      longitud_promedio_top: Math.round(e.longitud_promedio_top),
      mejor_fragmento:       e.mejor_chunk,
      stats_globales: {
        total_chunks:   g.total_chunks  ?? 0,
        longitud_prom:  Math.round(g.longitud_prom  ?? 0),
        longitud_max:   g.longitud_max  ?? 0,
        longitud_min:   g.longitud_min  ?? 0,
      }
    };
    console.log(`[ragService]   [${i+1}] ${e._id} — en_top: ${e.en_top}/${topN} (${resultado.porcentaje_top}%) | score_pond: ${resultado.score_ponderado}`);
    return resultado;
  });

  // Añadir estrategias con 0 resultados en top (existen en DB pero no aparecieron)
  for (const [estrategia, g] of Object.entries(statsMap)) {
    if (!ranking.find(r => r.estrategia === estrategia)) {
      ranking.push({
        posicion:              ranking.length + 1,
        estrategia,
        en_top:                0,
        porcentaje_top:        0,
        score_ponderado:       0,
        score_max:             0,
        score_min:             0,
        longitud_promedio_top: 0,
        mejor_fragmento:       null,
        stats_globales: {
          total_chunks:  g.total_chunks,
          longitud_prom: Math.round(g.longitud_prom),
          longitud_max:  g.longitud_max,
          longitud_min:  g.longitud_min,
        }
      });
      console.log(`[ragService]   [—] ${estrategia} — no apareció en el top-${topN}`);
    }
  }

  console.log(`[ragService] ══ analizarChunking() FIN ══\n`);
  return { queryVector_dims: queryVector.length, topN, ranking };
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
