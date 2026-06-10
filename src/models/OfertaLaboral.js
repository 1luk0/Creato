import mongoose from 'mongoose';

const ofertaLaboralSchema = new mongoose.Schema({
  _id: { type: String },
  perfil_empresa_id: { type: String, required: true },
  cargo: { type: String, required: true },
  descripcion: { type: String, required: true },
  presupuesto: { type: String },
  postulados: [{ type: String }],
  estado: {
    type: String,
    enum: ['activa', 'finalizada', 'pausada'],
    required: true,
    default: 'activa'
  }
}, { timestamps: false, versionKey: false });

export default mongoose.model('OfertaLaboral', ofertaLaboralSchema, 'oferta_laboral');
