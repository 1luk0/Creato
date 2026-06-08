// Envuelve un controller async para que cualquier rechazo de promesa
// se propague al middleware central de errores vía next(), evitando
// repetir try/catch en cada handler (DRY).
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
