# Estado del Proyecto Desvare
**Fecha:** Mayo 19, 2026  
**Commit de referencia:** `738c3b4` — *"Fix: WaitingQuotes usa window.location.replace al aceptar cotización"*  
**Estado:** ✅ Flujo completo probado y funcionando en modo DEV (local + backend producción)

---

## Arquitectura general

```
┌─────────────────────┐     Socket.IO + REST     ┌─────────────────────────┐
│   driver-app        │ ◄──────────────────────► │   backend (Node.js)     │
│   Ionic/Capacitor   │                           │   Express + Socket.IO   │
│   React + Vite      │                           │   MongoDB Atlas         │
└─────────────────────┘                           │   PM2 en Digital Ocean  │
                                                  └──────────┬──────────────┘
┌─────────────────────┐     Socket.IO + REST                 │
│   client-pwa        │ ◄────────────────────────────────────┘
│   React + Ionic     │
│   Vite (PWA)        │
└─────────────────────┘
```

| App | Tecnología | URL producción |
|-----|------------|---------------|
| driver-app | Ionic + Capacitor + React + Vite | APK Android |
| client-pwa | React + Ionic + Vite | desvare.app |
| backend | Node.js + Express + Socket.IO | api.desvare.app (puerto 5001) |
| DB | MongoDB Atlas | Cluster en la nube |
| Archivos | DigitalOcean Spaces | desvare.fra1.digitaloceanspaces.com |
| Push notifications | Firebase FCM | — |
| OTP (SMS) | Twilio Verify | — |

---

## Flujo completo del negocio

### Fase 1 — Cliente solicita servicio (client-pwa)
1. **`RequestService.jsx`** — cliente selecciona origen, destino, vehículo y describe el problema
2. POST `/api/requests/new` → backend crea el request en MongoDB
3. Backend emite `request:received` via Socket.IO a todos los conductores ACTIVOS en la sala `active-drivers`
4. Push notification FCM a conductores con token registrado (fallback cuando el socket no llega)
5. Cliente navega a **`WaitingQuotes.jsx`** — espera cotizaciones

### Fase 2 — Conductor cotiza (driver-app)
1. **`Home.jsx`** — recibe `request:received`, muestra la tarjeta con `RequestCard`
2. Conductor toca la tarjeta → **`RequestDetail.jsx`** — ve mapa con ruta (origen/destino), detalles del vehículo
3. Conductor toca "Cotizar" → **`QuoteAmount.jsx`** — ingresa el monto
4. POST `/api/requests/:id/quotes` (REST) + `quote:send` (Socket.IO)
5. Backend enriquece con foto/rating del conductor y emite `quote:received` al cliente
6. Conductor regresa a **`Home.jsx`** — la tarjeta muestra badge "Cotizado" con el monto

### Fase 3 — Cliente acepta (client-pwa)
1. **`WaitingQuotes.jsx`** — ve cotizaciones llegando en tiempo real (marcadores en mapa)
2. Toca un marcador → `QuoteDetailSheet` — ve datos del conductor
3. Toca "Aceptar" → POST `/api/requests/:id/accept` + `service:accept` (Socket.IO)
4. Backend: actualiza MongoDB, asigna conductor, genera código de seguridad de 4 dígitos
5. Backend emite:
   - `service:accepted` → conductor aceptado
   - `quote:expired` / `service:taken` → otros conductores
6. Cliente navega a **`DriverOnWay.jsx`** con `window.location.replace`

### Fase 4 — Conductor en camino (driver-app)
1. **`ActiveService.jsx`** — recibe `service:accepted`, muestra mapa con ruta al cliente
2. GPS real: `sendLocationUpdate` via Socket.IO cada ~5s → backend guarda en RAM y MongoDB
3. Cliente ve al conductor moviéndose en **`DriverOnWay.jsx`** en tiempo real
4. Fallback: polling REST `/api/requests/:id/location` cada 8s (cubre iOS background)

