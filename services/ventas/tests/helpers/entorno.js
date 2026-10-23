import { cargarConfiguracion } from '../../src/config/index.js';
import { crearApp } from '../../src/app.js';
import { loggerSilencioso } from '../../src/utils/logger.js';
import { errores } from '../../src/utils/errores.js';

export const LIBRO = Object.freeze({ id: 7, titulo: 'Rayuela', autor: 'Julio Cortázar', precio: 175.5, existencias: 10 });

/** Repositorio en memoria con la misma interfaz que el de PostgreSQL. */
export function repositorioEnMemoria(iniciales = []) {
  const ventas = iniciales.map((venta) => ({ ...venta }));
  let siguienteId = ventas.length + 1;
  return {
    ventas,
    falloAlInsertar: null,
    async insertar(datos) {
      if (this.falloAlInsertar) throw this.falloAlInsertar;
      const venta = { id: siguienteId++, ...datos, fecha: new Date() };
      ventas.push(venta);
      return venta;
    },
    async listar({ pagina, limite }) {
      const inicio = (pagina - 1) * limite;
      return { ventas: ventas.slice(inicio, inicio + limite), total: ventas.length };
    },
    async obtenerPorId(id) {
      return ventas.find((venta) => venta.id === id) ?? null;
    },
    async ranking() {
      return [];
    },
  };
}

/**
 * Cliente de Libros simulado. `escenario` decide qué responde cada operación y
 * `llamadas` registra lo que pidió la saga.
 */
export function clienteLibrosSimulado({ libro = LIBRO, escenario = {} } = {}) {
  const llamadas = [];
  const responder = async (operacion, resultado) => {
    const falla = escenario[operacion];
    if (falla) throw typeof falla === 'function' ? falla() : falla;
    return resultado;
  };
  return {
    llamadas,
    obtenerLibro: (id, requestId) => {
      llamadas.push(['obtenerLibro', id, requestId]);
      return responder('obtenerLibro', libro);
    },
    descontar: (id, cantidad, requestId) => {
      llamadas.push(['descontar', id, cantidad, requestId]);
      return responder('descontar', { ...libro, existencias: libro.existencias - cantidad });
    },
    reponer: (id, cantidad, requestId) => {
      llamadas.push(['reponer', id, cantidad, requestId]);
      return responder('reponer', libro);
    },
  };
}

export const fallas = {
  noEncontrado: () => errores.noEncontrado('No existe el libro con id 7.'),
  sinExistencias: () =>
    errores.existenciasInsuficientes('Solo hay 2 unidades disponibles de "Rayuela".', { disponibles: 2, solicitadas: 5 }),
  caido: () => errores.librosNoDisponible(),
};

/** Logger que guarda los eventos para verificar, por ejemplo, el error crítico de la saga. */
export function loggerEnMemoria() {
  const eventos = [];
  const registrar = (nivel) => (mensaje, datos) => eventos.push({ nivel, mensaje, datos });
  return { eventos, debug: registrar('debug'), info: registrar('info'), warn: registrar('warn'), error: registrar('error') };
}

export function crearAppDePrueba({
  repositorio = repositorioEnMemoria(),
  clienteLibros = clienteLibrosSimulado(),
  verificarBaseDatos = async () => {},
  logger = loggerSilencioso,
} = {}) {
  const config = cargarConfiguracion({ NODE_ENV: 'test', APP_VERSION: '9.9.9' });
  return crearApp({ config, logger, repositorio, clienteLibros, verificarBaseDatos });
}
