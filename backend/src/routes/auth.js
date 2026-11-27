// Rutas de autenticación - Autor: Julián Emiro González Pérez
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { envolver, ErrorApi } from '../middleware/errores.js';
import { validar } from '../middleware/validar.js';
import { autenticar, firmarToken } from '../middleware/auth.js';

export default function rutasAuth(db) {
  const r = Router();

  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     tags: [Autenticación]
   *     summary: Inicia sesión y devuelve un token JWT
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [correo, clave]
   *             properties:
   *               correo: { type: string, example: admin@fitcontrol.test }
   *               clave: { type: string, example: Admin123* }
   *     responses:
   *       200: { description: Sesión iniciada }
   *       401: { description: Credenciales incorrectas }
   */
  r.post('/login', validar({ correo: { requerido: true, tipo: 'correo' }, clave: { requerido: true, tipo: 'texto' } }),
    envolver((req, res) => {
      const { correo, clave } = req.body;
      const u = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo.trim().toLowerCase());
      if (!u || !bcrypt.compareSync(clave, u.clave_hash)) throw new ErrorApi(401, 'Correo o contraseña incorrectos.');
      const afiliado = db.prepare('SELECT id FROM afiliados WHERE usuario_id = ?').get(u.id);
      res.json({
        token: firmarToken(u),
        usuario: { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, afiliado_id: afiliado?.id ?? null },
      });
    }));

  /**
   * @openapi
   * /api/auth/perfil:
   *   get:
   *     tags: [Autenticación]
   *     summary: Datos del usuario autenticado
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Perfil del usuario }
   *       401: { description: Sin sesión }
   */
  r.get('/perfil', autenticar, envolver((req, res) => {
    const u = db.prepare('SELECT id, nombre, correo, rol FROM usuarios WHERE id = ?').get(req.usuario.id);
    if (!u) throw new ErrorApi(404, 'Usuario no encontrado.');
    const afiliado = db.prepare('SELECT id FROM afiliados WHERE usuario_id = ?').get(u.id);
    res.json({ ...u, afiliado_id: afiliado?.id ?? null });
  }));

  return r;
}
