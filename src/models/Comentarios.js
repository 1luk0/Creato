import mongoose from 'mongoose';

const respuestaSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  contenido: { type: String, required: true, minlength: 1 },
  fecha: { type: Date, required: true, default: Date.now }
}, { _id: false });

const comentarioSchema = new mongoose.Schema({
  _id: { type: String },
  target_id: { type: String, required: true },
  target_type: {
    type: String,
    enum: ['capitulo', 'publicacion'],
    required: true
  },
  user_id: { type: String, required: true },
  contenido: { type: String, required: true, minlength: 1 },
  fecha: { type: Date, required: true, default: Date.now },
  respuestas: [respuestaSchema]
});

export default mongoose.model('Comentario', comentarioSchema, 'comentarios');
