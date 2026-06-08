import OfertaAsesoria from '../models/OfertaAsesoria.js';
import { generarSiguienteId } from '../models/idGeneratorService.js';
import { asegurarReferencia } from '../utils/referencias.js';
import { httpError } from '../utils/httpError.js';

const COLECCION   = 'oferta_asesoria';
const PREFIJO     = 'oas';
const HORA        = /^\d{2}:\d{2}$/;
const ESTADOS_SOL = ['pendiente', 'aprobada', 'rechazada'];

const validarHoras = ({ hora_inicio, hora_fin }) => {
  if (hora_inicio && !HORA.test(hora_inicio)) throw httpError(400, 'hora_inicio debe tener formato HH:MM');
  if (hora_fin    && !HORA.test(hora_fin))    throw httpError(400, 'hora_fin debe tener formato HH:MM');
};

// POST /api/oferta-asesoria
export const crearOfertaAsesoria = async (req, res) => {
  const { perfil_creativo_id, tematicas, tarifas, disponibilidad } = req.body ?? {};
  if (!perfil_creativo_id) throw httpError(400, 'Campo obligatorio: perfil_creativo_id');

  await asegurarReferencia('perfil_creativo', perfil_creativo_id, 'perfil_creativo');

  const _id = req.body._id ?? await generarSiguienteId(COLECCION, PREFIJO);
  const oferta = await OfertaAsesoria.create({
    _id,
    perfil_creativo_id,
    tematicas:      tematicas      ?? [],
    tarifas:        tarifas        ?? [],
    disponibilidad: disponibilidad ?? []
  });
  res.status(201).json(oferta);
};

// GET /api/oferta-asesoria  (?perfil_creativo_id=)
export const listarOfertasAsesoria = async (req, res) => {
  const filtro = {};
  if (req.query.perfil_creativo_id) filtro.perfil_creativo_id = req.query.perfil_creativo_id;
  res.json(await OfertaAsesoria.find(filtro));
};

// GET /api/oferta-asesoria/:id
export const obtenerOfertaAsesoria = async (req, res) => {
  const oferta = await OfertaAsesoria.findById(req.params.id);
  if (!oferta) throw httpError(404, 'Oferta de asesoría no encontrada');
  res.json(oferta);
};

// PUT /api/oferta-asesoria/:id — actualiza tematicas, tarifas y disponibilidad.
export const actualizarOfertaAsesoria = async (req, res) => {
  const { _id, perfil_creativo_id, solicitudes_pendientes, ...cambios } = req.body ?? {};
  if (perfil_creativo_id) throw httpError(400, 'perfil_creativo_id no se puede modificar');

  const oferta = await OfertaAsesoria.findByIdAndUpdate(
    req.params.id,
    cambios,
    { new: true, runValidators: true }
  );
  if (!oferta) throw httpError(404, 'Oferta de asesoría no encontrada');
  res.json(oferta);
};

// DELETE /api/oferta-asesoria/:id
export const eliminarOfertaAsesoria = async (req, res) => {
  const oferta = await OfertaAsesoria.findByIdAndDelete(req.params.id);
  if (!oferta) throw httpError(404, 'Oferta de asesoría no encontrada');
  res.status(204).send();
};

// POST /api/oferta-asesoria/:id/solicitudes — agrega solicitud pendiente (máx 10).
export const agregarSolicitudPendiente = async (req, res) => {
  const { usuario_id, hora_inicio, hora_fin } = req.body ?? {};
  if (!usuario_id) throw httpError(400, 'Campo obligatorio: usuario_id');
  validarHoras({ hora_inicio, hora_fin });

  await asegurarReferencia('usuarios', usuario_id, 'usuarios');

  const oferta = await OfertaAsesoria.findById(req.params.id);
  if (!oferta) throw httpError(404, 'Oferta de asesoría no encontrada');
  if (oferta.solicitudes_pendientes.length >= 10) {
    throw httpError(409, 'Máximo de 10 solicitudes pendientes alcanzado');
  }

  const _id = req.body._id ?? `${oferta._id}_sol_${oferta.solicitudes_pendientes.length + 1}`;
  oferta.solicitudes_pendientes.push({ _id, usuario_id, estado: 'pendiente', hora_inicio, hora_fin });
  await oferta.save();
  res.status(201).json(oferta);
};

// PATCH /api/oferta-asesoria/:id/solicitudes/:solId/estado
export const cambiarEstadoSolicitudPendiente = async (req, res) => {
  const { estado } = req.body ?? {};
  if (!estado || !ESTADOS_SOL.includes(estado)) {
    throw httpError(400, `estado inválido. Permitidos: ${ESTADOS_SOL.join(', ')}`);
  }

  const oferta = await OfertaAsesoria.findOneAndUpdate(
    { _id: req.params.id, 'solicitudes_pendientes._id': req.params.solId },
    { $set: { 'solicitudes_pendientes.$.estado': estado } },
    { new: true, runValidators: true }
  );
  if (!oferta) throw httpError(404, 'Oferta o solicitud no encontrada');
  res.json(oferta);
};
