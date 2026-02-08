# 📱 Configuración Completa de PWA + Notificaciones Push

**Fecha:** 2026-02-06  
**Objetivo:** Convertir la app en una PWA completa con notificaciones push funcionales

---

## ✅ Cambios Implementados

### 1. **Manifest.json** (PWA Configuration)
- ✅ Creado `/client-pwa/public/manifest.json`
- Define nombre, iconos, colores, y comportamiento de instalación
- Configura la app como standalone (se ve como app nativa)

### 2. **Index.html** (Meta Tags PWA)
- ✅ Agregados meta tags para iOS
- ✅ Agregado link al manifest
- ✅ Configurado theme-color
- ✅ Agregados iconos para instalación

### 3. **Main.jsx** (Service Worker Registration)
- ✅ Registrado Service Worker automáticamente al cargar
- ✅ Scope configurado correctamente

---

## 🚨 PROBLEMA: Notificaciones Bloqueadas

Si NO te apareció el prompt de notificaciones, es porque **ya las bloqueaste antes**.

### Cómo Verificar:

1. Abre `http://localhost:5173`
2. Click en el **candado 🔒** en la barra de direcciones
3. Ve a **"Configuración del sitio"** o **"Permisos"**
4. Busca **"Notificaciones"**

### Estados Posibles:

| Estado | Qué Significa | Solución |
|--------|---------------|----------|
| ❌ **Bloqueado** | Rechazaste el permiso antes | Cambiar a "Preguntar" manualmente |
| ⚠️ **Preguntar** | El navegador preguntará | Recargar la página y aceptar |
| ✅ **Permitir** | Ya funcionan las notificaciones | ¡Todo bien! |

---

## 🔧 Solución: Desbloquear Notificaciones

### Opción 1: Manual (Chrome)

1. Click en el candado 🔒 → **Configuración del sitio**
2. En **Notificaciones**: Cambiar de "Bloqueado" a **"Preguntar"**
3. **Recargar la página** (F5 o Cmd+R)
4. Debería aparecer el prompt de notificaciones
5. Click en **"Permitir"**

### Opción 2: Borrar Todo y Empezar de Cero

1. Abre DevTools (F12)
2. Ve a **Application** → **Storage**
3. Click en **"Clear site data"**
4. Cierra el navegador completamente
5. Vuelve a abrir `http://localhost:5173`
6. Haz login
7. Espera 2 segundos → Debería aparecer el prompt

### Opción 3: Usar Modo Incógnito (Testing Rápido)

```
1. Abre una ventana de incógnito (Cmd+Shift+N o Ctrl+Shift+N)
2. Ve a http://localhost:5173
3. Haz login
4. Espera 2 segundos
5. Te aparecerá el prompt de notificaciones
6. Acepta
```

---

## 📋 Checklist PWA Completa

### ✅ Ya Implementado:

- [x] **Manifest.json** con toda la configuración
- [x] **Meta tags** para PWA en `index.html`
- [x] **Service Worker** registrado
- [x] **Firebase Cloud Messaging** configurado
- [x] **Listener de notificaciones** en foreground
- [x] **Notificaciones en background** via Service Worker
- [x] **HTTPS** (localhost cuenta como seguro)

### 🟡 Pendiente (No Crítico):

- [ ] **Iconos de la app** (`/icons/icon-*.png`) - Necesarios para instalación
- [ ] **Screenshots** para Google Play / App Store
- [ ] **Service Worker personalizado** (opcional, Firebase SW ya funciona)

---

## 🎨 Crear Iconos para PWA

La PWA necesita iconos en varios tamaños. Puedes usar herramientas online:

### Opción 1: PWA Image Generator (Recomendado)
1. Ve a https://www.pwabuilder.com/imageGenerator
2. Sube tu logo de Desvare (preferiblemente 512x512px)
3. Descarga el ZIP con todos los tamaños
4. Extrae en `/client-pwa/public/icons/`

### Opción 2: Usar un Logo Temporal
Por ahora, puedes copiar el mismo logo en todos los tamaños:

```bash
cd client-pwa/public
mkdir icons

# Crear iconos temporales (todos del mismo tamaño por ahora)
# Necesitarás un logo.png de al menos 512x512
cp logo.png icons/icon-72x72.png
cp logo.png icons/icon-96x96.png
cp logo.png icons/icon-128x128.png
cp logo.png icons/icon-144x144.png
cp logo.png icons/icon-152x152.png
cp logo.png icons/icon-192x192.png
cp logo.png icons/icon-384x384.png
cp logo.png icons/icon-512x512.png
```

---

## 🧪 Cómo Probar la PWA

### Test 1: Verificar que es una PWA Válida

1. Abre `http://localhost:5173` en Chrome
2. Abre DevTools (F12)
3. Ve a **Application** → **Manifest**
4. Deberías ver:
   - ✅ Nombre: "Desvare - Servicio de Grúas"
   - ✅ Start URL: "/"
   - ✅ Display: "standalone"
   - ⚠️ Iconos (si los agregaste)

### Test 2: Probar Instalación en Escritorio

1. Abre `http://localhost:5173` en Chrome
2. En la barra de direcciones, debería aparecer un ícono de **instalar** ➕
3. Click en el ícono
4. Click en **"Instalar"**
5. La app se instalará como app nativa

### Test 3: Probar Instalación en Móvil

1. Abre `http://localhost:5173` en Chrome móvil
2. Menu ⋮ → **"Agregar a pantalla de inicio"** o **"Instalar app"**
3. La app se agregará a tu home screen
4. Ábrela desde ahí → Se verá como app nativa (sin barra de navegador)

### Test 4: Probar Notificaciones

#### En Navegador Normal:

