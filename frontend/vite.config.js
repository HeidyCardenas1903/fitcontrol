// Configuración de Vite - Autora: Heidy Viviana Cardenas Soler
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Ruta base para publicar en GitHub Pages: https://<usuario>.github.io/fitcontrol/
  base: process.env.GITHUB_PAGES ? '/fitcontrol/' : '/',
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.js',
  },
});
