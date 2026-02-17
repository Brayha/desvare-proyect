# 🔥 Configuración de Firebase desde CERO

**Fecha:** 2026-02-08  
**Objetivo:** Configurar un proyecto limpio de Firebase para PWA + Driver App

---

## 🎯 RESUMEN

Vamos a crear **UN SOLO PROYECTO** de Firebase llamado `desvare-production` que contendrá:
1. 🌐 **App Web (PWA)** - Para clientes
2. 📱 **App Android (Driver App)** - Para conductores
3. 🔔 **Cloud Messaging** - Para notificaciones push

---

## 📋 PASO 1: CREAR PROYECTO EN FIREBASE

1. Ve a https://console.firebase.google.com
2. Click en **"Agregar proyecto"** (o "Add project")
3. **Nombre del proyecto:** `Desvare Production`
4. **ID del proyecto:** `desvare-production` (lo genera Firebase)
5. **Google Analytics:** Habilitar (recomendado)
6. Click en **"Crear proyecto"**
7. Espera 30-60 segundos a que se cree

---

## 🌐 PASO 2: REGISTRAR LA APP WEB (PWA)

### 2.1 Agregar app web

1. En el dashboard del proyecto, click en **Web** (ícono `</>`)
2. **Apodo de la app:** `Desvare PWA Client`
3. ✅ **Marcar:** "Configurar también Firebase Hosting" (opcional)
4. Click en **"Registrar app"**

### 2.2 Copiar credenciales

Aparecerá un código JavaScript con las credenciales:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "desvare-production.firebaseapp.com",
  projectId: "desvare-production",
  storageBucket: "desvare-production.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

**GUARDAR ESTAS CREDENCIALES** - Las usaremos en el `.env` de la PWA.

---

## 📱 PASO 3: REGISTRAR LA APP ANDROID (DRIVER APP)

### 3.1 Agregar app Android

1. En el dashboard del proyecto, click en **Android** (ícono de Android)
2. **Nombre del paquete de Android:** `com.desvare.driverapp`
3. **Alias de la app (opcional):** `Desvare Driver App`
4. **Certificado de firma SHA-1:** (dejar en blanco por ahora)
5. Click en **"Registrar app"**

### 3.2 Descargar google-services.json

1. Se descargará automáticamente el archivo `google-services.json`
2. **GUARDAR este archivo** - Lo usaremos en Capacitor

---

## 🔔 PASO 4: HABILITAR CLOUD MESSAGING

### 4.1 Habilitar el API

1. En el proyecto, click en ⚙️ **"Project Settings"**
2. Ve a la pestaña **"Cloud Messaging"**
3. Verás **"Cloud Messaging API (V1)"**
4. Click en **"..."** (tres puntos) → **"Manage API in Google Cloud Console"**
5. Se abrirá Google Cloud Console
6. Click en **"ENABLE"** (Habilitar)
7. Espera 1-2 minutos a que se active
8. Vuelve a Firebase Console

### 4.2 Generar VAPID Key (para Web Push)

1. En la misma pestaña **"Cloud Messaging"**, baja hasta **"Web configuration"**
2. En la sección **"Certificados push web"** o **"Web Push certificates"**
3. Click en **"Generar par de claves"** o **"Generate key pair"**
4. Se generará una clave pública (algo como: `BPHcL_1oGF4KgWYxVP8...`)
5. **COPIAR Y GUARDAR ESTA CLAVE** - Es la `VITE_FIREBASE_VAPID_KEY`

---

## 🔐 PASO 5: GENERAR CREDENCIALES DEL SERVIDOR

### 5.1 Descargar Service Account JSON

1. En ⚙️ **"Project Settings"**, ve a la pestaña **"Service accounts"**
2. Click en **"Generate new private key"** o **"Generar nueva clave privada"**
3. Confirma haciendo click en **"Generate key"**
4. Se descargará un archivo JSON: `desvare-production-firebase-adminsdk-xxxxx.json`
5. **Renombra el archivo a:** `firebase-service-account.json`
6. **GUARDAR este archivo** - Lo subiremos al backend de DigitalOcean

---

## 📝 PASO 6: ACTUALIZAR ARCHIVOS .ENV

### 6.1 Client PWA `.env`

Actualiza el archivo `/client-pwa/.env` con las nuevas credenciales:

```bash
# API Backend
VITE_API_URL=https://api.desvare.app
VITE_SOCKET_URL=https://api.desvare.app

# Firebase (NUEVAS CREDENCIALES)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=desvare-production.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=desvare-production
VITE_FIREBASE_STORAGE_BUCKET=desvare-production.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_VAPID_KEY=BPHcL_1oGF4KgWYxVP8...
```

**REEMPLAZA** todos los valores con los que copiaste en el PASO 2 y PASO 4.2.

### 6.2 Driver App `.env`

Actualiza el archivo `/driver-app/.env` con las mismas credenciales:

```bash
# API Backend
VITE_API_URL=https://api.desvare.app
VITE_SOCKET_URL=https://api.desvare.app

# Firebase (MISMAS CREDENCIALES QUE LA PWA)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=desvare-production.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=desvare-production
VITE_FIREBASE_STORAGE_BUCKET=desvare-production.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_VAPID_KEY=BPHcL_1oGF4KgWYxVP8...
```

