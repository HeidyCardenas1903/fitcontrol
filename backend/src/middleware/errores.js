// Gestión centralizada de errores - Autor: Julián Emiro González Pérez

// Error controlado de la aplicación, con código HTTP y mensaje para el cliente
export class ErrorApi extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

// Envuelve controladores para capturar cualquier excepción y pasarla al manejador
export const envolver = (fn) => (req, res, next) => {
  try {
    const r = fn(req, res, next);
    if (r && typeof r.catch === 'function') r.catch(next);
  } catch (e) {
    next(e);
  }
};

export function noEncontrado(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(err, req, res, next) {
  if (err instanceof ErrorApi) {
    return res.status(err.status).json({ error: err.message, detalles: err.detalles });
  }
  // Violaciones de restricciones de la base de datos (correo/documento duplicado, etc.)
  if (err.code && String(err.code).startsWith('SQLITE_CONSTRAINT')) {
    return res.status(409).json({ error: 'El registro entra en conflicto con datos existentes (valor duplicado o referencia inválida).' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
  }
  console.error('[ERROR]', err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
}
