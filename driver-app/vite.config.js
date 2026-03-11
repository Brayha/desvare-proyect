import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', '@ionic/react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
  },
  optimizeDeps: {
    // Excluir paquetes nativos de Capacitor que no tienen bundle web
    exclude: ['@capacitor-community/background-geolocation'],
  },
  build: {
    rollupOptions: {
      // El paquete solo existe en el entorno nativo (Android APK),
      // Vite no debe intentar bundlearlo
      external: ['@capacitor-community/background-geolocation'],
    },
  },
})
