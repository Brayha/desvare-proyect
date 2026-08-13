/**
 * Rutas de administración del dashboard
 * - Login de admin
 * - Gestión de conductores
 * - Gestión de clientes
 * - Estadísticas y reportes
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Request = require('../models/Request');
const ChatMessage = require('../models/ChatMessage');
const { requireAdmin } = require('../middleware/adminAuth');
const { notifyDriverApproved } = require('../services/emailService');
const { notifyAccountApproved, notifyAccountRejected } = require('../services/notifications');

const TRUCK_TYPES = new Set(['GRUA_MOTO', 'GRUA_LIVIANA', 'GRUA_PESADA']);
const VEHICLE_CAPABILITIES = new Set(['MOTOS', 'AUTOS', 'CAMIONETAS', 'CAMIONES', 'BUSES']);
const LICENSE_PLATE_REGEX = /^[A-Z]{3}(?:[0-9]{3}|[0-9]{2}[A-Z])$/;
const TOW_TRUCK_TEXT_FIELDS = ['baseBrand', 'customBrand', 'baseModel', 'customModel'];

const normalizeOptionalText = (value, fieldName) => {
  if (value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    const error = new Error(`${fieldName} debe ser texto`);
    error.status = 400;
    throw error;
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > 100) {
    const error = new Error(`${fieldName} debe tener entre 1 y 100 caracteres`);
    error.status = 400;
    throw error;
  }
  return normalized;
};

// ============================================
// LOGIN DE ADMIN (Sin autenticación previa)
// ============================================

/**
 * POST /api/admin/login
 * Login exclusivo para administradores
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Intento de login admin:', email);

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      });
    }

    // Buscar admin por email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      console.log('❌ Admin no encontrado:', email);
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Verificar si está activo
    if (!admin.isActive) {
      console.log('❌ Admin inactivo:', email);
      return res.status(403).json({ 
        error: 'Cuenta de administrador desactivada' 
      });
    }

    // Comparar contraseña
    const isMatch = await admin.comparePassword(password);
    
    if (!isMatch) {
      console.log('❌ Contraseña incorrecta para:', email);
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Actualizar último login
    admin.lastLogin = new Date();
    await admin.save();

    // Generar JWT
    const token = jwt.sign(
      { 
        id: admin._id, 
        role: 'admin',
        email: admin.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Admin autenticado:', email);

    res.json({
      message: 'Login exitoso',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('❌ Error en login admin:', error);
    res.status(500).json({ 
      error: 'Error al iniciar sesión',
      details: error.message 
    });
  }
});

// ============================================
// TODAS LAS RUTAS SIGUIENTES REQUIEREN AUTENTICACIÓN
// ============================================
router.use(requireAdmin);

// Suscripciones Web Push del dispositivo administrador actual
router.post('/web-push-subscription', async (req, res) => {
  try {
    const { subscription, platform } = req.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({
        error: 'Suscripción Web Push inválida. Se requiere endpoint y keys.',
      });
    }

    await Admin.updateOne(
      { _id: req.admin._id },
      { $pull: { webPushSubscriptions: { endpoint: subscription.endpoint } } }
    );
    await Admin.updateOne(
      { _id: req.admin._id },
      {
        $push: {
          webPushSubscriptions: {
            $each: [{
              endpoint: subscription.endpoint,
              keys: subscription.keys,
              platform: platform || 'web',
              updatedAt: new Date(),
            }],
            $slice: -5,
          },
        },
      }
    );

    res.json({ success: true, message: 'Suscripción Web Push registrada' });
  } catch (error) {
    console.error('❌ Error guardando Web Push de admin:', error);
    res.status(500).json({ error: 'Error al guardar suscripción' });
  }
});

router.delete('/web-push-subscription', async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    const update = endpoint
      ? { $pull: { webPushSubscriptions: { endpoint } } }
      : { $set: { webPushSubscriptions: [] } };

    await Admin.updateOne({ _id: req.admin._id }, update);
    res.json({ success: true, message: 'Suscripción Web Push eliminada' });
  } catch (error) {
    console.error('❌ Error eliminando Web Push de admin:', error);
    res.status(500).json({ error: 'Error al eliminar suscripción' });
  }
});

// ============================================
// DASHBOARD - ESTADÍSTICAS GENERALES
// ============================================

/**
 * GET /api/admin/stats
 * Obtiene KPIs del dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalClients,
      totalDrivers,
      activeDrivers,
      approvedDrivers,
      pendingReviewDrivers,
      pendingDocumentsDrivers,
      rejectedDrivers,
      totalServices,
      pendingServices,
      quotedServices,
      completedServices,
      acceptedServices,
      inProgressServices,
      cancelledServices
    ] = await Promise.all([
      User.countDocuments({ userType: 'client' }),
      User.countDocuments({ userType: 'driver' }),
      User.countDocuments({ 
        userType: 'driver', 
        'driverProfile.isOnline': true,
        'driverProfile.status': 'approved'
      }),
      User.countDocuments({ 
        userType: 'driver', 
        'driverProfile.status': 'approved' 
      }),
      User.countDocuments({ 
        userType: 'driver', 
        'driverProfile.status': 'pending_review' 
      }),
      User.countDocuments({
        userType: 'driver',
        'driverProfile.status': 'pending_documents'
      }),
      User.countDocuments({ 
        userType: 'driver', 
        'driverProfile.status': 'rejected' 
      }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'quoted' }),
      Request.countDocuments({ status: 'completed' }),
      Request.countDocuments({ status: 'accepted' }),
      Request.countDocuments({ status: 'in_progress' }),
      Request.countDocuments({ status: 'cancelled' })
    ]);

    // Calcular ingresos totales (suma de todos los servicios completados)
    const revenueResult = await Request.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Calcular ganancias de la plataforma (10% de comisión)
    const platformEarnings = Math.round(totalRevenue * 0.10);

    // Calcular rating promedio de conductores
    const ratingResult = await User.aggregate([
      { $match: { userType: 'driver', 'driverProfile.status': 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$driverProfile.rating' } } }
    ]);

    const avgRating = ratingResult.length > 0 ? ratingResult[0].avgRating : 0;

    res.json({
      clients: {
        total: totalClients
      },
      drivers: {
        total: totalDrivers,
        active: activeDrivers,
        approved: approvedDrivers,
        pending: pendingReviewDrivers + pendingDocumentsDrivers,
        pendingReview: pendingReviewDrivers,
        pendingDocuments: pendingDocumentsDrivers,
        rejected: rejectedDrivers
      },
      services: {
        total: totalServices,
        pending: pendingServices,
        quoted: quotedServices,
        completed: completedServices,
        accepted: acceptedServices,
        inProgress: inProgressServices,
        active: acceptedServices + inProgressServices,
        cancelled: cancelledServices
      },
      revenue: {
        total: totalRevenue,
        platformEarnings: platformEarnings
      },
      rating: {
        average: Math.round(avgRating * 10) / 10
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo stats:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      details: error.message 
    });
  }
});

/**
 * GET /api/admin/services/active
 * Obtiene servicios activos en tiempo real
 */
