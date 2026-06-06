import mongoose from 'mongoose';

const perfilEmpresaSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  razonSocial: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  industria: { type: String, trim: true },
  ubicacion: { type: String, trim: true },
  sitioWeb: { type: String, trim: true },
  creadoEn: { type: Date, default: Date.now },
});

const PerfilEmpresa = mongoose.model('PerfilEmpresa', perfilEmpresaSchema);
export default PerfilEmpresa;
