const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTP, verifyOTP } = require('../services/sms');
const { optionalAuth } = require('../middleware/auth');

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, userType } = req.body;

    // Validar que todos los campos estén presentes
    if (!email || !password || !name || !userType) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos: email, password, name, userType' 
      });
    }

    // Validar tipo de usuario
    if (!['client', 'driver'].includes(userType)) {
      return res.status(400).json({ 
        error: 'userType debe ser "client" o "driver"' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'El email ya está registrado' 
      });
    }

    // Crear nuevo usuario (el password se hashea automáticamente en el modelo)
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      userType
    });

    await user.save();

    // Generar JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        userType: user.userType 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retornar token y datos del usuario (sin password)
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      error: 'Error al registrar usuario',
      details: error.message 
    });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y password son requeridos' 
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Verificar tipo de usuario si se proporciona
    if (userType && user.userType !== userType) {
      return res.status(401).json({ 
        error: `Este usuario no está registrado como ${userType}` 
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        userType: user.userType 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retornar token y datos del usuario
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error al iniciar sesión',
      details: error.message 
    });
  }
});

// ============================================
// ENDPOINTS OTP PARA CLIENTS
// ============================================

// POST /api/auth/check-phone - Verificar si un teléfono ya está registrado
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Teléfono es requerido' });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const user = await User.findOne({ phone: cleanPhone, userType: 'client' });

    if (user) {
      res.json({
        exists: true,
        userId: user._id,
        name: user.name,
        hasPIN: !!user.clientPin,
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('❌ Error en check-phone:', error);
    res.status(500).json({ error: 'Error al verificar teléfono', details: error.message });
  }
});

