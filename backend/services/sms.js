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
 * En modo desarrollo (TWILIO_DEV_MODE=true), usa código fijo sin enviar SMS real
 * @param {string} phoneNumber - Número de teléfono (formato: +573001234567 o 3001234567)
 * @returns {Promise<Object>} Resultado del envío
 */
const sendOTP = async (phoneNumber) => {
  // 🔧 MODO DESARROLLO: Usar OTP fijo para evitar restricciones de Twilio Trial
  const DEV_MODE = process.env.TWILIO_DEV_MODE === 'true';
  
  if (DEV_MODE) {
    console.log('🔧 MODO DESARROLLO ACTIVADO: OTP fijo sin SMS real');
    console.log(`📱 Número: ${phoneNumber}`);
    console.log(`🔑 Código OTP de desarrollo: 123456`);
    console.log('⚠️ Este modo es solo para testing. NO usar en producción.');
    return { 
      success: true, 
      devMode: true,
      message: 'OTP de desarrollo generado (código: 123456)'
    };
  }

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

    // Si es error de cuenta Trial (21608), sugerir soluciones
    if (error.code === 21608) {
      console.error('');
      console.error('💡 SOLUCIÓN: Tu cuenta de Twilio está en modo Trial.');
      console.error('   Opciones:');
      console.error('   1. Verificar números en: https://www.twilio.com/console/phone-numbers/verified');
      console.error('   2. Actualizar a cuenta paga: https://www.twilio.com/console/billing');
      console.error('   3. Activar modo desarrollo: TWILIO_DEV_MODE=true en .env');
      console.error('');
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
 * En modo desarrollo (TWILIO_DEV_MODE=true), acepta código fijo '123456'
 * @param {string} phoneNumber - Número de teléfono
 * @param {string} code - Código OTP ingresado por el usuario
 * @returns {Promise<Object>} Resultado de la verificación
 */
const verifyOTP = async (phoneNumber, code) => {
  // 🔧 MODO DESARROLLO: Aceptar OTP fijo
  const DEV_MODE = process.env.TWILIO_DEV_MODE === 'true';
  
  if (DEV_MODE) {
    const isValid = code === '123456';
    console.log(`🔧 MODO DESARROLLO: Verificando OTP para ${phoneNumber}`);
    console.log(`   Código ingresado: ${code}`);
    console.log(`   Resultado: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO (usa 123456)'}`);
    return { 
      success: isValid,
      devMode: true,
      message: isValid ? 'OTP correcto' : 'OTP incorrecto (usa 123456 en modo desarrollo)'
    };
  }

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
