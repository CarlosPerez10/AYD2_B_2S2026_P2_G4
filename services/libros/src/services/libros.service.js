import { errores } from '../utils/errores.js';

// Código de PostgreSQL para violación de UNIQUE (el ISBN).
const VIOLACION_UNICA = '23505';

async function conIsbnUnico(operacion, isbn) {
  try {
    return await operacion();
  } catch (error) {
    if (error?.code === VIOLACION_UNICA) throw errores.conflicto(`Ya existe un libro con el ISBN ${isbn}.`);
    throw error;
  }
}

export function crearServicioLibros(repositorio) {
  return {
    async listar(filtros) {
      const { libros, total } = await repositorio.listar(filtros);
      return {
        data: libros,
        meta: {
          pagina: filtros.pagina,
          limite: filtros.limite,
          total,
          totalPaginas: Math.ceil(total / filtros.limite),
        },
      };
    },

    listarAutores: () => repositorio.listarAutores(),

    async obtener(id) {
      const libro = await repositorio.obtenerPorId(id);
      if (!libro) throw errores.libroNoEncontrado(id);
      return libro;
    },

    crear: (datos) => conIsbnUnico(() => repositorio.crear(datos), datos.isbn),

    async actualizar(id, datos) {
      const libro = await conIsbnUnico(() => repositorio.actualizar(id, datos), datos.isbn);
      if (!libro) throw errores.libroNoEncontrado(id);
      return libro;
    },

    async eliminar(id) {
      if (!(await repositorio.eliminar(id))) throw errores.libroNoEncontrado(id);
    },

    async descontar(id, cantidad) {
      const libro = await repositorio.descontar(id, cantidad);
      if (libro) return libro;
      // El UPDATE no afectó filas: se distingue entre libro inexistente y falta de existencias.
      const actual = await repositorio.obtenerPorId(id);
      if (!actual) throw errores.libroNoEncontrado(id);
      throw errores.existenciasInsuficientes(actual, cantidad);
    },

    async reponer(id, cantidad) {
      const libro = await repositorio.reponer(id, cantidad);
      if (!libro) throw errores.libroNoEncontrado(id);
      return libro;
    },
  };
}
