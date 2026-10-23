import { readFileSync } from 'node:fs';
import pg from 'pg';

export function crearPool(baseDatos) {
  return new pg.Pool({
    host: baseDatos.host,
    port: baseDatos.puerto,
    database: baseDatos.nombre,
    user: baseDatos.usuario,
    password: baseDatos.contrasena,
    max: baseDatos.maximoConexiones,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    // En AWS la conexión a RDS va cifrada y se valida el certificado del servidor.
    ssl: baseDatos.ssl ? { rejectUnauthorized: true, ca: readFileSync(baseDatos.rutaCa, 'utf8') } : false,
  });
}

/** Usado por /health: confirma que la base responde. */
export function crearVerificadorBaseDatos(pool) {
  return async () => {
    await pool.query('SELECT 1');
  };
}
