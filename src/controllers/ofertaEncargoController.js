import OfertaEncargo from '../models/OfertaEncargo.js';
import { generarSiguienteId } from '../models/idGeneratorService.js';
import { asegurarReferencia } from '../utils/referencias.js';
import { httpError } from '../utils/httpError.js';
import { embed } from '../services/embeddingService.js';
import { embedImage } from '../services/imageEmbeddingService.js';

const COLECCION      = 'oferta_encargo';
const PREFIJO        = 'oe';
const ESTADOS        = ['abierta', 'en_proceso', 'cerrada', 'cancelada'];
const ESTADOS_POST   = ['activo', 'archivado', 'aceptado'];
const TIPOS          = ['publica', 'privada'];

// POST /api/oferta-encargo
// Genera automáticamente vector_descripcion (MiniLM 384-dim) y vectores_imagenes (CLIP 512-dim).
export const crearOfertaEncargo = async (req, res) => {
  const { usuario_id, descripcion, imagenes, rango_pago, estado, tipo, destinatario, fecha_estimada } = req.body ?? {};

  if (!usuario_id || !descripcion || !rango_pago || !tipo) {
    throw httpError(400, 'Campos obligatorios: usuario_id, descripcion, rango_pago, tipo');
  }
  if (!TIPOS.includes(tipo)) throw httpError(400, `tipo inválido. Permitidos: ${TIPOS.join(', ')}`);
  if (estado && !ESTADOS.includes(estado)) throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  if (rango_pago.min == null || rango_pago.max == null) throw httpError(400, 'rango_pago debe incluir min y max');
  if (rango_pago.min > rango_pago.max) throw httpError(400, 'rango_pago.min no puede ser mayor que rango_pago.max');
  if (tipo === 'privada' && !destinatario) throw httpError(400, 'Una oferta privada requiere destinatario');

  await asegurarReferencia('usuarios', usuario_id, 'usuarios');

  const vector_descripcion = await embed(descripcion);

  const vectores_imagenes = [];
  for (const url of (imagenes ?? [])) {
    try {
      const v = await embedImage(url);
      vectores_imagenes.push(v);
    } catch {
      vectores_imagenes.push([]);
    }
  }

  const _id = req.body._id ?? await generarSiguienteId(COLECCION, PREFIJO);
  const oferta = await OfertaEncargo.create({
    _id,
    usuario_id,
    descripcion,
    vector_descripcion,
    imagenes:         imagenes  ?? [],
    vectores_imagenes,
    rango_pago,
    estado:           estado    ?? 'abierta',
    tipo,
    destinatario:     destinatario ?? null,
    fecha_estimada:   fecha_estimada ?? null,
    postulaciones:    []
  });
  res.status(201).json(oferta);
};

// GET /api/oferta-encargo  (?usuario_id=&estado=&tipo=)
export const listarOfertasEncargo = async (req, res) => {
  const filtro = {};
  for (const campo of ['usuario_id', 'estado', 'tipo']) {
    if (req.query[campo]) filtro[campo] = req.query[campo];
  }
  res.json(await OfertaEncargo.find(filtro));
};

// GET /api/oferta-encargo/:id
export const obtenerOfertaEncargo = async (req, res) => {
  const oferta = await OfertaEncargo.findById(req.params.id);
  if (!oferta) throw httpError(404, 'Oferta de encargo no encontrada');
  res.json(oferta);
};

// PUT /api/oferta-encargo/:id — actualiza campos editables (no referencias base ni postulaciones).
export const actualizarOfertaEncargo = async (req, res) => {
  const { _id, usuario_id, postulaciones, vector_descripcion, vectores_imagenes, ...cambios } = req.body ?? {};
  if (usuario_id) throw httpError(400, 'usuario_id no se puede modificar');
  if (cambios.estado  && !ESTADOS.includes(cambios.estado))  throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  if (cambios.tipo    && !TIPOS.includes(cambios.tipo))      throw httpError(400, `tipo inválido. Permitidos: ${TIPOS.join(', ')}`);
  if (cambios.rango_pago && cambios.rango_pago.min > cambios.rango_pago.max) {
    throw httpError(400, 'rango_pago.min no puede ser mayor que rango_pago.max');
  }

  // Re-vectoriza descripcion si se actualiza
  if (cambios.descripcion) {
    cambios.vector_descripcion = await embed(cambios.descripcion);
  }

  const oferta = await OfertaEncargo.findByIdAndUpdate(
    req.params.id,
    cambios,
    { new: true, runValidators: true }
  );
  if (!oferta) throw httpError(404, 'Oferta de encargo no encontrada');
  res.json(oferta);
};

// PATCH /api/oferta-encargo/:id/estado
export const cambiarEstadoOfertaEncargo = async (req, res) => {
  const { estado } = req.body ?? {};
  if (!estado || !ESTADOS.includes(estado)) throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  const oferta = await OfertaEncargo.findByIdAndUpdate(req.params.id, { estado }, { new: true, runValidators: true });
  if (!oferta) throw httpError(404, 'Oferta de encargo no encontrada');
  res.json(oferta);
};

// DELETE /api/oferta-encargo/:id
export const eliminarOfertaEncargo = async (req, res) => {
  const oferta = await OfertaEncargo.findByIdAndDelete(req.params.id);
  if (!oferta) throw httpError(404, 'Oferta de encargo no encontrada');
  res.status(204).send();
};

// POST /api/oferta-encargo/:id/postulaciones — creativo se postula a la oferta.
export const agregarPostulacion = async (req, res) => {
  const { perfil_creativo_id, precio, fecha_estimada_entrega, cantidad_retroalimentaciones } = req.body ?? {};
  if (!perfil_creativo_id || precio == null) {
    throw httpError(400, 'Campos obligatorios: perfil_creativo_id, precio');
  }

  await asegurarReferencia('perfil_creativo', perfil_creativo_id, 'perfil_creativo');

  const oferta = await OfertaEncargo.findById(req.params.id);
  if (!oferta) throw httpError(404, 'Oferta de encargo no encontrada');
  if (oferta.estado !== 'abierta') throw httpError(409, 'Solo se puede postular a ofertas en estado abierta');

  const yaPostulado = oferta.postulaciones.some(p => p.perfil_creativo_id === perfil_creativo_id);
  if (yaPostulado) throw httpError(409, `El perfil '${perfil_creativo_id}' ya tiene una postulación en esta oferta`);

  const _id = req.body._id ?? `${oferta._id}_post_${oferta.postulaciones.length + 1}`;
  oferta.postulaciones.push({
    _id,
    perfil_creativo_id,
    precio,
    fecha_estimada_entrega: fecha_estimada_entrega ?? null,
    cantidad_retroalimentaciones: cantidad_retroalimentaciones ?? 0,
    estado: 'activo'
  });
  await oferta.save();
  res.status(201).json(oferta);
};

// PATCH /api/oferta-encargo/:id/postulaciones/:postId/estado
export const cambiarEstadoPostulacion = async (req, res) => {
  const { estado } = req.body ?? {};
  if (!estado || !ESTADOS_POST.includes(estado)) {
    throw httpError(400, `estado inválido. Permitidos: ${ESTADOS_POST.join(', ')}`);
  }

  const oferta = await OfertaEncargo.findOneAndUpdate(
    { _id: req.params.id, 'postulaciones._id': req.params.postId },
    { $set: { 'postulaciones.$.estado': estado } },
    { new: true, runValidators: true }
  );
  if (!oferta) throw httpError(404, 'Oferta o postulación no encontrada');
  res.json(oferta);
};
