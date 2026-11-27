// Clases grupales y reservas con control de cupo - Autor: Julián Emiro González Pérez
import { Router } from 'express';
import { envolver, ErrorApi } from '../middleware/errores.js';
import { validar, idValido } from '../middleware/validar.js';
import { soloRol } from '../middleware/auth.js';
import { estadoMembresia } from '../reglas.js';

const SQL_CLASES = `
  SELECT c.*, COUNT(r.id) AS reservados, c.cupo - COUNT(r.id) AS disponibles
  FROM clases c LEFT JOIN reservas r ON r.clase_id = c.id`;

export default function rutasClases(db) {
  const r = Router();

  const afiliadoDelUsuario = (req) => {
    const a = db.prepare('SELECT id FROM afiliados WHERE usuario_id = ?').get(req.usuario.id);
    if (!a) throw new ErrorApi(403, 'Su usuario no está vinculado a un afiliado.');
    return a.id;
  };

  /**
   * @openapi
   * /api/clases:
   *   get:
   *     tags: [Clases y reservas]
   *     summary: Lista las clases próximas con cupos disponibles
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Lista de clases; si es afiliado incluye si ya reservó }
   */
  r.get('/', envolver((req, res) => {
    const clases = db.prepare(`${SQL_CLASES} WHERE c.fecha_hora >= datetime('now', '-1 day')
                               GROUP BY c.id ORDER BY c.fecha_hora`).all();
    if (req.usuario.rol === 'afiliado') {
      const a = db.prepare('SELECT id FROM afiliados WHERE usuario_id = ?').get(req.usuario.id);
      const mias = new Set(db.prepare('SELECT clase_id FROM reservas WHERE afiliado_id = ?').all(a?.id).map((x) => x.clase_id));
      clases.forEach((c) => { c.reservada = mias.has(c.id); });
    }
    res.json(clases);
  }));

  /**
   * @openapi
   * /api/clases:
   *   post:
   *     tags: [Clases y reservas]
   *     summary: Crea una clase grupal
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [nombre, instructor, fecha_hora, cupo]
   *             properties:
   *               nombre: { type: string, example: Yoga }
   *               instructor: { type: string, example: Instructor C }
   *               fecha_hora: { type: string, example: '2026-12-01T07:00' }
   *               cupo: { type: integer, example: 15 }
   *     responses:
   *       201: { description: Clase creada }
   *       400: { description: Datos inválidos }
   */
  r.post('/', soloRol('admin'), validar({
    nombre: { requerido: true, tipo: 'texto', min: 3, max: 40 },
    instructor: { requerido: true, tipo: 'texto', min: 3, max: 60 },
    fecha_hora: { requerido: true, tipo: 'fecha' },
    cupo: { requerido: true, tipo: 'entero', min: 1 },
  }), envolver((req, res) => {
    const { nombre, instructor, fecha_hora, cupo } = req.body;
    const info = db.prepare('INSERT INTO clases (nombre, instructor, fecha_hora, cupo) VALUES (?, ?, ?, ?)')
      .run(nombre.trim(), instructor.trim(), fecha_hora, Number(cupo));
    res.status(201).json(db.prepare(`${SQL_CLASES} WHERE c.id = ? GROUP BY c.id`).get(info.lastInsertRowid));
  }));

  /**
   * @openapi
   * /api/clases/{id}/reservas:
   *   post:
   *     tags: [Clases y reservas]
   *     summary: Reserva un cupo en la clase
   *     description: Exige membresía no vencida, impide superar el cupo y reservar dos veces la misma clase.
   *     security: [{ bearerAuth: [] }]
   *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
   *     responses:
   *       201: { description: Reserva creada }
   *       409: { description: Sin cupo o reserva duplicada }
   *       422: { description: Membresía vencida }
   */
  r.post('/:id/reservas', idValido, envolver((req, res) => {
    // El administrador puede reservar para cualquier afiliado (afiliado_id en el cuerpo)
    const afiliadoId = req.usuario.rol === 'admin' ? Number(req.body?.afiliado_id) : afiliadoDelUsuario(req);
    if (!Number.isInteger(afiliadoId) || afiliadoId <= 0) throw new ErrorApi(400, 'Debe indicar afiliado_id.');

    // Transacción: la verificación de cupo y la inserción ocurren juntas (evita sobrecupo)
    const reservar = db.transaction(() => {
      const clase = db.prepare(`${SQL_CLASES} WHERE c.id = ? GROUP BY c.id`).get(req.params.id);
      if (!clase) throw new ErrorApi(404, 'La clase no existe.');
      const { fin } = db.prepare('SELECT MAX(fecha_fin) AS fin FROM membresias WHERE afiliado_id = ?').get(afiliadoId);
      const { estado } = estadoMembresia(fin);
      if (estado === 'vencida' || estado === 'sin_membresia') {
        throw new ErrorApi(422, 'La membresía está vencida. Debe renovarla para reservar.');
      }
      if (clase.disponibles <= 0) throw new ErrorApi(409, 'La clase no tiene cupos disponibles.');
      const ya = db.prepare('SELECT id FROM reservas WHERE clase_id = ? AND afiliado_id = ?').get(clase.id, afiliadoId);
      if (ya) throw new ErrorApi(409, 'Ya tiene una reserva en esta clase.');
      const info = db.prepare('INSERT INTO reservas (clase_id, afiliado_id) VALUES (?, ?)').run(clase.id, afiliadoId);
      return { id: info.lastInsertRowid, clase_id: clase.id, afiliado_id: afiliadoId, disponibles: clase.disponibles - 1 };
    });
    res.status(201).json(reservar());
  }));

  /**
   * @openapi
   * /api/clases/{id}/reservas:
   *   delete:
   *     tags: [Clases y reservas]
   *     summary: Cancela la reserva del afiliado autenticado en la clase
   *     security: [{ bearerAuth: [] }]
   *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
   *     responses:
   *       204: { description: Reserva cancelada }
   *       404: { description: No tenía reserva }
   */
  r.delete('/:id/reservas', idValido, envolver((req, res) => {
    const afiliadoId = req.usuario.rol === 'admin' ? Number(req.query.afiliado_id) : afiliadoDelUsuario(req);
    const info = db.prepare('DELETE FROM reservas WHERE clase_id = ? AND afiliado_id = ?').run(req.params.id, afiliadoId);
    if (!info.changes) throw new ErrorApi(404, 'No existe una reserva para cancelar.');
    res.status(204).end();
  }));

  return r;
}
