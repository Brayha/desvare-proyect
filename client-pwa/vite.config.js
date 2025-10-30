import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@components': path.resolve(__dirname, '../shared/components'),
      '@layouts': path.resolve(__dirname, '../shared/layouts'),
      '@hooks': path.resolve(__dirname, '../shared/hooks'),
      '@services': path.resolve(__dirname, '../shared/services'),
      '@utils': path.resolve(__dirname, '../shared/utils'),
      '@styles': path.resolve(__dirname, '../shared/styles'),
    },
    dedupe: ['react', 'react-dom', '@ionic/react'],
  },
  server: {
    fs: {
      allow: ['..'], // Permitir acceso a carpeta shared
    },
  },
})
