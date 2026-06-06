import OfertaLaboral from '../models/OfertaLaboral.js';

export const obtenerOfertas = async (req, res) => {
  try {
    const ofertas = await OfertaLaboral.find().populate('empresa');
    res.json(ofertas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error obteniendo ofertas laborales', error });
  }
};

export const obtenerOfertaPorId = async (req, res) => {
  try {
    const oferta = await OfertaLaboral.findById(req.params.id).populate('empresa');
    if (!oferta) return res.status(404).json({ mensaje: 'Oferta laboral no encontrada' });
    res.json(oferta);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error obteniendo oferta laboral', error });
  }
};

export const crearOferta = async (req, res) => {
  try {
    const nuevaOferta = new OfertaLaboral(req.body);
    const ofertaGuardada = await nuevaOferta.save();
    res.status(201).json(ofertaGuardada);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error creando oferta laboral', error });
  }
};

export const actualizarOferta = async (req, res) => {
  try {
    const ofertaActualizada = await OfertaLaboral.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ofertaActualizada) return res.status(404).json({ mensaje: 'Oferta laboral no encontrada' });
    res.json(ofertaActualizada);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error actualizando oferta laboral', error });
  }
};

export const eliminarOferta = async (req, res) => {
  try {
    const ofertaEliminada = await OfertaLaboral.findByIdAndDelete(req.params.id);
    if (!ofertaEliminada) return res.status(404).json({ mensaje: 'Oferta laboral no encontrada' });
    res.json({ mensaje: 'Oferta laboral eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error eliminando oferta laboral', error });
  }
};
