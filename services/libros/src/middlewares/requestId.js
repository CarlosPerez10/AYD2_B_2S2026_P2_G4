import { randomUUID } from 'node:crypto';

// Se acepta el identificador entrante solo si es razonable, para que nadie pueda
// inyectar texto arbitrario en los logs.
const FORMATO_VALIDO = /^[A-Za-z0-9._-]{8,128}$/;

export function requestId() {
  return (req, res, next) => {
    const entrante = req.get('x-request-id');
    req.id = entrante && FORMATO_VALIDO.test(entrante) ? entrante : randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
  };
}
