import { NavLink, Outlet } from 'react-router-dom';
import { useSesionAdmin } from '../hooks/useSesionAdmin.jsx';

const enlaces = [
  { a: '/', texto: 'Catálogo', fin: true },
  { a: '/mas-vendidos', texto: 'Más vendidos' },
  { a: '/administracion', texto: 'Administración' },
];

export function Layout() {
  const { activa } = useSesionAdmin();

  return (
    <div className="aplicacion">
      <header className="encabezado">
        <div className="contenedor encabezado-interior">
          <NavLink to="/" className="marca">
            <img src="/favicon.svg" alt="" width="28" height="28" />
            Librería AYD
          </NavLink>
          <nav className="navegacion" aria-label="Principal">
            {enlaces.map(({ a, texto, fin }) => (
              <NavLink key={a} to={a} end={fin} className={({ isActive }) => (isActive ? 'activo' : undefined)}>
                {texto}
                {a === '/administracion' && activa && <span className="punto-sesion" title="Sesión activa" />}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="contenedor contenido">
        <Outlet />
      </main>
      <footer className="pie">
        <div className="contenedor">Librería AYD · Grupo 4 · Análisis y Diseño 2</div>
      </footer>
    </div>
  );
}
