# 🔔 Diagnóstico: Notificaciones Push No Funcionan

**Fecha:** 2026-02-06  
**Problema:** Las notificaciones push no llegan a la Client PWA ni a la Driver App cuando se envían cotizaciones.

---

## 🔍 Estado Actual

### ✅ Configuración Existente (Código):

1. **Client PWA:**
   - ✅ `fcmService.js` - Servicio de notificaciones configurado
   - ✅ `firebase-messaging-sw.js` - Service Worker presente
   - ✅ `App.jsx` - Solicita permisos al iniciar
   - ✅ Firebase config en `.env`

2. **Backend:**
   - ✅ `services/notifications.js` - Servicio de envío configurado
   - ✅ `routes/requests.js` - Envía notificaciones en eventos
   - ❓ `firebase-service-account.json` - **FALTA VERIFICAR**

3. **Driver App:**
   - ❌ **NO HAY CONFIGURACIÓN DE NOTIFICACIONES PUSH**
   - No existe `fcmService.js`
   - No existe Service Worker
   - No solicita permisos FCM

---

## 🚨 Problemas Identificados

### 1. Backend: Firebase Service Account Missing

En los logs del backend (DigitalOcean) viste:
```
❌ Error inicializando Firebase: Cannot find module '/home/desvare/desvare-proyect/backend/firebase-service-account.json'
⚠️ Las notificaciones push no estarán disponibles
```

**Causa:** El archivo `firebase-service-account.json` NO está en el servidor de producción.

**Solución:** Debes subir este archivo al servidor DigitalOcean.

---

### 2. Driver App: NO tiene notificaciones configuradas

La Driver App NO tiene implementado Firebase Cloud Messaging, por lo que:
- ❌ No solicita permisos de notificaciones
- ❌ No registra token FCM
- ❌ No puede recibir notificaciones push

**Solución:** Implementar FCM en la Driver App (similar al Client PWA).

---

### 3. Client PWA: Service Worker puede no estar registrado en producción

Vercel a veces no sirve correctamente los Service Workers en el root.

**Verificación necesaria:**
- Abrir DevTools → Application → Service Workers
- Verificar que `firebase-messaging-sw.js` esté registrado

---

## ✅ Plan de Solución

### Paso 1: Configurar Firebase Service Account en Backend (CRÍTICO)

1. **Obtener el archivo de credenciales:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Proyecto: `app-desvare`
   - Configuración → Cuentas de servicio
   - Generar nueva clave privada → Descargar JSON

2. **Subir al servidor DigitalOcean:**
   ```bash
   # En tu máquina local
   scp firebase-service-account.json root@161.35.227.156:/home/desvare/desvare-proyect/backend/
   
   # O por SFTP/SCP con tu cliente preferido
   ```

3. **Verificar que esté en el lugar correcto:**
   ```bash
   ssh root@161.35.227.156
   ls -la /home/desvare/desvare-proyect/backend/firebase-service-account.json
   ```

4. **Reiniciar el backend:**
   ```bash
   pm2 restart all
   ```

5. **Verificar logs:**
   ```bash
   pm2 logs desvare-backend --lines 50
   ```
   
   Deberías ver: `✅ Firebase Admin SDK inicializado correctamente`

---

### Paso 2: Verificar Client PWA (Local y Producción)

#### Testing Local:

1. Abre `http://localhost:5173` en Chrome
2. Abre DevTools (F12) → Console
3. Busca logs de Firebase:
   - `✅ Firebase inicializado correctamente en PWA`
   - `✅ Service Worker registrado y listo`
   - `✅ Token FCM obtenido: ...`
   - `✅ Token FCM registrado en el servidor`

4. Ve a DevTools → Application → Service Workers:
   - Verifica que `firebase-messaging-sw.js` esté **activo**

#### Testing en Producción (Vercel):

1. Abre `https://desvare-proyect-mpdw.vercel.app` en Chrome
2. Repite verificación de logs
3. Si no funciona:
   - Vercel puede tener problemas sirviendo el SW del root
   - Verificar que `firebase-messaging-sw.js` esté en `/public/`

---

### Paso 3: Implementar Notificaciones en Driver App (OPCIONAL para ahora)

Por ahora, puedes **saltarte este paso** porque:
- Las notificaciones en Driver App son menos críticas
- El flujo principal (recepción de solicitudes) ya funciona vía Socket.IO
- Puedes implementarlo después

**Si decides implementarlo:**
1. Copiar `fcmService.js` de Client PWA
2. Adaptar para Driver App
3. Configurar Capacitor Push Notifications plugin
4. Implementar para Android/iOS

