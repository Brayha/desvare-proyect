# 🚀 Pasos Finales de Configuración

**Fecha:** 2026-02-08  
**Objetivo:** Configurar Admin Dashboard y solucionar error 404 en producción

---

## ✅ CAMBIOS REALIZADOS

### 1. Archivo `vercel.json` creado ✅
- **Ubicación:** `/client-pwa/vercel.json`
- **Propósito:** Solucionar error 404 en rutas de la PWA en Vercel
- **Estado:** ✅ Creado - Pendiente de commit y push

### 2. Configuración CORS para Admin Dashboard ✅
- **Archivo modificado:** `/backend/.env`
- **Cambio:** Agregado `ADMIN_URL=http://localhost:5176`
- **Estado:** ✅ Configurado en local - Pendiente en producción

### 3. Script de creación de admin ✅
- **Ubicación:** `/backend/scripts/createAdmin.js`
- **Propósito:** Crear usuario administrador en MongoDB
- **Estado:** ✅ Creado - Pendiente de ejecución

### 4. Documentación completa ✅
- **Archivo:** `SOLUCION_ADMIN_DASHBOARD.md`
- **Contenido:** Guía completa de configuración y troubleshooting

---

## 🎯 PASOS PENDIENTES (EN ORDEN)

### PASO 1: Configurar CORS en el servidor de producción 🔴 CRÍTICO

**SSH al servidor:**
```bash
ssh root@161.35.227.156
```

**Editar `.env` del backend:**
```bash
cd /home/desvare/desvare-proyect/backend
nano .env
```

**Agregar esta línea (busca la sección de URLs permitidas):**
```env
ADMIN_URL=http://localhost:5176,https://admin.desvare.app
```

**Guardar y salir:**
- Ctrl + O → Enter → Ctrl + X

**Reiniciar el backend:**
```bash
pm2 restart desvare-backend
pm2 logs desvare-backend --lines 20
```

---

### PASO 2: Crear usuario admin en MongoDB 🔴 CRÍTICO

**Opción A: Desde el servidor (Recomendado)**

```bash
# Ya estás en SSH del paso anterior
cd /home/desvare/desvare-proyect/backend

# Crear la carpeta scripts si no existe
mkdir -p scripts

# Crear el archivo
nano scripts/createAdmin.js
```

**Copiar y pegar este código:**
```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const existingAdmin = await User.findOne({ 
      email: 'admin@desvare.app',
      userType: 'admin' 
    });

    if (existingAdmin) {
      console.log('⚠️ Ya existe un usuario admin');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const admin = new User({
      name: 'Administrador Desvare',
      email: 'admin@desvare.app',
      phone: '3000000000',
      password: hashedPassword,
      userType: 'admin',
      isActive: true
    });

    await admin.save();
    
    console.log('✅ Usuario admin creado');
    console.log('📧 Email: admin@desvare.app');
    console.log('🔑 Password: Admin123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdmin();
```

**Ejecutar el script:**
```bash
node scripts/createAdmin.js
```

**Deberías ver:**
```
✅ Conectado a MongoDB
✅ Usuario admin creado exitosamente
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: admin@desvare.app
🔑 Password: Admin123!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Opción B: Desde MongoDB Atlas (Alternativa)**

1. Ve a https://cloud.mongodb.com/
2. Browse Collections → users
3. Insert Document
4. Pegar este JSON (necesitas generar el hash de la contraseña primero)

---

### PASO 3: Commit y push de cambios locales 📤

```bash
# En tu máquina local
cd /Users/bgarcia/Documents/desvare-proyect

# Ver cambios
git status

# Agregar archivos
git add client-pwa/vercel.json
git add backend/.env
git add backend/scripts/createAdmin.js
git add client-pwa/src/pages/WaitingQuotes.jsx
git add SOLUCION_ADMIN_DASHBOARD.md
git add SOLUCION_NOTIFICACIONES_COMPLETA.md
git add LIMPIAR_BASE_DATOS_PRODUCCION.md
git add PASOS_FINALES_CONFIGURACION.md

# Commit
git commit -m "fix: configurar Admin Dashboard y notificaciones in-app

- Agregado vercel.json para solucionar 404 en producción
- Configurado CORS para Admin Dashboard (localhost:5176)
- Creado script para crear usuario admin
- Reactivadas notificaciones in-app en WaitingQuotes
- Documentación completa de soluciones"

# Push
git push origin main
```

---

### PASO 4: Probar Admin Dashboard 🧪

**Iniciar el Admin Dashboard:**
```bash
cd admin-dashboard
npm run dev -- --port 5176
```

**Abrir en el navegador:**
```
http://localhost:5176/login
```

**Credenciales:**
- Email: `admin@desvare.app`
- Password: `Admin123!`

**Verificar que funciona:**
- ✅ No hay errores de CORS en la consola
- ✅ Login exitoso
- ✅ Redirige a `/dashboard`
- ✅ Puedes ver las estadísticas

---

### PASO 5: Probar flujo completo de notificaciones 🔔

**Abrir 3 terminales:**

```bash
# Terminal 1 - Client PWA
cd client-pwa
npm run dev -- --port 5173

