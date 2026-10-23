import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cargarConfiguracion } from '../src/config/index.js';

describe('configuración', () => {
  it('aplica valores por defecto para desarrollo', () => {
    const config = cargarConfiguracion({});
    assert.equal(config.puerto, 3002);
    assert.equal(config.libros.url, 'http://localhost:3001');
    assert.equal(config.libros.tiempoLimiteMs, 3000);
    assert.equal(config.baseDatos.nombre, 'ventas_db');
  });

  it('normaliza LIBROS_SERVICE_URL a su origen', () => {
    assert.equal(cargarConfiguracion({ LIBROS_SERVICE_URL: 'http://10.0.1.20:3001/' }).libros.url, 'http://10.0.1.20:3001');
  });

  it('rechaza URLs y valores inválidos', () => {
    assert.throws(() => cargarConfiguracion({ LIBROS_SERVICE_URL: 'libros' }), /LIBROS_SERVICE_URL/);
    assert.throws(() => cargarConfiguracion({ LIBROS_SERVICE_URL: 'ftp://libros' }), /http o https/);
    assert.throws(() => cargarConfiguracion({ LIBROS_TIMEOUT_MS: '10' }), /LIBROS_TIMEOUT_MS/);
    assert.throws(() => cargarConfiguracion({ NODE_ENV: 'production' }), /DB_PASSWORD/);
  });
});