---

## 📋 Prioridad de Tareas

### 🔴 ALTA PRIORIDAD (Hacer AHORA):

✅ **1. Subir `firebase-service-account.json` al backend de DigitalOcean**
   - Sin esto, NINGUNA notificación funcionará

✅ **2. Verificar que Client PWA registre el token FCM**
   - Revisar logs en consola local
   - Revisar logs en consola de Vercel

### 🟡 MEDIA PRIORIDAD (Hacer después):

- Probar notificaciones end-to-end:
  1. Cliente solicita servicio
  2. Driver envía cotización
  3. **Cliente recibe notificación push** ← Verificar que funcione

### 🟢 BAJA PRIORIDAD (Hacer cuando tengas tiempo):

- Implementar notificaciones en Driver App (Capacitor)
- Configurar notificaciones para otros eventos (servicio aceptado, completado, etc.)

---

## 🧪 Cómo Probar las Notificaciones

### Test 1: Verificar Token FCM (Client PWA)

1. Abre `http://localhost:5173` (o Vercel)
2. Login con un usuario cliente
3. Abre DevTools → Console
4. Busca: `✅ Token FCM obtenido: ...`
5. Copia el token (comienza con `e...`)

### Test 2: Verificar Token en el Backend

```bash
# SSH al backend
ssh root@161.35.227.156

# Conectarse a MongoDB y buscar el token del usuario
# O usar logs del backend para ver si el token se guardó
pm2 logs desvare-backend --lines 100 | grep "FCM"
```

### Test 3: Enviar Notificación de Prueba

Desde Postman o curl:

```bash
curl -X POST https://api.desvare.app/api/test/notification \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "TU_TOKEN_FCM_AQUI",
    "title": "Prueba de Notificación",
    "body": "Si ves esto, las notificaciones funcionan! 🎉"
  }'
```

---

## 🔧 Debugging Común

### Si el token FCM no se obtiene:

1. **Verificar VAPID Key:**
   ```bash
   # En .env del Client PWA
   VITE_FIREBASE_VAPID_KEY=BPko2L-I0dFAKg8...
   ```

2. **Verificar Service Worker:**
   - DevTools → Application → Service Workers
   - Debe estar "activated and running"

3. **Limpiar caché del navegador:**
   - Borrar site data
   - Unregister Service Worker
   - Recargar página

### Si el backend no envía notificaciones:

1. **Verificar que Firebase esté inicializado:**
   ```bash
   pm2 logs desvare-backend | grep Firebase
   ```
   
   Debe mostrar: `✅ Firebase Admin SDK inicializado correctamente`

2. **Verificar que el Service Account JSON sea válido:**
   ```bash
   cat /home/desvare/desvare-proyect/backend/firebase-service-account.json
   ```
   
   Debe tener: `project_id`, `private_key`, `client_email`

---

## 📄 Archivos Importantes

### Client PWA:
- `/client-pwa/src/services/fcmService.js` - Maneja FCM
- `/client-pwa/public/firebase-messaging-sw.js` - Service Worker
- `/client-pwa/src/config/firebase.config.js` - Configuración Firebase
- `/client-pwa/.env` - Variables de entorno

### Backend:
- `/backend/services/notifications.js` - Envía notificaciones
- `/backend/routes/requests.js` - Eventos que disparan notificaciones
- `/backend/firebase-service-account.json` - **FALTA ESTE ARCHIVO**
- `/backend/.env` - Variables de entorno

### Driver App:
- ❌ **NO IMPLEMENTADO AÚN**

---

## 📝 Notas

1. **Firebase tiene cuotas gratuitas:**
   - 10,000 notificaciones/día gratis
   - Suficiente para testing y primeros usuarios

2. **Service Workers requieren HTTPS:**
   - Funciona en `localhost` y en Vercel (tiene HTTPS)
   - NO funciona en HTTP sin SSL

3. **Notificaciones requieren permiso del usuario:**
   - El usuario debe aceptar explícitamente
   - Si rechaza, debes pedirle que vaya a configuración

---

## ✅ Siguiente Paso Inmediato

**ACCIÓN REQUERIDA:**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Descarga el archivo `firebase-service-account.json`
3. Súbelo al servidor DigitalOcean: `/home/desvare/desvare-proyect/backend/`
4. Reinicia el backend: `pm2 restart all`
5. Prueba el flujo completo de nuevo

---

**Estado:** 🔴 BLOQUEADO - Necesita `firebase-service-account.json` en el backend  
**Impacto:** ALTO - Sin esto, ninguna notificación funcionará
