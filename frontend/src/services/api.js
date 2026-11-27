// Cliente HTTP con Axios - Autora: Heidy Viviana Cardenas Soler
// Centraliza la URL del back-end, agrega el token JWT a cada petición
// y convierte los errores del servidor en mensajes claros para el usuario.
import axios from 'axios';
import { adaptadorDemo } from './demoApi.js';

export const CLAVE_SESION = 'fitcontrol_sesion';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Modo demostración (GitHub Pages): las peticiones se responden en el navegador
export const MODO_DEMO = import.meta.env.VITE_DEMO === 'true';
if (MODO_DEMO) api.defaults.adapter = adaptadorDemo;

// Interceptor de petición: adjunta el token guardado
api.interceptors.request.use((config) => {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null');
    if (sesion?.token) config.headers.Authorization = `Bearer ${sesion.token}`;
  } catch {
    /* sesión corrupta: se ignora */
  }
  return config;
});

// Interceptor de respuesta: si el token expiró, se avisa a la aplicación
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      window.dispatchEvent(new Event('sesion-expirada'));
    }
    return Promise.reject(error);
  }
);

export function mensajeDeError(error) {
  if (!error.response) return 'No hay conexión con el servidor. Verifique que el back-end esté encendido.';
  const { error: mensaje, detalles } = error.response.data || {};
  if (detalles) return `${mensaje} ${Object.entries(detalles).map(([c, m]) => `${c}: ${m}`).join(' · ')}`;
  return mensaje || 'Ocurrió un error inesperado.';
}

// Funciones por recurso (una por cada endpoint de la API REST)
export const servicios = {
  login: (datos) => api.post('/auth/login', datos).then((r) => r.data),
  afiliados: {
    listar: (params) => api.get('/afiliados', { params }).then((r) => r.data),
    obtener: (id) => api.get(`/afiliados/${id}`).then((r) => r.data),
    crear: (datos) => api.post('/afiliados', datos).then((r) => r.data),
    actualizar: (id, datos) => api.put(`/afiliados/${id}`, datos).then((r) => r.data),
    inactivar: (id) => api.delete(`/afiliados/${id}`),
  },
  planes: { listar: () => api.get('/planes').then((r) => r.data) },
  membresias: {
    pagar: (datos) => api.post('/membresias', datos).then((r) => r.data),
    alertas: () => api.get('/membresias/alertas').then((r) => r.data),
  },
  clases: {
    listar: () => api.get('/clases').then((r) => r.data),
    crear: (datos) => api.post('/clases', datos).then((r) => r.data),
    reservar: (id, afiliado_id) => api.post(`/clases/${id}/reservas`, afiliado_id ? { afiliado_id } : {}).then((r) => r.data),
    cancelar: (id) => api.delete(`/clases/${id}/reservas`),
  },
};
