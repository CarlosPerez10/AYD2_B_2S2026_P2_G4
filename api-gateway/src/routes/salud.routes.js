import { Router } from 'express';

export function rutasSalud({ version, obtenerSaludServicios }) {
  const router = Router();
  const arranque = Date.now();

  // Usado por el health check del ALB: solo indica que el proceso está vivo.
  router.get('/health', (req, res) => {
    res.json({
      estado: 'ok',
      servicio: 'api-gateway',
      version,
      tiempoActivo: Math.round((Date.now() - arranque) / 1000),
    });
  });

  router.get('/health/servicios', async (req, res, next) => {
    try {
      const salud = await obtenerSaludServicios();
      res.status(salud.estado === 'ok' ? 200 : 503).json(salud);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
