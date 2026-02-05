import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    fs: {
      allow: ['..'] // Permitir acceso a carpeta shared
    }
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '/shared': path.resolve(__dirname, '../shared') // Para servir archivos estáticos como fuentes
    }
  }
});

