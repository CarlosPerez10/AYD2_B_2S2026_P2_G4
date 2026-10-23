import { Link, useLocation, useParams } from 'react-router-dom';
import { apiLibros } from '../api/libros.js';
import { Cargando, EstadoVacio, MensajeError } from '../components/Comunes.jsx';
import { useConsulta } from '../hooks/useConsulta.js';
import { formatearFecha, formatearPrecio } from '../utils/formato.js';

export function DetalleLibro() {
  const { id } = useParams();
  const { state } = useLocation();
  // Vuelve al catálogo con la misma búsqueda y página desde la que se abrió el libro.
  const volver = `/${state?.busqueda ?? ''}`;
  const { cargando, error, resultado, recargar } = useConsulta((signal) => apiLibros.obtener(id, { signal }), id);

  return (
    <section>
      <Link to={volver} className="enlace-volver">
        ← Volver al catálogo
      </Link>

      {cargando ? (
        <Cargando />
      ) : error?.estado === 404 ? (
        <EstadoVacio titulo="Este libro no existe o fue eliminado." />
      ) : error ? (
        <MensajeError error={error} alReintentar={recargar} />
      ) : (
        <article className="detalle">
          <h1>{resultado.data.titulo}</h1>
          <p className="detalle-autor">{resultado.data.autor}</p>
          <dl className="detalle-datos">
            <div>
              <dt>Precio</dt>
              <dd className="precio">{formatearPrecio(resultado.data.precio)}</dd>
            </div>
            <div>
              <dt>Existencias</dt>
              <dd>
                {resultado.data.existencias === 0 ? (
                  <span className="etiqueta etiqueta-agotado">Agotado</span>
                ) : (
                  `${resultado.data.existencias} unidades`
                )}
              </dd>
            </div>
            <div>
              <dt>ISBN</dt>
              <dd>{resultado.data.isbn ?? 'No registrado'}</dd>
            </div>
            {resultado.data.actualizadoEn && (
              <div>
                <dt>Última actualización</dt>
                <dd>{formatearFecha(resultado.data.actualizadoEn)}</dd>
              </div>
            )}
          </dl>
        </article>
      )}
    </section>
  );
}
