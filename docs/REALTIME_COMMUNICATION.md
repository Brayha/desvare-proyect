# 🔌 Documentación de Comunicación en Tiempo Real

Este documento explica cómo funciona la comunicación en tiempo real entre el cliente, el backend y los conductores usando Socket.IO.

## 📊 Arquitectura de Socket.IO

```
┌─────────────┐                ┌─────────────┐                ┌─────────────┐
│   Cliente   │                │   Backend   │                │  Conductor  │
│    (PWA)    │                │  Socket.IO  │                │    (App)    │
└──────┬──────┘                └──────┬──────┘                └──────┬──────┘
       │                              │                              │
       │ 1. client:register           │                              │
       │─────────────────────────────>│                              │
       │                              │                              │
       │                              │      2. driver:register      │
       │                              │<─────────────────────────────│
       │                              │                              │
       │ 3. request:new               │                              │
       │─────────────────────────────>│                              │
       │                              │                              │
       │                              │ 4. request:received (broadcast)
       │                              │─────────────────────────────>│
       │                              │                              │
       │                              │      5. quote:send           │
       │                              │<─────────────────────────────│
       │                              │                              │
       │ 6. quote:received            │                              │
       │<─────────────────────────────│                              │
       │                              │                              │
```

## 🔄 Flujo Completo de Eventos

### 1️⃣ Conexión Inicial

#### Cliente (PWA)
```javascript
// src/services/socket.js
socketService.connect();
socketService.registerClient(clientId);
```

**Evento emitido**: `client:register`
- **Payload**: `clientId` (String)
- **Propósito**: Registrar al cliente y asociar su socket ID

#### Conductor (App)
```javascript
// src/services/socket.js
socketService.connect();
socketService.registerDriver(driverId);
```

**Evento emitido**: `driver:register`
- **Payload**: `driverId` (String)
- **Propósito**: Registrar al conductor en la sala "drivers"

### 2️⃣ Solicitud de Cotización

#### Cliente solicita
```javascript
// PWA - src/pages/Home.jsx
socketService.sendRequest({
  requestId: "abc123",
  clientId: "user456",
  clientName: "Juan Pérez"
});
```

**Evento emitido**: `request:new`
```javascript
{
  requestId: String,    // ID de la solicitud en BD
  clientId: String,     // ID del cliente
  clientName: String,   // Nombre del cliente
}
```

#### Backend procesa y distribuye
```javascript
// backend/server.js
socket.on('request:new', (data) => {
  // Envía a TODOS los conductores conectados
  io.to('drivers').emit('request:received', {
    requestId: data.requestId,
    clientId: data.clientId,
    clientName: data.clientName,
    timestamp: new Date()
  });
});
```

#### Conductor recibe
```javascript
// App - src/pages/Home.jsx
socketService.onRequestReceived((request) => {
  // Mostrar alerta
  // Agregar a lista de solicitudes
  console.log('Nueva solicitud:', request);
});
```

**Evento recibido**: `request:received`
```javascript
{
  requestId: String,
  clientId: String,
  clientName: String,
  timestamp: Date
}
```

### 3️⃣ Envío de Cotización

#### Conductor responde
```javascript
// App - src/pages/Home.jsx
socketService.sendQuote({
  requestId: "abc123",
  clientId: "user456",
  driverId: "driver789",
  driverName: "Pedro Conductor",
  amount: 25000
});
```

**Evento emitido**: `quote:send`
```javascript
{
  requestId: String,
  clientId: String,     // Para identificar al cliente
  driverId: String,
  driverName: String,
  amount: Number
}
```

#### Backend procesa y envía al cliente
```javascript
// backend/server.js
socket.on('quote:send', (data) => {
  // Busca el socket ID del cliente específico
  const clientSocketId = connectedClients.get(data.clientId);
  
  if (clientSocketId) {
    // Envía SOLO a ese cliente
    io.to(clientSocketId).emit('quote:received', {
      requestId: data.requestId,
      driverId: data.driverId,
      driverName: data.driverName,
      amount: data.amount,
      timestamp: new Date()
    });
  }
});
```

#### Cliente recibe
```javascript
// PWA - src/pages/Home.jsx
socketService.onQuoteReceived((quote) => {
  // Agregar a lista de cotizaciones
  // Mostrar notificación
  console.log('Cotización recibida:', quote);
});
```

**Evento recibido**: `quote:received`
```javascript
{
  requestId: String,
  driverId: String,
  driverName: String,
  amount: Number,
  timestamp: Date
}
```

## 🗺️ Gestión de Conexiones

### Backend - Mapas de Conexiones

```javascript
// backend/server.js
const connectedDrivers = new Map(); // driverId -> socketId
const connectedClients = new Map(); // clientId -> socketId
```

**¿Por qué usar Maps?**
- Búsqueda O(1) por ID de usuario
- Fácil limpieza en desconexión
- Mapeo directo usuario ↔ socket

### Registro de Usuarios

```javascript
// Cuando un cliente se registra
socket.on('client:register', (clientId) => {
  connectedClients.set(clientId, socket.id);
});

// Cuando un conductor se registra
socket.on('driver:register', (driverId) => {
  connectedDrivers.set(driverId, socket.id);
  socket.join('drivers'); // Unirse a sala broadcast
});
```

### Limpieza en Desconexión

```javascript
socket.on('disconnect', () => {
  // Limpiar de ambos mapas
  for (let [driverId, socketId] of connectedDrivers.entries()) {
    if (socketId === socket.id) {
      connectedDrivers.delete(driverId);
    }
  }
  
  for (let [clientId, socketId] of connectedClients.entries()) {
    if (socketId === socket.id) {
      connectedClients.delete(clientId);
    }
  }
});
```

