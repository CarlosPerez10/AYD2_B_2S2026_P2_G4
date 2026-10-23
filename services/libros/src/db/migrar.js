import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIRECTORIO = path.dirname(fileURLToPath(import.meta.url));
// Número arbitrario y fijo: evita que dos réplicas apliquen migraciones a la vez.
const LLAVE_BLOQUEO = 7_202_307_727;

/**
 * Aplica, en orden, las migraciones que aún no se han ejecutado y después la semilla.
 * Cada archivo corre en su propia transacción; los scripts además son idempotentes.
 */
export async function migrar(pool, logger) {
  const cliente = await pool.connect();
  try {
    await cliente.query('SELECT pg_advisory_lock($1)', [LLAVE_BLOQUEO]);
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS migracion (
        nombre     VARCHAR(200) PRIMARY KEY,
        aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);

    const { rows } = await cliente.query('SELECT nombre FROM migracion');
    const aplicadas = new Set(rows.map((fila) => fila.nombre));
    const archivos = (await readdir(path.join(DIRECTORIO, 'migraciones')))
      .filter((nombre) => nombre.endsWith('.sql'))
      .sort();

    for (const nombre of archivos) {
      if (aplicadas.has(nombre)) continue;
      const sql = await readFile(path.join(DIRECTORIO, 'migraciones', nombre), 'utf8');
      await cliente.query('BEGIN');
      try {
        await cliente.query(sql);
        await cliente.query('INSERT INTO migracion (nombre) VALUES ($1)', [nombre]);
        await cliente.query('COMMIT');
        logger.info('migracion aplicada', { nombre });
      } catch (error) {
        await cliente.query('ROLLBACK');
        throw new Error(`Falló la migración ${nombre}: ${error.message}`, { cause: error });
      }
    }

    // La semilla solo inserta si la tabla está vacía.
    const semilla = await readFile(path.join(DIRECTORIO, 'semilla.sql'), 'utf8');
    const resultado = await cliente.query(semilla);
    if (resultado.rowCount > 0) logger.info('datos semilla insertados', { libros: resultado.rowCount });
  } finally {
    await cliente.query('SELECT pg_advisory_unlock($1)', [LLAVE_BLOQUEO]).catch(() => {});
    cliente.release();
  }
}
