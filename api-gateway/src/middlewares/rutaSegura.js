import { errores } from '../utils/errores.js';

// Segmentos "." o "..", barras invertidas, barras dobles y sus versiones codificadas.
// Se rechazan antes de enrutar para que nadie alcance /internal desde una ruta pública.
const PATRON_SOSPECHOSO = /(^|\/)\.{1,2}(\/|$)|\\|\/\/|%2e|%2f|%5c/i;

export function rutaSegura() {
  return (req, res, next) => {
    const ruta = req.originalUrl.split('?')[0];
    if (PATRON_SOSPECHOSO.test(ruta)) return next(errores.rutaInvalida());
    next();
  };
}