## 🎯 Patrones de Comunicación

### Broadcast a Grupo (Conductores)
```javascript
// Envía a TODOS los conductores
io.to('drivers').emit('request:received', data);
```

**Uso**: Cuando un cliente solicita cotización, todos los conductores deben verla.

### Envío Directo (Cliente Específico)
```javascript
// Envía solo a UN cliente
const clientSocketId = connectedClients.get(clientId);
io.to(clientSocketId).emit('quote:received', data);
```

**Uso**: Cuando un conductor responde, solo el cliente que solicitó debe verlo.

## 🔒 Consideraciones de Seguridad

### 1. Validación de IDs
```javascript
// Siempre validar que los IDs existan
if (!clientSocketId) {
  console.error('Cliente no encontrado:', clientId);
  return;
}
```

### 2. Autenticación (Futuro)
```javascript
// Agregar middleware de autenticación
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verificar JWT
  if (isValid(token)) {
    next();
  } else {
    next(new Error('Unauthorized'));
  }
});
```

### 3. Rate Limiting (Futuro)
```javascript
// Limitar eventos por usuario
const rateLimiter = new Map();

socket.on('request:new', (data) => {
  const lastRequest = rateLimiter.get(data.clientId);
  const now = Date.now();
  
  if (lastRequest && now - lastRequest < 5000) {
    return; // Bloquear si < 5 segundos desde última solicitud
  }
  
  rateLimiter.set(data.clientId, now);
  // Procesar solicitud...
});
```

## 🐛 Debugging

### Habilitar logs de Socket.IO

**Backend**:
```javascript
// backend/server.js
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  // Habilitar logs
  connectionStateRecovery: {
    // Recuperar estado en reconexión
    maxDisconnectionDuration: 2 * 60 * 1000,
  }
});
```

**Cliente/Conductor**:
```javascript
// src/services/socket.js
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
  // Ver eventos en consola
  reconnectionDelay: 1000,
  reconnection: true,
  reconnectionAttempts: 10
});

// Log todos los eventos
socket.onAny((event, ...args) => {
  console.log(`📡 [Socket.IO] ${event}:`, args);
});
```

### Herramientas de Debugging

1. **Consola del Navegador**:
   - F12 → Network → WS (WebSocket)
   - Ver frames enviados/recibidos

2. **Socket.IO Admin UI**:
   ```bash
   npm install @socket.io/admin-ui
   ```
   ```javascript
   // backend/server.js
   const { instrument } = require("@socket.io/admin-ui");
   instrument(io, { auth: false });
   ```
   - Visita: http://localhost:5000/admin

3. **Logs estructurados**:
   ```javascript
   console.log(JSON.stringify({
     event: 'quote:send',
     data: data,
     timestamp: new Date().toISOString()
   }, null, 2));
   ```

## 🚀 Mejoras Futuras

### 1. Reconexión Automática
```javascript
socket.on('disconnect', () => {
  // Intentar reconectar
  setTimeout(() => {
    socket.connect();
  }, 1000);
});
```

### 2. Confirmación de Recepción (ACK)
```javascript
// Emisor
socket.emit('quote:send', data, (response) => {
  if (response.status === 'ok') {
    console.log('Cotización recibida por servidor');
  }
});

// Receptor
socket.on('quote:send', (data, callback) => {
  // Procesar...
  callback({ status: 'ok' });
});
```

### 3. Presencia en Tiempo Real
```javascript
// Mostrar conductores online
io.emit('drivers:online', connectedDrivers.size);
```

### 4. Notificaciones Push
```javascript
// Integrar con FCM (Firebase Cloud Messaging)
// Para notificaciones cuando app está en background
```

## 📊 Monitoreo de Performance

### Métricas Importantes

1. **Latencia de eventos**: Tiempo desde emisión hasta recepción
2. **Tasa de desconexión**: Frecuencia de desconexiones
3. **Usuarios concurrentes**: Clientes + Conductores conectados
4. **Throughput**: Eventos por segundo

### Implementar Métricas

```javascript
// backend/server.js
let metrics = {
  totalConnections: 0,
  activeConnections: 0,
  eventsProcessed: 0,
  averageLatency: 0
};

io.on('connection', (socket) => {
  metrics.totalConnections++;
  metrics.activeConnections++;
  
  socket.on('disconnect', () => {
    metrics.activeConnections--;
  });
});

// Endpoint de métricas
app.get('/metrics', (req, res) => {
  res.json(metrics);
});
```

## ✅ Checklist de Implementación

- [x] Backend Socket.IO configurado
- [x] CORS configurado correctamente
- [x] Servicio de Socket en PWA
- [x] Servicio de Socket en App
- [x] Eventos de registro implementados
- [x] Evento request:new → request:received
- [x] Evento quote:send → quote:received
- [x] Gestión de desconexiones
- [x] Logs de debugging
- [ ] Autenticación de sockets (futuro)
- [ ] Rate limiting (futuro)
- [ ] Notificaciones push (futuro)
- [ ] Monitoreo de métricas (futuro)

## 🎓 Recursos Adicionales

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [Handling CORS](https://socket.io/docs/v4/handling-cors/)
- [Socket.IO Admin UI](https://socket.io/docs/v4/admin-ui/)

---

**Nota**: Esta configuración es para MVP/desarrollo. En producción, considera agregar:
- Autenticación de sockets
- Rate limiting
- Scaling con Redis Adapter
- SSL/TLS
- Monitoreo y alertas


