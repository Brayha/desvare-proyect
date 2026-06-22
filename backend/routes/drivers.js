/**
 * Rutas para gestión de conductores
 * - Registro inicial y completo
 * - Subida de documentos
 * - Verificación de estado
 * - Toggle online/offline
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const { uploadDriverDocument, uploadMultipleDocuments } = require('../services/storage');
const { notifyAccountApproved, notifyAccountRejected } = require('../services/notifications');
const { sendOTP, verifyOTP } = require('../services/sms');
const { notifyAdminNewDriver, notifyDriverApproved } = require('../services/emailService');
const { requireAuth, requireDriver, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// ============================================
// REGISTRO INICIAL (Paso 1)
// ============================================

/**
 * POST /api/drivers/register-initial
 * Registro inicial del conductor con OTP
 */
router.post('/register-initial', async (req, res) => {
  try {
    const { phone } = req.body;

    console.log('📱 Registro inicial conductor - Teléfono:', phone);

    if (!phone) {
      return res.status(400).json({ error: 'Teléfono es requerido' });
    }

    const cleanPhone = phone.replace(/\s/g, '');

    // Verificar si ya existe un conductor con este teléfono
    const existingDriver = await User.findOne({ phone: cleanPhone, userType: 'driver' });
    if (existingDriver) {
      return res.status(400).json({
        error: 'Ya tienes una cuenta de conductor con este teléfono'
      });
    }

    // Crear conductor con nombre placeholder — se completará tras verificar OTP
    const placeholderName = `Conductor_${cleanPhone.slice(-4)}`;
    const driver = new User({
      name: placeholderName,
      phone: cleanPhone,
      userType: 'driver',
      phoneVerified: false,
      driverProfile: { status: 'pending_documents' }
    });

    // Guardar ANTES de enviar el OTP para evitar el caso donde el SMS llega
    // pero el save falla (el usuario ve error aunque recibió el código).
    await driver.save();
    console.log(`✅ Conductor placeholder guardado: ${driver._id}`);

    // Enviar OTP usando Twilio Verify
    const smsResult = await sendOTP(cleanPhone);

    if (smsResult.success) {
      console.log(`✅ OTP enviado a ${cleanPhone} vía Twilio Verify`);
    } else if (smsResult.devMode) {
      console.warn('⚠️ Modo desarrollo: generando OTP local');
      const otpCode = driver.generateOTP();
      await driver.save();
      console.log(`📱 OTP de desarrollo para ${cleanPhone}: ${otpCode}`);
    } else {
      // OTP falló: eliminar el placeholder para que el usuario pueda reintentar
      await User.deleteOne({ _id: driver._id });
      console.error(`❌ Error enviando OTP: ${smsResult.error}`);
      return res.status(500).json({
        error: 'Error al enviar código de verificación',
        details: smsResult.error
      });
    }

    console.log('⏰ OTP expira en 10 minutos');

    res.json({
      message: 'OTP enviado. Verifica tu teléfono.',
      userId: driver._id
    });

  } catch (error) {
    console.error('❌ Error en registro inicial conductor:', error);
    res.status(500).json({
      error: 'Error al registrar conductor',
      details: error.message
    });
  }
});

// ============================================
// COMPLETAR REGISTRO INICIAL (nombre + email + PIN)
// ============================================

/**
 * POST /api/drivers/complete-initial-registration
 * Actualiza el nombre y email del conductor tras verificar OTP.
 * El PIN se guarda aparte con /set-driver-pin.
 */
router.post('/complete-initial-registration', optionalAuth, async (req, res) => {
  try {
    const { userId, name, email } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId y name son requeridos' });
    }

    if (req.user && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'No puedes modificar el perfil de otro conductor.' });
    }

    const driver = await User.findById(userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    driver.name = name.trim();
    if (email) driver.email = email.trim();

    await driver.save();

    console.log(`✅ Registro inicial completado para conductor ${userId} — nombre: ${name}`);

    res.json({ message: 'Datos actualizados exitosamente' });
  } catch (error) {
    console.error('❌ Error en complete-initial-registration:', error);
    res.status(500).json({ error: 'Error al guardar datos', details: error.message });
  }
});

