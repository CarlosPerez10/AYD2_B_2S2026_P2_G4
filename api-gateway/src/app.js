import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestId } from './middlewares/requestId.js';
import { registroPeticiones } from './middlewares/registroPeticiones.js';
import { rutaSegura } from './middlewares/rutaSegura.js';
import { limitePeticiones } from './middlewares/limitePeticiones.js';
import { autenticacionAdmin } from './middlewares/autenticacionAdmin.js';
import { manejoErrores, rutaNoEncontrada } from './middlewares/manejoErrores.js';
import { proxyServicio } from './proxy/proxyServicio.js';
import { rutasSalud } from './routes/salud.routes.js';
import { crearSaludServicios } from './services/saludServicios.js';
import { errores } from './utils/errores.js';

/**
 * Tabla de enrutamiento: prefijo público → microservicio dueño del recurso.
 * Las rutas se reenvían sin reescribir, así el contrato es el mismo en el gateway y en el servicio.
 */
export function tablaDeRutas(servicios) {
  return [
    { servicio: 'libros', prefijo: '/api/v1/libros', destino: servicios.libros },
    { servicio: 'ventas', prefijo: '/api/v1/ventas', destino: servicios.ventas },
  ];
}

export function crearApp({ config, logger, fetchImpl }) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.saltosProxy);

  // 1. Trazabilidad y seguridad básica
  app.use(requestId());
  app.use(registroPeticiones(logger));
  app.use(helmet());
  app.use(
    cors({
      origin: config.origenesCors,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Api-Key', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy', 'Retry-After'],
      maxAge: 600,
    }),
  );
  app.use(rutaSegura());

  // 2. Salud (sin límite ni autenticación: la consulta el balanceador)
  app.use(
    rutasSalud({
      version: config.version,
      obtenerSaludServicios: crearSaludServicios({
        servicios: config.servicios,
        tiempoLimiteMs: config.tiempoLimiteSaludMs,
        fetchImpl,
      }),
    }),
  );

  // 3. Las rutas internas entre servicios nunca se exponen
  app.use('/internal', (req, res, next) => next(errores.noEncontrado(req.originalUrl)));

  // 4. Política del borde para la API
  app.use('/api', limitePeticiones(config.limitePeticiones));
  app.use('/api', autenticacionAdmin(config.llaveAdmin));

  // 5. Enrutamiento hacia los microservicios
  for (const ruta of tablaDeRutas(config.servicios)) {
    app.use(proxyServicio({ ...ruta, tiempoLimiteMs: config.tiempoLimiteProxyMs }));
  }

  // 6. Cierre
  app.use(rutaNoEncontrada());
  app.use(manejoErrores(logger));

  return app;
}
