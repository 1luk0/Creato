import mongoose from 'mongoose';

const perfilCreativoSchema = new mongoose.Schema({
  _id: { type: String },
  user_id: { type: String, required: true },
  profesiones: { type: [String], required: true },
  habilidades: { type: [String], required: true },
  experiencia: { type: String },
  descripcion: { type: String, required: true },
  vector_descripcion: [{ type: Number }],
  vector_portafolio_global: [{ type: Number }],
  foto_perfil: { type: String },
  rating_promedio: { type: Number, min: 0, max: 5, default: 0 },
  total_resenas: { type: Number, min: 0, default: 0 }
});

export default mongoose.model('PerfilCreativo', perfilCreativoSchema, 'perfil_creativo');
