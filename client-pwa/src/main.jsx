import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'

// Inicializar Sentry para captura de errores en producción
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Estilos globales (PRIMERO)
import './styles/global.css'

// Estilos locales
import './index.css'
import App from './App.jsx'

// Registrar Service Worker para PWA y notificaciones
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Registrar el Service Worker de Firebase para notificaciones
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js', { scope: '/' })
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Error registrando Service Worker:', error);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
