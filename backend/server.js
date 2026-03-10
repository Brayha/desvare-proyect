require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { notifyNewRequest, notifyQuoteAccepted } = require('./services/notifications');

const app = express();
const server = http.createServer(app);

// Configuración de CORS
// Soporta múltiples URLs separadas por coma en las variables de entorno
const getAllowedOrigins = () => {
  const origins = [];
  
  // CLIENT_URL puede tener múltiples URLs separadas por coma
  if (process.env.CLIENT_URL) {
    origins.push(...process.env.CLIENT_URL.split(',').map(url => url.trim()));
  } else {
    origins.push('http://localhost:5173', 'http://localhost:5175');
  }
  
  // DRIVER_URL puede tener múltiples URLs separadas por coma
  if (process.env.DRIVER_URL) {
    origins.push(...process.env.DRIVER_URL.split(',').map(url => url.trim()));
  } else {
    origins.push('http://localhost:8100', 'http://localhost:5174');
  }
  
  // ADMIN_URL puede tener múltiples URLs separadas por coma
  if (process.env.ADMIN_URL) {
    origins.push(...process.env.ADMIN_URL.split(',').map(url => url.trim()));
  } else {
    origins.push('http://localhost:5176');
  }
  
  return origins;
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true
};

app.use(cors(corsOptions));
// Aumentar límite para soportar imágenes en base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuración de Socket.IO
const io = new Server(server, {
  cors: corsOptions
});

// 🆕 EXPORTAR io para usarlo en las rutas
global.io = io;

// Importar rutas
const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const citiesRoutes = require('./routes/cities');
const adminRoutes = require('./routes/admin');

// Importar middleware de expiración
const { startExpirationChecker } = require('./middleware/requestExpiration');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/admin', adminRoutes);

// Proxy para Google Places API (evitar CORS en frontend)
app.get('/api/google-places-proxy', async (req, res) => {
  try {
    // Construir URL según el tipo de endpoint
    let googleUrl;
    
    if (req.query.place_id) {
      // Es una petición de Place Details
      const params = new URLSearchParams(req.query);
      googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
    } else {
      // Es una petición de Autocomplete
      const params = new URLSearchParams(req.query);
      googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
    }
    
    console.log('🔍 Proxy Google Places:', googleUrl.split('?')[0]);
    
    // Usar fetch nativo de Node.js (disponible en Node 18+)
    const response = await fetch(googleUrl);
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('❌ Error de Google Places:', data.status, data.error_message);
    }
    
    res.json(data);
  } catch (error) {
    console.error('❌ Error en proxy de Google Places:', error);
    res.status(500).json({ 
      error: 'Error al consultar Google Places API',
      status: 'ERROR' 
    });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Desvare Backend API funcionando correctamente' });
});

// Conexión a MongoDB con opciones de timeout mejoradas
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // 30 segundos para seleccionar servidor
  socketTimeoutMS: 45000, // 45 segundos para operaciones de socket
})
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
    // Iniciar verificador de expiración cada 30 minutos
    startExpirationChecker(30);
  })
  .catch((err) => console.error('❌ Error conectando a MongoDB:', err));

// Socket.IO - Manejo de conexiones en tiempo real
const connectedDrivers = new Map(); // Almacena { driverId: { socketId, isOnline } }
const connectedClients = new Map(); // Almacena socket.id de clientes conectados
const activeServices = new Map(); // Almacena { requestId: { clientId, driverId, clientSocketId, driverSocketId } }

// 🆕 EXPORTAR para usarlo en las rutas
global.connectedClients = connectedClients;
global.connectedDrivers = connectedDrivers;
global.activeServices = activeServices;