// ============================================
// NUEVO FLUJO UNIFICADO: VERIFICAR TELÉFONO
// ============================================

/**
 * POST /api/drivers/check-phone
 * Verifica si un teléfono ya está registrado como conductor
 * Responde: { exists, userId, name, hasPIN, status }
 */
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Teléfono requerido' });

    const cleanPhone = phone.replace(/\s/g, '');
    const driver = await User.findOne({ phone: cleanPhone, userType: 'driver' });

    if (!driver) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      userId: driver._id,
      name: driver.name,
      hasPIN: !!driver.driverPin,
      status: driver.driverProfile?.status || 'pending_documents',
    });
  } catch (error) {
    console.error('❌ Error en check-phone (driver):', error);
    res.status(500).json({ error: 'Error al verificar teléfono', details: error.message });
  }
});

// ============================================
// NUEVO FLUJO: LOGIN CON PIN
// ============================================

/**
 * POST /api/drivers/login-pin
 * Autentica a un conductor existente con su PIN de 4 dígitos
 */
router.post('/login-pin', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId || !pin) return res.status(400).json({ error: 'userId y pin son requeridos' });

    const driver = await User.findById(userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    const isValid = await driver.compareDriverPin(pin);
    if (!isValid) {
      return res.status(401).json({ error: 'PIN incorrecto' });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: driver._id, userType: 'driver' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`✅ Login con PIN exitoso para conductor ${driver._id}`);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        userType: driver.userType,
        driverProfile: {
          status: driver.driverProfile.status,
          entityType: driver.driverProfile.entityType,
          city: driver.driverProfile.city,
          isOnline: driver.driverProfile.isOnline,
          rating: driver.driverProfile.rating,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error en login-pin (driver):', error);
    res.status(500).json({ error: 'Error al iniciar sesión', details: error.message });
  }
});

// ============================================
// NUEVO FLUJO: GUARDAR PIN DEL CONDUCTOR
// ============================================

/**
 * POST /api/drivers/set-driver-pin
 * Crea o actualiza el PIN de 4 dígitos del conductor
 * Se usa después de verificar OTP (registro nuevo o recuperación)
 */
router.post('/set-driver-pin', optionalAuth, async (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId || !pin) return res.status(400).json({ error: 'userId y pin son requeridos' });
    if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'El PIN debe ser de 4 dígitos numéricos' });

    if (req.user && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'No puedes establecer el PIN de otro conductor.' });
    }

    const driver = await User.findById(userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    await driver.setDriverPin(pin);
    await driver.save();

    console.log(`✅ PIN configurado para conductor ${userId}`);
    res.json({ message: 'PIN configurado exitosamente' });
  } catch (error) {
    console.error('❌ Error en set-driver-pin:', error);
    res.status(500).json({ error: 'Error al configurar PIN', details: error.message });
  }
});

// ============================================
// LOGIN CON OTP (Para conductores existentes)
// ============================================

/**
 * POST /api/drivers/login-otp
 * Login de conductor existente con OTP
 */
