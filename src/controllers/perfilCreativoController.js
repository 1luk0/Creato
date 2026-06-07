import PerfilCreativo from '../models/PerfilCreativo.js';
import Usuario from '../models/Usuarios.js';
import { generarSiguienteId } from '../models/idGeneratorService.js';

export const crear = async (req, res) => {
  try {
    const { user_id, profesiones, habilidades, descripcion, experiencia, foto_perfil } = req.body;

    const usuario = await Usuario.findById(user_id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (usuario.tipo_usuario !== 'CREATIVO') return res.status(403).json({ error: 'Solo usuarios de tipo CREATIVO pueden tener perfil creativo.' });

    const existe = await PerfilCreativo.findOne({ user_id });
    if (existe) return res.status(409).json({ error: 'El usuario ya tiene un perfil creativo.' });

    const _id = await generarSiguienteId('perfil_creativo', 'PC');
    const perfil = new PerfilCreativo({ _id, user_id, profesiones: profesiones || [], habilidades: habilidades || [], descripcion: descripcion || '', experiencia, foto_perfil });
    await perfil.save();

    res.status(201).json(perfil);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const obtenerTodos = async (req, res) => {
  try {
    const perfiles = await PerfilCreativo.find();
    res.json(perfiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const perfil = await PerfilCreativo.findById(req.params.id);
    if (!perfil) return res.status(404).json({ error: 'Perfil creativo no encontrado.' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPorUsuario = async (req, res) => {
  try {
    const perfil = await PerfilCreativo.findOne({ user_id: req.params.userId });
    if (!perfil) return res.status(404).json({ error: 'Perfil creativo no encontrado.' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizar = async (req, res) => {
  try {
    const camposPermitidos = ['profesiones', 'habilidades', 'descripcion', 'experiencia', 'foto_perfil', 'rating_promedio', 'total_resenas', 'vector_descripcion', 'vector_portafolio_global'];
    const actualizacion = {};
    camposPermitidos.forEach(campo => { if (req.body[campo] !== undefined) actualizacion[campo] = req.body[campo]; });

    const perfil = await PerfilCreativo.findByIdAndUpdate(req.params.id, actualizacion, { new: true, runValidators: true });
    if (!perfil) return res.status(404).json({ error: 'Perfil creativo no encontrado.' });
    res.json(perfil);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const eliminar = async (req, res) => {
  try {
    const perfil = await PerfilCreativo.findByIdAndDelete(req.params.id);
    if (!perfil) return res.status(404).json({ error: 'Perfil creativo no encontrado.' });
    res.json({ mensaje: 'Perfil creativo eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
