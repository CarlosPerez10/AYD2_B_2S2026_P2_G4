import { ApiError, cuerpoDeError, errores } from '../utils/errores.js';

export function rutaNoEncontrada() {
  return (req, res, next) => next(errores.noEncontrado(req.path));
}

export function manejoErrores(logger) {
  // Express reconoce el manejador de errores por sus cuatro parámetros.
  return (error, req, res, next) => {
    const conocido = error instanceof ApiError ? error : errores.interno();

    if (conocido.estado >= 500) {
      logger.error('error en peticion', {
        requestId: req.id,
        codigo: conocido.codigo,
        error: error.cause instanceof Error ? error.cause : error,
      });
    }

    res.status(conocido.estado).json(cuerpoDeError(conocido, req.id));
  };
}
