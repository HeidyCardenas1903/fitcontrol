// Estructura general y navegación - Autora: Heidy Viviana Cardenas Soler
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AvisoDemo } from './Comunes.jsx';

// Ruta protegida: si no hay sesión redirige al login; si el rol no coincide, al inicio
export function RutaProtegida({ roles }) {
  const { usuario } = useAuth();
  const ubicacion = useLocation();
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function Layout() {
  const { usuario, esAdmin, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const salir = () => {
    navegar('/login', { replace: true });
    cerrarSesion();
  };
  const enlaces = esAdmin
    ? [['/', 'Inicio'], ['/afiliados', 'Afiliados'], ['/membresias', 'Pagos'], ['/clases', 'Clases']]
    : [['/', 'Mi membresía'], ['/clases', 'Reservar clases']];

  return (
    <div className="app">
      <header className="barra">
        <div className="marca">
          <span className="logo" aria-hidden="true">FC</span>
          <div>
            <strong>FitControl</strong>
            <small>Gimnasio Vital Fit</small>
          </div>
        </div>
        <nav aria-label="Navegación principal">
          {enlaces.map(([ruta, texto]) => (
            <NavLink key={ruta} to={ruta} end={ruta === '/'} className={({ isActive }) => (isActive ? 'activo' : '')}>
              {texto}
            </NavLink>
          ))}
        </nav>
        <div className="usuario">
          <span title={usuario.correo}>{usuario.nombre}</span>
          <button type="button" className="btn btn-secundario btn-pequeno" onClick={salir}>
            Salir
          </button>
        </div>
      </header>
      <main className="contenido">
        <AvisoDemo />
        <Outlet />
      </main>
      <footer className="pie">FitControl MVP · Datos ficticios con fines académicos · Ibero 2026</footer>
    </div>
  );
}
