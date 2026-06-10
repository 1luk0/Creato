import {
  ragQuery,
  retrieve,
  retrieveCreativos,
  retrieveCursos,
  retrieveByImage,
  retrieveTextToImage,
  analizarChunking,
} from '../services/ragService.js';

const ESTRATEGIAS = ['fixed_size_v1', 'sentence_window_v1', 'semantic_split_v1'];

// POST /api/rag
export async function rag(req, res) {
  console.log(`\n[ragController] ── POST /api/rag ──`);
  console.log(`[ragController]   body: ${JSON.stringify(req.body)}`);

  const { query, estrategia = null } = req.body ?? {};
  if (!query) {
    console.log(`[ragController] ❌ Falta el campo "query"`);
    return res.status(400).json({ error: 'El campo "query" es obligatorio' });
  }

  try {
    const result = await ragQuery(query, estrategia);
    console.log(`[ragController] ✅ Respuesta enviada al cliente`);
    res.json(result);
  } catch (e) {
    console.error(`[ragController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

// POST /api/search/transcripciones
export async function searchTranscripciones(req, res) {
  console.log(`\n[ragController] ── POST /api/search/transcripciones ──`);
  console.log(`[ragController]   body: ${JSON.stringify(req.body)}`);

  const { query, estrategia = null, limit = 5 } = req.body ?? {};
  if (!query) {
    console.log(`[ragController] ❌ Falta el campo "query"`);
    return res.status(400).json({ error: 'El campo "query" es obligatorio' });
  }

  console.log(`[ragController]   estrategia: ${estrategia ?? 'ninguna'} | limit: ${limit}`);

  try {
    const resultados = await retrieve(query, estrategia, limit);
    console.log(`[ragController] ✅ ${resultados.length} chunks enviados`);
    res.json({ query, estrategia, resultados });
  } catch (e) {
    console.error(`[ragController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

// POST /api/search/cursos
export async function searchCursos(req, res) {
  console.log(`\n[ragController] ── POST /api/search/cursos ──`);
  console.log(`[ragController]   body: ${JSON.stringify(req.body)}`);

  const { query, limit = 5 } = req.body ?? {};
  if (!query) {
    console.log(`[ragController] ❌ Falta el campo "query"`);
    return res.status(400).json({ error: 'El campo "query" es obligatorio' });
  }

  try {
    const resultados = await retrieveCursos(query, limit);
    console.log(`[ragController] ✅ ${resultados.length} cursos enviados`);
    res.json({ query, resultados });
  } catch (e) {
    console.error(`[ragController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

// POST /api/search/creativos
export async function searchCreativos(req, res) {
  console.log(`\n[ragController] ── POST /api/search/creativos ──`);
  console.log(`[ragController]   body: ${JSON.stringify(req.body)}`);

  const { query, limit = 5 } = req.body ?? {};
  if (!query) {
    console.log(`[ragController] ❌ Falta el campo "query"`);
    return res.status(400).json({ error: 'El campo "query" es obligatorio' });
  }

  try {
    const resultados = await retrieveCreativos(query, limit);
    console.log(`[ragController] ✅ ${resultados.length} perfiles enviados`);
    res.json({ query, resultados });
  } catch (e) {
    console.error(`[ragController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

// POST /api/search/image
export async function searchByImage(req, res) {
  console.log(`\n[ragController] ── POST /api/search/image ──`);
  console.log(`[ragController]   body: ${JSON.stringify(req.body)}`);

  const { image_url, limit = 5 } = req.body ?? {};
  if (!image_url) {
    console.log(`[ragController] ❌ Falta el campo "image_url"`);
    return res.status(400).json({ error: 'El campo "image_url" es obligatorio' });
  }

  console.log(`[ragController]   image_url: ${image_url}`);
  console.log(`[ragController]   limit    : ${limit}`);

  try {
    const resultados = await retrieveByImage(image_url, Number(limit));
    console.log(`[ragController] ✅ Respuesta — ${resultados.length} resultados`);
    res.json({ image_url, total: resultados.length, resultados });
  } catch (e) {
    console.error(`[ragController] ❌ Error en searchByImage: ${e.message}`);
    console.error(e.stack);
    res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0,4) });
  }
}

// POST /api/rag/chunking-analysis
// Una sola llamada vectorSearch: agrupa top-N por estrategia y cruza con stats globales.
export async function chunkingAnalysis(req, res) {
  console.log(`\n[ragController] ── POST /api/rag/chunking-analysis ──`);
  const { query, top_n = 50 } = req.body ?? {};
  if (!query) return res.status(400).json({ error: 'El campo "query" es obligatorio' });

  const topN = Math.min(Math.max(Number(top_n), 10), 150);
  console.log(`[ragController]   query: "${query}" | top_n: ${topN}`);

  try {
    const { queryVector_dims, topN: n, ranking } = await analizarChunking(query, topN);

    const ganador = ranking[0];
    const conclusion = ganador
      ? `"${ganador.estrategia}" lidera con score ponderado ${ganador.score_ponderado} ` +
        `(${ganador.en_top}/${n} chunks en top, ${ganador.porcentaje_top}% de presencia). ` +
        `Longitud promedio de sus chunks: ${ganador.stats_globales.longitud_prom} chars ` +
        `(${ganador.stats_globales.total_chunks} chunks totales en la colección).`
      : 'Sin resultados para esta consulta.';

    console.log(`[ragController] ✅ análisis completado — ganador: ${ganador?.estrategia}`);
    res.json({ query, top_n: n, queryVector_dims, ranking, conclusion });
  } catch (e) {
    console.error(`[ragController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

// POST /api/rag/comparar
// Ejecuta la misma query contra las 3 estrategias y devuelve resultados side-by-side.
export async function compararEstrategias(req, res) {
  console.log(`\n[ragController] ── POST /api/rag/comparar ──`);
  console.log(`[ragController]   body: ${JSON.stringify(req.body)}`);

  const { query, limit = 5 } = req.body ?? {};
  if (!query) {
    return res.status(400).json({ error: 'El campo "query" es obligatorio' });
  }

  try {
    const resultados = {};
    const metricas   = {};

    for (const estrategia of ESTRATEGIAS) {
      const chunks = await retrieve(query, estrategia, Number(limit));
      resultados[estrategia] = chunks;
      metricas[estrategia] = {
        chunks_recuperados: chunks.length,
        score_promedio: chunks.length
          ? Number((chunks.reduce((s, c) => s + (c.score ?? 0), 0) / chunks.length).toFixed(4))
          : 0
      };
    }

    console.log(`[ragController] ✅ comparación completada`);
    res.json({ query, limit: Number(limit), resultados, metricas });
  } catch (e) {
    console.error(`[ragController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

// POST /api/search/multimodal
export async function searchMultimodal(req, res) {
  console.log(`\n[ragController] ── POST /api/search/multimodal ──`);
  console.log(`[ragController]   body: ${JSON.stringify(req.body)}`);

  const { query, limit = 5 } = req.body ?? {};
  if (!query) {
    console.log(`[ragController] ❌ Falta el campo "query"`);
    return res.status(400).json({ error: 'El campo "query" es obligatorio' });
  }

  try {
    const resultados = await retrieveTextToImage(query, limit);
    console.log(`[ragController] ✅ ${resultados.length} publicaciones enviadas`);
    res.json({ query, resultados });
  } catch (e) {
    console.error(`[ragController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}
