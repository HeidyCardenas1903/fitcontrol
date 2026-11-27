// Página de inicio de sesión - Autora: Heidy Viviana Cardenas Soler
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alerta } from '../components/Comunes.jsx';

export default function Login() {
  const { usuario, iniciarSesion, cargando, error } = useAuth();
  const [form, setForm] = useState({ correo: '', clave: '' });
  const [errorLocal, setErrorLocal] = useState('');
  const navegar = useNavigate();
  const ubicacion = useLocation();

  if (usuario) return <Navigate to="/" replace />;

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    // Validación en el cliente (el servidor vuelve a validar)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) return setErrorLocal('Escriba un correo válido.');
    if (!form.clave) return setErrorLocal('Escriba su contraseña.');
    setErrorLocal('');
    if (await iniciarSesion(form.correo, form.clave)) navegar(ubicacion.state?.desde || '/', { replace: true });
  };

  return (
    <div className="login">
      <section className="login-panel">
        <div className="login-marca">
          <span className="logo logo-grande" aria-hidden="true">FC</span>
          <h1>FitControl</h1>
          <p>Afiliados, membresías y clases del Gimnasio Vital Fit en un solo lugar.</p>
        </div>
        <form onSubmit={enviar} noValidate className="tarjeta">
          <h2>Iniciar sesión</h2>
          <Alerta>{errorLocal || error}</Alerta>
          <label>
            Correo
            <input name="correo" type="email" autoComplete="username" value={form.correo} onChange={cambiar} required />
          </label>
          <label>
            Contraseña
            <input name="clave" type="password" autoComplete="current-password" value={form.clave} onChange={cambiar} required />
          </label>
          <button className="btn btn-primario btn-bloque" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
          <details className="ayuda">
            <summary>Usuarios de prueba</summary>
            <p>Administrador: admin@fitcontrol.test / Admin123*</p>
            <p>Afiliado: laura@fitcontrol.test / Afiliado123*</p>
          </details>
        </form>
      </section>
    </div>
  );
}
