export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="estado" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  );
}

/** Muestra el mensaje del contrato y el requestId para buscar el problema en los logs. */
export function MensajeError({ error, alReintentar }) {
  if (!error) return null;
  return (
    <div className="alerta alerta-error" role="alert">
      <p>{error.message}</p>
      {error.requestId && (
        <p className="texto-tenue">
          Código de seguimiento: <code>{error.requestId}</code>
        </p>
      )}
      {alReintentar && (
        <button type="button" className="boton boton-secundario" onClick={alReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EstadoVacio({ titulo, children }) {
  return (
    <div className="estado estado-vacio">
      <p className="estado-titulo">{titulo}</p>
      {children}
    </div>
  );
}

export function Paginacion({ pagina, totalPaginas, alCambiar }) {
  if (!totalPaginas || totalPaginas <= 1) return null;
  return (
    <nav className="paginacion" aria-label="Paginación">
      <button type="button" className="boton boton-secundario" disabled={pagina <= 1} onClick={() => alCambiar(pagina - 1)}>
        ← Anterior
      </button>
      <span>
        Página {pagina} de {totalPaginas}
      </span>
      <button
        type="button"
        className="boton boton-secundario"
        disabled={pagina >= totalPaginas}
        onClick={() => alCambiar(pagina + 1)}
      >
        Siguiente →
      </button>
    </nav>
  );
}
