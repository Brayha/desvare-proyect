# 🧪 Guía de Prueba Local con Conexión a Producción

## 📋 Resumen de la Sesión Actual

### ✅ Lo que hemos hecho:
1. **Analizamos el error** `Cannot read properties of null (reading '_id')` en `Home.jsx`
2. **Identificamos la causa:** El estado `user` se inicializaba como `null` y causaba errores al intentar acceder a `user._id` antes de que se cargara desde `localStorage`
3. **Implementamos la solución:** Agregamos validaciones defensivas en 3 funciones críticas:
   - `handleToggleAvailability` (toggle Activo/Ocupado)
   - `handleQuote` (ver detalle de solicitud)
   - `handleSendQuote` (enviar cotización)
4. **Creamos documentación:** `FIX_USER_NULL_ERROR.md` con toda la explicación

---

## 🚀 Estado Actual del Servidor de Desarrollo

### ✅ El servidor YA ESTÁ CORRIENDO
- **URL:** http://localhost:5175
- **Puerto:** 5175
- **Estado:** ✅ Activo (HTTP 200)
- **PID del proceso:** 6022

### 📡 Configuración de Conexión
- **Backend de Producción:** https://api.desvare.app
- **Socket.IO:** https://api.desvare.app
- **CORS:** Ya configurado en el backend de producción para permitir `http://localhost:5175`

---

## 🧪 Flujo de Prueba Completo

### 1. Abrir la app en el navegador
```
http://localhost:5175
```

### 2. Abrir Chrome DevTools
- **Opción 1:** Presiona `F12` o `Cmd + Option + I` (Mac)
- **Opción 2:** Click derecho → "Inspeccionar"

### 3. Ir a la pestaña "Console"
Aquí verás todos los logs de la app, incluyendo:
- ✅ Conexiones exitosas
- ❌ Errores
- 📝 Logs de debugging

### 4. Ir a la pestaña "Network"
Aquí verás todas las peticiones HTTP:
- Filtrar por `XHR` para ver solo las peticiones a la API
- Verificar que las peticiones van a `https://api.desvare.app`

---

## 📱 Flujo de Prueba del Error Corregido

### Paso 1: Registro/Login
1. Ingresa tu número de teléfono: `+57 350 579 0415` (o el que uses)
2. Click en "Continuar"
3. Verifica que la petición a `/api/drivers/register-initial` sea exitosa

### Paso 2: Verificar OTP
1. Ingresa el código de 6 dígitos que recibiste por SMS
2. Click en "Validar código"
3. Verifica que la petición a `/api/drivers/verify-otp` sea exitosa
4. **Verifica en la consola:**
   ```javascript
   ✅ OTP verificado: { token: "...", user: {...} }
   📊 Estado del conductor: approved (o el que tengas)
   🚀 Navegando a home...
   ```

### Paso 3: Probar el Toggle de Disponibilidad (CRÍTICO)
1. **Inmediatamente** al llegar a `Home`, sin esperar, haz click en el botón "Activo/Ocupado"
2. **Comportamiento esperado:**
   - Si haces click muy rápido (antes de 1 segundo), debe aparecer el toast:
     ```
     ⚠️ Error: Usuario no cargado. Intenta de nuevo.
     ```
   - En la consola debe aparecer:
     ```
     ❌ Error: user no está definido o no tiene _id
     ```
   - **NO debe aparecer el error:** `TypeError: Cannot read properties of null (reading '_id')`

3. **Espera 1-2 segundos** y vuelve a hacer click en el toggle
4. **Comportamiento esperado:**
   - El toggle debe funcionar correctamente
   - Debe aparecer el toast:
     ```
     🟢 Ahora estás ACTIVO
     ```
   - En la consola debe aparecer:
     ```
     ✅ Disponibilidad actualizada
     ```

### Paso 4: Probar otras funciones
1. **Ver solicitudes pendientes** (si hay alguna)
2. **Hacer click en "Cotizar"** en una solicitud
3. **Verificar que NO aparezca el error** `Cannot read properties of null (reading '_id')`

---

## 🔍 Qué Verificar en Chrome DevTools

