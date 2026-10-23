import { useState } from 'react';
import { apiLibros } from '../../api/libros.js';
import { apiVentas } from '../../api/ventas.js';
import { Cargando, MensajeError } from '../../components/Comunes.jsx';
import { useConsulta } from '../../hooks/useConsulta.js';
import { useSesionAdmin } from '../../hooks/useSesionAdmin.jsx';
import { formatearPrecio } from '../../utils/formato.js';
import { AvisoNoAutorizado } from './AvisoNoAutorizado.jsx';

export function RegistrarVenta() {
  const { llave } = useSesionAdmin();
  const [libroId, setLibroId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  // Lista para elegir el libro (el contrato permite hasta 100 por página).
  const libros = useConsulta((signal) => apiLibros.listar({ limite: 100, orden: 'titulo' }, { signal }), 'venta-libros');
  const elegido = libros.resultado?.data.find((libro) => libro.id === Number(libroId));
  const cantidadNumero = Number(cantidad);
  const cantidadValida = Number.isInteger(cantidadNumero) && cantidadNumero >= 1 && cantidadNumero <= 1000;

  async function registrar(evento) {
    evento.preventDefault();
    setError(null);
    setResultado(null);
    setEnviando(true);
    try {
      const { data } = await apiVentas.registrar({ libroId: Number(libroId), cantidad: cantidadNumero }, llave);
      setResultado(data);
      setCantidad('1');
      libros.recargar(); // las existencias cambiaron
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  }

  if (libros.cargando && !libros.resultado) return <Cargando />;
  if (libros.error) return <MensajeError error={libros.error} alReintentar={libros.recargar} />;

  return (
    <form className="panel formulario" onSubmit={registrar}>
      <h2>Registrar venta</h2>

      <label className="campo">
        <span>Libro</span>
        <select value={libroId} onChange={(e) => setLibroId(e.target.value)} required>
          <option value="">Seleccione un libro…</option>
          {libros.resultado.data.map((libro) => (
            <option key={libro.id} value={libro.id} disabled={libro.existencias === 0}>
              {libro.titulo} — {libro.autor} ({libro.existencias === 0 ? 'agotado' : `${libro.existencias} disp.`})
            </option>
          ))}
        </select>
      </label>

      <label className={cantidad !== '' && !cantidadValida ? 'campo con-error' : 'campo'}>
        <span>Cantidad</span>
        <input type="number" min="1" max="1000" step="1" inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        {cantidad !== '' && !cantidadValida && <small className="error-campo">Debe ser un entero entre 1 y 1000.</small>}
      </label>

      {elegido && cantidadValida && (
        <p className="resumen">
          Total estimado: <strong>{formatearPrecio(elegido.precio * cantidadNumero)}</strong>
          <span className="texto-tenue"> ({formatearPrecio(elegido.precio)} c/u)</span>
        </p>
      )}

      {error?.codigo === 'EXISTENCIAS_INSUFICIENTES' ? (
        <div className="alerta alerta-aviso" role="alert">
          <p>
            <strong>No hay existencias suficientes.</strong> {error.message}
          </p>
          {error.detalles && (
            <p>
              Disponibles: {error.detalles.disponibles} · Solicitadas: {error.detalles.solicitadas}
            </p>
          )}
        </div>
      ) : error?.estado === 401 ? (
        <AvisoNoAutorizado />
      ) : (
        <MensajeError error={error} />
      )}

      {resultado && (
        <p className="alerta alerta-exito" role="status">
          Venta #{resultado.id} registrada: {resultado.cantidad} × «{resultado.titulo}» por {formatearPrecio(resultado.total)}.
        </p>
      )}

      <div className="acciones">
        <button type="submit" className="boton" disabled={enviando || !libroId || !cantidadValida}>
          {enviando ? 'Registrando…' : 'Registrar venta'}
        </button>
      </div>
    </form>
  );
}
