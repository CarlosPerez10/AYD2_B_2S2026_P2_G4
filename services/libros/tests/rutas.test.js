import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearAppDePrueba, libroDePrueba, repositorioEnMemoria } from './helpers/entorno.js';

const nuevo = { titulo: 'Rayuela', autor: 'Julio Cortázar', precio: 175, existencias: 2 };

describe('GET /health', () => {
  it('responde 200 cuando la base responde', async () => {
    const respuesta = await request(crearAppDePrueba()).get('/health').expect(200);
    assert.equal(respuesta.body.estado, 'ok');
    assert.equal(respuesta.body.servicio, 'libros');
    assert.equal(respuesta.body.version, '9.9.9');
    assert.equal(respuesta.body.baseDeDatos, 'ok');
    assert.equal(typeof respuesta.body.tiempoActivo, 'number');
  });

  it('responde 503 cuando SELECT 1 falla', async () => {
    const app = crearAppDePrueba({
      verificarBaseDatos: async () => {
        throw new Error('sin conexión');
      },
    });
    const respuesta = await request(app).get('/health').expect(503);
    assert.equal(respuesta.body.estado, 'degradado');
    assert.equal(respuesta.body.baseDeDatos, 'error');
  });
});

describe('catálogo', () => {
  it('lista libros con data y meta', async () => {
    const repositorio = repositorioEnMemoria([libroDePrueba()]);
    const respuesta = await request(crearAppDePrueba({ repositorio })).get('/api/v1/libros?limite=5').expect(200);
    assert.equal(respuesta.body.data.length, 1);
    assert.deepEqual(respuesta.body.meta, { pagina: 1, limite: 5, total: 1, totalPaginas: 1 });
    assert.equal(repositorio.llamadas[0].args[0].limite, 5);
  });

  it('responde 400 con detalles ante filtros inválidos', async () => {
    const respuesta = await request(crearAppDePrueba()).get('/api/v1/libros?precioMin=50&precioMax=10').expect(400);
    assert.equal(respuesta.body.error.codigo, 'VALIDACION');
    assert.equal(respuesta.body.error.detalles[0].campo, 'precioMin');
  });

  it('lista autores sin confundir la ruta con un id', async () => {
    const repositorio = repositorioEnMemoria([
      libroDePrueba({ id: 1, autor: 'Julio Cortázar' }),
      libroDePrueba({ id: 2, autor: 'Gabriel García Márquez' }),
    ]);
    const respuesta = await request(crearAppDePrueba({ repositorio })).get('/api/v1/libros/autores').expect(200);
    assert.deepEqual(respuesta.body.data, ['Gabriel García Márquez', 'Julio Cortázar']);
  });

  it('obtiene un libro o responde 404', async () => {
    const app = crearAppDePrueba({ repositorio: repositorioEnMemoria([libroDePrueba({ id: 7 })]) });
    const encontrado = await request(app).get('/api/v1/libros/7').expect(200);
    assert.equal(encontrado.body.data.id, 7);
    const faltante = await request(app).get('/api/v1/libros/8').expect(404);
    assert.equal(faltante.body.error.codigo, 'NO_ENCONTRADO');
  });

  it('responde 400 con un id no numérico', async () => {
    await request(crearAppDePrueba()).get('/api/v1/libros/abc').expect(400);
  });
});

