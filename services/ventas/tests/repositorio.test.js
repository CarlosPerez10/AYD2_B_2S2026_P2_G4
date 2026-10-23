import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { crearRepositorioVentas } from '../src/repositories/ventas.repository.js';

function poolFalso(filas = []) {
  const consultas = [];
  return {
    consultas,
    async query(sql, valores = []) {
      consultas.push({ sql, valores });
      if (sql.includes('COUNT')) return { rows: [{ total: filas.length }] };
      return { rows: filas, rowCount: filas.length };
    },
  };
}

describe('repositorio de ventas', () => {
  it('ordena el ranking por unidades, monto y título', async () => {
    const pool = poolFalso();
    await crearRepositorioVentas(pool).ranking({ limite: 10 });
    assert.match(pool.consultas[0].sql, /ORDER BY unidades_vendidas DESC, monto_total DESC, titulo ASC/);
    assert.match(pool.consultas[0].sql, /GROUP BY libro_id\s/);
    assert.deepEqual(pool.consultas[0].valores, [null, null, 10]);
  });

  it('usa el título y autor de la venta más reciente de cada libro', async () => {
    const pool = poolFalso();
    await crearRepositorioVentas(pool).ranking({ limite: 10 });
    assert.match(pool.consultas[0].sql, /ARRAY_AGG\(titulo ORDER BY fecha DESC, id DESC\)\)\[1\] AS titulo/);
    assert.match(pool.consultas[0].sql, /ARRAY_AGG\(autor\s+ORDER BY fecha DESC, id DESC\)\)\[1\] AS autor/);
  });

  it('pasa el rango de fechas como parámetros', async () => {
    const pool = poolFalso();
    const desde = new Date('2026-10-01');
    const hasta = new Date('2026-10-15');
    await crearRepositorioVentas(pool).ranking({ limite: 3, desde, hasta });
    assert.deepEqual(pool.consultas[0].valores, [desde, hasta, 3]);
  });

  it('asigna posiciones y convierte SUM() a números', async () => {
    const pool = poolFalso([
      { libro_id: 1, titulo: 'A', autor: 'X', unidades_vendidas: '6', monto_total: '1137.00' },
      { libro_id: 4, titulo: 'B', autor: 'Y', unidades_vendidas: '4', monto_total: '700.00' },
    ]);
    const ranking = await crearRepositorioVentas(pool).ranking({ limite: 10 });
    assert.deepEqual(ranking[0], { posicion: 1, libroId: 1, titulo: 'A', autor: 'X', unidadesVendidas: 6, montoTotal: 1137 });
    assert.equal(ranking[1].posicion, 2);
  });

  it('filtra y pagina el historial con parámetros, más recientes primero', async () => {
    const pool = poolFalso();
    const desde = new Date('2026-10-01');
    await crearRepositorioVentas(pool).listar({ desde, libroId: 7, pagina: 2, limite: 10 });
    const [listado, conteo] = pool.consultas;
    assert.match(listado.sql, /WHERE fecha >= \$1 AND libro_id = \$2/);
    assert.match(listado.sql, /ORDER BY fecha DESC, id DESC/);
    assert.deepEqual(listado.valores, [desde, 7, 10, 10]);
    assert.deepEqual(conteo.valores, [desde, 7]);
  });

  it('convierte NUMERIC a número al insertar', async () => {
    const pool = poolFalso([
      { id: 1, libro_id: 7, titulo: 'R', autor: 'J', cantidad: 2, precio_unitario: '175.50', total: '351.00', fecha: new Date() },
    ]);
    const venta = await crearRepositorioVentas(pool).insertar({
      libroId: 7,
      titulo: 'R',
      autor: 'J',
      cantidad: 2,
      precioUnitario: 175.5,
      total: 351,
    });
    assert.equal(venta.precioUnitario, 175.5);
    assert.equal(venta.total, 351);
    assert.equal(venta.libroId, 7);
  });
});
