import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@ionic/react']
  }
});