router.post('/login-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    console.log('📱 Login conductor - Teléfono:', phone);

    if (!phone) {
      return res.status(400).json({ error: 'Teléfono es requerido' });
    }

    // Limpiar número de teléfono
    const cleanPhone = phone.replace(/\s/g, '');

    // Buscar conductor por teléfono
    const driver = await User.findOne({ phone: cleanPhone, userType: 'driver' });
    
    if (!driver) {
      return res.status(404).json({ error: 'Conductor no encontrado. Por favor regístrate primero.' });
    }

    // Enviar OTP con Twilio Verify
    const smsResult = await sendOTP(cleanPhone);
    
    if (!smsResult.success) {
      console.error('❌ Error enviando OTP:', smsResult.error);
      return res.status(500).json({ 
        error: 'Error al enviar código de verificación',
        details: smsResult.error 
      });
    }

    console.log(`✅ OTP enviado a ${cleanPhone} vía Twilio Verify`);
    console.log(`   Verification SID: ${smsResult.sid}`);
    console.log('⏰ OTP expira en 10 minutos');

    res.json({
      message: 'OTP enviado. Verifica tu teléfono.',
      userId: driver._id
    });

  } catch (error) {
    console.error('❌ Error en login conductor:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión',
      details: error.message
    });
  }
});

// ============================================
// VERIFICAR OTP (Paso 2)
// ============================================

/**
 * POST /api/drivers/verify-otp
 * Verifica el OTP del conductor
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    console.log('🔐 Verificando OTP para usuario:', userId);

    if (!userId || !otp) {
      return res.status(400).json({ error: 'userId y otp son requeridos' });
    }

    const driver = await User.findById(userId);
    if (!driver) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    if (driver.userType !== 'driver') {
      return res.status(400).json({ error: 'Usuario no es conductor' });
    }

    // Verificar OTP usando Twilio Verify
    const verificationResult = await verifyOTP(driver.phone, otp);
    
    if (!verificationResult.success) {
      console.error('❌ Error al verificar OTP:', verificationResult.error);
      return res.status(400).json({ 
        error: 'OTP inválido o expirado',
        details: verificationResult.error
      });
    }

    console.log(`✅ OTP verificado correctamente para ${driver.phone}`);

    // Marcar teléfono como verificado
    driver.clearOTP();
    
    // Si el estado es 'pending_documents', cambiarlo a 'pending_documents' después de verificar
    // Si ya tiene un estado diferente, mantenerlo
    if (!driver.driverProfile.status || driver.driverProfile.status === 'new') {
      driver.driverProfile.status = 'pending_documents';
    }
    
    await driver.save();

    console.log(`✅ OTP verificado para conductor ${driver._id}`);

    // Generar token JWT
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: driver._id, userType: 'driver' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Teléfono verificado exitosamente',
      token,
      user: {
        _id: driver._id, // ✅ Cambiar 'id' por '_id' para que Socket.IO funcione
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        userType: driver.userType,
        driverProfile: {
          status: driver.driverProfile.status,
          entityType: driver.driverProfile.entityType,
          city: driver.driverProfile.city,
          isOnline: driver.driverProfile.isOnline,
          rating: driver.driverProfile.rating
        }
      }
    });

  } catch (error) {
    console.error('❌ Error verificando OTP:', error);
    res.status(500).json({
      error: 'Error al verificar OTP',
      details: error.message
    });
  }
});

// ============================================
// REGISTRO COMPLETO - Datos Básicos (Paso 3)
// ============================================

/**
 * POST /api/drivers/register-complete
 * Completa el registro con datos básicos del conductor
 */
