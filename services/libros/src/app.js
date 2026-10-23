import express from 'express';
import { requestId } from './middlewares/requestId.js';
import { registroPeticiones } from './middlewares/registroPeticiones.js';
import { manejoErrores, rutaNoEncontrada } from './middlewares/manejoErrores.js';
import { crearControladorLibros } from './controllers/libros.controller.js';
import { rutasInternas, rutasLibros } from './routes/libros.routes.js';
import { rutasSalud } from './routes/salud.routes.js';
import { crearServicioLibros } from './services/libros.service.js';

/**
 * Compone la aplicación. El repositorio y la verificación de la base se inyectan para
 * poder probar todo sin PostgreSQL.
 */
export function crearApp({ config, logger, repositorio, verificarBaseDatos }) {
  const app = express();
  const controlador = crearControladorLibros(crearServicioLibros(repositorio));

  app.disable('x-powered-by');
  app.use(requestId());
  app.use(registroPeticiones(logger));
  app.use(express.json({ limit: '100kb' }));

  app.use(rutasSalud({ version: config.version, verificarBaseDatos }));
  app.use('/api/v1/libros', rutasLibros(controlador));
  app.use('/internal/v1/libros', rutasInternas(controlador));

  app.use(rutaNoEncontrada());
  app.use(manejoErrores(logger));

  return app;
}
