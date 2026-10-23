import { Link, useLocation } from 'react-router-dom';
import { formatearPrecio } from '../utils/formato.js';

export function TarjetaLibro({ libro }) {
  const { search } = useLocation();
  const agotado = libro.existencias === 0;

  return (
    <article className="tarjeta">
      {/* Se guarda la búsqueda actual para que "Volver" la conserve. */}
      <Link to={`/libros/${libro.id}`} state={{ busqueda: search }} className="tarjeta-enlace">
        <h3 className="tarjeta-titulo">{libro.titulo}</h3>
      </Link>
      <p className="tarjeta-autor">{libro.autor}</p>
      <div className="tarjeta-pie">
        <span className="precio">{formatearPrecio(libro.precio)}</span>
        {agotado ? (
          <span className="etiqueta etiqueta-agotado">Agotado</span>
        ) : (
          <span className="etiqueta">{libro.existencias} disponibles</span>
        )}
      </div>
    </article>
  );
}