### Fase 5 — Código de seguridad
1. **`ActiveService.jsx`** — conductor solicita al cliente el código de 4 dígitos
2. POST `/api/requests/:id/validate-code` + `service:code-validated` (Socket.IO)
3. Backend actualiza status → `in_progress`
4. Cliente ve en **`DriverOnWay.jsx`**: "¡Tu vehículo ya está en la grúa!"

### Fase 6 — Completar servicio (driver-app)
1. **`ActiveService.jsx`** — conductor toca "Completar servicio"
2. POST `/api/requests/:id/complete` + `service:complete` (Socket.IO)
3. Backend: marca `completed`, remueve tracking, notifica al cliente
4. Cliente recibe `service:completed` en **`DriverOnWay.jsx`**
5. `window.location.replace('/rate-service')` — desmonta `DriverOnWay` completamente

### Fase 7 — Calificación (client-pwa)
1. **`RatingService.jsx`** — cliente califica con estrellas (1-5) + comentario opcional
2. POST `/api/requests/:id/rate`
3. Backend: guarda rating en el Request, recalcula promedio del conductor en MongoDB
4. Cliente navega a `/home`

---

## Estructura de archivos clave

```
desvare-proyect/
├── backend/
│   ├── server.js              ← Socket.IO handlers principales (quote:send, service:accept, etc.)
│   ├── routes/
│   │   ├── requests.js        ← REST endpoints del flujo (new, accept, complete, rate...)
│   │   ├── drivers.js         ← Perfil, disponibilidad, toggle online/offline
│   │   └── auth.js            ← Login/registro con OTP (Twilio)
│   ├── models/
│   │   ├── Request.js         ← Schema de solicitud (status, quotes[], rating, tracking...)
│   │   └── User.js            ← Schema de usuario (driverProfile, fcmToken...)
│   └── middleware/
│       └── requestExpiration.js ← Cron cada 30min que expira requests viejos
│
├── driver-app/src/
│   ├── pages/
│   │   ├── Home.jsx           ← Bandeja de solicitudes + todos los listeners de socket
│   │   ├── RequestDetail.jsx  ← Detalle de solicitud con mapa (showMap guard para Mapbox)
│   │   ├── QuoteAmount.jsx    ← Formulario de cotización
│   │   ├── QuoteDetail.jsx    ← Estado de cotización enviada (escucha accepted/cancelled/taken)
│   │   └── ActiveService.jsx  ← Servicio en curso con GPS
│   ├── components/
│   │   └── RequestDetailMap.jsx ← Mapa Mapbox con animación secuencial (mapReady guard)
│   └── services/
│       ├── socket.js          ← Singleton Socket.IO del conductor
│       └── api.js             ← Axios con todos los endpoints REST
│
├── client-pwa/src/
│   ├── pages/
│   │   ├── RequestService.jsx ← Formulario de solicitud con mapa
│   │   ├── WaitingQuotes.jsx  ← Espera cotizaciones en tiempo real
│   │   ├── DriverOnWay.jsx    ← Conductor en camino con mapa + polling
│   │   └── RatingService.jsx  ← Calificación del servicio
│   └── services/
│       └── socket.js          ← Singleton Socket.IO del cliente
```

---

## Eventos Socket.IO — mapa completo

