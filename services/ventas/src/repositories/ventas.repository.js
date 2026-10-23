const COLUMNAS = 'id, libro_id, titulo, autor, cantidad, precio_unitario, total, fecha';

/** snake_case de la base → camelCase de la API. `pg` entrega NUMERIC y SUM() como texto. */
export function aVenta(fila) {
  return {
    id: fila.id,
    libroId: fila.libro_id,
    titulo: fila.titulo,
    autor: fila.autor,
    cantidad: fila.cantidad,
    precioUnitario: Number(fila.precio_unitario),
    total: Number(fila.total),
    fecha: fila.fecha,
  };
}

function construirFiltros({ desde, hasta, libroId }) {
  const condiciones = [];
  const valores = [];
  const parametro = (valor) => {
    valores.push(valor);
    return `$${valores.length}`;
  };

  if (desde) condiciones.push(`fecha >= ${parametro(desde)}`);
  if (hasta) condiciones.push(`fecha < ${parametro(hasta)}`);
  if (libroId) condiciones.push(`libro_id = ${parametro(libroId)}`);

  return { where: condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '', valores };
}

export function crearRepositorioVentas(pool) {
  return {
    async insertar({ libroId, titulo, autor, cantidad, precioUnitario, total }) {
      const { rows } = await pool.query(
        `INSERT INTO venta (libro_id, titulo, autor, cantidad, precio_unitario, total)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${COLUMNAS}`,
        [libroId, titulo, autor, cantidad, precioUnitario, total],
      );
      return aVenta(rows[0]);
    },

    async listar({ pagina, limite, ...filtros }) {
      const { where, valores } = construirFiltros(filtros);
      const n = valores.length;
      const [resultado, conteo] = await Promise.all([
        pool.query(
          `SELECT ${COLUMNAS} FROM venta ${where} ORDER BY fecha DESC, id DESC LIMIT $${n + 1} OFFSET $${n + 2}`,
          [...valores, limite, (pagina - 1) * limite],
        ),
        pool.query(`SELECT COUNT(*)::int AS total FROM venta ${where}`, valores),
      ]);
      return { ventas: resultado.rows.map(aVenta), total: conteo.rows[0].total };
    },

    async obtenerPorId(id) {
      const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM venta WHERE id = $1`, [id]);
      return rows[0] ? aVenta(rows[0]) : null;
    },

    /**
     * Consulta de 02-arquitectura §5.3. Agrupa solo por libro_id: si un libro se renombró,
     * sus ventas siguen sumando en una sola posición con el título y autor más recientes.
     * Desempate estable: unidades, monto y título.
     */
    async ranking({ desde, hasta, limite }) {
      const { rows } = await pool.query(
        `SELECT libro_id,
                (ARRAY_AGG(titulo ORDER BY fecha DESC, id DESC))[1] AS titulo,
                (ARRAY_AGG(autor  ORDER BY fecha DESC, id DESC))[1] AS autor,
                SUM(cantidad) AS unidades_vendidas,
                SUM(total)    AS monto_total
           FROM venta
          WHERE fecha >= COALESCE($1::timestamptz, '-infinity'::timestamptz)
            AND fecha <  COALESCE($2::timestamptz, 'infinity'::timestamptz)
          GROUP BY libro_id
          ORDER BY unidades_vendidas DESC, monto_total DESC, titulo ASC
          LIMIT $3`,
        [desde ?? null, hasta ?? null, limite],
      );
      return rows.map((fila, indice) => ({
        posicion: indice + 1,
        libroId: fila.libro_id,
        titulo: fila.titulo,
        autor: fila.autor,
        unidadesVendidas: Number(fila.unidades_vendidas),
        montoTotal: Number(fila.monto_total),
      }));
    },
  };
}
