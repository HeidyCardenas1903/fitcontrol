// Componentes reutilizables de la interfaz - Autora: Heidy Viviana Cardenas Soler
import { useEffect } from 'react';

const ETIQUETAS = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencida: 'Vencida',
  sin_membresia: 'Sin membresía',
};

export function EstadoBadge({ estado, dias }) {
  let detalle = '';
  if (estado === 'por_vencer') detalle = dias === 0 ? ' (hoy)' : ` (${dias} d)`;
  if (estado === 'vencida') detalle = ` (hace ${Math.abs(dias)} d)`;
  return (
    <span className={`badge badge-${estado}`} title={ETIQUETAS[estado]}>
      {ETIQUETAS[estado] ?? estado}
      {detalle}
    </span>
  );
}

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <p className="estado-carga" role="status">
      <span className="spinner" aria-hidden="true" /> {texto}
    </p>
  );
}

export function Alerta({ tipo = 'error', children, onCerrar }) {
  if (!children) return null;
  return (
    <div className={`alerta alerta-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onCerrar && (
        <button type="button" className="btn-icono" onClick={onCerrar} aria-label="Cerrar mensaje">
          ×
        </button>
      )}
    </div>
  );
}

export function Modal({ titulo, abierto, onCerrar, children }) {
  // Cerrar con la tecla Escape
  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <header className="modal-cabecera">
          <h2>{titulo}</h2>
          <button type="button" className="btn-icono" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export const pesos = (valor) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);

export const fechaCorta = (iso) =>
  new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

export const fechaHora = (iso) =>
  new Date(iso).toLocaleString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
