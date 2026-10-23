import { solicitar } from './cliente.js';

const BASE = '/api/v1/ventas';

export const apiVentas = {
  ranking: (consulta, opciones) => solicitar(`${BASE}/ranking`, { consulta, ...opciones }),
  historial: (consulta, llaveAdmin, opciones) => solicitar(BASE, { consulta, llaveAdmin, ...opciones }),
  registrar: (venta, llaveAdmin) => solicitar(BASE, { metodo: 'POST', cuerpo: venta, llaveAdmin }),
};
