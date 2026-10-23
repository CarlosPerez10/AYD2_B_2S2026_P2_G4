import { Router } from 'express';

export function rutasVentas(controlador) {
  const router = Router();

  router.get('/', controlador.listar);
  router.post('/', controlador.registrar);
  // Antes de /:id, o "ranking" se interpretaría como un id.
  router.get('/ranking', controlador.ranking);
  router.get('/:id', controlador.obtener);

  return router;
}
