import { errores } from '../utils/errores.js';

const ENTERO = /^\d+$/;
// Fecha (2026-10-01) o fecha y hora ISO 8601 (2026-10-01T00:00:00Z, con o sin zona).
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})?)?$/;

function esObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function lanzarSiHayErrores(detalles) {
  if (detalles.length > 0) throw errores.validacion(detalles);
}

/** Valida un id de ruta y lo devuelve como número. */
export function validarId(valor, campo = 'id') {
  if (typeof valor !== 'string' || !ENTERO.test(valor) || Number(valor) < 1 || Number(valor) > 2_147_483_647) {
    throw errores.validacion([{ campo, mensaje: 'Debe ser un entero positivo.' }]);
  }
  return Number(valor);
}

export function validarVentaEntrada(cuerpo) {
  if (!esObjeto(cuerpo)) {
    throw errores.validacion([{ campo: 'cuerpo', mensaje: 'Debe ser un objeto JSON.' }]);
  }
  const detalles = [];
  for (const campo of Object.keys(cuerpo)) {
    if (!['libroId', 'cantidad'].includes(campo)) detalles.push({ campo, mensaje: 'Campo no permitido.' });
  }
  const { libroId, cantidad } = cuerpo;
  if (!Number.isInteger(libroId) || libroId < 1 || libroId > 2_147_483_647) {
    detalles.push({ campo: 'libroId', mensaje: 'Debe ser un entero positivo.' });
  }
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 1000) {
    detalles.push({ campo: 'cantidad', mensaje: 'Debe ser un entero entre 1 y 1000.' });
  }
  lanzarSiHayErrores(detalles);
  return { libroId, cantidad };
}

/** Lector de parámetros de consulta que acumula errores en `detalles`. */
function lectorDeConsulta(consulta, detalles) {
  const leer = (campo) => {
    const valor = consulta[campo];
    if (valor === undefined || valor === '') return undefined;
    if (typeof valor !== 'string') {
      detalles.push({ campo, mensaje: 'Debe enviarse una sola vez.' });
      return undefined;
    }
    return valor;
  };

  return {
    entero(campo, porDefecto, min, max) {
      const valor = leer(campo);
      if (valor === undefined) return porDefecto;
      if (!ENTERO.test(valor) || Number(valor) < min || Number(valor) > max) {
        detalles.push({ campo, mensaje: `Debe ser un entero entre ${min} y ${max}.` });
        return porDefecto;
      }
      return Number(valor);
    },
    fecha(campo) {
      const valor = leer(campo);
      if (valor === undefined) return undefined;
      const fecha = new Date(valor);
      if (!FECHA_ISO.test(valor) || Number.isNaN(fecha.getTime())) {
        detalles.push({ campo, mensaje: 'Debe ser una fecha ISO 8601 (p. ej. 2026-10-01).' });
        return undefined;
      }
      return fecha;
    },
  };
}

function validarRango(desde, hasta, detalles) {
  if (desde && hasta && desde >= hasta) {
    detalles.push({ campo: 'desde', mensaje: 'Debe ser anterior a hasta.' });
  }
}

/** Parámetros de GET /api/v1/ventas. */
export function validarFiltrosHistorial(consulta) {
  const detalles = [];
  const lector = lectorDeConsulta(consulta, detalles);
  const desde = lector.fecha('desde');
  const hasta = lector.fecha('hasta');
  const libroId = lector.entero('libroId', undefined, 1, 2_147_483_647);
  const pagina = lector.entero('pagina', 1, 1, 100_000);
  const limite = lector.entero('limite', 20, 1, 100);
  validarRango(desde, hasta, detalles);
  lanzarSiHayErrores(detalles);
  return { desde, hasta, libroId, pagina, limite };
}

/** Parámetros de GET /api/v1/ventas/ranking. */
export function validarFiltrosRanking(consulta) {
  const detalles = [];
  const lector = lectorDeConsulta(consulta, detalles);
  const limite = lector.entero('limite', 10, 1, 50);
  const desde = lector.fecha('desde');
  const hasta = lector.fecha('hasta');
  validarRango(desde, hasta, detalles);
  lanzarSiHayErrores(detalles);
  return { limite, desde, hasta };
}
