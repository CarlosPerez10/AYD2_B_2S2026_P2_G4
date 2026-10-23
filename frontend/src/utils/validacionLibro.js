/**
 * Mismas reglas que el validador del microservicio de Libros, para avisar antes de enviar.
 * Recibe los valores del formulario (texto) y devuelve `{ datos, errores }`.
 */
export function validarLibro(formulario) {
  const errores = {};
  const titulo = formulario.titulo.trim();
  const autor = formulario.autor.trim();
  const isbn = formulario.isbn.trim();
  const precio = Number(formulario.precio);
  const existencias = Number(formulario.existencias);

  if (!titulo) errores.titulo = 'El título es obligatorio.';
  else if (titulo.length > 200) errores.titulo = 'Máximo 200 caracteres.';

  if (!autor) errores.autor = 'El autor es obligatorio.';
  else if (autor.length > 150) errores.autor = 'Máximo 150 caracteres.';

  if (formulario.precio === '' || !Number.isFinite(precio)) errores.precio = 'Ingrese un precio.';
  else if (precio <= 0) errores.precio = 'Debe ser mayor a 0.';
  else if (precio > 99999.99) errores.precio = 'Máximo 99999.99.';
  else if (!/^\d+(\.\d{1,2})?$/.test(formulario.precio.trim())) errores.precio = 'Máximo 2 decimales.';

  if (formulario.existencias === '' || !Number.isInteger(existencias) || existencias < 0 || existencias > 100000) {
    errores.existencias = 'Debe ser un entero entre 0 y 100000.';
  }

  if (isbn && !/^\d{13}$/.test(isbn)) errores.isbn = 'Debe tener exactamente 13 dígitos.';

  return {
    errores,
    datos: { titulo, autor, precio, existencias, isbn: isbn || null },
  };
}

/** Convierte `error.detalles` ([{ campo, mensaje }]) del servidor en errores por campo. */
export function erroresPorCampo(detalles) {
  if (!Array.isArray(detalles)) return {};
  return Object.fromEntries(detalles.map(({ campo, mensaje }) => [campo, mensaje]));
}
