require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

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
  socket.on('client:register', (clientId) => {
    connectedClients.set(clientId, socket.id);
    console.log(`👤 Cliente registrado: ${clientId}`);
  });

  // Cliente solicita cotización
  socket.on('request:new', (data) => {
    console.log('📢 Nueva solicitud de cotización recibida');
    console.log('📦 Datos completos:', JSON.stringify(data, null, 2));
    
    const activeDriversCount = io.sockets.adapter.rooms.get('active-drivers')?.size || 0;
    const totalDriversCount = io.sockets.adapter.rooms.get('drivers')?.size || 0;
    
    console.log(`🚗 Conductores totales conectados: ${totalDriversCount}`);
    console.log(`🟢 Conductores ACTIVOS: ${activeDriversCount}`);
    
    // Enviar SOLO a conductores activos (isOnline = true)
    io.to('active-drivers').emit('request:received', {
      requestId: data.requestId,
      clientId: data.clientId,
      clientName: data.clientName,
      origin: data.origin,
      destination: data.destination,
      distance: data.distance,
      duration: data.duration,
      timestamp: new Date()
    });
    
    console.log(`✅ Solicitud emitida a ${activeDriversCount} conductores ACTIVOS`);
  });

  // Conductor envía respuesta
  socket.on('quote:send', (data) => {
    console.log('💰 Cotización recibida del conductor:', data);
    console.log('📍 Ubicación del conductor:', data.location);
    
    // Enviar al cliente específico con TODA la información
    const clientSocketId = connectedClients.get(data.clientId);
    if (clientSocketId) {
      const quoteData = {
        requestId: data.requestId,
        driverId: data.driverId,
        driverName: data.driverName,
        amount: data.amount,
        location: data.location, // 🆕 INCLUIR UBICACIÓN DEL CONDUCTOR
        timestamp: new Date()
      };
      
      console.log('📤 Enviando cotización al cliente con ubicación:', quoteData);
      io.to(clientSocketId).emit('quote:received', quoteData);
    } else {
      console.log('⚠️ Cliente no encontrado con ID:', data.clientId);
    }
  });

  // Cliente cancela solicitud
  socket.on('request:cancel', (data) => {
    console.log('🚫 Solicitud cancelada por cliente:', data.requestId);
    console.log('📢 Notificando a todos los conductores...');
    
    // Notificar a TODOS los conductores que el servicio fue cancelado
    io.to('drivers').emit('request:cancelled', {
      requestId: data.requestId,
      message: 'Servicio cancelado por el cliente',
      timestamp: new Date()
    });
    
    console.log('✅ Notificación de cancelación enviada a conductores');
  });

  // Cliente acepta una cotización
  socket.on('service:accept', (data) => {
    console.log('✅ Cliente aceptó cotización:', data);
    console.log(`👤 Cliente: ${data.clientId}`);
    console.log(`🚗 Conductor aceptado: ${data.acceptedDriverId}`);
    console.log(`❌ Otros conductores: ${data.otherDriverIds?.length || 0}`);
    
    // Notificar al conductor aceptado
    const driverData = connectedDrivers.get(data.acceptedDriverId);
    if (driverData) {
      io.to(driverData.socketId).emit('service:accepted', {
        requestId: data.requestId,
        clientName: data.clientName,
        securityCode: data.securityCode,
        amount: data.amount,
        origin: data.origin,
        destination: data.destination,
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