# Terminal 2 - Driver App
cd driver-app
npm run dev -- --port 5174

# Terminal 3 - Admin Dashboard
cd admin-dashboard
npm run dev -- --port 5176
```

**Flujo de prueba:**

1. **Admin Dashboard** (`localhost:5176`)
   - Login como admin
   - Ir a "Conductores"
   - Dejar abierto

2. **Driver App** (`localhost:5174`)
   - Registrar nuevo conductor
   - Completar todos los datos
   - Subir documentos

3. **Admin Dashboard**
   - Refrescar lista de conductores
   - Aprobar el conductor recién registrado

4. **Client PWA** (`localhost:5173`)
   - Registrarte como cliente nuevo
   - Aceptar permisos de notificación
   - Verificar en consola:
     ```
     ✅ Token FCM obtenido: ...
     ✅ Token FCM registrado en el servidor
     ```
   - Solicitar servicio de grúa

5. **Driver App**
   - Ver la solicitud en la lista
   - Abrir detalles
   - Enviar cotización (ej: $400,000)

6. **Client PWA** - **VERIFICAR:**
   - ✅ Marcador del conductor aparece en el mapa
   - ✅ **Banner amarillo aparece** 🟡
   - ✅ **Sonido de notificación** 🔊
   - ✅ **Vibración** (si estás en móvil) 📳
   - ✅ Banner dice: "¡Nueva Cotización! $400,000"
   - ✅ Puedes hacer click para ver detalles

---

## 📊 CHECKLIST COMPLETO

### Configuración del servidor:
- [ ] SSH al servidor DigitalOcean
- [ ] Agregar `ADMIN_URL` al `.env`
- [ ] Reiniciar backend con `pm2 restart`
- [ ] Crear usuario admin con script
- [ ] Verificar logs del backend

### Cambios locales:
- [x] Crear `vercel.json` en client-pwa
- [x] Agregar `ADMIN_URL` al `.env` local
- [x] Crear script `createAdmin.js`
- [x] Descomentar notificaciones in-app
- [ ] Hacer commit y push

### Pruebas:
- [ ] Login en Admin Dashboard funciona
- [ ] Aprobar conductor desde Admin
- [ ] Cliente recibe notificaciones visuales
- [ ] Banner amarillo aparece
- [ ] Sonido se reproduce
- [ ] Vibración funciona (móvil)

---

## 🎯 RESULTADO ESPERADO

Después de completar todos los pasos:

| Funcionalidad | Estado Actual | Estado Esperado |
|---------------|---------------|-----------------|
| Admin Dashboard login | ❌ Error CORS | ✅ Funciona |
| Aprobar conductores | ❌ No accesible | ✅ Funciona |
| Notificaciones in-app | ❌ Desactivadas | ✅ Activas |
| Banner visual | ❌ No aparece | ✅ Aparece |
| Sonido | ❌ No suena | ✅ Suena |
| Vibración | ❌ No vibra | ✅ Vibra |
| PWA en producción | ❌ Error 404 | ✅ Funciona |

---

## 📝 NOTAS IMPORTANTES

1. **Orden de ejecución:**
   - PRIMERO: Configurar servidor (PASO 1 y 2)
   - SEGUNDO: Commit y push (PASO 3)
   - TERCERO: Probar (PASO 4 y 5)

2. **Credenciales del admin:**
   - Email: `admin@desvare.app`
   - Password: `Admin123!`
   - ⚠️ Cambiar después del primer login

3. **URLs de prueba:**
   - Client PWA: `http://localhost:5173`
   - Driver App: `http://localhost:5174`
   - Admin Dashboard: `http://localhost:5176`

4. **Backend:**
   - Producción: `https://api.desvare.app`
   - MongoDB: Atlas (producción)

---

## 🆘 SI ALGO FALLA

### Error de CORS persiste:
```bash
# Verificar que ADMIN_URL esté en el .env del servidor
ssh root@161.35.227.156
cat /home/desvare/desvare-proyect/backend/.env | grep ADMIN_URL

# Reiniciar backend
pm2 restart desvare-backend
pm2 logs desvare-backend
```

### Admin no puede hacer login:
```bash
# Verificar que el usuario admin existe
# Desde MongoDB Atlas o ejecutar el script de nuevo
node scripts/createAdmin.js
```

### Notificaciones no aparecen:
```javascript
// En la consola del navegador del cliente:
console.log('Permiso:', Notification.permission);
console.log('Token FCM:', localStorage.getItem('fcmToken'));

// Si no hay token, limpiar y volver a registrarse:
localStorage.clear();
location.href = '/register';
```

---

**Estado:** 🟡 PENDIENTE - Requiere acceso SSH al servidor  
**Tiempo estimado:** 15-20 minutos  
**Prioridad:** ALTA - Necesario para pruebas completas
