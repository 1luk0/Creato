import { HttpError } from '../utils/httpError.js';

// 404 para rutas no registradas. Va antes del manejador de errores.
export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

// Manejador central de errores. Express lo identifica por su aridad de 4
// argumentos, por eso `next` debe permanecer aunque no se use.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Errores de negocio/validación ya tipados con su código HTTP.
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Validación de esquema Mongoose (requeridos, enums, patterns, min/max).
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      detalles: Object.values(err.errors).map((e) => e.message)
    });
  }

  // _id duplicado (índice único de la clave primaria).
  if (err.code === 11000) {
    return res.status(409).json({ error: `Registro duplicado: ${JSON.stringify(err.keyValue)}` });
  }

  // Rechazo del validador $jsonSchema de MongoDB (validationAction: 'error').
  if (err.code === 121) {
    return res.status(422).json({ error: 'El documento no cumple el validador de la base de datos' });
  }

  console.error(`[errorHandler] ${err.stack || err.message}`);
  res.status(500).json({ error: 'Error interno del servidor' });
};
