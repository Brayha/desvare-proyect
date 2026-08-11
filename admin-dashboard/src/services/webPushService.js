import { getReadyServiceWorker } from './serviceWorker';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY || '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const SUBSCRIPTION_ENDPOINT_KEY = 'adminWebPushEndpoint';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);

  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
};

const getPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/macintosh|mac os x/.test(userAgent)) return 'macos';
  if (/windows/.test(userAgent)) return 'windows';
  if (/android/.test(userAgent)) return 'android';
  return 'desktop';
};

const requestSubscription = async (method, endpoint, subscription) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    throw new Error('La sesión de administrador no está disponible.');
  }

  const response = await fetch(`${API_URL}/api/admin/web-push-subscription`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(
      method === 'POST'
        ? { subscription: subscription.toJSON(), platform: getPlatform() }
        : { endpoint },
    ),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'No se pudo actualizar la suscripción.');
  }
};

export const supportsWebPush = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

const requiresIOSInstallation = () => {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || navigator.standalone === true;
  return isIOS && !isStandalone;
};

export const getWebPushStatus = async () => {
  if (requiresIOSInstallation()) {
    return { status: 'ios-install-required', subscription: null };
  }

  if (!supportsWebPush()) {
    return { status: 'unsupported', subscription: null };
  }

  if (!VAPID_PUBLIC_KEY) {
    return { status: 'unconfigured', subscription: null };
  }

  if (Notification.permission === 'denied') {
    return { status: 'denied', subscription: null };
  }

  const registration = await getReadyServiceWorker();
  const subscription = await registration?.pushManager.getSubscription();

  return {
    status: subscription ? 'enabled' : 'disabled',
    subscription: subscription || null,
  };
};

export const enableWebPush = async () => {
  if (!supportsWebPush()) {
    throw new Error('Este navegador no admite notificaciones Web Push.');
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error('La clave pública de notificaciones no está configurada.');
  }

  const permission =
    Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;

  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Las notificaciones están bloqueadas en la configuración del navegador.'
        : 'No se concedió permiso para mostrar notificaciones.',
    );
  }

  const registration = await getReadyServiceWorker();
  if (!registration) {
    throw new Error('No se pudo iniciar el servicio de notificaciones.');
  }

  let subscription = await registration.pushManager.getSubscription();
  const createdSubscription = !subscription;

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  try {
    await requestSubscription('POST', null, subscription);
    localStorage.setItem(SUBSCRIPTION_ENDPOINT_KEY, subscription.endpoint);
    return subscription;
  } catch (error) {
    if (createdSubscription) {
      await subscription.unsubscribe().catch(() => {});
    }
    throw error;
  }
};

export const disableWebPush = async ({ notifyBackend = true } = {}) => {
  if (!supportsWebPush()) {
    localStorage.removeItem(SUBSCRIPTION_ENDPOINT_KEY);
    return;
  }

  const registration = await getReadyServiceWorker();
  const subscription = await registration?.pushManager.getSubscription();
  const endpoint =
    subscription?.endpoint || localStorage.getItem(SUBSCRIPTION_ENDPOINT_KEY);
  let backendError = null;

  try {
    if (notifyBackend && endpoint && localStorage.getItem('adminToken')) {
      await requestSubscription('DELETE', endpoint, null);
    }
  } catch (error) {
    backendError = error;
  } finally {
    if (subscription) {
      await subscription.unsubscribe().catch(() => {});
    }
    localStorage.removeItem(SUBSCRIPTION_ENDPOINT_KEY);
  }

  if (backendError) {
    throw backendError;
  }
};

