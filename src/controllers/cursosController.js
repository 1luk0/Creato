import { randomUUID } from 'crypto';
import Cursos from '../models/Cursos.js';
import { nuevoIdSecuencial } from '../utils/ids.js';
import { asegurarReferencia } from '../utils/referencias.js';
import { httpError } from '../utils/httpError.js';

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

  const _id = await nuevoIdSecuencial(COLECCION, req.body._id);
  const curso = await Cursos.create({
    _id,
    nombre,
    descripcion,
    precio,
    categorias,
    creadores,
    capitulos: prepararCapitulos(_id, capitulos)
    // rating_promedio, total_resenas, compras → defaults del modelo
    // vector_contenido → lo llena el pipeline RAG
  });

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

  const curso = await Cursos.findByIdAndUpdate(req.params.id, cambios, {
    new: true,
    runValidators: true
  });
  if (!curso) throw httpError(404, 'Curso no encontrado');
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
