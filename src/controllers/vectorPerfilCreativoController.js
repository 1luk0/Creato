import { randomUUID } from 'crypto';
import { retrieveCreativos } from '../services/ragService.js';
import { embed } from '../services/embeddingService.js';
import VectorPerfilCreativo from '../models/VectorPerfilCreativo.js';

// GET /api/vector/perfil/search?q=...&limit=5
export async function searchPerfil(req, res) {
  const { q, limit = 5 } = req.query;
  if (!q) return res.status(400).json({ error: 'El parámetro "q" es obligatorio' });

  try {
    const resultados = await retrieveCreativos(q, Number(limit));
    res.json({ query: q, resultados });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// POST /api/vector/perfil
// Crea un vector de perfil creativo y genera automáticamente vector_embedding (MiniLM 384-dim) desde contenido.
export async function crearVectorPerfil(req, res) {
  console.log(`\n[vectorPerfilCreativoController] ── POST /api/vector/perfil ──`);

  const { perfil_creativo_id, tipo, contenido, estrategia_chunking } = req.body ?? {};

  if (!perfil_creativo_id || !tipo || !contenido || !estrategia_chunking) {
    return res.status(400).json({ error: 'Campos obligatorios: perfil_creativo_id, tipo, contenido, estrategia_chunking' });
  }

  try {
    console.log(`[vectorPerfilCreativoController]   generando embedding para perfil...`);
    const vector_embedding = await embed(contenido);
    console.log(`[vectorPerfilCreativoController]   vector_embedding: ${vector_embedding.length} dims`);

    const doc = new VectorPerfilCreativo({
      _id: req.body._id ?? randomUUID(),
      perfil_creativo_id,
      tipo,
      contenido,
      vector_embedding,
      estrategia_chunking
    });

    await doc.save();
    console.log(`[vectorPerfilCreativoController] ✅ Vector perfil creado: ${doc._id}`);
    res.status(201).json(doc);
  } catch (e) {
    console.error(`[vectorPerfilCreativoController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}
