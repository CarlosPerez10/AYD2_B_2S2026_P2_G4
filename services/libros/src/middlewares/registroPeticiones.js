const RUTAS_SALUD = /^\/health(\/|$)/;

/**
 * Registra cada petición al terminar. Las de salud (el gateway y Docker las hacen cada
 * pocos segundos) van en nivel debug para no ensuciar los logs.
 */
export function registroPeticiones(logger) {
  return (req, res, next) => {
    const inicio = process.hrtime.bigint();

    res.on('finish', () => {
      const duracionMs = Number(process.hrtime.bigint() - inicio) / 1e6;
      const datos = {
        requestId: req.id,
        metodo: req.method,
        ruta: req.originalUrl,
        estado: res.statusCode,
        duracionMs: Math.round(duracionMs * 100) / 100,
      };
      if (RUTAS_SALUD.test(req.path)) logger.debug('peticion', datos);
      else if (res.statusCode >= 500) logger.error('peticion', datos);
      else if (res.statusCode >= 400) logger.warn('peticion', datos);
      else logger.info('peticion', datos);
    });

    next();
  };
}
