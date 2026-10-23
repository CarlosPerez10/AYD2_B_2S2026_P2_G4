import http from 'node:http';
import https from 'node:https';
import { pipeline } from 'node:stream';
import { errores } from '../utils/errores.js';

// Encabezados que describen la conexión entre dos saltos y no deben reenviarse (RFC 9110 §7.6.1).
const SALTO_A_SALTO = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

// La llave de administración se valida en el gateway; los microservicios no la necesitan.
const PRIVADOS_PETICION = new Set(['x-api-key']);
// El gateway es dueño del identificador de la petición que ve el cliente.
const PRIVADOS_RESPUESTA = new Set(['x-request-id']);

const SIN_CONEXION = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'EHOSTUNREACH', 'ENETUNREACH']);

function filtrarEncabezados(encabezados, excluidos) {
  const nombradosEnConnection = String(encabezados.connection || '')
    .split(',')
    .map((nombre) => nombre.trim().toLowerCase())
    .filter(Boolean);

  const resultado = {};
  for (const [nombre, valor] of Object.entries(encabezados)) {
    if (SALTO_A_SALTO.has(nombre) || excluidos.has(nombre) || nombradosEnConnection.includes(nombre)) continue;
    resultado[nombre] = valor;
  }
  return resultado;
}

export function traducirError(error, servicio) {
  if (error.code === 'ETIMEDOUT') return errores.tiempoAgotado(servicio);
  if (SIN_CONEXION.has(error.code)) return errores.servicioNoDisponible(servicio);
  return errores.respuestaInvalida(servicio);
}

/**
 * Reenvía en streaming todas las peticiones cuyo path empieza con `prefijo` hacia
 * `destino`, sin reescribir la ruta. El cuerpo nunca se interpreta en el gateway.
 */
export function proxyServicio({ servicio, prefijo, destino, tiempoLimiteMs }) {
  const objetivo = new URL(destino);
  const cliente = objetivo.protocol === 'https:' ? https : http;
  // Conexiones persistentes hacia cada microservicio para no pagar un handshake por petición.
  const agente = new cliente.Agent({ keepAlive: true, maxSockets: 128 });

  const coincide = (ruta) => ruta === prefijo || ruta.startsWith(`${prefijo}/`);

  return (req, res, next) => {
    if (!coincide(req.path)) return next();

    const encabezados = filtrarEncabezados(req.headers, PRIVADOS_PETICION);
    encabezados.host = objetivo.host;
    encabezados['x-forwarded-for'] = [req.headers['x-forwarded-for'], req.socket.remoteAddress]
      .filter(Boolean)
      .join(', ');
    encabezados['x-forwarded-proto'] = req.protocol;
    encabezados['x-forwarded-host'] = req.headers.host;

    const peticion = cliente.request({
      protocol: objetivo.protocol,
      hostname: objetivo.hostname,
      port: objetivo.port,
      method: req.method,
      path: req.originalUrl,
      headers: encabezados,
      agent: agente,
    });

    peticion.setTimeout(tiempoLimiteMs, () => {
      const error = new Error(`${servicio} no respondió en ${tiempoLimiteMs} ms`);
      error.code = 'ETIMEDOUT';
      peticion.destroy(error);
    });

    peticion.on('response', (respuesta) => {
      res.status(respuesta.statusCode);
      for (const [nombre, valor] of Object.entries(filtrarEncabezados(respuesta.headers, PRIVADOS_RESPUESTA))) {
        res.setHeader(nombre, valor);
      }
      pipeline(respuesta, res, () => {});
    });

    peticion.on('error', (error) => {
      // El cliente ya cerró la conexión: no hay a quién responder.
      if (res.destroyed) return;
      // Si ya se enviaron encabezados no se puede cambiar la respuesta: se corta la conexión.
      if (res.headersSent) {
        res.destroy(error);
        return;
      }
      next(Object.assign(traducirError(error, servicio), { cause: error }));
    });

    // Si el cliente se va antes de terminar, se libera la conexión con el microservicio.
    res.on('close', () => {
      if (!res.writableFinished) peticion.destroy();
    });

    req.pipe(peticion);
  };
}
