// Documentación de la API REST con Swagger (OpenAPI 3) - Autor: Julián Emiro González Pérez
import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const carpeta = path.dirname(fileURLToPath(import.meta.url));

export const especificacion = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'FitControl API',
      version: '1.0.0',
      description: 'API REST del MVP FitControl para el Gimnasio Vital Fit (datos ficticios).',
    },
    servers: [{ url: '/' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: {
        Afiliado: {
          type: 'object',
          required: ['nombre', 'documento', 'correo'],
          properties: {
            nombre: { type: 'string', example: 'Pedro Pérez' },
            documento: { type: 'string', example: '1000000009' },
            correo: { type: 'string', example: 'pedro@fitcontrol.test' },
            telefono: { type: 'string', example: '3000000009' },
          },
        },
      },
    },
  },
  apis: [path.join(carpeta, 'routes', '*.js')],
});
