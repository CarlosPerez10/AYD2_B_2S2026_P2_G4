import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { requiereAdmin } from '../src/middlewares/autenticacionAdmin.js';
import { LLAVE, crearAppDePrueba, eco, servicioSimulado } from './helpers/entorno.js';

describe('requiereAdmin', () => {
  const casos = [
    ['GET', '/api/v1/libros', false],
    ['GET', '/api/v1/libros/7', false],
    ['GET', '/api/v1/libros/autores', false],
    ['HEAD', '/api/v1/libros', false],
    ['GET', '/api/v1/ventas/ranking', false],
    ['GET', '/api/v1/ventas/ranking/', false],
    ['OPTIONS', '/api/v1/ventas', false],
    ['GET', '/api/v1/ventas', true],
    ['GET', '/api/v1/ventas/31', true],
    ['GET', '/api/v1/ventas/ranking-falso', true],
    ['POST', '/api/v1/libros', true],
    ['PUT', '/api/v1/libros/7', true],
    ['PATCH', '/api/v1/libros/7', true],
    ['DELETE', '/api/v1/libros/7', true],
    ['POST', '/api/v1/ventas', true],
  ];

  for (const [metodo, ruta, esperado] of casos) {
    it(`${metodo} ${ruta} → ${esperado ? 'protegida' : 'pública'}`, () => {
      assert.equal(requiereAdmin(metodo, ruta), esperado);
    });
  }
});

describe('autenticación en el gateway', () => {
  let libros;
  let ventas;
  let app;

  before(async () => {
    libros = await servicioSimulado(eco);
    ventas = await servicioSimulado(eco);
    app = crearAppDePrueba({ LIBROS_SERVICE_URL: libros.url, VENTAS_SERVICE_URL: ventas.url });
  });

  after(async () => {
    await libros.cerrar();
    await ventas.cerrar();
  });

  it('deja pasar lecturas públicas sin llave', async () => {
    await request(app).get('/api/v1/libros').expect(200);
    await request(app).get('/api/v1/ventas/ranking').expect(200);
  });

  it('responde 401 sin llave y no contacta al microservicio', async () => {
    const antes = libros.peticiones.length;
    const respuesta = await request(app).post('/api/v1/libros').send({ titulo: 'x' }).expect(401);
    assert.equal(respuesta.body.error.codigo, 'NO_AUTORIZADO');
    assert.equal(libros.peticiones.length, antes);
  });

  it('responde 401 con una llave incorrecta', async () => {
    await request(app).get('/api/v1/ventas').set('X-Api-Key', 'llave-que-no-es-la-correcta').expect(401);
  });

  it('acepta la llave correcta y no la reenvía al microservicio', async () => {
    await request(app).post('/api/v1/ventas').set('X-Api-Key', LLAVE).send({ libroId: 1, cantidad: 1 }).expect(200);
    const ultima = ventas.peticiones.at(-1);
    assert.equal(ultima.metodo, 'POST');
    assert.equal(ultima.encabezados['x-api-key'], undefined);
  });
});
