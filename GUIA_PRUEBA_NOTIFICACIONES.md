# 🧪 Guía de Prueba: Notificaciones en Tiempo Real

## ✅ Servidores Iniciados

Todos los servidores están corriendo y listos:

- ✅ **Backend:** http://localhost:5001 (Socket.IO activo)
- ✅ **Driver App:** http://localhost:5173
- ✅ **Admin Dashboard:** http://localhost:5174

---

## 📋 Pasos para Probar el Flujo Completo

### **Paso 1: Registrar un Nuevo Conductor** 🚗

1. Abre **Driver App** en tu navegador: http://localhost:5173
2. Click en "Comenzar" → "Registrarse"
3. Ingresa un teléfono nuevo (ej: `3001234567`)
4. Ingresa el código OTP (cualquier código de 6 dígitos funciona en desarrollo)
5. Completa el registro:
   - Nombre completo
   - Email
   - Ciudad
   - Tipo de entidad (Persona Natural o Empresa)
   - Capacidades de vehículos (peso, grúa, plataforma)
   - Sube **todos los documentos** (cédula, selfie, licencia, SOAT, tarjeta de propiedad, seguro, foto grúa)
6. Click en "Completar Registro"
7. **Deberías llegar a la página `/under-review`** con el mensaje:
   > "Tu perfil está en revisión. Nuestro equipo está revisando tus documentos..."

**🔴 IMPORTANTE:** 
- **NO cierres esta pestaña** del navegador
- Mantén la página `/under-review` abierta
- Abre la **Consola del Navegador** (F12 o Cmd+Option+I) para ver los logs de Socket.IO

**En la consola deberías ver:**
```
✅ Socket.IO conectado: [socket-id]
📡 Conductor [user-id] registrado en Socket.IO
```

---

### **Paso 2: Ir al Admin Dashboard** 👨‍💼

1. Abre una **nueva pestaña** en tu navegador
2. Ve al **Admin Dashboard**: http://localhost:5174
3. **Login:**
   - Email: `desvareweb@gmail.com`
   - Contraseña: `admin123*`
4. Click en "Conductores" en el menú lateral
5. Deberías ver el conductor que acabas de registrar con estado "Pendiente"

---

### **Paso 3: Revisar Documentos del Conductor** 📄

1. Click en el conductor recién registrado
2. **Revisa todos los documentos:**
   - ✅ Cédula (frente y reverso)
   - ✅ Selfie
   - ✅ Licencia de conducción (frente y reverso)
   - ✅ SOAT
   - ✅ Tarjeta de propiedad (frente y reverso)
   - ✅ Seguro
   - ✅ Foto de la grúa

**💡 Todas las imágenes deberían cargarse correctamente gracias a la solución de DigitalOcean Spaces que implementamos antes.**

---

### **Paso 4: Aprobar al Conductor** ✅

1. En la página de detalle del conductor, baja hasta los botones de acción
2. **Click en "Aprobar Conductor"**
3. Confirma la acción si aparece un diálogo

**🎬 ¡Aquí viene la magia!**

---

### **Paso 5: Ver la Notificación en Tiempo Real** 🔔

**Inmediatamente después de aprobar:**

1. **Regresa a la pestaña de la Driver App** (que dejaste en `/under-review`)
2. **Deberías ver:**
   - 🟢 Un **toast verde** en la parte superior: "¡Tu cuenta ha sido aprobada! Redirigiendo..."
   - ⚡ Después de **1.5 segundos**, serás redirigido automáticamente a `/home`

3. **En la consola del navegador (Driver App) deberías ver:**
   ```
   🎉 ¡Cuenta aprobada! { status: 'approved', message: '¡Tu cuenta ha sido aprobada!', timestamp: ... }
   ```

4. **En la terminal del Backend deberías ver:**
   ```
   ✅ Conductor [id] APROBADO por desvareweb@gmail.com
   📡 Evento Socket.IO enviado a driver:[id]
   📱 Push notification enviada a [nombre]
   ```

