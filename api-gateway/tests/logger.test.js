import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { crearLogger } from '../src/utils/logger.js';

function destinoEnMemoria() {
  const lineas = [];
  return { lineas, write: (texto) => lineas.push(JSON.parse(texto)) };
}

describe('crearLogger', () => {
  it('escribe un JSON por evento con servicio y nivel', () => {
    const destino = destinoEnMemoria();
    crearLogger({ servicio: 'api-gateway', nivel: 'info', destino }).info('hola', { requestId: 'abc' });
    assert.equal(destino.lineas.length, 1);
    assert.equal(destino.lineas[0].servicio, 'api-gateway');
    assert.equal(destino.lineas[0].nivel, 'info');
    assert.equal(destino.lineas[0].requestId, 'abc');
    assert.ok(Date.parse(destino.lineas[0].fecha));
  });

  it('descarta eventos por debajo del nivel configurado', () => {
    const destino = destinoEnMemoria();
    const logger = crearLogger({ servicio: 'x', nivel: 'warn', destino });
    logger.debug('a');
    logger.info('b');
    logger.warn('c');
    logger.error('d');
    assert.deepEqual(destino.lineas.map((linea) => linea.mensaje), ['c', 'd']);
  });

  it('serializa los errores con nombre, mensaje y pila', () => {
    const destino = destinoEnMemoria();
    crearLogger({ servicio: 'x', destino }).error('fallo', { error: new TypeError('malo') });
    assert.equal(destino.lineas[0].error.nombre, 'TypeError');
    assert.equal(destino.lineas[0].error.mensaje, 'malo');
    assert.match(destino.lineas[0].error.pila, /TypeError/);
  });
});
