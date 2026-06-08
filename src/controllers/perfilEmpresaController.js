import PerfilEmpresa from '../models/PerfilEmpresa.js';
import Usuario from '../models/Usuarios.js';
import { generarSiguienteId } from '../models/idGeneratorService.js';

export const crear = async (req, res) => {
  try {
    const { user_id, nit, sector, descripcion, web, logo } = req.body;

    const usuario = await Usuario.findById(user_id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (usuario.tipo_usuario !== 'EMPRESA') return res.status(403).json({ error: 'Solo usuarios de tipo EMPRESA pueden tener perfil empresa.' });

    const existe = await PerfilEmpresa.findOne({ user_id });
    if (existe) return res.status(409).json({ error: 'El usuario ya tiene un perfil empresa.' });

    const _id = await generarSiguienteId('perfil_empresa', 'PE');
    const perfil = new PerfilEmpresa({ _id, user_id, nit, sector, descripcion, web, logo, verificado: false });
    await perfil.save();

    res.status(201).json(perfil);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const obtenerTodos = async (req, res) => {
  try {
    const perfiles = await PerfilEmpresa.find();
    res.json(perfiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const perfil = await PerfilEmpresa.findById(req.params.id);
    if (!perfil) return res.status(404).json({ error: 'Perfil empresa no encontrado.' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPorUsuario = async (req, res) => {
  try {
    const perfil = await PerfilEmpresa.findOne({ user_id: req.params.userId });
    if (!perfil) return res.status(404).json({ error: 'Perfil empresa no encontrado.' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizar = async (req, res) => {
  try {
    const camposPermitidos = ['nit', 'sector', 'descripcion', 'web', 'logo', 'verificado'];
    const actualizacion = {};
    camposPermitidos.forEach(campo => { if (req.body[campo] !== undefined) actualizacion[campo] = req.body[campo]; });

    const perfil = await PerfilEmpresa.findByIdAndUpdate(req.params.id, actualizacion, { new: true, runValidators: true });
    if (!perfil) return res.status(404).json({ error: 'Perfil empresa no encontrado.' });
    res.json(perfil);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const eliminar = async (req, res) => {
  try {
    const perfil = await PerfilEmpresa.findByIdAndDelete(req.params.id);
    if (!perfil) return res.status(404).json({ error: 'Perfil empresa no encontrado.' });
    res.json({ mensaje: 'Perfil empresa eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
