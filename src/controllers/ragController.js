import {
  ragQuery,
  retrieve,
  retrieveCreativos,
  retrieveCursos,
  retrieveByImage,
  retrieveTextToImage,
} from '../services/ragService.js';

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

  try {
    const resultados = await retrieveByImage(image_url, limit);
    console.log(`[ragController] ✅ ${resultados.length} publicaciones similares enviadas`);
    res.json({ image_url, resultados });
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
