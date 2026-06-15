// Service Worker para Firebase Cloud Messaging (Web Push)
// Este archivo DEBE estar en /public/ para ser accesible

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase — proyecto desvare-production
// Debe coincidir EXACTAMENTE con las variables VITE_FIREBASE_* del .env
const firebaseConfig = {
  apiKey: "AIzaSyBnF2OsNcq4FS-aYVs_ymPEdPK8N2wze_Q",
  authDomain: "desvare-production.firebaseapp.com",
  projectId: "desvare-production",
  storageBucket: "desvare-production.firebasestorage.app",
  messagingSenderId: "200097542658",
  appId: "1:200097542658:web:22e41ad8dbef3c6889ed1b"
};

// Inicializar Firebase en el Service Worker
firebase.initializeApp(firebaseConfig);

// Obtener instancia de Firebase Messaging
const messaging = firebase.messaging();

console.log('[Service Worker] Firebase Messaging inicializado');

// Manejar notificaciones en segundo plano (cuando la PWA no está activa)
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Notificación recibida en background:', payload);
  
  // Extraer datos de la notificación
  const notificationTitle = payload.notification?.title || 'Desvare';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72.png', // Badge monocromático para la barra de notificaciones
    tag: payload.data?.type || 'default', // Agrupar notificaciones del mismo tipo
    data: {
      url: payload.data?.url || '/waiting-quotes',
      quoteId: payload.data?.quoteId || null,
      requestId: payload.data?.requestId || null,
      type: payload.data?.type || 'general'
    },
    vibrate: [200, 100, 200], // Patrón de vibración (ignorado en iOS)
    requireInteraction: payload.data?.type === 'QUOTE_RECEIVED' ? true : false, // Requiere acción del usuario para cotizaciones
    actions: payload.data?.type === 'QUOTE_RECEIVED' ? [
      {
        action: 'view',
        title: 'Ver Cotización'
      },
      {
        action: 'dismiss',
        title: 'Cerrar'
      }
    ] : []
  };

  // Mostrar la notificación
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar click en la notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Click en notificación:', event);
  
  event.notification.close(); // Cerrar la notificación

  // Manejar acciones (botones en la notificación)
  if (event.action === 'dismiss') {
    // Solo cerrar
    return;
  }

  // Obtener la URL de destino desde los datos
  const urlToOpen = event.notification.data?.url || '/waiting-quotes';
  const fullUrl = self.location.origin + urlToOpen;

  // Abrir o enfocar la ventana de la PWA
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar si ya hay una ventana abierta de la PWA
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            // Si ya está abierta, enfocarla y navegar a la URL
            return client.focus().then(() => {
              return client.navigate(fullUrl);
            });
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      })
  );
});

// Manejar cierre de notificación (opcional, para analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notificación cerrada:', event.notification.tag);
  
  // Aquí podrías enviar analytics de notificaciones no vistas
  // fetch('/api/analytics/notification-dismissed', { ... });
});

// Health check del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activado y listo para recibir notificaciones');
});

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalado correctamente');
  self.skipWaiting(); // Activar inmediatamente
});
