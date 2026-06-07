import mongoose from 'mongoose';

const vectorPerfilCreativoSchema = new mongoose.Schema(
  {
    _id:                 { type: String, required: true },
    perfil_creativo_id:  { type: String, required: true },
    tipo:                { type: String, required: true },
    contenido:           { type: String, required: true },
    vector_embedding:    { type: [Number], required: true },
    estrategia_chunking: { type: String, required: true }
  },
  { collection: 'vector_perfil_creativo', timestamps: false, versionKey: false }
);

export default mongoose.model('VectorPerfilCreativo', vectorPerfilCreativoSchema);
