import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiLibros } from '../api/libros.js';
import { Cargando, EstadoVacio, MensajeError, Paginacion } from '../components/Comunes.jsx';
import { TarjetaLibro } from '../components/TarjetaLibro.jsx';
import { useConsulta } from '../hooks/useConsulta.js';
import { useDebounce } from '../hooks/useDebounce.js';

const LIMITE = 12;
const FILTROS = ['q', 'autor', 'precioMin', 'precioMax', 'disponibles', 'orden'];
const ORDENES = [
  ['titulo', 'Título (A–Z)'],
  ['-titulo', 'Título (Z–A)'],
  ['autor', 'Autor (A–Z)'],
  ['-autor', 'Autor (Z–A)'],
  ['precio', 'Precio: menor a mayor'],
  ['-precio', 'Precio: mayor a menor'],
];

export function Catalogo() {
  // Los filtros viven en la URL para poder compartir un enlace con la búsqueda.
  const [parametros, setParametros] = useSearchParams();
  const leer = (clave) => parametros.get(clave) ?? '';
  const pagina = Number(parametros.get('pagina')) || 1;

  const [texto, setTexto] = useState(leer('q'));
  const textoEstable = useDebounce(texto, 300);

  function actualizar(cambios) {
    setParametros((previos) => {
      const siguientes = new URLSearchParams(previos);
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === '' || valor === undefined || valor === false) siguientes.delete(clave);
        else siguientes.set(clave, String(valor));
      }
      // Cualquier cambio de filtro vuelve a la primera página.
      if (!('pagina' in cambios)) siguientes.delete('pagina');
      return siguientes;
    });
  }

  // El texto escrito llega a la URL 300 ms después de la última tecla.
  useEffect(() => {
    if (textoEstable.trim() !== leer('q')) actualizar({ q: textoEstable.trim() });
  }, [textoEstable]);

  // Si la URL cambia desde fuera (atrás/adelante o "Limpiar"), el campo la sigue
  // sin borrar el espacio que el usuario está escribiendo.
  const qEnUrl = leer('q');
  useEffect(() => {
    setTexto((actual) => (actual.trim() === qEnUrl ? actual : qEnUrl));
  }, [qEnUrl]);

  const consulta = {
    q: leer('q'),
    autor: leer('autor'),
    precioMin: leer('precioMin'),
    precioMax: leer('precioMax'),
    disponibles: leer('disponibles') === 'true' ? 'true' : undefined,
    orden: leer('orden') || 'titulo',
    pagina,
    limite: LIMITE,
  };

  const rangoInvalido =
    consulta.precioMin !== '' && consulta.precioMax !== '' && Number(consulta.precioMin) > Number(consulta.precioMax);
  // Con un rango inválido no se consulta: el aviso ya explica qué corregir.
  const libros = useConsulta(
    (signal) => (rangoInvalido ? Promise.resolve(null) : apiLibros.listar(consulta, { signal })),
    JSON.stringify(consulta),
  );
  const autores = useConsulta((signal) => apiLibros.autores({ signal }), 'autores');

  const hayFiltros = FILTROS.some((clave) => parametros.has(clave));

  return (
    <section>
      <div className="titulo-seccion">
        <h1>Catálogo</h1>
        {libros.resultado?.meta && <p className="texto-tenue">{libros.resultado.meta.total} libros</p>}
      </div>

      <form className="filtros" role="search" onSubmit={(evento) => evento.preventDefault()}>
        <label className="campo campo-busqueda">
          <span>Buscar por título o autor</span>
          <input
            type="search"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Ej.: garcía, rayuela…"
            maxLength={100}
          />
        </label>

        <label className="campo">
          <span>Autor</span>
          <select value={leer('autor')} onChange={(evento) => actualizar({ autor: evento.target.value })}>
            <option value="">Todos</option>
            {autores.resultado?.data.map((autor) => (
              <option key={autor} value={autor}>
                {autor}
              </option>
            ))}
          </select>
        </label>

        <label className="campo campo-corto">
          <span>Precio mín.</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={leer('precioMin')}
            onChange={(evento) => actualizar({ precioMin: evento.target.value })}
          />
        </label>

        <label className="campo campo-corto">
          <span>Precio máx.</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={leer('precioMax')}
            onChange={(evento) => actualizar({ precioMax: evento.target.value })}
          />
        </label>

        <label className="campo">
          <span>Ordenar por</span>
          <select value={consulta.orden} onChange={(evento) => actualizar({ orden: evento.target.value })}>
            {ORDENES.map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>

        <label className="casilla">
          <input
            type="checkbox"
            checked={consulta.disponibles === 'true'}
            onChange={(evento) => actualizar({ disponibles: evento.target.checked ? 'true' : '' })}
          />
          Solo disponibles
        </label>

        {hayFiltros && (
          <button type="button" className="boton boton-secundario" onClick={() => setParametros({})}>
            Limpiar filtros
          </button>
        )}
      </form>

      {rangoInvalido ? (
        <p className="alerta alerta-aviso">El precio mínimo no puede ser mayor que el máximo.</p>
      ) : libros.cargando ? (
        <Cargando texto="Buscando libros…" />
      ) : libros.error ? (
        <MensajeError error={libros.error} alReintentar={libros.recargar} />
      ) : libros.resultado.data.length === 0 ? (
        <EstadoVacio titulo={consulta.q ? `No se encontraron libros para «${consulta.q}».` : 'No se encontraron libros.'}>
          {hayFiltros && <p>Pruebe con otro término o limpie los filtros.</p>}
        </EstadoVacio>
      ) : (
        <>
          <div className="rejilla">
            {libros.resultado.data.map((libro) => (
              <TarjetaLibro key={libro.id} libro={libro} />
            ))}
          </div>
          <Paginacion
            pagina={libros.resultado.meta.pagina}
            totalPaginas={libros.resultado.meta.totalPaginas}
            alCambiar={(nueva) => actualizar({ pagina: nueva })}
          />
        </>
      )}
    </section>
  );
}
