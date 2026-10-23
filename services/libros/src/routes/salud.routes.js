import { Router } from 'express';

export function rutasSalud({ version, verificarBaseDatos }) {
  const router = Router();
  const arranque = Date.now();

  // Lo consumen el gateway (/health/servicios) y el HEALTHCHECK de Docker.
  router.get('/health', async (req, res) => {
    let baseDeDatos = 'ok';
    try {
      await verificarBaseDatos();
    } catch {
      baseDeDatos = 'error';
    }
    res.status(baseDeDatos === 'ok' ? 200 : 503).json({
      estado: baseDeDatos === 'ok' ? 'ok' : 'degradado',
      servicio: 'libros',
      version,
      baseDeDatos,
      tiempoActivo: Math.round((Date.now() - arranque) / 1000),
    });
  });

  return router;
}
