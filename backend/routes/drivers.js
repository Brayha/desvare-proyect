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

    // Verificar si ya existe un conductor con este teléfono
    // ✅ NUEVO: Ahora solo verificamos si ya es conductor, no si el teléfono existe
    // Esto permite que un cliente también pueda registrarse como conductor
    const existingDriver = await User.findOne({ 
      phone: cleanPhone, 
      userType: 'driver' 
    });
    if (existingDriver) {
      return res.status(400).json({
        error: 'Ya tienes una cuenta de conductor con este teléfono'
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

    // Enviar OTP usando Twilio Verify
    const smsResult = await sendOTP(cleanPhone);
    
    if (smsResult.success) {
      console.log(`✅ OTP enviado a ${cleanPhone} vía Twilio Verify`);
      console.log(`   Verification SID: ${smsResult.sid}`);
      console.log(`   Status: ${smsResult.status}`);
      console.log(`   Channel: ${smsResult.channel}`);
    } else if (smsResult.devMode) {
      // Modo desarrollo: generar OTP local
      console.warn('⚠️ Modo desarrollo: generando OTP local');
      const otpCode = driver.generateOTP();
      console.log(`📱 OTP de desarrollo para ${cleanPhone}: ${otpCode}`);
    } else {
      console.error(`❌ Error enviando OTP: ${smsResult.error}`);
      return res.status(500).json({
        error: 'Error al enviar código de verificación',
        details: smsResult.error
      });
    }
    
    await driver.save();
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

      // Si tiene marca/modelo de catálogo
      if (towTruck.baseBrandId && towTruck.baseModelId) {
        driver.driverProfile.towTruck.baseBrandId = towTruck.baseBrandId;
        driver.driverProfile.towTruck.baseModelId = towTruck.baseModelId;
        driver.driverProfile.towTruck.baseBrand = towTruck.baseBrand;
        driver.driverProfile.towTruck.baseModel = towTruck.baseModel;
        console.log(`   ✅ Marca/Modelo: ${towTruck.baseBrand} ${towTruck.baseModel}`);
      }

      // Si tiene marca/modelo personalizado ("Otro")
      if (towTruck.customBrand) {
        driver.driverProfile.towTruck.customBrand = towTruck.customBrand;
        console.log(`   ✅ Marca personalizada: ${towTruck.customBrand}`);
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

    res.json({
      message: 'Datos básicos guardados exitosamente',
      driver: {
        id: driver._id,
        name: driver.name,
        entityType: driver.driverProfile.entityType,
        city: driver.driverProfile.city,
        status: driver.driverProfile.status,
        towTruck: driver.driverProfile.towTruck // Incluir datos de grúa en respuesta
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

// ============================================
// GESTIÓN DE ESTADO Y DISPONIBILIDAD
// ============================================

/**
 * PATCH /api/drivers/toggle-availability
 * Cambiar estado Ocupado/Activo del conductor
 */
router.patch('/toggle-availability', async (req, res) => {
  try {
    const { driverId, isOnline } = req.body;

    if (!driverId || typeof isOnline !== 'boolean') {
      return res.status(400).json({ 
        error: 'driverId e isOnline son requeridos' 
      });
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
router.post('/fcm-token', async (req, res) => {
  try {
    const { driverId, fcmToken, platform } = req.body;

    if (!driverId || !fcmToken) {
      return res.status(400).json({
        error: 'driverId y fcmToken son requeridos'
      });
    }

    const driver = await User.findById(driverId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Actualizar FCM token
    driver.driverProfile.fcmToken = fcmToken;
    driver.driverProfile.platform = platform || 'android';
    await driver.save();

    console.log(`✅ Token FCM registrado para conductor ${driver.name} (${platform || 'android'})`);

    res.json({
      message: 'Token FCM registrado exitosamente',
      driverId: driver._id
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
router.delete('/fcm-token', async (req, res) => {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ error: 'driverId es requerido' });
    }

    const driver = await User.findById(driverId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Eliminar FCM token
    driver.driverProfile.fcmToken = null;
    await driver.save();

    console.log(`🗑️ Token FCM eliminado para conductor ${driver.name}`);

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

module.exports = router;

