import {
  ragQuery,
  retrieve,
  retrieveCreativos,
  retrieveCursos,
  retrieveByImage,
  retrieveTextToImage,
} from '../services/ragService.js';

// POST /api/rag
// body: { query, estrategia? }
// Devuelve respuesta de Gemini + chunks de transcripción usados como contexto.
export async function rag(req, res) {
  const { query, estrategia = null } = req.body ?? {};
  if (!query) return res.status(400).json({ error: 'El campo "query" es obligatorio' });

  const result = await ragQuery(query, estrategia);
  res.json(result);
}

// POST /api/search
// body: { query, tipo? }  tipo: transcripciones | cursos | creativos (default: transcripciones)
// Devuelve documentos relevantes sin generación LLM.
export async function search(req, res) {
  const { query, tipo = 'transcripciones', estrategia = null, limit = 5 } = req.body ?? {};
  if (!query) return res.status(400).json({ error: 'El campo "query" es obligatorio' });

  let resultados;
  if (tipo === 'cursos') {
    resultados = await retrieveCursos(query, limit);
  } else if (tipo === 'creativos') {
    resultados = await retrieveCreativos(query, limit);
  } else {
    resultados = await retrieve(query, estrategia, limit);
  }
  res.json({ tipo, query, resultados });
}

// POST /api/search/image
// body: { image_url }
// Devuelve publicaciones visualmente similares (imagen-a-imagen).
export async function searchByImage(req, res) {
  const { image_url, limit = 5 } = req.body ?? {};
  if (!image_url) return res.status(400).json({ error: 'El campo "image_url" es obligatorio' });

  const resultados = await retrieveByImage(image_url, limit);
  res.json({ image_url, resultados });
}

// POST /api/search/multimodal
// body: { query }
// Devuelve publicaciones cuyas imágenes coinciden semánticamente con el texto (texto-a-imagen).
export async function searchMultimodal(req, res) {
  const { query, limit = 5 } = req.body ?? {};
  if (!query) return res.status(400).json({ error: 'El campo "query" es obligatorio' });

  const resultados = await retrieveTextToImage(query, limit);
  res.json({ query, resultados });
}