describe('administración', () => {
  it('crea un libro y responde 201 con Location', async () => {
    const respuesta = await request(crearAppDePrueba()).post('/api/v1/libros').send(nuevo).expect(201);
    assert.equal(respuesta.body.data.titulo, 'Rayuela');
    assert.equal(respuesta.headers.location, `/api/v1/libros/${respuesta.body.data.id}`);
  });

  it('responde 409 con ISBN duplicado', async () => {
    const app = crearAppDePrueba({ repositorio: repositorioEnMemoria([libroDePrueba({ isbn: '9788437604572' })]) });
    const respuesta = await request(app)
      .post('/api/v1/libros')
      .send({ ...nuevo, isbn: '9788437604572' })
      .expect(409);
    assert.equal(respuesta.body.error.codigo, 'CONFLICTO');
  });

  it('actualiza y elimina', async () => {
    const app = crearAppDePrueba({ repositorio: repositorioEnMemoria([libroDePrueba({ id: 3 })]) });
    const actualizado = await request(app)
      .put('/api/v1/libros/3')
      .send({ ...nuevo, precio: 199.99 })
      .expect(200);
    assert.equal(actualizado.body.data.precio, 199.99);
    await request(app).delete('/api/v1/libros/3').expect(204);
    await request(app).delete('/api/v1/libros/3').expect(404);
  });

  it('responde 400 VALIDACION con JSON mal formado', async () => {
    const respuesta = await request(crearAppDePrueba())
      .post('/api/v1/libros')
      .set('content-type', 'application/json')
      .send('{"titulo":')
      .expect(400);
    assert.equal(respuesta.body.error.codigo, 'VALIDACION');
  });

  it('responde 413 con un cuerpo mayor a 100 KB', async () => {
    const respuesta = await request(crearAppDePrueba())
      .post('/api/v1/libros')
      .send({ ...nuevo, titulo: 'x'.repeat(110_000) })
      .expect(413);
    assert.equal(respuesta.body.error.codigo, 'CUERPO_DEMASIADO_GRANDE');
  });
});

describe('API interna de existencias', () => {
  it('descuenta y repone', async () => {
    const app = crearAppDePrueba({ repositorio: repositorioEnMemoria([libroDePrueba({ id: 4, existencias: 5 })]) });
    const descontado = await request(app).post('/internal/v1/libros/4/descontar').send({ cantidad: 2 }).expect(200);
    assert.equal(descontado.body.data.existencias, 3);
    const repuesto = await request(app).post('/internal/v1/libros/4/reponer').send({ cantidad: 2 }).expect(200);
    assert.equal(repuesto.body.data.existencias, 5);
  });

  it('responde 409 EXISTENCIAS_INSUFICIENTES con detalles', async () => {
    const app = crearAppDePrueba({ repositorio: repositorioEnMemoria([libroDePrueba({ id: 4, existencias: 2 })]) });
    const respuesta = await request(app).post('/internal/v1/libros/4/descontar').send({ cantidad: 5 }).expect(409);
    assert.equal(respuesta.body.error.codigo, 'EXISTENCIAS_INSUFICIENTES');
    assert.deepEqual(respuesta.body.error.detalles, { disponibles: 2, solicitadas: 5 });
  });

  it('responde 400 con una cantidad inválida', async () => {
    await request(crearAppDePrueba()).post('/internal/v1/libros/4/descontar').send({ cantidad: 0 }).expect(400);
  });
});

describe('trazabilidad y rutas', () => {
  it('reutiliza el X-Request-Id recibido y lo incluye en los errores', async () => {
    const respuesta = await request(crearAppDePrueba())
      .get('/api/v1/libros/99')
      .set('X-Request-Id', 'prueba-12345678')
      .expect(404);
    assert.equal(respuesta.headers['x-request-id'], 'prueba-12345678');
    assert.equal(respuesta.body.error.requestId, 'prueba-12345678');
  });

  it('genera un X-Request-Id cuando el recibido no es válido', async () => {
    const respuesta = await request(crearAppDePrueba()).get('/health').set('X-Request-Id', 'mal id');
    assert.notEqual(respuesta.headers['x-request-id'], 'mal id');
  });

  it('responde 404 en rutas inexistentes', async () => {
    const respuesta = await request(crearAppDePrueba()).get('/no-existe').expect(404);
    assert.equal(respuesta.body.error.codigo, 'NO_ENCONTRADO');
  });

  it('responde 500 sin exponer detalles cuando falla el repositorio', async () => {
    const repositorio = repositorioEnMemoria();
    repositorio.listarAutores = async () => {
      throw new Error('detalle interno');
    };
    const respuesta = await request(crearAppDePrueba({ repositorio })).get('/api/v1/libros/autores').expect(500);
    assert.equal(respuesta.body.error.codigo, 'ERROR_INTERNO');
    assert.doesNotMatch(JSON.stringify(respuesta.body), /detalle interno/);
  });
});
