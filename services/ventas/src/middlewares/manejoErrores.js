import { ApiError, cuerpoDeError, errores } from '../utils/errores.js';

export function rutaNoEncontrada() {
  return (req, res, next) => next(errores.noEncontrado(`No existe la ruta ${req.path}.`));
}

/** Traduce los errores de express.json() al formato del contrato. */
function traducir(error) {
  if (error instanceof ApiError) return error;
  if (error?.type === 'entity.parse.failed') {
    return errores.validacion([{ campo: 'cuerpo', mensaje: 'El cuerpo no es un JSON válido.' }]);
  }
  if (error?.type === 'entity.too.large') return errores.cuerpoDemasiadoGrande();
  return errores.interno();
}

export function manejoErrores(logger) {
  // Express reconoce el manejador de errores por sus cuatro parámetros.
  return (error, req, res, next) => {
    const conocido = traducir(error);

    if (conocido.estado >= 500) {
      logger.error('error en peticion', {
        requestId: req.id,
        codigo: conocido.codigo,
        error: error?.cause instanceof Error ? error.cause : error,
      });
    }

    res.status(conocido.estado).json(cuerpoDeError(conocido, req.id));
  };
}
