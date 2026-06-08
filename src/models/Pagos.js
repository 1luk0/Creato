import mongoose from 'mongoose';

const pagosSchema = new mongoose.Schema(
  {
    _id:       { type: String, required: true },
    tipo:      { type: String, required: true, enum: ['ENCARGO', 'ASESORIA', 'CURSO'] },
    source_id: { type: String, required: true }, // → encargo/asesoria/cursos según tipo
    user_id:   { type: String, required: true }, // → usuarios._id
    monto:     { type: Number, required: true, min: 0 },
    fecha:     { type: Date, required: true, default: Date.now },
    hora:      { type: String, match: /^\d{2}:\d{2}$/ },
    estado:    {
      type: String,
      required: true,
      enum: ['pendiente', 'pagado', 'reembolsado', 'fallido'],
      default: 'pendiente'
    }
  },
  { collection: 'pagos', timestamps: false, versionKey: false }
);

export default mongoose.model('Pagos', pagosSchema);
