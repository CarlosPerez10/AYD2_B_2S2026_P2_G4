import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { crearServicioLibros } from '../src/services/libros.service.js';
import { libroDePrueba, repositorioEnMemoria } from './helpers/entorno.js';

function servicioCon(libros) {
  const repositorio = repositorioEnMemoria(libros);
  return { repositorio, servicio: crearServicioLibros(repositorio) };
}

async function codigoDeError(promesa) {
  try {
    await promesa;
  } catch (error) {
    return `${error.estado} ${error.codigo}`;
  }
  assert.fail('se esperaba un error');
}

describe('servicio de libros', () => {
  it('calcula la metadata de paginación', async () => {
    const libros = Array.from({ length: 5 }, (_, i) => libroDePrueba({ id: i + 1 }));
    const { servicio } = servicioCon(libros);
    const resultado = await servicio.listar({ pagina: 2, limite: 2, orden: 'titulo' });
    assert.equal(resultado.data.length, 2);
    assert.deepEqual(resultado.meta, { pagina: 2, limite: 2, total: 5, totalPaginas: 3 });
  });

  it('responde 404 al obtener, actualizar o eliminar un libro inexistente', async () => {
    const { servicio } = servicioCon([]);
    const datos = { titulo: 'X', autor: 'Y', precio: 1, existencias: 1, isbn: null };
    assert.equal(await codigoDeError(servicio.obtener(9)), '404 NO_ENCONTRADO');
    assert.equal(await codigoDeError(servicio.actualizar(9, datos)), '404 NO_ENCONTRADO');
    assert.equal(await codigoDeError(servicio.eliminar(9)), '404 NO_ENCONTRADO');
  });

  it('traduce el ISBN duplicado a 409 CONFLICTO', async () => {
    const { servicio } = servicioCon([libroDePrueba({ isbn: '9788437604572' })]);
    const datos = { titulo: 'Otro', autor: 'Y', precio: 1, existencias: 1, isbn: '9788437604572' };
    assert.equal(await codigoDeError(servicio.crear(datos)), '409 CONFLICTO');
  });

  it('descuenta existencias cuando alcanzan', async () => {
    const { servicio } = servicioCon([libroDePrueba({ existencias: 5 })]);
    const libro = await servicio.descontar(1, 3);
    assert.equal(libro.existencias, 2);
  });

  it('distingue libro inexistente de existencias insuficientes', async () => {
    const { servicio } = servicioCon([libroDePrueba({ titulo: 'Rayuela', existencias: 2 })]);
    assert.equal(await codigoDeError(servicio.descontar(99, 1)), '404 NO_ENCONTRADO');

    try {
      await servicio.descontar(1, 5);
      assert.fail('se esperaba un error');
    } catch (error) {
      assert.equal(error.estado, 409);
      assert.equal(error.codigo, 'EXISTENCIAS_INSUFICIENTES');
      assert.deepEqual(error.detalles, { disponibles: 2, solicitadas: 5 });
      assert.match(error.message, /Rayuela/);
    }
  });

  it('repone existencias y responde 404 si el libro no existe', async () => {
    const { servicio } = servicioCon([libroDePrueba({ existencias: 1 })]);
    assert.equal((await servicio.reponer(1, 4)).existencias, 5);
    assert.equal(await codigoDeError(servicio.reponer(2, 1)), '404 NO_ENCONTRADO');
  });

  it('propaga errores de base de datos que no son de unicidad', async () => {
    const repositorio = repositorioEnMemoria();
    repositorio.crear = async () => {
      throw new Error('conexión perdida');
    };
    const servicio = crearServicioLibros(repositorio);
    await assert.rejects(servicio.crear({ isbn: null }), /conexión perdida/);
  });
});
