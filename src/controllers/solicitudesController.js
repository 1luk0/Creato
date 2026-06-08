import Solicitudes from '../models/Solicitudes.js';
import { nuevoIdSecuencial } from '../utils/ids.js';
import { asegurarReferencia } from '../utils/referencias.js';
import { httpError } from '../utils/httpError.js';

const COLECCION = 'solicitudes';
const ESTADOS = ['pendiente', 'aprobada', 'rechazada', 'cancelada'];
const HORA = /^\d{2}:\d{2}$/;

const validarHoras = ({ hora_inicio, hora_fin }) => {
  if (hora_inicio && !HORA.test(hora_inicio)) throw httpError(400, 'hora_inicio debe tener formato HH:MM');
  if (hora_fin && !HORA.test(hora_fin)) throw httpError(400, 'hora_fin debe tener formato HH:MM');
};

// POST /api/solicitudes
export const crearSolicitud = async (req, res) => {
  const { usuario_id, oferta_asesoria_id, descripcion, fecha, hora_inicio, hora_fin, estado } = req.body ?? {};
  if (!usuario_id || !oferta_asesoria_id) {
    throw httpError(400, 'Campos obligatorios: usuario_id, oferta_asesoria_id');
  }
  if (estado && !ESTADOS.includes(estado)) throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  validarHoras({ hora_inicio, hora_fin });

  await asegurarReferencia('usuarios', usuario_id, 'usuarios');
  await asegurarReferencia('oferta_asesoria', oferta_asesoria_id, 'oferta_asesoria');

  const _id = await nuevoIdSecuencial(COLECCION, req.body._id);
  const solicitud = await Solicitudes.create({
    _id,
    usuario_id,
    oferta_asesoria_id,
    descripcion,
    estado: estado ?? 'pendiente',
    fecha: fecha ?? new Date(),
    hora_inicio,
    hora_fin
  });
  res.status(201).json(solicitud);
};

// GET /api/solicitudes  (?usuario_id=&oferta_asesoria_id=&estado=)
export const listarSolicitudes = async (req, res) => {
  const filtro = {};
  for (const campo of ['usuario_id', 'oferta_asesoria_id', 'estado']) {
    if (req.query[campo]) filtro[campo] = req.query[campo];
  }
  res.json(await Solicitudes.find(filtro));
};

// GET /api/solicitudes/:id
export const obtenerSolicitud = async (req, res) => {
  const solicitud = await Solicitudes.findById(req.params.id);
  if (!solicitud) throw httpError(404, 'Solicitud no encontrada');
  res.json(solicitud);
};

// PUT /api/solicitudes/:id
export const actualizarSolicitud = async (req, res) => {
  const { _id, ...cambios } = req.body ?? {};

  if (cambios.estado && !ESTADOS.includes(cambios.estado)) {
    throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  }
  validarHoras(cambios);
  if (cambios.usuario_id) await asegurarReferencia('usuarios', cambios.usuario_id, 'usuarios');
  if (cambios.oferta_asesoria_id) await asegurarReferencia('oferta_asesoria', cambios.oferta_asesoria_id, 'oferta_asesoria');

  const solicitud = await Solicitudes.findByIdAndUpdate(req.params.id, cambios, {
    new: true,
    runValidators: true
  });
  if (!solicitud) throw httpError(404, 'Solicitud no encontrada');
  res.json(solicitud);
};

// PATCH /api/solicitudes/:id/estado — cambio de estado aislado.
export const cambiarEstadoSolicitud = async (req, res) => {
  const { estado } = req.body ?? {};
  if (!estado || !ESTADOS.includes(estado)) {
    throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  }
  const solicitud = await Solicitudes.findByIdAndUpdate(
    req.params.id,
    { estado },
    { new: true, runValidators: true }
  );
  if (!solicitud) throw httpError(404, 'Solicitud no encontrada');
  res.json(solicitud);
};

// DELETE /api/solicitudes/:id
export const eliminarSolicitud = async (req, res) => {
  const solicitud = await Solicitudes.findByIdAndDelete(req.params.id);
  if (!solicitud) throw httpError(404, 'Solicitud no encontrada');
  res.status(204).send();
};
