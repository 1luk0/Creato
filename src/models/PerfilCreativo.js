import mongoose from 'mongoose';

const perfilCreativoSchema = new mongoose.Schema(
  {
    _id:                     { type: String, required: true },
    user_id:                 { type: String, required: true },
    profesiones:             { type: [String], default: [] },
    habilidades:             { type: [String], default: [] },
    experiencia:             { type: String, default: '' },
    descripcion:             { type: String, required: true },
    vector_descripcion:      { type: [Number], required: true },
    vector_portafolio_global:{ type: [Number], required: true },
    foto_perfil:             { type: String, default: null },
    rating_promedio:         { type: Number, default: 0, min: 0, max: 5 },
    total_resenas:           { type: Number, default: 0, min: 0 }
  },
  { collection: 'perfil_creativo', timestamps: false, versionKey: false }
);

export default mongoose.model('PerfilCreativo', perfilCreativoSchema);
