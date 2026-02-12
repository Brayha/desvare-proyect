# 🔧 SOLUCIÓN: Error 404 al Verificar OTP en PWA

## 🎯 Problema Identificado

### ✅ Lo que SÍ funciona:
- Backend envía OTP: ✅
- SMS llega al celular: ✅ (código: 765708)
- Backend está corriendo: ✅

### ❌ Lo que NO funciona:
- PWA no puede verificar el OTP
- Error: `AxiosError: Request failed with status code 404`

---

## 🔍 Causa Raíz

La PWA en **Vercel** NO tiene configuradas las variables de entorno, por lo tanto está intentando conectarse a:

```
http://localhost:5001  ❌ (fallback cuando no encuentra VITE_API_URL)
```

En lugar de:

```
https://api.desvare.app  ✅ (correcto)
```

---

## ✅ Solución: Configurar Variables de Entorno en Vercel

### Paso 1: Ir a la Configuración de Vercel

1. **Login en Vercel:**
   - https://vercel.com/brayan-garcias-projects

2. **Seleccionar proyecto:**
   - `desvare-proyect-mpdw` (o el nombre de tu proyecto PWA)

3. **Ir a Settings:**
   - Click en "Settings" (arriba a la derecha)

4. **Ir a Environment Variables:**
   - En el menú lateral, click en "Environment Variables"

---

### Paso 2: Agregar Variables de Entorno

Click en "Add" y agregar **TODAS** estas variables:

#### Variable 1: VITE_API_URL
```
Key:   VITE_API_URL
Value: https://api.desvare.app
Environment: Production, Preview, Development
```

#### Variable 2: VITE_SOCKET_URL
```
Key:   VITE_SOCKET_URL
Value: https://api.desvare.app
Environment: Production, Preview, Development
```

#### Variable 3: VITE_MAPBOX_TOKEN
```
Key:   VITE_MAPBOX_TOKEN
Value: pk.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environment: Production, Preview, Development
```

#### Variable 4: VITE_GOOGLE_MAPS_API_KEY
```
Key:   VITE_GOOGLE_MAPS_API_KEY
Value: AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environment: Production, Preview, Development
```

#### Variable 5: VITE_FIREBASE_API_KEY
```
Key:   VITE_FIREBASE_API_KEY
Value: AIzaSyBnF2OsNcq4FS-aYVs_ymPEdPK8N2wze_Q
Environment: Production, Preview, Development
```

#### Variable 6: VITE_FIREBASE_AUTH_DOMAIN
```
Key:   VITE_FIREBASE_AUTH_DOMAIN
Value: desvare-production.firebaseapp.com
Environment: Production, Preview, Development
```

#### Variable 7: VITE_FIREBASE_PROJECT_ID
```
Key:   VITE_FIREBASE_PROJECT_ID
Value: desvare-production
Environment: Production, Preview, Development
```

#### Variable 8: VITE_FIREBASE_STORAGE_BUCKET
```
Key:   VITE_FIREBASE_STORAGE_BUCKET
Value: desvare-production.firebasestorage.app
Environment: Production, Preview, Development
```

#### Variable 9: VITE_FIREBASE_MESSAGING_SENDER_ID
```
Key:   VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 200097542658
Environment: Production, Preview, Development
```

#### Variable 10: VITE_FIREBASE_APP_ID
```
Key:   VITE_FIREBASE_APP_ID
Value: 1:200097542658:web:22e41ad8dbef3c6889ed1b
Environment: Production, Preview, Development
```

#### Variable 11: VITE_FIREBASE_MEASUREMENT_ID
```
Key:   VITE_FIREBASE_MEASUREMENT_ID
Value: G-MZB7RBJL83
Environment: Production, Preview, Development
```

#### Variable 12: VITE_FIREBASE_VAPID_KEY
```
Key:   VITE_FIREBASE_VAPID_KEY
Value: BMr5Hz6cXWdWtiPI8qJFi1ITtP3OdhnleHUqaco53EEginbDYrC1O36Hxtjz1gaSj-gdLkeQwfjbRKRZlkMr1sE
Environment: Production, Preview, Development
```

