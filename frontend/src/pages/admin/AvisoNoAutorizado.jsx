import { useSesionAdmin } from '../../hooks/useSesionAdmin.jsx';

/** Un 401 del gateway significa que la llave guardada es incorrecta. */
export function AvisoNoAutorizado() {
  const { cerrar } = useSesionAdmin();
  return (
    <div className="alerta alerta-error" role="alert">
      <p>La llave de administración no es válida.</p>
      <button type="button" className="boton boton-secundario" onClick={cerrar}>
        Ingresar otra llave
      </button>
    </div>
  );
}
