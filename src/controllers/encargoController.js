import Encargo from '../models/Encargo.js';
import { nuevoIdSecuencial } from '../utils/ids.js';
import { asegurarReferencia, buscarPostulacionEmbebida } from '../utils/referencias.js';
import { httpError } from '../utils/httpError.js';

const COLECCION = 'encargo';
const ESTADOS = ['inicio', 'activo', 'revision', 'finalizado', 'cancelado'];

// Valida las tres referencias del encargo de forma coherente:
//  - la oferta de encargo existe
//  - la postulación está embebida DENTRO de esa oferta (no es colección)
//  - el pago existe y es de tipo ENCARGO
const validarReferencias = async (oferta_encargo_id, postulacion_id, pago_id) => {
  await asegurarReferencia('oferta_encargo', oferta_encargo_id, 'oferta_encargo');

  const encontrada = await buscarPostulacionEmbebida(oferta_encargo_id, postulacion_id);
  if (!encontrada) {
    throw httpError(404, `La postulación '${postulacion_id}' no existe dentro de la oferta '${oferta_encargo_id}'`);
  }

  const pago = await asegurarReferencia('pagos', pago_id, 'pagos', { tipo: 1 });
  if (pago.tipo !== 'ENCARGO') throw httpError(409, `El pago '${pago_id}' no es de tipo ENCARGO`);
};

// POST /api/encargos
export const crearEncargo = async (req, res) => {
  const { oferta_encargo_id, postulacion_id, fecha_max, pago_id, retroalimentaciones_acordadas, estado } = req.body ?? {};
  if (!oferta_encargo_id || !postulacion_id || !fecha_max || !pago_id) {
    throw httpError(400, 'Campos obligatorios: oferta_encargo_id, postulacion_id, fecha_max, pago_id');
  }
  if (estado && !ESTADOS.includes(estado)) throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  if (retroalimentaciones_acordadas != null && retroalimentaciones_acordadas < 0) {
    throw httpError(400, 'retroalimentaciones_acordadas no puede ser negativo');
  }

  await validarReferencias(oferta_encargo_id, postulacion_id, pago_id);

  const _id = await nuevoIdSecuencial(COLECCION, req.body._id);
  const encargo = await Encargo.create({
    _id,
    oferta_encargo_id,
    postulacion_id,
    fecha_max,
    pago_id,
    retroalimentaciones_acordadas,
    estado: estado ?? 'inicio'
  });
  res.status(201).json(encargo);
};

// GET /api/encargos  (?oferta_encargo_id=&estado=&pago_id=)
export const listarEncargos = async (req, res) => {
  const filtro = {};
  for (const campo of ['oferta_encargo_id', 'estado', 'pago_id']) {
    if (req.query[campo]) filtro[campo] = req.query[campo];
  }
  res.json(await Encargo.find(filtro));
};

// GET /api/encargos/:id
export const obtenerEncargo = async (req, res) => {
  const encargo = await Encargo.findById(req.params.id);
  if (!encargo) throw httpError(404, 'Encargo no encontrado');
  res.json(encargo);
};

// PUT /api/encargos/:id — campos editables del encargo (no las referencias base).
export const actualizarEncargo = async (req, res) => {
  const { _id, oferta_encargo_id, postulacion_id, pago_id, entregas, retroalimentaciones, ...cambios } = req.body ?? {};
  if (oferta_encargo_id || postulacion_id || pago_id) {
    throw httpError(400, 'oferta_encargo_id, postulacion_id y pago_id no se modifican por esta vía');
  }
  if (cambios.estado && !ESTADOS.includes(cambios.estado)) {
    throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  }
  if (cambios.retroalimentaciones_acordadas != null && cambios.retroalimentaciones_acordadas < 0) {
    throw httpError(400, 'retroalimentaciones_acordadas no puede ser negativo');
  }

  const encargo = await Encargo.findByIdAndUpdate(req.params.id, cambios, { new: true, runValidators: true });
  if (!encargo) throw httpError(404, 'Encargo no encontrado');
  res.json(encargo);
};

// PATCH /api/encargos/:id/estado
export const cambiarEstadoEncargo = async (req, res) => {
  const { estado } = req.body ?? {};
  if (!estado || !ESTADOS.includes(estado)) throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  const encargo = await Encargo.findByIdAndUpdate(req.params.id, { estado }, { new: true, runValidators: true });
  if (!encargo) throw httpError(404, 'Encargo no encontrado');
  res.json(encargo);
};

// POST /api/encargos/:id/entregas — registra una entrega del creativo.
export const agregarEntrega = async (req, res) => {
  const { titulo, archivos, comentarios, fecha } = req.body ?? {};
  if (!titulo) throw httpError(400, 'Campo obligatorio de la entrega: titulo');

  const encargo = await Encargo.findById(req.params.id);
  if (!encargo) throw httpError(404, 'Encargo no encontrado');

  encargo.entregas.push({
    _id: req.body._id ?? `${encargo._id}_ent_${encargo.entregas.length + 1}`,
    titulo,
    archivos: archivos ?? [],
    fecha: fecha ?? new Date(),
    comentarios
  });
  await encargo.save();
  res.status(201).json(encargo);
};

// POST /api/encargos/:id/retroalimentaciones — añade una retroalimentación,
// respetando el cupo acordado (coherencia de negocio).
export const agregarRetroalimentacion = async (req, res) => {
  const { titulo, contenido } = req.body ?? {};
  if (!titulo || !contenido) throw httpError(400, 'Campos obligatorios: titulo, contenido');

  const encargo = await Encargo.findById(req.params.id);
  if (!encargo) throw httpError(404, 'Encargo no encontrado');

  const acordadas = encargo.retroalimentaciones_acordadas;
  if (acordadas != null && encargo.retroalimentaciones.length >= acordadas) {
    throw httpError(409, `Se alcanzó el máximo de retroalimentaciones acordadas (${acordadas})`);
  }

  const numero = encargo.retroalimentaciones.length + 1;
  encargo.retroalimentaciones.push({
    _id: req.body._id ?? `${encargo._id}_ret_${numero}`,
    titulo,
    contenido,
    numero
  });
  await encargo.save();
  res.status(201).json(encargo);
};

// DELETE /api/encargos/:id
export const eliminarEncargo = async (req, res) => {
  const encargo = await Encargo.findByIdAndDelete(req.params.id);
  if (!encargo) throw httpError(404, 'Encargo no encontrado');
  res.status(204).send();
};
