import mongoose from 'mongoose';
import { httpError } from './httpError.js';

// Verificación de integridad referencial mediante acceso NATIVO a las
// colecciones (decisión confirmada). Al no definir modelos Mongoose de
// colecciones ajenas (usuarios, oferta_asesoria, oferta_encargo) evitamos
// colisiones de nombres de modelo al fusionar con la otra rama, y funciona
// aunque esos archivos aún no existan en esta rama.
const coleccion = (nombre) => mongoose.connection.collection(nombre);

// Devuelve el documento (o null). Todos los _id son string en este dominio.
export const buscarPorId = (nombre, id, projection = { _id: 1 }) => {
  if (!id) return Promise.resolve(null);
  return coleccion(nombre).findOne({ _id: id }, { projection });
};

// Lanza 404 si la referencia no existe; devuelve el documento si existe.
export const asegurarReferencia = async (nombre, id, etiqueta = nombre, projection = { _id: 1 }) => {
  const doc = await buscarPorId(nombre, id, projection);
  if (!doc) throw httpError(404, `Referencia inexistente: ${etiqueta} '${id}' no existe`);
  return doc;
};

// Los capítulos viven embebidos en cursos.capitulos[] (no son colección).
// Útil para validar transcripciones.source_id cuando apunta a un capítulo.
export const existeCapituloEnCursos = async (capituloId) => {
  if (!capituloId) return false;
  const curso = await coleccion('cursos').findOne(
    { 'capitulos._id': capituloId },
    { projection: { _id: 1 } }
  );
  return !!curso;
};

// La postulación vive embebida en oferta_encargo.postulaciones[] (no es una
// colección). Recupera { oferta, postulacion } usando el operador posicional $
// para traer solo la postulación coincidente.
export const buscarPostulacionEmbebida = async (ofertaEncargoId, postulacionId) => {
  if (!ofertaEncargoId || !postulacionId) return null;
  const oferta = await coleccion('oferta_encargo').findOne(
    { _id: ofertaEncargoId, 'postulaciones._id': postulacionId },
    { projection: { 'postulaciones.$': 1, usuario_id: 1, estado: 1 } }
  );
  if (!oferta?.postulaciones?.length) return null;
  return { oferta, postulacion: oferta.postulaciones[0] };
};
