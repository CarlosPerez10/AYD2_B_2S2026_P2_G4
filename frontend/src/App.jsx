import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { EstadoVacio } from './components/Comunes.jsx';
import { Catalogo } from './pages/Catalogo.jsx';
import { DetalleLibro } from './pages/DetalleLibro.jsx';
import { MasVendidos } from './pages/MasVendidos.jsx';
import { Administracion } from './pages/Administracion.jsx';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Catalogo />} />
        <Route path="libros/:id" element={<DetalleLibro />} />
        <Route path="mas-vendidos" element={<MasVendidos />} />
        <Route path="administracion" element={<Administracion />} />
        <Route path="*" element={<EstadoVacio titulo="Esta página no existe." />} />
      </Route>
    </Routes>
  );
}
