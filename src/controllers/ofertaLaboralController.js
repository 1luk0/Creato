import OfertaLaboral from '../models/OfertaLaboral.js';
import PerfilEmpresa from '../models/PerfilEmpresa.js';
import Usuario from '../models/Usuarios.js';
import { nuevoIdSecuencial } from '../utils/ids.js';

export const crear = async (req, res) => {
  try {
    const { perfil_empresa_id, cargo, descripcion, presupuesto } = req.body;

    const perfil = await PerfilEmpresa.findById(perfil_empresa_id);
    if (!perfil) return res.status(404).json({ error: 'Perfil empresa no encontrado.' });

    const _id = await nuevoIdSecuencial('oferta_laboral', req.body._id ?? null);
    const oferta = new OfertaLaboral({ _id, perfil_empresa_id, cargo, descripcion, presupuesto, postulados: [], estado: 'activa' });
    await oferta.save();

    res.status(201).json(oferta);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const obtenerTodos = async (req, res) => {
  try {
    const { estado, perfil_empresa_id } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;
    if (perfil_empresa_id) filtro.perfil_empresa_id = perfil_empresa_id;
    const ofertas = await OfertaLaboral.find(filtro);
    res.json(ofertas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const oferta = await OfertaLaboral.findById(req.params.id);
    if (!oferta) return res.status(404).json({ error: 'Oferta laboral no encontrada.' });
    res.json(oferta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizar = async (req, res) => {
  try {
    const camposPermitidos = ['cargo', 'descripcion', 'presupuesto', 'estado', 'vector_descripcion'];
    const actualizacion = {};
    camposPermitidos.forEach(campo => { if (req.body[campo] !== undefined) actualizacion[campo] = req.body[campo]; });

    const oferta = await OfertaLaboral.findByIdAndUpdate(req.params.id, actualizacion, { new: true, runValidators: true });
    if (!oferta) return res.status(404).json({ error: 'Oferta laboral no encontrada.' });
    res.json(oferta);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const eliminar = async (req, res) => {
  try {
    const oferta = await OfertaLaboral.findByIdAndDelete(req.params.id);
    if (!oferta) return res.status(404).json({ error: 'Oferta laboral no encontrada.' });
    res.json({ mensaje: 'Oferta laboral eliminada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const postular = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const usuario = await Usuario.findById(user_id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (usuario.tipo_usuario !== 'CREATIVO') return res.status(403).json({ error: 'Solo usuarios de tipo CREATIVO pueden postularse.' });

    const oferta = await OfertaLaboral.findById(id);
    if (!oferta) return res.status(404).json({ error: 'Oferta laboral no encontrada.' });
    if (oferta.estado !== 'activa') return res.status(409).json({ error: 'La oferta laboral no está activa.' });
    if (oferta.postulados.includes(user_id)) return res.status(409).json({ error: 'El usuario ya se postuló a esta oferta.' });

    oferta.postulados.push(user_id);
    await oferta.save();

    res.json({ mensaje: 'Postulación registrada exitosamente.', oferta });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
