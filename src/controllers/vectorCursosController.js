import { retrieveCursos } from '../services/ragService.js';
import { embed } from '../services/embeddingService.js';
import VectorCursos from '../models/VectorCursos.js';
import { nuevoIdUuid } from '../utils/ids.js';
import { asegurarReferencia } from '../utils/referencias.js';
import { httpError } from '../utils/httpError.js';

const TIPOS = ['DESCRIPCION', 'TEMARIO', 'OBJETIVO'];

// GET /api/vector/cursos/search?q=...&limit=5
export const searchCursos = async (req, res) => {
  const { q, limit = 5 } = req.query;
  if (!q) throw httpError(400, 'El parámetro "q" es obligatorio');
  const resultados = await retrieveCursos(q, Number(limit));
  res.json({ query: q, resultados });
};

// POST /api/vector/cursos
// La generación del embedding pertenece al pipeline RAG (no a este backend);
// se conserva el auto-embedding existente. Aquí se añade la integridad referencial.
export const crearVectorCurso = async (req, res) => {
  const { curso_id, tipo, contenido, estrategia_chunking } = req.body ?? {};
  if (!curso_id || !tipo || !contenido) throw httpError(400, 'Campos obligatorios: curso_id, tipo, contenido');
  if (!TIPOS.includes(tipo)) throw httpError(400, `tipo inválido. Permitidos: ${TIPOS.join(', ')}`);

  await asegurarReferencia('cursos', curso_id, 'cursos');

  const vector_embedding = await embed(contenido);
  const doc = await VectorCursos.create({
    _id: nuevoIdUuid(req.body._id),
    curso_id,
    tipo,
    contenido,
    vector_embedding,
    estrategia_chunking
  });
  res.status(201).json(doc);
};

// GET /api/vector/cursos  (?curso_id=&tipo=) — omite el embedding del listado.
export const listarVectorCursos = async (req, res) => {
  const filtro = {};
  if (req.query.curso_id) filtro.curso_id = req.query.curso_id;
  if (req.query.tipo) filtro.tipo = req.query.tipo;
  res.json(await VectorCursos.find(filtro).select('-vector_embedding'));
};

// GET /api/vector/cursos/:id
export const obtenerVectorCurso = async (req, res) => {
  const doc = await VectorCursos.findById(req.params.id);
  if (!doc) throw httpError(404, 'Vector de curso no encontrado');
  res.json(doc);
};

// DELETE /api/vector/cursos/:id
export const eliminarVectorCurso = async (req, res) => {
  const doc = await VectorCursos.findByIdAndDelete(req.params.id);
  if (!doc) throw httpError(404, 'Vector de curso no encontrado');
  res.status(204).send();
};
