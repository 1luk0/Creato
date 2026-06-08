import Pagos from '../models/Pagos.js';
import { nuevoIdSecuencial } from '../utils/ids.js';
import { asegurarReferencia } from '../utils/referencias.js';
import { httpError } from '../utils/httpError.js';

const COLECCION = 'pagos';
const TIPOS = ['ENCARGO', 'ASESORIA', 'CURSO'];
const ESTADOS = ['pendiente', 'pagado', 'reembolsado', 'fallido'];
const HORA = /^\d{2}:\d{2}$/;

// pagos es polimórfico: source_id apunta a una colección distinta según tipo.
const COLECCION_POR_TIPO = { ENCARGO: 'encargo', ASESORIA: 'asesoria', CURSO: 'cursos' };

// Valida user_id y el source_id contra la colección que corresponde al tipo.
const validarReferencias = async (tipo, source_id, user_id) => {
  await asegurarReferencia('usuarios', user_id, 'usuarios');
  await asegurarReferencia(COLECCION_POR_TIPO[tipo], source_id, `${COLECCION_POR_TIPO[tipo]} (tipo=${tipo})`);
};

// POST /api/pagos
export const crearPago = async (req, res) => {
  const { tipo, source_id, user_id, monto, fecha, hora, estado } = req.body ?? {};
  if (!tipo || !source_id || !user_id || monto == null) {
    throw httpError(400, 'Campos obligatorios: tipo, source_id, user_id, monto');
  }
  if (!TIPOS.includes(tipo)) throw httpError(400, `tipo inválido. Permitidos: ${TIPOS.join(', ')}`);
  if (estado && !ESTADOS.includes(estado)) throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  if (monto < 0) throw httpError(400, 'monto no puede ser negativo');
  if (hora && !HORA.test(hora)) throw httpError(400, 'hora debe tener formato HH:MM');

  await validarReferencias(tipo, source_id, user_id);

  const _id = await nuevoIdSecuencial(COLECCION, req.body._id);
  const pago = await Pagos.create({
    _id,
    tipo,
    source_id,
    user_id,
    monto,
    fecha: fecha ?? new Date(),
    hora,
    estado: estado ?? 'pendiente'
  });
  res.status(201).json(pago);
};

// GET /api/pagos  (?user_id=&tipo=&estado=&source_id=)
export const listarPagos = async (req, res) => {
  const filtro = {};
  for (const campo of ['user_id', 'tipo', 'estado', 'source_id']) {
    if (req.query[campo]) filtro[campo] = req.query[campo];
  }
  res.json(await Pagos.find(filtro));
};

// GET /api/pagos/:id
export const obtenerPago = async (req, res) => {
  const pago = await Pagos.findById(req.params.id);
  if (!pago) throw httpError(404, 'Pago no encontrado');
  res.json(pago);
};

// PUT /api/pagos/:id
export const actualizarPago = async (req, res) => {
  const { _id, ...cambios } = req.body ?? {};

  if (cambios.tipo && !TIPOS.includes(cambios.tipo)) throw httpError(400, `tipo inválido. Permitidos: ${TIPOS.join(', ')}`);
  if (cambios.estado && !ESTADOS.includes(cambios.estado)) throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  if (cambios.monto != null && cambios.monto < 0) throw httpError(400, 'monto no puede ser negativo');
  if (cambios.hora && !HORA.test(cambios.hora)) throw httpError(400, 'hora debe tener formato HH:MM');

  // Si cambia tipo y/o source_id hay que revalidar la referencia polimórfica de forma coherente.
  const pagoActual = await Pagos.findById(req.params.id);
  if (!pagoActual) throw httpError(404, 'Pago no encontrado');
  const tipoFinal = cambios.tipo ?? pagoActual.tipo;
  if (cambios.user_id) await asegurarReferencia('usuarios', cambios.user_id, 'usuarios');
  if (cambios.tipo || cambios.source_id) {
    const sourceFinal = cambios.source_id ?? pagoActual.source_id;
    await asegurarReferencia(COLECCION_POR_TIPO[tipoFinal], sourceFinal, `${COLECCION_POR_TIPO[tipoFinal]} (tipo=${tipoFinal})`);
  }

  const pago = await Pagos.findByIdAndUpdate(req.params.id, cambios, { new: true, runValidators: true });
  res.json(pago);
};

// PATCH /api/pagos/:id/estado — transición de estado del pago.
export const cambiarEstadoPago = async (req, res) => {
  const { estado } = req.body ?? {};
  if (!estado || !ESTADOS.includes(estado)) {
    throw httpError(400, `estado inválido. Permitidos: ${ESTADOS.join(', ')}`);
  }
  const pago = await Pagos.findByIdAndUpdate(req.params.id, { estado }, { new: true, runValidators: true });
  if (!pago) throw httpError(404, 'Pago no encontrado');
  res.json(pago);
};

// DELETE /api/pagos/:id
export const eliminarPago = async (req, res) => {
  const pago = await Pagos.findByIdAndDelete(req.params.id);
  if (!pago) throw httpError(404, 'Pago no encontrado');
  res.status(204).send();
};
