import mongoose from 'mongoose';

const ofertaLaboralSchema = new mongoose.Schema(
  {
    _id:               { type: String, required: true },
    perfil_empresa_id: { type: String, required: true },
    cargo:             { type: String, required: true },
    descripcion:       { type: String, required: true },
    vector_descripcion:{ type: [Number], required: true },
    presupuesto:       { type: String, default: null },
    postulados:        { type: [String], default: [] },
    estado:            { type: String, required: true }
  },
  { collection: 'oferta_laboral', timestamps: false, versionKey: false }
);

export default mongoose.model('OfertaLaboral', ofertaLaboralSchema);
