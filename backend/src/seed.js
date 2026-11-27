// Reinicia la base de datos con datos de prueba ficticios - Autor: Julián Emiro González Pérez
import 'dotenv/config';
import fs from 'node:fs';
import { crearBaseDeDatos, sembrarDatos } from './db.js';

const ruta = process.env.DB_PATH || 'fitcontrol.db';
for (const f of [ruta, `${ruta}-wal`, `${ruta}-shm`]) if (fs.existsSync(f)) fs.rmSync(f);
const db = crearBaseDeDatos(ruta);
sembrarDatos(db);
console.log(`Base de datos reiniciada en ${ruta} con datos de prueba.`);
