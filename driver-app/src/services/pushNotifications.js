/**
 * Servicio de Push Notifications para Driver App
 * Maneja permisos y registro de FCM token
 */

import { PushNotifications } from '@capacitor/push-notifications';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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

    // 2. Si no tiene permisos, solicitarlos
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

    // 4. Registrar con FCM
    await PushNotifications.register();
    console.log('✅ Registrado con FCM');

    // 5. Listeners de notificaciones
    setupNotificationListeners(driverId);

    return true;
  } catch (error) {
    console.error('❌ Error inicializando push notifications:', error);
    return false;
  }
};

/**
 * Configurar listeners de notificaciones
 * @param {string} driverId - ID del conductor
 */
const setupNotificationListeners = (driverId) => {
  // Listener: Token registrado
  PushNotifications.addListener('registration', async (token) => {
    console.log('✅ Token FCM obtenido:', token.value);
    
    // Enviar token al backend
    try {
      const response = await fetch(`${API_URL}/api/drivers/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          driverId: driverId,
          fcmToken: token.value,
          platform: 'android'
        })
      });

      if (response.ok) {
        console.log('✅ Token FCM registrado en el servidor');
        // Guardar token en localStorage para referencia
        localStorage.setItem('fcmToken', token.value);
      } else {
        console.error('❌ Error al registrar token FCM en el servidor');
      }
    } catch (error) {
      console.error('❌ Error al enviar token FCM al backend:', error);
    }
  });

  // Listener: Error de registro
  PushNotifications.addListener('registrationError', (error) => {
    console.error('❌ Error en registro de push notifications:', error);
  });

  // Listener: Notificación recibida (app en foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('📬 Notificación recibida en foreground:', notification);
    
    // Aquí podrías mostrar un toast o modal
    // Por ahora solo lo logueamos
  });

  // Listener: Notificación clickeada (app en background)
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('👆 Notificación clickeada:', notification);
    
    // Navegar según el tipo de notificación
    const data = notification.notification.data;
    
    if (data.requestId) {
      // Navegar al detalle del request
      window.location.href = `/request/${data.requestId}`;
    }
  });

  console.log('✅ Listeners de notificaciones configurados');
};

/**
 * Eliminar token FCM del backend (cuando el conductor se desloguea)
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
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        driverId: driverId,
        fcmToken: token
      })
    });

    localStorage.removeItem('fcmToken');
    console.log('✅ Token FCM eliminado del servidor');
  } catch (error) {
    console.error('❌ Error al eliminar token FCM:', error);
  }
};