router.post('/register-complete', optionalAuth, async (req, res) => {
  try {
    const {
      userId,
      entityType,
      companyInfo,
      city,
      address,
      towTruck // 🆕 NUEVO: Datos de la grúa
    } = req.body;

    console.log('📝 Completando registro conductor:', userId);
    console.log('🚚 Datos de grúa recibidos:', towTruck);

    if (!userId || !entityType || !city) {
      return res.status(400).json({
        error: 'userId, entityType y city son requeridos'
      });
    }

    if (req.user && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'No puedes completar el registro de otro conductor.' });
    }

    const driver = await User.findById(userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Actualizar perfil
    driver.driverProfile.entityType = entityType;
    driver.driverProfile.city = city;
    driver.driverProfile.address = address;

    // Si es persona jurídica, guardar datos de empresa
    if (entityType === 'juridica' && companyInfo) {
      driver.driverProfile.companyInfo = {
        nit: companyInfo.nit,
        companyName: companyInfo.companyName,
        legalRepresentative: companyInfo.legalRepresentative
      };
    }

    // 🆕 NUEVO: Guardar datos de la grúa si están presentes
    if (towTruck) {
      console.log('🚚 Guardando datos de grúa...');
      
      // Validar que tenga al menos tipo y placa
      if (!towTruck.truckType || !towTruck.licensePlate) {
        return res.status(400).json({
          error: 'Tipo de grúa y placa son requeridos'
        });
      }

      driver.driverProfile.towTruck = {
        truckType: towTruck.truckType,
        licensePlate: towTruck.licensePlate.toUpperCase(),
        year: towTruck.year || null,
      };

      // Marca — catálogo o personalizada (independientes entre sí)
      if (towTruck.baseBrandId) {
        driver.driverProfile.towTruck.baseBrandId = towTruck.baseBrandId;
        driver.driverProfile.towTruck.baseBrand   = towTruck.baseBrand || null;
        console.log(`   ✅ Marca catálogo: ${towTruck.baseBrand}`);
      }
      if (towTruck.customBrand) {
        driver.driverProfile.towTruck.customBrand = towTruck.customBrand;
        console.log(`   ✅ Marca personalizada: ${towTruck.customBrand}`);
      }

      // Modelo — catálogo o personalizado (independientes entre sí)
      if (towTruck.baseModelId) {
        driver.driverProfile.towTruck.baseModelId = towTruck.baseModelId;
        driver.driverProfile.towTruck.baseModel   = towTruck.baseModel || null;
        console.log(`   ✅ Modelo catálogo: ${towTruck.baseModel}`);
      }
      if (towTruck.customModel) {
        driver.driverProfile.towTruck.customModel = towTruck.customModel;
        console.log(`   ✅ Modelo personalizado: ${towTruck.customModel}`);
      }

      // Capacidades opcionales
      if (towTruck.maxWeight) driver.driverProfile.towTruck.maxWeight = towTruck.maxWeight;
      if (typeof towTruck.hasWinch === 'boolean') driver.driverProfile.towTruck.hasWinch = towTruck.hasWinch;
      if (typeof towTruck.hasFlatbed === 'boolean') driver.driverProfile.towTruck.hasFlatbed = towTruck.hasFlatbed;
      if (typeof towTruck.hasHook === 'boolean') driver.driverProfile.towTruck.hasHook = towTruck.hasHook;

      console.log(`   ✅ Tipo: ${towTruck.truckType}`);
      console.log(`   ✅ Placa: ${towTruck.licensePlate}`);
    }

    await driver.save();

    console.log(`✅ Datos básicos guardados para conductor ${userId}`);

    // Notificar al admin por email (no bloqueante — si falla no interrumpe el registro)
    notifyAdminNewDriver({
      name: driver.name,
      phone: driver.phone,
      city: driver.driverProfile?.city || 'N/A',
    }).catch(err => console.warn('⚠️ Email admin no enviado:', err.message));

    res.json({
      message: 'Datos básicos guardados exitosamente',
      driver: {
        id: driver._id,
        name: driver.name,
        entityType: driver.driverProfile.entityType,
        city: driver.driverProfile.city,
        status: driver.driverProfile.status,
        towTruck: driver.driverProfile.towTruck
      }
    });

  } catch (error) {
    console.error('❌ Error completando registro:', error);
    res.status(500).json({
      error: 'Error al guardar datos',
      details: error.message
    });
  }
});

// ============================================
// SUBIR DOCUMENTOS (Paso 4)
// ============================================

/**
 * POST /api/drivers/upload-documents
 * Sube todos los documentos del conductor de una vez
 */