router.get('/services/active', async (req, res) => {
  try {
    const activeServices = await Request.find({
      status: { $in: ['accepted', 'in_progress'] }
    })
    .populate('clientId', 'name phone')
    .populate('assignedDriverId', 'name phone driverProfile.isOnline')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    res.json({
      active: activeServices
    });

  } catch (error) {
    console.error('❌ Error obteniendo servicios activos:', error);
    res.status(500).json({ error: 'Error al obtener servicios activos' });
  }
});

// ============================================
// GESTIÓN DE CONDUCTORES
// ============================================

/**
 * GET /api/admin/drivers
 * Lista todos los conductores con filtros
 */
router.get('/drivers', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query = { userType: 'driver' };
    
    // Filtro por estado
    if (status && status !== 'all') {
      query['driverProfile.status'] = status;
    }
    
    // Búsqueda por nombre o teléfono
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const drivers = await User.find(query)
      .select('-password -otp')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      drivers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo conductores:', error);
    res.status(500).json({ error: 'Error al obtener conductores' });
  }
});

/**
 * GET /api/admin/drivers/:id
 * Detalle completo de un conductor
 */
router.get('/drivers/:id', async (req, res) => {
  try {
    const driver = await User.findOne({
      _id: req.params.id,
      userType: 'driver'
    }).select('-password -otp');

    if (!driver) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Obtener servicios del conductor
    const services = await Request.find({ assignedDriverId: driver._id })
      .populate('clientId', 'name phone')
      .select('status totalAmount createdAt origin destination')
      .limit(20)
      .sort({ createdAt: -1 });

    res.json({
      driver,
      services: {
        list: services,
        total: await Request.countDocuments({ assignedDriverId: driver._id }),
        completed: await Request.countDocuments({ assignedDriverId: driver._id, status: 'completed' })
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo detalle conductor:', error);
    res.status(500).json({ error: 'Error al obtener detalle' });
  }
});

/**
 * PUT /api/admin/drivers/:id
 * Actualiza únicamente los datos de grúa y capacidades editables por administración.
 */
router.put('/drivers/:id', async (req, res) => {
  try {
    const driver = await User.findOne({
      _id: req.params.id,
      userType: 'driver',
    });

    if (!driver) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    const towTruckInput = req.body.towTruck === undefined ? req.body : req.body.towTruck;
    if (!towTruckInput || typeof towTruckInput !== 'object' || Array.isArray(towTruckInput)) {
      return res.status(400).json({ error: 'towTruck debe ser un objeto' });
    }

    const hasCapabilities = Object.prototype.hasOwnProperty.call(req.body, 'vehicleCapabilities');
    const editableTowTruckFields = ['truckType', ...TOW_TRUCK_TEXT_FIELDS, 'licensePlate'];
    const hasTowTruckUpdate = editableTowTruckFields.some(
      field => Object.prototype.hasOwnProperty.call(towTruckInput, field)
    );

    if (!hasTowTruckUpdate && !hasCapabilities) {
      return res.status(400).json({
        error: 'Debes enviar al menos un dato editable de la grúa o vehicleCapabilities',
      });
    }

    if (!driver.driverProfile.towTruck) {
      driver.driverProfile.towTruck = {};
    }
    const towTruck = driver.driverProfile.towTruck;

    if (Object.prototype.hasOwnProperty.call(towTruckInput, 'truckType')) {
      if (!TRUCK_TYPES.has(towTruckInput.truckType)) {
        return res.status(400).json({
          error: 'truckType no válido',
          allowedTruckTypes: Array.from(TRUCK_TYPES),
        });
      }
      towTruck.truckType = towTruckInput.truckType;
    }

    for (const field of TOW_TRUCK_TEXT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(towTruckInput, field)) {
        towTruck[field] = normalizeOptionalText(towTruckInput[field], field);
      }
    }

    if (Object.prototype.hasOwnProperty.call(towTruckInput, 'licensePlate')) {
      if (typeof towTruckInput.licensePlate !== 'string') {
        return res.status(400).json({ error: 'licensePlate debe ser texto' });
      }
      const licensePlate = towTruckInput.licensePlate.toUpperCase().replace(/[\s-]/g, '');
      if (!LICENSE_PLATE_REGEX.test(licensePlate)) {
        return res.status(400).json({
          error: 'La placa debe tener el formato ABC123 o ABC12D',
        });
      }
      towTruck.licensePlate = licensePlate;
    }

    if (hasCapabilities) {
      const capabilities = req.body.vehicleCapabilities;
      if (
        !Array.isArray(capabilities)
        || capabilities.some(capability => !VEHICLE_CAPABILITIES.has(capability))
      ) {
        return res.status(400).json({
          error: 'vehicleCapabilities contiene valores no válidos',
          allowedCapabilities: Array.from(VEHICLE_CAPABILITIES),
        });
      }
      driver.driverProfile.vehicleCapabilities = [...new Set(capabilities)];
    }

    await driver.save();

    res.json({
      message: 'Datos del conductor actualizados exitosamente',
      driver: {
        id: driver._id,
        name: driver.name,
        status: driver.driverProfile.status,
        towTruck: driver.driverProfile.towTruck,
        vehicleCapabilities: driver.driverProfile.vehicleCapabilities,
      },
    });
  } catch (error) {
    console.error('❌ Error actualizando conductor:', error);
    res.status(error.status || 500).json({
      error: error.status ? error.message : 'Error al actualizar conductor',
    });
  }
});

/**
 * PUT /api/admin/drivers/:id/approve
 * Aprobar un conductor
 */
router.put('/drivers/:id/approve', async (req, res) => {
  try {
    const driver = await User.findOne({
      _id: req.params.id,
      userType: 'driver'
    });

    if (!driver) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    if (
      driver.driverProfile.status !== 'pending_review'
      || !driver.isReadyForApproval()
    ) {
      return res.status(400).json({
        error: 'El conductor debe completar documentos, foto, capacidades y datos de la grúa antes de ser aprobado',
      });
    }

    driver.driverProfile.status = 'approved';
    driver.driverProfile.rejectionReason = undefined;
    await driver.save();
    global.io?.to('admin:ops').emit('admin:driver-status-changed', {
      driverId: driver._id.toString(),
      name: driver.name,
      status: driver.driverProfile.status,
    });

    console.log(`✅ Conductor ${req.params.id} APROBADO por ${req.admin.email}`);

    // 🆕 NOTIFICACIÓN EN TIEMPO REAL: Emitir evento Socket.IO
    if (global.io) {
      global.io.to(`driver:${driver._id}`).emit('account:approved', {
        status: 'approved',
        message: '¡Tu cuenta ha sido aprobada! Ya puedes empezar a recibir servicios.',
        timestamp: new Date()
      });
      console.log(`📡 Evento Socket.IO enviado a driver:${driver._id}`);
    }

    // 🆕 PUSH NOTIFICATION: Enviar notificación Firebase (si tiene token)
    if (driver.driverProfile.fcmToken) {
      try {
        await notifyAccountApproved(driver.driverProfile.fcmToken);
        console.log(`📱 Push notification enviada a ${driver.name}`);
      } catch (error) {
        console.error('⚠️ Error enviando push notification:', error.message);
      }
    }

    // 🆕 EMAIL AL CONDUCTOR: Notificar que fue aprobado (si tiene email)
    if (driver.email) {
      notifyDriverApproved({ name: driver.name, email: driver.email })
        .catch(err => console.warn('⚠️ Email aprobación no enviado:', err.message));
    }

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
    res.status(500).json({ error: 'Error al aprobar conductor' });
  }
});

/**
 * PUT /api/admin/drivers/:id/reject
 * Rechazar un conductor
 */
router.put('/drivers/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'La razón del rechazo es requerida' });
    }

    const driver = await User.findOne({
      _id: req.params.id,
      userType: 'driver'
    });

    if (!driver) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    driver.driverProfile.status = 'rejected';
    driver.driverProfile.rejectionReason = reason;
    await driver.save();
    global.io?.to('admin:ops').emit('admin:driver-status-changed', {
      driverId: driver._id.toString(),
      name: driver.name,
      status: driver.driverProfile.status,
    });

    console.log(`❌ Conductor ${req.params.id} RECHAZADO por ${req.admin.email}: ${reason}`);

    // 🆕 NOTIFICACIÓN EN TIEMPO REAL: Emitir evento Socket.IO
    if (global.io) {
      global.io.to(`driver:${driver._id}`).emit('account:rejected', {
        status: 'rejected',
        reason: reason,
        message: 'Tu cuenta ha sido rechazada.',
        timestamp: new Date()
      });
      console.log(`📡 Evento Socket.IO de rechazo enviado a driver:${driver._id}`);
    }

    // 🆕 PUSH NOTIFICATION: Enviar notificación Firebase (si tiene token)
    if (driver.driverProfile.fcmToken) {
      try {
        await notifyAccountRejected(driver.driverProfile.fcmToken, reason);
        console.log(`📱 Push notification de rechazo enviada a ${driver.name}`);
      } catch (error) {
        console.error('⚠️ Error enviando push notification:', error.message);
        // No fallar si la notificación push falla
      }
    }

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
    res.status(500).json({ error: 'Error al rechazar conductor' });
  }
});

