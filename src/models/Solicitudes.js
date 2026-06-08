import mongoose from 'mongoose';

const HORA = /^\d{2}:\d{2}$/;

const solicitudesSchema = new mongoose.Schema(
  {
    _id:               { type: String, required: true },
    usuario_id:        { type: String, required: true }, // → usuarios._id
    oferta_asesoria_id:{ type: String, required: true }, // → oferta_asesoria._id
    descripcion:       { type: String },
    estado:            {
      type: String,
      required: true,
      enum: ['pendiente', 'aprobada', 'rechazada', 'cancelada'],
      default: 'pendiente'
    },
    fecha:             { type: Date, required: true, default: Date.now },
    hora_inicio:       { type: String, match: HORA },
    hora_fin:          { type: String, match: HORA }
  },
  { collection: 'solicitudes', timestamps: false, versionKey: false }
);

export default mongoose.model('Solicitudes', solicitudesSchema);
