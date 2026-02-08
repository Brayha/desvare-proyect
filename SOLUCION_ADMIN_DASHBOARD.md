# 🔧 Solución: Admin Dashboard - Error de CORS

**Fecha:** 2026-02-08  
**Problema:** Admin Dashboard no puede hacer login - Error de CORS  
**Estado:** ✅ DIAGNOSTICADO - PENDIENTE CONFIGURAR EN PRODUCCIÓN

---

## 🐛 PROBLEMA IDENTIFICADO

### Error en la consola:
```
Access to XMLHttpRequest at 'https://api.desvare.app/api/admin/login' from origin 'http://localhost:5176' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Causa raíz:
El backend de producción (`https://api.desvare.app`) **NO tiene configurado** `ADMIN_URL` en las variables de entorno, por lo que el CORS bloquea las peticiones desde `localhost:5176`.

---

## ✅ SOLUCIÓN

### Opción 1: Configurar ADMIN_URL en el servidor de producción (Recomendado)

**Pasos:**

1. **SSH al servidor DigitalOcean:**
   ```bash
   ssh root@161.35.227.156
   ```

2. **Editar el archivo `.env` del backend:**
   ```bash
   cd /home/desvare/desvare-proyect/backend
   nano .env
   ```

3. **Agregar la línea de ADMIN_URL:**
   ```env
   # URLs permitidas (CORS)
   CLIENT_URL=https://app.desvare.app
   DRIVER_URL=http://localhost:5174,http://localhost:8100
   ADMIN_URL=http://localhost:5176,https://admin.desvare.app
   ```

4. **Guardar y salir:**
   - Ctrl + O (guardar)
   - Enter (confirmar)
   - Ctrl + X (salir)

5. **Reiniciar el backend:**
   ```bash
   pm2 restart desvare-backend
   ```

6. **Verificar que funcionó:**
   ```bash
   pm2 logs desvare-backend --lines 20
   ```

   Deberías ver:
   ```
   ✅ Servidor corriendo en puerto 5001
   ✅ MongoDB conectado
   ✅ Socket.IO inicializado
   ```

---

### Opción 2: Usar el backend local (Temporal para pruebas)

Si no puedes acceder al servidor ahora, puedes usar el backend local:

**Pasos:**

1. **Cambiar el `.env` del Admin Dashboard:**
   ```env
   VITE_API_URL=http://localhost:5001
   VITE_SOCKET_URL=http://localhost:5001
   ```

2. **Iniciar el backend local:**
   ```bash
   cd backend
   npm start
   ```

3. **Reiniciar el Admin Dashboard:**
   ```bash
   cd admin-dashboard
   npm run dev -- --port 5176
   ```

**Desventaja:** Solo funcionará con datos locales, no con la base de datos de producción.

---

## 📋 CREDENCIALES DE ADMIN

Para crear un usuario admin en la base de datos, necesitas ejecutar este script:

### Script de creación de admin:

**Archivo:** `backend/scripts/createAdmin.js`

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ 
      email: 'admin@desvare.app',
      userType: 'admin' 
    });

    if (existingAdmin) {
      console.log('⚠️ Ya existe un usuario admin con ese email');
      process.exit(0);
    }

    // Crear hash de la contraseña
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    // Crear usuario admin
    const admin = new User({
      name: 'Administrador Desvare',
      email: 'admin@desvare.app',
      phone: '3000000000',
      password: hashedPassword,
      userType: 'admin',
      isActive: true
    });

    await admin.save();
    console.log('✅ Usuario admin creado exitosamente');
    console.log('📧 Email: admin@desvare.app');
    console.log('🔑 Password: Admin123!');
    console.log('⚠️ CAMBIA LA CONTRASEÑA DESPUÉS DEL PRIMER LOGIN');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdmin();
```

### Ejecutar el script:

```bash
# SSH al servidor
ssh root@161.35.227.156

# Ir a la carpeta del backend
cd /home/desvare/desvare-proyect/backend

# Crear el script
nano scripts/createAdmin.js
# (pegar el código de arriba)

# Ejecutar el script
node scripts/createAdmin.js
```

---

## 🧪 PROBAR EL LOGIN

Después de configurar CORS y crear el admin:

1. **Abrir Admin Dashboard:**
   ```
   http://localhost:5176/login
   ```

2. **Ingresar credenciales:**
   - Email: `admin@desvare.app`
   - Password: `Admin123!`

3. **Verificar en consola:**
   ```
   ✅ Login exitoso
   ```

4. **Deberías ser redirigido a:**
   ```
   http://localhost:5176/dashboard
   ```

---

## 📊 VERIFICACIÓN COMPLETA

### Checklist de configuración:

- [ ] `ADMIN_URL` agregado al `.env` del backend de producción
- [ ] Backend reiniciado con `pm2 restart desvare-backend`
- [ ] Usuario admin creado en MongoDB
- [ ] Admin Dashboard corriendo en `localhost:5176`
- [ ] Login funciona sin errores de CORS
- [ ] Redirige al dashboard después del login

---

## 🔧 TROUBLESHOOTING

### Si sigue sin funcionar:

1. **Verificar que el backend esté corriendo:**
   ```bash
   pm2 status
   ```

2. **Ver logs del backend:**
   ```bash
   pm2 logs desvare-backend --lines 50
   ```

3. **Verificar CORS en los logs:**
   Deberías ver algo como:
   ```
   CORS origins: [
     'https://app.desvare.app',
     'http://localhost:5176',
     ...
   ]
   ```

4. **Limpiar caché del navegador:**
   - Chrome: Ctrl + Shift + Delete
   - Seleccionar "Todo el tiempo"
   - Marcar "Imágenes y archivos en caché"
   - Limpiar

5. **Reiniciar el Admin Dashboard:**
   ```bash
   # Detener (Ctrl + C)
   # Volver a iniciar
   npm run dev -- --port 5176
   ```

---

## 📝 NOTAS IMPORTANTES

1. **Seguridad:**
   - Cambia la contraseña del admin después del primer login
   - Usa contraseñas fuertes en producción
   - Considera agregar autenticación de dos factores (2FA)

2. **CORS en producción:**
   - Solo agrega orígenes confiables
   - No uses `*` (permitir todos los orígenes)
   - Mantén la lista actualizada

3. **Monitoreo:**
   - Revisa los logs regularmente
   - Configura alertas para errores críticos
   - Monitorea intentos de login fallidos

---

**Estado:** 🟡 PENDIENTE - Necesita configuración en el servidor de producción  
**Próximo paso:** SSH al servidor y agregar `ADMIN_URL` al `.env`
