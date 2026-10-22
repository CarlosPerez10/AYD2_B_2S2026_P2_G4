import { rateLimit } from 'express-rate-limit';
import { errores } from '../utils/errores.js';

/**
 * Límite por IP para proteger a los microservicios de ráfagas. La IP sale de
 * req.ip, que respeta X-Forwarded-For según la configuración de "trust proxy".
 */
export function limitePeticiones({ ventanaMs, maximo }) {
  return rateLimit({
    windowMs: ventanaMs,
    limit: maximo,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) => next(errores.demasiadasPeticiones()),
  });
}
