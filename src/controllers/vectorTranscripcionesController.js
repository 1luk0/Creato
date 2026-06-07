import { retrieve } from '../services/ragService.js';

// GET /api/vector/transcripciones/search?q=...&estrategia=...&limit=5
export async function searchTranscripciones(req, res) {
  const { q, estrategia = null, limit = 5 } = req.query;
  if (!q) return res.status(400).json({ error: 'El parámetro "q" es obligatorio' });

  const resultados = await retrieve(q, estrategia, Number(limit));
  res.json({ query: q, estrategia, resultados });
}
