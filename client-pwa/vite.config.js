import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
    dedupe: ['react', 'react-dom', '@ionic/react'],
  },
  server: {
    host: '0.0.0.0', // Permite acceso desde red local
    port: 5173,
  },
  assetsInclude: ['**/*.woff', '**/*.woff2'], // Asegurar que Vite procese fuentes
})
