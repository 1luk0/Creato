import mongoose from 'mongoose';

const contadorSchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  secuencia: { type: Number, default: 0 }
});

export default mongoose.model('Contador', contadorSchema);