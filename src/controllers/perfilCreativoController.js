import { randomUUID } from 'crypto';
import PerfilCreativo from '../models/PerfilCreativo.js';
import { embed } from '../services/embeddingService.js';
import { embedTextForImage } from '../services/imageEmbeddingService.js';

// POST /api/perfil-creativo
// Crea un perfil y genera automáticamente:
//   - vector_descripcion (MiniLM 384-dim) desde descripcion
//   - vector_portafolio_global (CLIP 512-dim) bootstrap desde descripcion
//     (se actualizará cuando se agreguen publicaciones al portafolio)
export async function crearPerfil(req, res) {
  console.log(`\n[perfilCreativoController] ── POST /api/perfil-creativo ──`);
  console.log(`[perfilCreativoController]   body: ${JSON.stringify({ ...req.body, vector_descripcion: '[omitido]' })}`);

  const { user_id, descripcion, profesiones, habilidades, experiencia, foto_perfil } = req.body ?? {};

  if (!user_id || !descripcion) {
    return res.status(400).json({ error: 'Campos obligatorios: user_id, descripcion' });
  }

  try {
    console.log(`[perfilCreativoController]   generando vector_descripcion (MiniLM)...`);
    const vector_descripcion = await embed(descripcion);

    console.log(`[perfilCreativoController]   generando vector_portafolio_global (CLIP bootstrap)...`);
    const vector_portafolio_global = await embedTextForImage(descripcion);

    console.log(`[perfilCreativoController]   vector_descripcion: ${vector_descripcion.length} dims | vector_portafolio_global: ${vector_portafolio_global.length} dims`);

    const doc = new PerfilCreativo({
      _id:                      req.body._id ?? randomUUID(),
      user_id,
      descripcion,
      profesiones:              profesiones ?? [],
      habilidades:              habilidades ?? [],
      experiencia:              experiencia ?? '',
      vector_descripcion,
      vector_portafolio_global,
      foto_perfil:              foto_perfil ?? null,
      rating_promedio:          0,
      total_resenas:            0
    });

    await doc.save();
    console.log(`[perfilCreativoController] ✅ Perfil creado: ${doc._id}`);
    res.status(201).json(doc);
  } catch (e) {
    console.error(`[perfilCreativoController] ❌ Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

// GET /api/perfil-creativo/:id
export async function obtenerPerfil(req, res) {
  try {
    const doc = await PerfilCreativo.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
