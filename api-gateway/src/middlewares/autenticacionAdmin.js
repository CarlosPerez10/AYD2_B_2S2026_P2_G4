import { createHash, timingSafeEqual } from 'node:crypto';
import { errores } from '../utils/errores.js';

const HISTORIAL_VENTAS = /^\/api\/v1\/ventas(\/|$)/;
const RANKING = /^\/api\/v1\/ventas\/ranking\/?$/;

/**
 * Política de acceso del borde (ADR-005):
 * - Lecturas del catálogo y del ranking: públicas.
 * - Historial de ventas y cualquier escritura: requieren llave de administración.
 * - OPTIONS siempre pasa, para no romper las peticiones previas de CORS.
 */
export function requiereAdmin(metodo, ruta) {
  if (metodo === 'OPTIONS') return false;
  if (metodo === 'GET' || metodo === 'HEAD') {
    return HISTORIAL_VENTAS.test(ruta) && !RANKING.test(ruta);
  }
  return true;
}

// Se comparan resúmenes SHA-256 para que ambos lados tengan la misma longitud y la
// comparación no revele, por tiempo, cuántos caracteres coinciden.
function resumen(texto) {
  return createHash('sha256').update(texto).digest();
}

export function autenticacionAdmin(llaveAdmin) {
  const esperada = resumen(llaveAdmin);

  return (req, res, next) => {
    // Montado con app.use('/api', ...), Express quita el prefijo de req.path;
    // la política se evalúa sobre la ruta completa.
    const ruta = req.baseUrl + req.path;
    if (!requiereAdmin(req.method, ruta)) return next();

    const recibida = req.get('x-api-key');
    if (!recibida || !timingSafeEqual(resumen(recibida), esperada)) {
      return next(errores.noAutorizado());
    }
    next();
  };
}
