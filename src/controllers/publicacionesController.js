import { randomUUID } from 'crypto';
import Publicaciones from '../models/Publicaciones.js';
import { embedImage } from '../services/imageEmbeddingService.js';

// POST /api/publicaciones
// Crea una publicación y genera automáticamente vector_imagen (CLIP 512-dim) desde imagen_url.
export async function crearPublicacion(req, res) {
  console.log(`\n[publicacionesController] ── POST /api/publicaciones ──`);
  console.log(`[publicacionesController]   body: ${JSON.stringify({ ...req.body, vector_imagen: '[omitido]' })}`);

  const { creativo_id, imagen_url, descripcion, categorias, es_portafolio } = req.body ?? {};

  if (!creativo_id || !imagen_url || !descripcion) {
    return res.status(400).json({ error: 'Campos obligatorios: creativo_id, imagen_url, descripcion' });
  }

  try {
    console.log(`[publicacionesController]   generando vector CLIP desde: ${imagen_url}`);
    const vector_imagen = await embedImage(imagen_url);
    console.log(`[publicacionesController]   vector_imagen generado — ${vector_imagen.length} dims`);

    const doc = new Publicaciones({
      _id:          req.body._id ?? randomUUID(),
      creativo_id,
      imagen_url,
      descripcion,
      vector_imagen,
      categorias:   categorias ?? [],
      es_portafolio: es_portafolio ?? false,
      likes_count:  0
    });

    await doc.save();
    console.log(`[publicacionesController] ✅ Publicación creada: ${doc._id}`);
    res.status(201).json(doc);
  } catch (e) {
    console.error(`[publicacionesController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

// GET /api/publicaciones/:id
export async function obtenerPublicacion(req, res) {
  try {
    const doc = await Publicaciones.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Publicación no encontrada' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
