# 🔧 Configuración CORRECTA para tu caso de uso

## Tu Situación:
- PWA: https://desvare.app (producción)
- Admin: https://admin.desvare.app (producción)
- Driver App: localhost:8100 (Mac, desarrollo)

## Backend .env en DigitalOcean:

```env
# Configuración del servidor
PORT=5001
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://desvare_admin:L9tM8je0hjRuRQiv@desvare-new.efzig6x.mongodb.net/?appName=desvare-new

# DigitalOcean Spaces
DO_SPACES_KEY=DO00FN37AFVMTVFKTCUR
DO_SPACES_SECRET=l7OsTP8RlbViYqIlc0E9Hbx7/dvBJ91RxxP5EaRoEXg
DO_SPACES_ENDPOINT=fra1.digitaloceanspaces.com
DO_SPACES_BUCKET=desvare
DO_SPACES_REGION=fra1

# Firebase
FIREBASE_PROJECT_ID=desvare-production
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Twilio Verify
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Modo desarrollo para OTP (false = usa Twilio real)
TWILIO_DEV_MODE=false

# JWT Secret
JWT_SECRET=desvare_production_2026_super_secret_key_change_this

# URLs permitidas (CORS) - PRODUCCIÓN + LOCALHOST para Driver App
CLIENT_URL=https://desvare.app,https://www.desvare.app
DRIVER_URL=https://driver.desvare.app,http://localhost:8100,http://localhost:5174,capacitor://localhost,ionic://localhost
ADMIN_URL=https://admin.desvare.app
```

## Explicación:

### CLIENT_URL (PWA):
```env
CLIENT_URL=https://desvare.app,https://www.desvare.app
```
- Solo producción
- Usuarios finales solo acceden desde internet

### DRIVER_URL (App Conductores):
```env
DRIVER_URL=https://driver.desvare.app,http://localhost:8100,http://localhost:5174,capacitor://localhost,ionic://localhost
```
- **https://driver.desvare.app** - Para cuando hagas el APK (futuro)
- **http://localhost:8100** - Para Ionic serve en Mac
- **http://localhost:5174** - Por si usas Vite
- **capacitor://localhost** - Para cuando pruebes en dispositivo con Capacitor
- **ionic://localhost** - Para Ionic en dispositivo

### ADMIN_URL (Panel Admin):
```env
ADMIN_URL=https://admin.desvare.app
```
- Solo producción
- Panel web para administradores

---

## 📝 Comandos para Actualizar en DigitalOcean:

```bash
# 1. Conectar
ssh root@tu-servidor-digitalocean

# 2. Ir al backend
cd /home/desvare/desvare-proyect/backend

# 3. Backup
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 4. Actualizar código
git pull origin main

# 5. Editar .env
nano .env
```

### En nano, cambiar estas líneas:

```env
NODE_ENV=production
JWT_SECRET=desvare_production_2026_super_secret_key_change_this
TWILIO_DEV_MODE=false
CLIENT_URL=https://desvare.app,https://www.desvare.app
DRIVER_URL=https://driver.desvare.app,http://localhost:8100,http://localhost:5174,capacitor://localhost,ionic://localhost
ADMIN_URL=https://admin.desvare.app
```

Guardar: `Ctrl+X`, `Y`, `Enter`

```bash
# 6. Reiniciar
pm2 restart desvare-backend

# 7. Verificar
pm2 logs desvare-backend --lines 30
```

---

## 🎯 Beneficios de Esta Configuración:

### ✅ PWA (desvare.app):
- Funciona en producción
- Usuarios finales pueden registrarse
- SMS reales (con Twilio verificado)

### ✅ Admin (admin.desvare.app):
- Funciona en producción
- Puedes gestionar conductores, solicitudes, etc.

### ✅ Driver App (Mac - localhost):
- Puedes probar desde tu Mac
- Se conecta al backend de producción
- Pruebas realistas sin crear APK
- Cuando funcione bien → Crear APK

---

## 🔧 Configuración de tu Driver App (Ionic/Capacitor):

En tu proyecto de Driver App, asegúrate de que el archivo de configuración apunte al backend de producción:

### Si usas variables de entorno:

**`.env` o similar en Driver App:**
```env
VITE_API_URL=https://api.desvare.app
# o
REACT_APP_API_URL=https://api.desvare.app
```

### Si usas archivo de configuración:

**`src/config.ts` o similar:**
```typescript
export const config = {
  apiUrl: 'https://api.desvare.app',
  socketUrl: 'https://api.desvare.app',
  // ...
};
```

---

## 🧪 Flujo de Testing Recomendado:

### Fase 1: Testing en Mac (Actual)
```
Driver App (localhost:8100)
    ↓
Backend Producción (api.desvare.app)
    ↓
MongoDB Producción
```

**Ventajas:**
- ✅ Pruebas rápidas sin compilar APK
- ✅ Hot reload en desarrollo
- ✅ Datos reales de producción
- ✅ Detectas errores antes de APK

### Fase 2: Testing APK (Cuando todo funcione)
```
APK instalado en Android
    ↓
Backend Producción (api.desvare.app)
    ↓
MongoDB Producción
```

---

## 🚨 Importante sobre Vercel y GoDaddy:

Veo que tienes:
1. **Vercel:** Necesita configuración de DNS
2. **GoDaddy:** Tu registrador de dominios

### ¿Qué hacer?

**Si tu backend está en DigitalOcean:**

En GoDaddy, configura estos DNS:

```
Tipo    Nombre    Valor
A       @         [IP de DigitalOcean]
A       www       [IP de DigitalOcean]
A       api       [IP de DigitalOcean]
A       admin     [IP de DigitalOcean]
```

**Si usas Vercel para frontend:**

Puedes tener:
- Vercel: PWA y Admin (frontend)
- DigitalOcean: Backend (API)

En ese caso:
```
# En GoDaddy:
desvare.app → Vercel (PWA)
admin.desvare.app → Vercel (Admin)
api.desvare.app → DigitalOcean (Backend)
```

---

## 📊 Resumen de URLs:

| App | Producción | Desarrollo (Mac) |
|-----|-----------|------------------|
| **PWA** | https://desvare.app | ❌ No necesita |
| **Admin** | https://admin.desvare.app | ❌ No necesita |
| **Driver App** | ➡️ APK (futuro) | http://localhost:8100 ✅ |
| **Backend** | https://api.desvare.app | ✅ Mismo para todos |

---

## ✅ Checklist:

- [ ] Actualizar `.env` en DigitalOcean con DRIVER_URL mixto
- [ ] Verificar que Driver App apunta a `https://api.desvare.app`
- [ ] Probar Driver App desde Mac (localhost:8100)
- [ ] Verificar que se conecta al backend
- [ ] Probar funcionalidades (login, registro, solicitudes)
- [ ] Cuando todo funcione → Crear APK
- [ ] Probar APK en dispositivo Android

---

¿Necesitas que te ayude con alguna configuración específica de tu Driver App o tienes dudas sobre la configuración de DNS?
