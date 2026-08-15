/**
 * Servicio de Web Push nativo (VAPID propio).
 *
 * Se usa en:
 * - iOS Safari / PWA instalada (FCM web no funciona ahí)
 * - Android Chrome / PWA (mismo stack; más fiable que FCM getToken)
 *
 * Flujo:
 * 1. Solicitar permiso de notificaciones
 * 2. Suscribirse via pushManager con nuestro VAPID público (no el de Firebase)
 * 3. Guardar la suscripción en el backend
 * 4. El backend usa web-push (VAPID privado) para enviar al endpoint del navegador
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY || '';
const API_URL = import.meta.env.VITE_API_URL || 'https://api.desvare.app';
const SERVICE_WORKER_URL = '/firebase-messaging-sw.js';

/**
 * Detecta si el dispositivo es iOS Safari (PWA o navegador).
 * Incluye iOS 16.4+ donde Web Push es soportado.
 */
export const isIOSSafari = () => {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|opios/i.test(ua);
  return isIOS && isSafari;
};

/**
 * Etiqueta de plataforma para guardar en Mongo (solo diagnóstico).
 */
export const getWebPushPlatform = () => {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios-safari';
  if (/android/.test(ua)) return 'android-chrome';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  if (/windows/.test(ua)) return 'windows';
  return 'web';
};

/**
 * Verifica si el navegador soporta Web Push nativo.
 */
export const supportsWebPush = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

/**
 * Convierte una clave VAPID base64url a Uint8Array (requerido por pushManager.subscribe).
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Asegura que el Service Worker esté registrado y activo antes de suscribirse.
 */
const getReadyServiceWorker = async () => {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) {
    return navigator.serviceWorker.ready;
  }

  await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' });
  return navigator.serviceWorker.ready;
};

/**
 * Registra una suscripción Web Push nativa y la guarda en el backend.
 * @param {string} userId - ID del usuario autenticado (reservado; el backend usa el JWT)
 * @returns {Promise<boolean>} true si el registro fue exitoso
 */
export const registerWebPushSubscription = async (userId) => {
  void userId;

  if (!supportsWebPush()) {
    console.warn('⚠️ Web Push no soportado en este navegador');
    return false;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('❌ VITE_WEB_PUSH_VAPID_PUBLIC_KEY no configurada');
    return false;
  }

  try {
    // Verificar permisos
    if (Notification.permission === 'denied') {
      console.warn('⚠️ Permisos de notificación denegados');
      return false;
    }

    if (Notification.permission === 'default') {
      console.log('📱 Solicitando permisos de notificación (Web Push nativo)...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ Permiso denegado por el usuario');
        return false;
      }
    }

    // Obtener registro del Service Worker (registrar si hace falta)
    const swRegistration = await getReadyServiceWorker();
    if (!swRegistration) {
      console.error('❌ No se pudo obtener el Service Worker');
      return false;
    }

    // Verificar si ya existe una suscripción activa con nuestro VAPID key
    let subscription = await swRegistration.pushManager.getSubscription();

    if (subscription) {
      // Si la suscripción es de Firebase (otro VAPID), cancelar y re-suscribir.
      try {
        const existingKey = subscription.options?.applicationServerKey;
        if (existingKey) {
          const existingKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(existingKey)));
          const ourKeyNormalized = VAPID_PUBLIC_KEY.replace(/-/g, '+').replace(/_/g, '/');
          if (!existingKeyBase64.replace(/-/g, '+').replace(/_/g, '/').includes(ourKeyNormalized.slice(0, 20))) {
            console.log('🔄 Suscripción existente usa VAPID diferente (Firebase). Re-suscribiendo con VAPID propio...');
            await subscription.unsubscribe();
            subscription = null;
          }
        }
      } catch {
        // Si no podemos comparar, forzar re-suscripción
        await subscription.unsubscribe();
        subscription = null;
      }
    }

    if (!subscription) {
      console.log('🔑 Creando nueva suscripción Web Push con VAPID propio...');
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('✅ Suscripción Web Push creada:', subscription.endpoint.slice(0, 60) + '...');
    } else {
      console.log('✅ Suscripción Web Push existente reutilizada');
    }

    // Serializar la suscripción correctamente (incluye las keys)
    const subscriptionJson = subscription.toJSON();
    const platform = getWebPushPlatform();

    // Guardar en el backend
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/auth/web-push-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription: subscriptionJson,
        platform
      })
    });

    if (response.ok) {
      console.log(`✅ Suscripción Web Push guardada en el servidor (${platform})`);
      localStorage.setItem('webPushEndpoint', subscriptionJson.endpoint);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error guardando suscripción en servidor:', errorData);
      return false;
    }

  } catch (error) {
    console.error('❌ Error registrando Web Push subscription:', error);
    return false;
  }
};

/**
 * Cancela la suscripción Web Push y la elimina del backend.
 */
export const unregisterWebPushSubscription = async () => {
  try {
    const swRegistration = await navigator.serviceWorker.ready;
    const subscription = await swRegistration.pushManager.getSubscription();

    const endpoint = subscription?.endpoint || localStorage.getItem('webPushEndpoint');

    if (subscription) {
      await subscription.unsubscribe();
    }

    if (endpoint) {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/auth/web-push-subscription`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ endpoint })
      });
      localStorage.removeItem('webPushEndpoint');
    }

    console.log('✅ Suscripción Web Push cancelada');
  } catch (error) {
    console.error('❌ Error cancelando suscripción Web Push:', error);
  }
};

export default {
  isIOSSafari,
  getWebPushPlatform,
  supportsWebPush,
  registerWebPushSubscription,
  unregisterWebPushSubscription
};
