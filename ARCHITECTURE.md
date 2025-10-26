# 🏛️ Arquitectura de Desvare App

Documento técnico de la arquitectura del sistema.

## 📊 Vista General

```
┌─────────────────────────────────────────────────────────────┐
│                        DESVARE APP                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Cliente    │         │   Backend    │         │  Conductor   │
│   (PWA)      │◄───────►│  (Node.js)   │◄───────►│   (App)      │
│              │         │              │         │              │
│ React+Ionic  │         │ Express +    │         │ React+Ionic  │
│ Socket.IO    │         │ Socket.IO    │         │ Socket.IO    │
└──────────────┘         └──────┬───────┘         └──────────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  MongoDB     │
                         │   Atlas      │
                         └──────────────┘
```

## 🎯 Arquitectura por Capas

### Capa 1: Frontend

#### PWA de Cliente (`client-pwa/`)
- **Framework**: React 18
- **UI**: Ionic Framework
- **Build Tool**: Vite
- **Estado**: React Hooks (useState, useEffect)
- **HTTP Client**: Axios
- **WebSocket**: Socket.IO Client

**Responsabilidades**:
- Autenticación de clientes
- Solicitud de cotizaciones
- Recepción de cotizaciones en tiempo real
- UI responsiva y móvil

#### App de Conductor (`driver-app/`)
- **Framework**: React 18
- **UI**: Ionic Framework
- **Build Tool**: Vite
- **Estado**: React Hooks
- **HTTP Client**: Axios
- **WebSocket**: Socket.IO Client

**Responsabilidades**:
- Autenticación de conductores
- Recepción de solicitudes en tiempo real
- Envío de cotizaciones
- Alertas nativas
- UI móvil optimizada

### Capa 2: Backend

#### API REST + WebSocket (`backend/`)
- **Runtime**: Node.js
- **Framework**: Express
- **WebSocket**: Socket.IO
- **Base de Datos**: MongoDB + Mongoose
- **Autenticación**: JWT + bcrypt
- **Middleware**: CORS

**Responsabilidades**:
- Gestión de autenticación
- CRUD de usuarios y solicitudes
- Orquestación de eventos en tiempo real
- Gestión de conexiones Socket.IO
- Validación de datos

### Capa 3: Base de Datos

#### MongoDB Atlas
- **Tipo**: NoSQL (Document-based)
- **Hosting**: Cloud (MongoDB Atlas)
- **ODM**: Mongoose

**Colecciones**:
- `users`: Clientes y conductores
- `requests`: Solicitudes con cotizaciones embebidas

## 🔄 Flujo de Datos

### Flujo 1: Registro de Usuario

```
[PWA/App] ──POST /api/auth/register──► [Backend]
    ▲                                      │
    │                                      ▼
    │                                  [MongoDB]
    │                                      │
    │                                      ▼
    └────────◄ Response (token, user) ────┘
```

**Pasos**:
1. Usuario completa formulario
2. Frontend envía datos a `/api/auth/register`
3. Backend valida y hashea contraseña
4. Guarda en MongoDB
5. Genera JWT
6. Retorna token y datos de usuario
7. Frontend guarda token en localStorage

### Flujo 2: Login

```
[PWA/App] ──POST /api/auth/login──► [Backend]
    ▲                                   │
    │                                   ▼
    │                               [MongoDB]
    │                                   │
    │                                   ▼
    └────◄ Response (token, user) ─────┘
```

**Pasos**:
1. Usuario ingresa credenciales
2. Frontend envía a `/api/auth/login`
3. Backend busca usuario en BD
4. Compara contraseñas con bcrypt
5. Genera JWT
6. Retorna token y datos
7. Frontend guarda en localStorage

### Flujo 3: Solicitud de Cotización

```
[Cliente PWA]
     │
     ├─1─► POST /api/requests/new ──► [Backend] ──► [MongoDB]
     │                                     │
     └─2─► Socket: request:new ──────────►│
                                          │
                                          ├─3─► Socket: request:received
                                          │            ▼
                                          │      [Conductor App]
                                          │            │
                                          │◄─4─ Socket: quote:send
                                          │            │
     [Cliente PWA]                        │            │
          ▲                               │            │
          │                               ▼            │
          └──5── Socket: quote:received ◄─┘            │
                                                       │
                            POST /api/requests/:id/quote
                                      ▼
                                  [MongoDB]
```

**Pasos**:
1. **Cliente crea solicitud** (HTTP):
   - `POST /api/requests/new`
   - Se guarda en MongoDB
   - Retorna requestId

2. **Cliente emite evento** (Socket):
   - `request:new` con requestId, clientId, clientName
   - Backend lo recibe

3. **Backend distribuye** (Socket):
   - Emite `request:received` a sala "drivers"
   - TODOS los conductores conectados lo reciben

4. **Conductor responde** (Socket + HTTP):
   - Primero guarda en BD: `POST /api/requests/:id/quote`
   - Luego emite: `quote:send` con datos de cotización

5. **Backend envía al cliente** (Socket):
   - Busca socketId del cliente específico
   - Emite `quote:received` solo a ese socket

## 🗂️ Estructura de Datos

### Usuario (User)
```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",
  password: "$2a$10$...",  // Hash bcrypt
  name: "Juan Pérez",
  userType: "client" | "driver",
  createdAt: ISODate("2024-01-01T00:00:00Z")
}
```

