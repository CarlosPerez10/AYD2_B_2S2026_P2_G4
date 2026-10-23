import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/utils/errores.js';
import { validarFiltros, validarId, validarLibroEntrada, validarMovimiento } from '../src/validators/libros.validator.js';

const valido = { titulo: 'Rayuela', autor: 'Julio Cortázar', precio: 175, existencias: 2 };

function camposConError(funcion) {
  try {
    funcion();
  } catch (error) {
    assert.ok(error instanceof ApiError);
    assert.equal(error.estado, 400);
    assert.equal(error.codigo, 'VALIDACION');
    return error.detalles.map((detalle) => detalle.campo);
  }
  assert.fail('se esperaba un error de validación');
}

describe('validarLibroEntrada', () => {
  it('acepta un libro válido y recorta espacios', () => {
    const datos = validarLibroEntrada({ ...valido, titulo: '  Rayuela  ', isbn: '9788437604572' });
    assert.deepEqual(datos, { ...valido, isbn: '9788437604572' });
  });

  it('usa null cuando no hay ISBN', () => {
    assert.equal(validarLibroEntrada(valido).isbn, null);
  });

  it('exige título y autor no vacíos', () => {
    assert.deepEqual(camposConError(() => validarLibroEntrada({ ...valido, titulo: '   ', autor: undefined })), [
      'titulo',
      'autor',
    ]);
  });

  it('rechaza precios no positivos, con más de 2 decimales o como texto', () => {
    for (const precio of [0, -5, 10.999, '10', Number.NaN]) {
      assert.deepEqual(camposConError(() => validarLibroEntrada({ ...valido, precio })), ['precio']);
    }
  });

  it('acepta precios con 2 decimales que no son exactos en binario', () => {
    assert.equal(validarLibroEntrada({ ...valido, precio: 0.29 }).precio, 0.29);
  });

  it('exige existencias enteras y no negativas', () => {
    for (const existencias of [-1, 1.5, '3', undefined]) {
      assert.deepEqual(camposConError(() => validarLibroEntrada({ ...valido, existencias })), ['existencias']);
    }
  });

  it('valida el formato del ISBN', () => {
    assert.deepEqual(camposConError(() => validarLibroEntrada({ ...valido, isbn: '123' })), ['isbn']);
  });

  it('rechaza campos extra', () => {
    assert.deepEqual(camposConError(() => validarLibroEntrada({ ...valido, id: 3 })), ['id']);
  });

  it('rechaza cuerpos que no son objetos', () => {
    assert.deepEqual(camposConError(() => validarLibroEntrada([valido])), ['cuerpo']);
  });
});

describe('validarFiltros', () => {
  it('aplica valores por defecto', () => {
    assert.deepEqual(validarFiltros({}), {
      q: undefined,
      autor: undefined,
      precioMin: undefined,
      precioMax: undefined,
      disponibles: false,
      orden: 'titulo',
      pagina: 1,
      limite: 20,
    });
  });

  it('convierte los parámetros a sus tipos', () => {
    const filtros = validarFiltros({
      q: ' garcia ',
      precioMin: '10.5',
      precioMax: '200',
      disponibles: 'true',
      orden: '-precio',
      pagina: '2',
      limite: '50',
    });
    assert.equal(filtros.q, 'garcia');
    assert.equal(filtros.precioMin, 10.5);
    assert.equal(filtros.precioMax, 200);
    assert.equal(filtros.disponibles, true);
    assert.equal(filtros.orden, '-precio');
    assert.equal(filtros.pagina, 2);
    assert.equal(filtros.limite, 50);
  });

  it('rechaza un orden fuera de la lista blanca', () => {
    assert.deepEqual(camposConError(() => validarFiltros({ orden: 'precio; DROP TABLE libro' })), ['orden']);
  });

  it('rechaza precioMin mayor que precioMax', () => {
    assert.deepEqual(camposConError(() => validarFiltros({ precioMin: '100', precioMax: '50' })), ['precioMin']);
  });

  it('rechaza límites fuera de rango y parámetros repetidos', () => {
    assert.deepEqual(camposConError(() => validarFiltros({ limite: '101', pagina: '0', q: ['a', 'b'] })), [
      'q',
      'pagina',
      'limite',
    ]);
  });

  it('rechaza valores no booleanos en disponibles', () => {
    assert.deepEqual(camposConError(() => validarFiltros({ disponibles: 'si' })), ['disponibles']);
  });
});

describe('validarId y validarMovimiento', () => {
  it('acepta ids positivos', () => {
    assert.equal(validarId('7'), 7);
  });

  it('rechaza ids inválidos', () => {
    for (const id of ['0', '-1', 'abc', '1.5', '99999999999']) {
      assert.deepEqual(camposConError(() => validarId(id)), ['id']);
    }
  });

  it('valida la cantidad del movimiento', () => {
    assert.equal(validarMovimiento({ cantidad: 3 }), 3);
    for (const cuerpo of [{}, { cantidad: 0 }, { cantidad: 1001 }, { cantidad: '2' }, null]) {
      assert.deepEqual(camposConError(() => validarMovimiento(cuerpo)), ['cantidad']);
    }
  });
});
