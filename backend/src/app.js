// Configuración de la aplicación Express - Autor: Julián Emiro González Pérez
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { especificacion } from './swagger.js';
import { autenticar } from './middleware/auth.js';
import { manejadorErrores, noEncontrado } from './middleware/errores.js';
import rutasAuth from './routes/auth.js';
import rutasAfiliados from './routes/afiliados.js';
import { rutasPlanes, rutasMembresias } from './routes/membresias.js';
import rutasClases from './routes/clases.js';

export function crearApp(db) {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/salud', (req, res) => res.json({ estado: 'ok', servicio: 'FitControl API' }));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(especificacion));
  app.get('/api/docs.json', (req, res) => res.json(especificacion));

  app.use('/api/auth', rutasAuth(db));
  app.use('/api/afiliados', autenticar, rutasAfiliados(db));
  app.use('/api/planes', autenticar, rutasPlanes(db));
  app.use('/api/membresias', autenticar, rutasMembresias(db));
  app.use('/api/clases', autenticar, rutasClases(db));

  app.use(noEncontrado);
  app.use(manejadorErrores);
  return app;
}
