// Modo demostración: API simulada en el navegador - Autora: Heidy Viviana Cardenas Soler
//
// GitHub Pages solo publica archivos estáticos y no puede ejecutar el servidor Node.js.
// Para que la aplicación publicada se pueda probar sin instalar nada, este archivo
// reemplaza el "adaptador" de Axios por uno que responde las mismas rutas y aplica
// las mismas reglas del negocio del back-end (backend/src), guardando los datos en
// el localStorage del navegador. En local, con el back-end encendido, no se usa.

export const CLAVE_DEMO = 'fitcontrol_demo_db';
const DIAS_AVISO = 7;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- utilidades de fechas (mismas reglas que backend/src/reglas.js) ----------
const hoyISO = () => new Date().toISOString().slice(0, 10);
const sumarDias = (iso, dias) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};
const diasEntre = (desde, hasta) => Math.round((new Date(`${hasta}T00:00:00Z`) - new Date(`${desde}T00:00:00Z`)) / 86400000);

export function estadoMembresia(fechaFin, hoy = hoyISO()) {
  if (!fechaFin) return { estado: 'sin_membresia', dias_restantes: null };
  const dias = diasEntre(hoy, fechaFin);
  if (dias < 0) return { estado: 'vencida', dias_restantes: dias };
  if (dias <= DIAS_AVISO) return { estado: 'por_vencer', dias_restantes: dias };
  return { estado: 'vigente', dias_restantes: dias };
}

// ---------- datos de prueba ficticios (iguales a backend/src/db.js) ----------
function datosIniciales() {
  const f = (dias) => sumarDias(hoyISO(), dias);
  return {
    seq: { afiliados: 3, membresias: 3, clases: 3, reservas: 0 },
    usuarios: [
      { id: 1, nombre: 'Administración Vital Fit', correo: 'admin@fitcontrol.test', clave: 'Admin123*', rol: 'admin' },
      { id: 2, nombre: 'Laura Gómez', correo: 'laura@fitcontrol.test', clave: 'Afiliado123*', rol: 'afiliado' },
    ],
    planes: [
      { id: 1, nombre: 'Mensual', duracion_dias: 30, precio: 70000 },
      { id: 2, nombre: 'Trimestral', duracion_dias: 90, precio: 190000 },
      { id: 3, nombre: 'Semestral', duracion_dias: 180, precio: 360000 },
    ],
    afiliados: [
      { id: 1, usuario_id: 2, nombre: 'Laura Gómez', documento: '1000000001', correo: 'laura@fitcontrol.test', telefono: '3000000001', activo: true },
      { id: 2, usuario_id: null, nombre: 'Carlos Ruiz', documento: '1000000002', correo: 'carlos@fitcontrol.test', telefono: '3000000002', activo: true },
      { id: 3, usuario_id: null, nombre: 'Ana Torres', documento: '1000000003', correo: 'ana@fitcontrol.test', telefono: '3000000003', activo: true },
    ],
    membresias: [
      { id: 1, afiliado_id: 1, plan_id: 2, fecha_pago: f(-10), valor_pagado: 190000, fecha_inicio: f(-10), fecha_fin: f(80) },
      { id: 2, afiliado_id: 2, plan_id: 1, fecha_pago: f(-25), valor_pagado: 70000, fecha_inicio: f(-25), fecha_fin: f(5) },
      { id: 3, afiliado_id: 3, plan_id: 1, fecha_pago: f(-40), valor_pagado: 70000, fecha_inicio: f(-40), fecha_fin: f(-10) },
    ],
    clases: [
      { id: 1, nombre: 'Spinning', instructor: 'Instructor A', fecha_hora: `${f(1)}T06:00`, cupo: 12 },
      { id: 2, nombre: 'Funcional', instructor: 'Instructor B', fecha_hora: `${f(1)}T18:00`, cupo: 2 },
      { id: 3, nombre: 'Rumba', instructor: 'Instructor A', fecha_hora: `${f(2)}T19:00`, cupo: 20 },
    ],
    reservas: [],
  };
}

function leerDB() {
  try {
    const db = JSON.parse(localStorage.getItem(CLAVE_DEMO) || 'null');
    if (db?.usuarios) return db;
  } catch {
    /* datos dañados: se reinician */
  }
  const db = datosIniciales();
  guardarDB(db);
  return db;
}

function guardarDB(db) {
  try {
    localStorage.setItem(CLAVE_DEMO, JSON.stringify(db));
  } catch {
    /* sin almacenamiento disponible: los datos viven solo en memoria */
  }
}

