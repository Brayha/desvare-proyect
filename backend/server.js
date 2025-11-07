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
app.use(express.json());

// Configuración de Socket.IO
const io = new Server(server, {
  cors: corsOptions
});

// Importar rutas
const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const vehicleRoutes = require('./routes/vehicles');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/vehicles', vehicleRoutes);

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
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error conectando a MongoDB:', err));

// Socket.IO - Manejo de conexiones en tiempo real
const connectedDrivers = new Map(); // Almacena socket.id de conductores conectados
const connectedClients = new Map(); // Almacena socket.id de clientes conectados

io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado:', socket.id);

  // Registro de conductor
  socket.on('driver:register', (driverId) => {
    connectedDrivers.set(driverId, socket.id);
    console.log(`🚗 Conductor registrado: ${driverId}`);
    socket.join('drivers'); // Unirse a la sala de conductores
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
    console.log(`🚗 Conductores conectados en sala "drivers": ${io.sockets.adapter.rooms.get('drivers')?.size || 0}`);
    
    // Enviar a todos los conductores conectados con TODOS los datos
    io.to('drivers').emit('request:received', {
      requestId: data.requestId,
      clientId: data.clientId,
      clientName: data.clientName,
      origin: data.origin,
      destination: data.destination,
      distance: data.distance,
      duration: data.duration,
      timestamp: new Date()
    });
    
    console.log('✅ Solicitud emitida a conductores en sala "drivers"');
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

  // Desconexión
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
    // Limpiar mapas
    for (let [driverId, socketId] of connectedDrivers.entries()) {
      if (socketId === socket.id) {
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


