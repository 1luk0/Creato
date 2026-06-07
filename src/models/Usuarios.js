import mongoose from 'mongoose';

const progresoSchema = new mongoose.Schema({
  curso_id: { type: String, required: true },
  capitulos_completados: [{ type: String }],
  ultimo_minuto_visto: { type: String },
  estado: { type: String, enum: ['en_progreso', 'completado'] }
}, { _id: false });

const usuarioSchema = new mongoose.Schema({
  _id: { type: String },
  nombre: { type: String, required: true },
  telefono: { type: String, required: true },
  correo: {
    type: String,
    required: true,
    match: /^.+@.+\..+$/
  },
  password: { type: String, required: true },
  tipo_usuario: {
    type: String,
    enum: ['CLIENTE', 'CREATIVO', 'EMPRESA'],
    required: true
  },
  intereses: [{ type: String }],
  fecha_registro: { type: Date, required: true, default: Date.now },
  progreso: [progresoSchema]
});

export default mongoose.model('Usuario', usuarioSchema, 'usuarios');