router.post('/upload-documents', optionalAuth, async (req, res) => {
  try {
    const {
      userId,
      documents // Array de { file: base64, documentType: 'cedula-front', ... }
    } = req.body;

    console.log(`📤 Subiendo documentos para conductor ${userId}`);

    if (req.user && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'No puedes subir documentos de otro conductor.' });
    }

    if (!userId || !documents || !Array.isArray(documents)) {
      return res.status(400).json({
        error: 'userId y documents (array) son requeridos'
      });
    }

    const driver = await User.findById(userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Subir todos los documentos en paralelo
    const uploadResults = await uploadMultipleDocuments(documents, userId);

    // Verificar si hubo errores en la subida
    const failedUploads = Object.keys(uploadResults).filter(
      key => uploadResults[key] === null || uploadResults[key]?.error
    );

    if (failedUploads.length > 0) {
      console.error(`❌ Falló la subida de ${failedUploads.length} documentos:`, failedUploads);
      return res.status(500).json({
        error: 'Error al subir algunos documentos a almacenamiento',
        failedDocuments: failedUploads,
        details: 'Verifica las credenciales de DigitalOcean Spaces en el servidor'
      });
    }

    console.log(`✅ Todos los documentos subidos exitosamente para ${userId}`);

    // Guardar URLs en el perfil del conductor
    const docs = driver.driverProfile.documents;

    // Mapear resultados a la estructura del modelo
    if (uploadResults['cedula-front']) docs.cedula.front = uploadResults['cedula-front'];
    if (uploadResults['cedula-back']) docs.cedula.back = uploadResults['cedula-back'];
    if (uploadResults['licencia-front']) docs.licenciaTransito.front = uploadResults['licencia-front'];
    if (uploadResults['licencia-back']) docs.licenciaTransito.back = uploadResults['licencia-back'];
    if (uploadResults['soat']) docs.soat.url = uploadResults['soat'];
    if (uploadResults['tarjeta-front']) docs.tarjetaPropiedad.front = uploadResults['tarjeta-front'];
    if (uploadResults['tarjeta-back']) docs.tarjetaPropiedad.back = uploadResults['tarjeta-back'];
    if (uploadResults['seguro']) docs.seguroTodoRiesgo.url = uploadResults['seguro'];
    if (uploadResults['selfie']) docs.selfie = uploadResults['selfie'];
    if (uploadResults['grua-photo']) driver.driverProfile.towTruck.photoUrl = uploadResults['grua-photo'];

    // Actualizar estado si está completo
    if (driver.isDocumentationComplete()) {
      driver.driverProfile.status = 'pending_review';
      console.log(`✅ Documentación completa para conductor ${userId} - En revisión`);
    }

    await driver.save();

    res.json({
      message: 'Documentos subidos exitosamente',
      uploadedDocuments: Object.keys(uploadResults).filter(k => uploadResults[k] && !uploadResults[k].error),
      status: driver.driverProfile.status
    });

  } catch (error) {
    console.error('❌ Error subiendo documentos:', error);
    res.status(500).json({
      error: 'Error al subir documentos',
      details: error.message
    });
  }
});

// ============================================
// CONFIGURAR CAPACIDADES (Paso 5)
// ============================================

/**
 * POST /api/drivers/set-capabilities
 * Configura qué tipos de vehículos puede recoger el conductor
 */
