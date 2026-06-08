import mongoose from 'mongoose';

// Entrega embebida: el validator le da _id string propio. Declarar _id como
// String hace que Mongoose use ese tipo en vez del ObjectId automático.
const entregaSchema = new mongoose.Schema({
  _id:         { type: String, required: true },
  titulo:      { type: String },
  archivos:    { type: [String], default: [] },
  fecha:       { type: Date },
  comentarios: { type: String }
});

// Retroalimentación embebida: también con _id string propio.
const retroalimentacionSchema = new mongoose.Schema({
  _id:       { type: String, required: true },
  titulo:    { type: String },
  contenido: { type: String },
  numero:    { type: Number, min: 1 }
});

const encargoSchema = new mongoose.Schema(
  {
    _id:                          { type: String, required: true },
    oferta_encargo_id:            { type: String, required: true }, // → oferta_encargo._id
    postulacion_id:               { type: String, required: true }, // → postulación embebida en oferta_encargo.postulaciones[]
    fecha_max:                    { type: Date, required: true },
    pago_id:                      { type: String, required: true }, // → pagos._id (tipo ENCARGO)
    retroalimentaciones_acordadas:{ type: Number, min: 0 },
    estado:                       {
      type: String,
      required: true,
      enum: ['inicio', 'activo', 'revision', 'finalizado', 'cancelado'],
      default: 'inicio'
    },
    entregas:                     { type: [entregaSchema], default: [] },
    retroalimentaciones:          { type: [retroalimentacionSchema], default: [] }
  },
  { collection: 'encargo', timestamps: false, versionKey: false }
);

export default mongoose.model('Encargo', encargoSchema);
