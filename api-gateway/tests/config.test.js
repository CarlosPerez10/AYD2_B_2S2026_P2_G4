import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cargarConfiguracion } from '../src/config/index.js';

const BASE = { ADMIN_API_KEY: 'una-llave-suficientemente-larga' };

describe('cargarConfiguracion', () => {
  it('aplica valores por defecto', () => {
    const config = cargarConfiguracion(BASE);
    assert.equal(config.puerto, 8080);
    assert.equal(config.servicios.libros, 'http://localhost:3001');
    assert.equal(config.servicios.ventas, 'http://localhost:3002');
    assert.equal(config.limitePeticiones.maximo, 300);
    assert.equal(config.origenesCors, '*');
    assert.equal(config.nivelLog, 'debug');
  });

  it('usa nivel info en producción', () => {
    assert.equal(cargarConfiguracion({ ...BASE, NODE_ENV: 'production' }).nivelLog, 'info');
  });

  it('exige una llave de administración de al menos 16 caracteres', () => {
    assert.throws(() => cargarConfiguracion({}), /ADMIN_API_KEY/);
    assert.throws(() => cargarConfiguracion({ ADMIN_API_KEY: 'corta' }), /ADMIN_API_KEY/);
  });

  it('rechaza puertos y tiempos no numéricos', () => {
    assert.throws(() => cargarConfiguracion({ ...BASE, PORT: 'abc' }), /PORT/);
    assert.throws(() => cargarConfiguracion({ ...BASE, PROXY_TIMEOUT_MS: '10' }), /PROXY_TIMEOUT_MS/);
  });

  it('rechaza URLs de servicio inválidas o con protocolo no http', () => {
    assert.throws(() => cargarConfiguracion({ ...BASE, LIBROS_SERVICE_URL: 'no es url' }), /LIBROS_SERVICE_URL/);
    assert.throws(() => cargarConfiguracion({ ...BASE, VENTAS_SERVICE_URL: 'ftp://ventas' }), /VENTAS_SERVICE_URL/);
  });

  it('normaliza las URLs de servicio a su origen', () => {
    const config = cargarConfiguracion({ ...BASE, LIBROS_SERVICE_URL: 'http://10.0.1.20:3001/' });
    assert.equal(config.servicios.libros, 'http://10.0.1.20:3001');
  });

  it('separa los orígenes de CORS por coma', () => {
    const config = cargarConfiguracion({ ...BASE, CORS_ORIGINS: 'http://a.test, http://b.test,' });
    assert.deepEqual([...config.origenesCors], ['http://a.test', 'http://b.test']);
  });

  it('devuelve una configuración inmutable', () => {
    const config = cargarConfiguracion(BASE);
    assert.throws(() => {
      config.puerto = 1;
    }, TypeError);
  });
});
