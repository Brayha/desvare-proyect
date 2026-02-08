# 🔧 Solución: PWA No Puede Aceptar Cotizaciones

## 📊 Estado Actual

### ✅ Lo que Funciona:
- ✅ Client PWA: Login, pedir servicios, ver cotizaciones
- ✅ Driver App: Login, ubicación, cotizar servicios
- ✅ Socket.IO: Recibir cotizaciones en tiempo real

### ❌ El Problema:
- ❌ Client PWA: **Aceptar cotización falla con `ERR_CONNECTION_REFUSED`**
- Error: `POST https://localhost/api/requests/{id}/accept`

---

## 🔍 Diagnóstico

### Error en Chrome DevTools:
```
POST https://localhost/api/requests/698563b65cc189cf0a9d80d0/accept
net::ERR_CONNECTION_REFUSED
```

### Causa Raíz:
La PWA está intentando conectarse a `https://localhost` en vez de `https://api.desvare.app`

### Variables de Entorno:
- ✅ **Local `.env`**: Correcto (`VITE_API_URL=https://api.desvare.app`)
- ✅ **Vercel Settings**: Correcto (variables configuradas)
- ❌ **Build en Producción**: NO está usando las variables

---

## ✅ Solución 1: Forzar Rebuild Sin Caché

### Pasos en Vercel:

1. Ve a: https://vercel.com (proyecto `desvare-proyect-mpdw`)
2. Click en **"Deployments"**
3. Encuentra el deployment actual (Ready)
4. Click en **"..." (tres puntos)**
5. Click en **"Redeploy"**
6. ⚠️ **DESACTIVA** "Use existing Build Cache"
7. Click **"Redeploy"**

---

## ✅ Solución 2: Limpiar Caché del Service Worker

La PWA usa Service Worker que cachea el código antiguo.

### En el Navegador (donde pruebas la PWA):

1. Abre DevTools (F12)
2. Ve a **"Application"** tab
3. En el menú izquierdo: **"Service Workers"**
4. Click en **"Unregister"** para cada Service Worker
5. En **"Storage"** (menú izquierdo)
6. Click en **"Clear site data"**
7. Refresca con: **Cmd+Shift+R** (Mac) o **Ctrl+Shift+R** (Windows)

---

## ✅ Solución 3: Verificar Variables en Build Logs

### En Vercel:

1. Ve a **"Deployments"**
2. Click en el deployment más reciente
3. Ve a **"Build Logs"**
4. Busca si aparece:
   ```
   VITE_API_URL=https://api.desvare.app
   ```

**Si NO aparece:** Las variables no se están pasando al build.

---

## ✅ Solución 4: Debugging en Producción

### Verificar qué variables tiene el build:

1. Abre: https://desvare-proyect-mpdw.vercel.app
2. Abre DevTools Console
3. Ejecuta:
   ```javascript
   console.log(import.meta.env.VITE_API_URL)
   ```

**Esperado:** `https://api.desvare.app`  
**Si imprime:** `undefined` → Confirma que las variables NO se incluyeron en el build

---

## 🧪 Testing Local (Mientras se arregla Vercel)

### Probar PWA localmente con backend de producción:

```bash
cd client-pwa
npm run dev
```

Abre: http://localhost:5173

**Ventajas:**
- Usa el `.env` local correcto
- Se conecta a `https://api.desvare.app`
- Puedes probar el flujo completo

---

## 📱 Testing con Driver App

### Opción 1: Navegador (Rápido)

```bash
cd driver-app
npm run dev
```

Abre: http://localhost:5174 en **modo móvil** (Cmd+Shift+M en DevTools)

### Opción 2: Emulador Android (Real)

1. Abre **Android Studio**
2. **Tools → Device Manager**
3. **Create Virtual Device**
4. Selecciona **Pixel 6** + **Android 13**
5. Click ▶️ para iniciar
6. Arrastra el APK al emulador

---

## 🔄 Flujo de Testing Completo

### Setup:
1. **Navegador 1**: http://localhost:5173 (Client PWA)
2. **Navegador 2**: http://localhost:5174 (Driver App)
3. Ambos en **modo móvil** (Cmd+Shift+M)

### Flujo:
1. **Client PWA**: Login con OTP
2. **Client PWA**: Pedir servicio
3. **Driver App**: Login con OTP
4. **Driver App**: Ver solicitud y cotizar
5. **Client PWA**: Ver cotización recibida
6. **Client PWA**: **Aceptar cotización** ← Verificar que funcione
7. **Driver App**: Ver cotización aceptada

---

## 🎯 Checklist de Verificación

### Después de Redeploy:

- [ ] Service Worker desregistrado
- [ ] Caché del navegador limpiado
- [ ] Página refrescada (Cmd+Shift+R)
- [ ] `console.log(import.meta.env.VITE_API_URL)` muestra URL correcta
- [ ] Aceptar cotización funciona sin `ERR_CONNECTION_REFUSED`

### En Local:

- [ ] PWA local (localhost:5173) puede aceptar cotizaciones
- [ ] Driver local (localhost:5174) recibe confirmación
- [ ] Socket.IO sincroniza estados correctamente

---

## 🚨 Si Aún No Funciona Después de Todo

### Último Recurso: Hardcodear temporalmente

En `client-pwa/src/services/api.js`, línea 3:

```javascript
// TEMPORAL - Solo para testing
const API_URL = 'https://api.desvare.app';
```

Esto fuerza el uso del backend real sin depender de variables de entorno.

⚠️ **IMPORTANTE**: Esto es **solo para testing**. NO debe ir a producción así.

---

## 📞 Próximos Pasos

1. ✅ Arreglar aceptación en PWA (este documento)
2. ✅ Probar flujo completo localmente
3. ✅ Verificar que funciona en Vercel
4. ✅ Compilar APK final para Android
5. ✅ Probar en dispositivo real cuando esté disponible

---

**Fecha:** 06/02/2026  
**Estado:** Pendiente de aplicar soluciones  
**Prioridad:** Alta (bloqueante para testing)
