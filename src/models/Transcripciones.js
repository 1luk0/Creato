import mongoose from 'mongoose';

// Línea de transcripción: sin _id propio en el validator → { _id: false }.
// `minuto` con formato MM:SS; vector_linea lo genera el pipeline RAG (opcional).
const lineaSchema = new mongoose.Schema(
  {
    minuto:       { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    texto:        { type: String, required: true },
    vector_linea: { type: [Number] }
  },
  { _id: false }
);

const transcripcionesSchema = new mongoose.Schema(
  {
    _id:            { type: String, required: true },
    source_id:      { type: String, required: true }, // → capítulo de curso o asesoria._id
    texto_completo: { type: String, required: true },
    lineas:         { type: [lineaSchema], default: [] }
  },
  { collection: 'transcripciones', timestamps: false, versionKey: false }
);

export default mongoose.model('Transcripciones', transcripcionesSchema);
