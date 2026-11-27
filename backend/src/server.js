// Punto de entrada del servidor - Autor: Julián Emiro González Pérez
import 'dotenv/config';
import { crearBaseDeDatos, sembrarDatos } from './db.js';
import { crearApp } from './app.js';

const db = crearBaseDeDatos();
sembrarDatos(db);

const PUERTO = Number(process.env.PORT) || 4000;
crearApp(db).listen(PUERTO, () => {
  console.log(`FitControl API escuchando en http://localhost:${PUERTO}`);
  console.log(`Documentación Swagger: http://localhost:${PUERTO}/api/docs`);
});
