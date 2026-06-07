import { randomUUID } from 'crypto';
import { retrieve } from '../services/ragService.js';
import { embed } from '../services/embeddingService.js';
import VectorTranscripciones from '../models/VectorTranscripciones.js';

// GET /api/vector/transcripciones/search?q=...&estrategia=...&limit=5
export async function searchTranscripciones(req, res) {
  const { q, estrategia = null, limit = 5 } = req.query;
  if (!q) return res.status(400).json({ error: 'El parámetro "q" es obligatorio' });

  try {
    const resultados = await retrieve(q, estrategia, Number(limit));
    res.json({ query: q, estrategia, resultados });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// POST /api/vector/transcripciones
// Crea un chunk y genera automáticamente vector_embedding (MiniLM 384-dim) desde contenido_segmento.
export async function crearChunk(req, res) {
  console.log(`\n[vectorTranscripcionesController] ── POST /api/vector/transcripciones ──`);

  const { transcripcion_id, contenido_segmento, metadata } = req.body ?? {};

  if (!transcripcion_id || !contenido_segmento || !metadata) {
    return res.status(400).json({ error: 'Campos obligatorios: transcripcion_id, contenido_segmento, metadata' });
  }
  if (!metadata.minuto_inicio == null || !metadata.minuto_fin == null || !metadata.estrategia_chunking) {
    return res.status(400).json({ error: 'metadata debe incluir: minuto_inicio, minuto_fin, estrategia_chunking' });
  }

  try {
    console.log(`[vectorTranscripcionesController]   generando embedding para chunk...`);
    const vector_embedding = await embed(contenido_segmento);
    console.log(`[vectorTranscripcionesController]   vector_embedding: ${vector_embedding.length} dims`);

    const doc = new VectorTranscripciones({
      _id: req.body._id ?? randomUUID(),
      transcripcion_id,
      contenido_segmento,
      vector_embedding,
      metadata
    });

    await doc.save();
    console.log(`[vectorTranscripcionesController] ✅ Chunk creado: ${doc._id}`);
    res.status(201).json(doc);
  } catch (e) {
    console.error(`[vectorTranscripcionesController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}
