import { cargarConfiguracion } from './config/index.js';
import { crearApp } from './app.js';
import { crearLogger } from './utils/logger.js';

const TIEMPO_MAXIMO_APAGADO_MS = 10_000;

let config;
try {
  config = cargarConfiguracion();
} catch (error) {
  console.error(`[api-gateway] Configuración inválida: ${error.message}`);
  process.exit(1);
}

const logger = crearLogger({ servicio: 'api-gateway', nivel: config.nivelLog });
const app = crearApp({ config, logger });

const servidor = app.listen(config.puerto, () => {
  logger.info('gateway iniciado', {
    puerto: config.puerto,
    entorno: config.entorno,
    version: config.version,
    servicios: config.servicios,
  });
});

// El ALB mantiene conexiones abiertas hasta 60 s; el servidor debe esperar más que eso
// para no cerrar una conexión que el balanceador todavía considera viva (errores 502).
servidor.keepAliveTimeout = 65_000;
servidor.headersTimeout = 66_000;

function apagar(senal) {
  logger.info('apagando gateway', { senal });
  servidor.close(() => {
    logger.info('gateway detenido');
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
