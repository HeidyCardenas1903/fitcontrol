// Estado global de la sesión con Context API + useReducer
// Autora: Heidy Viviana Cardenas Soler
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { CLAVE_SESION, servicios } from '../services/api.js';

const AuthContext = createContext(null);

function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null');
  } catch {
    return null;
  }
}

// Función reductora: recibe el estado actual y una acción, y devuelve el nuevo estado
export function authReducer(estado, accion) {
  switch (accion.type) {
    case 'INICIO':
      return { ...estado, cargando: true, error: null };
    case 'EXITO':
      return { usuario: accion.payload.usuario, token: accion.payload.token, cargando: false, error: null };
    case 'ERROR':
      return { ...estado, cargando: false, error: accion.payload };
    case 'SALIR':
      return { usuario: null, token: null, cargando: false, error: null };
    default:
      return estado;
  }
}

export function AuthProvider({ children }) {
  const inicial = leerSesion();
  const [estado, dispatch] = useReducer(authReducer, {
    usuario: inicial?.usuario ?? null,
    token: inicial?.token ?? null,
    cargando: false,
    error: null,
  });

  const iniciarSesion = useCallback(async (correo, clave) => {
    dispatch({ type: 'INICIO' });
    try {
      const datos = await servicios.login({ correo, clave });
      localStorage.setItem(CLAVE_SESION, JSON.stringify(datos));
      dispatch({ type: 'EXITO', payload: datos });
      return true;
    } catch (e) {
      dispatch({ type: 'ERROR', payload: e.response?.data?.error || 'No fue posible conectar con el servidor.' });
      return false;
    }
  }, []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(CLAVE_SESION);
    dispatch({ type: 'SALIR' });
  }, []);

  // useEffect: escucha el evento que emite Axios cuando el token expira
  useEffect(() => {
    window.addEventListener('sesion-expirada', cerrarSesion);
    return () => window.removeEventListener('sesion-expirada', cerrarSesion);
  }, [cerrarSesion]);

  const valor = useMemo(
    () => ({ ...estado, esAdmin: estado.usuario?.rol === 'admin', iniciarSesion, cerrarSesion }),
    [estado, iniciarSesion, cerrarSesion]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// Hook personalizado que consume el contexto con useContext
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
