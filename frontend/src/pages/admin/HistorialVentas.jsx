import { useState } from 'react';
import { apiVentas } from '../../api/ventas.js';
import { Cargando, EstadoVacio, MensajeError, Paginacion } from '../../components/Comunes.jsx';
import { useConsulta } from '../../hooks/useConsulta.js';
import { useSesionAdmin } from '../../hooks/useSesionAdmin.jsx';
import { formatearFecha, formatearPrecio } from '../../utils/formato.js';
import { AvisoNoAutorizado } from './AvisoNoAutorizado.jsx';

export function HistorialVentas() {
  const { llave } = useSesionAdmin();
  const [pagina, setPagina] = useState(1);
  const historial = useConsulta(
    (signal) => apiVentas.historial({ pagina, limite: 20 }, llave, { signal }),
    `historial-${pagina}`,
  );

  if (historial.cargando) return <Cargando texto="Cargando historial…" />;
  if (historial.error?.estado === 401) return <AvisoNoAutorizado />;
  if (historial.error) return <MensajeError error={historial.error} alReintentar={historial.recargar} />;
  if (historial.resultado.data.length === 0) return <EstadoVacio titulo="Todavía no hay ventas registradas." />;

  return (
    <>
      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Libro</th>
              <th className="numero">Cantidad</th>
              <th className="numero">Precio unitario</th>
              <th className="numero">Total</th>
            </tr>
          </thead>
          <tbody>
            {historial.resultado.data.map((venta) => (
              <tr key={venta.id}>
                <td data-etiqueta="#">{venta.id}</td>
                <td data-etiqueta="Fecha">{formatearFecha(venta.fecha)}</td>
                <td data-etiqueta="Libro">
                  {venta.titulo}
                  <span className="texto-tenue"> · {venta.autor}</span>
                </td>
                <td data-etiqueta="Cantidad" className="numero">
                  {venta.cantidad}
                </td>
                <td data-etiqueta="Precio unitario" className="numero">
                  {formatearPrecio(venta.precioUnitario)}
                </td>
                <td data-etiqueta="Total" className="numero">
                  {formatearPrecio(venta.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacion
        pagina={historial.resultado.meta.pagina}
        totalPaginas={historial.resultado.meta.totalPaginas}
        alCambiar={setPagina}
      />
    </>
  );
}
