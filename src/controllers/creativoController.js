import PerfilCreativo from '../models/PerfilCreativo.js';

export const obtenerPerfilesCreativos = async (req, res) => {
  try {
    const perfiles = await PerfilCreativo.find().populate('usuario cursos');
    res.json(perfiles);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error obteniendo perfiles creativos', error });
  }
};

export const obtenerPerfilCreativoPorId = async (req, res) => {
  try {
    const perfil = await PerfilCreativo.findById(req.params.id).populate('usuario cursos');
    if (!perfil) return res.status(404).json({ mensaje: 'Perfil creativo no encontrado' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error obteniendo perfil creativo', error });
  }
};

export const crearPerfilCreativo = async (req, res) => {
  try {
    const nuevoPerfil = new PerfilCreativo(req.body);
    const perfilGuardado = await nuevoPerfil.save();
    res.status(201).json(perfilGuardado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error creando perfil creativo', error });
  }
};

export const actualizarPerfilCreativo = async (req, res) => {
  try {
    const perfilActualizado = await PerfilCreativo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!perfilActualizado) return res.status(404).json({ mensaje: 'Perfil creativo no encontrado' });
    res.json(perfilActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error actualizando perfil creativo', error });
  }
};

export const eliminarPerfilCreativo = async (req, res) => {
  try {
    const perfilEliminado = await PerfilCreativo.findByIdAndDelete(req.params.id);
    if (!perfilEliminado) return res.status(404).json({ mensaje: 'Perfil creativo no encontrado' });
    res.json({ mensaje: 'Perfil creativo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error eliminando perfil creativo', error });
  }
};
