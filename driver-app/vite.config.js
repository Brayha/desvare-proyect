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
    host: '0.0.0.0', // Permite acceso desde red local
    port: 5175,
  },
})
