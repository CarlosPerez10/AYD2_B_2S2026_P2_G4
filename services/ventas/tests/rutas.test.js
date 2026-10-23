import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clienteLibrosSimulado, crearAppDePrueba, fallas, repositorioEnMemoria } from './helpers/entorno.js';

describe('GET /health', () => {
  it('responde 200 con la base disponible', async () => {
    const respuesta = await request(crearAppDePrueba()).get('/health').expect(200);
    assert.equal(respuesta.body.servicio, 'ventas');
    assert.equal(respuesta.body.baseDeDatos, 'ok');
  });

  it('responde 503 si la base no responde', async () => {
    const app = crearAppDePrueba({
      verificarBaseDatos: async () => {
        throw new Error('sin conexión');
      },
    });
    const respuesta = await request(app).get('/health').expect(503);
    assert.equal(respuesta.body.estado, 'degradado');
  });
});

describe('POST /api/v1/ventas', () => {
  it('registra la venta y responde 201', async () => {
    const respuesta = await request(crearAppDePrueba()).post('/api/v1/ventas').send({ libroId: 7, cantidad: 2 }).expect(201);
    assert.equal(respuesta.body.data.libroId, 7);
    assert.equal(respuesta.body.data.total, 351);
    assert.equal(respuesta.headers.location, `/api/v1/ventas/${respuesta.body.data.id}`);
  });

  it('propaga el X-Request-Id hacia Libros', async () => {
    const clienteLibros = clienteLibrosSimulado();
    await request(crearAppDePrueba({ clienteLibros }))
      .post('/api/v1/ventas')
      .set('X-Request-Id', 'req-abcdefgh')
      .send({ libroId: 7, cantidad: 1 })
      .expect(201);
    assert.ok(clienteLibros.llamadas.every((llamada) => llamada.at(-1) === 'req-abcdefgh'));
  });

  it('responde 409 sin existencias y no guarda nada', async () => {
    const repositorio = repositorioEnMemoria();
    const clienteLibros = clienteLibrosSimulado({ escenario: { descontar: fallas.sinExistencias } });
    const respuesta = await request(crearAppDePrueba({ repositorio, clienteLibros }))
      .post('/api/v1/ventas')
      .send({ libroId: 7, cantidad: 5 })
      .expect(409);
    assert.equal(respuesta.body.error.codigo, 'EXISTENCIAS_INSUFICIENTES');
    assert.deepEqual(respuesta.body.error.detalles, { disponibles: 2, solicitadas: 5 });
    assert.equal(repositorio.ventas.length, 0);
  });

  it('responde 404 si el libro no existe y 503 si Libros está caído', async () => {
    const noExiste = clienteLibrosSimulado({ escenario: { obtenerLibro: fallas.noEncontrado } });
    await request(crearAppDePrueba({ clienteLibros: noExiste })).post('/api/v1/ventas').send({ libroId: 7, cantidad: 1 }).expect(404);
    const caido = clienteLibrosSimulado({ escenario: { obtenerLibro: fallas.caido } });
    const respuesta = await request(crearAppDePrueba({ clienteLibros: caido }))
      .post('/api/v1/ventas')
      .send({ libroId: 7, cantidad: 1 })
      .expect(503);
    assert.equal(respuesta.body.error.codigo, 'SERVICIO_NO_DISPONIBLE');
  });

  it('responde 400 con datos inválidos sin llamar a Libros', async () => {
    const clienteLibros = clienteLibrosSimulado();
    await request(crearAppDePrueba({ clienteLibros })).post('/api/v1/ventas').send({ libroId: 0 }).expect(400);
    assert.equal(clienteLibros.llamadas.length, 0);
  });
});

describe('consultas', () => {
  const venta = { id: 1, libroId: 7, titulo: 'R', autor: 'J', cantidad: 1, precioUnitario: 1, total: 1, fecha: new Date() };

  it('lista el historial con meta', async () => {
    const respuesta = await request(crearAppDePrueba({ repositorio: repositorioEnMemoria([venta]) }))
      .get('/api/v1/ventas')
      .expect(200);
    assert.equal(respuesta.body.data.length, 1);
    assert.deepEqual(respuesta.body.meta, { pagina: 1, limite: 20, total: 1, totalPaginas: 1 });
  });

  it('obtiene una venta o responde 404', async () => {
    const app = crearAppDePrueba({ repositorio: repositorioEnMemoria([venta]) });
    await request(app).get('/api/v1/ventas/1').expect(200);
    await request(app).get('/api/v1/ventas/2').expect(404);
  });

  it('resuelve /ranking antes que /:id y funciona con Libros caído', async () => {
    const clienteLibros = clienteLibrosSimulado({ escenario: { obtenerLibro: fallas.caido } });
    const respuesta = await request(crearAppDePrueba({ clienteLibros })).get('/api/v1/ventas/ranking?limite=5').expect(200);
    assert.deepEqual(respuesta.body.data, []);
    assert.equal(respuesta.body.meta.limite, 5);
  });

  it('responde 400 con un rango de fechas invertido', async () => {
    await request(crearAppDePrueba()).get('/api/v1/ventas/ranking?desde=2026-10-15&hasta=2026-10-01').expect(400);
  });
});
