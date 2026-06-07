import mongoose from 'mongoose';

const publicacionesSchema = new mongoose.Schema(
  {
    _id:          { type: String, required: true },
    creativo_id:  { type: String, required: true },
    imagen_url:   { type: String, required: true },
    descripcion:  { type: String, required: true },
    vector_imagen:{ type: [Number], required: true },
    categorias:   { type: [String], default: [] },
    es_portafolio:{ type: Boolean, default: false },
    likes_count:  { type: Number, default: 0, min: 0 }
  },
  { collection: 'publicaciones', timestamps: false, versionKey: false }
);

export default mongoose.model('Publicaciones', publicacionesSchema);
