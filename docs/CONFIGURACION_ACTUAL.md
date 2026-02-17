# ⚙️ Configuración Actual del Proyecto Desvare

**Fecha última actualización:** 14 de febrero de 2026

---

## 📋 Estado del Proyecto

### ✅ Funcionalidades Activas
- Sistema completo de OTP con Twilio Verify (Cliente y Driver App)
- Login y registro con verificación telefónica
- Sistema de tracking en tiempo real con Socket.IO
- Sistema de cotizaciones y solicitudes
- Panel administrativo (Admin Dashboard)
- Integración con Google Maps
- Sistema de notificaciones push (Firebase)

### 🏗️ Arquitectura

**Frontend (3 proyectos independientes):**
- `client-pwa/` - PWA para clientes (React + Ionic)
- `driver-app/` - PWA para conductores (React + Ionic)
- `admin-dashboard/` - Panel administrativo (React + Ionic)

**Backend:**
- API REST en Node.js + Express
- MongoDB Atlas (Base de datos)
- Socket.IO para comunicación en tiempo real

---

## 🌐 URLs de Producción

### Frontend (Vercel)
- **Cliente PWA:** https://www.desvare.app/
- **Driver App:** https://driver.desvare.app/
- **Admin Dashboard:** https://admin.desvare.app/

### Backend (DigitalOcean)
- **API:** https://api.desvare.app/
- **Servidor:** DigitalOcean Droplet (Node.js + PM2 + Nginx)
- **Puerto interno:** 5001
- **Proceso PM2:** `desvare-backend`

---

## 🔧 Configuración de Vercel

### Configuración Común (Todos los Proyectos)

**Root Directory:**
```
client-pwa/        # Para PWA Cliente
driver-app/        # Para Driver App
admin-dashboard/   # Para Admin Dashboard
```

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```bash
npm install
```

**Framework Preset:**
```
Vite
```

**Node Version:**
```
18.x
```

### Archivos de Configuración

Cada proyecto tiene su propio `vercel.json` para manejar el routing de SPA:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🔐 Variables de Entorno

### Backend (.env en DigitalOcean)

```bash
# Entorno
NODE_ENV=production
PORT=5001

# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=...

# Twilio Verify
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VAb8c7c5794adc9930367857aa9501d15a

# Firebase
FIREBASE_SERVICE_ACCOUNT=...

# URLs de Frontend
CLIENT_URL=https://www.desvare.app,capacitor://localhost,ionic://localhost
DRIVER_URL=https://driver.desvare.app,capacitor://localhost,ionic://localhost
ADMIN_URL=https://admin.desvare.app

# Google Maps
GOOGLE_MAPS_API_KEY=...
```

### Frontend (Variables de Entorno)

**Client PWA:**
```bash
VITE_API_URL=https://api.desvare.app
VITE_GOOGLE_MAPS_API_KEY=...
```

**Driver App:**
```bash
VITE_API_URL=https://api.desvare.app
VITE_GOOGLE_MAPS_API_KEY=...
```

**Admin Dashboard:**
```bash
VITE_API_URL=https://api.desvare.app
```

---

## 🚀 Configuración de Nginx

**Ubicación:** `/etc/nginx/sites-available/desvare-api`

```nginx
server {
    listen 80;
    server_name api.desvare.app;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📦 Estructura de Proyectos

### Desacoplamiento Completado

Los tres proyectos frontend están **completamente independientes**:

- **NO** usan la carpeta `shared/` (eliminada)
- Cada proyecto tiene sus propios componentes copiados
- Cada proyecto tiene sus propias imágenes y assets
- Cada proyecto tiene su propio `vite.config.js` sin aliases externos

### Scripts de Build Eliminados

Los siguientes scripts fueron eliminados:
- `build.sh`
- `build-admin.sh`

Ahora cada proyecto se construye independientemente con `npm run build`.

---

## 🔧 Comandos Útiles

### Backend (DigitalOcean)

```bash
# Ver logs
pm2 logs desvare-backend --lines 50

# Reiniciar backend
pm2 restart desvare-backend

# Ver estado
pm2 status

# Ver variables de entorno
pm2 env desvare-backend

# Reiniciar con nuevas variables
pm2 delete desvare-backend
pm2 start server.js --name desvare-backend --update-env

# Reiniciar Nginx
sudo systemctl restart nginx
sudo nginx -t  # Verificar configuración
```

### Frontend Local

```bash
# Instalar dependencias
cd client-pwa && npm install
cd driver-app && npm install
cd admin-dashboard && npm install

# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview
```

---

## 📱 Endpoints Principales

### Autenticación

**Cliente:**
- `POST /api/auth/send-otp` - Enviar OTP
- `POST /api/auth/verify-otp` - Verificar OTP

**Conductor:**
- `POST /api/drivers/send-otp` - Enviar OTP
- `POST /api/drivers/verify-otp` - Verificar OTP

### Solicitudes
- `POST /api/requests/create` - Crear solicitud
- `GET /api/requests/active` - Ver solicitudes activas
- `PUT /api/requests/:id/accept` - Aceptar solicitud
- `PUT /api/requests/:id/cancel` - Cancelar solicitud

### Tracking
- `GET /api/tracking/:requestId` - Obtener datos de tracking
- Socket.IO events: `locationUpdate`, `statusUpdate`

---

## 🔥 Problemas Comunes y Soluciones

### 404 en Vercel al refrescar
**Solución:** Asegurar que existe `vercel.json` con rewrites en cada proyecto

### Build falla en Vercel
**Solución:** Verificar Root Directory, Build Command y que no haya referencias a `shared/`

### Backend no responde
**Solución:** Verificar que PM2 esté corriendo y Nginx apunte al puerto correcto (5001)

### OTP no llega
**Solución:** Verificar credenciales de Twilio y Service SID en `.env`

---

## 📞 Contacto

Para más información, revisar la documentación adicional en `/docs/` o consultar el archivo `ARCHITECTURE.md` en la raíz del proyecto.
