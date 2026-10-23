import { Router } from 'express';

export function rutasLibros(controlador) {
  const router = Router();

  router.get('/', controlador.listar);
  // Antes de /:id, o "autores" se interpretaría como un id.
  router.get('/autores', controlador.listarAutores);
  router.post('/', controlador.crear);
  router.get('/:id', controlador.obtener);
  router.put('/:id', controlador.actualizar);
  router.delete('/:id', controlador.eliminar);

  return router;
}

/** API interna que usa Ventas. El gateway bloquea /internal, así que no es pública. */
export function rutasInternas(controlador) {
  const router = Router();

  router.post('/:id/descontar', controlador.descontar);
  router.post('/:id/reponer', controlador.reponer);

  return router;
}
