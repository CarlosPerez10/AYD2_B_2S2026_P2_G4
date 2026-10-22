import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearAppDePrueba, eco, servicioSimulado } from './helpers/entorno.js';

describe('seguridad del borde', () => {
  let libros;
  let app;

  before(async () => {
    libros = await servicioSimulado(eco);
    app = crearAppDePrueba({ LIBROS_SERVICE_URL: libros.url, VENTAS_SERVICE_URL: libros.url });
  });

  after(() => libros.cerrar());

  it('bloquea las rutas internas entre servicios', async () => {
    const antes = libros.peticiones.length;
    const respuesta = await request(app).post('/internal/v1/libros/1/descontar').send({ cantidad: 1 }).expect(404);
    assert.equal(respuesta.body.error.codigo, 'NO_ENCONTRADO');
    assert.equal(libros.peticiones.length, antes);
  });

  const rutasMaliciosas = [
    '/api/v1/libros/../../internal/v1/libros/1/descontar',
    '/api/v1/libros/%2e%2e/%2e%2e/internal/v1/libros/1',
    '/api/v1/libros/..%2F..%2Finternal',
    '/api/v1/libros//1',
    '/api/v1/libros/1%5C..%5Cx',
  ];

  for (const ruta of rutasMaliciosas) {
    it(`rechaza la ruta ${ruta}`, async () => {
      const respuesta = await request(app).get(ruta).expect(400);
      assert.equal(respuesta.body.error.codigo, 'RUTA_INVALIDA');
    });
  }

  it('permite puntos dentro de la consulta', async () => {
    await request(app).get('/api/v1/libros?q=J.R.R.%20Tolkien').expect(200);
  });

  it('responde 404 con formato uniforme en rutas desconocidas', async () => {
    const respuesta = await request(app).get('/no-existe').expect(404);
    assert.deepEqual(Object.keys(respuesta.body.error).sort(), ['codigo', 'mensaje', 'requestId']);
  });

  it('agrega cabeceras de seguridad y oculta la tecnología', async () => {
    const respuesta = await request(app).get('/health').expect(200);
    assert.equal(respuesta.headers['x-content-type-options'], 'nosniff');
    assert.equal(respuesta.headers['x-powered-by'], undefined);
  });

  it('responde la petición previa de CORS sin pedir llave', async () => {
    const respuesta = await request(app)
      .options('/api/v1/ventas')
      .set('Origin', 'http://localhost:8081')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,x-api-key')
      .expect(204);
    assert.match(respuesta.headers['access-control-allow-headers'], /X-Api-Key/i);
  });

  it('restringe CORS a los orígenes configurados', async () => {
    const restringida = crearAppDePrueba({ LIBROS_SERVICE_URL: libros.url, CORS_ORIGINS: 'http://permitido.test' });
    const permitida = await request(restringida).get('/health').set('Origin', 'http://permitido.test');
    const rechazada = await request(restringida).get('/health').set('Origin', 'http://otro.test');
    assert.equal(permitida.headers['access-control-allow-origin'], 'http://permitido.test');
    assert.equal(rechazada.headers['access-control-allow-origin'], undefined);
  });
});

describe('límite de peticiones', () => {
  let libros;

  before(async () => {
    libros = await servicioSimulado(eco);
  });

  after(() => libros.cerrar());

  it('responde 429 al superar el máximo por ventana', async () => {
    const app = crearAppDePrueba({ LIBROS_SERVICE_URL: libros.url, RATE_LIMIT_MAX: '3' });
    for (let i = 0; i < 3; i += 1) await request(app).get('/api/v1/libros').expect(200);
    const respuesta = await request(app).get('/api/v1/libros').expect(429);
    assert.equal(respuesta.body.error.codigo, 'DEMASIADAS_PETICIONES');
    assert.ok(respuesta.headers.ratelimit);
  });

  it('no aplica el límite a las rutas de salud', async () => {
    const app = crearAppDePrueba({ LIBROS_SERVICE_URL: libros.url, RATE_LIMIT_MAX: '1' });
    for (let i = 0; i < 5; i += 1) await request(app).get('/health').expect(200);
  });
});
