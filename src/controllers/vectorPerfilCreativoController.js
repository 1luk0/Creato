import { retrieveCreativos } from '../services/ragService.js';

// GET /api/vector/perfil/search?q=...&limit=5
export async function searchPerfil(req, res) {
  const { q, limit = 5 } = req.query;
  if (!q) return res.status(400).json({ error: 'El parámetro "q" es obligatorio' });

  const resultados = await retrieveCreativos(q, Number(limit));
  res.json({ query: q, resultados });
}
