// Lista blanca para ORDER BY: el texto del usuario nunca se interpola en el SQL.
// El id al final hace el orden estable entre páginas.
const ORDENES = Object.freeze({
  titulo: 'titulo ASC, id ASC',
  '-titulo': 'titulo DESC, id ASC',
  autor: 'autor ASC, titulo ASC, id ASC',
  '-autor': 'autor DESC, titulo ASC, id ASC',
  precio: 'precio ASC, id ASC',
  '-precio': 'precio DESC, id ASC',
});

const COLUMNAS = 'id, isbn, titulo, autor, precio, existencias, creado_en, actualizado_en';

/** snake_case de la base → camelCase de la API. `pg` entrega NUMERIC como texto. */
export function aLibro(fila) {
  return {
    id: fila.id,
    isbn: fila.isbn,
    titulo: fila.titulo,
    autor: fila.autor,
    precio: Number(fila.precio),
    existencias: fila.existencias,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

/** Escapa los comodines de LIKE para que "%" o "_" del usuario se busquen literalmente. */
function patronParcial(texto) {
  return `%${texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`)}%`;
}

function construirFiltros({ q, autor, precioMin, precioMax, disponibles }) {
  const condiciones = [];
  const valores = [];
  const parametro = (valor) => {
    valores.push(valor);
    return `$${valores.length}`;
  };

  if (q) {
    const p = parametro(patronParcial(q));
    condiciones.push(
      `(f_unaccent(lower(titulo)) LIKE f_unaccent(lower(${p})) OR f_unaccent(lower(autor)) LIKE f_unaccent(lower(${p})))`,
    );
  }
  if (autor) condiciones.push(`f_unaccent(lower(autor)) LIKE f_unaccent(lower(${parametro(patronParcial(autor))}))`);
  if (precioMin !== undefined) condiciones.push(`precio >= ${parametro(precioMin)}`);
  if (precioMax !== undefined) condiciones.push(`precio <= ${parametro(precioMax)}`);
  if (disponibles) condiciones.push('existencias > 0');

  return { where: condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '', valores };
}

export function crearRepositorioLibros(pool) {
  return {
    async listar({ orden, pagina, limite, ...filtros }) {
      const { where, valores } = construirFiltros(filtros);
      const desplazamiento = (pagina - 1) * limite;
      const n = valores.length;

      const [resultado, conteo] = await Promise.all([
        pool.query(
          `SELECT ${COLUMNAS} FROM libro ${where} ORDER BY ${ORDENES[orden]} LIMIT $${n + 1} OFFSET $${n + 2}`,
          [...valores, limite, desplazamiento],
        ),
        pool.query(`SELECT COUNT(*)::int AS total FROM libro ${where}`, valores),
      ]);

      return { libros: resultado.rows.map(aLibro), total: conteo.rows[0].total };
    },

    async listarAutores() {
      const { rows } = await pool.query('SELECT DISTINCT autor FROM libro ORDER BY autor');
      return rows.map((fila) => fila.autor);
    },

    async obtenerPorId(id) {
      const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM libro WHERE id = $1`, [id]);
      return rows[0] ? aLibro(rows[0]) : null;
    },

    async crear({ isbn, titulo, autor, precio, existencias }) {
      const { rows } = await pool.query(
        `INSERT INTO libro (isbn, titulo, autor, precio, existencias)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${COLUMNAS}`,
        [isbn, titulo, autor, precio, existencias],
      );
      return aLibro(rows[0]);
    },

    async actualizar(id, { isbn, titulo, autor, precio, existencias }) {
      const { rows } = await pool.query(
        `UPDATE libro
            SET isbn = $2, titulo = $3, autor = $4, precio = $5, existencias = $6, actualizado_en = now()
          WHERE id = $1
         RETURNING ${COLUMNAS}`,
        [id, isbn, titulo, autor, precio, existencias],
      );
      return rows[0] ? aLibro(rows[0]) : null;
    },

    async eliminar(id) {
      const { rowCount } = await pool.query('DELETE FROM libro WHERE id = $1', [id]);
      return rowCount > 0;
    },

    /**
     * Una sola sentencia: la condición y la resta ocurren juntas bajo el bloqueo de la fila,
     * así dos ventas simultáneas nunca dejan existencias negativas (RNF-05).
     * Devuelve null si el libro no existe o no alcanzan las existencias.
     */
    async descontar(id, cantidad) {
      const { rows } = await pool.query(
        `UPDATE libro
            SET existencias = existencias - $2, actualizado_en = now()
          WHERE id = $1 AND existencias >= $2
         RETURNING ${COLUMNAS}`,
        [id, cantidad],
      );
      return rows[0] ? aLibro(rows[0]) : null;
    },

    async reponer(id, cantidad) {
      const { rows } = await pool.query(
        `UPDATE libro
            SET existencias = existencias + $2, actualizado_en = now()
          WHERE id = $1
         RETURNING ${COLUMNAS}`,
        [id, cantidad],
      );
      return rows[0] ? aLibro(rows[0]) : null;
    },
  };
}