| Evento | Dirección | Emisor | Receptor | Descripción |
|--------|-----------|--------|----------|-------------|
| `driver:register` | Cliente→Servidor | driver-app | backend | Conductor se registra al conectar |
| `driver:availability-changed` | Cliente→Servidor | driver-app | backend | Toggle online/offline |
| `request:received` | Servidor→Cliente | backend | driver-app Home | Nueva solicitud disponible |
| `request:new` | Cliente→Servidor | client-pwa | backend | Cliente crea solicitud |
| `quote:send` | Cliente→Servidor | driver-app QuoteAmount | backend | Conductor envía cotización |
| `quote:received` | Servidor→Cliente | backend | client-pwa WaitingQuotes | Cotización llega al cliente |
| `quote:cancelled` | Servidor→Cliente | backend (REST) | client-pwa WaitingQuotes | Conductor canceló su cotización |
| `request:cancelled` | Servidor→Cliente | backend | driver-app Home/QuoteDetail, ActiveService | Cliente canceló la solicitud |
| `service:accept` | Cliente→Servidor | client-pwa WaitingQuotes | backend | Cliente acepta cotización |
| `service:accepted` | Servidor→Cliente | backend | driver-app Home/QuoteDetail | Cotización fue aceptada |
| `service:taken` | Servidor→Cliente | backend | driver-app Home | Otro conductor fue elegido |
| `quote:expired` | Servidor→Cliente | backend (REST accept) | driver-app Home | Cotización expiró |
| `driver:location-update` | Cliente→Servidor | driver-app ActiveService | backend | GPS del conductor |
| `driver:location-update` | Servidor→Cliente | backend | client-pwa DriverOnWay | Rebroadcast ubicación al cliente |
| `service:code-validated` | Cliente→Servidor | driver-app ActiveService | backend | Código de seguridad validado |
| `service:started` | Servidor→Cliente | backend | client-pwa DriverOnWay | Vehículo en la grúa |
| `service:complete` | Cliente→Servidor | driver-app ActiveService | backend | Conductor completa servicio |
| `service:completed` | Servidor→Cliente | backend | client-pwa DriverOnWay | Servicio terminado |
| `service:cancelled` | Servidor→Cliente | backend | driver-app ActiveService, client-pwa DriverOnWay | Servicio cancelado en curso |
| `client:register` | Cliente→Servidor | client-pwa | backend | Cliente se registra al conectar |
| `client:ping` | Cliente→Servidor | client-pwa (heartbeat 25s) | backend | Mantiene socketId actualizado |

---

## localStorage — qué guarda cada app y cuándo se limpia

### driver-app
| Key | Qué guarda | Se borra cuando |
|-----|-----------|-----------------|
| `user` | Datos del conductor (id, nombre, driverProfile) | Logout |
| `pendingRequestDetail` | Copia del request antes de ir a RequestDetail | Al enviar cotización en QuoteAmount |
| `pendingDriverLocation` | Ubicación del conductor en ese momento | Al enviar cotización en QuoteAmount |
| `lastQuotedRequest` | Request con mis quotes[] para mostrar badge en Home | Al aceptarse, cancelarse, expirar o cambiar a estado final |
| `activeService` | Datos del servicio aceptado (requestId, código, origen, destino) | Al completar o cancelar el servicio |
| `lastCancellation` | Datos de cancelación para mostrar motivo al conductor | Al ver la pantalla de detalle de cancelación |

### client-pwa
| Key | Qué guarda | Se borra cuando |
|-----|-----------|-----------------|
| `user` | Datos del cliente (id, nombre, teléfono) | Logout |
| `requestData` | Origen, destino, vehículo, detalles del servicio | Al aceptar cotización |
| `currentRequestId` | ID de la solicitud activa | Al aceptar cotización |
| `activeService` | Datos del servicio aceptado (conductor, código, monto) | Al completar servicio |
| `completedService` | Datos para pantalla de calificación | Al enviar calificación |

---

## Patrones críticos de navegación (Ionic + PWA)

### Regla de oro: `window.location.replace` vs `history.replace`

`history.replace/push` en Ionic **no desmonta el componente** — lo deja vivo en el stack con sus `setInterval` y listeners activos. Solo se usa cuando se quiere poder volver atrás.

`window.location.replace` hace un **reload completo del navegador** — desmonta todo limpiamente. Se usa en transiciones de estado importantes donde el componente anterior NO debe seguir vivo.

| Transición | Método usado | Razón |
|-----------|-------------|-------|
| QuoteAmount → Home (tras cotizar) | `window.location.replace` | Limpia stack, evita que RequestDetail quede montado |
| Home → ActiveService (cotización aceptada) | `window.location.replace` | Evita que Home quede activo durante el servicio |
| QuoteDetail → ActiveService (cotización aceptada) | `window.location.replace` | Idem |
| QuoteDetail → Home (cotización cancelada) | `window.location.replace` | Limpia stack |
| WaitingQuotes → DriverOnWay (cotización aceptada) | `window.location.replace` | Evita que WaitingQuotes re-monte y detecte localStorage vacío |
| DriverOnWay → RatingService (servicio completado) | `window.location.replace` | Mata polling intervals que seguirían redirigiendo |

