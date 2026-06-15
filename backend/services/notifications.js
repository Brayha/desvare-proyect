/**
 * Servicio de notificaciones push con Firebase Cloud Messaging
 */

const admin = require('firebase-admin');
const path = require('path');
const User = require('../models/User');

const MAX_TOKENS_PER_USER = 10;

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
    const invalidTokenCodes = [
      'messaging/mismatched-credential',
      'messaging/registration-token-not-registered',
      'messaging/invalid-registration-token',
      'messaging/invalid-argument',
    ];
    if (invalidTokenCodes.includes(error.errorInfo?.code)) {
      error.isInvalidToken = true;
      console.warn('⚠️ Token FCM inválido detectado (será eliminado):', error.errorInfo?.code);
    } else {
      console.error('❌ Error enviando notificación push:', error);
    }
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
const notifyQuoteAccepted = async (userId, serviceData) => {
  return await sendPushToUser(
    userId,
    '✅ ¡Cotización Aprobada!',
    `Tu cotización de $${Number(serviceData.amount || 0).toLocaleString('es-CO')} fue aceptada`,
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
 * Envía notificación al cliente cuando el conductor completa el servicio
 * @param {string} fcmToken - Token FCM del cliente
 * @param {Object} serviceData
 * @returns {Promise<string>}
 */
const notifyClientServiceCompleted = async (userId, serviceData) => {
  return await sendPushToUser(
    userId,
    '✅ ¡Servicio completado!',
    `${serviceData.driverName} llegó al destino. ¿Cómo te fue?`,
    {
      type: 'SERVICE_COMPLETED',
      requestId: serviceData.requestId || '',
      url: '/rate-service',
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

/**
 * Notifica al cliente que su conductor está llegando (a menos de X metros)
 * @param {string} fcmToken - Token FCM del cliente
 * @param {Object} data
 * @param {string} data.requestId - ID de la solicitud
 * @param {string} data.driverName - Nombre del conductor
 * @param {number} data.distanceMeters - Distancia aproximada al origen
 * @returns {Promise<string>}
 */
const notifyClientDriverArriving = async (userId, data) => {
  const minutes = data.distanceMeters <= 200 ? 1 : Math.ceil(data.distanceMeters / 300);
  const eta = minutes <= 1 ? 'en menos de 1 minuto' : `en aproximadamente ${minutes} min`;

  return await sendPushToUser(
    userId,
    '🚛 ¡Tu grúa está llegando!',
    `${data.driverName} llega ${eta}. Prepárate.`,
    {
      type: 'DRIVER_ARRIVING',
      requestId: data.requestId || '',
      distanceMeters: data.distanceMeters?.toString() || '0',
      url: '/driver-on-way',
    }
  );
};

/**
 * Notifica a la contraparte cuando llega un nuevo mensaje de chat
 * @param {string} fcmToken - Token FCM del destinatario
 * @param {Object} data - { requestId, senderName, senderType, message }
 * @returns {Promise<string>}
 */
const notifyNewChatMessage = async (userId, data) => {
  const truncated = data.message?.length > 60
    ? data.message.slice(0, 60) + '...'
    : data.message;

  return await sendPushToUser(
    userId,
    `💬 ${data.senderName}`,
    truncated,
    {
      type: 'CHAT_MESSAGE',
      requestId: data.requestId || '',
      senderType: data.senderType || '',
      url: data.senderType === 'client' ? '/active-service' : '/driver-on-way',
    }
  );
};

// ============================================================
// MULTI-DISPOSITIVO: envío a todos los tokens de un usuario
// ============================================================

/**
 * Reúne todos los tokens FCM de un usuario (array nuevo + legacy, cliente + driver).
 * @param {Object} user - documento lean de User
 * @returns {Array<string>} tokens únicos
 */
const collectUserTokens = (user) => {
  const tokens = new Set();
  if (user.fcmToken) tokens.add(user.fcmToken);
  (user.fcmTokens || []).forEach((t) => t?.token && tokens.add(t.token));
  if (user.driverProfile?.fcmToken) tokens.add(user.driverProfile.fcmToken);
  (user.driverProfile?.fcmTokens || []).forEach((t) => t?.token && tokens.add(t.token));
  return [...tokens];
};

/**
 * Elimina un token FCM inválido de todos los lugares donde pueda estar guardado.
 * @param {string} userId
 * @param {string} badToken
 */
const removeInvalidToken = async (userId, badToken) => {
  try {
    await User.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: { token: badToken }, 'driverProfile.fcmTokens': { token: badToken } } }
    );
    await User.updateOne({ _id: userId, fcmToken: badToken }, { $unset: { fcmToken: 1 } });
    await User.updateOne(
      { _id: userId, 'driverProfile.fcmToken': badToken },
      { $unset: { 'driverProfile.fcmToken': 1 } }
    );
    console.log('🗑️ Token FCM inválido eliminado del usuario', userId.toString());
  } catch (e) {
    console.warn('⚠️ No se pudo limpiar token inválido:', e.message);
  }
};

/**
 * Envía una push notification a TODOS los dispositivos de un usuario.
 * Centraliza la obtención de tokens y la limpieza de los inválidos.
 * @param {string} userId
 * @param {string} title
 * @param {string} body
 * @param {Object} data
 * @returns {Promise<{successCount:number, failureCount:number}>}
 */
const sendPushToUser = async (userId, title, body, data = {}) => {
  if (!userId) return { successCount: 0, failureCount: 0 };

  let user;
  try {
    user = await User.findById(userId)
      .select('fcmToken fcmTokens driverProfile.fcmToken driverProfile.fcmTokens')
      .lean();
  } catch (e) {
    console.warn('⚠️ Error buscando usuario para push:', e.message);
    return { successCount: 0, failureCount: 0 };
  }
  if (!user) return { successCount: 0, failureCount: 0 };

  const tokens = collectUserTokens(user);
  if (tokens.length === 0) {
    console.log('ℹ️ Usuario sin tokens FCM, no se envía push:', userId.toString());
    return { successCount: 0, failureCount: 0 };
  }

  let successCount = 0;
  let failureCount = 0;
  for (const token of tokens) {
    try {
      await sendPushNotification(token, title, body, data);
      successCount++;
    } catch (err) {
      failureCount++;
      if (err.isInvalidToken) {
        await removeInvalidToken(userId, token);
      }
    }
  }
  console.log(`📲 Push a usuario ${userId}: ${successCount} ok, ${failureCount} fallidas`);
  return { successCount, failureCount };
};

module.exports = {
  sendPushNotification,
  sendMultipleNotifications,
  sendPushToUser,
  collectUserTokens,
  removeInvalidToken,
  MAX_TOKENS_PER_USER,
  notifyNewRequest,
  notifyQuoteAccepted,
  notifyServiceCancelled,
  notifyAccountApproved,
  notifyAccountRejected,
  notifyClientNewQuote,
  notifyClientServiceCompleted,
  notifyClientDriverArriving,
  notifyNewChatMessage,
};