// POST /api/auth/login-pin - Iniciar sesión con clave de 4 dígitos
router.post('/login-pin', async (req, res) => {
  try {
    const { userId, pin } = req.body;

    if (!userId || !pin) {
      return res.status(400).json({ error: 'userId y pin son requeridos' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isValid = await user.compareClientPin(pin);
    if (!isValid) {
      return res.status(401).json({ error: 'Clave incorrecta. Inténtalo de nuevo.' });
    }

    const token = jwt.sign(
      { id: user._id, phone: user.phone, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Login con PIN exitoso para: ${user.phone}`);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error('❌ Error en login-pin:', error);
    res.status(500).json({ error: 'Error al iniciar sesión', details: error.message });
  }
});

// POST /api/auth/set-pin - Guardar o actualizar clave de 4 dígitos (post-OTP)
router.post('/set-pin', optionalAuth, async (req, res) => {
  try {
    const { userId, pin } = req.body;

    if (!userId || !pin || String(pin).length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'userId y pin de exactamente 4 dígitos son requeridos' });
    }

    // Si hay token, validar ownership
    if (req.user && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'No puedes establecer el PIN de otro usuario.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await user.setClientPin(pin);
    await user.save();

    const token = jwt.sign(
      { id: user._id, phone: user.phone, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ PIN guardado para: ${user.phone}`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error('❌ Error en set-pin:', error);
    res.status(500).json({ error: 'Error al guardar clave', details: error.message });
  }
});

// POST /api/auth/complete-registration - Completar registro: nombre, email y PIN
router.post('/complete-registration', optionalAuth, async (req, res) => {
  try {
    const { userId, name, email, pin } = req.body;

    if (!userId || !name || !name.trim()) {
      return res.status(400).json({ error: 'userId y nombre son requeridos' });
    }
    if (!pin || String(pin).length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'pin de exactamente 4 dígitos es requerido' });
    }

    // Si hay token, validar ownership
    if (req.user && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'No puedes modificar el registro de otro usuario.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    user.name = name.trim();
    if (email && email.trim()) {
      user.email = email.toLowerCase().trim();
    }
    await user.setClientPin(pin);
    await user.save();

    const token = jwt.sign(
      { id: user._id, phone: user.phone, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Registro completado para: ${user.phone} (${user.name})`);

    res.json({
      message: 'Registro completado',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error('❌ Error en complete-registration:', error);
    res.status(500).json({ error: 'Error al completar registro', details: error.message });
  }
});

// POST /api/auth/register-otp - Registrar cliente con teléfono (Paso 1)
router.post('/register-otp', async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    
    console.log('📱 Registro OTP - Datos recibidos:', { name, phone, email });
    
    // Solo el teléfono es requerido (name es opcional en el nuevo flujo)
    if (!phone) {
      return res.status(400).json({ 
        error: 'Teléfono es requerido' 
      });
    }
    
    // Limpiar número de teléfono (quitar espacios)
    const cleanPhone = phone.replace(/\s/g, '');
    
    // Verificar si ya existe un cliente con este teléfono
    // ✅ NUEVO: Ahora solo verificamos si ya es cliente, no si el teléfono existe
    // Esto permite que un conductor también pueda registrarse como cliente
    const existingClient = await User.findOne({ 
      phone: cleanPhone, 
      userType: 'client' 
    });
    if (existingClient) {
      return res.status(400).json({ 
        error: 'Ya tienes una cuenta de cliente con este teléfono' 
      });
    }
    
    // Crear nuevo usuario pendiente (nombre se actualiza en complete-registration)
    const user = new User({
      name: name || `Usuario_${cleanPhone.slice(-4)}`,
      phone: cleanPhone,
      email: email || undefined,
      userType: 'client',
      phoneVerified: false
    });
    
    // Enviar OTP usando Twilio Verify (Twilio genera el código automáticamente)
    const smsResult = await sendOTP(cleanPhone);
    
    if (smsResult.success) {
      // ✅ GUARDAR USUARIO EN DB antes de retornar
      await user.save();
      console.log(`✅ Usuario guardado en DB: ${user._id}`);
      console.log(`✅ OTP enviado a ${cleanPhone} vía Twilio Verify`);
      console.log(`   Verification SID: ${smsResult.sid}`);
    } else if (smsResult.devMode) {
      // Modo desarrollo: generar OTP local
      console.warn('⚠️ Modo desarrollo: generando OTP local');
      const otpCode = user.generateOTP();
      await user.save();
      console.log(`📱 OTP de desarrollo para ${cleanPhone}: ${otpCode}`);
    } else {
      console.error(`❌ Error enviando OTP: ${smsResult.error}`);
      return res.status(500).json({ 
        error: 'No se pudo enviar el código de verificación',
        details: smsResult.error
      });
    }
    
    console.log('⏰ OTP expira en 10 minutos');
    
    res.json({
      message: 'Usuario registrado. Verifica tu teléfono con el OTP.',
      userId: user._id
    });
    
  } catch (error) {
    console.error('❌ Error en register-otp:', error);
    res.status(500).json({ 
      error: 'Error al registrar usuario',
      details: error.message 
    });
  }
});

// POST /api/auth/login-otp - Login cliente con teléfono (Paso 1)
router.post('/login-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    console.log('📱 Login OTP - Teléfono:', phone);
    
    if (!phone) {
      return res.status(400).json({ 
        error: 'Teléfono es requerido' 
      });
    }
    
    // Limpiar número de teléfono
    const cleanPhone = phone.replace(/\s/g, '');
    
    // Buscar usuario
    const user = await User.findOne({ phone: cleanPhone, userType: 'client' });
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado. ¿Necesitas registrarte?' 
      });
    }
    
    // Enviar OTP usando Twilio Verify
    const smsResult = await sendOTP(cleanPhone);
    
    if (smsResult.success) {
      console.log(`✅ OTP enviado a ${cleanPhone} vía Twilio Verify`);
      console.log(`   Verification SID: ${smsResult.sid}`);
    } else if (smsResult.devMode) {
      // Modo desarrollo: generar OTP local
      console.warn('⚠️ Modo desarrollo: generando OTP local');
      const otpCode = user.generateOTP();
      await user.save();
      console.log(`📱 OTP de desarrollo para ${cleanPhone}: ${otpCode}`);
    } else {
      console.error(`❌ Error enviando OTP: ${smsResult.error}`);
      return res.status(500).json({ 
        error: 'No se pudo enviar el código de verificación',
        details: smsResult.error
      });
    }
    
    console.log('⏰ OTP expira en 10 minutos');
    
    res.json({
      message: 'OTP enviado a tu teléfono',
      userId: user._id
    });
    
  } catch (error) {
    console.error('❌ Error en login-otp:', error);
    res.status(500).json({ 
      error: 'Error al iniciar sesión',
      details: error.message 
    });
  }
});

// POST /api/auth/verify-otp - Verificar OTP (Paso 2)
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    console.log('🔐 Verificando OTP para usuario:', userId);
    console.log('   📝 OTP recibido:', otp);
    
    if (!userId || !otp) {
      console.log('❌ Faltan datos: userId o otp');
      return res.status(400).json({ 
        error: 'userId y otp son requeridos' 
      });
    }
    
    // Buscar usuario
    console.log('🔍 Buscando usuario en DB...');
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Usuario no encontrado:', userId);
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }
    
    console.log('✅ Usuario encontrado:', user.phone);
    console.log('🔄 Llamando a Twilio Verify...');
    
    // Verificar OTP con Twilio Verify
    const verifyResult = await verifyOTP(user.phone, otp);
    
    console.log('📊 Resultado de Twilio:', {
      success: verifyResult.success,
      devMode: verifyResult.devMode,
      error: verifyResult.error,
      status: verifyResult.status
    });
    
    if (!verifyResult.success) {
      // Si Twilio no está configurado, intentar verificación local
      if (verifyResult.devMode) {
        console.warn('⚠️ Modo desarrollo: verificando OTP local');
        if (!user.verifyOTP(otp)) {
          console.log('❌ OTP local inválido o expirado');
          return res.status(401).json({ 
            error: 'OTP inválido o expirado' 
          });
        }
      } else {
        console.log('❌ Error verificando OTP con Twilio:', verifyResult.error);
        console.log('   Code:', verifyResult.code);
        console.log('   Status:', verifyResult.status);
        return res.status(401).json({ 
          error: 'OTP inválido o expirado',
          details: verifyResult.error
        });
      }
    }
    
    // OTP correcto - limpiar y marcar como verificado
    console.log('✅ OTP válido, actualizando usuario...');
    user.clearOTP();
    await user.save();
    
    console.log('✅ OTP verificado correctamente para:', user.phone);
    
    // Generar JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        phone: user.phone, 
        userType: user.userType 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ Token JWT generado para usuario:', user._id);
    
    // Retornar token y datos del usuario
    res.json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        userType: user.userType
      }
    });
    
  } catch (error) {
    console.error('❌ Error en verify-otp:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al verificar OTP',
      details: error.message 
    });
  }
});

// POST /api/auth/fcm-token - Guardar/actualizar token FCM para notificaciones push
router.post('/fcm-token', async (req, res) => {
  try {
    const { userId, fcmToken, platform } = req.body;

    // Validar campos requeridos
    if (!userId || !fcmToken) {
      return res.status(400).json({ 
        error: 'userId y fcmToken son requeridos' 
      });
    }

    console.log(`📱 Guardando FCM token para usuario ${userId} (${platform || 'unknown'})`);

    // Buscar usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    // Guardar/actualizar token FCM
    if (user.userType === 'driver') {
      // Para conductores, guardar en driverProfile
      user.driverProfile.fcmToken = fcmToken;
    } else {
      // Para clientes, guardar directamente en user
      user.fcmToken = fcmToken;
    }

    await user.save();

    console.log(`✅ Token FCM guardado exitosamente para ${user.name} (${user.userType})`);

    res.json({ 
      success: true,
      message: 'Token FCM registrado correctamente' 
    });

  } catch (error) {
    console.error('❌ Error guardando FCM token:', error);
    res.status(500).json({ 
      error: 'Error al guardar token FCM',
      details: error.message 
    });
  }
});

// DELETE /api/auth/fcm-token - Eliminar token FCM (logout)
router.delete('/fcm-token', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        error: 'userId es requerido' 
      });
    }

    console.log(`🗑️ Eliminando FCM token para usuario ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    // Eliminar token FCM
    if (user.userType === 'driver') {
      user.driverProfile.fcmToken = null;
    } else {
      user.fcmToken = null;
    }

    await user.save();

    console.log(`✅ Token FCM eliminado para ${user.name}`);

    res.json({ 
      success: true,
      message: 'Token FCM eliminado correctamente' 
    });

  } catch (error) {
    console.error('❌ Error eliminando FCM token:', error);
    res.status(500).json({ 
      error: 'Error al eliminar token FCM',
      details: error.message 
    });
  }
});

module.exports = router;

