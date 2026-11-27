// CRUD de afiliados - Autor: Julián Emiro González Pérez
import { Router } from 'express';
import { envolver, ErrorApi } from '../middleware/errores.js';
import { validar, idValido } from '../middleware/validar.js';
import { soloRol } from '../middleware/auth.js';
import { estadoMembresia } from '../reglas.js';

const REGLAS = {
  nombre: { requerido: true, tipo: 'texto', min: 3, max: 80 },
  documento: { requerido: true, tipo: 'texto', min: 5, max: 20 },
  correo: { requerido: true, tipo: 'correo' },
  telefono: { tipo: 'texto', min: 7, max: 15 },
};

// Consulta cada afiliado con la fecha de fin de su última membresía
const SQL_BASE = `
  SELECT a.*, (SELECT MAX(m.fecha_fin) FROM membresias m WHERE m.afiliado_id = a.id) AS fecha_fin
  FROM afiliados a`;

const conEstado = (a) => (a ? { ...a, activo: !!a.activo, ...estadoMembresia(a.fecha_fin) } : a);

export default function rutasAfiliados(db) {
  const r = Router();

  /**
   * @openapi
   * /api/afiliados:
   *   get:
   *     tags: [Afiliados]
   *     summary: Lista los afiliados con el estado de su membresía
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - { in: query, name: buscar, schema: { type: string }, description: Filtra por nombre o documento }
   *       - { in: query, name: estado, schema: { type: string, enum: [vigente, por_vencer, vencida, sin_membresia] } }
   *     responses:
   *       200: { description: Lista de afiliados }
   */
  r.get('/', soloRol('admin'), envolver((req, res) => {
    const buscar = `%${(req.query.buscar || '').trim()}%`;
    let lista = db.prepare(`${SQL_BASE} WHERE a.nombre LIKE ? OR a.documento LIKE ? ORDER BY a.nombre`)
      .all(buscar, buscar).map(conEstado);
    if (req.query.estado) lista = lista.filter((a) => a.estado === req.query.estado);
    res.json(lista);
  }));

  /**
   * @openapi
   * /api/afiliados/{id}:
   *   get:
   *     tags: [Afiliados]
   *     summary: Consulta un afiliado y su historial de membresías
   *     security: [{ bearerAuth: [] }]
   *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
   *     responses:
   *       200: { description: Afiliado encontrado }
   *       404: { description: No existe }
   */
  r.get('/:id', idValido, envolver((req, res) => {
    if (req.usuario.rol !== 'admin') {
      const propio = db.prepare('SELECT id FROM afiliados WHERE usuario_id = ?').get(req.usuario.id);
      if (propio?.id !== req.params.id) throw new ErrorApi(403, 'Solo puede consultar su propia información.');
    }
    const a = conEstado(db.prepare(`${SQL_BASE} WHERE a.id = ?`).get(req.params.id));
    if (!a) throw new ErrorApi(404, 'El afiliado no existe.');
    a.membresias = db.prepare(`SELECT m.*, p.nombre AS plan FROM membresias m JOIN planes p ON p.id = m.plan_id
                               WHERE m.afiliado_id = ? ORDER BY m.fecha_fin DESC`).all(a.id);
    res.json(a);
  }));

  /**
   * @openapi
   * /api/afiliados:
   *   post:
   *     tags: [Afiliados]
   *     summary: Registra un afiliado
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/Afiliado' }
   *     responses:
   *       201: { description: Creado }
   *       400: { description: Datos inválidos }
   *       409: { description: Documento o correo duplicado }
   */
  r.post('/', soloRol('admin'), validar(REGLAS), envolver((req, res) => {
    const { nombre, documento, correo, telefono } = req.body;
    const info = db.prepare('INSERT INTO afiliados (nombre, documento, correo, telefono) VALUES (?, ?, ?, ?)')
      .run(nombre.trim(), documento.trim(), correo.trim().toLowerCase(), telefono?.trim() || null);
    res.status(201).json(conEstado(db.prepare(`${SQL_BASE} WHERE a.id = ?`).get(info.lastInsertRowid)));
  }));

  /**
   * @openapi
   * /api/afiliados/{id}:
   *   put:
   *     tags: [Afiliados]
   *     summary: Actualiza los datos de un afiliado
   *     security: [{ bearerAuth: [] }]
   *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/Afiliado' }
   *     responses:
   *       200: { description: Actualizado }
   *       404: { description: No existe }
   */
  r.put('/:id', soloRol('admin'), idValido, validar(REGLAS, { parcial: true }), envolver((req, res) => {
    const actual = db.prepare('SELECT * FROM afiliados WHERE id = ?').get(req.params.id);
    if (!actual) throw new ErrorApi(404, 'El afiliado no existe.');
    const d = { ...actual, ...req.body };
    db.prepare('UPDATE afiliados SET nombre = ?, documento = ?, correo = ?, telefono = ?, activo = ? WHERE id = ?')
      .run(String(d.nombre).trim(), String(d.documento).trim(), String(d.correo).trim().toLowerCase(),
        d.telefono || null, d.activo ? 1 : 0, req.params.id);
    res.json(conEstado(db.prepare(`${SQL_BASE} WHERE a.id = ?`).get(req.params.id)));
  }));

  /**
   * @openapi
   * /api/afiliados/{id}:
   *   delete:
   *     tags: [Afiliados]
   *     summary: Inactiva un afiliado (no se borra para conservar el historial)
   *     security: [{ bearerAuth: [] }]
   *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
   *     responses:
   *       204: { description: Inactivado }
   *       404: { description: No existe }
   */
  r.delete('/:id', soloRol('admin'), idValido, envolver((req, res) => {
    const info = db.prepare('UPDATE afiliados SET activo = 0 WHERE id = ?').run(req.params.id);
    if (!info.changes) throw new ErrorApi(404, 'El afiliado no existe.');
    res.status(204).end();
  }));

  return r;
}
