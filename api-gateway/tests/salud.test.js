import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { URL_SIN_SERVICIO, crearAppDePrueba, servicioSimulado } from './helpers/entorno.js';

function saludable(version) {
  return (req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ estado: 'ok', baseDeDatos: 'ok', version }));
  };
}

describe('GET /health', () => {
  it('reporta el estado del propio gateway', async () => {
    const app = crearAppDePrueba({ APP_VERSION: '9.9.9' });
    const respuesta = await request(app).get('/health').expect(200);
    assert.equal(respuesta.body.estado, 'ok');
    assert.equal(respuesta.body.servicio, 'api-gateway');
    assert.equal(respuesta.body.version, '9.9.9');
    assert.equal(typeof respuesta.body.tiempoActivo, 'number');
  });
});

describe('GET /health/servicios', () => {
  let libros;
  let ventas;

  before(async () => {
    libros = await servicioSimulado(saludable('1.0.0'));
    ventas = await servicioSimulado(saludable('1.1.0'));
  });

  after(async () => {
    await libros.cerrar();
    await ventas.cerrar();
  });

  it('responde 200 cuando todos los servicios están bien', async () => {
    const app = crearAppDePrueba({ LIBROS_SERVICE_URL: libros.url, VENTAS_SERVICE_URL: ventas.url });
    const respuesta = await request(app).get('/health/servicios').expect(200);
    assert.equal(respuesta.body.estado, 'ok');
    assert.equal(respuesta.body.servicios.libros.estado, 'ok');
    assert.equal(respuesta.body.servicios.libros.version, '1.0.0');
    assert.equal(respuesta.body.servicios.ventas.baseDeDatos, 'ok');
  });

  it('responde 503 y marca "caido" el servicio sin conexión', async () => {
    const app = crearAppDePrueba({ LIBROS_SERVICE_URL: libros.url, VENTAS_SERVICE_URL: URL_SIN_SERVICIO });
    const respuesta = await request(app).get('/health/servicios').expect(503);
    assert.equal(respuesta.body.estado, 'degradado');
    assert.equal(respuesta.body.servicios.libros.estado, 'ok');
    assert.equal(respuesta.body.servicios.ventas.estado, 'caido');
  });

  it('marca "degradado" un servicio que responde con error', async () => {
    const sinBase = await servicioSimulado((req, res) => {
      res.statusCode = 503;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ estado: 'degradado', baseDeDatos: 'error' }));
    });
    try {
      const app = crearAppDePrueba({ LIBROS_SERVICE_URL: sinBase.url, VENTAS_SERVICE_URL: ventas.url });
      const respuesta = await request(app).get('/health/servicios').expect(503);
      assert.equal(respuesta.body.servicios.libros.estado, 'degradado');
      assert.equal(respuesta.body.servicios.libros.baseDeDatos, 'error');
    } finally {
      await sinBase.cerrar();
    }
  });

  it('no espera más que HEALTH_TIMEOUT_MS por un servicio colgado', async () => {
    const colgado = await servicioSimulado(() => {});
    try {
      const app = crearAppDePrueba({
        LIBROS_SERVICE_URL: colgado.url,
        VENTAS_SERVICE_URL: ventas.url,
        HEALTH_TIMEOUT_MS: '200',
      });
      const inicio = Date.now();
      const respuesta = await request(app).get('/health/servicios').expect(503);
      assert.ok(Date.now() - inicio < 1500);
      assert.match(respuesta.body.servicios.libros.detalle, /200 ms/);
    } finally {
      await colgado.cerrar();
    }
  });
});
