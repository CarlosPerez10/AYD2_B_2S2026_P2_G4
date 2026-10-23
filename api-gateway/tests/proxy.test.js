import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { LLAVE, URL_SIN_SERVICIO, crearAppDePrueba, eco, servicioSimulado } from './helpers/entorno.js';

describe('proxy hacia los microservicios', () => {
  let libros;
  let ventas;
  let app;

  before(async () => {
    libros = await servicioSimulado(eco);
    ventas = await servicioSimulado((req, res, cuerpo) => {
      res.setHeader('x-request-id', 'id-del-servicio-que-no-debe-salir');
      res.setHeader('x-servicio', 'ventas');
      eco(req, res, cuerpo);
    });
    app = crearAppDePrueba({ LIBROS_SERVICE_URL: libros.url, VENTAS_SERVICE_URL: ventas.url });
  });

  after(async () => {
    await libros.cerrar();
    await ventas.cerrar();
  });

  it('reenvía la ruta y la consulta sin reescribirlas', async () => {
    const respuesta = await request(app).get('/api/v1/libros?q=garc%C3%ADa&pagina=2').expect(200);
    assert.equal(respuesta.body.url, '/api/v1/libros?q=garc%C3%ADa&pagina=2');
  });

  it('enruta cada prefijo a su servicio', async () => {
    await request(app).get('/api/v1/libros/7').expect(200);
    await request(app).get('/api/v1/ventas/ranking').expect(200);
    assert.equal(libros.peticiones.at(-1).url, '/api/v1/libros/7');
    assert.equal(ventas.peticiones.at(-1).url, '/api/v1/ventas/ranking');
  });

  it('no confunde prefijos parecidos', async () => {
    await request(app).get('/api/v1/librosx').expect(404);
  });

  it('reenvía el cuerpo y el método intactos', async () => {
    const respuesta = await request(app)
      .put('/api/v1/libros/7')
      .set('X-Api-Key', LLAVE)
      .send({ titulo: 'Rayuela', precio: 150 })
      .expect(200);
    assert.equal(respuesta.body.metodo, 'PUT');
    assert.deepEqual(JSON.parse(respuesta.body.cuerpo), { titulo: 'Rayuela', precio: 150 });
  });

  it('propaga X-Request-Id al servicio y lo devuelve al cliente', async () => {
    const respuesta = await request(app).get('/api/v1/libros').set('X-Request-Id', 'prueba-trazabilidad-01').expect(200);
    assert.equal(respuesta.headers['x-request-id'], 'prueba-trazabilidad-01');
    assert.equal(libros.peticiones.at(-1).encabezados['x-request-id'], 'prueba-trazabilidad-01');
  });

  it('genera un X-Request-Id nuevo si el recibido no es válido', async () => {
    const respuesta = await request(app).get('/api/v1/libros').set('X-Request-Id', 'id con espacios <script>').expect(200);
    assert.match(respuesta.headers['x-request-id'], /^[0-9a-f-]{36}$/);
  });

  it('conserva el X-Request-Id del gateway aunque el servicio envíe otro', async () => {
    const respuesta = await request(app).get('/api/v1/ventas/ranking').set('X-Request-Id', 'id-del-gateway-123').expect(200);
    assert.equal(respuesta.headers['x-request-id'], 'id-del-gateway-123');
    assert.equal(respuesta.headers['x-servicio'], 'ventas');
  });

  it('agrega encabezados X-Forwarded-*', async () => {
    await request(app).get('/api/v1/libros').expect(200);
    const { encabezados } = libros.peticiones.at(-1);
    assert.ok(encabezados['x-forwarded-for']);
    assert.equal(encabezados['x-forwarded-proto'], 'http');
  });
});

describe('fallos de los microservicios', () => {
  it('responde 503 cuando el servicio no acepta conexiones', async () => {
    const app = crearAppDePrueba({ LIBROS_SERVICE_URL: URL_SIN_SERVICIO });
    const respuesta = await request(app).get('/api/v1/libros').expect(503);
    assert.equal(respuesta.body.error.codigo, 'SERVICIO_NO_DISPONIBLE');
    assert.ok(respuesta.body.error.requestId);
  });

  it('responde 504 cuando el servicio no responde a tiempo', async () => {
    const lento = await servicioSimulado(() => {});
    try {
      const app = crearAppDePrueba({ LIBROS_SERVICE_URL: lento.url, PROXY_TIMEOUT_MS: '150' });
      const respuesta = await request(app).get('/api/v1/libros').expect(504);
      assert.equal(respuesta.body.error.codigo, 'TIEMPO_AGOTADO');
    } finally {
      await lento.cerrar();
    }
  });

  it('responde 502 cuando el servicio corta la conexión', async () => {
    const roto = await servicioSimulado((req) => req.socket.destroy());
    try {
      const app = crearAppDePrueba({ VENTAS_SERVICE_URL: roto.url });
      const respuesta = await request(app).get('/api/v1/ventas/ranking').expect(502);
      assert.equal(respuesta.body.error.codigo, 'RESPUESTA_INVALIDA');
    } finally {
      await roto.cerrar();
    }
  });

  it('devuelve tal cual los errores de negocio del servicio', async () => {
    const conflicto = await servicioSimulado((req, res) => {
      res.statusCode = 409;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: { codigo: 'EXISTENCIAS_INSUFICIENTES', mensaje: 'Sin existencias' } }));
    });
    try {
      const app = crearAppDePrueba({ VENTAS_SERVICE_URL: conflicto.url });
      const respuesta = await request(app)
        .post('/api/v1/ventas')
        .set('X-Api-Key', LLAVE)
        .send({ libroId: 1, cantidad: 99 })
        .expect(409);
      assert.equal(respuesta.body.error.codigo, 'EXISTENCIAS_INSUFICIENTES');
    } finally {
      await conflicto.cerrar();
    }
  });
});
