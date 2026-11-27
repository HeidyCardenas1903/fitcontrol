// Validación de datos de entrada - Autor: Julián Emiro González Pérez
// Las reglas del negocio se validan SIEMPRE en el back-end, aunque el front-end también valide.
import { ErrorApi } from './errores.js';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// reglas: { campo: { requerido, tipo: 'texto'|'entero'|'correo'|'fecha', min, max } }
export function validar(reglas, { parcial = false } = {}) {
  return (req, res, next) => {
    const errores = {};
    const datos = req.body || {};
    for (const [campo, r] of Object.entries(reglas)) {
      const v = datos[campo];
      const vacio = v === undefined || v === null || v === '';
      if (vacio) {
        if (r.requerido && !parcial) errores[campo] = 'Es obligatorio.';
        continue;
      }
      if (r.tipo === 'texto' && (typeof v !== 'string' || v.trim().length < (r.min ?? 1))) {
        errores[campo] = `Debe tener al menos ${r.min ?? 1} caracteres.`;
      } else if (r.tipo === 'texto' && r.max && v.length > r.max) {
        errores[campo] = `Debe tener máximo ${r.max} caracteres.`;
      } else if (r.tipo === 'entero' && (!Number.isInteger(Number(v)) || Number(v) < (r.min ?? 0))) {
        errores[campo] = `Debe ser un número entero mayor o igual a ${r.min ?? 0}.`;
      } else if (r.tipo === 'correo' && !CORREO.test(String(v))) {
        errores[campo] = 'No es un correo válido.';
      } else if (r.tipo === 'fecha' && Number.isNaN(Date.parse(v))) {
        errores[campo] = 'No es una fecha válida.';
      }
    }
    if (Object.keys(errores).length) {
      return next(new ErrorApi(400, 'Datos inválidos.', errores));
    }
    next();
  };
}

export function idValido(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return next(new ErrorApi(400, 'El id debe ser un entero positivo.'));
  req.params.id = id;
  next();
}
