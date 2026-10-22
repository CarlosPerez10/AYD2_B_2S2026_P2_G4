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
  rutaInvalida: () => new ApiError(400, 'RUTA_INVALIDA', 'La ruta solicitada no es válida.'),
  noAutorizado: () =>
    new ApiError(401, 'NO_AUTORIZADO', 'Se requiere una llave de administración válida en el encabezado X-Api-Key.'),
  noEncontrado: (ruta) => new ApiError(404, 'NO_ENCONTRADO', `No existe la ruta ${ruta}.`),
  demasiadasPeticiones: () =>
    new ApiError(429, 'DEMASIADAS_PETICIONES', 'Se superó el límite de peticiones. Intente de nuevo en un momento.'),
  interno: () => new ApiError(500, 'ERROR_INTERNO', 'Ocurrió un error inesperado.'),
  respuestaInvalida: (servicio) =>
    new ApiError(502, 'RESPUESTA_INVALIDA', `El servicio de ${servicio} devolvió una respuesta inválida.`),
  servicioNoDisponible: (servicio) =>
    new ApiError(503, 'SERVICIO_NO_DISPONIBLE', `El servicio de ${servicio} no está disponible.`),
  tiempoAgotado: (servicio) =>
    new ApiError(504, 'TIEMPO_AGOTADO', `El servicio de ${servicio} no respondió a tiempo.`),
};

export function cuerpoDeError(error, requestId) {
  const cuerpo = { codigo: error.codigo, mensaje: error.message, requestId };
  if (error.detalles !== undefined) cuerpo.detalles = error.detalles;
  return { error: cuerpo };
}
