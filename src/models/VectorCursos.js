import mongoose from 'mongoose';

const vectorCursosSchema = new mongoose.Schema(
  {
    _id:                 { type: String, required: true },
    curso_id:            { type: String, required: true },
    tipo:                { type: String, required: true },
    contenido:           { type: String, required: true },
    vector_embedding:    { type: [Number], required: true },
    estrategia_chunking: { type: String, required: true }
  },
  { collection: 'vector_cursos', timestamps: false, versionKey: false }
);

export default mongoose.model('VectorCursos', vectorCursosSchema);
