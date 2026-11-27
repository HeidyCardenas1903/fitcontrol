// Pruebas del modo demostración (API simulada) - Autora: Heidy Viviana Cardenas Soler
import { beforeEach, describe, expect, test } from 'vitest';
import { adaptadorDemo, reiniciarDemo, estadoMembresia } from '../services/demoApi.js';

const pedir = (method, url, { data, token, params } = {}) =>
  adaptadorDemo({
    method, url, params,
    data: data ? JSON.stringify(data) : undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

const login = async (correo, clave) => (await pedir('post', '/auth/login', { data: { correo, clave } })).data.token;

describe('API simulada del modo demostración', () => {
  beforeEach(() => reiniciarDemo());

  test('aplica la misma regla de vencimiento que el back-end', () => {
    expect(estadoMembresia('2026-12-06', '2026-12-01').estado).toBe('por_vencer');
  });

  test('rechaza credenciales incorrectas con 401', async () => {
    await expect(pedir('post', '/auth/login', { data: { correo: 'admin@fitcontrol.test', clave: 'mala' } }))
      .rejects.toMatchObject({ response: { status: 401 } });
  });

  test('un afiliado no puede listar a todos los afiliados (403)', async () => {
    const token = await login('laura@fitcontrol.test', 'Afiliado123*');
    await expect(pedir('get', '/afiliados', { token })).rejects.toMatchObject({ response: { status: 403 } });
  });

  test('lista las alertas de membresías por vencer y vencidas', async () => {
    const admin = await login('admin@fitcontrol.test', 'Admin123*');
    const { data } = await pedir('get', '/membresias/alertas', { token: admin });
    expect(data.map((a) => a.estado).sort()).toEqual(['por_vencer', 'vencida']);
  });

  test('controla el cupo de las clases (409 cuando está llena)', async () => {
    const admin = await login('admin@fitcontrol.test', 'Admin123*');
    await pedir('post', '/membresias', { token: admin, data: { afiliado_id: 3, plan_id: 1 } });
    await pedir('post', '/clases/2/reservas', { token: admin, data: { afiliado_id: 1 } });
    await pedir('post', '/clases/2/reservas', { token: admin, data: { afiliado_id: 2 } });
    await expect(pedir('post', '/clases/2/reservas', { token: admin, data: { afiliado_id: 3 } }))
      .rejects.toMatchObject({ response: { status: 409 } });
  });
});
