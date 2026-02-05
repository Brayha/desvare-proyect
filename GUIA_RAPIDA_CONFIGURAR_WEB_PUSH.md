# 🚀 GUÍA RÁPIDA: Configurar Web Push (Firebase)

## ⏱️ Tiempo estimado: 30-60 minutos

---

## PASO 1: Firebase Console (15 min)

### 1.1 Crear/Abrir Proyecto

1. Ve a https://console.firebase.google.com/
2. Si no tienes proyecto:
   - Click "Add project"
   - Nombre: `Desvare` o `desvare-app`
   - Acepta términos → Create project
3. Si ya tienes proyecto → Selecciónalo

### 1.2 Habilitar Cloud Messaging

1. En el sidebar, busca **Build** → **Cloud Messaging**
2. Si te pide habilitar el API:
   - Click "Enable" o "Get started"
   - Acepta y espera ~1 minuto

### 1.3 Registrar Web App

1. En **Project Overview**, click en **Web** icon (`</>`)
2. Nombre de la app: `Desvare PWA`
3. **IMPORTANTE**: ✅ Marca "Also set up Firebase Hosting" (NO)
4. Click "Register app"
5. **COPIA** la configuración que aparece:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "desvare-app.firebaseapp.com",
  projectId: "desvare-app",
  storageBucket: "desvare-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 1.4 Generar VAPID Key

1. Ve a **Project Settings** (⚙️ en sidebar)
2. Tab **Cloud Messaging**
3. Scroll a **Web Push certificates**
4. Click "Generate key pair"
5. **COPIA** el key pair (empieza con `B...`)

Ejemplo:
```
BNxYz1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```

---

## PASO 2: Actualizar .env (5 min)

### 2.1 Client PWA

Abre `client-pwa/.env` y agrega:

```bash
# Variables existentes (mantener)
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
VITE_MAPBOX_TOKEN=pk.xxxxx

# 🆕 Firebase Web Push (pegar tus valores)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=desvare-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=desvare-app
VITE_FIREBASE_STORAGE_BUCKET=desvare-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_VAPID_KEY=BNxYz1234567890...
```

### 2.2 Service Worker

Abre `client-pwa/public/firebase-messaging-sw.js` (línea 13):

```javascript
// REEMPLAZAR líneas 13-20:
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",  // ← TU API KEY
  authDomain: "desvare-app.firebaseapp.com",
  projectId: "desvare-app",
  storageBucket: "desvare-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

## PASO 3: Reiniciar Servidor (2 min)

```bash
cd client-pwa

# Detener servidor actual (Ctrl+C en terminal)

# Limpiar cache de Vite
rm -rf node_modules/.vite

# Reiniciar
npm run dev
```

**Importante**: Vite necesita reiniciarse para leer las nuevas variables `.env`

---

## PASO 4: Testing Básico (10 min)

### 4.1 Verificar Inicialización

1. Abre http://localhost:5173
2. Abre DevTools → Console
3. Busca: `✅ Firebase inicializado correctamente en PWA`
4. Si ves error, verifica el paso 2

### 4.2 Solicitar Permisos (Manual)

Abre la consola del navegador y ejecuta:

```javascript
// Importar el servicio (en DevTools Console)
import('/src/services/fcmService.js').then(fcm => {
  fcm.requestNotificationPermission('TU_USER_ID_AQUI').then(token => {
    console.log('Token FCM:', token);
  });
});
```

O más simple, desde cualquier componente de la PWA:

```javascript
// Pegar en DevTools Console
const { requestNotificationPermission } = await import('/src/services/fcmService.js');
const token = await requestNotificationPermission('67abc123...');
console.log('Token:', token);
```

**Debe aparecer**:
1. Prompt del navegador: "desvare.app quiere enviarte notificaciones"
2. Click "Permitir"
3. Console: `✅ Token FCM obtenido: eABC...`
4. Console: `✅ Token FCM registrado en el servidor`

### 4.3 Verificar Token en Base de Datos

```bash
# Conectar a MongoDB
mongosh "tu_connection_string"

# Buscar usuario
db.users.findOne({ _id: ObjectId("TU_USER_ID") })

