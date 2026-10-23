import { solicitar } from './cliente.js';

const BASE = '/api/v1/libros';

export const apiLibros = {
  listar: (consulta, opciones) => solicitar(BASE, { consulta, ...opciones }),
  autores: (opciones) => solicitar(`${BASE}/autores`, opciones),
  obtener: (id, opciones) => solicitar(`${BASE}/${id}`, opciones),
  crear: (libro, llaveAdmin) => solicitar(BASE, { metodo: 'POST', cuerpo: libro, llaveAdmin }),
  actualizar: (id, libro, llaveAdmin) => solicitar(`${BASE}/${id}`, { metodo: 'PUT', cuerpo: libro, llaveAdmin }),
  eliminar: (id, llaveAdmin) => solicitar(`${BASE}/${id}`, { metodo: 'DELETE', llaveAdmin }),
};
