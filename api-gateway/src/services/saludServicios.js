/**
 * Consulta en paralelo el /health de cada microservicio. Un servicio que no responde
 * a tiempo se reporta como "caido" sin bloquear la respuesta del resto.
 */
export function crearSaludServicios({ servicios, tiempoLimiteMs, fetchImpl = fetch }) {
  async function consultar(nombre, url) {
    const inicio = performance.now();
    try {
      const respuesta = await fetchImpl(`${url}/health`, { signal: AbortSignal.timeout(tiempoLimiteMs) });
      const latenciaMs = Math.round(performance.now() - inicio);
      const cuerpo = await respuesta.json().catch(() => null);
      return {
        nombre,
        estado: respuesta.ok ? 'ok' : 'degradado',
        latenciaMs,
        ...(cuerpo?.baseDeDatos && { baseDeDatos: cuerpo.baseDeDatos }),
        ...(cuerpo?.version && { version: cuerpo.version }),
      };
    } catch (error) {
      return {
        nombre,
        estado: 'caido',
        latenciaMs: Math.round(performance.now() - inicio),
        detalle: error.name === 'TimeoutError' ? `sin respuesta en ${tiempoLimiteMs} ms` : 'sin conexión',
      };
    }
  }

  return async function obtenerSalud() {
    const resultados = await Promise.all(
      Object.entries(servicios).map(([nombre, url]) => consultar(nombre, url)),
    );
    const todosOk = resultados.every((resultado) => resultado.estado === 'ok');
    return {
      estado: todosOk ? 'ok' : 'degradado',
      servicios: Object.fromEntries(resultados.map(({ nombre, ...resto }) => [nombre, resto])),
    };
  };
}