router.post('/set-capabilities', optionalAuth, async (req, res) => {
  try {
    const {
      userId,
      vehicleCapabilities, // ['MOTOS', 'AUTOS', ...]
      specificCapabilities // { canPickupArmored: true, ... }
    } = req.body;

    console.log(`⚙️ Configurando capacidades para conductor ${userId}`);

    if (req.user && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'No puedes modificar las capacidades de otro conductor.' });
    }

    if (!userId || !vehicleCapabilities || !Array.isArray(vehicleCapabilities)) {
      return res.status(400).json({
        error: 'userId y vehicleCapabilities (array) son requeridos'
      });
    }

    const driver = await User.findById(userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Actualizar capacidades
    driver.driverProfile.vehicleCapabilities = vehicleCapabilities;
    
    if (specificCapabilities) {
      driver.driverProfile.specificCapabilities = {
        ...driver.driverProfile.specificCapabilities,
        ...specificCapabilities
      };
    }

    // Verificar si la documentación está completa (docs + capacidades)
    if (driver.isDocumentationComplete()) {
      driver.driverProfile.status = 'pending_review';
      console.log(`✅ Documentación completa para conductor ${userId} - Cambiando a pending_review`);
    }

    await driver.save();

    console.log(`✅ Capacidades configuradas para conductor ${userId}`);

    res.json({
      message: 'Capacidades configuradas exitosamente',
      vehicleCapabilities: driver.driverProfile.vehicleCapabilities,
      status: driver.driverProfile.status
    });

  } catch (error) {
    console.error('❌ Error configurando capacidades:', error);
    res.status(500).json({
      error: 'Error al configurar capacidades',
      details: error.message
    });
  }
});

// ============================================
// VERIFICAR ESTADO DEL CONDUCTOR
// ============================================

/**
 * GET /api/drivers/status/:userId
 * Obtiene el estado actual del conductor
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const driver = await User.findById(userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    const profile = driver.driverProfile;

    res.json({
      status: profile.status,
      isDocumentationComplete: driver.isDocumentationComplete(),
      canAcceptServices: driver.canAcceptServices(),
      isOnline: profile.isOnline,
      rejectionReason: profile.rejectionReason,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        city: profile.city,
        entityType: profile.entityType,
        vehicleCapabilities: profile.vehicleCapabilities,
        rating: profile.rating,
        totalServices: profile.totalServices
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estado:', error);
    res.status(500).json({
      error: 'Error al obtener estado',
      details: error.message
    });
  }
});

// ============================================
// TOGGLE ONLINE/OFFLINE
// ============================================

/**
 * PUT /api/drivers/toggle-online
 * Activa o desactiva el conductor para recibir servicios
 */
