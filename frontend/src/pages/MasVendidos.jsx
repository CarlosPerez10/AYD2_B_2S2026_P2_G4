import { useSearchParams } from 'react-router-dom';
import { apiVentas } from '../api/ventas.js';
import { Cargando, EstadoVacio, MensajeError } from '../components/Comunes.jsx';
import { useConsulta } from '../hooks/useConsulta.js';
import { diaSiguiente, formatearPrecio } from '../utils/formato.js';

const CANTIDADES = [5, 10, 20];

export function MasVendidos() {
  const [parametros, setParametros] = useSearchParams();
  const desde = parametros.get('desde') ?? '';
  const hasta = parametros.get('hasta') ?? '';
  const limite = Number(parametros.get('limite')) || 10;
  const rangoInvalido = desde && hasta && desde > hasta;

  function actualizar(clave, valor) {
    setParametros((previos) => {
      const siguientes = new URLSearchParams(previos);
      if (valor) siguientes.set(clave, valor);
      else siguientes.delete(clave);
      return siguientes;
    });
  }

  // "hasta" es inclusivo para el usuario y exclusivo en la API.
  const consulta = { limite, desde: desde || undefined, hasta: hasta ? diaSiguiente(hasta) : undefined };
  const ranking = useConsulta(
    (signal) => (rangoInvalido ? Promise.resolve(null) : apiVentas.ranking(consulta, { signal })),
    JSON.stringify(consulta),
  );

  const filas = ranking.resultado?.data ?? [];
  const maximo = Math.max(1, ...filas.map((fila) => fila.unidadesVendidas));

  return (
    <section>
      <div className="titulo-seccion">
        <h1>Más vendidos</h1>
      </div>

      <form className="filtros" onSubmit={(evento) => evento.preventDefault()}>
        <label className="campo">
          <span>Desde</span>
          <input type="date" value={desde} max={hasta || undefined} onChange={(e) => actualizar('desde', e.target.value)} />
        </label>
        <label className="campo">
          <span>Hasta</span>
          <input type="date" value={hasta} min={desde || undefined} onChange={(e) => actualizar('hasta', e.target.value)} />
        </label>
        <label className="campo campo-corto">
          <span>Mostrar</span>
          <select value={limite} onChange={(e) => actualizar('limite', e.target.value)}>
            {CANTIDADES.map((cantidad) => (
              <option key={cantidad} value={cantidad}>
                Top {cantidad}
              </option>
            ))}
          </select>
        </label>
        {(desde || hasta) && (
          <button type="button" className="boton boton-secundario" onClick={() => setParametros({})}>
            Quitar fechas
          </button>
        )}
      </form>

      {rangoInvalido ? (
        <p className="alerta alerta-aviso">La fecha inicial debe ser anterior o igual a la final.</p>
      ) : ranking.cargando ? (
        <Cargando texto="Calculando ranking…" />
      ) : ranking.error ? (
        <MensajeError error={ranking.error} alReintentar={ranking.recargar} />
      ) : filas.length === 0 ? (
        <EstadoVacio titulo="No hay ventas en el período seleccionado." />
      ) : (
        <ol className="ranking">
          {filas.map((fila) => (
            <li key={fila.libroId} className="ranking-fila">
              <span className="ranking-posicion">{fila.posicion}</span>
              <div className="ranking-libro">
                <strong>{fila.titulo}</strong>
                <span className="texto-tenue">{fila.autor}</span>
                <div className="barra" aria-hidden="true">
                  <span style={{ width: `${(fila.unidadesVendidas / maximo) * 100}%` }} />
                </div>
              </div>
              <div className="ranking-cifras">
                <span>{fila.unidadesVendidas} u.</span>
                <span className="texto-tenue">{formatearPrecio(fila.montoTotal)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
