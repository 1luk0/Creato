import { randomUUID } from 'crypto';
import { generarSiguienteId } from '../models/idGeneratorService.js';

// Prefijos por colección. Se alinean a la nomenclatura REAL ya usada en Atlas
// (cur_101, pago_001, trans_999…) para mantener consistencia con los datos del
// equipo, en vez de los prefijos en mayúscula del README.
const PREFIJOS = {
  // entidades con ID generado por el servidor (formato lowercase para consistencia)
  usuarios:         'usr',
  perfil_creativo:  'perf',
  perfil_empresa:   'perf_emp',
  oferta_laboral:   'lab',
  // entidades núcleo (ya existían)
  cursos:           'cur',
  transcripciones:  'trans',
  solicitudes:      'sol',
  pagos:            'pago',
  asesoria:         'ase',
  encargo:          'enc',
  oferta_encargo:   'oe',
  oferta_asesoria:  'oas',
  publicaciones:    'pub',
};

// _id de las 6 colecciones núcleo: contador secuencial por colección (PREFIJO_N).
// Acepta override del cliente para idempotencia y carga de datos de prueba.
export const nuevoIdSecuencial = async (coleccion, idCliente) => {
  if (idCliente) return idCliente;
  const prefijo = PREFIJOS[coleccion];
  if (!prefijo) throw new Error(`Sin prefijo definido para la colección '${coleccion}'`);
  return generarSiguienteId(coleccion, prefijo);
};

// _id de las colecciones vector (sin prefijo en el README): UUID con override,
// igual que los controllers vector ya existentes.
export const nuevoIdUuid = (idCliente) => idCliente ?? randomUUID();