export function reiniciarDemo() {
  guardarDB(datosIniciales());
}

// ---------- errores con el mismo formato que el back-end ----------
class ErrorApi extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

function validar(datos, reglas, parcial = false) {
  const errores = {};
  for (const [campo, r] of Object.entries(reglas)) {
    const v = datos[campo];
    if (v === undefined || v === null || v === '') {
      if (r.requerido && !parcial) errores[campo] = 'Es obligatorio.';
      continue;
    }
    if (r.tipo === 'texto' && String(v).trim().length < (r.min ?? 1)) errores[campo] = `Debe tener al menos ${r.min ?? 1} caracteres.`;
    else if (r.tipo === 'entero' && (!Number.isInteger(Number(v)) || Number(v) < (r.min ?? 0))) errores[campo] = `Debe ser un número entero mayor o igual a ${r.min ?? 0}.`;
    else if (r.tipo === 'correo' && !CORREO.test(String(v))) errores[campo] = 'No es un correo válido.';
    else if (r.tipo === 'fecha' && Number.isNaN(Date.parse(v))) errores[campo] = 'No es una fecha válida.';
  }
  if (Object.keys(errores).length) throw new ErrorApi(400, 'Datos inválidos.', errores);
}

// Token de demostración (no es seguro; solo identifica al usuario dentro del navegador)
const crearToken = (u) => btoa(JSON.stringify({ id: u.id, rol: u.rol, demo: true }));
function usuarioDelToken(config, db) {
  const cab = config.headers?.Authorization || config.headers?.authorization || '';
  try {
    const datos = JSON.parse(atob(String(cab).replace('Bearer ', '')));
    const u = db.usuarios.find((x) => x.id === datos.id);
    if (u) return u;
  } catch {
    /* token inválido */
  }
  throw new ErrorApi(401, 'Debe iniciar sesión.');
}
const soloAdmin = (u) => {
  if (u.rol !== 'admin') throw new ErrorApi(403, 'No tiene permisos para esta acción.');
};

// ---------- consultas ----------
const finDe = (db, afiliadoId) =>
  db.membresias.filter((m) => m.afiliado_id === afiliadoId).map((m) => m.fecha_fin).sort().pop() ?? null;
const afiliadoConEstado = (db, a) => ({ ...a, fecha_fin: finDe(db, a.id), ...estadoMembresia(finDe(db, a.id)) });
const claseConCupos = (db, c) => {
  const reservados = db.reservas.filter((r) => r.clase_id === c.id).length;
  return { ...c, reservados, disponibles: c.cupo - reservados };
};

