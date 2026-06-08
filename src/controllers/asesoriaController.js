import Asesoria from '../models/Asesoria.js';
import { nuevoIdSecuencial } from '../utils/ids.js';
import { asegurarReferencia } from '../utils/referencias.js';
import { httpError } from '../utils/httpError.js';

const COLECCION = 'asesoria';

// Coherencia de negocio: una asesoría solo se materializa a partir de una
// solicitud aprobada y un pago de tipo ASESORIA efectivamente pagado.
const validarCoherencia = async (pago_id, solicitud_id) => {
  const pago = await asegurarReferencia('pagos', pago_id, 'pagos', { tipo: 1, estado: 1 });
  if (pago.tipo !== 'ASESORIA') throw httpError(409, `El pago '${pago_id}' no es de tipo ASESORIA`);
  if (pago.estado !== 'pagado') throw httpError(409, `El pago '${pago_id}' no está en estado 'pagado' (actual: ${pago.estado})`);

  const solicitud = await asegurarReferencia('solicitudes', solicitud_id, 'solicitudes', { estado: 1 });
  if (solicitud.estado !== 'aprobada') {
    throw httpError(409, `La solicitud '${solicitud_id}' no está 'aprobada' (actual: ${solicitud.estado})`);
  }
};

// POST /api/asesorias
export const crearAsesoria = async (req, res) => {
  const { pago_id, solicitud_id, link_reunion, video_grabacion, transcripcion_id } = req.body ?? {};
  if (!pago_id || !solicitud_id) throw httpError(400, 'Campos obligatorios: pago_id, solicitud_id');

  await validarCoherencia(pago_id, solicitud_id);

  // Una solicitud aprobada genera una única asesoría (evita duplicados).
  if (await Asesoria.exists({ solicitud_id })) {
    throw httpError(409, `Ya existe una asesoría para la solicitud '${solicitud_id}'`);
  }
  if (transcripcion_id) await asegurarReferencia('transcripciones', transcripcion_id, 'transcripciones');

  const _id = await nuevoIdSecuencial(COLECCION, req.body._id);
  const asesoria = await Asesoria.create({
    _id,
    pago_id,
    solicitud_id,
    link_reunion,
    video_grabacion,
    transcripcion_id
  });
  res.status(201).json(asesoria);
};

// GET /api/asesorias  (?solicitud_id=&pago_id=)
export const listarAsesorias = async (req, res) => {
  const filtro = {};
  for (const campo of ['solicitud_id', 'pago_id']) {
    if (req.query[campo]) filtro[campo] = req.query[campo];
  }
  res.json(await Asesoria.find(filtro));
};

// GET /api/asesorias/:id
export const obtenerAsesoria = async (req, res) => {
  const asesoria = await Asesoria.findById(req.params.id);
  if (!asesoria) throw httpError(404, 'Asesoría no encontrada');
  res.json(asesoria);
};

// PUT /api/asesorias/:id — actualiza datos de la reunión/grabación.
// pago_id/solicitud_id no se modifican aquí para no romper la coherencia ya validada.
export const actualizarAsesoria = async (req, res) => {
  const { _id, pago_id, solicitud_id, transcripcion_id, ...cambios } = req.body ?? {};
  if (pago_id || solicitud_id) {
    throw httpError(400, 'pago_id y solicitud_id no se modifican; cree una nueva asesoría si cambian');
  }
  if (transcripcion_id) {
    await asegurarReferencia('transcripciones', transcripcion_id, 'transcripciones');
    cambios.transcripcion_id = transcripcion_id;
  }

  const asesoria = await Asesoria.findByIdAndUpdate(req.params.id, cambios, { new: true, runValidators: true });
  if (!asesoria) throw httpError(404, 'Asesoría no encontrada');
  res.json(asesoria);
};

// PATCH /api/asesorias/:id/transcripcion — vincula la transcripción de la sesión.
export const asignarTranscripcion = async (req, res) => {
  const { transcripcion_id } = req.body ?? {};
  if (!transcripcion_id) throw httpError(400, 'Campo obligatorio: transcripcion_id');
  await asegurarReferencia('transcripciones', transcripcion_id, 'transcripciones');

  const asesoria = await Asesoria.findByIdAndUpdate(
    req.params.id,
    { transcripcion_id },
    { new: true, runValidators: true }
  );
  if (!asesoria) throw httpError(404, 'Asesoría no encontrada');
  res.json(asesoria);
};

// DELETE /api/asesorias/:id
export const eliminarAsesoria = async (req, res) => {
  const asesoria = await Asesoria.findByIdAndDelete(req.params.id);
  if (!asesoria) throw httpError(404, 'Asesoría no encontrada');
  res.status(204).send();
};
