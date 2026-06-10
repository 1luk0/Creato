import Transcripciones from '../models/Transcripciones.js';
import { nuevoIdSecuencial } from '../utils/ids.js';
import { buscarPorId, existeCapituloEnCursos } from '../utils/referencias.js';
import { httpError } from '../utils/httpError.js';
import { procesarTranscripcion, procesarTodasEstrategias } from '../services/ingestaService.js';

const COLECCION = 'transcripciones';
const FORMATO_MINUTO = /^\d{2}:\d{2}$/;

// source_id es polimórfico: un capítulo embebido en cursos o una asesoria._id.
const validarSourceId = async (sourceId) => {
  if (await existeCapituloEnCursos(sourceId)) return;
  if (await buscarPorId('asesoria', sourceId)) return;
  throw httpError(404, `source_id '${sourceId}' no corresponde a un capítulo de curso ni a una asesoría`);
};

// Valida el formato MM:SS de las líneas antes de tocar la BD.
const validarLineas = (lineas = []) => {
  for (const [i, l] of lineas.entries()) {
    if (!l?.minuto || !l?.texto) throw httpError(400, `lineas[${i}] requiere 'minuto' y 'texto'`);
    if (!FORMATO_MINUTO.test(l.minuto)) throw httpError(400, `lineas[${i}].minuto debe tener formato MM:SS`);
  }
};

// POST /api/transcripciones
export const crearTranscripcion = async (req, res) => {
  const { source_id, texto_completo, lineas } = req.body ?? {};
  if (!source_id || !texto_completo) throw httpError(400, 'Campos obligatorios: source_id, texto_completo');
  if (lineas != null && !Array.isArray(lineas)) throw httpError(400, 'lineas debe ser un arreglo');

  await validarSourceId(source_id);
  validarLineas(lineas);

  const _id = await nuevoIdSecuencial(COLECCION, req.body._id);
  const trans = await Transcripciones.create({ _id, source_id, texto_completo, lineas: lineas ?? [] });

  // Pipeline RAG síncrono: las 3 estrategias de chunking se guardan en
  // vector_transcripciones antes de responder. Igual a como publicaciones
  // embeddea la imagen antes de devolver el 201.
  try {
    const resultado = await procesarTodasEstrategias(_id);
    const totales = Object.values(resultado.resultados).map(r => r.chunks_generados);
    console.log(`[transcripciones] ✅ ${_id} — chunks por estrategia: ${totales.join(' / ')}`);
  } catch (err) {
    console.error(`[transcripciones] ⚠️  pipeline RAG falló para ${_id}:`, err.message);
  }

  res.status(201).json(trans);
};

// GET /api/transcripciones  (?source_id=...) — omite los vectores de cada línea.
export const listarTranscripciones = async (req, res) => {
  const filtro = {};
  if (req.query.source_id) filtro.source_id = req.query.source_id;
  const trans = await Transcripciones.find(filtro).select('-lineas.vector_linea');
  res.json(trans);
};

// GET /api/transcripciones/:id
export const obtenerTranscripcion = async (req, res) => {
  const trans = await Transcripciones.findById(req.params.id);
  if (!trans) throw httpError(404, 'Transcripción no encontrada');
  res.json(trans);
};

// PUT /api/transcripciones/:id
export const actualizarTranscripcion = async (req, res) => {
  const { _id, lineas, ...cambios } = req.body ?? {};

  if (cambios.source_id) await validarSourceId(cambios.source_id);
  if (lineas !== undefined) {
    if (!Array.isArray(lineas)) throw httpError(400, 'lineas debe ser un arreglo');
    validarLineas(lineas);
    cambios.lineas = lineas;
  }

  const trans = await Transcripciones.findByIdAndUpdate(req.params.id, cambios, {
    new: true,
    runValidators: true
  });
  if (!trans) throw httpError(404, 'Transcripción no encontrada');
  res.json(trans);
};

// DELETE /api/transcripciones/:id
export const eliminarTranscripcion = async (req, res) => {
  const trans = await Transcripciones.findByIdAndDelete(req.params.id);
  if (!trans) throw httpError(404, 'Transcripción no encontrada');
  res.status(204).send();
};

// POST /api/transcripciones/:id/procesar
// Si se envía { estrategia } procesa solo esa; si no, procesa las 3.
const ESTRATEGIAS_VALIDAS = ['fixed_size_v1', 'sentence_window_v1', 'semantic_split_v1'];

export const procesarChunks = async (req, res) => {
  const { estrategia } = req.body ?? {};

  if (estrategia && !ESTRATEGIAS_VALIDAS.includes(estrategia)) {
    throw httpError(400, `Estrategia inválida. Permitidas: ${ESTRATEGIAS_VALIDAS.join(', ')}`);
  }

  const resultado = estrategia
    ? await procesarTranscripcion(req.params.id, estrategia)
    : await procesarTodasEstrategias(req.params.id);

  res.json(resultado);
};

// POST /api/transcripciones/:id/lineas — agrega una línea embebida.
export const agregarLinea = async (req, res) => {
  const { minuto, texto } = req.body ?? {};
  if (!minuto || !texto) throw httpError(400, "Campos obligatorios de la línea: 'minuto', 'texto'");
  if (!FORMATO_MINUTO.test(minuto)) throw httpError(400, 'minuto debe tener formato MM:SS');

  const trans = await Transcripciones.findById(req.params.id);
  if (!trans) throw httpError(404, 'Transcripción no encontrada');

  trans.lineas.push({ minuto, texto });
  await trans.save();
  res.status(201).json(trans);
};