/**
 * PUT /api/admin/drivers/:id/suspend
 * Suspender un conductor
 */
router.put('/drivers/:id/suspend', async (req, res) => {
  try {
    const { reason } = req.body;

    const driver = await User.findOne({
      _id: req.params.id,
      userType: 'driver'
    });

    if (!driver) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    driver.driverProfile.status = 'suspended';
    driver.driverProfile.isOnline = false;
    driver.driverProfile.rejectionReason = reason || 'Suspendido por administración';
    await driver.save();
    global.io?.to('admin:ops').emit('admin:driver-status-changed', {
      driverId: driver._id.toString(),
      name: driver.name,
      status: driver.driverProfile.status,
    });

    console.log(`🔒 Conductor ${req.params.id} SUSPENDIDO por ${req.admin.email}`);

    res.json({
      message: 'Conductor suspendido exitosamente',
      driver: {
        id: driver._id,
        name: driver.name,
        status: driver.driverProfile.status
      }
    });

  } catch (error) {
    console.error('❌ Error suspendiendo conductor:', error);
    res.status(500).json({ error: 'Error al suspender conductor' });
  }
});

/**
 * POST /api/admin/drivers/:id/notes
 * Agregar notas administrativas a un conductor
 */
router.post('/drivers/:id/notes', async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ error: 'Las notas son requeridas' });
    }

    const driver = await User.findOne({
      _id: req.params.id,
      userType: 'driver'
    });

    if (!driver) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    const timestamp = new Date().toISOString();
    const note = `[${timestamp}] ${req.admin.name}: ${notes}`;
    
    driver.driverProfile.adminNotes = driver.driverProfile.adminNotes 
      ? `${driver.driverProfile.adminNotes}\n${note}`
      : note;
    
    await driver.save();

    res.json({
      message: 'Notas agregadas exitosamente',
      notes: driver.driverProfile.adminNotes
    });

  } catch (error) {
    console.error('❌ Error agregando notas:', error);
    res.status(500).json({ error: 'Error al agregar notas' });
  }
});

