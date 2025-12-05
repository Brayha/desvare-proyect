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
    const { name, phone, email } = req.body;

    console.log('📱 Registro inicial conductor - Datos recibidos:', { name, phone, email });

    // Validar campos requeridos
    if (!name || !phone) {
      return res.status(400).json({
        error: 'Nombre y teléfono son requeridos'
      });
    }

    // Limpiar número de teléfono
    const cleanPhone = phone.replace(/\s/g, '');

    // Verificar si el teléfono ya existe
    const existingUser = await User.findOne({ phone: cleanPhone });
    if (existingUser) {
      return res.status(400).json({
        error: 'El teléfono ya está registrado'
      });
    }

    // Crear nuevo conductor
    const driver = new User({
      name,
      phone: cleanPhone,
      email: email || undefined,
      userType: 'driver',
      phoneVerified: false,
      driverProfile: {
        status: 'pending_documents'
      }
    });

    // Generar OTP
    const otpCode = driver.generateOTP();
    await driver.save();

    // TODO: Enviar OTP por SMS (Twilio)
    console.log(`✅ Conductor registrado - OTP para ${cleanPhone}: ${otpCode}`);
    console.log('⏰ OTP expira en 10 minutos');

    res.json({
      message: 'Conductor registrado. Verifica tu teléfono con el OTP.',
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

    // Generar nuevo OTP
    const otpCode = driver.generateOTP();
    await driver.save();

    // TODO: Enviar OTP por SMS (Twilio)
    console.log(`✅ OTP generado para login de conductor ${cleanPhone}: ${otpCode}`);
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

    // Verificar OTP
    if (!driver.verifyOTP(otp)) {
      return res.status(400).json({ error: 'OTP inválido o expirado' });
    }

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
      process.env.JWT_SECRET || 'desvare-secret-key-2024',
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
router.post('/register-complete', async (req, res) => {
  try {
    const {
      userId,
      entityType,
      companyInfo,
      city,
      address
    } = req.body;

    console.log('📝 Completando registro conductor:', userId);

    if (!userId || !entityType || !city) {
      return res.status(400).json({
        error: 'userId, entityType y city son requeridos'
      });
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

    await driver.save();

    console.log(`✅ Datos básicos guardados para conductor ${userId}`);

    res.json({
      message: 'Datos básicos guardados exitosamente',
      driver: {
        id: driver._id,
        name: driver.name,
        entityType: driver.driverProfile.entityType,
        city: driver.driverProfile.city,
        status: driver.driverProfile.status
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
router.post('/upload-documents', async (req, res) => {
  try {
    const {
      userId,
      documents // Array de { file: base64, documentType: 'cedula-front', ... }
    } = req.body;

    console.log(`📤 Subiendo documentos para conductor ${userId}`);

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
router.post('/set-capabilities', async (req, res) => {
  try {
    const {
      userId,
      vehicleCapabilities, // ['MOTOS', 'AUTOS', ...]
      specificCapabilities // { canPickupArmored: true, ... }
    } = req.body;

    console.log(`⚙️ Configurando capacidades para conductor ${userId}`);

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
router.put('/toggle-online', async (req, res) => {
  try {
    const { userId, isOnline, fcmToken } = req.body;

    if (!userId || typeof isOnline !== 'boolean') {
      return res.status(400).json({
        error: 'userId e isOnline (boolean) son requeridos'
      });
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
router.put('/admin/approve/:userId', async (req, res) => {
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
router.put('/admin/reject/:userId', async (req, res) => {
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

module.exports = router;

