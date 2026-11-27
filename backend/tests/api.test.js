// Pruebas de la API (unitarias e integración) - Autor: Julián Emiro González Pérez
// Ejecutar con: npm test
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearBaseDeDatos, sembrarDatos } from '../src/db.js';
import { crearApp } from '../src/app.js';
import { estadoMembresia, calcularPeriodo } from '../src/reglas.js';

describe('Reglas del negocio (pruebas unitarias)', () => {
  test('una membresía que vence en 5 días está por vencer', () => {
    assert.equal(estadoMembresia('2026-12-06', '2026-12-01').estado, 'por_vencer');
  });
  test('una membresía vencida ayer está vencida', () => {
    assert.equal(estadoMembresia('2026-11-30', '2026-12-01').estado, 'vencida');
  });
  test('si paga antes de vencer, el nuevo periodo empieza al día siguiente del vencimiento', () => {
    assert.deepEqual(calcularPeriodo('2026-12-10', 30, '2026-12-01'), { fecha_inicio: '2026-12-11', fecha_fin: '2027-01-09' });
  });
  test('si ya venció, el nuevo periodo empieza hoy', () => {
    assert.equal(calcularPeriodo('2026-11-01', 30, '2026-12-01').fecha_inicio, '2026-12-01');
  });
});

describe('API REST (pruebas de integración)', () => {
  let app;
  let admin;
  let afiliado;

  before(async () => {
    const db = crearBaseDeDatos(':memory:');
    sembrarDatos(db);
    app = crearApp(db);
    admin = (await request(app).post('/api/auth/login').send({ correo: 'admin@fitcontrol.test', clave: 'Admin123*' })).body.token;
    afiliado = (await request(app).post('/api/auth/login').send({ correo: 'laura@fitcontrol.test', clave: 'Afiliado123*' })).body.token;
  });

  test('rechaza credenciales incorrectas', async () => {
    const r = await request(app).post('/api/auth/login').send({ correo: 'admin@fitcontrol.test', clave: 'mala' });
    assert.equal(r.status, 401);
  });

  test('exige token para consultar afiliados', async () => {
    assert.equal((await request(app).get('/api/afiliados')).status, 401);
  });

  test('un afiliado no puede listar a todos los afiliados', async () => {
    const r = await request(app).get('/api/afiliados').set('Authorization', `Bearer ${afiliado}`);
    assert.equal(r.status, 403);
  });

  test('crea un afiliado y valida datos', async () => {
    const malo = await request(app).post('/api/afiliados').set('Authorization', `Bearer ${admin}`).send({ nombre: 'P' });
    assert.equal(malo.status, 400);
    assert.ok(malo.body.detalles.correo);
    const ok = await request(app).post('/api/afiliados').set('Authorization', `Bearer ${admin}`)
      .send({ nombre: 'Pedro Pérez', documento: '1000000009', correo: 'pedro@fitcontrol.test' });
    assert.equal(ok.status, 201);
    assert.equal(ok.body.estado, 'sin_membresia');
    const dup = await request(app).post('/api/afiliados').set('Authorization', `Bearer ${admin}`)
      .send({ nombre: 'Otro', documento: '1000000009', correo: 'otro@fitcontrol.test' });
    assert.equal(dup.status, 409);
  });

  test('registra un pago y la membresía queda vigente', async () => {
    const r = await request(app).post('/api/membresias').set('Authorization', `Bearer ${admin}`).send({ afiliado_id: 3, plan_id: 1 });
    assert.equal(r.status, 201);
    assert.equal(r.body.estado, 'vigente');
  });

  test('no deja superar el cupo de una clase', async () => {
    // La clase 2 (Funcional) tiene cupo 2
    const r1 = await request(app).post('/api/clases/2/reservas').set('Authorization', `Bearer ${afiliado}`);
    assert.equal(r1.status, 201);
    const repetida = await request(app).post('/api/clases/2/reservas').set('Authorization', `Bearer ${afiliado}`);
    assert.equal(repetida.status, 409);
    const r2 = await request(app).post('/api/clases/2/reservas').set('Authorization', `Bearer ${admin}`).send({ afiliado_id: 2 });
    assert.equal(r2.status, 201);
    const llena = await request(app).post('/api/clases/2/reservas').set('Authorization', `Bearer ${admin}`).send({ afiliado_id: 3 });
    assert.equal(llena.status, 409);
  });

  test('responde 404 en rutas inexistentes', async () => {
    assert.equal((await request(app).get('/api/no-existe')).status, 404);
  });
});
