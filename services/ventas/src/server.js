import { cargarConfiguracion } from './config/index.js';
import { crearApp } from './app.js';
import { crearPool, crearVerificadorBaseDatos } from './db/pool.js';
import { migrar } from './db/migrar.js';
import { crearRepositorioVentas } from './repositories/ventas.repository.js';
import { crearClienteLibros } from './clients/librosClient.js';
import { crearLogger } from './utils/logger.js';

const TIEMPO_MAXIMO_APAGADO_MS = 10_000;

let config;
try {
  config = cargarConfiguracion();
} catch (error) {
  console.error(`[ventas] Configuración inválida: ${error.message}`);
  process.exit(1);
}

const logger = crearLogger({ servicio: 'ventas', nivel: config.nivelLog });
const pool = crearPool(config.baseDatos);

pool.on('error', (error) => logger.error('error en conexion inactiva del pool', { error }));

try {
  await migrar(pool, logger);
} catch (error) {
  logger.error('no se pudieron aplicar las migraciones', { error });
  await pool.end();
  process.exit(1);
}

const app = crearApp({
  config,
  logger,
  repositorio: crearRepositorioVentas(pool),
  clienteLibros: crearClienteLibros(config.libros),
  verificarBaseDatos: crearVerificadorBaseDatos(pool),
});

const servidor = app.listen(config.puerto, () => {
  logger.info('servicio de ventas iniciado', {
    puerto: config.puerto,
    entorno: config.entorno,
    version: config.version,
    libros: config.libros.url,
  });
});

function apagar(senal) {
  logger.info('apagando servicio de ventas', { senal });
  servidor.close(async () => {
    await pool.end();
    logger.info('servicio de ventas detenido');
    process.exit(0);
  });
  servidor.closeIdleConnections();
  setTimeout(() => {
    logger.warn('apagado forzado por tiempo agotado');
    process.exit(1);
  }, TIEMPO_MAXIMO_APAGADO_MS).unref();
}

process.on('SIGTERM', () => apagar('SIGTERM'));
process.on('SIGINT', () => apagar('SIGINT'));
process.on('unhandledRejection', (razon) => {
  logger.error('promesa rechazada sin manejar', { error: razon instanceof Error ? razon : new Error(String(razon)) });
});