1. Asegúrate de que las notificaciones NO estén bloqueadas (ver arriba)
2. Abre `localhost:5173` y haz login
3. Espera 2 segundos → Prompt de notificaciones
4. Click en **"Permitir"**
5. Verifica en console: `✅ Token FCM registrado en el servidor`
6. Solicita un servicio
7. Envía cotización desde Driver App
8. **Deberías ver un toast en la PWA** 🔔

#### Con la PWA Instalada:

1. Instala la PWA (Test 2)
2. Abre la PWA instalada
3. Haz login
4. Acepta notificaciones
5. **Minimiza la PWA** (NO la cierres)
6. Envía cotización desde Driver App
7. **Deberías ver notificación del sistema** 🔔

---

## 🔍 Debugging Notificaciones

### Verificar Token FCM:

```javascript
// Abre console del navegador en localhost:5173
// Después de hacer login, verifica:

// 1. Usuario logueado
JSON.parse(localStorage.getItem('user'))

// 2. Token FCM guardado
localStorage.getItem('fcmToken')

// 3. Prompt no fue rechazado antes
localStorage.getItem('notificationPromptDismissed')

// 4. Permisos actuales
Notification.permission // Debe ser "granted"
```

### Logs Esperados en Console:

```
✅ Usuario encontrado: [nombre]
🔔 Mostrando prompt de notificaciones...
📱 Solicitando permisos de notificación...
✅ Permisos concedidos
✅ Service Worker registrado y listo
🔑 Obteniendo token FCM...
✅ Token FCM obtenido: eXXX...
✅ Token FCM registrado en el servidor
🔔 Registrando listener de notificaciones Firebase...
```

### Si No Ves Estos Logs:

1. **No aparece "Mostrando prompt":**
   - Verifica: `localStorage.getItem('notificationPromptDismissed')`
   - Si es `"true"`, bórralo: `localStorage.removeItem('notificationPromptDismissed')`
   - Recarga y vuelve a hacer login

2. **No aparece "Token FCM obtenido":**
   - Ve a Application → Service Workers
   - Verifica que `firebase-messaging-sw.js` esté "activated and running"
   - Si no está, limpia site data y recarga

3. **Token obtenido pero no guardado:**
   - Verifica en backend: `pm2 logs desvare-backend | grep FCM`
   - Debe aparecer: "Token FCM guardado para usuario"

---

## 📱 Compatibilidad de Notificaciones

### Navegadores que Soportan Notificaciones Push:

| Navegador | Desktop | Móvil | Notas |
|-----------|---------|-------|-------|
| Chrome | ✅ | ✅ | Soporte completo |
| Edge | ✅ | ✅ | Basado en Chromium |
| Firefox | ✅ | ⚠️ | Limitado en Android |
| Safari | ✅ (macOS 13+) | ❌ | iOS no soporta Web Push |
| Opera | ✅ | ✅ | Basado en Chromium |

### Limitaciones Importantes:

1. **iOS (iPhone/iPad):**
   - ❌ Web Push NO funciona en iOS Safari
   - ✅ Alternativa: Usar la Driver App (APK) con Capacitor
   - 🔜 Apple prometió soporte en futuras versiones

2. **Android:**
   - ✅ Funciona perfectamente en Chrome, Edge, Firefox
   - ✅ Incluso con la PWA instalada
   - ✅ Notificaciones aparecen en el sistema

3. **Desktop:**
   - ✅ Funciona en todos los navegadores modernos
   - ✅ Notificaciones del sistema operativo

---

## 🚀 Flujo de Instalación de la PWA

### Para que la PWA sea instalable:

1. ✅ Debe estar en HTTPS (localhost cuenta)
2. ✅ Debe tener `manifest.json`
3. ✅ Debe tener Service Worker registrado
4. ⚠️ Debe tener iconos (mínimo 192x192 y 512x512)

### Cuando el usuario instala:

1. Navegador descarga todos los assets
2. Crea un acceso directo en el escritorio/home screen
3. La app se abre en modo standalone (sin barra de navegador)
4. Se comporta como una app nativa

### Beneficios de la PWA Instalada:

- 📱 Ícono en el home screen
- 🚀 Carga más rápida (caché)
- 🔔 Notificaciones del sistema
- 📵 Funciona offline (con configuración adicional)
- 🎨 Sin barra de navegador (UI limpia)

---

## 📝 Próximos Pasos

### 1. Desbloquear Notificaciones (AHORA)

Sigue los pasos de la sección **"Solución: Desbloquear Notificaciones"**

### 2. Crear Iconos (OPCIONAL)

Si quieres que la PWA sea instalable, necesitas iconos:
- Usa PWA Image Generator
- O temporalmente copia el mismo logo en todos los tamaños

### 3. Probar Notificaciones

1. Desbloquea notificaciones
2. Recarga `localhost:5173`
3. Haz login
4. Acepta el prompt
5. Prueba el flujo completo

### 4. Probar Instalación (OPCIONAL)

1. Con iconos creados
2. Click en el ícono de instalar en Chrome
3. Instala la PWA
4. Prueba desde la app instalada

---

## 🎯 Resultado Esperado

Después de seguir estos pasos:

| Funcionalidad | Estado |
|---------------|--------|
| PWA instalable | ✅ (con iconos) |
| Notificaciones en foreground | ✅ |
| Notificaciones en background | ✅ |
| Funciona en Android | ✅ |
| Funciona en iOS | ⚠️ (limitado) |
| Standalone mode | ✅ |
| Offline support | 🟡 (opcional) |

---

**Estado:** ✅ PWA configurada correctamente  
**Bloqueador:** Notificaciones bloqueadas manualmente  
**Solución:** Desbloquear en configuración del navegador