router.put('/toggle-online', requireAuth, requireDriver, async (req, res) => {
  try {
    const { userId, isOnline, fcmToken } = req.body;

    if (!userId || typeof isOnline !== 'boolean') {
      return res.status(400).json({
        error: 'userId e isOnline (boolean) son requeridos'
      });
    }

    // Ownership: el conductor solo puede cambiar su propio estado
    if (req.user._id.toString() !== userId?.toString()) {
      return res.status(403).json({ error: 'No puedes cambiar el estado de otro conductor.' });
    }

    const driver = await User.findById(userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Verificar que esté aprobado
    if (driver.driverProfile.status !== 'approved') {
      return res.status(403).json({
        error: 'Conductor no aprobado',
        status: driver.driverProfile.status
      });
    }

    // Actualizar estado
    driver.driverProfile.isOnline = isOnline;
    driver.driverProfile.lastOnlineAt = new Date();

    // Actualizar FCM token si se proporciona
    if (fcmToken) {
      driver.driverProfile.fcmToken = fcmToken;
    }

    await driver.save();

    console.log(`${isOnline ? '🟢' : '🔴'} Conductor ${userId} ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

    res.json({
      message: `Conductor ${isOnline ? 'activo' : 'inactivo'}`,
      isOnline: driver.driverProfile.isOnline
    });

  } catch (error) {
    console.error('❌ Error cambiando estado online:', error);
    res.status(500).json({
      error: 'Error al cambiar estado',
      details: error.message
    });
  }
});

// ============================================
// ADMIN: APROBAR/RECHAZAR CONDUCTOR
// ============================================

/**
 * PUT /api/drivers/admin/approve/:userId
 * Aprueba un conductor (solo admin)
 */
router.put('/admin/approve/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const driver = await User.findById(userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    driver.driverProfile.status = 'approved';
    driver.driverProfile.rejectionReason = undefined;
    await driver.save();

    // Enviar notificación push
    if (driver.driverProfile.fcmToken) {
      await notifyAccountApproved(driver.driverProfile.fcmToken);
    }

    console.log(`✅ Conductor ${userId} APROBADO`);

    res.json({
      message: 'Conductor aprobado exitosamente',
      driver: {
        id: driver._id,
        name: driver.name,
        status: driver.driverProfile.status
      }
    });

  } catch (error) {
    console.error('❌ Error aprobando conductor:', error);
    res.status(500).json({
      error: 'Error al aprobar conductor',
      details: error.message
    });
  }
});

/**
 * PUT /api/drivers/admin/reject/:userId
 * Rechaza un conductor (solo admin)
 */
router.put('/admin/reject/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'reason es requerido' });
    }

    const driver = await User.findById(userId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    driver.driverProfile.status = 'rejected';
    driver.driverProfile.rejectionReason = reason;
    await driver.save();

    // Enviar notificación push
    if (driver.driverProfile.fcmToken) {
      await notifyAccountRejected(driver.driverProfile.fcmToken, reason);
    }

    console.log(`❌ Conductor ${userId} RECHAZADO: ${reason}`);

    res.json({
      message: 'Conductor rechazado',
      driver: {
        id: driver._id,
        name: driver.name,
        status: driver.driverProfile.status,
        rejectionReason: driver.driverProfile.rejectionReason
      }
    });

  } catch (error) {
    console.error('❌ Error rechazando conductor:', error);
    res.status(500).json({
      error: 'Error al rechazar conductor',
      details: error.message
    });
  }
});

// ============================================
// GESTIÓN DE ESTADO Y DISPONIBILIDAD
// ============================================

/**
 * PATCH /api/drivers/toggle-availability
 * Cambiar estado Ocupado/Activo del conductor
 */
router.patch('/toggle-availability', requireAuth, requireDriver, async (req, res) => {
  try {
    const { driverId, isOnline } = req.body;

    if (!driverId || typeof isOnline !== 'boolean') {
      return res.status(400).json({ 
        error: 'driverId e isOnline son requeridos' 
      });
    }

    // Ownership: el conductor solo puede cambiar su propio estado
    if (req.user._id.toString() !== driverId?.toString()) {
      return res.status(403).json({ error: 'No puedes cambiar el estado de otro conductor.' });
    }

    const driver = await User.findById(driverId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Actualizar estado
    driver.driverProfile.isOnline = isOnline;
    driver.driverProfile.lastOnlineAt = new Date();
    await driver.save();

    console.log(`🔄 Conductor ${driver.name} ahora está ${isOnline ? 'ACTIVO ✅' : 'OCUPADO 🔴'}`);

    res.json({
      message: 'Estado actualizado exitosamente',
      driver: {
        id: driver._id,
        name: driver.name,
        isOnline: driver.driverProfile.isOnline
      }
    });

  } catch (error) {
    console.error('❌ Error al cambiar estado:', error);
    res.status(500).json({ 
      error: 'Error al cambiar estado',
      details: error.message 
    });
  }
});

/**
 * GET /api/drivers/profile/:id
 * Obtener perfil completo del conductor
 */
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await User.findById(id);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    res.json({
      message: 'Perfil obtenido exitosamente',
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        city: driver.driverProfile.city,
        status: driver.driverProfile.status,
        isOnline: driver.driverProfile.isOnline,
        rating: driver.driverProfile.rating,
        totalServices: driver.driverProfile.totalServices,
        totalEarnings: driver.driverProfile.totalEarnings,
        vehicleCapabilities: driver.driverProfile.vehicleCapabilities,
        towTruck: driver.driverProfile.towTruck,
        documents: driver.driverProfile.documents
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({ 
      error: 'Error al obtener perfil',
      details: error.message 
    });
  }
});

/**
 * POST /api/drivers/fcm-token
 * Registra o actualiza el FCM token del conductor para notificaciones push
 */
router.post('/fcm-token', requireAuth, async (req, res) => {
  try {
    const { fcmToken, platform } = req.body;
    // driverId derivado del JWT (evita IDOR / token poisoning)
    const driverId = req.user._id;

    if (!fcmToken) {
      return res.status(400).json({
        error: 'fcmToken es requerido'
      });
    }

    const plat = platform || 'android';

    // Actualización ATÓMICA para evitar VersionError por guardados concurrentes.
    // (El patrón anterior cargar→modificar→save() chocaba el __v cuando llegaban
    //  dos peticiones casi simultáneas, p.ej. el registro FCM al entrar a Home.)
    // MongoDB no permite $pull y $push del mismo array en una sola operación,
    // por lo que se hace en dos pasos atómicos:
    //   1) Quitar el token si ya existía (dedupe).
    const filter = { _id: driverId, userType: 'driver' };
    const pullResult = await User.updateOne(filter, {
      $pull: { 'driverProfile.fcmTokens': { token: fcmToken } }
    });

    if (pullResult.matchedCount === 0) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    //   2) Insertarlo de nuevo, capar el array a los 10 más recientes y
    //      actualizar el token legacy.
    await User.updateOne(filter, {
      $push: {
        'driverProfile.fcmTokens': {
          $each: [{ token: fcmToken, platform: plat, updatedAt: new Date() }],
          $slice: -10
        }
      },
      $set: {
        'driverProfile.fcmToken': fcmToken, // legacy: último token
        'driverProfile.platform': plat
      }
    });

    console.log(`✅ Token FCM registrado para conductor ${driverId} (${plat})`);

    res.json({
      message: 'Token FCM registrado exitosamente',
      driverId
    });

  } catch (error) {
    console.error('❌ Error al registrar FCM token:', error);
    res.status(500).json({
      error: 'Error al registrar FCM token',
      details: error.message
    });
  }
});

/**
 * DELETE /api/drivers/fcm-token
 * Elimina el FCM token del conductor (cuando se desloguea)
 */
router.delete('/fcm-token', requireAuth, async (req, res) => {
  try {
    const driverId = req.user._id;
    const { fcmToken } = req.body || {};

    const filter = { _id: driverId, userType: 'driver' };

    // Actualización ATÓMICA (evita VersionError, igual que en el POST).
    let result;
    if (fcmToken) {
      // Eliminar solo este dispositivo del array y limpiar el legacy si coincide.
      result = await User.updateOne(filter, {
        $pull: { 'driverProfile.fcmTokens': { token: fcmToken } }
      });
      await User.updateOne(
        { _id: driverId, 'driverProfile.fcmToken': fcmToken },
        { $set: { 'driverProfile.fcmToken': null } }
      );
    } else {
      // Logout total: vaciar todos los tokens.
      result = await User.updateOne(filter, {
        $set: { 'driverProfile.fcmTokens': [], 'driverProfile.fcmToken': null }
      });
    }

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    console.log(`🗑️ Token FCM eliminado para conductor ${driverId}`);

    res.json({
      message: 'Token FCM eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar FCM token:', error);
    res.status(500).json({
      error: 'Error al eliminar FCM token',
      details: error.message
    });
  }
});

// ========================================
// PUT /api/drivers/profile/:id - Actualizar perfil del conductor
// ========================================
router.put('/profile/:id', requireAuth, requireDriver, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, city, address } = req.body;

    if (req.user._id.toString() !== id) {
      return res.status(403).json({ error: 'No puedes editar el perfil de otro conductor.' });
    }

    const driver = await User.findById(id);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    if (name) driver.name = name;
    if (email) driver.email = email;
    if (city) driver.driverProfile.city = city;
    if (address) driver.driverProfile.address = address;

    await driver.save();

    res.json({ message: 'Perfil actualizado', driver: { id: driver._id, name: driver.name, email: driver.email } });
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil', details: error.message });
  }
});

module.exports = router;

