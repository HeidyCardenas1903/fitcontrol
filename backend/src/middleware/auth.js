// Autenticación (JWT) y autorización por rol - Autor: Julián Emiro González Pérez
import jwt from 'jsonwebtoken';
import { ErrorApi } from './errores.js';

export const SECRETO = () => process.env.JWT_SECRET || 'cambie-este-secreto-en-.env';

export function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    SECRETO(),
    { expiresIn: '8h' }
  );
}

export function autenticar(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const [tipo, token] = cabecera.split(' ');
  if (tipo !== 'Bearer' || !token) return next(new ErrorApi(401, 'Debe iniciar sesión.'));
  try {
    req.usuario = jwt.verify(token, SECRETO());
    next();
  } catch {
    next(new ErrorApi(401, 'La sesión no es válida o expiró.'));
  }
}

// Ocultar un botón en la interfaz no basta: el servidor comprueba el rol.
export const soloRol = (...roles) => (req, res, next) =>
  roles.includes(req.usuario?.rol) ? next() : next(new ErrorApi(403, 'No tiene permisos para esta acción.'));
