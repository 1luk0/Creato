import { randomUUID } from 'crypto';
import { retrieveCursos } from '../services/ragService.js';
import { embed } from '../services/embeddingService.js';
import VectorCursos from '../models/VectorCursos.js';

// GET /api/vector/cursos/search?q=...&limit=5
export async function searchCursos(req, res) {
  const { q, limit = 5 } = req.query;
  if (!q) return res.status(400).json({ error: 'El parámetro "q" es obligatorio' });

  try {
    const resultados = await retrieveCursos(q, Number(limit));
    res.json({ query: q, resultados });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// POST /api/vector/cursos
// Crea un vector de curso y genera automáticamente vector_embedding (MiniLM 384-dim) desde contenido.
export async function crearVectorCurso(req, res) {
  console.log(`\n[vectorCursosController] ── POST /api/vector/cursos ──`);

  const { curso_id, tipo, contenido, estrategia_chunking } = req.body ?? {};

  if (!curso_id || !tipo || !contenido || !estrategia_chunking) {
    return res.status(400).json({ error: 'Campos obligatorios: curso_id, tipo, contenido, estrategia_chunking' });
  }

  try {
    console.log(`[vectorCursosController]   generando embedding para curso...`);
    const vector_embedding = await embed(contenido);
    console.log(`[vectorCursosController]   vector_embedding: ${vector_embedding.length} dims`);

    const doc = new VectorCursos({
      _id: req.body._id ?? randomUUID(),
      curso_id,
      tipo,
      contenido,
      vector_embedding,
      estrategia_chunking
    });

    await doc.save();
    console.log(`[vectorCursosController] ✅ Vector curso creado: ${doc._id}`);
    res.status(201).json(doc);
  } catch (e) {
    console.error(`[vectorCursosController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}