/**
 * PUT /api/admin/drivers/:id/activate
 * Activar un conductor (revertir suspensión/rechazo)
 */
router.put('/drivers/:id/activate', async (req, res) => {
  try {
    const driver = await User.findOne({
      _id: req.params.id,
      userType: 'driver'
    });

    if (!driver) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    if (
      driver.driverProfile.status === 'rejected'
      && !driver.isReadyForApproval()
    ) {
      return res.status(400).json({
        error: 'Completa los documentos, capacidades y datos de la grúa antes de activar al conductor',
      });
    }

    driver.driverProfile.status = 'approved';
    driver.driverProfile.rejectionReason = undefined;
    await driver.save();
    global.io?.to('admin:ops').emit('admin:driver-status-changed', {
      driverId: driver._id.toString(),
      name: driver.name,
      status: driver.driverProfile.status,
    });

    console.log(`✅ Conductor ${req.params.id} ACTIVADO por ${req.admin.email}`);

    res.json({
      message: 'Conductor activado exitosamente',
      driver: {
        id: driver._id,
        name: driver.name,
        status: driver.driverProfile.status
      }
    });

  } catch (error) {
    console.error('❌ Error activando conductor:', error);
    res.status(500).json({ error: 'Error al activar conductor' });
  }
});

/**
 * DELETE /api/admin/drivers/:id
 * Eliminar un conductor permanentemente
 */
