import mongoose from 'mongoose';

const vectorOfertaLaboralSchema = new mongoose.Schema({
  _id: { type: String },
  oferta_laboral_id: { type: String, required: true },
  contenido: { type: String, required: true },
  vector_embedding: { type: [Number], required: true },
  estrategia_chunking: { type: String }
});

export default mongoose.model('VectorOfertaLaboral', vectorOfertaLaboralSchema, 'vector_oferta_laboral');