### Solicitud (Request)
```javascript
{
  _id: ObjectId("..."),
  clientId: ObjectId("..."),
  clientName: "Juan Pérez",
  status: "pending" | "quoted" | "accepted" | "rejected" | "completed",
  quotes: [
    {
      driverId: ObjectId("..."),
      driverName: "Pedro Conductor",
      amount: 25000,
      timestamp: ISODate("2024-01-01T00:05:00Z")
    }
  ],
  createdAt: ISODate("2024-01-01T00:00:00Z")
}
```

## 🔌 Comunicación WebSocket

### Eventos del Sistema

| Evento | Emisor | Receptor | Tipo | Descripción |
|--------|--------|----------|------|-------------|
| `client:register` | Cliente | Backend | Unicast | Registra cliente en el sistema |
| `driver:register` | Conductor | Backend | Unicast | Registra conductor y une a sala |
| `request:new` | Cliente | Backend | Unicast | Nueva solicitud de cotización |
| `request:received` | Backend | Conductores | Broadcast | Distribuye solicitud a conductores |
| `quote:send` | Conductor | Backend | Unicast | Envía cotización |
| `quote:received` | Backend | Cliente | Unicast | Entrega cotización al cliente |

### Gestión de Salas (Rooms)

```javascript
// Backend mantiene dos estructuras:

// 1. Sala de conductores (para broadcast)
socket.join('drivers');

// 2. Mapas para comunicación directa
connectedClients.set(clientId, socketId);
connectedDrivers.set(driverId, socketId);
```

## 🔐 Seguridad

### Autenticación

```javascript
// Frontend: Guardar token
localStorage.setItem('token', jwt);

// Frontend: Enviar en requests
headers: {
  'Authorization': `Bearer ${token}`
}

// Backend: Verificar token (implementar middleware)
jwt.verify(token, process.env.JWT_SECRET);
```

### Contraseñas

```javascript
// Registro: Hash con bcrypt (10 rounds)
const hash = await bcrypt.hash(password, 10);

// Login: Comparar
const isMatch = await bcrypt.compare(password, hash);
```

### CORS

```javascript
// Backend permite orígenes específicos
cors({
  origin: [CLIENT_URL, DRIVER_URL],
  credentials: true
})
```

## 📈 Escalabilidad

### Limitaciones Actuales (MVP)

- Un solo servidor backend
- Socket.IO en memoria (no persistente)
- Sin balanceo de carga
- Sin cache

### Mejoras para Producción

#### 1. Múltiples Instancias Backend
```javascript
// Usar Redis Adapter para Socket.IO
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

#### 2. Balanceo de Carga
```nginx
# Nginx
upstream backend {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}
```

#### 3. Cache con Redis
```javascript
// Cachear usuarios conectados
redis.set(`user:${userId}:socket`, socketId);
```

#### 4. Base de Datos
```javascript
// Réplicas de MongoDB
mongodb+srv://user:pass@cluster0.mongodb.net/desvare?replicaSet=rs0

// Índices para performance
db.users.createIndex({ email: 1 }, { unique: true });
db.requests.createIndex({ clientId: 1, createdAt: -1 });
```

## 🛠️ Stack Tecnológico Completo

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Runtime |
| Express | 4.18+ | Framework web |
| Socket.IO | 4.6+ | WebSocket |
| Mongoose | 8.0+ | ODM MongoDB |
| bcryptjs | 2.4+ | Hash contraseñas |
| jsonwebtoken | 9.0+ | JWT |
| cors | 2.8+ | CORS middleware |
| dotenv | 16.3+ | Variables entorno |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18+ | UI Framework |
| Ionic React | 8+ | Componentes móviles |
| Vite | 5+ | Build tool |
| React Router | 5+ | Routing |
| Socket.IO Client | 4.6+ | WebSocket client |
| Axios | 1.6+ | HTTP client |
| Ionicons | 7+ | Íconos |

### Base de Datos
| Tecnología | Propósito |
|------------|-----------|
| MongoDB Atlas | Base de datos |
| Mongoose | ODM |

### DevOps (Futuro)
| Tecnología | Propósito |
|------------|-----------|
| Docker | Contenedores |
| Nginx | Reverse proxy |
| PM2 | Process manager |
| DigitalOcean | Hosting |

## 📊 Métricas de Performance

### Objetivos (MVP)

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Latencia HTTP | < 200ms | ✓ |
| Latencia Socket | < 100ms | ✓ |
| Uptime | 99% | N/A |
| Usuarios concurrentes | 100+ | ✓ |

### Monitoreo (Implementar)

```javascript
// Métricas básicas
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    connections: {
      clients: connectedClients.size,
      drivers: connectedDrivers.size
    }
  });
});
```

## 🔄 Patrón de Arquitectura

El sistema sigue el patrón **Cliente-Servidor con Comunicación Bidireccional**:

- **Separación de responsabilidades**: Frontend/Backend
- **RESTful API**: Para operaciones CRUD
- **WebSocket**: Para eventos en tiempo real
- **Arquitectura de microservicios** (preparado para escalar)

## 🚀 Deployment

### Arquitectura de Producción

```
                          ┌──────────────┐
                          │   Cloudflare │
                          │     (DNS)    │
                          └──────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐           ┌──────▼──────┐
              │  Vercel   │           │ DigitalOcean│
              │   (PWA)   │           │  (Backend)  │
              └───────────┘           └──────┬──────┘
                                             │
                    ┌────────────────────────┴──────┐
                    │                               │
            ┌───────▼───────┐             ┌────────▼────────┐
            │  MongoDB      │             │   Google Play   │
            │    Atlas      │             │   (App Driver)  │
            └───────────────┘             └─────────────────┘
```

---

**Nota**: Esta es la arquitectura inicial del MVP. Está diseñada para ser simple, funcional y escalable.


