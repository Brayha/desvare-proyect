const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// POST /api/auth/register-otp - Registrar cliente con teléfono (Paso 1)
router.post('/register-otp', async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    
    console.log('📱 Registro OTP - Datos recibidos:', { name, phone, email });
    
    // Validar campos requeridos
    if (!name || !phone) {
      return res.status(400).json({ 
        error: 'Nombre y teléfono son requeridos' 
      });
    }
    
    // Limpiar número de teléfono (quitar espacios)
    const cleanPhone = phone.replace(/\s/g, '');
    
    // Verificar si el teléfono ya existe
    const existingUser = await User.findOne({ phone: cleanPhone });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'El teléfono ya está registrado' 
      });
    }
    
    // Crear nuevo usuario (sin verificar aún)
    const user = new User({
      name,
      phone: cleanPhone,
      email: email || undefined,
      userType: 'client',
      phoneVerified: false
    });
    
    // Generar OTP
    const otpCode = user.generateOTP();
    await user.save();
    
    // TODO: Enviar OTP por SMS (Twilio)
    console.log(`✅ Usuario registrado - OTP para ${cleanPhone}: ${otpCode}`);
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
    
    // Generar nuevo OTP
    const otpCode = user.generateOTP();
    await user.save();
    
    // TODO: Enviar OTP por SMS (Twilio)
    console.log(`✅ OTP generado para ${cleanPhone}: ${otpCode}`);
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
    
    if (!userId || !otp) {
      return res.status(400).json({ 
        error: 'userId y otp son requeridos' 
      });
    }
    
    // Buscar usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }
    
    // Verificar OTP
    if (!user.verifyOTP(otp)) {
      console.log('❌ OTP inválido o expirado');
      return res.status(401).json({ 
        error: 'OTP inválido o expirado' 
      });
    }
    
    // OTP correcto - limpiar y marcar como verificado
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
    res.status(500).json({ 
      error: 'Error al verificar OTP',
      details: error.message 
    });
  }
});

module.exports = router;

