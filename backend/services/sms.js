/**
 * Servicio de OTP con Twilio Verify API
 * Envía códigos OTP para autenticación de usuarios
 * Usa Twilio Verify que funciona en Colombia sin necesidad de comprar número
 */

const twilio = require('twilio');

// Inicializar cliente de Twilio
let twilioClient = null;

const initializeTwilio = () => {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifySid) {
    console.warn('⚠️ Twilio Verify no configurado. OTP deshabilitado.');
    console.warn('⚠️ Configura TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_VERIFY_SERVICE_SID en .env');
    return null;
  }

  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio Verify inicializado correctamente');
    console.log(`   Service SID: ${verifySid}`);
    return twilioClient;
  } catch (error) {
    console.error('❌ Error inicializando Twilio:', error.message);
    return null;
  }
};

// Inicializar al cargar el módulo
initializeTwilio();

/**
 * Envía código OTP usando Twilio Verify API
 * @param {string} phoneNumber - Número de teléfono (formato: +573001234567 o 3001234567)
 * @returns {Promise<Object>} Resultado del envío
 */
const sendOTP = async (phoneNumber) => {
  const client = twilioClient || initializeTwilio();
  
  if (!client) {
    console.warn('⚠️ Twilio Verify no disponible, saltando envío de OTP');
    console.log(`📱 Modo desarrollo: OTP sería enviado a ${phoneNumber}`);
    return { success: false, error: 'Twilio no configurado', devMode: true };
  }

  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!verifySid) {
    console.error('❌ TWILIO_VERIFY_SERVICE_SID no configurado en .env');
    return { success: false, error: 'Verify Service no configurado' };
  }

  try {
    // Asegurar formato internacional (+57 para Colombia)
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+57${phoneNumber}`;

    // Enviar verificación usando Twilio Verify
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications
      .create({
        to: formattedPhone,
        channel: 'sms' // Puede ser 'sms', 'call', o 'whatsapp'
      });

    console.log(`✅ OTP enviado a ${formattedPhone} vía Twilio Verify`);
    console.log(`   Verification SID: ${verification.sid}`);
    console.log(`   Status: ${verification.status}`);
    console.log(`   Channel: ${verification.channel}`);

    return { 
      success: true, 
      sid: verification.sid,
      status: verification.status,
      channel: verification.channel
    };
    
  } catch (error) {
    console.error('❌ Error enviando OTP con Twilio Verify:', error.message);
    
    // Logging detallado para debugging
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.moreInfo) {
      console.error(`   Más info: ${error.moreInfo}`);
    }

    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

/**
 * Verifica código OTP usando Twilio Verify API
 * @param {string} phoneNumber - Número de teléfono
 * @param {string} code - Código OTP ingresado por el usuario
 * @returns {Promise<Object>} Resultado de la verificación
 */
const verifyOTP = async (phoneNumber, code) => {
  const client = twilioClient || initializeTwilio();
  
  if (!client) {
    console.warn('⚠️ Twilio Verify no disponible, modo desarrollo');
    // En desarrollo, aceptar código '0000' o '123456'
    const isValid = code === '0000' || code === '123456';
    return { 
      success: isValid, 
      error: isValid ? null : 'Código inválido',
      devMode: true 
    };
  }

  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!verifySid) {
    return { success: false, error: 'Verify Service no configurado' };
  }

  try {
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+57${phoneNumber}`;

    // Verificar código con Twilio Verify
    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks
      .create({
        to: formattedPhone,
        code: code
      });

    const isValid = verificationCheck.status === 'approved';

    if (isValid) {
      console.log(`✅ OTP verificado correctamente para ${formattedPhone}`);
    } else {
      console.log(`❌ OTP inválido para ${formattedPhone} - Status: ${verificationCheck.status}`);
    }

    return { 
      success: isValid,
      status: verificationCheck.status,
      sid: verificationCheck.sid
    };
    
  } catch (error) {
    console.error('❌ Error verificando OTP:', error.message);
    
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }

    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

module.exports = {
  sendOTP,
  verifyOTP
};
