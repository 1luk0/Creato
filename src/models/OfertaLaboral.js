import mongoose from 'mongoose';

const ofertaLaboralSchema = new mongoose.Schema({
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'PerfilEmpresa', required: true },
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  requisitos: [{ type: String }],
  salario: { type: String, trim: true },
  ubicacion: { type: String, trim: true },
  modalidad: { type: String, enum: ['Presencial', 'Remoto', 'Híbrido'], default: 'Remoto' },
  etiquetas: [{ type: String }],
  publicadoEn: { type: Date, default: Date.now },
});

const OfertaLaboral = mongoose.model('OfertaLaboral', ofertaLaboralSchema);
export default OfertaLaboral;