### Console (Consola)
✅ **Logs esperados:**
```javascript
🔄 Vista Home activada - Recargando requests del backend...
✅ Imagen de perfil cargada
📡 Socket.IO conectado
✅ Conductor registrado en Socket.IO
📥 Solicitudes cargadas: [...]
```

❌ **Errores que NO deben aparecer:**
```javascript
TypeError: Cannot read properties of null (reading '_id')
```

### Network (Red)
✅ **Peticiones esperadas:**
- `POST https://api.desvare.app/api/drivers/register-initial` → 200 OK
- `POST https://api.desvare.app/api/drivers/verify-otp` → 200 OK
- `GET https://api.desvare.app/api/requests/driver/:driverId` → 200 OK
- `PATCH https://api.desvare.app/api/drivers/toggle-availability` → 200 OK

❌ **Errores que NO deben aparecer:**
- CORS policy errors
- 500 Internal Server Error
- 401 Unauthorized (después de login)

### Application → Local Storage
✅ **Datos esperados:**
```javascript
token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
user: "{\"_id\":\"698b8fec801020e25659a63\",\"name\":\"Test Drive\",...}"
```

---

## 🐛 Cómo Reportar Errores

Si encuentras algún error, comparte:

1. **Screenshot de la consola** (pestaña Console)
2. **Screenshot de la pestaña Network** (filtrando por XHR)
3. **Descripción del flujo:**
   - ¿Qué estabas haciendo?
   - ¿Qué esperabas que pasara?
   - ¿Qué pasó en realidad?

---

## 🛑 Cómo Detener el Servidor (si es necesario)

Si necesitas detener el servidor de desarrollo:

```bash
# Opción 1: Encontrar el PID del proceso
lsof -ti:5175

# Opción 2: Matar el proceso
kill -9 6022  # Reemplaza 6022 con el PID actual

# Opción 3: Si tienes la terminal donde lo iniciaste, presiona Ctrl+C
```

---

## 🔄 Cómo Reiniciar el Servidor (si es necesario)

Si necesitas reiniciar el servidor:

```bash
cd /Users/bgarcia/Documents/desvare-proyect/driver-app
npm run dev
```

El servidor se iniciará en: `http://localhost:5175`

---

## 📊 Checklist de Pruebas

### ✅ Funcionalidad Básica
- [ ] Registro con número de teléfono
- [ ] Verificación de OTP
- [ ] Login exitoso
- [ ] Navegación a Home

### ✅ Error Corregido (CRÍTICO)
- [ ] Toggle de disponibilidad NO crashea al hacer click rápido
- [ ] Aparece toast "Usuario no cargado" si se hace click muy rápido
- [ ] Toggle funciona correctamente después de 1-2 segundos
- [ ] NO aparece error `Cannot read properties of null (reading '_id')` en la consola

### ✅ Funcionalidad Avanzada
- [ ] Ver solicitudes pendientes
- [ ] Hacer click en "Cotizar" en una solicitud
- [ ] Enviar cotización
- [ ] Ver detalle de solicitud
- [ ] Ver detalle de cotización

### ✅ Conectividad
- [ ] Todas las peticiones van a `https://api.desvare.app`
- [ ] NO hay errores de CORS
- [ ] Socket.IO se conecta correctamente
- [ ] Se reciben notificaciones push (si hay solicitudes nuevas)

---

## 🎯 Resultado Esperado

Si todo funciona correctamente:
- ✅ La app se conecta al backend de producción sin errores de CORS
- ✅ El error `Cannot read properties of null (reading '_id')` está resuelto
- ✅ Todas las funciones trabajan normalmente
- ✅ Estás listo para generar una nueva APK para pruebas en dispositivo Android

---

## 📝 Próximos Pasos (después de probar)

1. **Si todo funciona bien localmente:**
   - Generar nueva APK en Android Studio
   - Instalar en dispositivo Android
   - Probar en dispositivo real

2. **Si encuentras errores:**
   - Compartir screenshots de la consola y Network
   - Describir el flujo que causó el error
   - Continuar debugging

---

**Fecha:** 11 de febrero de 2026  
**Servidor:** http://localhost:5175 → https://api.desvare.app  
**Estado:** ✅ Servidor activo y listo para pruebas
