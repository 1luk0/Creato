import mongoose from 'mongoose';

const vectorPerfilCreativoSchema = new mongoose.Schema({
  _id: { type: String },
  perfil_creativo_id: { type: String, required: true },
  tipo: {
    type: String,
    enum: ['estilo', 'herramientas', 'bio', 'portafolio'],
    required: true
  },
  contenido: { type: String, required: true },
  vector_embedding: { type: [Number], required: true },
  estrategia_chunking: { type: String }
});

export default mongoose.model('VectorPerfilCreativo', vectorPerfilCreativoSchema, 'vector_perfil_creativo');
