import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { errores } from '../src/utils/errores.js';

describe('errores.existenciasInsuficientes', () => {
  const mensaje = (existencias) => errores.existenciasInsuficientes({ existencias, titulo: 'Rayuela' }, 5).message;

  it('usa plural con varias unidades', () => {
    assert.equal(mensaje(3), 'Solo hay 3 unidades disponibles de "Rayuela".');
  });

  it('usa singular con una unidad', () => {
    assert.equal(mensaje(1), 'Solo queda 1 unidad disponible de "Rayuela".');
  });

  it('indica cuando ya no quedan unidades', () => {
    assert.equal(mensaje(0), 'No quedan unidades disponibles de "Rayuela".');
  });

  it('conserva los detalles para el cliente', () => {
    const error = errores.existenciasInsuficientes({ existencias: 2, titulo: 'Rayuela' }, 5);
    assert.equal(error.estado, 409);
    assert.deepEqual(error.detalles, { disponibles: 2, solicitadas: 5 });
  });
});
