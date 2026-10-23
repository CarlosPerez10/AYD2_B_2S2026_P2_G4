import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { crearClienteLibros } from '../src/clients/librosClient.js';

function respuestaJson(estado, cuerpo) {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'content-type': 'application/json' } });
}

function clienteCon(responder) {
  const peticiones = [];
  const fetchImpl = async (url, opciones) => {
    peticiones.push({ url, ...opciones });
    return responder(url, opciones);
  };
  return { peticiones, cliente: crearClienteLibros({ url: 'http://libros:3001', fetchImpl }) };
}

async function errorDe(promesa) {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  assert.fail('se esperaba un error');
}

describe('cliente de Libros', () => {
  it('obtiene un libro y reenvía el X-Request-Id', async () => {
    const { cliente, peticiones } = clienteCon(() => respuestaJson(200, { data: { id: 7, titulo: 'Rayuela' } }));
    const libro = await cliente.obtenerLibro(7, 'req-12345678');
    assert.equal(libro.titulo, 'Rayuela');
    assert.equal(peticiones[0].url, 'http://libros:3001/api/v1/libros/7');
    assert.equal(peticiones[0].headers['x-request-id'], 'req-12345678');
    assert.ok(peticiones[0].signal instanceof AbortSignal);
  });

  it('descuenta con POST a la API interna', async () => {
    const { cliente, peticiones } = clienteCon(() => respuestaJson(200, { data: { id: 7, existencias: 3 } }));
    await cliente.descontar(7, 2);
    assert.equal(peticiones[0].method, 'POST');
    assert.equal(peticiones[0].url, 'http://libros:3001/internal/v1/libros/7/descontar');
    assert.deepEqual(JSON.parse(peticiones[0].body), { cantidad: 2 });
  });

  it('traduce 404 a NO_ENCONTRADO', async () => {
    const { cliente } = clienteCon(() =>
      respuestaJson(404, { error: { codigo: 'NO_ENCONTRADO', mensaje: 'No existe el libro con id 7.' } }),
    );
    const error = await errorDe(cliente.obtenerLibro(7));
    assert.equal(error.estado, 404);
    assert.equal(error.message, 'No existe el libro con id 7.');
  });

  it('traduce 409 conservando los detalles', async () => {
    const { cliente } = clienteCon(() =>
      respuestaJson(409, {
        error: { codigo: 'EXISTENCIAS_INSUFICIENTES', mensaje: 'Solo hay 2', detalles: { disponibles: 2, solicitadas: 5 } },
      }),
    );
    const error = await errorDe(cliente.descontar(7, 5));
    assert.equal(error.estado, 409);
    assert.equal(error.codigo, 'EXISTENCIAS_INSUFICIENTES');
    assert.deepEqual(error.detalles, { disponibles: 2, solicitadas: 5 });
  });

  it('traduce la falta de conexión a 503', async () => {
    const { cliente } = clienteCon(() => {
      throw new TypeError('fetch failed');
    });
    const error = await errorDe(cliente.obtenerLibro(7));
    assert.equal(error.estado, 503);
    assert.equal(error.codigo, 'SERVICIO_NO_DISPONIBLE');
  });

  it('traduce el tiempo agotado a 503', async () => {
    const fetchImpl = (url, { signal }) =>
      new Promise((resolver, rechazar) => signal.addEventListener('abort', () => rechazar(signal.reason)));
    const cliente = crearClienteLibros({ url: 'http://libros:3001', tiempoLimiteMs: 20, fetchImpl });
    // El temporizador de AbortSignal.timeout() no mantiene vivo el proceso; este sí.
    const mantenerVivo = setTimeout(() => {}, 1_000);
    const error = await errorDe(cliente.obtenerLibro(7));
    clearTimeout(mantenerVivo);
    assert.equal(error.estado, 503);
  });

  it('traduce un 500 de Libros a 503', async () => {
    const { cliente } = clienteCon(() => respuestaJson(500, { error: { codigo: 'ERROR_INTERNO' } }));
    assert.equal((await errorDe(cliente.reponer(7, 1))).estado, 503);
  });
});
