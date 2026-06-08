// Error con código HTTP explícito para distinguir fallos de negocio/validación
// (400, 404, 409…) de errores inesperados (500) en el middleware central.
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

// Atajo para lanzar errores controlados desde los controllers: throw httpError(404, '...').
export const httpError = (statusCode, message) => new HttpError(statusCode, message);

export default httpError;
