function entero(valor, nombre, porDefecto, { min = 0 } = {}) {
  if (valor === undefined || valor === '') return porDefecto;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < min) {
    throw new Error(`La variable ${nombre} debe ser un entero mayor o igual a ${min} (recibido: "${valor}").`);
  }
  return numero;
}

function booleano(valor, nombre, porDefecto) {
  if (valor === undefined || valor === '') return porDefecto;
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  throw new Error(`La variable ${nombre} debe ser "true" o "false" (recibido: "${valor}").`);
}

/**
 * Lee y valida la configuración del servicio. Falla al arrancar si algo es inválido,
 * para no descubrir el error con la primera petición.
 */
export function cargarConfiguracion(env = process.env) {
  const entorno = env.NODE_ENV || 'development';
  const contrasena = env.DB_PASSWORD || '';

  if (entorno === 'production' && contrasena === '') {
    throw new Error('DB_PASSWORD es obligatoria en producción.');
  }

  return Object.freeze({
    entorno,
    puerto: entero(env.PORT, 'PORT', 3001, { min: 1 }),
    version: env.APP_VERSION || '0.1.0',
    nivelLog: env.LOG_LEVEL || (entorno === 'production' ? 'info' : 'debug'),
    baseDatos: Object.freeze({
      host: env.DB_HOST || 'localhost',
      puerto: entero(env.DB_PORT, 'DB_PORT', 5432, { min: 1 }),
      nombre: env.DB_NAME || 'libros_db',
      usuario: env.DB_USER || 'libros',
      contrasena,
      ssl: booleano(env.DB_SSL, 'DB_SSL', false),
      // Bundle de certificados de RDS, descargado dentro de la imagen (ver Dockerfile).
      rutaCa: env.DB_SSL_CA || '/app/certs/global-bundle.pem',
      maximoConexiones: entero(env.DB_POOL_MAX, 'DB_POOL_MAX', 10, { min: 1 }),
    }),
  });
}