### 6.3 Backend `.env` (LOCAL)

Actualiza el archivo `/backend/.env` LOCAL:

```bash
# Firebase
FIREBASE_PROJECT_ID=desvare-production
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

---

## 🚀 PASO 7: SUBIR CREDENCIALES AL SERVIDOR DE PRODUCCIÓN

### 7.1 Subir firebase-service-account.json

```bash
# En tu MacBook
cd ~/Downloads
# Asegúrate de que el archivo se llame firebase-service-account.json

# Súbelo al servidor
scp firebase-service-account.json root@161.35.227.156:/home/desvare/desvare-proyect/backend/
```

### 7.2 Actualizar .env en DigitalOcean

```bash
ssh root@161.35.227.156
cd /home/desvare/desvare-proyect/backend
nano .env
```

**Busca y actualiza estas líneas:**

```bash
FIREBASE_PROJECT_ID=desvare-production
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

**Guarda:** `Ctrl + O`, Enter, `Ctrl + X`

### 7.3 Verificar el archivo subido

```bash
# Ver que el archivo existe
ls -la firebase-service-account.json

# Ver el project_id para confirmar
cat firebase-service-account.json | grep project_id
# Debería mostrar: "project_id": "desvare-production"
```

### 7.4 Reiniciar PM2

```bash
pm2 restart desvare-backend
pm2 logs desvare-backend --lines 50
```

**Busca en los logs:**
- ✅ `"✅ Firebase Admin SDK inicializado correctamente"`
- ❌ Si ves errores, compártelos

---

## 🧪 PASO 8: PROBAR LA CONFIGURACIÓN

### 8.1 Probar en localhost

```bash
# Terminal 1 - Client PWA
cd client-pwa
npm run dev -- --port 5173

# Terminal 2 - Driver App
cd driver-app
npm run dev -- --port 5174
```

### 8.2 Verificar en la PWA

1. Abre http://localhost:5173
2. Regístrate o haz login
3. **Acepta el prompt de notificaciones**
4. Abre la consola y verifica:

```
✅ Token FCM obtenido: ...
✅ Token FCM registrado en el servidor
```

### 8.3 Enviar una cotización

1. Solicita un servicio desde la PWA
2. Envía una cotización desde la Driver App
3. **Deberías ver:**
   - ✅ Banner amarillo in-app
   - ✅ **Notificación del navegador** (lo nuevo que debería funcionar)
   - ✅ Sonido y vibración

---

## 📋 CHECKLIST FINAL

### ✅ Firebase creado:
- [ ] Proyecto `desvare-production` creado
- [ ] App Web registrada
- [ ] App Android registrada
- [ ] Cloud Messaging API habilitado
- [ ] VAPID Key generada
- [ ] Service Account JSON descargado

### ✅ Archivos actualizados:
- [ ] `client-pwa/.env` con nuevas credenciales
- [ ] `driver-app/.env` con nuevas credenciales
- [ ] `backend/.env` (local) con `desvare-production`
- [ ] `firebase-service-account.json` renombrado

### ✅ Servidor de producción:
- [ ] `firebase-service-account.json` subido a DigitalOcean
- [ ] `.env` actualizado con `desvare-production`
- [ ] PM2 reiniciado
- [ ] Logs muestran "Firebase inicializado correctamente"

### ✅ Testing:
- [ ] PWA en localhost acepta notificaciones
- [ ] Token FCM se registra correctamente
- [ ] Notificaciones del navegador llegan cuando envías cotización

---

## 🎯 RESULTADO ESPERADO

Después de completar todos los pasos:

1. ✅ **Un solo proyecto de Firebase** limpio y organizado
2. ✅ **Notificaciones push funcionando** en la PWA (en Chrome desktop/Android)
3. ✅ **Driver App lista** para recibir notificaciones cuando hagas el APK
4. ✅ **Sin errores** de permisos de Firebase

---

## 🚨 TROUBLESHOOTING

### Si ves: "Permission denied cloudmessaging.messages.create"

1. Ve a https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=desvare-production
2. Asegúrate de que el API esté **ENABLED** (Habilitado)
3. Espera 2-3 minutos y reinicia PM2

### Si el token FCM no se registra:

1. Limpia localStorage en el navegador
2. Recarga la página
3. Haz login de nuevo
4. Acepta el prompt de notificaciones

### Si las notificaciones no llegan:

1. Verifica los logs del backend: `pm2 logs desvare-backend`
2. Busca: "📱 Enviando push notification al cliente..."
3. Si no aparece, el token no está en MongoDB
4. Re-registra el usuario y acepta notificaciones de nuevo

---

## 📚 RECURSOS ÚTILES

- Firebase Console: https://console.firebase.google.com
- Google Cloud Console: https://console.cloud.google.com
- Firebase Web Push Docs: https://firebase.google.com/docs/cloud-messaging/js/client

---

**Estado:** 📝 Documento de referencia  
**Próximo paso:** Crear el proyecto en Firebase y seguir los pasos
