import mongoose from 'mongoose';

const metadataSchema = new mongoose.Schema(
  {
    minuto_inicio: { type: Number, required: true, min: 0 },
    minuto_fin:    { type: Number, required: true, min: 0 },
    estrategia_chunking: {
      type: String,
      required: true,
      enum: ['fixed_size_v1', 'semantic_split_v1', 'sentence_window_v1']
    }
  },
  { _id: false }
);

const vectorTranscripcionesSchema = new mongoose.Schema(
  {
    _id:                { type: String, required: true },
    transcripcion_id:   { type: String, required: true },
    contenido_segmento: { type: String, required: true },
    vector_embedding:   { type: [Number], required: true },
    metadata:           { type: metadataSchema, required: true }
  },
  {
    collection: 'vector_transcripciones',
    timestamps: false,
    versionKey: false
  }
);

export default mongoose.model('VectorTranscripciones', vectorTranscripcionesSchema);
