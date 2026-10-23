import express from 'express';
import { requestId } from './middlewares/requestId.js';
import { registroPeticiones } from './middlewares/registroPeticiones.js';
import { manejoErrores, rutaNoEncontrada } from './middlewares/manejoErrores.js';
import { crearControladorVentas } from './controllers/ventas.controller.js';
import { rutasVentas } from './routes/ventas.routes.js';
import { rutasSalud } from './routes/salud.routes.js';
import { crearServicioVentas } from './services/ventas.service.js';

/**
 * Compone la aplicación. El repositorio, el cliente de Libros y la verificación de la base
 * se inyectan para poder probar todo sin PostgreSQL ni Libros.
 */
export function crearApp({ config, logger, repositorio, clienteLibros, verificarBaseDatos }) {
  const app = express();
  const controlador = crearControladorVentas(crearServicioVentas({ repositorio, clienteLibros, logger }));

  app.disable('x-powered-by');
  app.use(requestId());
  app.use(registroPeticiones(logger));
  app.use(express.json({ limit: '100kb' }));

  app.use(rutasSalud({ version: config.version, verificarBaseDatos }));
  app.use('/api/v1/ventas', rutasVentas(controlador));

  app.use(rutaNoEncontrada());
  app.use(manejoErrores(logger));

  return app;
}
