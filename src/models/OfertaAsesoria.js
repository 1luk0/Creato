import mongoose from 'mongoose';

// Tarifa: duración en minutos y precio. Sin _id propio (no se referencia individualmente).
const tarifaSchema = new mongoose.Schema(
  {
    duracion_minutos: { type: Number, required: true, min: 1 },
    precio:           { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

// Bloque de disponibilidad: un día y sus franjas horarias disponibles.
const disponibilidadSchema = new mongoose.Schema(
  {
    dia:   { type: String, required: true },
    horas: { type: [String], default: [] }
  },
  { _id: false }
);

// Solicitud pendiente embebida. Usa _id string explícito para poder referenciarla
// en PATCH /:id/solicitudes/:solId/estado. Patrón del equipo: { _id: false } + _id String.
const HORA_REGEX = /^\d{2}:\d{2}$/;

const solicitudPendienteSchema = new mongoose.Schema(
  {
    _id:         { type: String, required: true },
    usuario_id:  { type: String, required: true },
    estado:      {
      type:     String,
      required: true,
      enum:     ['pendiente', 'aprobada', 'rechazada'],
      default:  'pendiente'
    },
    hora_inicio: {
      type:    String,
      default: null,
      match:   [HORA_REGEX, 'hora_inicio debe tener formato HH:MM']
    },
    hora_fin: {
      type:    String,
      default: null,
      match:   [HORA_REGEX, 'hora_fin debe tener formato HH:MM']
    }
  },
  { _id: false }
);

const ofertaAsesoriaSchema = new mongoose.Schema(
  {
    _id:                    { type: String, required: true },
    perfil_creativo_id:     { type: String, required: true },
    tematicas:              { type: [String], default: [] },
    tarifas:                { type: [tarifaSchema], default: [] },
    disponibilidad:         { type: [disponibilidadSchema], default: [] },
    solicitudes_pendientes: {
      type:     [solicitudPendienteSchema],
      default:  [],
      validate: {
        validator: (v) => v.length <= 10,
        message:   'Máximo 10 solicitudes pendientes simultáneas'
      }
    }
  },
  { collection: 'oferta_asesoria', timestamps: false, versionKey: false }
);

export default mongoose.model('OfertaAsesoria', ofertaAsesoriaSchema);
