# 🔧 Fix: URLs Hardcodeadas Corregidas

**Fecha:** 2026-02-06  
**Problema:** URLs hardcodeadas a `localhost:5001` impedían que las aplicaciones se conectaran al backend en producción.

---

## 🐛 Problema Identificado

Al probar localmente con el backend en producción (`https://api.desvare.app`), las aplicaciones hacían peticiones a `http://localhost:5001` en lugar de usar las variables de entorno configuradas.

### Errores observados:
- Client PWA: `POST http://localhost:5001/api/requests/.../accept` → `ERR_CONNECTION_REFUSED`
- Driver App: `GET http://localhost:5001/api/requests/nearby/...` → `ERR_CONNECTION_REFUSED`

---

## ✅ Solución Aplicada

Se corrigieron **TODAS** las URLs hardcodeadas para que usen `import.meta.env.VITE_API_URL` correctamente.

### Client PWA (2 archivos corregidos):

#### 1. `client-pwa/src/pages/WaitingQuotes.jsx`
- ✅ Agregada constante: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';`
- ✅ Línea 424: `${API_URL}/api/requests/${currentRequestId}`
- ✅ Línea 536: `${API_URL}/api/requests/${currentRequestId}/accept`

#### 2. `client-pwa/src/pages/RatingService.jsx`
- ✅ Agregada constante: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';`
- ✅ Línea 81: `${API_URL}/api/requests/${serviceData.requestId}/rate`

---

### Driver App (5 archivos corregidos):

#### 1. `driver-app/src/pages/Home.jsx`
- ✅ Agregada constante: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';`
- ✅ Línea 89: `${API_URL}/api/drivers/profile/${parsedUser._id}`
- ✅ Línea 334: `${API_URL}/api/requests/nearby/${driverId}`
- ✅ Línea 353: `${API_URL}/api/drivers/toggle-availability`

#### 2. `driver-app/src/pages/Profile.jsx`
- ✅ Agregada constante: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';`
- ✅ Línea 63: `${API_URL}/api/drivers/profile/${driverId}`

#### 3. `driver-app/src/pages/RequestDetail.jsx`
- ✅ Agregada constante: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';`
- ✅ Línea 51: `${API_URL}/api/drivers/profile/${parsedUser._id}`

#### 4. `driver-app/src/pages/QuoteDetail.jsx`
- ✅ Agregada constante: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';`
- ✅ Línea 90: `${API_URL}/api/drivers/profile/${parsedUser._id}`

#### 5. `driver-app/src/pages/ActiveService.jsx`
- ✅ Agregada constante: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';`
- ✅ Línea 304: `${API_URL}/api/drivers/profile/${parsedUser._id}`
- ✅ Línea 373: `${API_URL}/api/requests/${parsedData.requestId}`
- ✅ Línea 551: `${API_URL}/api/requests/${serviceData.requestId}/complete`

---

## 🎯 Resultado Esperado

Ahora las aplicaciones:
1. ✅ Usan `https://api.desvare.app` cuando está configurado en `.env`
2. ✅ Usan `http://localhost:5001` como fallback en desarrollo local
3. ✅ Pueden probar localmente conectándose al backend de producción
4. ✅ Funcionarán correctamente en producción (Vercel, APK)

---

## 📋 Próximos Pasos

1. **Reiniciar servidores de desarrollo:**
   ```bash
   # Terminal 1 - Client PWA
   cd client-pwa
   rm -rf node_modules/.vite
   npm run dev -- --port 5173
   
   # Terminal 2 - Driver App
   cd driver-app
   rm -rf node_modules/.vite
   npm run dev -- --port 5174
   ```

2. **Probar flujo completo:**
   - Client PWA: Solicitar servicio
   - Driver App: Enviar cotización
   - Client PWA: **Aceptar cotización** ← Este era el error principal
   - Verificar que la aceptación funcione correctamente

3. **Generar nueva APK:**
   ```bash
   cd driver-app
   npm run build
   npx cap sync android
   # Abrir Android Studio y generar APK
   ```

4. **Desplegar a producción:**
   - Vercel: Las PWAs se redesplegarán automáticamente con los cambios
   - APK: Instalar nueva versión en dispositivo Android

---

## 🔍 Verificación

Para verificar que la URL correcta está siendo usada, abre la consola del navegador y busca:
- ✅ Peticiones a `api.desvare.app` (producción)
- ❌ NO debe haber peticiones a `localhost:5001` (excepto en desarrollo local con backend local)

---

**Estado:** ✅ Completado  
**Archivos modificados:** 7  
**Líneas corregidas:** 14
