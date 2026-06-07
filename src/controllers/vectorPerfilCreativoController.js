import VectorPerfilCreativo from '../models/VectorPerfilCreativo.js';
import PerfilCreativo from '../models/PerfilCreativo.js';
import { generarSiguienteId } from '../models/idGeneratorService.js';

export const crear = async (req, res) => {
  try {
    const { perfil_creativo_id, tipo, contenido, vector_embedding, estrategia_chunking } = req.body;

    const perfil = await PerfilCreativo.findById(perfil_creativo_id);
    if (!perfil) return res.status(404).json({ error: 'Perfil creativo no encontrado.' });

    const _id = await generarSiguienteId('vector_perfil_creativo', 'VPC');
    const vector = new VectorPerfilCreativo({ _id, perfil_creativo_id, tipo, contenido, vector_embedding, estrategia_chunking });
    await vector.save();

    res.status(201).json(vector);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const obtenerTodos = async (req, res) => {
  try {
    const { perfil_creativo_id, tipo } = req.query;
    const filtro = {};
    if (perfil_creativo_id) filtro.perfil_creativo_id = perfil_creativo_id;
    if (tipo) filtro.tipo = tipo;
    const vectores = await VectorPerfilCreativo.find(filtro);
    res.json(vectores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const vector = await VectorPerfilCreativo.findById(req.params.id);
    if (!vector) return res.status(404).json({ error: 'Vector de perfil creativo no encontrado.' });
    res.json(vector);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizar = async (req, res) => {
  try {
    const camposPermitidos = ['tipo', 'contenido', 'vector_embedding', 'estrategia_chunking'];
    const actualizacion = {};
    camposPermitidos.forEach(campo => { if (req.body[campo] !== undefined) actualizacion[campo] = req.body[campo]; });

    const vector = await VectorPerfilCreativo.findByIdAndUpdate(req.params.id, actualizacion, { new: true, runValidators: true });
    if (!vector) return res.status(404).json({ error: 'Vector de perfil creativo no encontrado.' });
    res.json(vector);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const eliminar = async (req, res) => {
  try {
    const vector = await VectorPerfilCreativo.findByIdAndDelete(req.params.id);
    if (!vector) return res.status(404).json({ error: 'Vector de perfil creativo no encontrado.' });
    res.json({ mensaje: 'Vector eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
