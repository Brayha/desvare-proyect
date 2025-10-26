require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configuración de CORS
const corsOptions = {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.DRIVER_URL || 'http://localhost:8100'
  ],
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

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);

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
    console.log('📢 Nueva solicitud de cotización:', data);
    // Enviar a todos los conductores conectados
    io.to('drivers').emit('request:received', {
      requestId: data.requestId,
      clientId: data.clientId,
      clientName: data.clientName,
      timestamp: new Date()
    });
  });

  // Conductor envía respuesta
  socket.on('quote:send', (data) => {
    console.log('💰 Cotización enviada:', data);
    // Enviar al cliente específico
    const clientSocketId = connectedClients.get(data.clientId);
    if (clientSocketId) {
      io.to(clientSocketId).emit('quote:received', {
        requestId: data.requestId,
        driverId: data.driverId,
        driverName: data.driverName,
        amount: data.amount,
        timestamp: new Date()
      });
    }
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