### Patrón `showMap` + `useIonViewWillLeave` (Mapbox)
Mapbox lanza `TypeError: appendChild on undefined` si se desmonta el canvas mientras hay marcadores/timers pendientes. La solución en `RequestDetail` y `QuoteDetail`:
```jsx
const [showMap, setShowMap] = useState(true);
useIonViewWillLeave(() => setShowMap(false));  // desmonta el mapa ANTES de la animación
useIonViewWillEnter(() => setShowMap(true));   // lo restaura al volver
// En el JSX:
{showMap && <RequestDetailMap ... />}
```

### Patrón `mapReady` (Mapbox markers)
En `RequestDetailMap.jsx` ningún `Marker`, `Source` o `Layer` se renderiza hasta que el mapa disparó `onLoad`:
```jsx
const [mapReady, setMapReady] = useState(false);
<Map onLoad={() => setMapReady(true)} ...>
  {mapReady && showDriver && <Marker .../>}
</Map>
```

---

## Modo desarrollo local (driver-app)

### Activar modo DEV
El archivo `driver-app/.env.local` activa el modo desarrollo:
```env
VITE_API_URL=https://api.desvare.app
VITE_SOCKET_URL=https://api.desvare.app
VITE_DEV_MODE=true   ← desactiva plugins nativos (GPS background, FCM, LocationTracking)
```

### Correr en local
```bash
# Terminal 1 — driver-app
cd driver-app && npm run dev
# Abre: http://localhost:5173

# Terminal 2 — client-pwa (opcional, para probar flujo completo)
cd client-pwa && npm run dev
# Abre: http://localhost:5174 (o siguiente puerto libre)
```

### Volver a modo producción
```bash
# Renombrar para desactivar DEV mode
mv driver-app/.env.local driver-app/.env.local.dev_backup

# Generar APK
cd driver-app && npm run build
npx cap sync android
npx cap open android
# En Android Studio: Build → Generate Signed Bundle/APK

# Restaurar DEV mode después
mv driver-app/.env.local.dev_backup driver-app/.env.local
```

---

## Servidor Digital Ocean

### Acceso y gestión
```bash
# Conectar al servidor
ssh root@<IP_SERVIDOR>

# Ver estado del backend
cd /home/desvare/desvare-proyect/backend
pm2 status

# Actualizar backend con últimos cambios
git pull origin main && pm2 restart desvare-backend

# Ver logs en tiempo real
pm2 logs desvare-backend

# Ver últimas 50 líneas de errores
pm2 logs desvare-backend --err --lines 50
```

### Variables de entorno del backend
Están en `/home/desvare/desvare-proyect/backend/.env` (nunca en Git). Incluyen:
- `MONGODB_URI` — conexión a MongoDB Atlas
- `JWT_SECRET` — para tokens de autenticación
- `TWILIO_*` — para OTP por SMS
- `FIREBASE_*` — para FCM push notifications
- `DO_SPACES_*` — para subida de fotos a DigitalOcean Spaces

---

## Bugs conocidos (menores, no bloquean el flujo)

| # | Descripción | Archivo | Impacto |
|---|-------------|---------|---------|
| 1 | `WaitingQuotes` registra listeners antes de que `initializeData` (async) termine | `client-pwa/WaitingQuotes.jsx` | Bajo — listeners pueden capturar requestId obsoleto en edge cases |
| 2 | `ActiveService` navega a `/home` con `history.push` en caso de error de carga | `driver-app/ActiveService.jsx` | Bajo — permite volver atrás al vacío |
| 3 | `driver:arriving` emitido por backend pero sin listener en la PWA | `backend/server.js` | Bajo — UI "tu conductor está cerca" no implementada |
| 4 | `RequestDetailMap` fetch de Mapbox sin `AbortController` | `driver-app/RequestDetailMap.jsx` | Bajo — posible setState tras desmontar en navegación muy rápida |
| 5 | GPS (`getCurrentPosition`) en `QuoteDetail`/`ActiveService` sin `clearWatch` al desmontar | driver-app | Bajo — menor en pantallas estáticas |

