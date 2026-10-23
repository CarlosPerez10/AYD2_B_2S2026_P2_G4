/**
 * Error con significado HTTP. Todo lo que no sea ApiError se responde como 500
 * sin exponer detalles internos.
 */
export class ApiError extends Error {
  constructor(estado, codigo, mensaje, detalles) {
    super(mensaje);
    this.name = 'ApiError';
    this.estado = estado;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export const errores = {
  validacion: (detalles) => new ApiError(400, 'VALIDACION', 'Los datos enviados no son válidos.', detalles),
  noEncontrado: (mensaje) => new ApiError(404, 'NO_ENCONTRADO', mensaje),
  libroNoEncontrado: (id) => new ApiError(404, 'NO_ENCONTRADO', `No existe el libro con id ${id}.`),
  conflicto: (mensaje) => new ApiError(409, 'CONFLICTO', mensaje),
  existenciasInsuficientes: (libro, solicitadas) =>
    new ApiError(
      409,
      'EXISTENCIAS_INSUFICIENTES',
      `Solo hay ${libro.existencias} unidades disponibles de "${libro.titulo}".`,
      { disponibles: libro.existencias, solicitadas },
    ),
  cuerpoDemasiadoGrande: () =>
    new ApiError(413, 'CUERPO_DEMASIADO_GRANDE', 'El cuerpo de la petición supera el tamaño permitido.'),
  interno: () => new ApiError(500, 'ERROR_INTERNO', 'Ocurrió un error inesperado.'),
};

export function cuerpoDeError(error, requestId) {
  const cuerpo = { codigo: error.codigo, mensaje: error.message, requestId };
  if (error.detalles !== undefined) cuerpo.detalles = error.detalles;
  return { error: cuerpo };
}
