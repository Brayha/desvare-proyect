# 🚀 Futuras Mejoras - Sistema de Notificaciones

**Fecha:** Diciembre 10, 2025  
**Estado:** 📝 Planificado para el futuro

---

## 📋 Recordatorio: Implementaciones Pendientes

Como acordamos, estas funcionalidades se implementarán **después** del MVP actual:

---

## 1️⃣ **Push Notifications para Android** 📱

### **¿Qué es?**
Notificaciones que llegan incluso cuando la app está cerrada.

### **Tecnología:**
Firebase Cloud Messaging (FCM)

### **Pasos para Implementar:**

1. **Crear proyecto en Firebase:**
   - https://console.firebase.google.com/
   - Agregar app web
   - Obtener credenciales

2. **Instalar dependencias:**
```bash
cd client-pwa
npm install firebase
```

3. **Configurar Firebase en frontend:**
```javascript
// client-pwa/src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const token = await getToken(messaging);
    return token; // Enviar al backend
  }
};
```

4. **Service Worker:**
```javascript
// client-pwa/public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({ ... });

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon,
    badge: '/badge-icon.png'
  });
});
```

5. **Backend - Enviar notificación:**
```javascript
// backend/services/pushNotifications.js
const admin = require('firebase-admin');

const sendPushNotification = async (fcmToken, data) => {
  const message = {
    notification: {
      title: data.title,
      body: data.body,
      icon: data.icon || '/icon-192.png'
    },
    data: {
      requestId: data.requestId,
      amount: data.amount.toString()
    },
    token: fcmToken
  };
  
  return await admin.messaging().send(message);
};
```

6. **Integrar en Socket.IO:**
```javascript
// backend/server.js
socket.on('quote:send', async (data) => {
  const clientSocketId = connectedClients.get(data.clientId);
  
  if (clientSocketId) {
    // Cliente conectado - enviar por Socket.IO
    io.to(clientSocketId).emit('quote:received', quoteData);
  } else {
    // Cliente NO conectado - enviar push notification
    const client = await User.findById(data.clientId);
    if (client.fcmToken) {
      await sendPushNotification(client.fcmToken, {
        title: 'Nueva Cotización',
        body: `${data.driverName} cotizó $${data.amount}`,
        requestId: data.requestId,
        amount: data.amount
      });
    }
  }
});
```

### **Estimación:** 4-6 horas de desarrollo

---

## 2️⃣ **Web Push API para iOS 16.4+** 🍎

### **¿Qué es?**
Notificaciones push nativas para iOS (solo si la PWA está instalada).

### **Requisitos:**
- iOS 16.4 o superior
- PWA instalada en pantalla de inicio
- Safari 16.4+

### **Pasos para Implementar:**

