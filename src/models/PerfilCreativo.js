import mongoose from 'mongoose';

const perfilCreativoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  bio: { type: String, trim: true },
  habilidades: [{ type: String }],
  portfolio: [{ type: String }],
  proyectos: [{
    titulo: String,
    descripcion: String,
    enlace: String,
  }],
  embeddings: [[Number]],
  cursos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Curso' }],
  actualizadoEn: { type: Date, default: Date.now },
});

const PerfilCreativo = mongoose.model('PerfilCreativo', perfilCreativoSchema);
export default PerfilCreativo;
