# 🚨 Solución Completa: Driver App APK No Se Conecta

## 📊 Estado Actual

### ✅ Lo que FUNCIONA:
- **Admin Dashboard**: ✅ Conectado y funcionando en `https://desvare-admin.vercel.app`
- **Client PWA**: ✅ Conectado y funcionando en `https://desvare-proyect-mpdw.vercel.app`
- **Backend**: ✅ Corriendo en DigitalOcean con PM2, conectado a MongoDB Atlas

### ❌ Lo que NO FUNCIONA:
- **Driver App (APK)**: ❌ No se conecta al backend
  - Registro falla: "Error al registrarte. Intenta de nuevo"
  - Login falla: "Error al iniciar sesión. Intenta de nuevo"

---

## 🔍 Diagnóstico del Problema

### 1. **Backend: CORS Configuración**
**Estado:** ✅ CORRECTO

```bash
# En DigitalOcean: /home/desvare/desvare-proyect/backend/.env
DRIVER_URL=http://localhost:5174,http://localhost:8100,capacitor://localhost,http://localhost
```

El backend **SÍ está configurado** para aceptar peticiones de Capacitor.

### 2. **Driver App: Variables de Entorno**
**Estado:** ✅ CORRECTO

```bash
# En local: driver-app/.env
VITE_API_URL=https://api.desvare.app
VITE_SOCKET_URL=https://api.desvare.app
```

La app **SÍ apunta** al backend correcto.

### 3. **APK Compilado**
**Estado:** ✅ ACTUALIZADO

El APK más reciente fue compilado **DESPUÉS** de actualizar el `.env`, por lo que tiene la configuración correcta.

---

## 🚨 PROBLEMA REAL DETECTADO

### Error en los Logs de DigitalOcean

```
❌ Error inicializando Firebase: Cannot find module '/home/desvare/desvare-proyect/backend/firebase-service-account.json'
⚠️ Las notificaciones push no estarán disponibles
```

**Este NO es el problema crítico**, solo afecta notificaciones push (no login/registro).

### PROBLEMA CRÍTICO: Red o SSL

Las apps de Android compiladas con Capacitor tienen **restricciones de seguridad** adicionales:

1. **Android bloquea HTTP por defecto** (solo permite HTTPS)
2. **Certificados SSL autofirmados NO funcionan** en producción
3. **El dominio debe tener certificado SSL válido**

---

## ✅ SOLUCIÓN

### PASO 1: Verificar Certificado SSL del Backend

En tu computadora local, ejecuta:

```bash
curl -I https://api.desvare.app
```

**Deberías ver:**
```
HTTP/2 200
server: nginx
```

**Si ves error de certificado o HTTP/1.1, el SSL NO está configurado correctamente.**

---

### PASO 2: Configurar Network Security Config (Android)

Crea el archivo: `driver-app/android/app/src/main/res/xml/network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.desvare.app</domain>
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </domain-config>
</network-security-config>
```

Luego edita: `driver-app/android/app/src/main/AndroidManifest.xml`

Agrega dentro de `<application>`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

---

### PASO 3: Agregar Permisos de Internet

En `driver-app/android/app/src/main/AndroidManifest.xml`, asegúrate de tener:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

### PASO 4: Habilitar Logs en el APK para Debug

En `driver-app/capacitor.config.json`, agrega:

```json
{
  "appId": "com.desvare.driver",
  "appName": "Desvare Driver",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": false,
    "allowNavigation": [
      "api.desvare.app"
    ]
  },
  "android": {
    "allowMixedContent": false,
    "captureInput": true,
    "webContentsDebuggingEnabled": true
  }
}
```

---

### PASO 5: Recompilar APK

```bash
cd driver-app
npm run build
npx cap sync
npx cap open android
```

En Android Studio:
- **Build → Clean Project**
- **Build → Rebuild Project**
- **Build → Build Bundle(s) / APK(s) → Build APK(s)**

---

### PASO 6: Debug con Chrome DevTools

1. Conecta el celular con USB
2. Habilita "Depuración USB" en el celular
3. Abre Chrome: `chrome://inspect`
4. Abre la Driver App en el celular
5. Click en "inspect" para ver la consola
6. Intenta login/registro
7. **Verás el error exacto en la consola**

---

## 🔧 Alternativa Rápida: Permitir HTTP Temporal

**⚠️ SOLO PARA TESTING (NO PARA PRODUCCIÓN)**

En `driver-app/android/app/src/main/AndroidManifest.xml`:

```xml
<application
    android:usesCleartextTraffic="true"
    ...>
```

Esto permitirá conexiones HTTP inseguras para testing.

---

## 📱 Probar con Conductor Existente

El conductor **"Driver Test"** ya existe con:
- **Teléfono:** 3100000000
- **Estado:** Aprobado y Activo

Para hacer login:
1. Abre la app
2. Click en "¿Ya tienes cuenta? Ingresa aquí"
3. Ingresa: **3100000000**
4. El backend generará un OTP (visible en logs de DigitalOcean)
5. Ingresa el OTP en la app

**El OTP aparecerá en los logs así:**

```bash
✅ OTP generado para login de conductor 3100000000: 123456
```

---

## 🎯 Resumen de la Solución

1. ✅ Backend configurado correctamente
2. ✅ Variables de entorno correctas
3. ⚠️ Falta configurar Network Security en Android
4. ⚠️ Falta habilitar debug logs
5. 🔍 Necesitas ver los logs en Chrome DevTools para el error exacto

---

## 📞 Siguiente Paso Inmediato

**Ejecuta Chrome DevTools mientras usas la app:**

1. Conecta celular con USB
2. Abre `chrome://inspect` en Chrome
3. Abre Driver App en celular
4. Click "inspect"
5. Intenta login
6. **Comparte captura de la consola**

Eso me dirá **exactamente** qué está bloqueando la conexión.

---

**Fecha:** 05/02/2026  
**Autor:** Assistant  
**Estado:** Pendiente de implementar solución Android Network Security
