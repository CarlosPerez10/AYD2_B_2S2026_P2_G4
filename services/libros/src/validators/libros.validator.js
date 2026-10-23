import { errores } from '../utils/errores.js';

export const ORDENES_VALIDOS = Object.freeze(['titulo', '-titulo', 'autor', '-autor', 'precio', '-precio']);
const CAMPOS_LIBRO = new Set(['isbn', 'titulo', 'autor', 'precio', 'existencias']);
const ISBN = /^\d{13}$/;
const ENTERO = /^\d+$/;
const DECIMAL = /^\d+(\.\d+)?$/;

function esObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function tieneDosDecimalesOMenos(numero) {
  const centavos = numero * 100;
  return Math.abs(centavos - Math.round(centavos)) < 1e-6;
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

/** Valida el cuerpo de POST y PUT. Devuelve los datos normalizados (con trim). */
export function validarLibroEntrada(cuerpo) {
  if (!esObjeto(cuerpo)) {
    throw errores.validacion([{ campo: 'cuerpo', mensaje: 'Debe ser un objeto JSON.' }]);
  }

  const detalles = [];
  for (const campo of Object.keys(cuerpo)) {
    if (!CAMPOS_LIBRO.has(campo)) detalles.push({ campo, mensaje: 'Campo no permitido.' });
  }

  const texto = (campo, maximo) => {
    const valor = cuerpo[campo];
    if (typeof valor !== 'string' || valor.trim() === '') {
      detalles.push({ campo, mensaje: 'Es obligatorio.' });
      return undefined;
    }
    const limpio = valor.trim();
    if (limpio.length > maximo) detalles.push({ campo, mensaje: `Debe tener como máximo ${maximo} caracteres.` });
    return limpio;
  };

  const titulo = texto('titulo', 200);
  const autor = texto('autor', 150);

  const { precio, existencias } = cuerpo;
  if (typeof precio !== 'number' || !Number.isFinite(precio)) {
    detalles.push({ campo: 'precio', mensaje: 'Es obligatorio y debe ser un número.' });
  } else if (precio <= 0) {
    detalles.push({ campo: 'precio', mensaje: 'Debe ser mayor a 0.' });
  } else if (precio > 99_999.99) {
    detalles.push({ campo: 'precio', mensaje: 'Debe ser como máximo 99999.99.' });
  } else if (!tieneDosDecimalesOMenos(precio)) {
    detalles.push({ campo: 'precio', mensaje: 'Debe tener como máximo 2 decimales.' });
  }

  if (!Number.isInteger(existencias) || existencias < 0 || existencias > 100_000) {
    detalles.push({ campo: 'existencias', mensaje: 'Debe ser un entero entre 0 y 100000.' });
  }

  let isbn = null;
  if (cuerpo.isbn !== undefined && cuerpo.isbn !== null) {
    if (typeof cuerpo.isbn !== 'string' || !ISBN.test(cuerpo.isbn.trim())) {
      detalles.push({ campo: 'isbn', mensaje: 'Debe tener exactamente 13 dígitos.' });
    } else {
      isbn = cuerpo.isbn.trim();
    }
  }

  lanzarSiHayErrores(detalles);
  return { isbn, titulo, autor, precio: Math.round(precio * 100) / 100, existencias };
}

/** Valida los parámetros de GET /api/v1/libros y aplica los valores por defecto. */
export function validarFiltros(consulta) {
  const detalles = [];
  // Un parámetro repetido (?q=a&q=b) llega como arreglo: se rechaza.
  const leer = (campo) => {
    const valor = consulta[campo];
    if (valor === undefined || valor === '') return undefined;
    if (typeof valor !== 'string') {
      detalles.push({ campo, mensaje: 'Debe enviarse una sola vez.' });
      return undefined;
    }
    return valor;
  };

  const textoBusqueda = (campo) => {
    const valor = leer(campo)?.trim();
    if (valor && valor.length > 100) {
      detalles.push({ campo, mensaje: 'Debe tener como máximo 100 caracteres.' });
      return undefined;
    }
    return valor || undefined;
  };

  const precio = (campo) => {
    const valor = leer(campo);
    if (valor === undefined) return undefined;
    if (!DECIMAL.test(valor)) {
      detalles.push({ campo, mensaje: 'Debe ser un número mayor o igual a 0.' });
      return undefined;
    }
    return Number(valor);
  };

  const entero = (campo, porDefecto, min, max) => {
    const valor = leer(campo);
    if (valor === undefined) return porDefecto;
    if (!ENTERO.test(valor) || Number(valor) < min || Number(valor) > max) {
      detalles.push({ campo, mensaje: `Debe ser un entero entre ${min} y ${max}.` });
      return porDefecto;
    }
    return Number(valor);
  };

  const q = textoBusqueda('q');
  const autor = textoBusqueda('autor');
  const precioMin = precio('precioMin');
  const precioMax = precio('precioMax');

  let disponibles = false;
  const textoDisponibles = leer('disponibles');
  if (textoDisponibles !== undefined) {
    if (textoDisponibles === 'true') disponibles = true;
    else if (textoDisponibles !== 'false') detalles.push({ campo: 'disponibles', mensaje: 'Debe ser true o false.' });
  }

  const orden = leer('orden') ?? 'titulo';
  if (!ORDENES_VALIDOS.includes(orden)) {
    detalles.push({ campo: 'orden', mensaje: `Debe ser uno de: ${ORDENES_VALIDOS.join(', ')}.` });
  }

  const pagina = entero('pagina', 1, 1, 100_000);
  const limite = entero('limite', 20, 1, 100);

  if (precioMin !== undefined && precioMax !== undefined && precioMin > precioMax) {
    detalles.push({ campo: 'precioMin', mensaje: 'No puede ser mayor que precioMax.' });
  }

  lanzarSiHayErrores(detalles);
  return { q, autor, precioMin, precioMax, disponibles, orden, pagina, limite };
}

/** Valida el cuerpo de descontar y reponer. */
export function validarMovimiento(cuerpo) {
  const cantidad = esObjeto(cuerpo) ? cuerpo.cantidad : undefined;
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 1000) {
    throw errores.validacion([{ campo: 'cantidad', mensaje: 'Debe ser un entero entre 1 y 1000.' }]);
  }
  return cantidad;
}
