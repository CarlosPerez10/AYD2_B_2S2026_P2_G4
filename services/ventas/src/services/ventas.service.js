import { errores } from '../utils/errores.js';

/** Se calcula en centavos enteros para no arrastrar errores de punto flotante. */
export function calcularTotal(precioUnitario, cantidad) {
  return (Math.round(precioUnitario * 100) * cantidad) / 100;
}

export function crearServicioVentas({ repositorio, clienteLibros, logger }) {
  return {
    /**
     * Saga orquestada de 02-arquitectura §6 y ADR-004:
     * consultar libro → descontar existencias → guardar venta → (si falla) reponer.
     */
    async registrar({ libroId, cantidad }, requestId) {
      // 1. Precio, título y autor vigentes: la venta guarda una copia (hecho histórico).
      const libro = await clienteLibros.obtenerLibro(libroId, requestId);

      // 2. Descuento atómico en Libros. Un 409 corta aquí sin guardar nada.
      await clienteLibros.descontar(libroId, cantidad, requestId);

      // 3. Persistencia local.
      const venta = {
        libroId,
        titulo: libro.titulo,
        autor: libro.autor,
        cantidad,
        precioUnitario: libro.precio,
        total: calcularTotal(libro.precio, cantidad),
      };
      try {
        return await repositorio.insertar(venta);
      } catch (errorInsercion) {
        // 4. Compensación: devolver las existencias descontadas.
        logger.error('fallo al guardar la venta; se reponen existencias', {
          requestId,
          libroId,
          cantidad,
          error: errorInsercion,
        });
        try {
          await clienteLibros.reponer(libroId, cantidad, requestId);
        } catch (errorCompensacion) {
          // Inconsistencia: Libros quedó con menos existencias sin venta registrada.
          logger.error('CRITICO: no se pudieron reponer existencias; corregir manualmente', {
            requestId,
            critico: true,
            venta,
            error: errorCompensacion.cause instanceof Error ? errorCompensacion.cause : errorCompensacion,
          });
          throw errores.interno();
        }
        throw errores.ventaNoRegistrada();
      }
    },

    async listar(filtros) {
      const { ventas, total } = await repositorio.listar(filtros);
      return {
        data: ventas,
        meta: {
          pagina: filtros.pagina,
          limite: filtros.limite,
          total,
          totalPaginas: Math.ceil(total / filtros.limite),
        },
      };
    },

    async obtener(id) {
      const venta = await repositorio.obtenerPorId(id);
      if (!venta) throw errores.ventaNoEncontrada(id);
      return venta;
    },

    /** No llama a Libros: funciona aunque Libros esté caído. */
    async ranking({ limite, desde, hasta }) {
      const data = await repositorio.ranking({ limite, desde, hasta });
      return {
        data,
        meta: {
          limite,
          desde: desde?.toISOString() ?? null,
          hasta: hasta?.toISOString() ?? null,
          generadoEn: new Date().toISOString(),
        },
      };
    },
  };
}
