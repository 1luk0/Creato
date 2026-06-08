import mongoose from 'mongoose';

const asesoriaSchema = new mongoose.Schema(
  {
    _id:             { type: String, required: true },
    pago_id:         { type: String, required: true }, // → pagos._id (tipo ASESORIA)
    solicitud_id:    { type: String, required: true }, // → solicitudes._id (aprobada)
    link_reunion:    { type: String },
    video_grabacion: { type: String },
    transcripcion_id:{ type: String }  // → transcripciones._id
  },
  { collection: 'asesoria', timestamps: false, versionKey: false }
);

export default mongoose.model('Asesoria', asesoriaSchema);
