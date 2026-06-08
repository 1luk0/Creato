import mongoose from 'mongoose';

const perfilEmpresaSchema = new mongoose.Schema({
  _id: { type: String },
  user_id: { type: String, required: true },
  nit: {
    type: String,
    required: true,
    match: /^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]$/
  },
  sector: { type: String, required: true },
  web: { type: String },
  descripcion: { type: String, required: true },
  logo: { type: String },
  verificado: { type: Boolean, default: false }
});

export default mongoose.model('PerfilEmpresa', perfilEmpresaSchema, 'perfil_empresa');
