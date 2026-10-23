import { useState } from 'react';
import { apiLibros } from '../../api/libros.js';
import { Cargando, EstadoVacio, MensajeError, Paginacion } from '../../components/Comunes.jsx';
import { useConsulta } from '../../hooks/useConsulta.js';
import { useSesionAdmin } from '../../hooks/useSesionAdmin.jsx';
import { formatearPrecio } from '../../utils/formato.js';
import { AvisoNoAutorizado } from './AvisoNoAutorizado.jsx';
import { FormularioLibro } from './FormularioLibro.jsx';

export function AdminLibros() {
  const { llave } = useSesionAdmin();
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState(null); // null, 'nuevo' o un libro
  const [porEliminar, setPorEliminar] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  const listado = useConsulta(
    (signal) => apiLibros.listar({ pagina, limite: 20, orden: 'titulo' }, { signal }),
    `admin-${pagina}`,
  );

  async function guardar(datos) {
    if (editando === 'nuevo') await apiLibros.crear(datos, llave);
    else await apiLibros.actualizar(editando.id, datos, llave);
    setAviso(editando === 'nuevo' ? `Se registró «${datos.titulo}».` : `Se actualizó «${datos.titulo}».`);
    setEditando(null);
    listado.recargar();
  }

  async function eliminar(libro) {
    setErrorAccion(null);
    try {
      await apiLibros.eliminar(libro.id, llave);
      setAviso(`Se eliminó «${libro.titulo}».`);
      listado.recargar();
    } catch (error) {
      setErrorAccion(error);
    } finally {
      setPorEliminar(null);
    }
  }

  if (editando) {
    return (
      <FormularioLibro
        libro={editando === 'nuevo' ? null : editando}
        alGuardar={guardar}
        alCancelar={() => setEditando(null)}
      />
    );
  }

  return (
    <div>
      <div className="barra-acciones">
        <button
          type="button"
          className="boton"
          onClick={() => {
            setAviso(null);
            setEditando('nuevo');
          }}
        >
          + Nuevo libro
        </button>
      </div>

      {aviso && (
        <p className="alerta alerta-exito" role="status">
          {aviso}
        </p>
      )}
      {errorAccion?.estado === 401 ? <AvisoNoAutorizado /> : <MensajeError error={errorAccion} />}

      {listado.cargando ? (
        <Cargando />
      ) : listado.error ? (
        <MensajeError error={listado.error} alReintentar={listado.recargar} />
      ) : listado.resultado.data.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay libros registrados." />
      ) : (
        <>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Autor</th>
                  <th className="numero">Precio</th>
                  <th className="numero">Existencias</th>
                  <th>
                    <span className="solo-lector">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {listado.resultado.data.map((libro) => (
                  <tr key={libro.id}>
                    <td data-etiqueta="Título">{libro.titulo}</td>
                    <td data-etiqueta="Autor">{libro.autor}</td>
                    <td data-etiqueta="Precio" className="numero">
                      {formatearPrecio(libro.precio)}
                    </td>
                    <td data-etiqueta="Existencias" className="numero">
                      {libro.existencias}
                    </td>
                    <td className="celda-acciones">
                      {porEliminar === libro.id ? (
                        <>
                          <span>¿Eliminar?</span>
                          <button type="button" className="boton boton-peligro" onClick={() => eliminar(libro)}>
                            Sí, eliminar
                          </button>
                          <button type="button" className="boton boton-secundario" onClick={() => setPorEliminar(null)}>
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="boton boton-secundario"
                            onClick={() => {
                              setAviso(null);
                              setEditando(libro);
                            }}
                          >
                            Editar
                          </button>
                          <button type="button" className="boton boton-secundario" onClick={() => setPorEliminar(libro.id)}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={listado.resultado.meta.pagina}
            totalPaginas={listado.resultado.meta.totalPaginas}
            alCambiar={setPagina}
          />
        </>
      )}
    </div>
  );
}
