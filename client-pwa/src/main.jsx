import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

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