io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado:', socket.id);

  // Registro de conductor
  socket.on('driver:register', async (driverId) => {
    try {
      // Obtener info del conductor desde BD
      const User = require('./models/User');
      const driver = await User.findById(driverId);
      
      if (driver && driver.userType === 'driver') {
        const isOnline = driver.driverProfile?.isOnline || false;
        
        connectedDrivers.set(driverId, {
          socketId: socket.id,
          isOnline: isOnline
        });
        
        console.log(`🚗 Conductor registrado: ${driverId} - Estado: ${isOnline ? '🟢 ACTIVO' : '🔴 OCUPADO'}`);
        
        socket.join('drivers'); // Unirse a la sala general de conductores
        socket.join(`driver:${driverId}`); // Unirse a sala personal del conductor
        
        // Solo unirse a 'active-drivers' si está activo
        if (isOnline) {
          socket.join('active-drivers');
          console.log(`✅ Conductor ${driverId} unido a sala de conductores activos`);
        }
      }
    } catch (error) {
      console.error('❌ Error registrando conductor:', error);
    }
  });
  
  // Actualizar estado de disponibilidad del conductor
  socket.on('driver:availability-changed', ({ driverId, isOnline }) => {
    const driverData = connectedDrivers.get(driverId);
    if (driverData) {
      driverData.isOnline = isOnline;
      connectedDrivers.set(driverId, driverData);
      
      // Manejar salas de Socket.IO
      if (isOnline) {
        socket.join('active-drivers');
        console.log(`🟢 Conductor ${driverId} ahora ACTIVO - Agregado a sala active-drivers`);
      } else {
        socket.leave('active-drivers');
        console.log(`🔴 Conductor ${driverId} ahora OCUPADO - Removido de sala active-drivers`);
      }
    }
  });

  // Registro de cliente
  socket.on('client:register', async (clientId) => {
    connectedClients.set(clientId, socket.id);
    console.log(`👤 Cliente registrado: ${clientId} (socketId: ${socket.id})`);

    // Reconstruir activeServices si el cliente tiene un servicio en curso
    // Esto resuelve el problema cuando el backend se reinicia o el cliente reconecta
    try {
      const Request = require('./models/Request');
      const activeRequest = await Request.findOne({
        'trackingData.clientId': clientId,
        'trackingData.isActive': true,
        status: { $in: ['accepted', 'in_progress'] }
      }).select('_id trackingData assignedDriverId');

      if (activeRequest) {
        const requestId = activeRequest._id.toString();
        const driverId = activeRequest.trackingData.driverId || activeRequest.assignedDriverId?.toString();
        const existingService = activeServices.get(requestId);

        // Actualizar o crear entrada en activeServices con el nuevo socketId del cliente
        activeServices.set(requestId, {
          clientId: clientId,
          driverId: driverId,
          clientSocketId: socket.id,
          driverSocketId: existingService?.driverSocketId || connectedDrivers.get(driverId)?.socketId || null
        });

        console.log(`🔄 activeServices reconstruido para servicio ${requestId} (cliente reconectó)`);
      }
    } catch (err) {
      console.error('❌ Error reconstruyendo activeServices al registrar cliente:', err.message);
    }
  });

  // Cliente solicita cotización
  socket.on('request:new', async (data) => {
    console.log('📢 Nueva solicitud de cotización recibida');
    console.log('📦 Datos completos:', JSON.stringify(data, null, 2));
    
    const activeDriversCount = io.sockets.adapter.rooms.get('active-drivers')?.size || 0;
    const totalDriversCount = io.sockets.adapter.rooms.get('drivers')?.size || 0;
    
    console.log(`🚗 Conductores totales conectados: ${totalDriversCount}`);
    console.log(`🟢 Conductores ACTIVOS: ${activeDriversCount}`);
    
    // Helper para obtener icono según categoría
    const getCategoryIcon = (categoryId) => {
      const icons = {
        'MOTOS': '🏍️',
        'AUTOS': '🚗',
        'CAMIONETAS': '🚙',
        'CAMIONES': '🚚',
        'BUSES': '🚌'
      };
      return icons[categoryId] || '🚗';
    };
    
    // Enviar SOLO a conductores activos (isOnline = true) con datos completos del vehículo
    io.to('active-drivers').emit('request:received', {
      requestId: data.requestId,
      clientId: data.clientId,
      clientName: data.clientName,
      origin: data.origin,
      destination: data.destination,
      distance: data.distance,
      duration: data.duration,
      // ✅ Datos básicos del vehículo (para compatibilidad)
      vehicle: data.vehicleSnapshot ? {
        category: data.vehicleSnapshot.category?.name || 'N/A',
        brand: data.vehicleSnapshot.brand?.name || 'N/A',
        model: data.vehicleSnapshot.model?.name || 'N/A',
        licensePlate: data.vehicleSnapshot.licensePlate || 'N/A',
        icon: getCategoryIcon(data.vehicleSnapshot.category?.id)
      } : null,
      // ✅ NUEVO: Snapshot completo del vehículo (con truckData y busData)
      vehicleSnapshot: data.vehicleSnapshot,
      // ✅ NUEVO: Detalles completos del servicio (problema, sótano, carga actual)
      serviceDetails: data.serviceDetails,
      // ✅ Problema (para compatibilidad)
      problem: data.serviceDetails?.problem || 'Sin descripción',
      // Distancia y tiempo formateados
      distanceKm: (data.distance / 1000).toFixed(1),
      durationMin: Math.round(data.duration / 60),
      timestamp: new Date()
    });
    
    console.log(`✅ Solicitud emitida a ${activeDriversCount} conductores ACTIVOS`);

    // Enviar push notification a conductores aprobados con FCM token
    // (cubre los que tienen la app en background o cerrada)
    try {
      const User = require('./models/User');
      const driversWithToken = await User.find({
        userType: 'driver',
        'driverProfile.status': 'approved',
        'driverProfile.fcmToken': { $exists: true, $ne: null }
      }).select('driverProfile.fcmToken name').lean();

      if (driversWithToken.length > 0) {
        console.log(`📲 Enviando push notification a ${driversWithToken.length} conductores con FCM token...`);
        await notifyNewRequest(driversWithToken, {
          requestId: data.requestId || '',
          clientName: data.clientName || 'Un cliente',
        });
      } else {
        console.log('ℹ️ No hay conductores con FCM token para push notification');
      }
    } catch (pushErr) {
      console.warn('⚠️ Error enviando push notifications (no crítico):', pushErr.message);
    }
  });

  // Conductor envía respuesta
  socket.on('quote:send', async (data) => {
    console.log('💰 Cotización recibida del conductor:', data);
    console.log('📍 Ubicación del conductor:', data.location);
    
    try {
      // Buscar información completa del conductor
      const User = require('./models/User');
      const driver = await User.findById(data.driverId);
      
      if (!driver) {
        console.error('❌ Conductor no encontrado:', data.driverId);
        return;
      }
      
      // 🔍 DEBUG: Ver estructura completa del conductor
      console.log('🔍 DEBUG - Conductor encontrado:', {
        id: driver._id,
        name: driver.name,
        userType: driver.userType,
        tieneDriverProfile: !!driver.driverProfile
      });
      
      if (driver.driverProfile) {
        console.log('🔍 DEBUG - driverProfile:', {
          status: driver.driverProfile.status,
          tieneDocuments: !!driver.driverProfile.documents,
          rating: driver.driverProfile.rating,
          totalServices: driver.driverProfile.totalServices
        });
        
        if (driver.driverProfile.documents) {
          console.log('🔍 DEBUG - documents:', {
            tieneSelfie: !!driver.driverProfile.documents.selfie,
            selfie: driver.driverProfile.documents.selfie
          });
        } else {
          console.log('❌ DEBUG - NO tiene documents');
        }
      } else {
        console.log('❌ DEBUG - NO tiene driverProfile');
      }
      
      // Enviar al cliente específico con TODA la información
      const clientSocketId = connectedClients.get(data.clientId);
      if (clientSocketId) {
        const quoteData = {
          requestId: data.requestId,
          driverId: data.driverId,
          driverName: data.driverName,
          amount: data.amount,
          location: data.location,
          // ✅ NUEVOS CAMPOS: Información del conductor
          driverPhoto: driver.driverProfile?.documents?.selfie || null,
          driverRating: driver.driverProfile?.rating || 5,
          driverServiceCount: driver.driverProfile?.totalServices || 0,
          timestamp: new Date()
        };
        
        console.log('📤 Enviando cotización al cliente:', {
          requestId: quoteData.requestId,
          driverId: quoteData.driverId,
          driverName: quoteData.driverName,
          amount: quoteData.amount,
          driverPhoto: quoteData.driverPhoto ? `✅ ${quoteData.driverPhoto.substring(0, 50)}...` : '❌ Sin foto',
          driverRating: quoteData.driverRating,
          driverServiceCount: quoteData.driverServiceCount
        });
        io.to(clientSocketId).emit('quote:received', quoteData);
      } else {
        console.log('⚠️ Cliente no encontrado con ID:', data.clientId);
      }
    } catch (error) {
      console.error('❌ Error al procesar cotización:', error);
    }
  });

  // Cliente cancela solicitud
  socket.on('request:cancel', async (data) => {
    console.log('🚫 Solicitud cancelada por cliente:', data.requestId);
    console.log('📝 Razón:', data.reason, data.customReason || '');
    
    try {
      const Request = require('./models/Request');
      const User = require('./models/User');
      
      // Actualizar estado de la solicitud en la base de datos + desactivar tracking
      const request = await Request.findByIdAndUpdate(
        data.requestId,
        {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: data.reason,
          cancellationCustomReason: data.customReason || null,
          updatedAt: new Date(),
          'trackingData.isActive': false
        },
        { new: true }
      );

      // Limpiar de RAM también
      if (data.requestId) {
        activeServices.delete(data.requestId.toString());
      }
      
      if (!request) {
        console.error('❌ Solicitud no encontrada para cancelar:', data.requestId);
        return;
      }
      
      console.log('✅ Solicitud actualizada a estado "cancelled" en DB');
      
      // ✅ Si había conductor asignado, liberarlo y ponerlo en ACTIVO
      if (request.assignedDriverId) {
        await User.findByIdAndUpdate(
          request.assignedDriverId,
          {
            'driverProfile.isOnline': true,
            'driverProfile.currentServiceId': null,
            'driverProfile.lastOnlineAt': new Date()
          }
        );
        
        console.log(`🟢 Conductor ${request.assignedDriverId} liberado y puesto en ACTIVO`);
        
        // Actualizar estado en memoria
        const driverData = connectedDrivers.get(request.assignedDriverId.toString());
        if (driverData) {
          driverData.isOnline = true;
          connectedDrivers.set(request.assignedDriverId.toString(), driverData);
          
          // Unir a sala de conductores activos
          const driverSocket = io.sockets.sockets.get(driverData.socketId);
          if (driverSocket) {
            driverSocket.join('active-drivers');
            console.log(`✅ Conductor ${request.assignedDriverId} agregado a sala active-drivers`);
          }
        }
      }
      
      // ✅ Convertir requestId a String para evitar problemas de comparación
      const requestIdStr = data.requestId.toString();
      
      console.log('📢 Notificando a todos los conductores...');
      
      // Notificar a TODOS los conductores con información detallada
      io.to('drivers').emit('request:cancelled', {
        requestId: requestIdStr, // ✅ String
        reason: data.reason,
        customReason: data.customReason || null,
        clientName: data.clientName,
        vehicle: data.vehicle,
        origin: data.origin,
        destination: data.destination,
        problem: data.problem,
        message: 'Servicio cancelado por el cliente',
        cancelledAt: new Date(),
        timestamp: new Date()
      });
      
      console.log('✅ Notificación de cancelación enviada a conductores');
      
    } catch (error) {
      console.error('❌ Error al procesar cancelación:', error);
      console.error('Stack:', error.stack);
    }
  });

  // Cliente acepta una cotización
  socket.on('service:accept', async (data) => {
    console.log('✅ Cliente aceptó cotización:', data);
    console.log(`👤 Cliente: ${data.clientId}`);
    console.log(`🚗 Conductor aceptado: ${data.acceptedDriverId}`);
    console.log(`❌ Otros conductores: ${data.otherDriverIds?.length || 0}`);
    
    // Guardar servicio activo para tracking (RAM + MongoDB para persistencia)
    const clientSocketId = connectedClients.get(data.clientId);
    const driverData = connectedDrivers.get(data.acceptedDriverId);
    
    if (clientSocketId && driverData) {
      activeServices.set(data.requestId, {
        clientId: data.clientId,
        driverId: data.acceptedDriverId,
        clientSocketId: clientSocketId,
        driverSocketId: driverData.socketId
      });
      console.log(`📍 Servicio ${data.requestId} registrado para tracking en tiempo real (RAM)`);
    }

    // Persistir en MongoDB para sobrevivir reinicios del backend
    try {
      const Request = require('./models/Request');
      await Request.findByIdAndUpdate(data.requestId, {
        'trackingData.clientId': data.clientId,
        'trackingData.driverId': data.acceptedDriverId,
        'trackingData.isActive': true,
        'trackingData.startedAt': new Date()
      });
      console.log(`💾 Tracking persistido en MongoDB para servicio ${data.requestId}`);
    } catch (err) {
      console.error('❌ Error persistiendo tracking en MongoDB:', err.message);
    }
    
    // Notificar al conductor aceptado
    if (driverData) {
      io.to(driverData.socketId).emit('service:accepted', {
        requestId: data.requestId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        securityCode: data.securityCode,
        amount: data.amount,
        origin: data.origin,
        destination: data.destination,
        vehicle: data.vehicle,
        vehicleSnapshot: data.vehicleSnapshot,
        problem: data.problem,
        serviceDetails: data.serviceDetails,
        timestamp: new Date()
      });
      
      console.log(`✅ Conductor ${data.acceptedDriverId} notificado de aceptación`);
      
      // Actualizar estado en memoria y remover de sala active-drivers
      driverData.isOnline = false;
      connectedDrivers.set(data.acceptedDriverId, driverData);
      
      const driverSocket = io.sockets.sockets.get(driverData.socketId);
      if (driverSocket) {
        driverSocket.leave('active-drivers');
        console.log(`🔴 Conductor ${data.acceptedDriverId} removido de active-drivers (ahora OCUPADO)`);
      }
    } else {
      console.log(`⚠️ Conductor ${data.acceptedDriverId} no está conectado`);
    }

    // Push notification al conductor aceptado (cubre app en background o cerrada)
    try {
      const User = require('./models/User');
      const acceptedDriver = await User.findById(data.acceptedDriverId)
        .select('driverProfile.fcmToken name')
        .lean();

      if (acceptedDriver?.driverProfile?.fcmToken) {
        await notifyQuoteAccepted(acceptedDriver.driverProfile.fcmToken, {
          requestId: data.requestId || '',
          amount: data.amount || 0,
        });
        console.log(`📲 Push notification enviada al conductor ${acceptedDriver.name}`);
      } else {
        console.log(`ℹ️ Conductor ${data.acceptedDriverId} no tiene FCM token`);
      }
    } catch (pushErr) {
      console.warn('⚠️ Error enviando push notification al conductor (no crítico):', pushErr.message);
    }
    
    // Notificar a otros conductores que el servicio ya fue tomado
    if (data.otherDriverIds && data.otherDriverIds.length > 0) {
      data.otherDriverIds.forEach(driverId => {
        const otherDriverData = connectedDrivers.get(driverId);
        if (otherDriverData) {
          io.to(otherDriverData.socketId).emit('service:taken', {
            requestId: data.requestId,
            message: 'Este servicio ya fue tomado por otro conductor',
            timestamp: new Date()
          });
        }
      });
      
      console.log(`📢 ${data.otherDriverIds.length} conductores notificados que el servicio fue tomado`);
    }
  });

  // ========================================
  // Completar Servicio
  // ========================================
  socket.on('service:complete', async (data) => {
    console.log('✅ Servicio completado:', data);
    console.log(`🚗 Conductor: ${data.driverName}`);
    console.log(`📦 Request ID: ${data.requestId}`);
    
    // Eliminar servicio activo del tracking (RAM + MongoDB)
    if (data.requestId) {
      activeServices.delete(data.requestId);
      console.log(`📍 Servicio ${data.requestId} removido del tracking (RAM)`);

      try {
        const Request = require('./models/Request');
        await Request.findByIdAndUpdate(data.requestId, {
          'trackingData.isActive': false
        });
        console.log(`💾 Tracking desactivado en MongoDB para servicio ${data.requestId}`);
      } catch (err) {
        console.error('❌ Error desactivando tracking en MongoDB:', err.message);
      }
    }
    
    // Notificar al cliente que el servicio fue completado
    const clientSocketId = connectedClients.get(data.clientId);
    if (clientSocketId) {
      io.to(clientSocketId).emit('service:completed', {
        requestId: data.requestId,
        driverName: data.driverName,
        completedAt: data.completedAt,
        message: '¡Servicio completado! ¿Cómo fue tu experiencia?'
      });
      console.log(`✅ Cliente ${data.clientId} notificado de servicio completado`);
    } else {
      console.log(`⚠️ Cliente ${data.clientId} no está conectado`);
    }
    
    // Actualizar estado del conductor a disponible
    const driverData = connectedDrivers.get(data.driverId);
    if (driverData) {
      driverData.isOnline = true;
      connectedDrivers.set(data.driverId, driverData);
      
      const driverSocket = io.sockets.sockets.get(driverData.socketId);
      if (driverSocket) {
        driverSocket.join('active-drivers');
        console.log(`🟢 Conductor ${data.driverId} de vuelta en active-drivers (DISPONIBLE)`);
      }
    } else {
      console.log(`⚠️ Conductor ${data.driverId} no está conectado`);
    }
  });

  // ========================================
  // TRACKING EN TIEMPO REAL - Ubicación del Conductor
  // ========================================
  socket.on('driver:location-update', async (data) => {
    const { requestId, driverId, location, heading, speed, accuracy } = data;

    const sendLocationToClient = (clientSocketId, clientId) => {
      io.to(clientSocketId).emit('driver:location-update', {
        requestId,
        driverId,
        location: { lat: location.lat, lng: location.lng },
        heading: heading || 0,
        speed: speed || 0,
        accuracy: accuracy || 0,
        timestamp: new Date()
      });

      if (!socket.locationUpdateCount) socket.locationUpdateCount = 0;
      socket.locationUpdateCount++;
      if (socket.locationUpdateCount % 10 === 0) {
        console.log(`📍 Ubicación actualizada - Conductor: ${driverId} → Cliente: ${clientId}`);
      }
    };

    // Intentar desde RAM primero (camino rápido)
    const service = activeServices.get(requestId);
    if (service && service.clientSocketId) {
      sendLocationToClient(service.clientSocketId, service.clientId);
      return;
    }

    // Fallback: buscar en MongoDB si no está en RAM (backend reiniciado o cliente reconectó)
    try {
      const Request = require('./models/Request');
      const activeRequest = await Request.findOne({
        _id: requestId,
        'trackingData.isActive': true,
        status: { $in: ['accepted', 'in_progress'] }
      }).select('trackingData clientId assignedDriverId');

      if (!activeRequest) {
        if (!socket.serviceNotFoundLogged) {
          console.log(`⚠️ Servicio ${requestId} no encontrado en RAM ni en MongoDB`);
          socket.serviceNotFoundLogged = true;
        }
        return;
      }

      const clientId = activeRequest.trackingData.clientId || activeRequest.clientId?.toString();
      const clientSocketId = connectedClients.get(clientId);

      if (clientSocketId) {
        // Reconstruir en RAM para las próximas actualizaciones (evitar consultas repetidas)
        activeServices.set(requestId, {
          clientId,
          driverId,
          clientSocketId,
          driverSocketId: socket.id
        });
        console.log(`🔄 activeServices reconstruido desde MongoDB para servicio ${requestId}`);
        sendLocationToClient(clientSocketId, clientId);
      } else {
        console.log(`⚠️ Cliente ${clientId} del servicio ${requestId} no está conectado`);
      }
    } catch (err) {
      console.error('❌ Error buscando servicio en MongoDB para tracking:', err.message);
    }
  });

  // Desconexión
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
    // Limpiar mapas
    for (let [driverId, driverData] of connectedDrivers.entries()) {
      if (driverData.socketId === socket.id) {
        connectedDrivers.delete(driverId);
        console.log(`🚗 Conductor desconectado: ${driverId}`);
      }
    }
    for (let [clientId, socketId] of connectedClients.entries()) {
      if (socketId === socket.id) {
        connectedClients.delete(clientId);
        console.log(`👤 Cliente desconectado: ${clientId}`);
      }
    }
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 Socket.IO listo para conexiones en tiempo real`);
});


