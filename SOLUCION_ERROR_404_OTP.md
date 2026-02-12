# 🔧 Solución: Error 404 al Verificar OTP en PWA

## ✅ Lo que SÍ Funciona:

Veo en tus logs que:
1. ✅ Backend funcionando correctamente
2. ✅ SMS enviado exitosamente: **"Su codigo de verificacion para Desvare OTP es: 765708"**
3. ✅ Twilio funcionando (número `3505790415` verificado)

## ❌ El Problema:

Error en PWA:
```
Error al verificar OTP: AxiosError: Request failed with status code 404
```

### Causa:
La PWA no tiene configurada la variable `VITE_API_URL` correctamente en Vercel, por lo que está intentando conectarse a `http://localhost:5001` (que no existe en producción).

---

## 🔧 Solución: Agregar Variables de Entorno en Vercel

### Paso 1: Ir a Vercel

1. https://vercel.com/brayan-garcias-projects/desvare-proyect-mpdw/settings/environment-variables

### Paso 2: Agregar/Verificar estas variables:

#### Variable 1: VITE_API_URL
```
Name: VITE_API_URL
Value: https://api.desvare.app
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### Variable 2: VITE_SOCKET_URL
```
Name: VITE_SOCKET_URL
Value: https://api.desvare.app
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### Paso 3: Guardar

Click en "Save" o "Add"

### Paso 4: Redeploy

**IMPORTANTE:** Las variables de entorno solo se aplican en el próximo build.

**Opción A: Trigger Deploy (Recomendado)**
1. Ir a: https://vercel.com/brayan-garcias-projects/desvare-proyect-mpdw
2. Click en "Deployments"
3. Click en los 3 puntos (...) del último deployment
4. Click en "Redeploy"
5. Seleccionar "Use existing Build Cache: No"
6. Click en "Redeploy"

**Opción B: Push a GitHub**
```bash
cd /Users/bgarcia/Documents/desvare-proyect/client-pwa
git commit --allow-empty -m "trigger: Redeploy para aplicar variables de entorno"
git push origin main
```

---

## 📋 Variables Completas Recomendadas para Vercel

Basado en tu pantallazo, estas son las variables que deberías tener:

### Variables de API:
```
VITE_API_URL=https://api.desvare.app
VITE_SOCKET_URL=https://api.desvare.app
```

### Variables de Firebase (ya las tienes):
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=desvare-production.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=desvare-production
VITE_FIREBASE_STORAGE_BUCKET=desvare-production.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

### Variable de Mapbox (ya la tienes):
```
VITE_MAPBOX_TOKEN=pk.eyJ1...
```

### Variables de Google Maps (ya las tienes):
```
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

---

## 🧪 Testing Después del Redeploy

### 1. Esperar a que termine el deploy (2-3 minutos)

### 2. Limpiar caché del navegador
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 3. Probar registro:
1. Ir a: https://desvare.app
2. Registrarse con el número verificado en Twilio
3. Esperar SMS
4. Ingresar código
5. ✅ Debe funcionar

### 4. Verificar en consola del navegador:

Abrir DevTools (F12) y buscar:
```javascript
// Debe mostrar:
API_URL: "https://api.desvare.app"
```

**NO debe mostrar:**
```javascript
// ❌ Incorrecto:
API_URL: "http://localhost:5001"
```

---

## 🔍 Verificar Variables en Build

Después del redeploy, puedes verificar en los logs de Vercel:

1. Ir a: https://vercel.com/brayan-garcias-projects/desvare-proyect-mpdw
2. Click en el último deployment
3. Click en "Build Logs"
4. Buscar: "Environment Variables"

Debe mostrar:
```
VITE_API_URL: https://api.desvare.app ✅
```

---

## 📊 Flujo Correcto Después del Fix

```
Usuario en PWA (desvare.app)
    ↓
Registro → Frontend envía a: https://api.desvare.app/api/auth/register-otp
    ↓
Backend envía SMS via Twilio
    ↓
Usuario ingresa código
    ↓
Verificación → Frontend envía a: https://api.desvare.app/api/auth/verify-otp
    ↓
✅ Login exitoso
```

---

## ⚠️ Nota sobre Números Verificados en Twilio

Tu cuenta de Twilio sigue en **Trial**. Solo funcionará con números que hayas verificado.

### Números que debes verificar:

1. **Tu número de prueba:** `+57 350 579 0415` ✅ (ya verificado)
2. **Otros números de testing:**
   - Ir a: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
   - Agregar 2-3 números más para testing

---

## 🆘 Si sigue sin funcionar después del redeploy

### 1. Verificar que las variables se aplicaron:

Abrir DevTools (F12) en https://desvare.app:

```javascript
// En la consola:
console.log(import.meta.env.VITE_API_URL);
// Debe mostrar: "https://api.desvare.app"
```

### 2. Verificar Network Tab:

- Abrir DevTools → Network
- Intentar registro
- Buscar request a `/api/auth/verify-otp`
- Verificar URL completa

**Debe ser:**
```
https://api.desvare.app/api/auth/verify-otp ✅
```

**NO debe ser:**
```
http://localhost:5001/api/auth/verify-otp ❌
```

### 3. Limpiar caché agresivamente:

```
1. Abrir DevTools (F12)
2. Click derecho en el botón de refresh
3. Seleccionar "Empty Cache and Hard Reload"
```

---

## 📝 Checklist

- [ ] Variables agregadas en Vercel
  - [ ] VITE_API_URL=https://api.desvare.app
  - [ ] VITE_SOCKET_URL=https://api.desvare.app
- [ ] Redeploy triggered en Vercel
- [ ] Deploy completado (2-3 minutos)
- [ ] Caché del navegador limpiado
- [ ] Número verificado en Twilio
- [ ] Prueba de registro exitosa

---

**Fecha:** 12 de febrero de 2026  
**Problema:** Error 404 al verificar OTP  
**Causa:** Variable VITE_API_URL no configurada en Vercel  
**Solución:** Agregar variable y redeploy
