// Pruebas del front-end (componentes y estado) - Autora: Heidy Viviana Cardenas Soler
// Ejecutar con: npm test
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EstadoBadge } from '../components/Comunes.jsx';
import { authReducer } from '../context/AuthContext.jsx';

describe('EstadoBadge', () => {
  test('muestra "Por vencer" con los días restantes', () => {
    render(<EstadoBadge estado="por_vencer" dias={3} />);
    expect(screen.getByText(/Por vencer/)).toHaveTextContent('Por vencer (3 d)');
  });
  test('muestra cuántos días lleva vencida', () => {
    render(<EstadoBadge estado="vencida" dias={-4} />);
    expect(screen.getByText(/Vencida/)).toHaveTextContent('hace 4 d');
  });
});

describe('authReducer (useReducer de la sesión)', () => {
  const inicial = { usuario: null, token: null, cargando: false, error: null };
  test('guarda el usuario al iniciar sesión', () => {
    const s = authReducer(inicial, { type: 'EXITO', payload: { usuario: { nombre: 'Laura' }, token: 'abc' } });
    expect(s.usuario.nombre).toBe('Laura');
    expect(s.token).toBe('abc');
  });
  test('limpia la sesión al salir', () => {
    const s = authReducer({ ...inicial, usuario: { nombre: 'X' }, token: 't' }, { type: 'SALIR' });
    expect(s.usuario).toBeNull();
  });
  test('guarda el mensaje de error', () => {
    expect(authReducer(inicial, { type: 'ERROR', payload: 'Mal' }).error).toBe('Mal');
  });
});
