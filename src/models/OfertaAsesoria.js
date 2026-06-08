import mongoose from 'mongoose';

const tarifaSchema = new mongoose.Schema(
  {
    duracion_minutos: { type: Number, required: true, min: 1 },
    precio:           { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const disponibilidadSchema = new mongoose.Schema(
  {
    dia:   { type: String, required: true },
    horas: { type: [String], default: [] }
  },
  { _id: false }
);

const solicitudPendienteSchema = new mongoose.Schema(
  {
    _id:         { type: String, required: true },
    usuario_id:  { type: String, required: true },
    estado:      { type: String, required: true, enum: ['pendiente', 'aprobada', 'rechazada'], default: 'pendiente' },
    hora_inicio: { type: String, default: null },
    hora_fin:    { type: String, default: null }
  },
  { _id: false }
);

const ofertaAsesoriaSchema = new mongoose.Schema(
  {
    _id:                  { type: String, required: true },
    perfil_creativo_id:   { type: String, required: true },
    tematicas:            { type: [String], default: [] },
    tarifas:              { type: [tarifaSchema], default: [] },
    disponibilidad:       { type: [disponibilidadSchema], default: [] },
    solicitudes_pendientes: { type: [solicitudPendienteSchema], default: [], validate: {
      validator: (v) => v.length <= 10,
      message: 'Máximo 10 solicitudes pendientes simultáneas'
    }}
  },
  { collection: 'oferta_asesoria', timestamps: false, versionKey: false }
);

export default mongoose.model('OfertaAsesoria', ofertaAsesoriaSchema);
