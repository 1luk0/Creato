import { randomUUID } from 'crypto';
import Cursos from '../models/Cursos.js';
import VectorCursos from '../models/VectorCursos.js';
import { nuevoIdSecuencial, nuevoIdUuid } from '../utils/ids.js';
import { asegurarReferencia } from '../utils/referencias.js';
import { httpError } from '../utils/httpError.js';
import { embed } from '../services/embeddingService.js';

// Genera los 3 chunks de vector_cursos para un curso (reemplaza los existentes).
const vectorizarCurso = async (curso) => {
  await VectorCursos.deleteMany({ curso_id: curso._id });
  const caps    = curso.capitulos ?? [];
  const temario = caps.map(c => c.titulo).filter(Boolean).join(' | ');
  const chunks  = [
    { tipo: 'DESCRIPCION', contenido: `${curso.nombre}. ${curso.descripcion}` },
    { tipo: 'TEMARIO',     contenido: temario ? `Temario de "${curso.nombre}": ${temario}` : curso.nombre },
    { tipo: 'OBJETIVO',    contenido: `Curso de ${(curso.categorias ?? []).join(', ')}: ${curso.nombre}` },
  ];
  for (const chunk of chunks) {
    try {
      const vector_embedding = await embed(chunk.contenido);
      await VectorCursos.create({ _id: nuevoIdUuid(), curso_id: curso._id, tipo: chunk.tipo, contenido: chunk.contenido, vector_embedding });
    } catch (e) {
      console.warn(`[cursosController] ⚠️  chunk ${chunk.tipo} de ${curso._id}: ${e.message}`);
    }
  }
  console.log(`[cursosController] ✅ ${curso._id} — 3 chunks en vector_cursos`);
};

const COLECCION = 'cursos';

// Verifica que todos los creadores referenciados existan en usuarios.
const validarCreadores = async (creadores) => {
  await Promise.all(creadores.map((id) => asegurarReferencia('usuarios', id, 'usuarios')));
};

// Asegura un _id string en cada capítulo embebido (el validator lo exige).
// Si el cliente no lo envía se deriva del curso para mantenerlo legible.
const prepararCapitulos = (cursoId, capitulos = []) =>
  capitulos.map((cap) => ({
    ...cap,
    _id: cap._id ?? `${cursoId}_cap_${cap.orden ?? randomUUID()}`
  }));

// POST /api/cursos
export const crearCurso = async (req, res) => {
  const { nombre, descripcion, precio, categorias, creadores, capitulos } = req.body ?? {};

  if (!nombre || !descripcion || precio == null || !Array.isArray(categorias) || !Array.isArray(creadores)) {
    throw httpError(400, 'Campos obligatorios: nombre, descripcion, precio, categorias[], creadores[]');
  }
  if (precio < 0) throw httpError(400, 'precio no puede ser negativo');
  if (creadores.length === 0) throw httpError(400, 'creadores[] no puede estar vacío');

  await validarCreadores(creadores);

  const vector_contenido = await embed(`${nombre}. ${descripcion}`);

  const _id = await nuevoIdSecuencial(COLECCION, req.body._id);
  const curso = await Cursos.create({
    _id,
    nombre,
    descripcion,
    precio,
    categorias,
    creadores,
    capitulos: prepararCapitulos(_id, capitulos),
    vector_contenido,
  });

  // Pipeline vectorial: 3 chunks en vector_cursos (síncrono antes del 201)
  try {
    await vectorizarCurso(curso);
  } catch (e) {
    console.warn(`[cursosController] ⚠️  Pipeline vector_cursos falló para ${_id}: ${e.message}`);
  }

  res.status(201).json(curso);
};

// GET /api/cursos  (?categoria=...&creador=...)
// Se omite vector_contenido para no inflar la respuesta del listado.
export const listarCursos = async (req, res) => {
  const filtro = {};
  if (req.query.categoria) filtro.categorias = req.query.categoria;
  if (req.query.creador) filtro.creadores = req.query.creador;

  const cursos = await Cursos.find(filtro).select('-vector_contenido');
  res.json(cursos);
};

// GET /api/cursos/:id
export const obtenerCurso = async (req, res) => {
  const curso = await Cursos.findById(req.params.id);
  if (!curso) throw httpError(404, 'Curso no encontrado');
  res.json(curso);
};

// PUT /api/cursos/:id
export const actualizarCurso = async (req, res) => {
  const { vector_contenido, _id, ...cambios } = req.body ?? {}; // _id y vector no se actualizan por esta vía

  if (cambios.precio != null && cambios.precio < 0) throw httpError(400, 'precio no puede ser negativo');
  if (cambios.creadores) {
    if (!Array.isArray(cambios.creadores) || cambios.creadores.length === 0) {
      throw httpError(400, 'creadores[] debe ser un arreglo no vacío');
    }
    await validarCreadores(cambios.creadores);
  }

  // Re-embed vector_contenido si cambia el texto principal
  if (cambios.nombre || cambios.descripcion) {
    const actual = await Cursos.findById(req.params.id);
    if (!actual) throw httpError(404, 'Curso no encontrado');
    const nom  = cambios.nombre       ?? actual.nombre;
    const desc = cambios.descripcion  ?? actual.descripcion;
    cambios.vector_contenido = await embed(`${nom}. ${desc}`);
  }

  const curso = await Cursos.findByIdAndUpdate(req.params.id, cambios, {
    new: true,
    runValidators: true
  });
  if (!curso) throw httpError(404, 'Curso no encontrado');

  // Re-vectorizar vector_cursos si cambió contenido relevante (fire-and-forget)
  if (cambios.nombre || cambios.descripcion || cambios.categorias || cambios.capitulos) {
    vectorizarCurso(curso).catch(e =>
      console.warn(`[cursosController] ⚠️  Re-vectorización fallida: ${e.message}`)
    );
  }

  res.json(curso);
};

// DELETE /api/cursos/:id
export const eliminarCurso = async (req, res) => {
  const curso = await Cursos.findByIdAndDelete(req.params.id);
  if (!curso) throw httpError(404, 'Curso no encontrado');
  res.status(204).send();
};

// POST /api/cursos/:id/capitulos  — agrega un capítulo embebido.
export const agregarCapitulo = async (req, res) => {
  const { orden, titulo, video_url, recursos } = req.body ?? {};
  if (orden == null || !titulo) throw httpError(400, 'Campos obligatorios del capítulo: orden, titulo');
  if (orden < 1) throw httpError(400, 'orden debe ser >= 1');

  const curso = await Cursos.findById(req.params.id);
  if (!curso) throw httpError(404, 'Curso no encontrado');

  curso.capitulos.push({
    _id: req.body._id ?? `${curso._id}_cap_${orden}`,
    orden,
    titulo,
    video_url,
    recursos: recursos ?? []
  });
  await curso.save();
  res.status(201).json(curso);
};
