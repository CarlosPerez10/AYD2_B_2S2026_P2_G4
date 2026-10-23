const moneda = new Intl.NumberFormat('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaHora = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' });

/** 189.5 → "Q 189.50" */
export function formatearPrecio(valor) {
  return `Q ${moneda.format(valor)}`;
}

export function formatearFecha(iso) {
  return fechaHora.format(new Date(iso));
}

/**
 * Convierte el día elegido en un <input type="date"> en el límite exclusivo que espera la API:
 * "hasta 2026-10-15" incluye todo ese día, así que se envía 2026-10-16.
 */
export function diaSiguiente(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const siguiente = new Date(Date.UTC(anio, mes - 1, dia + 1));
  return siguiente.toISOString().slice(0, 10);
}