1. **Manifest actualizado:**
```json
// client-pwa/public/manifest.json
{
  "name": "Desvare",
  "short_name": "Desvare",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

2. **Solicitar permisos:**
```javascript
// client-pwa/src/hooks/useWebPush.js
export const useWebPush = () => {
  const subscribe = async () => {
    // Verificar soporte
    if (!('serviceWorker' in navigator)) {
      return null;
    }
    
    // Registrar service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    // Solicitar permiso
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }
    
    // Suscribirse a push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
    });
    
    return subscription;
  };
  
  return { subscribe };
};
```

3. **Backend - Generar VAPID keys:**
```bash
npm install web-push
npx web-push generate-vapid-keys
```

4. **Backend - Enviar notificación:**
```javascript
// backend/services/webPush.js
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:tu@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendWebPush = async (subscription, payload) => {
  return await webpush.sendNotification(subscription, JSON.stringify(payload));
};
```

### **Estimación:** 3-4 horas de desarrollo

---

## 3️⃣ **Email/SMS como Fallback** 📧📱

### **¿Qué es?**
Si el cliente no está conectado y no tiene push notifications, enviar email/SMS.

### **Servicios Recomendados:**

#### **Email:**
- SendGrid (Free: 100/día)
- Mailgun (Free: 5,000/mes)
- AWS SES (Muy barato)

#### **SMS:**
- Twilio (Pay-as-you-go)
- MessageBird
- AWS SNS

### **Pasos para Implementar:**

1. **Instalar dependencias:**
```bash
cd backend
npm install @sendgrid/mail twilio
```

2. **Servicio de Email:**
```javascript
// backend/services/email.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendQuoteEmail = async (clientEmail, quote) => {
  const msg = {
    to: clientEmail,
    from: 'notificaciones@desvare.com',
    subject: '¡Nueva Cotización Recibida!',
    html: `
      <h1>Nueva Cotización</h1>
      <p>${quote.driverName} ha enviado una cotización:</p>
      <h2>$${quote.amount.toLocaleString()} COP</h2>
      <a href="https://app.desvare.com/requests/${quote.requestId}">
        Ver Detalles
      </a>
    `
  };
  
  await sgMail.send(msg);
};
```

3. **Servicio de SMS:**
```javascript
// backend/services/sms.js
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendQuoteSMS = async (clientPhone, quote) => {
  await client.messages.create({
    body: `¡Nueva cotización! ${quote.driverName} cotizó $${quote.amount}. Revisa tu app.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: clientPhone
  });
};
```

4. **Lógica en Socket.IO:**
```javascript
// backend/server.js
socket.on('quote:send', async (data) => {
  const clientSocketId = connectedClients.get(data.clientId);
  const client = await User.findById(data.clientId);
  
  if (clientSocketId) {
    // 1. Cliente conectado - Socket.IO
    io.to(clientSocketId).emit('quote:received', quoteData);
  } else if (client.fcmToken) {
    // 2. Cliente con push notifications
    await sendPushNotification(client.fcmToken, quoteData);
  } else {
    // 3. Fallback - Email/SMS
    if (client.email) {
      await sendQuoteEmail(client.email, quoteData);
    }
    if (client.phone) {
      await sendQuoteSMS(client.phone, quoteData);
    }
  }
});
```

### **Estimación:** 2-3 horas de desarrollo

---

## 📊 Comparación de Opciones

| Método | Costo | Implementación | Cobertura | Tiempo Real |
|--------|-------|----------------|-----------|-------------|
| **Socket.IO (Actual)** | 🟢 Gratis | 🟢 Fácil | 100% (app abierta) | ✅ Instantáneo |
| **FCM (Android)** | 🟢 Gratis | 🟡 Media | 90% Android | ⚠️ ~2-5 seg |
| **Web Push (iOS)** | 🟢 Gratis | 🟡 Media | 50% iOS 16.4+ | ⚠️ ~2-5 seg |
| **Email** | 🟢 Gratis (límite) | 🟢 Fácil | 95% | ❌ Minutos |
| **SMS** | 🔴 Pago ($0.05/SMS) | 🟢 Fácil | 100% | ⚠️ Segundos |

---

## 🎯 Estrategia Recomendada (Futura)

### **Nivel 1: Socket.IO (YA IMPLEMENTADO)** ✅
- Cubre el 99% de casos de uso
- Cliente espera con app abierta
- Experiencia perfecta

### **Nivel 2: Push Notifications (Si es necesario)**
- Solo si detectamos que usuarios cierran la app
- Implementar primero para Android (más fácil)
- iOS solo si hay demanda

### **Nivel 3: Email/SMS (Último recurso)**
- Solo para casos extremos
- Cliente no tiene app instalada
- O navegador muy antiguo

---

## 💰 Estimación de Costos (Ejemplo)

### Escenario: 1,000 cotizaciones/día

| Método | Uso | Costo Mensual |
|--------|-----|---------------|
| Socket.IO | 900 (90%) | $0 |
| FCM Push | 80 (8%) | $0 |
| Email | 15 (1.5%) | $0 (dentro del free tier) |
| SMS | 5 (0.5%) | $7.50 ($0.05 × 5 × 30) |
| **TOTAL** | | **~$8/mes** |

---

## 📝 Checklist para Implementación Futura

Cuando decidas implementar push notifications:

- [ ] Crear cuenta en Firebase
- [ ] Configurar proyecto Firebase
- [ ] Instalar dependencias
- [ ] Crear service worker
- [ ] Solicitar permisos al usuario
- [ ] Guardar FCM token en backend
- [ ] Implementar envío desde backend
- [ ] Testing en dispositivos reales
- [ ] Generar VAPID keys (para iOS)
- [ ] Configurar manifest.json
- [ ] Testing en iOS 16.4+

Para Email/SMS:
- [ ] Crear cuenta SendGrid/Twilio
- [ ] Obtener API keys
- [ ] Configurar templates
- [ ] Testing de envíos
- [ ] Monitorear costos

---

## 🎉 Estado Actual

**Lo que YA funciona perfectamente:**
- ✅ Notificaciones in-app (Socket.IO)
- ✅ Sonido y vibración
- ✅ Actualización en tiempo real
- ✅ Pull to refresh
- ✅ Marcadores en mapa

**Lo que PUEDES agregar después:**
- ⏳ Push notifications (Android/iOS)
- ⏳ Email fallback
- ⏳ SMS fallback

---

## 📞 Contacto y Recursos

### Documentación Oficial:
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- Web Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- SendGrid: https://docs.sendgrid.com/
- Twilio: https://www.twilio.com/docs

### Tutoriales Recomendados:
- FCM en React: https://firebase.google.com/docs/cloud-messaging/js/client
- Web Push: https://web.dev/push-notifications-overview/
- Service Workers: https://developers.google.com/web/fundamentals/primers/service-workers

---

**Recordatorio:** El sistema actual (Socket.IO + notificaciones in-app) es más que suficiente para el MVP. Las mejoras se pueden agregar según la demanda real de los usuarios.

*Última actualización: Diciembre 10, 2025*
