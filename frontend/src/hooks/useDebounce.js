import { useEffect, useState } from 'react';

/** Devuelve `valor` solo cuando deja de cambiar durante `esperaMs`. */
export function useDebounce(valor, esperaMs = 300) {
  const [estable, setEstable] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setEstable(valor), esperaMs);
    return () => clearTimeout(temporizador);
  }, [valor, esperaMs]);

  return estable;
}
