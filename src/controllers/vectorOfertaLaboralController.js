import VectorOfertaLaboral from '../models/VectorOfertaLaboral.js';
import OfertaLaboral from '../models/OfertaLaboral.js';
import { generarSiguienteId } from '../models/idGeneratorService.js';
import { embed } from '../services/embeddingService.js';

export const crear = async (req, res) => {
  try {
    const { oferta_laboral_id, contenido, estrategia_chunking } = req.body;
    if (!oferta_laboral_id || !contenido) {
      return res.status(400).json({ error: 'Campos obligatorios: oferta_laboral_id, contenido' });
    }

    const oferta = await OfertaLaboral.findById(oferta_laboral_id);
    if (!oferta) return res.status(404).json({ error: 'Oferta laboral no encontrada.' });

    const vector_embedding = await embed(contenido);
    const _id = await generarSiguienteId('vector_oferta_laboral', 'VOL');
    const vector = new VectorOfertaLaboral({ _id, oferta_laboral_id, contenido, vector_embedding, estrategia_chunking });
    await vector.save();

    res.status(201).json(vector);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const obtenerTodos = async (req, res) => {
  try {
    const { oferta_laboral_id } = req.query;
    const filtro = oferta_laboral_id ? { oferta_laboral_id } : {};
    const vectores = await VectorOfertaLaboral.find(filtro);
    res.json(vectores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const vector = await VectorOfertaLaboral.findById(req.params.id);
    if (!vector) return res.status(404).json({ error: 'Vector de oferta laboral no encontrado.' });
    res.json(vector);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizar = async (req, res) => {
  try {
    const camposPermitidos = ['contenido', 'vector_embedding', 'estrategia_chunking'];
    const actualizacion = {};
    camposPermitidos.forEach(campo => { if (req.body[campo] !== undefined) actualizacion[campo] = req.body[campo]; });

    const vector = await VectorOfertaLaboral.findByIdAndUpdate(req.params.id, actualizacion, { new: true, runValidators: true });
    if (!vector) return res.status(404).json({ error: 'Vector de oferta laboral no encontrado.' });
    res.json(vector);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const eliminar = async (req, res) => {
  try {
    const vector = await VectorOfertaLaboral.findByIdAndDelete(req.params.id);
    if (!vector) return res.status(404).json({ error: 'Vector de oferta laboral no encontrado.' });
    res.json({ mensaje: 'Vector eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
