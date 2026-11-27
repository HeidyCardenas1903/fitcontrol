// Capa de acceso a datos (persistencia) - FitControl
// Autor: Julián Emiro González Pérez
// Se usa SQLite (better-sqlite3): base de datos relacional en un solo archivo,
// sin instalar un servidor. Las consultas usan parámetros (?) para evitar inyección SQL.
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export function crearBaseDeDatos(ruta = process.env.DB_PATH || 'fitcontrol.db') {
  const db = new Database(ruta);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      clave_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK (rol IN ('admin', 'afiliado'))
    );

    CREATE TABLE IF NOT EXISTS afiliados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL,
      nombre TEXT NOT NULL,
      documento TEXT NOT NULL UNIQUE,
      correo TEXT NOT NULL UNIQUE,
      telefono TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      creado_en TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS planes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      duracion_dias INTEGER NOT NULL CHECK (duracion_dias > 0),
      precio INTEGER NOT NULL CHECK (precio >= 0)
    );

    CREATE TABLE IF NOT EXISTS membresias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      afiliado_id INTEGER NOT NULL REFERENCES afiliados(id) ON DELETE CASCADE,
      plan_id INTEGER NOT NULL REFERENCES planes(id),
      fecha_pago TEXT NOT NULL,
      valor_pagado INTEGER NOT NULL,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      instructor TEXT NOT NULL,
      fecha_hora TEXT NOT NULL,
      cupo INTEGER NOT NULL CHECK (cupo > 0)
    );

    CREATE TABLE IF NOT EXISTS reservas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clase_id INTEGER NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
      afiliado_id INTEGER NOT NULL REFERENCES afiliados(id) ON DELETE CASCADE,
      creada_en TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (clase_id, afiliado_id)
    );
  `);
  return db;
}

// Datos de prueba ficticios (ningún dato real, en cumplimiento de la Ley 1581 de 2012)
export function sembrarDatos(db) {
  const hay = db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n;
  if (hay > 0) return;

  const hoy = new Date();
  const fecha = (dias) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  };
  const clave = (texto) => bcrypt.hashSync(texto, 10);

  const insertarTodo = db.transaction(() => {
    db.prepare('INSERT INTO usuarios (nombre, correo, clave_hash, rol) VALUES (?, ?, ?, ?)')
      .run('Administración Vital Fit', 'admin@fitcontrol.test', clave('Admin123*'), 'admin');
    const u = db.prepare('INSERT INTO usuarios (nombre, correo, clave_hash, rol) VALUES (?, ?, ?, ?)')
      .run('Laura Gómez', 'laura@fitcontrol.test', clave('Afiliado123*'), 'afiliado');

    const planes = [['Mensual', 30, 70000], ['Trimestral', 90, 190000], ['Semestral', 180, 360000]];
    planes.forEach((p) => db.prepare('INSERT INTO planes (nombre, duracion_dias, precio) VALUES (?, ?, ?)').run(...p));

    const afiliados = [
      [u.lastInsertRowid, 'Laura Gómez', '1000000001', 'laura@fitcontrol.test', '3000000001'],
      [null, 'Carlos Ruiz', '1000000002', 'carlos@fitcontrol.test', '3000000002'],
      [null, 'Ana Torres', '1000000003', 'ana@fitcontrol.test', '3000000003'],
    ];
    afiliados.forEach((a) => db.prepare(
      'INSERT INTO afiliados (usuario_id, nombre, documento, correo, telefono) VALUES (?, ?, ?, ?, ?)'
    ).run(...a));

    // Laura: vigente; Carlos: por vencer (5 días); Ana: vencida
    const m = db.prepare(`INSERT INTO membresias (afiliado_id, plan_id, fecha_pago, valor_pagado, fecha_inicio, fecha_fin)
                          VALUES (?, ?, ?, ?, ?, ?)`);
    m.run(1, 2, fecha(-10), 190000, fecha(-10), fecha(80));
    m.run(2, 1, fecha(-25), 70000, fecha(-25), fecha(5));
    m.run(3, 1, fecha(-40), 70000, fecha(-40), fecha(-10));

    const c = db.prepare('INSERT INTO clases (nombre, instructor, fecha_hora, cupo) VALUES (?, ?, ?, ?)');
    c.run('Spinning', 'Instructor A', `${fecha(1)}T06:00`, 12);
    c.run('Funcional', 'Instructor B', `${fecha(1)}T18:00`, 2);
    c.run('Rumba', 'Instructor A', `${fecha(2)}T19:00`, 20);
  });
  insertarTodo();
}
