/**
 * Servicio de Push Notifications para Driver App
 * Maneja permisos, registro FCM y canal de notificaciones Android
 */

import { PushNotifications } from '@capacitor/push-notifications';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Control para evitar registrar listeners múltiples veces
let listenersRegistered = false;

/**
 * Inicializar push notifications para el conductor
 * @param {string} driverId - ID del conductor
 * @returns {Promise<boolean>} true si se registró exitosamente
 */
export const initializePushNotifications = async (driverId) => {
  if (!driverId) {
    console.warn('⚠️ No se puede inicializar push notifications sin driverId');
    return false;
  }

  try {
    console.log('🔔 Inicializando push notifications para conductor:', driverId);

    // 1. Verificar permisos actuales
    let permStatus = await PushNotifications.checkPermissions();
    console.log('📱 Permisos actuales:', permStatus.receive);

    // 2. Solicitar permisos si aún no se han dado
    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      console.log('🔔 Solicitando permisos de notificaciones...');
      permStatus = await PushNotifications.requestPermissions();
    }

    // 3. Si los permisos fueron denegados, no continuar
    if (permStatus.receive !== 'granted') {
      console.warn('❌ Permisos de notificaciones denegados');
      return false;
    }

    console.log('✅ Permisos de notificaciones concedidos');

    // 4. Crear canal Android ANTES de registrar
    // Android 8+ requiere un canal para mostrar notificaciones
    await createNotificationChannel();

    // 5. Registrar listeners ANTES de llamar register()
    // Así no se pierde el evento 'registration' por race condition
    setupNotificationListeners(driverId);

    // 6. Registrar con FCM (dispara el evento 'registration' con el token)
    await PushNotifications.register();
    console.log('✅ Registro FCM iniciado');

    return true;
  } catch (error) {
    console.error('❌ Error inicializando push notifications:', error);
    return false;
  }
};

/**
 * Crea el canal de notificaciones requerido por Android 8+
 */
const createNotificationChannel = async () => {
  try {
    await PushNotifications.createChannel({
      id: 'desvare_requests',
      name: 'Solicitudes de servicio',
      description: 'Notificaciones de nuevas solicitudes de grúa',
      importance: 5, // IMPORTANCE_HIGH — muestra heads-up notification
      visibility: 1, // VISIBILITY_PUBLIC
      sound: 'default',
      lights: true,
      vibration: true,
    });
    console.log('✅ Canal de notificaciones Android creado');
  } catch (err) {
    // En iOS o si el canal ya existe, esto no falla de forma crítica
    console.log('ℹ️ Canal de notificaciones:', err?.message || 'ya existe o no aplica');
  }
};

/**
 * Configura los listeners de notificaciones.
 * Usa una bandera para evitar registrar los mismos listeners múltiples veces.
 * @param {string} driverId - ID del conductor
 */
const setupNotificationListeners = (driverId) => {
  if (listenersRegistered) {
    console.log('ℹ️ Listeners de push ya registrados, omitiendo...');
    return;
  }

  // Listener: Token FCM obtenido
  PushNotifications.addListener('registration', async (token) => {
    console.log('✅ Token FCM obtenido:', token.value);

    try {
      const response = await fetch(`${API_URL}/api/drivers/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          driverId,
          fcmToken: token.value,
          platform: 'android',
        }),
      });

      if (response.ok) {
        console.log('✅ Token FCM registrado en el servidor');
        localStorage.setItem('fcmToken', token.value);
      } else {
        console.error('❌ Error al registrar token FCM en el servidor:', response.status);
      }
    } catch (error) {
      console.error('❌ Error al enviar token FCM al backend:', error);
    }
  });

  // Listener: Error de registro FCM
  PushNotifications.addListener('registrationError', (error) => {
    console.error('❌ Error en registro FCM:', error);
  });

  // Listener: Notificación recibida con app en foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('📬 Notificación en foreground:', notification);
    // La app ya muestra las solicitudes en tiempo real por Socket.IO,
    // así que en foreground no necesitamos acción adicional.
  });

  // Listener: Usuario toca la notificación (app en background o cerrada)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('👆 Notificación tocada:', action);
    const data = action.notification?.data;

    if (data?.type === 'NEW_REQUEST') {
      // Nueva solicitud → Home para verla en tiempo real
      window.location.href = '/home';
    } else if (data?.type === 'QUOTE_ACCEPTED') {
      // Cliente aceptó la cotización → ir directo al servicio activo
      window.location.href = '/active-service';
    } else if (data?.type === 'SERVICE_CANCELLED') {
      // Servicio cancelado → Home
      window.location.href = '/home';
    } else if (data?.requestId) {
      window.location.href = '/home';
    }
  });

  listenersRegistered = true;
  console.log('✅ Listeners de push notifications configurados');
};

/**
 * Eliminar token FCM del backend cuando el conductor cierra sesión
 * @param {string} driverId - ID del conductor
 */
export const removeFCMToken = async (driverId) => {
  try {
    const token = localStorage.getItem('fcmToken');
    if (!token) return;

    await fetch(`${API_URL}/api/drivers/fcm-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ driverId, fcmToken: token }),
    });

    localStorage.removeItem('fcmToken');
    listenersRegistered = false; // Permite re-registrar en el próximo login
    console.log('✅ Token FCM eliminado del servidor');
  } catch (error) {
    console.error('❌ Error al eliminar token FCM:', error);
  }
};