router.delete('/drivers/:id', async (req, res) => {
  try {
    const driver = await User.findOne({
      _id: req.params.id,
      userType: 'driver'
    });

    if (!driver) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Borra servicios donde este conductor quedó asignado.
    // En solicitudes ajenas solo se quita su cotización, para no borrar pedidos reales.
    await Request.deleteMany({
      $or: [
        { assignedDriverId: driver._id },
        { driverId: driver._id },
      ],
    });
    await Request.updateMany(
      { 'quotes.driverId': driver._id },
      { $pull: { quotes: { driverId: driver._id } } }
    );

    await User.deleteOne({ _id: driver._id });

    console.log(`🗑️ Conductor ${req.params.id} ELIMINADO permanentemente por ${req.admin.email}`);

    res.json({
      message: 'Conductor eliminado exitosamente',
      deletedDriver: {
        id: driver._id,
        name: driver.name
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando conductor:', error);
    res.status(500).json({ error: 'Error al eliminar conductor' });
  }
});

// ============================================
// GESTIÓN DE CLIENTES
// ============================================

/**
 * GET /api/admin/clients
 * Lista todos los clientes con filtros
 */
router.get('/clients', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query = { userType: 'client' };
    
    // Filtro por estado
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }
    
    // Búsqueda por nombre, teléfono o email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await User.find(query)
      .select('-password -otp')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Agregar conteos de servicios y vehículos
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        const [totalRequests, completedRequests, vehicleCount] = await Promise.all([
          Request.countDocuments({ clientId: client._id }),
          Request.countDocuments({ clientId: client._id, status: 'completed' }),
          client.vehicles?.length || 0
        ]);

        return {
          ...client,
          totalRequests,
          completedRequests,
          vehicleCount
        };
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      clients: clientsWithStats,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

/**
 * GET /api/admin/clients/:id
 * Detalle completo de un cliente
 */
router.get('/clients/:id', async (req, res) => {
  try {
    const client = await User.findOne({
      _id: req.params.id,
      userType: 'client'
    }).select('-password -otp');

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Obtener servicios del cliente
    const [services, totalServices, completedServices, cancelledServices, activeServices] = await Promise.all([
      Request.find({ clientId: client._id })
        .populate('assignedDriverId', 'name phone')
        .select('status totalAmount createdAt origin destination rating vehicleSnapshot completedAt assignedDriverId')
        .limit(50)
        .sort({ createdAt: -1 }),
      Request.countDocuments({ clientId: client._id }),
      Request.countDocuments({ clientId: client._id, status: 'completed' }),
      Request.countDocuments({ clientId: client._id, status: 'cancelled' }),
      Request.countDocuments({ clientId: client._id, status: 'in_progress' })
    ]);

    res.json({
      client,
      services: {
        list: services,
        total: totalServices,
        completed: completedServices,
        cancelled: cancelledServices,
        active: activeServices
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo detalle cliente:', error);
    res.status(500).json({ error: 'Error al obtener detalle' });
  }
});

/**
 * PUT /api/admin/clients/:id/suspend
 * Suspender un cliente
 */
router.put('/clients/:id/suspend', async (req, res) => {
  try {
    const { reason } = req.body;

    const client = await User.findOne({
      _id: req.params.id,
      userType: 'client'
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    client.isActive = false;
    client.suspensionReason = reason || 'Suspendido por administración';
    await client.save();

    console.log(`🔒 Cliente ${req.params.id} SUSPENDIDO por ${req.admin.email}`);

    res.json({
      message: 'Cliente suspendido exitosamente',
      client: {
        id: client._id,
        name: client.name,
        isActive: client.isActive
      }
    });

  } catch (error) {
    console.error('❌ Error suspendiendo cliente:', error);
    res.status(500).json({ error: 'Error al suspender cliente' });
  }
});

/**
 * PUT /api/admin/clients/:id/activate
 * Activar un cliente
 */
router.put('/clients/:id/activate', async (req, res) => {
  try {
    const client = await User.findOne({
      _id: req.params.id,
      userType: 'client'
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    client.isActive = true;
    client.suspensionReason = undefined;
    await client.save();

    console.log(`✅ Cliente ${req.params.id} ACTIVADO por ${req.admin.email}`);

    res.json({
      message: 'Cliente activado exitosamente',
      client: {
        id: client._id,
        name: client.name,
        isActive: client.isActive
      }
    });

  } catch (error) {
    console.error('❌ Error activando cliente:', error);
    res.status(500).json({ error: 'Error al activar cliente' });
  }
});

/**
 * DELETE /api/admin/clients/:id
 * Eliminar un cliente permanentemente
 */
router.delete('/clients/:id', async (req, res) => {
  try {
    const client = await User.findOne({
      _id: req.params.id,
      userType: 'client'
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Eliminar servicios asociados
    await Request.deleteMany({ clientId: client._id });

    // Eliminar cliente
    await User.deleteOne({ _id: client._id });

    console.log(`🗑️ Cliente ${req.params.id} ELIMINADO permanentemente por ${req.admin.email}`);

    res.json({
      message: 'Cliente eliminado exitosamente',
      deletedClient: {
        id: client._id,
        name: client.name
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

// ============================================
// GESTIÓN DE SERVICIOS
// ============================================

/**
 * GET /api/admin/services
 * Lista todos los servicios con filtros y paginación
 */
router.get('/services', async (req, res) => {
  try {
    const { status, search, clientId, driverId, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = {};
    
    // Filtro por estado
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filtro por cliente específico
    if (clientId) {
      query.clientId = clientId;
    }
    
    // Filtro por conductor específico
    if (driverId) {
      query.assignedDriverId = driverId;
    }
    
    // Búsqueda por ID de servicio o dirección
    if (search) {
      query.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { 'origin.address': { $regex: search, $options: 'i' } },
        { 'destination.address': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const services = await Request.find(query)
      .populate('clientId', 'name phone email')
      .populate('assignedDriverId', 'name phone driverProfile.rating')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Request.countDocuments(query);

    // Calcular estadísticas generales
    const [
      totalServices,
      completedServices,
      acceptedServices,
      inProgressServices,
      cancelledServices,
      pendingServices
    ] = await Promise.all([
      Request.countDocuments(),
      Request.countDocuments({ status: 'completed' }),
      Request.countDocuments({ status: 'accepted' }),
      Request.countDocuments({ status: 'in_progress' }),
      Request.countDocuments({ status: 'cancelled' }),
      Request.countDocuments({ status: { $in: ['pending', 'quoted'] } })
    ]);

    res.json({
      services,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      },
      stats: {
        total: totalServices,
        completed: completedServices,
        accepted: acceptedServices,
        inProgress: inProgressServices,
        active: acceptedServices + inProgressServices,
        cancelled: cancelledServices,
        pending: pendingServices
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

/**
 * GET /api/admin/services/:id
 * Detalle completo de un servicio
 */
router.get('/services/:id', async (req, res) => {
  try {
    const service = await Request.findById(req.params.id)
      .populate('clientId', 'name phone email vehicles')
      .populate('assignedDriverId', 'name phone email driverProfile')
      .populate('quotes.driverId', 'name phone driverProfile.rating')
      .lean();

    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Calcular duración del servicio si está completado
    let serviceDuration = null;
    if (service.completedAt && service.acceptedAt) {
      const duration = new Date(service.completedAt) - new Date(service.acceptedAt);
      serviceDuration = Math.floor(duration / 1000 / 60); // en minutos
    }

    res.json({
      service: {
        ...service,
        serviceDuration
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo detalle servicio:', error);
    res.status(500).json({ error: 'Error al obtener detalle' });
  }
});

// ============================================
// REPORTES Y ANALÍTICAS
// ============================================

/**
 * GET /api/admin/reports/revenue
 * Datos históricos reales agrupados por periodo
 * Query params: period = week | month | quarter | year
 */
router.get('/reports/revenue', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate;
    let groupFormat;

    // Determinar rango de fechas y agrupación según periodo
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        groupFormat = '%Y-%m-%d'; // Agrupado por día
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 2);
        startDate.setDate(1);
        groupFormat = '%Y-%m'; // Agrupado por mes
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupFormat = '%Y-%m'; // Agrupado por mes
        break;
      case 'month':
      default:
        startDate = new Date(now);
        startDate.setDate(1);
        groupFormat = '%Y-%m-%d'; // Agrupado por día
        break;
    }

    // Servicios completados agrupados por fecha (para gráfico de ingresos y servicios)
    const revenueByPeriod = await Request.aggregate([
      { $match: { status: 'completed' } },
      { $addFields: { reportDate: { $ifNull: ['$completedAt', '$createdAt'] } } },
      {
        $match: {
          reportDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$reportDate', timezone: 'America/Bogota' } },
          ingresos: { $sum: '$totalAmount' },
          completados: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Servicios cancelados agrupados por fecha
    const cancelledByPeriod = await Request.aggregate([
      { $match: { status: 'cancelled' } },
      { $addFields: { reportDate: { $ifNull: ['$cancelledAt', '$createdAt'] } } },
      {
        $match: {
          reportDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$reportDate', timezone: 'America/Bogota' } },
          cancelados: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Combinar completados y cancelados en un solo array por fecha
    const cancelledMap = {};
    cancelledByPeriod.forEach(d => { cancelledMap[d._id] = d.cancelados; });

    const chartData = revenueByPeriod.map(d => ({
      name: d._id,
      ingresos: d.ingresos,
      completados: d.completados,
      cancelados: cancelledMap[d._id] || 0
    }));

    // Categorías de vehículos en servicios completados del periodo
    const vehicleCategories = await Request.aggregate([
      { $match: { status: 'completed' } },
      { $addFields: { reportDate: { $ifNull: ['$completedAt', '$createdAt'] } } },
      {
        $match: {
          reportDate: { $gte: startDate },
          'vehicleSnapshot.categoryId': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$vehicleSnapshot.category',
          value: { $sum: 1 }
        }
      },
      { $sort: { value: -1 } }
    ]);

    const vehicleCategoryData = vehicleCategories
      .filter(c => c._id)
      .map(c => ({ name: c._id, value: c.value }));

    // Top conductores del periodo
    const topDrivers = await Request.aggregate([
      { $match: { status: 'completed' } },
      { $addFields: { reportDate: { $ifNull: ['$completedAt', '$createdAt'] } } },
      {
        $match: {
          reportDate: { $gte: startDate },
          assignedDriverId: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$assignedDriverId',
          servicios: { $sum: 1 },
          ingresos: { $sum: '$totalAmount' }
        }
      },
      { $sort: { servicios: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'driver'
        }
      },
      { $unwind: '$driver' },
      {
        $project: {
          name: '$driver.name',
          phone: '$driver.phone',
          servicios: 1,
          ingresos: 1
        }
      }
    ]);

    // Totales del periodo
    const periodTotals = await Request.aggregate([
      {
        $addFields: {
          reportDate: {
            $ifNull: ['$completedAt', { $ifNull: ['$cancelledAt', '$createdAt'] }]
          }
        }
      },
      { $match: { reportDate: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalIngresos: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] }
          },
          completados: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelados: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      }
    ]);

    const totals = periodTotals[0] || { totalIngresos: 0, completados: 0, cancelados: 0, total: 0 };

    res.json({
      period,
      startDate,
      chartData,
      vehicleCategoryData: vehicleCategoryData.length > 0 ? vehicleCategoryData : [
        { name: 'Sin datos', value: 1 }
      ],
      topDrivers,
      totals: {
        ingresos: totals.totalIngresos,
        ganancias: Math.round(totals.totalIngresos * 0.10),
        conductores: totals.totalIngresos - Math.round(totals.totalIngresos * 0.10),
        completados: totals.completados,
        cancelados: totals.cancelados,
        total: totals.total
      }
    });

  } catch (error) {
    console.error('❌ Error generando reporte de ingresos:', error);
    res.status(500).json({ error: 'Error al generar reporte', details: error.message });
  }
});

/**
 * GET /api/admin/reports/export
 * Exporta los servicios del periodo como JSON descargable (CSV generado en frontend)
 * Query params: period = week | month | quarter | year
 */
router.get('/reports/export', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now); startDate.setDate(now.getDate() - 6); break;
      case 'quarter':
        startDate = new Date(now); startDate.setMonth(now.getMonth() - 2); startDate.setDate(1); break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1); break;
      default: // month
        startDate = new Date(now); startDate.setDate(1); break;
    }

    const services = await Request.find({
      createdAt: { $gte: startDate }
    })
      .populate('clientId', 'name phone email')
      .populate('assignedDriverId', 'name phone')
      .select('status totalAmount createdAt completedAt origin destination vehicleSnapshot clientId assignedDriverId')
      .sort({ createdAt: -1 })
      .lean();

    // Construir CSV en el backend
    const header = 'ID,Fecha,Estado,Cliente,Conductor,Origen,Destino,Vehículo,Monto\n';
    const rows = services.map(s => {
      const fecha = new Date(s.createdAt).toLocaleDateString('es-CO');
      const estadoMap = {
        completed: 'Completado', cancelled: 'Cancelado',
        in_progress: 'En curso', pending: 'Pendiente',
        accepted: 'Aceptado', quoted: 'Cotizado'
      };
      return [
        s._id.toString().slice(-6),
        fecha,
        estadoMap[s.status] || s.status,
        s.clientId?.name || 'N/A',
        s.assignedDriverId?.name || 'Sin asignar',
        `"${(s.origin?.address || '').replace(/"/g, "'")}"`,
        `"${(s.destination?.address || 'Sin destino').replace(/"/g, "'")}"`,
        `"${s.vehicleSnapshot?.category || ''} ${s.vehicleSnapshot?.brand || ''}"`,
        s.totalAmount || 0
      ].join(',');
    }).join('\n');

    const csv = header + rows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="desvare-reporte-${period}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csv); // BOM para que Excel lo abra correctamente

  } catch (error) {
    console.error('❌ Error exportando reporte:', error);
    res.status(500).json({ error: 'Error al exportar reporte' });
  }
});

// GET /api/admin/services/:id/chat — Historial del chat del servicio para auditoría
router.get('/services/:id/chat', requireAdmin, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ requestId: req.params.id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ messages });
  } catch (error) {
    console.error('❌ Error obteniendo chat para admin:', error);
    res.status(500).json({ error: 'Error obteniendo historial de chat' });
  }
});

module.exports = router;