// ---------- rutas (mismas que backend/src/routes) ----------
function atender(metodo, ruta, params, body, config) {
  const db = leerDB();
  const segmentos = ruta.replace(/^\/+|\/+$/g, '').split('/');
  const [recurso, idTexto, sub] = segmentos;
  const id = idTexto !== undefined ? Number(idTexto) : undefined;
  if (['afiliados', 'clases'].includes(recurso) && idTexto !== undefined && (!Number.isInteger(id) || id <= 0)) {
    throw new ErrorApi(400, 'El id debe ser un entero positivo.');
  }

  if (recurso === 'auth' && idTexto === 'login' && metodo === 'post') {
    validar(body, { correo: { requerido: true, tipo: 'correo' }, clave: { requerido: true, tipo: 'texto' } });
    const u = db.usuarios.find((x) => x.correo === body.correo.trim().toLowerCase());
    if (!u || u.clave !== body.clave) throw new ErrorApi(401, 'Correo o contraseña incorrectos.');
    const afiliado = db.afiliados.find((a) => a.usuario_id === u.id);
    return [200, { token: crearToken(u), usuario: { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, afiliado_id: afiliado?.id ?? null } }];
  }

  const usuario = usuarioDelToken(config, db);

  if (recurso === 'auth' && idTexto === 'perfil') {
    const afiliado = db.afiliados.find((a) => a.usuario_id === usuario.id);
    return [200, { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol, afiliado_id: afiliado?.id ?? null }];
  }

  if (recurso === 'planes' && metodo === 'get') return [200, [...db.planes].sort((a, b) => a.duracion_dias - b.duracion_dias)];

  if (recurso === 'afiliados') {
    const reglas = {
      nombre: { requerido: true, tipo: 'texto', min: 3 },
      documento: { requerido: true, tipo: 'texto', min: 5 },
      correo: { requerido: true, tipo: 'correo' },
      telefono: { tipo: 'texto', min: 7 },
    };
    const duplicado = (d, propio) =>
      db.afiliados.some((a) => a.id !== propio && (a.documento === String(d.documento).trim() || a.correo === String(d.correo).trim().toLowerCase()));

    if (metodo === 'get' && id === undefined) {
      soloAdmin(usuario);
      const q = String(params?.buscar || '').trim().toLowerCase();
      let lista = db.afiliados
        .filter((a) => a.nombre.toLowerCase().includes(q) || a.documento.includes(q))
        .map((a) => afiliadoConEstado(db, a))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      if (params?.estado) lista = lista.filter((a) => a.estado === params.estado);
      return [200, lista];
    }
    if (metodo === 'get') {
      if (usuario.rol !== 'admin' && db.afiliados.find((a) => a.usuario_id === usuario.id)?.id !== id) {
        throw new ErrorApi(403, 'Solo puede consultar su propia información.');
      }
      const a = db.afiliados.find((x) => x.id === id);
      if (!a) throw new ErrorApi(404, 'El afiliado no existe.');
      const membresias = db.membresias
        .filter((m) => m.afiliado_id === id)
        .map((m) => ({ ...m, plan: db.planes.find((p) => p.id === m.plan_id)?.nombre }))
        .sort((x, y) => y.fecha_fin.localeCompare(x.fecha_fin));
      return [200, { ...afiliadoConEstado(db, a), membresias }];
    }
    soloAdmin(usuario);
    if (metodo === 'post') {
      validar(body, reglas);
      if (duplicado(body)) throw new ErrorApi(409, 'El registro entra en conflicto con datos existentes (valor duplicado o referencia inválida).');
      const nuevo = {
        id: ++db.seq.afiliados, usuario_id: null, nombre: body.nombre.trim(), documento: body.documento.trim(),
        correo: body.correo.trim().toLowerCase(), telefono: body.telefono?.trim() || null, activo: true,
      };
      db.afiliados.push(nuevo);
      guardarDB(db);
      return [201, afiliadoConEstado(db, nuevo)];
    }
    const a = db.afiliados.find((x) => x.id === id);
    if (!a) throw new ErrorApi(404, 'El afiliado no existe.');
    if (metodo === 'put') {
      validar(body, reglas, true);
      const d = { ...a, ...body };
      if (duplicado(d, id)) throw new ErrorApi(409, 'El registro entra en conflicto con datos existentes (valor duplicado o referencia inválida).');
      Object.assign(a, {
        nombre: String(d.nombre).trim(), documento: String(d.documento).trim(),
        correo: String(d.correo).trim().toLowerCase(), telefono: d.telefono || null, activo: !!d.activo,
      });
      guardarDB(db);
      return [200, afiliadoConEstado(db, a)];
    }
    if (metodo === 'delete') {
      a.activo = false;
      guardarDB(db);
      return [204, ''];
    }
  }

  if (recurso === 'membresias') {
    soloAdmin(usuario);
    if (metodo === 'get' && idTexto === 'alertas') {
      const alertas = db.afiliados
        .filter((a) => a.activo)
        .map((a) => ({ id: a.id, nombre: a.nombre, telefono: a.telefono, fecha_fin: finDe(db, a.id), ...estadoMembresia(finDe(db, a.id)) }))
        .filter((a) => a.estado !== 'vigente')
        .sort((x, y) => (x.dias_restantes ?? -999) - (y.dias_restantes ?? -999));
      return [200, alertas];
    }
    if (metodo === 'post') {
      validar(body, { afiliado_id: { requerido: true, tipo: 'entero', min: 1 }, plan_id: { requerido: true, tipo: 'entero', min: 1 } });
      const a = db.afiliados.find((x) => x.id === Number(body.afiliado_id));
      if (!a) throw new ErrorApi(404, 'El afiliado no existe.');
      if (!a.activo) throw new ErrorApi(422, 'El afiliado está inactivo; actívelo antes de registrar el pago.');
      const plan = db.planes.find((p) => p.id === Number(body.plan_id));
      if (!plan) throw new ErrorApi(404, 'El plan no existe.');
      const fin = finDe(db, a.id);
      const hoy = hoyISO();
      const inicio = fin && fin >= hoy ? sumarDias(fin, 1) : hoy;
      const m = {
        id: ++db.seq.membresias, afiliado_id: a.id, plan_id: plan.id, fecha_pago: hoy,
        valor_pagado: plan.precio, fecha_inicio: inicio, fecha_fin: sumarDias(inicio, plan.duracion_dias - 1),
      };
      db.membresias.push(m);
      guardarDB(db);
      return [201, { id: m.id, afiliado_id: a.id, plan: plan.nombre, valor_pagado: plan.precio, fecha_inicio: m.fecha_inicio, fecha_fin: m.fecha_fin, ...estadoMembresia(m.fecha_fin) }];
    }
  }

  if (recurso === 'clases') {
    if (metodo === 'get' && id === undefined) {
      const limite = sumarDias(hoyISO(), -1);
      const propio = db.afiliados.find((a) => a.usuario_id === usuario.id);
      const lista = db.clases
        .filter((c) => c.fecha_hora.slice(0, 10) >= limite)
        .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
        .map((c) => {
          const x = claseConCupos(db, c);
          if (usuario.rol === 'afiliado') x.reservada = db.reservas.some((r) => r.clase_id === c.id && r.afiliado_id === propio?.id);
          return x;
        });
      return [200, lista];
    }
    if (metodo === 'post' && id === undefined) {
      soloAdmin(usuario);
      validar(body, {
        nombre: { requerido: true, tipo: 'texto', min: 3 }, instructor: { requerido: true, tipo: 'texto', min: 3 },
        fecha_hora: { requerido: true, tipo: 'fecha' }, cupo: { requerido: true, tipo: 'entero', min: 1 },
      });
      const c = { id: ++db.seq.clases, nombre: body.nombre.trim(), instructor: body.instructor.trim(), fecha_hora: body.fecha_hora, cupo: Number(body.cupo) };
      db.clases.push(c);
      guardarDB(db);
      return [201, claseConCupos(db, c)];
    }
    if (sub === 'reservas') {
      const afiliadoId = usuario.rol === 'admin'
        ? Number(metodo === 'post' ? body?.afiliado_id : params?.afiliado_id)
        : db.afiliados.find((a) => a.usuario_id === usuario.id)?.id;
      if (!Number.isInteger(afiliadoId) || afiliadoId <= 0) throw new ErrorApi(400, 'Debe indicar afiliado_id.');
      const clase = db.clases.find((c) => c.id === id);
      if (!clase) throw new ErrorApi(404, 'La clase no existe.');
      if (metodo === 'post') {
        const { estado } = estadoMembresia(finDe(db, afiliadoId));
        if (estado === 'vencida' || estado === 'sin_membresia') throw new ErrorApi(422, 'La membresía está vencida. Debe renovarla para reservar.');
        if (claseConCupos(db, clase).disponibles <= 0) throw new ErrorApi(409, 'La clase no tiene cupos disponibles.');
        if (db.reservas.some((r) => r.clase_id === id && r.afiliado_id === afiliadoId)) throw new ErrorApi(409, 'Ya tiene una reserva en esta clase.');
        const r = { id: ++db.seq.reservas, clase_id: id, afiliado_id: afiliadoId };
        db.reservas.push(r);
        guardarDB(db);
        return [201, { ...r, disponibles: claseConCupos(db, clase).disponibles }];
      }
      if (metodo === 'delete') {
        const antes = db.reservas.length;
        db.reservas = db.reservas.filter((r) => !(r.clase_id === id && r.afiliado_id === afiliadoId));
        if (db.reservas.length === antes) throw new ErrorApi(404, 'No existe una reserva para cancelar.');
        guardarDB(db);
        return [204, ''];
      }
    }
  }

  throw new ErrorApi(404, `Ruta no encontrada: ${metodo.toUpperCase()} /api${ruta}`);
}

// ---------- adaptador de Axios ----------
export function adaptadorDemo(config) {
  return new Promise((resolver, rechazar) => {
    // Pequeña espera para que la interfaz muestre sus estados de carga como con un servidor real
    setTimeout(() => {
      const metodo = (config.method || 'get').toLowerCase();
      let body = config.data;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }
      try {
        const [status, data] = atender(metodo, config.url || '/', config.params || {}, body || {}, config);
        resolver({ data, status, statusText: String(status), headers: {}, config, request: {} });
      } catch (e) {
        const status = e instanceof ErrorApi ? e.status : 500;
        const data = e instanceof ErrorApi ? { error: e.message, detalles: e.detalles } : { error: 'Error interno del servidor.' };
        const error = new Error(data.error);
        error.isAxiosError = true;
        error.config = config;
        error.response = { status, data, headers: {}, config };
        rechazar(error);
      }
    }, 150);
  });
}
