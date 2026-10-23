import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta `cargar(signal)` cada vez que cambia `clave` y expone los estados de carga,
 * error y datos. Cancela la petición anterior para que una respuesta lenta no pise a la nueva.
 */
export function useConsulta(cargar, clave) {
  const [estado, setEstado] = useState({ cargando: true, error: null, resultado: null });
  const [version, setVersion] = useState(0);
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;

  useEffect(() => {
    const controlador = new AbortController();
    setEstado((previo) => ({ ...previo, cargando: true, error: null }));

    cargarRef
      .current(controlador.signal)
      .then((resultado) => setEstado({ cargando: false, error: null, resultado }))
      .catch((error) => {
        if (error.name !== 'AbortError') setEstado({ cargando: false, error, resultado: null });
      });

    return () => controlador.abort();
  }, [clave, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return { ...estado, recargar };
}
