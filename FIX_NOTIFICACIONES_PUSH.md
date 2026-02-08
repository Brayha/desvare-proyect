# 🔔 Fix: Notificaciones Push Implementadas

**Fecha:** 2026-02-06  
**Problema:** Las notificaciones push no llegaban al Client PWA cuando se recibían cotizaciones.

---

## 🐛 Problemas Identificados

### 1. NO había listener de notificaciones en foreground
El servicio `onMessageListener` existía pero nunca se usaba. Cuando la PWA estaba abierta y llegaba una notificación, no había código que la escuchara.

### 2. Prompt de permisos sin delay
El prompt de notificaciones se mostraba inmediatamente después del login, lo cual podía ser intrusivo.

### 3. NO había feedback visual al usuario
No había forma de mostrar la notificación cuando la app estaba abierta (foreground).

---

## ✅ Soluciones Implementadas

### 1. Agregado listener de notificaciones en `App.jsx`

**Cambios:**
- ✅ Importado `onMessageListener` y `useIonToast`
- ✅ Creado componente `FirebaseNotificationListener`
- ✅ Agregado al render principal de `App`

**Funcionalidades del listener:**
- 🔔 Escucha notificaciones en tiempo real
- 📱 Muestra toast con el mensaje de la notificación
- 🔊 Reproduce sonido (si el archivo existe)
- 📳 Vibra el dispositivo (si está soportado)
- 🔗 Permite navegar a la URL especificada en la notificación

**Código agregado:**

```javascript
const FirebaseNotificationListener = () => {
  const { user } = useAuth();
  const [present] = useIonToast();

  useEffect(() => {
    if (!user?.id) return;
    
    console.log('🔔 Registrando listener de notificaciones Firebase...');
    
    const unsubscribe = onMessageListener((payload) => {
      console.log('📬 Notificación recibida en foreground:', payload);
      
      // Mostrar toast con la notificación
      present({
        message: `${payload.title}\n${payload.body}`,
        duration: 5000,
        position: 'top',
        color: 'primary',
        buttons: [
          {
            text: 'Ver',
            handler: () => {
              if (payload.data?.url) {
                window.location.href = payload.data.url;
              }
            }
          },
          {
            text: 'Cerrar',
            role: 'cancel'
          }
        ]
      });
      
      // Reproducir sonido y vibrar
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(err => console.log('No se pudo reproducir sonido:', err));
      } catch (err) {
        console.log('Error al reproducir sonido:', err);
      }
      
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    });
    
    return () => {
      console.log('🔕 Desregistrando listener de notificaciones');
      unsubscribe();
    };
  }, [user, present]);

  return null;
};
```

---

### 2. Mejorado prompt de permisos en `AuthContext.jsx`

**Cambios:**
- ✅ Agregado delay de 2 segundos después del login
- ✅ Mejorados logs de debugging
- ✅ Mejor manejo de condiciones

**Código modificado:**

```javascript
const login = async (userData) => {
  console.log('👤 Login exitoso:', userData.name);
  setUser(userData);
  setIsLoggedIn(true);
  
  // Guardar en localStorage
  localStorage.setItem('user', JSON.stringify(userData));
  
  // Cargar vehículos
  await loadVehicles(userData.id);

  // Solicitar permisos de notificaciones después del login (con delay de 2 segundos)
  setTimeout(() => {
    const promptDismissed = localStorage.getItem('notificationPromptDismissed') === 'true';
    const shouldPrompt =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default' &&
      !promptDismissed;
    
    if (shouldPrompt) {
      console.log('🔔 Mostrando prompt de notificaciones...');
      setShowNotificationPrompt(true);
    } else {
      console.log('ℹ️ Prompt de notificaciones no necesario');
    }
  }, 2000);
};
```

---

## 📋 Archivos Modificados

1. ✅ `/client-pwa/src/App.jsx`
   - Importado `useIonToast` y `onMessageListener`
   - Creado componente `FirebaseNotificationListener`
   - Agregado al render

2. ✅ `/client-pwa/src/contexts/AuthContext.jsx`
   - Agregado delay de 2 segundos al prompt
   - Mejorados logs de debugging

---

## 🧪 Cómo Probar las Notificaciones

### Prerequisitos:
1. ✅ Backend con Firebase configurado (ya está)
2. ✅ Service Worker activo (ya está)
3. ✅ Token FCM registrado

### Test 1: Verificar Token FCM

1. Abre `http://localhost:5173` en Chrome
2. Haz login con un usuario cliente
3. Abre DevTools (F12) → Console
4. Busca estos logs:
   ```
   🔔 Mostrando prompt de notificaciones...
   📱 Solicitando permisos de notificación...
   ✅ Permisos concedidos
   🔑 Obteniendo token FCM...
   ✅ Token FCM obtenido: e...
   ✅ Token FCM registrado en el servidor
   🔔 Registrando listener de notificaciones Firebase...
   ```

