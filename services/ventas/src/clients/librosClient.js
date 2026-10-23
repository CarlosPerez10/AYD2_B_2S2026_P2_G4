import { errores } from '../utils/errores.js';

/**
 * Cliente HTTP del microservicio de Libros. Traduce las respuestas a ApiError para que el
 * servicio de ventas no conozca detalles de transporte.
 */
export function crearClienteLibros({ url, tiempoLimiteMs = 3_000, fetchImpl = fetch }) {
  async function llamar(ruta, { metodo = 'GET', cuerpo, requestId } = {}) {
    const encabezados = { accept: 'application/json' };
    if (requestId) encabezados['x-request-id'] = requestId;
    if (cuerpo !== undefined) encabezados['content-type'] = 'application/json';

    let respuesta;
    try {
      respuesta = await fetchImpl(`${url}${ruta}`, {
        method: metodo,
        headers: encabezados,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(tiempoLimiteMs),
      });
    } catch (error) {
      // Conexión rechazada, DNS o tiempo agotado.
      throw Object.assign(errores.librosNoDisponible(), { cause: error });
    }

    const json = await respuesta.json().catch(() => null);

    if (respuesta.ok && json && 'data' in json) return json.data;
    if (respuesta.status === 404) {
      throw errores.noEncontrado(json?.error?.mensaje ?? 'El libro no existe.');
    }
    if (respuesta.status === 409) {
      throw errores.existenciasInsuficientes(
        json?.error?.mensaje ?? 'No hay existencias suficientes.',
        json?.error?.detalles,
      );
    }
    // Cualquier otra respuesta (5xx, cuerpo inválido) se trata como Libros no disponible.
    throw Object.assign(errores.librosNoDisponible(), {
      cause: new Error(`Libros respondió ${respuesta.status} en ${metodo} ${ruta}`),
    });
  }

  return {
    obtenerLibro: (id, requestId) => llamar(`/api/v1/libros/${id}`, { requestId }),
    descontar: (id, cantidad, requestId) =>
      llamar(`/internal/v1/libros/${id}/descontar`, { metodo: 'POST', cuerpo: { cantidad }, requestId }),
    reponer: (id, cantidad, requestId) =>
      llamar(`/internal/v1/libros/${id}/reponer`, { metodo: 'POST', cuerpo: { cantidad }, requestId }),
  };
}
