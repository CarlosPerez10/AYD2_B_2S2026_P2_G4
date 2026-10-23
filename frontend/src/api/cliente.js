/**
 * Envoltorio de fetch para la API Gateway. Siempre usa rutas relativas (/api/v1/...):
 * en local las reenvía Nginx o Vite y en AWS el ALB, así el mismo build sirve en ambos.
 */
export class ErrorApi extends Error {
  constructor({ estado, codigo, mensaje, detalles, requestId }) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.codigo = codigo;
    this.detalles = detalles;
    this.requestId = requestId;
  }
}

function construirUrl(ruta, consulta) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(consulta ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') parametros.set(clave, String(valor));
  }
  const texto = parametros.toString();
  return texto ? `${ruta}?${texto}` : ruta;
}

/** Devuelve `{ data, meta }`; lanza ErrorApi con el formato `{ error }` del contrato. */
export async function solicitar(ruta, { metodo = 'GET', consulta, cuerpo, llaveAdmin, signal } = {}) {
  const encabezados = { Accept: 'application/json' };
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
  // La llave solo viaja en operaciones de administración.
  if (llaveAdmin) encabezados['X-Api-Key'] = llaveAdmin;

  let respuesta;
  try {
    respuesta = await fetch(construirUrl(ruta, consulta), {
      method: metodo,
      headers: encabezados,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ErrorApi({
      estado: 0,
      codigo: 'SIN_CONEXION',
      mensaje: 'No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.',
    });
  }

  if (respuesta.status === 204) return { data: null };

  const json = await respuesta.json().catch(() => null);
  const requestId = respuesta.headers.get('X-Request-Id') ?? undefined;

  if (respuesta.ok && json) return { data: json.data, meta: json.meta };

  throw new ErrorApi({
    estado: respuesta.status,
    codigo: json?.error?.codigo ?? 'RESPUESTA_INVALIDA',
    mensaje: json?.error?.mensaje ?? `El servidor respondió con un error (${respuesta.status}).`,
    detalles: json?.error?.detalles,
    requestId: json?.error?.requestId ?? requestId,
  });
}
