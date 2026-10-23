const NIVELES = { debug: 10, info: 20, warn: 30, error: 40 };

/**
 * Logger mínimo en JSON, una línea por evento, para que CloudWatch o `docker logs`
 * se puedan filtrar por requestId sin dependencias extra.
 */
export function crearLogger({ servicio, nivel = 'info', destino = process.stdout } = {}) {
  const umbral = NIVELES[nivel] ?? NIVELES.info;

  function escribir(nivelEvento, mensaje, datos = {}) {
    if (NIVELES[nivelEvento] < umbral) return;
    const evento = {
      fecha: new Date().toISOString(),
      nivel: nivelEvento,
      servicio,
      mensaje,
      ...datos,
    };
    if (datos.error instanceof Error) {
      evento.error = { nombre: datos.error.name, mensaje: datos.error.message, pila: datos.error.stack };
    }
    destino.write(`${JSON.stringify(evento)}\n`);
  }

  return {
    debug: (mensaje, datos) => escribir('debug', mensaje, datos),
    info: (mensaje, datos) => escribir('info', mensaje, datos),
    warn: (mensaje, datos) => escribir('warn', mensaje, datos),
    error: (mensaje, datos) => escribir('error', mensaje, datos),
  };
}

export const loggerSilencioso = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};
