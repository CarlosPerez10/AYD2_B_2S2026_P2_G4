const LONGITUD_MINIMA_LLAVE = 16;

function entero(valor, nombre, porDefecto, { min = 0 } = {}) {
  if (valor === undefined || valor === '') return porDefecto;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < min) {
    throw new Error(`La variable ${nombre} debe ser un entero mayor o igual a ${min} (recibido: "${valor}").`);
  }
  return numero;
}

function url(valor, nombre, porDefecto) {
  const texto = valor || porDefecto;
  let parseada;
  try {
    parseada = new URL(texto);
  } catch {
    throw new Error(`La variable ${nombre} no es una URL válida (recibido: "${texto}").`);
  }
  if (!['http:', 'https:'].includes(parseada.protocol)) {
    throw new Error(`La variable ${nombre} debe usar http o https.`);
  }
  return parseada.origin;
}

function lista(valor) {
  if (!valor) return [];
  return valor
    .split(',')
    .map((elemento) => elemento.trim())
    .filter(Boolean);
}

/**
 * Lee y valida la configuración del gateway. Falla al arrancar si algo es inválido,
 * para no descubrir el error con la primera petición.
 */
export function cargarConfiguracion(env = process.env) {
  const entorno = env.NODE_ENV || 'development';
  const llaveAdmin = env.ADMIN_API_KEY || '';

  if (llaveAdmin.length < LONGITUD_MINIMA_LLAVE) {
    throw new Error(
      `ADMIN_API_KEY es obligatoria y debe tener al menos ${LONGITUD_MINIMA_LLAVE} caracteres.`,
    );
  }

  const origenesCors = lista(env.CORS_ORIGINS);

  return Object.freeze({
    entorno,
    puerto: entero(env.PORT, 'PORT', 8080, { min: 1 }),
    version: env.APP_VERSION || '0.1.0',
    nivelLog: env.LOG_LEVEL || (entorno === 'production' ? 'info' : 'debug'),
    llaveAdmin,
    servicios: Object.freeze({
      libros: url(env.LIBROS_SERVICE_URL, 'LIBROS_SERVICE_URL', 'http://localhost:3001'),
      ventas: url(env.VENTAS_SERVICE_URL, 'VENTAS_SERVICE_URL', 'http://localhost:3002'),
    }),
    tiempoLimiteProxyMs: entero(env.PROXY_TIMEOUT_MS, 'PROXY_TIMEOUT_MS', 10_000, { min: 100 }),
    tiempoLimiteSaludMs: entero(env.HEALTH_TIMEOUT_MS, 'HEALTH_TIMEOUT_MS', 2_000, { min: 100 }),
    limitePeticiones: Object.freeze({
      ventanaMs: entero(env.RATE_LIMIT_WINDOW_MS, 'RATE_LIMIT_WINDOW_MS', 60_000, { min: 1_000 }),
      maximo: entero(env.RATE_LIMIT_MAX, 'RATE_LIMIT_MAX', 300, { min: 1 }),
    }),
    // Saltos de proxy confiables para calcular la IP real (el ALB agrega uno).
    saltosProxy: entero(env.TRUST_PROXY_HOPS, 'TRUST_PROXY_HOPS', 1),
    // Sin orígenes configurados se aceptan todos (útil en local); en AWS el frontend
    // comparte origen con el gateway a través del ALB.
    origenesCors: origenesCors.length > 0 ? Object.freeze(origenesCors) : '*',
  });
}
