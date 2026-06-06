import mongoose from 'mongoose';

const cursoSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  contenido: { type: String },
  multimedia: [{ type: String }],
  duracion: { type: String, trim: true },
  creadoEn: { type: Date, default: Date.now },
});

const Curso = mongoose.model('Curso', cursoSchema);
export default Curso;
