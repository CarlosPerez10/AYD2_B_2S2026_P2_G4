import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CLAVE = 'libreria-ayd:llave-admin';
const ContextoSesion = createContext(null);

// sessionStorage puede no estar disponible (modo privado estricto): la sesión vive en memoria.
function leer() {
  try {
    return sessionStorage.getItem(CLAVE) ?? '';
  } catch {
    return '';
  }
}

function escribir(valor) {
  try {
    if (valor) sessionStorage.setItem(CLAVE, valor);
    else sessionStorage.removeItem(CLAVE);
  } catch {
    // Sin almacenamiento la llave dura hasta recargar la página.
  }
}

export function ProveedorSesion({ children }) {
  const [llave, setLlave] = useState(leer);

  const iniciar = useCallback((nueva) => {
    escribir(nueva);
    setLlave(nueva);
  }, []);

  const cerrar = useCallback(() => {
    escribir('');
    setLlave('');
  }, []);

  const valor = useMemo(() => ({ llave, activa: llave !== '', iniciar, cerrar }), [llave, iniciar, cerrar]);
  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesionAdmin() {
  const contexto = useContext(ContextoSesion);
  if (!contexto) throw new Error('useSesionAdmin debe usarse dentro de ProveedorSesion');
  return contexto;
}
