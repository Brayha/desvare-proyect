require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { notifyNewRequest, notifyQuoteAccepted, notifyClientNewQuote, notifyClientServiceCompleted, notifyClientDriverArriving } = require('./services/notifications');

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
const trackingRoutes = require('./routes/tracking');

// Importar middleware de expiración
const { startExpirationChecker } = require('./middleware/requestExpiration');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tracking', trackingRoutes);

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

// Control de notificación "conductor llegando": evita enviar más de una vez por servicio
const driverArrivingNotified = new Set(); // Set de requestIds ya notificados

// 🆕 EXPORTAR para usarlo en las rutas
global.connectedClients = connectedClients;
global.connectedDrivers = connectedDrivers;
global.activeServices = activeServices;

/**
 * Calcula distancia en metros entre dos puntos GPS usando la fórmula de Haversine.
 * @param {number} lat1 @param {number} lng1
 * @param {number} lat2 @param {number} lng2
 * @returns {number} distancia en metros
 */
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado:', socket.id);

  // Registro de conductor
  socket.on('driver:register', async (driverId) => {
    try {
      const User = require('./models/User');
      const driver = await User.findById(driverId);
      
      if (driver && driver.userType === 'driver') {
        const isOnline = driver.driverProfile?.isOnline || false;
        
        connectedDrivers.set(driverId, {
          socketId: socket.id,
          isOnline: isOnline,
          name: driver.name
        });
        
        console.log(`🚗 Conductor registrado: ${driverId} - Estado: ${isOnline ? '🟢 ACTIVO' : '🔴 OCUPADO'}`);

        // Actualizar driverSocketId en activeServices si hay un servicio activo para este conductor
        for (const [reqId, service] of activeServices.entries()) {
          if (service.driverId === driverId) {
            activeServices.set(reqId, { ...service, driverSocketId: socket.id });
            console.log(`🔄 activeServices actualizado con nuevo socketId del conductor para servicio ${reqId}`);
          }
        }
        
        socket.join('drivers');
        socket.join(`driver:${driverId}`);
        
        if (isOnline) {
          socket.join('active-drivers');
          console.log(`✅ Conductor ${driverId} unido a sala de conductores activos`);
        } else if (driver.driverProfile?.currentServiceId) {
          // Conductor OCUPADO con servicio activo.
          // Si la app se reinició o llegó por push notification, perdió el evento service:accepted.
          // Re-enviamos el servicio completo desde MongoDB para que pueda navegar a ActiveService
          // y reanudar el envío de GPS.
          try {
            const Request = require('./models/Request');
            const activeReq = await Request.findOne({
              _id: driver.driverProfile.currentServiceId,
              status: { $in: ['accepted', 'in_progress'] }
            }).lean();

            if (activeReq) {
              const originCoords = activeReq.origin?.coordinates;
              const destCoords = activeReq.destination?.coordinates;

              socket.emit('service:accepted', {
                requestId: activeReq._id.toString(),
                driverId: driverId,
                clientId: activeReq.clientId?.toString(),
                clientName: activeReq.clientName,
                clientPhone: activeReq.clientPhone,
                securityCode: activeReq.securityCode,
                amount: activeReq.totalAmount,
                origin: originCoords
                  ? { lat: originCoords[1], lng: originCoords[0], address: activeReq.origin.address }
                  : null,
                destination: destCoords
                  ? { lat: destCoords[1], lng: destCoords[0], address: activeReq.destination.address }
                  : null,
                vehicleSnapshot: activeReq.vehicleSnapshot,
                serviceDetails: activeReq.serviceDetails,
                status: activeReq.status,
                isResume: true
              });

              console.log(`🔄 Servicio activo ${activeReq._id} re-enviado al conductor ${driverId} (reanudación)`);
            }
          } catch (resumeErr) {
            console.warn(`⚠️ Error reenviando servicio al conductor ${driverId}:`, resumeErr.message);
          }
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

  // Heartbeat del cliente (mantiene el socket vivo en iOS Safari)
  socket.on('client:ping', async ({ clientId }) => {
    if (clientId) {
      // Actualizar socketId en connectedClients
      connectedClients.set(clientId, socket.id);

      // También actualizar activeServices con el socketId actual
      // Esto es crítico para iOS: el socket puede cambiar de ID entre heartbeats
      // sin que se haya emitido un client:register explícito
      for (const [requestId, service] of activeServices.entries()) {
        if (service.clientId === clientId && service.clientSocketId !== socket.id) {
          activeServices.set(requestId, { ...service, clientSocketId: socket.id });
          console.log(`🏓 [PING] activeServices actualizado para servicio ${requestId} (nuevo socketId: ${socket.id})`);
        }
      }
    }
    socket.emit('client:pong');
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
        'driverProfile.isOnline': true, // Solo conductores disponibles (no ocupados)
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
        console.log('⚠️ Cliente no conectado (socket), intentando push notification al cliente...');
      }

      // Push notification al cliente (cubre app en background o pantalla bloqueada)
      try {
        const clientUser = await User.findById(data.clientId).select('fcmToken').lean();
        if (clientUser?.fcmToken) {
          await notifyClientNewQuote(clientUser.fcmToken, {
            requestId: data.requestId || '',
            driverName: data.driverName || '',
            amount: data.amount || 0,
          });
          console.log(`📲 Push notification enviada al cliente por nueva cotización`);
        } else {
          console.log('ℹ️ Cliente sin FCM token registrado, no se envía push');
        }
      } catch (pushErr) {
        console.warn('⚠️ Error enviando push notification al cliente (no crítico):', pushErr.message);
        if (pushErr.isInvalidToken) {
          await User.findByIdAndUpdate(data.clientId, { $unset: { fcmToken: 1 } });
          console.log('🗑️ Token FCM inválido eliminado de MongoDB (server.js - cotización)');
        }
      }

    } catch (error) {
      console.error('❌ Error al procesar cotización:', error);
    }
  });

  // Cancelación de solicitud (puede ser iniciada por el cliente o el conductor)
  socket.on('request:cancel', async (data) => {
    const cancelledBy = data.cancelledBy === 'driver' ? 'conductor' : 'cliente';
    console.log(`🚫 Solicitud cancelada por ${cancelledBy}:`, data.requestId);
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
          cancelledBy: data.cancelledBy || 'client',
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
      
      const isCancelledByDriver = data.cancelledBy === 'driver';
      const cancelMessage = isCancelledByDriver
        ? 'Servicio cancelado por el conductor'
        : 'Servicio cancelado por el cliente';

      // Notificar a TODOS los conductores (broadcast general para la lista de solicitudes)
      io.to('drivers').emit('request:cancelled', {
        requestId: requestIdStr,
        reason: data.reason,
        customReason: data.customReason || null,
        clientName: data.clientName,
        vehicle: data.vehicle,
        origin: data.origin,
        destination: data.destination,
        problem: data.problem,
        cancelledBy: data.cancelledBy || 'client',
        message: cancelMessage,
        cancelledAt: new Date(),
        timestamp: new Date()
      });

      // Notificar al CLIENTE cuando el conductor cancela el servicio
      if (isCancelledByDriver && request.clientId) {
        const clientSocketId = connectedClients.get(request.clientId.toString());
        if (clientSocketId) {
          io.to(clientSocketId).emit('service:cancelled', {
            requestId: requestIdStr,
            cancelledBy: 'driver',
            reason: data.reason,
            message: 'El conductor canceló el servicio',
          });
          console.log(`📩 Evento service:cancelled enviado al cliente ${request.clientId}`);
        }
      }

      // Notificar DIRECTAMENTE al conductor asignado cuando cancela el CLIENTE.
      // Esto resuelve el caso donde el conductor está en ActiveService (no Home)
      // y necesita saber que el cliente canceló para volver al inicio.
      if (!isCancelledByDriver && request.assignedDriverId) {
        const assignedDriverData = connectedDrivers.get(request.assignedDriverId.toString());
        if (assignedDriverData) {
          io.to(assignedDriverData.socketId).emit('service:cancelled', {
            requestId: requestIdStr,
            reason: data.reason,
            message: 'El cliente canceló el servicio',
          });
          console.log(`📩 Evento service:cancelled enviado directo al conductor ${request.assignedDriverId}`);
        } else {
          console.log(`⚠️ Conductor asignado ${request.assignedDriverId} no está conectado al momento de la cancelación`);
        }
      }
      
      console.log('✅ Notificaciones de cancelación enviadas');
      
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
    // IMPORTANTE: registrar SIEMPRE aunque el conductor esté offline al momento de aceptar.
    // Cuando el conductor reconecte y envíe GPS, el backend usará clientId para encontrar al cliente.
    const clientSocketId = connectedClients.get(data.clientId);
    const driverData = connectedDrivers.get(data.acceptedDriverId);
    
    activeServices.set(data.requestId, {
      clientId: data.clientId,
      driverId: data.acceptedDriverId,
      clientSocketId: clientSocketId || null,
      driverSocketId: driverData?.socketId || null,
    });
    console.log(`📍 Servicio ${data.requestId} registrado para tracking (RAM) - conductor ${driverData ? 'online' : 'offline al aceptar'}`);

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
        clientId: data.clientId,        // ← necesario para service:code-validated
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
  // Código de seguridad validado → servicio en curso
  // ========================================
  socket.on('service:code-validated', async (data) => {
    console.log(`🔑 Código validado para servicio ${data.requestId} — notificando cliente ${data.clientId}`);

    // Persistir status en MongoDB para que el polling REST del cliente detecte el cambio
    // aunque el socket esté caído (iOS Safari)
    try {
      const Request = require('./models/Request');
      await Request.findByIdAndUpdate(data.requestId, {
        status: 'in_progress',
        updatedAt: new Date()
      });
      console.log(`💾 Status actualizado a 'in_progress' en MongoDB para servicio ${data.requestId}`);
    } catch (err) {
      console.error('❌ Error actualizando status in_progress:', err.message);
    }

    const clientSocketId = connectedClients.get(data.clientId);
    if (clientSocketId) {
      io.to(clientSocketId).emit('service:started', {
        requestId: data.requestId,
        driverName: data.driverName,
        message: '¡El código fue ingresado! Tu vehículo ya está en la grúa.',
      });
      console.log(`✅ Cliente ${data.clientId} notificado de inicio de servicio (socket)`);
    } else {
      console.log(`⚠️ Cliente ${data.clientId} no conectado al validar código — status ya persistido en DB`);
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
      driverArrivingNotified.delete(data.requestId); // Limpiar flag para posibles futuros servicios
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
      console.log(`✅ Cliente ${data.clientId} notificado de servicio completado (socket)`);
    } else {
      console.log(`⚠️ Cliente ${data.clientId} no conectado por socket - enviando push notification...`);
      // Push notification como fallback cuando el cliente está en background o cerró la app
      try {
        const User = require('./models/User');
        const clientUser = await User.findById(data.clientId).select('fcmToken').lean();
        if (clientUser?.fcmToken) {
          await notifyClientServiceCompleted(clientUser.fcmToken, {
            requestId: data.requestId || '',
            driverName: data.driverName || 'Tu conductor',
          });
          console.log(`📲 Push notification de servicio completado enviada al cliente ${data.clientId}`);
        } else {
          console.log(`ℹ️ Cliente ${data.clientId} sin FCM token registrado`);
        }
      } catch (pushErr) {
        console.warn('⚠️ Error enviando push de servicio completado (no crítico):', pushErr.message);
        if (pushErr.isInvalidToken) {
          const User = require('./models/User');
          await User.findByIdAndUpdate(data.clientId, { $unset: { fcmToken: 1 } });
          console.log('🗑️ Token FCM inválido eliminado de MongoDB (server.js - completado)');
        }
      }
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

    // Contador de updates para este socket (se reinicia si el socket reconecta)
    if (!socket.locationUpdateCount) socket.locationUpdateCount = 0;
    socket.locationUpdateCount++;

    console.log(`📍 [#${socket.locationUpdateCount}] GPS Conductor: ${driverId} (${location.lat?.toFixed(5)}, ${location.lng?.toFixed(5)})`);

    // ─────────────────────────────────────────────────────────────────────
    // PERSISTENCIA EN MONGODB: SIEMPRE, sin importar si el cliente tiene socket.
    // Esta es la fuente de datos para el polling REST de iOS Safari.
    // Si solo se guarda cuando el socket del cliente está activo, iOS nunca
    // recibe la ubicación porque su socket muere constantemente.
    // ─────────────────────────────────────────────────────────────────────
    if (socket.locationUpdateCount === 1 || socket.locationUpdateCount % 3 === 0) {
      try {
        const Request = require('./models/Request');
        await Request.findByIdAndUpdate(requestId, {
          'trackingData.lastDriverLocation.lat': location.lat,
          'trackingData.lastDriverLocation.lng': location.lng,
          'trackingData.lastDriverLocation.heading': heading || 0,
          'trackingData.lastDriverLocation.speed': speed || 0,
          'trackingData.lastDriverLocation.updatedAt': new Date()
        });
        console.log(`💾 [#${socket.locationUpdateCount}] lastDriverLocation guardado en DB para ${requestId}`);
      } catch (dbErr) {
        console.warn('⚠️ Error guardando lastDriverLocation:', dbErr.message);
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // NOTIFICACIÓN "CONDUCTOR LLEGANDO": se dispara UNA sola vez cuando el
    // conductor está a menos de 500m del origen del cliente.
    // Usa driverArrivingNotified (Set en RAM) para evitar spam.
    // También emite socket 'driver:arriving' para clientes conectados.
    // ─────────────────────────────────────────────────────────────────────
    if (!driverArrivingNotified.has(requestId)) {
      // Ejecutar en background para no bloquear el envío de ubicación
      (async () => {
        try {
          const Request = require('./models/Request');
          const User = require('./models/User');
          const req = await Request.findById(requestId)
            .select('origin clientId clientName status trackingData assignedDriverId')
            .lean();

          if (!req || req.status !== 'accepted') return; // Solo cuando va en camino, no in_progress
          if (!req.origin?.coordinates?.length) return;

          const [originLng, originLat] = req.origin.coordinates; // GeoJSON: [lng, lat]
          const dist = haversineMeters(location.lat, location.lng, originLat, originLng);

          console.log(`📏 Distancia conductor→origen: ${Math.round(dist)}m (servicio ${requestId})`);

          if (dist <= 500) {
            driverArrivingNotified.add(requestId); // Marcar para no volver a notificar

            // Buscar nombre del conductor (driver snapshot o consulta)
            const service = activeServices.get(requestId);
            const driverInfo = connectedDrivers.get(driverId);
            const driverName = driverInfo?.name || 'Tu conductor';

            // 1. Notificación FCM (funciona aunque el cliente no esté en la app)
            const clientUser = await User.findById(req.clientId).select('fcmToken').lean();
            if (clientUser?.fcmToken) {
              try {
                await notifyClientDriverArriving(clientUser.fcmToken, {
                  requestId,
                  driverName,
                  distanceMeters: Math.round(dist),
                });
                console.log(`🔔 Notificación "conductor llegando" enviada al cliente (${Math.round(dist)}m)`);
              } catch (e) {
                console.warn('⚠️ FCM driver:arriving error:', e.message);
                if (e.isInvalidToken) {
                  await User.findByIdAndUpdate(req.clientId, { $unset: { fcmToken: 1 } });
                  console.log('🗑️ Token FCM inválido eliminado de MongoDB (driver:arriving)');
                }
              }
            }

            // 2. Evento socket (si el cliente está conectado, se actualiza la UI inmediatamente)
            const clientSocketId = service?.clientSocketId || connectedClients.get(req.clientId?.toString());
            if (clientSocketId) {
              io.to(clientSocketId).emit('driver:arriving', {
                requestId,
                driverName,
                distanceMeters: Math.round(dist),
              });
              console.log(`📡 Evento driver:arriving enviado por socket al cliente`);
            }
          }
        } catch (arrivingErr) {
          console.warn('⚠️ Error en notificación driver:arriving:', arrivingErr.message);
        }
      })();
    }

    const sendLocationToClient = (storedClientSocketId, clientId) => {
      // Siempre consultar connectedClients para obtener el socketId más reciente.
      // Esto evita enviar a un socket obsoleto si el cliente reconectó después
      // de que se registró el servicio activo (p.ej. navegó de WaitingQuotes a DriverOnWay).
      const freshSocketId = connectedClients.get(clientId) || storedClientSocketId;
      if (!freshSocketId) {
        console.log(`⚠️ Cliente ${clientId} sin socket activo — ubicación ya persistida en DB para polling REST`);
        return;
      }

      io.to(freshSocketId).emit('driver:location-update', {
        requestId,
        driverId,
        location: { lat: location.lat, lng: location.lng },
        heading: heading || 0,
        speed: speed || 0,
        accuracy: accuracy || 0,
        timestamp: new Date()
      });

      // Actualizar el socketId en RAM si cambió (se reconectó)
      if (freshSocketId !== storedClientSocketId) {
        const existingService = activeServices.get(requestId);
        if (existingService) {
          activeServices.set(requestId, { ...existingService, clientSocketId: freshSocketId });
        }
      }

      console.log(`📡 Ubicación enviada por socket al cliente ${clientId} (${freshSocketId})`);
    };

    // Intentar desde RAM primero (camino rápido)
    const service = activeServices.get(requestId);
    if (service && (service.clientSocketId || connectedClients.get(service.clientId))) {
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