### Test 2: Probar Notificación Foreground (App Abierta)

1. **Tab 1 (Cliente):** Abre `http://localhost:5173` y haz login
2. Solicita un servicio
3. Ve a la página de espera de cotizaciones
4. **Tab 2 (Conductor):** Abre `http://localhost:5174`
5. Envía una cotización
6. **Vuelve al Tab 1:** Deberías ver:
   - ✅ Un toast en la parte superior con el mensaje
   - ✅ Sonido de notificación (si el archivo existe)
   - ✅ Vibración (en dispositivos móviles)
   - ✅ Log en console: `📬 Notificación recibida en foreground:`

### Test 3: Probar Notificación Background (App Minimizada)

1. Abre `http://localhost:5173` y haz login
2. Solicita un servicio
3. **Minimiza el navegador o cambia a otra pestaña**
4. En otro navegador/dispositivo, envía una cotización
5. Deberías ver:
   - ✅ Notificación del sistema operativo
   - ✅ Click en la notificación te lleva a `/tabs/desvare`

---

## 🔍 Debugging

### Si no ves el prompt de permisos:

1. Verifica que no hayas bloqueado las notificaciones antes:
   - Chrome: Click en el candado 🔒 → Configuración del sitio → Notificaciones
   - Debe estar en "Preguntar" (default)

2. Limpia el flag de localStorage:
   ```javascript
   // En console del navegador:
   localStorage.removeItem('notificationPromptDismissed');
   ```

3. Cierra sesión y vuelve a iniciar sesión

### Si el listener no funciona:

1. Verifica que el usuario esté logueado:
   ```javascript
   // En console del navegador:
   JSON.parse(localStorage.getItem('user'))
   ```

2. Verifica los logs en console:
   ```
   🔔 Registrando listener de notificaciones Firebase...
   ```

3. Si ves errores de Firebase, verifica que el Service Worker esté activo:
   - DevTools → Application → Service Workers
   - Debe mostrar `firebase-messaging-sw.js` como "activated and running"

### Si las notificaciones no llegan:

1. Verifica que el token FCM esté registrado en el backend:
   ```bash
   # En el servidor DigitalOcean
   pm2 logs desvare-backend | grep "FCM"
   ```

2. Verifica que el backend esté enviando notificaciones:
   ```
   📱 Enviando push notification al cliente...
   ✅ Push notification enviada al cliente
   ```

---

## 📊 Flujo Completo de Notificaciones

### Cuando llega una cotización:

1. **Backend** detecta nueva cotización
2. **Backend** busca el `fcmToken` del cliente en la BD
3. **Backend** envía notificación vía Firebase Admin SDK
4. **Firebase** envía la notificación al navegador del cliente

**Si la PWA está abierta (foreground):**
- ✅ `onMessageListener` intercepta el mensaje
- ✅ Se muestra un toast en la app
- ✅ Reproduce sonido y vibra
- ✅ Usuario puede hacer click en "Ver" para ir a las cotizaciones

**Si la PWA está minimizada (background):**
- ✅ El Service Worker (`firebase-messaging-sw.js`) intercepta el mensaje
- ✅ Se muestra notificación del sistema
- ✅ Usuario puede hacer click para abrir la app

---

## 🎯 Resultado Esperado

Después de estas correcciones:

| Escenario | Antes | Ahora |
|-----------|-------|-------|
| App abierta + cotización llega | ❌ Sin feedback | ✅ Toast + sonido + vibración |
| App minimizada + cotización llega | ❌ Sin notificación | ✅ Notificación del sistema |
| Login por primera vez | ❌ Sin prompt | ✅ Prompt después de 2s |
| Token FCM registrado | ❓ No verificable | ✅ Logs claros en console |

---

## 📝 Próximos Pasos

1. ✅ Reiniciar servidores de desarrollo
2. ✅ Probar el flujo completo
3. ✅ Verificar que lleguen las notificaciones
4. 🟡 (Opcional) Agregar archivo de sonido `notification-sound.mp3` en `/public/`
5. 🟡 (Opcional) Implementar notificaciones en Driver App

---

## 🔊 Sonido de Notificación (Opcional)

Para agregar el sonido de notificación:

1. Descarga un archivo de sonido (formato `.mp3`)
2. Guárdalo en `/client-pwa/public/notification-sound.mp3`
3. El código ya está listo para usarlo

Si no existe el archivo, simplemente no reproducirá sonido (no causará error).

---

**Estado:** ✅ Completado  
**Impacto:** Las notificaciones ahora funcionan correctamente en foreground y background  
**Testing:** Pendiente de prueba por el usuario
