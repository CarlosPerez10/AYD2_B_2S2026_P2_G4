import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cargarConfiguracion } from '../src/config/index.js';

describe('configuración', () => {
  it('aplica valores por defecto para desarrollo', () => {
    const config = cargarConfiguracion({});
    assert.equal(config.puerto, 3001);
    assert.equal(config.baseDatos.host, 'localhost');
    assert.equal(config.baseDatos.ssl, false);
    assert.equal(config.nivelLog, 'debug');
  });

  it('lee las variables de la base de datos', () => {
    const config = cargarConfiguracion({
      DB_HOST: 'libros-db',
      DB_PORT: '5433',
      DB_NAME: 'otra',
      DB_USER: 'u',
      DB_PASSWORD: 'p',
      DB_SSL: 'true',
    });
    assert.deepEqual(
      { ...config.baseDatos },
      {
        host: 'libros-db',
        puerto: 5433,
        nombre: 'otra',
        usuario: 'u',
        contrasena: 'p',
        ssl: true,
        rutaCa: '/app/certs/global-bundle.pem',
        maximoConexiones: 10,
      },
    );
  });

  it('exige DB_PASSWORD en producción', () => {
    assert.throws(() => cargarConfiguracion({ NODE_ENV: 'production' }), /DB_PASSWORD/);
  });

  it('rechaza valores inválidos', () => {
    assert.throws(() => cargarConfiguracion({ PORT: 'abc' }), /PORT/);
    assert.throws(() => cargarConfiguracion({ DB_SSL: 'si' }), /DB_SSL/);
  });
});