---

## Checkpoint Git — cómo volver a este punto

El estado actual está documentado en el commit:

```
738c3b4  Fix: WaitingQuotes usa window.location.replace al aceptar cotización
```

Este commit es el **punto de estabilidad** del flujo completo probado el 19 de Mayo de 2026.

### Cómo volver a este punto exacto

```bash
# Ver el estado de este commit sin perder cambios actuales
git show 738c3b4 --stat

# Crear una rama desde este punto (recomendado para explorar sin riesgo)
git checkout -b rollback-mayo-2026 738c3b4

# Volver el código a este punto (CUIDADO: descarta commits posteriores)
git reset --hard 738c3b4

# Volver a este punto en una rama nueva y desplegar (forma segura)
git checkout -b hotfix-desde-base 738c3b4
# ... hacer cambios ...
git push origin hotfix-desde-base
```

### Crear un tag para marcar este punto permanentemente
```bash
git tag -a v1.0-flujo-completo -m "Flujo completo probado: cotizar → aceptar → servicio activo → completar → calificar"
git push origin v1.0-flujo-completo
```

---

## Resumen de todos los fixes aplicados en esta sesión

| Fix | Archivo(s) | Problema resuelto |
|-----|-----------|-------------------|
| `window.location.replace` al navegar | `QuoteAmount`, `QuoteDetail`, `Home`, `WaitingQuotes`, `DriverOnWay` | Ionic no desmontaba componentes; polling e intervals seguían vivos causando re-redirecciones |
| `IonPage` wrappers | `RequestDetail`, `QuoteDetail` | Los lifecycle hooks de Ionic (`useIonViewWillLeave`) no funcionaban sin `IonPage` |
| `showMap` + `useIonViewWillLeave` | `RequestDetail`, `QuoteDetail` | Mapbox lanzaba `appendChild on undefined` al navegar antes de que el canvas estuviera listo |
| `mapReady` en `onLoad` + cleanup de timers | `RequestDetailMap` | Markers se renderizaban antes de que el mapa cargara; timers no se cancelaban al desmontar |
| `lastQuotedRequest` con verificación API | `Home` | Solicitudes canceladas reaparecían en la bandeja tras reload |
| Listeners en `QuoteDetail` (`service:accepted`, `request:cancelled`, `service:taken`, `quote:expired`) | `QuoteDetail` | Si el cliente respondía mientras el conductor estaba en QuoteDetail, no pasaba nada |
| `isOnline=false` al aceptar desde `QuoteDetail` | `QuoteDetail` | Estado OCUPADO no se actualizaba en localStorage si la aceptación llegaba fuera de Home |
| Flag `cancellationHandled` | `ActiveService` | Backend emite `service:cancelled` + `request:cancelled` para lo mismo → doble toast y doble navegación |
| `completedService` en path de polling | `DriverOnWay` (PWA) | Si el socket no llegaba (iOS background), `RatingService` no encontraba datos y redirigía a Home |
| `pendingRequestDetail` se borra en QuoteAmount, no en RequestDetail | `RequestDetail`, `QuoteAmount` | Fallback de datos se destruía antes de que QuoteAmount pudiera usarlo |
| `currentRequestId` limpiado al aceptar | `WaitingQuotes` (PWA) | ID huérfano en localStorage mezclaba solicitudes futuras |
| `.toString()` en comparaciones de IDs | `Home`, `WaitingQuotes` | `ObjectId` vs string causaba comparaciones falsas, tarjetas no se filtraban |
| `socketService.sendQuote()` en QuoteAmount | `QuoteAmount` | Cotización solo iba por REST; cliente no la recibía en tiempo real |
| Fallback a `localStorage` para `request` | `QuoteAmount` | Si Ionic perdía `location.state`, la pantalla de cotización se quedaba sin datos |
| `isFirstRating` antes de `request.save()` | `backend/routes/requests.js` | `totalServices` del conductor nunca incrementaba porque el check se evaluaba después de guardar |
