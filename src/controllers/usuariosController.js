import mongoose from 'mongoose';
import Usuario from '../models/Usuarios.js';
import PerfilCreativo from '../models/PerfilCreativo.js';
import PerfilEmpresa from '../models/PerfilEmpresa.js';
import { generarSiguienteId } from '../models/idGeneratorService.js';

const crearPerfilMinimo = async (tipo, userId, datosExtra = {}) => {
  if (tipo === 'CREATIVO') {
    const _id = await generarSiguienteId('perfil_creativo', 'PC');
    await new PerfilCreativo({ _id, user_id: userId, profesiones: [], habilidades: [], descripcion: '' }).save();
  } else if (tipo === 'EMPRESA') {
    const _id = await generarSiguienteId('perfil_empresa', 'PE');
    await new PerfilEmpresa({
      _id,
      user_id: userId,
      nit: datosExtra.nit || '000.000.000-0',
      sector: datosExtra.sector || 'Por definir',
      descripcion: datosExtra.descripcion || 'Por completar'
    }).save();
  }
};

const eliminarPerfilExistente = async (tipo, userId) => {
  if (tipo === 'CREATIVO') await PerfilCreativo.deleteOne({ user_id: userId });
  else if (tipo === 'EMPRESA') await PerfilEmpresa.deleteOne({ user_id: userId });
};

export const crear = async (req, res) => {
  try {
    const { nombre, telefono, correo, password, tipo_usuario, intereses, nit, sector, descripcion } = req.body;

    const _id = await generarSiguienteId('usuarios', 'US');
    const usuario = new Usuario({ _id, nombre, telefono, correo, password, tipo_usuario, intereses: intereses || [], fecha_registro: new Date() });
    await usuario.save();

    await crearPerfilMinimo(tipo_usuario, _id, { nit, sector, descripcion });

    const { password: _, ...respuesta } = usuario.toObject();
    res.status(201).json(respuesta);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const obtenerTodos = async (req, res) => {
  try {
    const { tipo_usuario } = req.query;
    const filtro = tipo_usuario ? { tipo_usuario } : {};
    const usuarios = await Usuario.find(filtro).select('-password');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_usuario: nuevoTipo, nit, sector, descripcion, ...restoBody } = req.body;

    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (nuevoTipo && nuevoTipo !== usuario.tipo_usuario) {
      await eliminarPerfilExistente(usuario.tipo_usuario, id);
      await crearPerfilMinimo(nuevoTipo, id, { nit, sector, descripcion });
      restoBody.tipo_usuario = nuevoTipo;
    }

    const actualizado = await Usuario.findByIdAndUpdate(id, restoBody, { new: true, runValidators: true }).select('-password');
    res.json(actualizado);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const db = mongoose.connection.db;
    const [tieneEncargo, tieneAsesoria, tieneCurso] = await Promise.all([
      db.collection('oferta_encargo').findOne({ usuario_id: id, estado: { $in: ['abierta', 'en_proceso'] } }),
      db.collection('solicitudes').findOne({ usuario_id: id, estado: 'aprobada' }),
      db.collection('pagos').findOne({ user_id: id, tipo: 'CURSO', estado: 'pagado' })
    ]);

    if (tieneEncargo || tieneAsesoria || tieneCurso) {
      return res.status(409).json({ error: 'No se puede eliminar el usuario porque tiene encargos, asesorias o cursos activos.' });
    }

    await eliminarPerfilExistente(usuario.tipo_usuario, id);
    await Usuario.findByIdAndDelete(id);

    res.json({ mensaje: 'Usuario eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
