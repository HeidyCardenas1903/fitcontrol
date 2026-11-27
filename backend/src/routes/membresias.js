// Planes, pagos y membresías - Autor: Julián Emiro González Pérez
import { Router } from 'express';
import { envolver, ErrorApi } from '../middleware/errores.js';
import { validar } from '../middleware/validar.js';
import { soloRol } from '../middleware/auth.js';
import { calcularPeriodo, estadoMembresia, hoyISO } from '../reglas.js';

export function rutasPlanes(db) {
  const r = Router();
  /**
   * @openapi
   * /api/planes:
   *   get:
   *     tags: [Membresías]
   *     summary: Lista los planes disponibles
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Lista de planes }
   */
  r.get('/', envolver((req, res) => res.json(db.prepare('SELECT * FROM planes ORDER BY duracion_dias').all())));
  return r;
}

export function rutasMembresias(db) {
  const r = Router();

  /**
   * @openapi
   * /api/membresias:
   *   post:
   *     tags: [Membresías]
   *     summary: Registra un pago y calcula el periodo de la membresía
   *     description: Si el afiliado aún tiene una membresía vigente, el nuevo periodo empieza el día siguiente a su vencimiento.
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [afiliado_id, plan_id]
   *             properties:
   *               afiliado_id: { type: integer, example: 2 }
   *               plan_id: { type: integer, example: 1 }
   *     responses:
   *       201: { description: Pago registrado }
   *       404: { description: Afiliado o plan inexistente }
   *       422: { description: Afiliado inactivo }
   */
  r.post('/', soloRol('admin'),
    validar({ afiliado_id: { requerido: true, tipo: 'entero', min: 1 }, plan_id: { requerido: true, tipo: 'entero', min: 1 } }),
    envolver((req, res) => {
      const afiliado = db.prepare('SELECT * FROM afiliados WHERE id = ?').get(req.body.afiliado_id);
      if (!afiliado) throw new ErrorApi(404, 'El afiliado no existe.');
      if (!afiliado.activo) throw new ErrorApi(422, 'El afiliado está inactivo; actívelo antes de registrar el pago.');
      const plan = db.prepare('SELECT * FROM planes WHERE id = ?').get(req.body.plan_id);
      if (!plan) throw new ErrorApi(404, 'El plan no existe.');

      const { fin } = db.prepare('SELECT MAX(fecha_fin) AS fin FROM membresias WHERE afiliado_id = ?').get(afiliado.id);
      const periodo = calcularPeriodo(fin, plan.duracion_dias);
      const info = db.prepare(`INSERT INTO membresias (afiliado_id, plan_id, fecha_pago, valor_pagado, fecha_inicio, fecha_fin)
                               VALUES (?, ?, ?, ?, ?, ?)`)
        .run(afiliado.id, plan.id, hoyISO(), plan.precio, periodo.fecha_inicio, periodo.fecha_fin);
      res.status(201).json({ id: info.lastInsertRowid, afiliado_id: afiliado.id, plan: plan.nombre,
        valor_pagado: plan.precio, ...periodo, ...estadoMembresia(periodo.fecha_fin) });
    }));

  /**
   * @openapi
   * /api/membresias/alertas:
   *   get:
   *     tags: [Membresías]
   *     summary: Afiliados activos con membresía vencida o por vencer (7 días)
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Lista de alertas }
   */
  r.get('/alertas', soloRol('admin'), envolver((req, res) => {
    const filas = db.prepare(`SELECT a.id, a.nombre, a.telefono, MAX(m.fecha_fin) AS fecha_fin
                              FROM afiliados a LEFT JOIN membresias m ON m.afiliado_id = a.id
                              WHERE a.activo = 1 GROUP BY a.id`).all();
    const alertas = filas.map((f) => ({ ...f, ...estadoMembresia(f.fecha_fin) }))
      .filter((f) => f.estado !== 'vigente')
      .sort((x, y) => (x.dias_restantes ?? -999) - (y.dias_restantes ?? -999));
    res.json(alertas);
  }));

  return r;
}
