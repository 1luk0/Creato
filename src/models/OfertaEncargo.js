import mongoose from 'mongoose';

const postulacionSchema = new mongoose.Schema(
  {
    _id:                          { type: String, required: true },
    perfil_creativo_id:           { type: String, required: true },
    precio:                       { type: Number, required: true, min: 0 },
    fecha_estimada_entrega:       { type: Date, default: null },
    cantidad_retroalimentaciones: { type: Number, default: 0, min: 0 },
    estado:                       { type: String, required: true }
  },
  { _id: false }
);

const rangoPagoSchema = new mongoose.Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const ofertaEncargoSchema = new mongoose.Schema(
  {
    _id:               { type: String, required: true },
    usuario_id:        { type: String, required: true },
    descripcion:       { type: String, required: true },
    vector_descripcion:{ type: [Number], required: true },
    imagenes:          { type: [String], default: [] },
    vectores_imagenes: { type: [[Number]], default: [] },
    rango_pago:        { type: rangoPagoSchema, required: true },
    estado:            { type: String, required: true },
    fecha_estimada:    { type: Date, default: null },
    tipo:              { type: String, enum: ['publica', 'privada'], required: true },
    destinatario:      { type: String, default: null },
    postulaciones:     { type: [postulacionSchema], default: [] }
  },
  { collection: 'oferta_encargo', timestamps: false, versionKey: false }
);

export default mongoose.model('OfertaEncargo', ofertaEncargoSchema);
