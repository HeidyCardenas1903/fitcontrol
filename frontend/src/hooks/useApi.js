// Hook personalizado para cargar datos del back-end - Autora: Heidy Viviana Cardenas Soler
// Usa useState para los datos, la carga y el error, y useEffect para pedir los datos
// cuando el componente se monta o cuando cambian las dependencias.
import { useCallback, useEffect, useState } from 'react';
import { mensajeDeError } from '../services/api.js';

export function useApi(funcion, dependencias = []) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cargar = useCallback(funcion, dependencias);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await cargar());
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [cargar]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    cargar()
      .then((d) => activo && setDatos(d))
      .catch((e) => activo && setError(mensajeDeError(e)))
      .finally(() => activo && setCargando(false));
    // Limpieza: evita actualizar el estado si el componente se desmontó
    return () => {
      activo = false;
    };
  }, [cargar]);

  return { datos, cargando, error, recargar };
}
