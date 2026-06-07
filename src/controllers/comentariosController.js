import mongoose from 'mongoose';
import Comentario from '../models/Comentarios.js';
import Usuario from '../models/Usuarios.js';
import { generarSiguienteId } from '../models/idGeneratorService.js';

const validarTarget = async (target_id, target_type) => {
  const db = mongoose.connection.db;
  if (target_type === 'publicacion') {
    const doc = await db.collection('publicaciones').findOne({ _id: target_id });
    return { existe: !!doc, autorId: doc?.creativo_id };
  }
  if (target_type === 'capitulo') {
    const curso = await db.collection('cursos').findOne({ 'capitulos._id': target_id });
    return { existe: !!curso, autorId: curso?.creadores?.[0] };
  }
  return { existe: false };
};

export const crear = async (req, res) => {
  try {
    const { target_id, target_type, user_id, contenido } = req.body;

    const usuario = await Usuario.findById(user_id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const { existe } = await validarTarget(target_id, target_type);
    if (!existe) return res.status(404).json({ error: `${target_type === 'publicacion' ? 'Publicación' : 'Capítulo'} no encontrado.` });

    const _id = await generarSiguienteId('comentarios', 'CO');
    const comentario = new Comentario({ _id, target_id, target_type, user_id, contenido, fecha: new Date(), respuestas: [] });
    await comentario.save();

    res.status(201).json(comentario);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPorTarget = async (req, res) => {
  try {
    const { target_id } = req.query;
    if (!target_id) return res.status(400).json({ error: 'Se requiere el parámetro target_id.' });
    const comentarios = await Comentario.find({ target_id });
    res.json(comentarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado.' });
    res.json(comentario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const agregarRespuesta = async (req, res) => {
  try {
    const { user_id, contenido } = req.body;

    const usuario = await Usuario.findById(user_id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado.' });

    comentario.respuestas.push({ user_id, contenido, fecha: new Date() });
    await comentario.save();

    res.json(comentario);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const eliminarRespuesta = async (req, res) => {
  try {
    const { id, indice } = req.params;
    const { user_id } = req.body;

    const comentario = await Comentario.findById(id);
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado.' });

    const idx = parseInt(indice);
    if (isNaN(idx) || idx < 0 || idx >= comentario.respuestas.length) {
      return res.status(400).json({ error: 'Índice de respuesta inválido.' });
    }

    const respuesta = comentario.respuestas[idx];
    const { autorId } = await validarTarget(comentario.target_id, comentario.target_type);

    if (respuesta.user_id !== user_id && autorId !== user_id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta respuesta.' });
    }

    comentario.respuestas.splice(idx, 1);
    await comentario.save();

    res.json(comentario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const eliminar = async (req, res) => {
  try {
    const { user_id } = req.body;

    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado.' });

    const { autorId } = await validarTarget(comentario.target_id, comentario.target_type);

    if (comentario.user_id !== user_id && autorId !== user_id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario.' });
    }

    await Comentario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Comentario eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
