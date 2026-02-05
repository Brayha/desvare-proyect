// Service Worker para Firebase Cloud Messaging (Web Push)
// Este archivo DEBE estar en /public/ para ser accesible

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase (reemplazar con tus credenciales reales)
// Estas son las mismas que usas en el frontend
const firebaseConfig = {
  apiKey: "AIzaSyDsHoj8trl_sIf5SCWNF3BFJQOuj9kwvMk",
  authDomain: "app-desvare.firebaseapp.com",
  projectId: "app-desvare",
  storageBucket: "app-desvare.firebasestorage.app",
  messagingSenderId: "805328160383",
  appId: "1:805328160383:web:51a99efb6881693f16614a"
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
    icon: '/icons/icon-192.png', // Asegúrate de tener este icon
    badge: '/icons/badge-72.png', // Badge pequeño para barra notificaciones
    tag: payload.data?.type || 'default', // Agrupar notificaciones del mismo tipo
    data: {
      url: payload.data?.url || '/tabs/desvare',
      quoteId: payload.data?.quoteId || null,
      requestId: payload.data?.requestId || null,
      type: payload.data?.type || 'general'
    },
    vibrate: [200, 100, 200], // Patrón de vibración
    requireInteraction: payload.data?.type === 'QUOTE_RECEIVED' ? true : false, // Requiere acción del usuario para cotizaciones
    actions: payload.data?.type === 'QUOTE_RECEIVED' ? [
      {
        action: 'view',
        title: 'Ver Cotización',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Cerrar',
        icon: '/icons/close-icon.png'
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
  const urlToOpen = event.notification.data?.url || '/tabs/desvare';
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
