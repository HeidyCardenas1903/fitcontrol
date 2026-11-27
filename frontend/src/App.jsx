// Rutas y navegación de la aplicación - Autora: Heidy Viviana Cardenas Soler
// Se usa HashRouter para que las rutas funcionen también al publicar en GitHub Pages.
import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { Layout, RutaProtegida } from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Inicio from './pages/Inicio.jsx';
import Afiliados from './pages/Afiliados.jsx';
import Membresias from './pages/Membresias.jsx';
import Clases from './pages/Clases.jsx';

function NoEncontrado() {
  return (
    <section className="tarjeta">
      <h1>Página no encontrada</h1>
      <p>La dirección que busca no existe.</p>
      <Link to="/" className="btn btn-primario">Volver al inicio</Link>
    </section>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RutaProtegida />}>
            <Route element={<Layout />}>
              <Route index element={<Inicio />} />
              <Route path="clases" element={<Clases />} />
              <Route element={<RutaProtegida roles={['admin']} />}>
                <Route path="afiliados" element={<Afiliados />} />
                <Route path="membresias" element={<Membresias />} />
              </Route>
              <Route path="*" element={<NoEncontrado />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
