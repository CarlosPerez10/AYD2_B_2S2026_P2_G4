import { cargarConfiguracion } from '../../src/config/index.js';
import { crearApp } from '../../src/app.js';
import { loggerSilencioso } from '../../src/utils/logger.js';

export function libroDePrueba(datos = {}) {
  return {
    id: 1,
    isbn: null,
    titulo: 'Cien años de soledad',
    autor: 'Gabriel García Márquez',
    precio: 189.5,
    existencias: 12,
    creadoEn: new Date('2026-10-01T00:00:00Z'),
    actualizadoEn: new Date('2026-10-01T00:00:00Z'),
    ...datos,
  };
}

/**
 * Repositorio en memoria con la misma interfaz que el de PostgreSQL. Registra las
 * llamadas para que las pruebas verifiquen qué se pidió.
 */
export function repositorioEnMemoria(iniciales = []) {
  const libros = new Map(iniciales.map((libro) => [libro.id, { ...libro }]));
  let siguienteId = Math.max(0, ...libros.keys()) + 1;
  const llamadas = [];
  const registrar = (nombre, ...args) => llamadas.push({ nombre, args });

  const isbnDuplicado = (isbn, idPropio) =>
    isbn !== null && [...libros.values()].some((libro) => libro.isbn === isbn && libro.id !== idPropio);
  const errorUnico = () => Object.assign(new Error('duplicate key'), { code: '23505' });

  return {
    llamadas,
    libros,
    async listar(filtros) {
      registrar('listar', filtros);
      const todos = [...libros.values()];
      const inicio = (filtros.pagina - 1) * filtros.limite;
      return { libros: todos.slice(inicio, inicio + filtros.limite), total: todos.length };
    },
    async listarAutores() {
      registrar('listarAutores');
      return [...new Set([...libros.values()].map((libro) => libro.autor))].sort();
    },
    async obtenerPorId(id) {
      registrar('obtenerPorId', id);
      return libros.get(id) ?? null;
    },
    async crear(datos) {
      registrar('crear', datos);
      if (isbnDuplicado(datos.isbn)) throw errorUnico();
      const libro = libroDePrueba({ ...datos, id: siguienteId++ });
      libros.set(libro.id, libro);
      return libro;
    },
    async actualizar(id, datos) {
      registrar('actualizar', id, datos);
      if (!libros.has(id)) return null;
      if (isbnDuplicado(datos.isbn, id)) throw errorUnico();
      const libro = { ...libros.get(id), ...datos };
      libros.set(id, libro);
      return libro;
    },
    async eliminar(id) {
      registrar('eliminar', id);
      return libros.delete(id);
    },
    async descontar(id, cantidad) {
      registrar('descontar', id, cantidad);
      const libro = libros.get(id);
      if (!libro || libro.existencias < cantidad) return null;
      libro.existencias -= cantidad;
      return { ...libro };
    },
    async reponer(id, cantidad) {
      registrar('reponer', id, cantidad);
      const libro = libros.get(id);
      if (!libro) return null;
      libro.existencias += cantidad;
      return { ...libro };
    },
  };
}

export function crearAppDePrueba({ repositorio = repositorioEnMemoria(), verificarBaseDatos = async () => {} } = {}) {
  const config = cargarConfiguracion({ NODE_ENV: 'test', APP_VERSION: '9.9.9' });
  return crearApp({ config, logger: loggerSilencioso, repositorio, verificarBaseDatos });
}