---

### Paso 3: Guardar y Redesplegar

1. **Guardar todas las variables**

2. **Ir a la pestaña "Deployments"**

3. **Buscar el deployment más reciente**

4. **Click en los 3 puntos (...)**

5. **Click en "Redeploy"**

6. **Confirmar el redespliegue**

---

## 📋 Resumen de Variables (Copiar/Pegar)

Para facilitar, aquí están todas las variables en formato de lista:

```
VITE_API_URL=https://api.desvare.app
VITE_SOCKET_URL=https://api.desvare.app
VITE_MAPBOX_TOKEN=pk.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=desvare-production.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=desvare-production
VITE_FIREBASE_STORAGE_BUCKET=desvare-production.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=200097542658
VITE_FIREBASE_APP_ID=1:200097542658:web:xxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_VAPID_KEY=BMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ⏱️ Tiempo de Propagación

- **Redespliegue:** 2-5 minutos
- **Después del redespliegue:** La PWA funcionará inmediatamente

---

## 🧪 Probar Después del Redespliegue

### 1. Esperar el redespliegue (2-5 minutos)

### 2. Ir a la PWA:
```
https://desvare.app
```

### 3. Registrarse nuevamente:
- Usar número verificado en Twilio: `+57 350 579 0415`
- Esperar SMS
- Ingresar código recibido
- ✅ Debe funcionar

---

## 🔍 Verificar que las Variables Funcionan

Después del redespliegue, puedes verificar en la consola del navegador:

1. **Abrir DevTools:** `F12` o `Cmd+Option+I`
2. **Ir a Console**
3. **Ejecutar:**
```javascript
console.log(import.meta.env.VITE_API_URL)
```

**Debe mostrar:**
```
https://api.desvare.app
```

**Si muestra `undefined` o `http://localhost:5001`:**
- Las variables no se aplicaron correctamente
- Redesplegar nuevamente

---

## ⚠️ IMPORTANTE

### Variables de Entorno en Vercel:

1. **NO** lee el archivo `.env` local
2. **NECESITA** que configures las variables manualmente en el dashboard
3. **REQUIERE** redespliegue para aplicar cambios

### Seleccionar Environments:

Cuando agregues cada variable, asegúrate de marcar:
- ✅ **Production** (para https://desvare.app)
- ✅ **Preview** (para branches de prueba)
- ✅ **Development** (opcional)

---

## 📝 Checklist

- [ ] Ir a Vercel Dashboard
- [ ] Seleccionar proyecto `desvare-proyect-mpdw`
- [ ] Ir a Settings → Environment Variables
- [ ] Agregar las 12 variables (ver lista arriba)
- [ ] Marcar Production, Preview, Development para cada una
- [ ] Guardar todas las variables
- [ ] Ir a Deployments
- [ ] Redesplegar el último deployment
- [ ] Esperar 2-5 minutos
- [ ] Probar registro en https://desvare.app
- [ ] Verificar en console que `VITE_API_URL` sea correcto

---

## 🎯 Resultado Esperado

### Antes del fix:
```
PWA → http://localhost:5001/api/auth/verify-otp ❌ (404 Not Found)
```

### Después del fix:
```
PWA → https://api.desvare.app/api/auth/verify-otp ✅ (200 OK)
```

---

## 📸 Capturas de Referencia

### Ubicación de Environment Variables en Vercel:

```
Dashboard → 
  Tu Proyecto → 
    Settings (arriba) → 
      Environment Variables (menú lateral) → 
        Add (botón)
```

---

**Fecha:** 12 de febrero de 2026  
**Problema:** PWA no encuentra ruta de verificación OTP  
**Causa:** Variables de entorno no configuradas en Vercel  
**Solución:** Configurar variables + Redesplegar  
**Tiempo:** 10-15 minutos
