import mongoose from 'mongoose';

// Recurso de un capítulo: sin _id propio en el validator → { _id: false }.
const recursoSchema = new mongoose.Schema(
  {
    nombre: { type: String },
    url:    { type: String }
  },
  { _id: false }
);

// Capítulo embebido: el validator le exige _id string propio. Al declarar
// _id como String, Mongoose usa ese tipo en vez del ObjectId automático
// (no se añade { _id: false }, que es solo para subdocs sin _id). required: _id, orden, titulo.
const capituloSchema = new mongoose.Schema({
  _id:       { type: String, required: true },
  orden:     { type: Number, required: true, min: 1 },
  titulo:    { type: String, required: true },
  video_url: { type: String },
  recursos:  { type: [recursoSchema], default: [] }
});

const cursosSchema = new mongoose.Schema(
  {
    _id:              { type: String, required: true },
    nombre:           { type: String, required: true },
    descripcion:      { type: String, required: true },
    // vector_contenido lo genera el pipeline RAG, no este backend → opcional.
    vector_contenido: { type: [Number] },
    precio:           { type: Number, required: true, min: 0 },
    categorias:       { type: [String], required: true },
    creadores:        { type: [String], required: true }, // → usuarios._id
    rating_promedio:  { type: Number, min: 0, max: 5, default: 0 },
    total_resenas:    { type: Number, min: 0, default: 0 },
    compras:          { type: [String], default: [] },
    capitulos:        { type: [capituloSchema], default: [] }
  },
  { collection: 'cursos', timestamps: false, versionKey: false }
);

export default mongoose.model('Cursos', cursosSchema);
