/**
 * Servicio de notificaciones push para Client PWA.
 *
 * Camino principal (iOS + Android/Chrome): Web Push nativo con VAPID propio.
 * Firebase Messaging se mantiene solo para listeners legacy / foreground si el
 * SDK está disponible; ya NO se llama a getToken en la PWA del cliente para
 * evitar conflicto de VAPID con PushManager (un SW solo admite una suscripción).
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, onMessage } from 'firebase/messaging';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase.config';
import {
  isIOSSafari,
  supportsWebPush,
  registerWebPushSubscription,
} from './webPushService';

// Inicializar Firebase (opcional: foreground toast si hay messaging)
let app;
let messaging;

try {
  if (!isFirebaseConfigured()) {
    console.warn('⚠️ Firebase no está completamente configurado (opcional para Web Push nativo)');
  } else {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('✅ Firebase inicializado en PWA (listener foreground opcional)');
  }
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
}

/**
 * Solicita permiso de notificaciones y registra la suscripción Web Push.
 * Misma vía en iOS Safari y en Android/Chrome (instalada o en navegador).
 * @param {string} userId - ID del usuario para asociar la suscripción
 * @returns {Promise<string|null>} 'web-push' si ok, o null si falla
 */
export const requestNotificationPermission = async (userId) => {
  try {
    if (!('Notification' in window)) {
      console.warn('⚠️ Este navegador no soporta notificaciones');
      return null;
    }

    if (!supportsWebPush()) {
      console.warn('⚠️ Web Push no soportado en este navegador');
      return null;
    }

    if (isIOSSafari()) {
      console.log('🍎 iOS Safari — Web Push nativo');
    } else {
      console.log('📡 Android/Chrome/Desktop — Web Push nativo (mismo stack que iOS)');
    }

    const success = await registerWebPushSubscription(userId);
    return success ? 'web-push' : null;
  } catch (error) {
    console.error('❌ Error solicitando permisos:', error);
    return null;
  }
};

/**
 * Escucha notificaciones cuando la app está en primer plano (solo si FCM
 * está inicializado). Con Web Push nativo, el SW también puede mostrar
 * la notificación en background; este listener es complemento UI.
 * @param {Function} callback
 */
export const onMessageListener = (callback) => {
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('📬 Notificación recibida en foreground (FCM):', payload);

    if (callback && typeof callback === 'function') {
      callback({
        title: payload.notification?.title,
        body: payload.notification?.body,
        data: payload.data
      });
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
 * Elimina el token FCM legacy del servidor (logout).
 * La suscripción Web Push se limpia por separado si hace falta.
 * @param {string} userId - ID del usuario
 */
export const unregisterFCMToken = async (userId) => {
  try {
    const token = localStorage.getItem('fcmToken');
    if (!token) {
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'https://api.desvare.app';
    await fetch(`${API_URL}/api/auth/fcm-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ userId, fcmToken: token })
    });

    localStorage.removeItem('fcmToken');
    console.log('✅ Token FCM legacy eliminado del servidor');
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
