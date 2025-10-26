# 🚗 Desvare App - MVP

Sistema de cotizaciones en tiempo real para conductores y clientes.

## 📖 Descripción

Desvare es una plataforma que conecta clientes que necesitan cotizaciones con conductores disponibles en tiempo real. Los clientes solicitan cotizaciones desde una PWA y los conductores responden desde su app móvil.

## 🏗️ Arquitectura

El proyecto está dividido en 3 partes:

```
desvare-proyect/
├── backend/           # API REST + Socket.IO (Node.js + Express)
├── client-pwa/        # PWA para clientes (React + Ionic + Vite)
├── driver-app/        # App móvil para conductores (Ionic React)
└── README.md          # Este archivo
```

## 🚀 Tecnologías

### Backend
- Node.js + Express
- MongoDB Atlas
- Socket.IO (tiempo real)
- JWT (autenticación)

### Frontend (PWA y App)
- React 18
- Ionic Framework
- Vite
- Socket.IO Client
- Axios

## 📦 Instalación Completa

### 1. Clonar y configurar

```bash
# Ya estás en el directorio del proyecto
cd desvare-proyect
```

### 2. Instalar Backend

```bash
cd backend
npm install
cp .env.example .env
```

**IMPORTANTE**: Edita `backend/.env` y configura tu conexión a MongoDB Atlas:
```env
MONGODB_URI=tu_conexion_mongodb_atlas_aqui
JWT_SECRET=un_secreto_super_seguro
```

### 3. Instalar PWA de Clientes

```bash
cd ../client-pwa
npm install
cp .env.example .env
```

### 4. Instalar App de Conductores

```bash
cd ../driver-app
npm install
cp .env.example .env
```

## 🏃 Ejecutar el Sistema Completo

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
El backend correrá en `http://localhost:5000`

### Terminal 2 - PWA de Clientes
```bash
cd client-pwa
npm run dev
```
La PWA correrá en `http://localhost:5173`

### Terminal 3 - App de Conductores
```bash
cd driver-app
npm run dev
```
La app correrá en `http://localhost:5174` (o el siguiente puerto disponible)

## 🎯 Flujo de Uso

### 1. Registro de Usuarios

**Cliente (PWA):**
1. Abre `http://localhost:5173`
2. Haz clic en "Regístrate aquí"
3. Completa el formulario
4. Serás redirigido a la página principal

**Conductor (App):**
1. Abre `http://localhost:5174`
2. Haz clic en "Regístrate aquí"
3. Completa el formulario
4. Serás redirigido a la página principal

### 2. Flujo de Cotización

1. **Cliente solicita cotización:**
   - En la PWA, presiona "Buscar Cotización"
   - La solicitud se envía a todos los conductores conectados

2. **Conductor recibe solicitud:**
   - La app muestra una alerta con la nueva solicitud
   - El conductor ve el nombre del cliente
   - Presiona "Cotizar" para responder

3. **Conductor envía cotización:**
   - Ingresa el monto en el modal
   - Presiona "Enviar Cotización"
   - La cotización se envía al cliente instantáneamente

4. **Cliente recibe cotización:**
   - La PWA muestra una notificación
   - Se agrega a la lista de cotizaciones recibidas
   - Muestra: nombre del conductor, monto y hora

## 🔌 Comunicación en Tiempo Real

El sistema usa Socket.IO para comunicación bidireccional:

```
Cliente → Backend → Conductor
   ↓
Buscar Cotización

Conductor → Backend → Cliente
      ↓
Enviar Cotización
```

### Eventos Socket.IO:

**Cliente emite:**
- `client:register` - Registra cliente en el sistema
- `request:new` - Nueva solicitud de cotización

**Conductor emite:**
- `driver:register` - Registra conductor en el sistema
- `quote:send` - Envía cotización

**Backend emite:**
- `request:received` → A conductores (nueva solicitud)
- `quote:received` → A cliente específico (cotización recibida)

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Solicitudes
- `POST /api/requests/new` - Crear solicitud
- `POST /api/requests/:id/quote` - Agregar cotización
- `GET /api/requests/client/:id` - Obtener solicitudes de cliente

## 🗄️ Base de Datos (MongoDB)

### Colecciones:

**users**
```javascript
{
  email: String,
  password: String (hash),
  name: String,
  userType: "client" | "driver",
  createdAt: Date
}
```

**requests**
```javascript
{
  clientId: ObjectId,
  clientName: String,
  status: "pending" | "quoted" | "accepted" | "rejected" | "completed",
  quotes: [{
    driverId: ObjectId,
    driverName: String,
    amount: Number,
    timestamp: Date
  }],
  createdAt: Date
}
```

## 📱 Compilar App Móvil para Android

### Desde driver-app:

```bash
# Instalar Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Inicializar
npx cap init

# Build
npm run build

# Agregar Android
npx cap add android

# Sincronizar
npx cap sync

# Abrir en Android Studio
npx cap open android
```

## 🌐 Deploy en Producción

### Backend (DigitalOcean)

1. Crear Droplet en DigitalOcean
2. Instalar Node.js
3. Clonar repositorio
4. Configurar variables de entorno
5. Instalar PM2: `npm install -g pm2`
6. Ejecutar: `pm2 start server.js`
7. Configurar Nginx como reverse proxy
8. Configurar dominio: desvare.app

### PWA (Vercel / Netlify)

```bash
cd client-pwa
npm run build
# Deploy en Vercel o Netlify
```

### App Móvil (Google Play Store)

1. Compilar APK desde Android Studio
2. Firmar APK
3. Subir a Google Play Console

## 🔧 Configuración de CORS

En producción, actualiza las URLs en `backend/.env`:

```env
CLIENT_URL=https://desvare.app
DRIVER_URL=https://driver.desvare.app
```

## 🐛 Troubleshooting

### Backend no conecta a MongoDB
- Verifica tu string de conexión en `.env`
- Asegúrate de que tu IP esté en whitelist de MongoDB Atlas

### Socket.IO no conecta
- Verifica que todas las URLs en `.env` sean correctas
- Revisa que el backend esté corriendo
- Abre la consola del navegador para ver errores

### Apps no cargan
- Ejecuta `npm install` en cada directorio
- Verifica que los puertos 5000, 5173, 5174 estén disponibles
- Reinicia los servidores

## 📝 Próximos Pasos (Roadmap)

- [ ] Agregar notificaciones push nativas
- [ ] Implementar sistema de pagos
- [ ] Historial de viajes
- [ ] Rating y reseñas
- [ ] Mapa con ubicación en tiempo real
- [ ] Chat entre cliente y conductor
- [ ] Panel de administración

## 👥 Equipo

Desarrollado para el MVP de Desvare App.

## 📄 Licencia

Todos los derechos reservados.


