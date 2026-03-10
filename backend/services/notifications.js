/**
 * Servicio de notificaciones push con Firebase Cloud Messaging
 */

const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin SDK
let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
    const serviceAccount = require(path.resolve(serviceAccountPath));

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
    });

    console.log('✅ Firebase Admin SDK inicializado correctamente');
    return firebaseApp;

  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error.message);
    console.warn('⚠️ Las notificaciones push no estarán disponibles');
    return null;
  }
};

// Inicializar al cargar el módulo
initializeFirebase();

/**
 * Envía una notificación push a un conductor específico
 * @param {string} fcmToken - Token FCM del dispositivo del conductor
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo del mensaje
 * @param {Object} data - Datos adicionales (requestId, etc.)
 * @returns {Promise<string>} ID del mensaje enviado
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!firebaseApp) {
    console.warn('⚠️ Firebase no inicializado, saltando notificación');
    return null;
  }

  if (!fcmToken) {
    console.warn('⚠️ No hay FCM token para enviar notificación');
    return null;
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK', // Para apps nativas
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'desvare_requests',
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Notificación enviada: ${response}`);
    return response;

  } catch (error) {
    console.error('❌ Error enviando notificación push:', error);
    throw error;
  }
};

/**
 * Envía notificación a múltiples conductores
 * @param {Array<string>} fcmTokens - Array de tokens FCM
 * @param {string} title - Título
 * @param {string} body - Cuerpo
 * @param {Object} data - Datos adicionales
 * @returns {Promise<Object>} Resultado del envío
 */
const sendMultipleNotifications = async (fcmTokens, title, body, data = {}) => {
  if (!firebaseApp || !fcmTokens || fcmTokens.length === 0) {
    console.warn('⚠️ No hay tokens válidos para enviar notificaciones');
    return { successCount: 0, failureCount: 0 };
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'desvare_requests',
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          }
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      ...message
    });

    console.log(`✅ Notificaciones enviadas: ${response.successCount} exitosas, ${response.failureCount} fallidas`);
    return response;

  } catch (error) {
    console.error('❌ Error enviando notificaciones múltiples:', error);
    throw error;
  }
};

/**
 * Envía notificación de nueva solicitud a conductores cercanos
 * @param {Array<Object>} drivers - Array de conductores con fcmToken
 * @param {Object} requestData - Datos de la solicitud
 * @returns {Promise<Object>}
 */
const notifyNewRequest = async (drivers, requestData) => {
  const tokens = drivers
    .filter(d => d.driverProfile?.fcmToken)
    .map(d => d.driverProfile.fcmToken);

  if (tokens.length === 0) {
    console.warn('⚠️ No hay conductores con FCM token disponibles');
    return { successCount: 0, failureCount: 0 };
  }

  return await sendMultipleNotifications(
    tokens,
    '🚗 Nueva Solicitud de Servicio',
    `${requestData.clientName} necesita una grúa`,
    {
      type: 'NEW_REQUEST',
      requestId: requestData.requestId || '',
      clientName: requestData.clientName || '',
    }
  );
};

/**
 * Envía notificación de cotización aprobada a un conductor
 * @param {string} fcmToken - Token del conductor
 * @param {Object} serviceData - Datos del servicio
 * @returns {Promise<string>}
 */
const notifyQuoteAccepted = async (fcmToken, serviceData) => {
  return await sendPushNotification(
    fcmToken,
    '✅ ¡Cotización Aprobada!',
    `Tu cotización de $${serviceData.amount?.toLocaleString()} fue aceptada`,
    {
      type: 'QUOTE_ACCEPTED',
      requestId: serviceData.requestId || '',
      amount: serviceData.amount?.toString() || '0',
    }
  );
};

/**
 * Envía notificación de servicio cancelado
 * @param {string} fcmToken - Token del conductor
 * @param {string} requestId - ID de la solicitud
 * @returns {Promise<string>}
 */
const notifyServiceCancelled = async (fcmToken, requestId) => {
  return await sendPushNotification(
    fcmToken,
    '🚫 Servicio Cancelado',
    'El cliente canceló el servicio',
    {
      type: 'SERVICE_CANCELLED',
      requestId: requestId || '',
    }
  );
};

/**
 * Envía notificación de cuenta aprobada
 * @param {string} fcmToken - Token del conductor
 * @returns {Promise<string>}
 */
const notifyAccountApproved = async (fcmToken) => {
  return await sendPushNotification(
    fcmToken,
    '🎉 ¡Cuenta Aprobada!',
    'Tu cuenta ha sido verificada. Ya puedes empezar a recibir solicitudes.',
    {
      type: 'ACCOUNT_APPROVED',
    }
  );
};

/**
 * Envía notificación de cuenta rechazada
 * @param {string} fcmToken - Token del conductor
 * @param {string} reason - Razón del rechazo
 * @returns {Promise<string>}
 */
const notifyAccountRejected = async (fcmToken, reason) => {
  return await sendPushNotification(
    fcmToken,
    '❌ Cuenta Rechazada',
    reason || 'Tu solicitud no fue aprobada. Contacta con soporte para más información.',
    {
      type: 'ACCOUNT_REJECTED',
    }
  );
};

/**
 * Envía notificación al cliente cuando llega una nueva cotización
 * @param {string} fcmToken - Token FCM del cliente
 * @param {Object} quoteData - Datos de la cotización
 * @param {string} quoteData.requestId - ID de la solicitud
 * @param {string} quoteData.driverName - Nombre del conductor
 * @param {number} quoteData.amount - Valor cotizado
 * @returns {Promise<string>}
 */
const notifyClientNewQuote = async (fcmToken, quoteData) => {
  const formattedAmount = quoteData.amount
    ? `$${Number(quoteData.amount).toLocaleString('es-CO')}`
    : '';
  const body = formattedAmount
    ? `${quoteData.driverName} te cotizó ${formattedAmount}`
    : `${quoteData.driverName} envió una cotización`;

  return await sendPushNotification(
    fcmToken,
    '🚗 Nueva cotización recibida',
    body,
    {
      type: 'QUOTE_RECEIVED',
      requestId: quoteData.requestId || '',
      driverName: quoteData.driverName || '',
      amount: quoteData.amount?.toString() || '0',
      url: '/waiting-quotes',
    }
  );
};

module.exports = {
  sendPushNotification,
  sendMultipleNotifications,
  notifyNewRequest,
  notifyQuoteAccepted,
  notifyServiceCancelled,
  notifyAccountApproved,
  notifyAccountRejected,
  notifyClientNewQuote
};

