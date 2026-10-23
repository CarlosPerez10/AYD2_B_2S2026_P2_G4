import http from 'node:http';
import { cargarConfiguracion } from '../../src/config/index.js';
import { crearApp } from '../../src/app.js';
import { loggerSilencioso } from '../../src/utils/logger.js';

export const LLAVE = 'llave-de-pruebas-0123456789';

/**
 * Levanta un microservicio simulado en un puerto libre. `manejador` recibe (req, res, cuerpo).
 */
export async function servicioSimulado(manejador) {
  const peticiones = [];
  const servidor = http.createServer((req, res) => {
    const partes = [];
    req.on('data', (parte) => partes.push(parte));
    req.on('end', () => {
      const cuerpo = Buffer.concat(partes).toString('utf8');
      peticiones.push({ metodo: req.method, url: req.url, encabezados: req.headers, cuerpo });
      manejador(req, res, cuerpo);
    });
  });
  await new Promise((resolver) => servidor.listen(0, '127.0.0.1', resolver));
  const { port } = servidor.address();
  return {
    url: `http://127.0.0.1:${port}`,
    peticiones,
    cerrar: () =>
      new Promise((resolver) => {
        servidor.closeAllConnections();
        servidor.close(resolver);
      }),
  };
}

/** Responde siempre JSON con el método y la ruta recibidos. */
export function eco(req, res, cuerpo) {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ metodo: req.method, url: req.url, cuerpo }));
}

/** URL a la que nadie escucha, para simular un servicio caído. */
export const URL_SIN_SERVICIO = 'http://127.0.0.1:9';

export function crearAppDePrueba(variables = {}) {
  const config = cargarConfiguracion({
    NODE_ENV: 'test',
    ADMIN_API_KEY: LLAVE,
    LIBROS_SERVICE_URL: URL_SIN_SERVICIO,
    VENTAS_SERVICE_URL: URL_SIN_SERVICIO,
    ...variables,
  });
  return crearApp({ config, logger: loggerSilencioso });
}
