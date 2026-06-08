import { retrieve } from '../services/ragService.js';
import { embed } from '../services/embeddingService.js';
import VectorTranscripciones from '../models/VectorTranscripciones.js';
import { nuevoIdUuid } from '../utils/ids.js';
import { asegurarReferencia } from '../utils/referencias.js';
import { httpError } from '../utils/httpError.js';

const ESTRATEGIAS = ['fixed_size_v1', 'semantic_split_v1', 'sentence_window_v1'];

// GET /api/vector/transcripciones/search?q=...&estrategia=...&limit=5
export const searchTranscripciones = async (req, res) => {
  const { q, estrategia = null, limit = 5 } = req.query;
  if (!q) throw httpError(400, 'El parámetro "q" es obligatorio');
  const resultados = await retrieve(q, estrategia, Number(limit));
  res.json({ query: q, estrategia, resultados });
};

// POST /api/vector/transcripciones
// El embedding lo genera el pipeline RAG (se conserva el auto-embedding existente);
// aquí se valida la integridad referencial y el metadata.
export const crearChunk = async (req, res) => {
  const { transcripcion_id, contenido_segmento, metadata } = req.body ?? {};
  if (!transcripcion_id || !contenido_segmento || !metadata) {
    throw httpError(400, 'Campos obligatorios: transcripcion_id, contenido_segmento, metadata');
  }
  if (metadata.minuto_inicio == null || metadata.minuto_fin == null || !metadata.estrategia_chunking) {
    throw httpError(400, 'metadata debe incluir: minuto_inicio, minuto_fin, estrategia_chunking');
  }
  if (!ESTRATEGIAS.includes(metadata.estrategia_chunking)) {
    throw httpError(400, `estrategia_chunking inválida. Permitidas: ${ESTRATEGIAS.join(', ')}`);
  }

  await asegurarReferencia('transcripciones', transcripcion_id, 'transcripciones');

  const vector_embedding = await embed(contenido_segmento);
  const doc = await VectorTranscripciones.create({
    _id: nuevoIdUuid(req.body._id),
    transcripcion_id,
    contenido_segmento,
    vector_embedding,
    metadata
  });
  res.status(201).json(doc);
};

// GET /api/vector/transcripciones  (?transcripcion_id=&estrategia=) — omite el embedding.
export const listarChunks = async (req, res) => {
  const filtro = {};
  if (req.query.transcripcion_id) filtro.transcripcion_id = req.query.transcripcion_id;
  if (req.query.estrategia) filtro['metadata.estrategia_chunking'] = req.query.estrategia;
  res.json(await VectorTranscripciones.find(filtro).select('-vector_embedding'));
};

// GET /api/vector/transcripciones/:id
export const obtenerChunk = async (req, res) => {
  const doc = await VectorTranscripciones.findById(req.params.id);
  if (!doc) throw httpError(404, 'Chunk no encontrado');
  res.json(doc);
};

// DELETE /api/vector/transcripciones/:id
export const eliminarChunk = async (req, res) => {
  const doc = await VectorTranscripciones.findByIdAndDelete(req.params.id);
  if (!doc) throw httpError(404, 'Chunk no encontrado');
  res.status(204).send();
};