---

### **Paso 6: Verificar que el Conductor está en Home** 🏠

1. Una vez redirigido a `/home`, el conductor ya puede:
   - Ver su perfil
   - Recibir solicitudes de servicio
   - Empezar a trabajar

---

## 🧪 Prueba Adicional: Flujo de Rechazo

Si quieres probar el **rechazo de conductores:**

1. Registra otro conductor nuevo
2. Ve al Admin Dashboard → Conductores → [Nuevo Conductor]
3. Click en **"Rechazar Conductor"**
4. Ingresa una razón del rechazo (ej: "Documentos no claros")
5. Confirma

**En la Driver App:**
- 🔴 Toast rojo: "Tu cuenta ha sido rechazada."
- ⚡ Redirigido a `/rejected` con la razón del rechazo

---

## 🔍 Troubleshooting

### **Problema 1: No se muestra el toast**

**Causas posibles:**
- Socket.IO no está conectado
- El usuario no se registró correctamente en Socket.IO

**Solución:**
1. Abre la consola del navegador en la Driver App
2. Busca mensajes de Socket.IO:
   - ✅ Si ves: `✅ Socket.IO conectado` → está bien
   - ❌ Si ves: `❌ Error conectando Socket.IO` → verifica el backend

### **Problema 2: Socket.IO no se conecta**

**Solución:**
1. Verifica que el backend esté en puerto **5001**
2. En la Driver App, verifica que `.env` tenga:
   ```
   VITE_API_URL=http://localhost:5001
   ```
3. Recarga la página de la Driver App (F5)

### **Problema 3: La página no redirige después del toast**

**Posible causa:** JavaScript bloqueado o error en el código

**Solución:**
1. Revisa la consola del navegador para errores
2. Verifica que `history.replace()` esté funcionando

### **Problema 4: Backend no envía notificaciones**

**En la terminal del backend, busca:**
```
❌ Error: io is undefined
```

**Solución:** El backend debería tener `global.io` configurado. Verifica que `server.js` tenga:
```javascript
global.io = io;
```

---

## 📊 Logs Esperados

### **Backend (Terminal):**
```
🔌 Nuevo cliente conectado: abc123
🚗 Conductor registrado: 6930f69f04bb4183517e10f9
✅ Conductor 6930f69f04bb4183517e10f9 unido a salas: drivers, driver:6930f69f04bb4183517e10f9
✅ Conductor 6930f69f04bb4183517e10f9 APROBADO por desvareweb@gmail.com
📡 Evento Socket.IO enviado a driver:6930f69f04bb4183517e10f9
📱 Push notification enviada a [Nombre]
```

### **Driver App (Consola del Navegador):**
```
✅ Socket.IO conectado: abc123def456
📡 Conductor 6930f69f04bb4183517e10f9 registrado en Socket.IO
🎉 ¡Cuenta aprobada! {status: 'approved', message: '¡Tu cuenta ha sido aprobada!', timestamp: ...}
```

---

## 🎉 ¡Éxito!

Si seguiste todos los pasos y viste:
- ✅ Toast de aprobación
- ✅ Redirección automática a `/home`
- ✅ Logs correctos en backend y frontend

**¡El sistema de notificaciones en tiempo real está funcionando perfectamente!** 🚀

---

## 📝 Notas Importantes

1. **Socket.IO solo funciona cuando la app está abierta**
   - Si el conductor cierra la app, no recibirá la notificación Socket.IO
   - Para esto están las **Push Notifications** (requiere configurar Firebase)

2. **La próxima vez que el conductor inicie sesión:**
   - El backend verificará su estado (`approved`)
   - Lo redirigirá automáticamente a `/home`

3. **Escalabilidad:**
   - Este sistema funciona con 1 o 1000 conductores simultáneos
   - Cada conductor tiene su propia sala: `driver:${id}`

---

💡 **¿Preguntas o problemas?** Revisa los logs del backend y la consola del navegador. Todos los eventos tienen emojis para fácil identificación.

