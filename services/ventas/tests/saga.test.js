import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcularTotal, crearServicioVentas } from '../src/services/ventas.service.js';
import { clienteLibrosSimulado, fallas, LIBRO, loggerEnMemoria, repositorioEnMemoria } from './helpers/entorno.js';

function preparar(escenario = {}) {
  const repositorio = repositorioEnMemoria();
  const clienteLibros = clienteLibrosSimulado({ escenario });
  const logger = loggerEnMemoria();
  return { repositorio, clienteLibros, logger, servicio: crearServicioVentas({ repositorio, clienteLibros, logger }) };
}

async function errorDe(promesa) {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  assert.fail('se esperaba un error');
}

const operaciones = (cliente) => cliente.llamadas.map(([nombre]) => nombre);

describe('saga de registro de venta', () => {
  it('éxito: consulta, descuenta y guarda una copia del libro', async () => {
    const { servicio, repositorio, clienteLibros } = preparar();
    const venta = await servicio.registrar({ libroId: 7, cantidad: 2 }, 'req-12345678');

    assert.deepEqual(operaciones(clienteLibros), ['obtenerLibro', 'descontar']);
    assert.deepEqual(clienteLibros.llamadas[1], ['descontar', 7, 2, 'req-12345678']);
    assert.equal(venta.titulo, LIBRO.titulo);
    assert.equal(venta.autor, LIBRO.autor);
    assert.equal(venta.precioUnitario, 175.5);
    assert.equal(venta.total, 351);
    assert.equal(repositorio.ventas.length, 1);
  });

  it('libro inexistente: 404 sin descontar ni guardar', async () => {
    const { servicio, repositorio, clienteLibros } = preparar({ obtenerLibro: fallas.noEncontrado });
    const error = await errorDe(servicio.registrar({ libroId: 7, cantidad: 1 }));
    assert.equal(error.estado, 404);
    assert.deepEqual(operaciones(clienteLibros), ['obtenerLibro']);
    assert.equal(repositorio.ventas.length, 0);
  });

  it('sin existencias: 409 con detalles y sin guardar', async () => {
    const { servicio, repositorio } = preparar({ descontar: fallas.sinExistencias });
    const error = await errorDe(servicio.registrar({ libroId: 7, cantidad: 5 }));
    assert.equal(error.estado, 409);
    assert.equal(error.codigo, 'EXISTENCIAS_INSUFICIENTES');
    assert.deepEqual(error.detalles, { disponibles: 2, solicitadas: 5 });
    assert.equal(repositorio.ventas.length, 0);
  });

  it('Libros caído: 503 sin guardar', async () => {
    const { servicio, repositorio } = preparar({ obtenerLibro: fallas.caido });
    const error = await errorDe(servicio.registrar({ libroId: 7, cantidad: 1 }));
    assert.equal(error.estado, 503);
    assert.equal(error.codigo, 'SERVICIO_NO_DISPONIBLE');
    assert.equal(repositorio.ventas.length, 0);
  });

  it('falla al guardar: repone las existencias y responde 500', async () => {
    const { servicio, repositorio, clienteLibros } = preparar();
    repositorio.falloAlInsertar = new Error('conexión perdida');
    const error = await errorDe(servicio.registrar({ libroId: 7, cantidad: 3 }, 'req-12345678'));
    assert.equal(error.estado, 500);
    assert.deepEqual(operaciones(clienteLibros), ['obtenerLibro', 'descontar', 'reponer']);
    assert.deepEqual(clienteLibros.llamadas[2], ['reponer', 7, 3, 'req-12345678']);
  });

  it('falla la compensación: registra un error crítico con los datos de la venta', async () => {
    const { servicio, repositorio, logger } = preparar({ reponer: fallas.caido });
    repositorio.falloAlInsertar = new Error('conexión perdida');
    const error = await errorDe(servicio.registrar({ libroId: 7, cantidad: 3 }));
    assert.equal(error.estado, 500);
    const critico = logger.eventos.find((evento) => evento.datos?.critico);
    assert.ok(critico, 'debe existir un evento crítico');
    assert.equal(critico.nivel, 'error');
    assert.equal(critico.datos.venta.libroId, 7);
    assert.equal(critico.datos.venta.cantidad, 3);
  });
});

describe('calcularTotal', () => {
  it('evita errores de punto flotante', () => {
    assert.equal(0.1 * 3, 0.30000000000000004);
    assert.equal(calcularTotal(0.1, 3), 0.3);
    assert.equal(calcularTotal(189.5, 3), 568.5);
    assert.equal(calcularTotal(19.99, 7), 139.93);
  });
});

describe('ranking', () => {
  it('no consulta a Libros e informa las fechas en meta', async () => {
    const { servicio, clienteLibros } = preparar({ obtenerLibro: fallas.caido });
    const desde = new Date('2026-10-01T00:00:00Z');
    const resultado = await servicio.ranking({ limite: 5, desde });
    assert.equal(clienteLibros.llamadas.length, 0);
    assert.equal(resultado.meta.limite, 5);
    assert.equal(resultado.meta.desde, '2026-10-01T00:00:00.000Z');
    assert.equal(resultado.meta.hasta, null);
    assert.ok(!Number.isNaN(Date.parse(resultado.meta.generadoEn)));
  });
});
