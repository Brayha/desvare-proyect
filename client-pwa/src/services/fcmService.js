/**
 * Servicio de Firebase Cloud Messaging para Client PWA
 * Maneja el registro de tokens y recepción de notificaciones push
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, VAPID_KEY, isFirebaseConfigured } from '../config/firebase.config';

// Inicializar Firebase
let app;
let messaging;

try {
  // Verificar que Firebase esté configurado
  if (!isFirebaseConfigured()) {
    console.error('❌ Firebase no está configurado correctamente. Verifica tu archivo .env');
  } else {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('✅ Firebase inicializado correctamente en PWA');
  }
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
}

/**
 * Solicita permiso de notificaciones y registra el token FCM
 * @param {string} userId - ID del usuario para asociar el token
 * @returns {Promise<string|null>} Token FCM o null si falla
 */
export const requestNotificationPermission = async (userId) => {
  try {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.warn('⚠️ Este navegador no soporta notificaciones');
      return null;
    }

    // Verificar si ya tiene permisos
    if (Notification.permission === 'granted') {
      console.log('✅ Permisos de notificación ya concedidos');
      return await registerFCMToken(userId);
    }

    // Solicitar permisos
    console.log('📱 Solicitando permisos de notificación...');
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('✅ Permisos concedidos');
      return await registerFCMToken(userId);
    } else {
      console.warn('⚠️ Permisos de notificación denegados');
      return null;
    }
  } catch (error) {
    console.error('❌ Error solicitando permisos:', error);
    return null;
  }
};

/**
 * Registra el token FCM en el servidor
 * @param {string} userId - ID del usuario
 * @returns {Promise<string|null>} Token FCM
 */
const registerFCMToken = async (userId) => {
  try {
    if (!messaging) {
      console.error('❌ Firebase Messaging no inicializado');
      return null;
    }

    // Registrar el Service Worker y esperar a que esté activo
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker registrado y listo:', registration);

    // Obtener el token FCM
    console.log('🔑 Obteniendo token FCM...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('✅ Token FCM obtenido:', token);

      // Guardar el token en el backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/auth/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          fcmToken: token,
          platform: 'web' // Para diferenciar de mobile
        })
      });

      if (response.ok) {
        console.log('✅ Token FCM registrado en el servidor');
        // Guardar en localStorage para verificaciones
        localStorage.setItem('fcmToken', token);
        return token;
      } else {
        console.error('❌ Error registrando token en el servidor');
        return null;
      }
    } else {
      console.warn('⚠️ No se pudo obtener el token FCM');
      return null;
    }
  } catch (error) {
    console.error('❌ Error registrando token FCM:', error);
    
    // Errores comunes y sus soluciones
    if (error.code === 'messaging/permission-blocked') {
      console.error('🚫 Permisos bloqueados por el usuario. Debe habilitarlos manualmente en la configuración del navegador.');
    } else if (error.code === 'messaging/token-subscribe-failed') {
      console.error('🚫 Error suscribiéndose a notificaciones. Verifica la configuración de Firebase.');
    }
    
    return null;
  }
};

/**
 * Escucha notificaciones cuando la app está en primer plano
 * @param {Function} callback - Función que se ejecuta cuando llega una notificación
 */
export const onMessageListener = (callback) => {
  if (!messaging) {
    console.error('❌ Firebase Messaging no inicializado');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('📬 Notificación recibida en foreground:', payload);
    
    // Ejecutar callback con los datos de la notificación
    if (callback && typeof callback === 'function') {
      callback({
        title: payload.notification?.title,
        body: payload.notification?.body,
        data: payload.data
      });
    }

    // Mostrar notificación visual incluso si la app está abierta
    if (payload.notification) {
      // Reproducir sonido
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(err => console.log('No se pudo reproducir sonido:', err));

      // Vibrar (si el dispositivo lo soporta)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  });
};

/**
 * Verifica si las notificaciones están habilitadas
 * @returns {boolean}
 */
export const areNotificationsEnabled = () => {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
};

/**
 * Obtiene el estado actual de los permisos
 * @returns {string} 'granted', 'denied', 'default'
 */
export const getNotificationPermissionStatus = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Elimina el token FCM del servidor (logout, cambio de cuenta)
 * @param {string} userId - ID del usuario
 */
export const unregisterFCMToken = async (userId) => {
  try {
    const token = localStorage.getItem('fcmToken');
    if (!token) {
      console.log('ℹ️ No hay token FCM para eliminar');
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    await fetch(`${API_URL}/api/auth/fcm-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ userId, fcmToken: token })
    });

    localStorage.removeItem('fcmToken');
    console.log('✅ Token FCM eliminado del servidor');
  } catch (error) {
    console.error('❌ Error eliminando token FCM:', error);
  }
};

export default {
  requestNotificationPermission,
  onMessageListener,
  areNotificationsEnabled,
  getNotificationPermissionStatus,
  unregisterFCMToken
};
