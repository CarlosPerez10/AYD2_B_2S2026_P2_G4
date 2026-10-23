import { useState } from 'react';
import { erroresPorCampo, validarLibro } from '../../utils/validacionLibro.js';

const VACIO = { titulo: '', autor: '', precio: '', existencias: '', isbn: '' };

function aFormulario(libro) {
  if (!libro) return VACIO;
  return {
    titulo: libro.titulo,
    autor: libro.autor,
    precio: String(libro.precio),
    existencias: String(libro.existencias),
    isbn: libro.isbn ?? '',
  };
}

/**
 * Formulario de crear y editar. `alGuardar(datos)` debe lanzar el ErrorApi del servidor
 * para mostrar sus `detalles` junto a cada campo.
 */
export function FormularioLibro({ libro, alGuardar, alCancelar }) {
  const [valores, setValores] = useState(() => aFormulario(libro));
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (evento) => setValores((previos) => ({ ...previos, [campo]: evento.target.value }));

  async function enviar(evento) {
    evento.preventDefault();
    const { datos, errores: locales } = validarLibro(valores);
    setErrores(locales);
    setErrorGeneral(null);
    if (Object.keys(locales).length > 0) return;

    setEnviando(true);
    try {
      await alGuardar(datos);
    } catch (error) {
      const delServidor = erroresPorCampo(error.detalles);
      setErrores(delServidor);
      if (Object.keys(delServidor).length === 0) setErrorGeneral(error);
    } finally {
      setEnviando(false);
    }
  }

  const campo = (nombre, etiqueta, propiedades = {}) => (
    <label className={errores[nombre] ? 'campo con-error' : 'campo'}>
      <span>{etiqueta}</span>
      <input
        value={valores[nombre]}
        onChange={cambiar(nombre)}
        aria-invalid={Boolean(errores[nombre])}
        aria-describedby={errores[nombre] ? `error-${nombre}` : undefined}
        {...propiedades}
      />
      {errores[nombre] && (
        <small id={`error-${nombre}`} className="error-campo">
          {errores[nombre]}
        </small>
      )}
    </label>
  );

  return (
    <form className="panel formulario" onSubmit={enviar} noValidate>
      <h2>{libro ? `Editar «${libro.titulo}»` : 'Nuevo libro'}</h2>
      {campo('titulo', 'Título', { maxLength: 200, required: true })}
      {campo('autor', 'Autor', { maxLength: 150, required: true })}
      <div className="fila-campos">
        {campo('precio', 'Precio (Q)', { type: 'number', min: '0.01', step: '0.01', inputMode: 'decimal' })}
        {campo('existencias', 'Existencias', { type: 'number', min: '0', step: '1', inputMode: 'numeric' })}
      </div>
      {campo('isbn', 'ISBN (opcional, 13 dígitos)', { inputMode: 'numeric', maxLength: 13 })}

      {errorGeneral && (
        <p className="alerta alerta-error" role="alert">
          {errorGeneral.message}
          {errorGeneral.requestId && <code className="texto-tenue"> ({errorGeneral.requestId})</code>}
        </p>
      )}

      <div className="acciones">
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" className="boton boton-secundario" onClick={alCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
