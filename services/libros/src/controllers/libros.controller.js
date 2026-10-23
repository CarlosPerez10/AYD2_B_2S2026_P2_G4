import { validarFiltros, validarId, validarLibroEntrada, validarMovimiento } from '../validators/libros.validator.js';

// Express 5 envía al manejador de errores lo que lancen los controladores asíncronos.
export function crearControladorLibros(servicio) {
  return {
    async listar(req, res) {
      res.json(await servicio.listar(validarFiltros(req.query)));
    },

    async listarAutores(req, res) {
      res.json({ data: await servicio.listarAutores() });
    },

    async obtener(req, res) {
      res.json({ data: await servicio.obtener(validarId(req.params.id)) });
    },

    async crear(req, res) {
      const libro = await servicio.crear(validarLibroEntrada(req.body));
      res.status(201).location(`/api/v1/libros/${libro.id}`).json({ data: libro });
    },

    async actualizar(req, res) {
      const id = validarId(req.params.id);
      res.json({ data: await servicio.actualizar(id, validarLibroEntrada(req.body)) });
    },

    async eliminar(req, res) {
      await servicio.eliminar(validarId(req.params.id));
      res.status(204).end();
    },

    async descontar(req, res) {
      const id = validarId(req.params.id);
      res.json({ data: await servicio.descontar(id, validarMovimiento(req.body)) });
    },

    async reponer(req, res) {
      const id = validarId(req.params.id);
      res.json({ data: await servicio.reponer(id, validarMovimiento(req.body)) });
    },
  };
}
