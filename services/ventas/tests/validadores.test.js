import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarFiltrosHistorial,
  validarFiltrosRanking,
  validarVentaEntrada,
} from '../src/validators/ventas.validator.js';

function camposConError(funcion) {
  try {
    funcion();
  } catch (error) {
    assert.equal(error.codigo, 'VALIDACION');
    return error.detalles.map((detalle) => detalle.campo);
  }
  assert.fail('se esperaba un error de validación');
}

describe('validarVentaEntrada', () => {
  it('acepta una venta válida', () => {
    assert.deepEqual(validarVentaEntrada({ libroId: 7, cantidad: 2 }), { libroId: 7, cantidad: 2 });
  });

  it('rechaza ids y cantidades inválidas y campos extra', () => {
    assert.deepEqual(camposConError(() => validarVentaEntrada({ libroId: '7', cantidad: 0, precio: 1 })), [
      'precio',
      'libroId',
      'cantidad',
    ]);
    assert.deepEqual(camposConError(() => validarVentaEntrada({ libroId: 7, cantidad: 1001 })), ['cantidad']);
    assert.deepEqual(camposConError(() => validarVentaEntrada(null)), ['cuerpo']);
  });
});

describe('validarFiltrosRanking', () => {
  it('usa limite 10 por defecto y sin fechas', () => {
    assert.deepEqual(validarFiltrosRanking({}), { limite: 10, desde: undefined, hasta: undefined });
  });

  it('acepta fechas ISO', () => {
    const filtros = validarFiltrosRanking({ desde: '2026-10-01', hasta: '2026-10-15T23:59:59Z', limite: '20' });
    assert.equal(filtros.desde.toISOString(), '2026-10-01T00:00:00.000Z');
    assert.equal(filtros.hasta.toISOString(), '2026-10-15T23:59:59.000Z');
    assert.equal(filtros.limite, 20);
  });

  it('rechaza límites fuera de 1..50', () => {
    assert.deepEqual(camposConError(() => validarFiltrosRanking({ limite: '51' })), ['limite']);
    assert.deepEqual(camposConError(() => validarFiltrosRanking({ limite: '0' })), ['limite']);
  });

  it('rechaza fechas inválidas y rangos invertidos', () => {
    assert.deepEqual(camposConError(() => validarFiltrosRanking({ desde: 'ayer' })), ['desde']);
    assert.deepEqual(camposConError(() => validarFiltrosRanking({ desde: '2026-13-45' })), ['desde']);
    assert.deepEqual(camposConError(() => validarFiltrosRanking({ desde: '2026-10-15', hasta: '2026-10-01' })), [
      'desde',
    ]);
  });
});

describe('validarFiltrosHistorial', () => {
  it('aplica valores por defecto', () => {
    assert.deepEqual(validarFiltrosHistorial({}), {
      desde: undefined,
      hasta: undefined,
      libroId: undefined,
      pagina: 1,
      limite: 20,
    });
  });

  it('rechaza libroId y limite inválidos', () => {
    assert.deepEqual(camposConError(() => validarFiltrosHistorial({ libroId: 'x', limite: '101' })), [
      'libroId',
      'limite',
    ]);
  });
});
