// Reglas del negocio de FitControl - Autor: Julián Emiro González Pérez
export const DIAS_AVISO = 7;

export function hoyISO(base = new Date()) {
  return base.toISOString().slice(0, 10);
}

export function sumarDias(fechaISO, dias) {
  const d = new Date(`${fechaISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diasEntre(desdeISO, hastaISO) {
  const ms = new Date(`${hastaISO}T00:00:00Z`) - new Date(`${desdeISO}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

// Estado de una membresía según su fecha de vencimiento
export function estadoMembresia(fechaFin, hoy = hoyISO()) {
  if (!fechaFin) return { estado: 'sin_membresia', dias_restantes: null };
  const dias = diasEntre(hoy, fechaFin);
  if (dias < 0) return { estado: 'vencida', dias_restantes: dias };
  if (dias <= DIAS_AVISO) return { estado: 'por_vencer', dias_restantes: dias };
  return { estado: 'vigente', dias_restantes: dias };
}

// Si el afiliado paga antes de vencer, la nueva membresía empieza cuando termina la actual
export function calcularPeriodo(fechaFinActual, duracionDias, hoy = hoyISO()) {
  const inicio = fechaFinActual && fechaFinActual >= hoy ? sumarDias(fechaFinActual, 1) : hoy;
  return { fecha_inicio: inicio, fecha_fin: sumarDias(inicio, duracionDias - 1) };
}