# Verificar que tiene fcmToken:
# {
#   _id: ...,
#   name: "...",
#   fcmToken: "eABC123..."  ← Debe existir
# }
```

---

## PASO 5: Test End-to-End (15 min)

### Escenario: Cliente Recibe Cotización

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Client PWA
cd client-pwa
npm run dev

# Terminal 3: Driver App
cd driver-app
npm run dev
```

**Flujo**:
1. **PWA**: Login como cliente (registrar token FCM)
2. **PWA**: Solicitar servicio de grúa
3. **Driver App**: Login como conductor
4. **Driver App**: Enviar cotización ($120,000)
5. **PWA**: ✅ Debe aparecer toast + notificación push

**Consola backend esperada**:
```
💰 Cotización agregada a solicitud 67abc...
📤 Enviando cotización vía Socket.IO
📱 Enviando push notification al cliente...
✅ Notificación enviada: projects/.../messages/0:1234...
```

**Dispositivo móvil**:
```
┌────────────────────────────────┐
│  Desvare              10:30    │
│  💰 Nueva Cotización Recibida  │
│  Juan Pérez te cotizó $120.000 │
└────────────────────────────────┘
```

---

## 🐛 TROUBLESHOOTING

### Error: "Firebase not initialized"

**Causa**: Variables .env no configuradas o servidor no reiniciado

**Solución**:
1. Verificar `.env` tiene todas las variables `VITE_FIREBASE_*`
2. Reiniciar Vite (`npm run dev`)
3. Hard refresh (Cmd+Shift+R)

### Error: "Failed to register service worker"

**Causa**: Ruta incorrecta o HTTPS

**Solución**:
1. Verificar archivo en `public/firebase-messaging-sw.js`
2. En local: usar http://localhost (funciona)
3. En producción: usar HTTPS (obligatorio)

### Error: "No registration token available"

**Causa**: VAPID key incorrecta

**Solución**:
1. Verificar `VITE_FIREBASE_VAPID_KEY` en `.env`
2. Verificar que coincide con Firebase Console
3. Debe empezar con `B...`

### Error: "Permission denied"

**Causa**: Usuario rechazó permisos

**Solución**:
```bash
# Chrome
chrome://settings/content/notifications
# Buscar localhost:5173 y eliminar

# Safari iOS
Configuración → Safari → Sitios web
# Buscar localhost y limpiar
```

### Notificación no aparece

**Causas posibles**:
1. ⚠️ Modo "No Molestar" activado
2. ⚠️ Permisos bloqueados en sistema
3. ⚠️ Token FCM expirado
4. ⚠️ Backend no envió push

**Debug**:
```bash
# Backend logs:
📱 Enviando push notification al cliente...
✅ Notificación enviada: projects/.../messages/0:1234...

# Si no ves esto, el push no se envió
```

---

## ✅ CHECKLIST FINAL

```
Configuración Firebase:
□ Proyecto Firebase creado/abierto
□ Cloud Messaging habilitado
□ Web app registrada
□ VAPID key generada
□ Credenciales copiadas

Código:
□ .env actualizado con credenciales
□ firebase-messaging-sw.js actualizado
□ Servidor Vite reiniciado
□ Cache limpiado

Testing:
□ Firebase inicializa sin errores
□ Permisos solicitados correctamente
□ Token FCM obtenido
□ Token guardado en backend
□ Token visible en base de datos
□ Notificación test enviada
□ Notificación aparece en dispositivo
□ Click en notificación abre PWA

Producción (futuro):
□ Dominio autorizado en Firebase
□ HTTPS configurado
□ Service Worker accesible en raíz
□ Testing en Android
□ Testing en iOS 16.4+
```

---

## 📞 SOPORTE

### Firebase Support
- https://firebase.google.com/support

### Web Push Debugging
- Chrome: `chrome://inspect/#service-workers`
- Safari: Developer → Service Workers

### Test Notification Tool
- https://console.firebase.google.com/project/_/notification

---

## 🎊 RESULTADO ESPERADO

Después de completar esta guía:

✅ Cliente recibe notificaciones REALES  
✅ Funciona incluso si está en WhatsApp  
✅ Compatible con iOS y Android  
✅ Latencia ~1-3 segundos  
✅ Profesional como Uber/Didi  

**¡El feature más crítico estará completo!** 🚀

---

**Última actualización**: 1 de Febrero, 2026  
**Tiempo total**: 30-60 minutos  
**Nivel**: Intermedio  
