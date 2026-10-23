import {
  validarFiltrosHistorial,
  validarFiltrosRanking,
  validarId,
  validarVentaEntrada,
} from '../validators/ventas.validator.js';

// Express 5 envía al manejador de errores lo que lancen los controladores asíncronos.
export function crearControladorVentas(servicio) {
  return {
    async registrar(req, res) {
      const venta = await servicio.registrar(validarVentaEntrada(req.body), req.id);
      res.status(201).location(`/api/v1/ventas/${venta.id}`).json({ data: venta });
    },

    async listar(req, res) {
      res.json(await servicio.listar(validarFiltrosHistorial(req.query)));
    },

    async obtener(req, res) {
      res.json({ data: await servicio.obtener(validarId(req.params.id)) });
    },

    async ranking(req, res) {
      res.json(await servicio.ranking(validarFiltrosRanking(req.query)));
    },
  };
}
