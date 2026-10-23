import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aLibro, crearRepositorioLibros } from '../src/repositories/libros.repository.js';

const fila = {
  id: 1,
  isbn: null,
  titulo: 'Rayuela',
  autor: 'Julio Cortázar',
  precio: '175.00',
  existencias: 2,
  creado_en: new Date(),
  actualizado_en: new Date(),
};

/** Pool falso: guarda cada consulta y responde según `responder`. */
function poolFalso(responder = () => ({ rows: [], rowCount: 0 })) {
  const consultas = [];
  return {
    consultas,
    async query(sql, valores = []) {
      consultas.push({ sql, valores });
      return responder(sql, valores);
    },
  };
}

const filtrosBase = { orden: 'titulo', pagina: 1, limite: 20, disponibles: false };

describe('repositorio de libros', () => {
  it('convierte NUMERIC a número y snake_case a camelCase', () => {
    const libro = aLibro(fila);
    assert.equal(libro.precio, 175);
    assert.ok('creadoEn' in libro && !('creado_en' in libro));
  });

  it('usa parámetros para todos los filtros y la paginación', async () => {
    const pool = poolFalso((sql) => (sql.includes('COUNT') ? { rows: [{ total: 0 }] } : { rows: [] }));
    await crearRepositorioLibros(pool).listar({
      ...filtrosBase,
      q: "garcia'; --",
      autor: 'borges',
      precioMin: 10,
      precioMax: 200,
      disponibles: true,
      pagina: 3,
    });
    const [listado, conteo] = pool.consultas;
    assert.doesNotMatch(listado.sql, /garcia/);
    assert.match(listado.sql, /f_unaccent\(lower\(titulo\)\) LIKE/);
    assert.match(listado.sql, /existencias > 0/);
    assert.deepEqual(listado.valores, ["%garcia'; --%", '%borges%', 10, 200, 20, 40]);
    assert.deepEqual(conteo.valores, ["%garcia'; --%", '%borges%', 10, 200]);
  });

  it('escapa los comodines de LIKE', async () => {
    const pool = poolFalso((sql) => (sql.includes('COUNT') ? { rows: [{ total: 0 }] } : { rows: [] }));
    await crearRepositorioLibros(pool).listar({ ...filtrosBase, q: '100%_a' });
    assert.equal(pool.consultas[0].valores[0], '%100\\%\\_a%');
  });

  it('traduce el orden con la lista blanca', async () => {
    const pool = poolFalso((sql) => (sql.includes('COUNT') ? { rows: [{ total: 0 }] } : { rows: [] }));
    await crearRepositorioLibros(pool).listar({ ...filtrosBase, orden: '-precio' });
    assert.match(pool.consultas[0].sql, /ORDER BY precio DESC, id ASC/);
  });

  it('descuenta con una sola sentencia condicionada', async () => {
    const pool = poolFalso(() => ({ rows: [fila], rowCount: 1 }));
    const libro = await crearRepositorioLibros(pool).descontar(1, 2);
    assert.equal(pool.consultas.length, 1);
    assert.match(pool.consultas[0].sql, /WHERE id = \$1 AND existencias >= \$2/);
    assert.deepEqual(pool.consultas[0].valores, [1, 2]);
    assert.equal(libro.titulo, 'Rayuela');
  });

  it('devuelve null cuando el UPDATE no afecta filas', async () => {
    const repositorio = crearRepositorioLibros(poolFalso());
    assert.equal(await repositorio.descontar(1, 2), null);
    assert.equal(await repositorio.obtenerPorId(1), null);
    assert.equal(await repositorio.eliminar(1), false);
  });
});
