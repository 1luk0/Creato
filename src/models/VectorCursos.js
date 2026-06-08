import mongoose from 'mongoose';

const vectorCursosSchema = new mongoose.Schema(
  {
    _id:                 { type: String, required: true },
    curso_id:            { type: String, required: true }, // → cursos._id
    tipo:                { type: String, required: true, enum: ['DESCRIPCION', 'TEMARIO', 'OBJETIVO'] },
    contenido:           { type: String, required: true },
    vector_embedding:    { type: [Number], required: true },
    // estrategia_chunking NO es requerido por el validator de la BD → opcional.
    estrategia_chunking: { type: String }
  },
  { collection: 'vector_cursos', timestamps: false, versionKey: false }
);

export default mongoose.model('VectorCursos', vectorCursosSchema);
