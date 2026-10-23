import { useState } from 'react';
import { useSesionAdmin } from '../hooks/useSesionAdmin.jsx';
import { AdminLibros } from './admin/AdminLibros.jsx';
import { RegistrarVenta } from './admin/RegistrarVenta.jsx';
import { HistorialVentas } from './admin/HistorialVentas.jsx';

const PESTANAS = [
  ['libros', 'Libros'],
  ['venta', 'Registrar venta'],
  ['historial', 'Historial de ventas'],
];

function IngresoLlave() {
  const { iniciar } = useSesionAdmin();
  const [llave, setLlave] = useState('');

  return (
    <form
      className="panel ingreso"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (llave.trim()) iniciar(llave.trim());
      }}
    >
      <h2>Ingresar como administrador</h2>
      <p className="texto-tenue">
        La llave se guarda solo en esta pestaña del navegador y se envía únicamente en las operaciones de
        administración.
      </p>
      <label className="campo">
        <span>Llave de administración</span>
        <input type="password" autoComplete="current-password" value={llave} onChange={(e) => setLlave(e.target.value)} />
      </label>
      <button type="submit" className="boton" disabled={!llave.trim()}>
        Ingresar
      </button>
    </form>
  );
}

export function Administracion() {
  const { activa, cerrar } = useSesionAdmin();
  const [pestana, setPestana] = useState('libros');

  if (!activa) {
    return (
      <section>
        <div className="titulo-seccion">
          <h1>Administración</h1>
        </div>
        <IngresoLlave />
      </section>
    );
  }

  return (
    <section>
      <div className="titulo-seccion">
        <h1>Administración</h1>
        <button type="button" className="boton boton-secundario" onClick={cerrar}>
          Cerrar sesión
        </button>
      </div>

      <div className="pestanas" role="tablist">
        {PESTANAS.map(([clave, texto]) => (
          <button
            key={clave}
            type="button"
            role="tab"
            aria-selected={pestana === clave}
            className={pestana === clave ? 'pestana activa' : 'pestana'}
            onClick={() => setPestana(clave)}
          >
            {texto}
          </button>
        ))}
      </div>

      {pestana === 'libros' && <AdminLibros />}
      {pestana === 'venta' && <RegistrarVenta />}
      {pestana === 'historial' && <HistorialVentas />}
    </section>
  );
}
