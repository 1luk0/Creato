import { randomUUID } from 'crypto';
import PerfilCreativo from '../models/PerfilCreativo.js';
import VectorPerfilCreativo from '../models/VectorPerfilCreativo.js';
import { embed } from '../services/embeddingService.js';
import { embedTextForImage } from '../services/imageEmbeddingService.js';
import { httpError } from '../utils/httpError.js';
import { generarSiguienteId } from '../models/idGeneratorService.js';

// Crea (o reemplaza) la entrada en vector_perfil_creativo para el perfil dado.
const vectorizarPerfil = async (perfilId, descripcion, habilidades = [], profesiones = []) => {
  await VectorPerfilCreativo.deleteMany({ perfil_creativo_id: perfilId });
  const chunks = [
    { tipo: 'bio',          contenido: descripcion || `Perfil creativo ${perfilId}` },
    { tipo: 'herramientas', contenido: habilidades.length  ? `Herramientas: ${habilidades.join(', ')}`   : `Habilidades de ${perfilId}` },
    { tipo: 'estilo',       contenido: profesiones.length  ? `Especialidades: ${profesiones.join(', ')}` : `Profesiones de ${perfilId}` },
  ];
  for (const chunk of chunks) {
    try {
      const vector_embedding = await embed(chunk.contenido);
      const _id = await generarSiguienteId('vector_perfil_creativo', 'VPC');
      await VectorPerfilCreativo.create({
        _id,
        perfil_creativo_id:  perfilId,
        tipo:                chunk.tipo,
        contenido:           chunk.contenido,
        vector_embedding,
        estrategia_chunking: 'descripcion_completa',
      });
    } catch (e) {
      console.warn(`[perfilCreativoController] ⚠️  chunk ${chunk.tipo} de ${perfilId}: ${e.message}`);
    }
  }
  console.log(`[perfilCreativoController] ✅ ${perfilId} — 3 chunks en vector_perfil_creativo`);
};

// POST /api/creativos
export async function crearPerfil(req, res) {
  const { user_id, descripcion, profesiones, habilidades, experiencia, foto_perfil } = req.body ?? {};
  if (!user_id || !descripcion) throw httpError(400, 'Campos obligatorios: user_id, descripcion');

  const vector_descripcion      = await embed(descripcion);
  const vector_portafolio_global = await embedTextForImage(descripcion);

  const doc = await PerfilCreativo.create({
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

  // Pipeline vectorial: entrada en vector_perfil_creativo (síncrono)
  await vectorizarPerfil(doc._id, descripcion, doc.habilidades, doc.profesiones);

  res.status(201).json(doc);
}

// GET /api/creativos  (?profesion=&habilidad=&rating_min=)
export async function listarPerfiles(req, res) {
  const filtro = {};
  if (req.query.profesion) filtro.profesiones   = req.query.profesion;
  if (req.query.habilidad) filtro.habilidades   = req.query.habilidad;
  if (req.query.rating_min) filtro.rating_promedio = { $gte: Number(req.query.rating_min) };
  res.json(await PerfilCreativo.find(filtro, { vector_descripcion: 0, vector_portafolio_global: 0 }));
}

// GET /api/perfil-creativo/usuario/:userId
export async function obtenerPerfilPorUsuario(req, res) {
  const doc = await PerfilCreativo.findOne({ user_id: req.params.userId }, { vector_descripcion: 0, vector_portafolio_global: 0 });
  if (!doc) throw httpError(404, 'Perfil creativo no encontrado para ese usuario');
  res.json(doc);
}

// GET /api/creativos/:id
export async function obtenerPerfil(req, res) {
  const doc = await PerfilCreativo.findById(req.params.id, { vector_descripcion: 0, vector_portafolio_global: 0 });
  if (!doc) throw httpError(404, 'Perfil creativo no encontrado');
  res.json(doc);
}

// PUT /api/creativos/:id — actualiza campos editables; re-vectoriza si cambia descripcion.
export async function actualizarPerfil(req, res) {
  const { _id, user_id, vector_descripcion, vector_portafolio_global, rating_promedio, total_resenas, ...cambios } = req.body ?? {};
  if (user_id) throw httpError(400, 'user_id no se puede modificar');

  if (cambios.descripcion) {
    cambios.vector_descripcion      = await embed(cambios.descripcion);
    cambios.vector_portafolio_global = await embedTextForImage(cambios.descripcion);
  }

  const doc = await PerfilCreativo.findByIdAndUpdate(req.params.id, cambios, { new: true, runValidators: true });
  if (!doc) throw httpError(404, 'Perfil creativo no encontrado');

  // Re-vectorizar vector_perfil_creativo si cambió contenido relevante (síncrono)
  if (cambios.descripcion || cambios.habilidades || cambios.profesiones) {
    await vectorizarPerfil(doc._id, doc.descripcion, doc.habilidades, doc.profesiones);
  }

  res.json(doc);
}

// DELETE /api/creativos/:id
export async function eliminarPerfil(req, res) {
  const doc = await PerfilCreativo.findByIdAndDelete(req.params.id);
  if (!doc) throw httpError(404, 'Perfil creativo no encontrado');
  res.status(204).send();
}
