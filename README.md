# Desvare App — Documentación del Proyecto

Sistema de cotizaciones en tiempo real para clientes y conductores de grúas y servicios vehiculares.

---

## Arquitectura General

```
desvare-proyect/
├── backend/           # API REST + Socket.IO (Node.js + Express + MongoDB)
├── client-pwa/        # PWA para clientes (React + Ionic + Vite)
├── driver-app/        # App para conductores (Ionic React + Capacitor → Android)
├── admin-dashboard/   # Dashboard administrativo (React + Vite)
└── README.md
```

| Capa | Stack |
|---|---|
| Backend | Node.js, Express, MongoDB Atlas, Socket.IO, JWT |
| Frontend | React 18, Ionic Framework, Vite |
| Mapas | Mapbox GL, Google Maps API |
| Notificaciones | Firebase Cloud Messaging (PWA), Capacitor Push (Android) |
| Monitoreo | Sentry |

---

## Escenario 1 — Pruebas locales en el Mac (apuntando a producción)

Este es el flujo para **desarrollar y probar cambios** en cualquiera de las tres apps sin necesitar correr el backend localmente. Todo se conecta al backend real de producción (`https://api.desvare.app`).

### Cómo funciona

```
Tu Mac (localhost)                  Producción
┌─────────────────────┐             ┌────────────────────────┐
│ PWA  :5173          │──────────→  │ api.desvare.app        │
│ Driver App  :5174   │──────────→  │ (Backend DigitalOcean) │
│ Admin Dashboard :5175+│─────────→ │                        │
└─────────────────────┘             └────────────────────────┘
```

El conductor puede usar tanto la driver-app corriendo en local (`:5174`) como la **app ya publicada en Play Store** — ambas apuntan al mismo backend de producción y se ven entre sí.

### Configuración de los .env (ya configurados)

**`client-pwa/.env`**
```env
VITE_API_URL=https://api.desvare.app
VITE_SOCKET_URL=https://api.desvare.app
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiZGVzdmFyZSI...
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBnF2Os...
VITE_FIREBASE_API_KEY=AIzaSyBnF2Os...
VITE_FIREBASE_AUTH_DOMAIN=desvare-production.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=desvare-production
VITE_FIREBASE_STORAGE_BUCKET=desvare-production.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=200097542658
VITE_FIREBASE_APP_ID=1:200097542658:web:22e41ad8dbef3c6889ed1b
VITE_FIREBASE_VAPID_KEY=BMr5Hz6cXWdWtiPI8q...
```

**`driver-app/.env`**
```env
VITE_API_URL=https://api.desvare.app
VITE_SOCKET_URL=https://api.desvare.app
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiZGVzdmFyZSI...
VITE_DEV_MODE=true
```

**`admin-dashboard/.env`**
```env
VITE_API_URL=https://api.desvare.app
VITE_SOCKET_URL=https://api.desvare.app
```

### Pasos para levantar todo

**Terminal 1 — PWA Cliente:**
```bash
cd client-pwa
npm run dev
# → http://localhost:5173
```

**Terminal 2 — App Conductores:**
```bash
cd driver-app
npm run dev
# → http://localhost:5174
```

**Terminal 3 — Dashboard Admin:**
```bash
cd admin-dashboard
npm run dev
# → http://localhost:5175 (o el siguiente puerto libre)
```

### Probar el flujo completo

1. Abre Chrome con modo iPhone 14 Pro (F12 → icono de teléfono).
2. Abre dos pestañas:
   - `http://localhost:5173` → simula el **cliente**
   - `http://localhost:5174` → simula el **conductor** (o usa la app de Play Store)
3. En la PWA: busca origen y destino → agrega tu vehículo → pulsa **"Buscar Cotizaciones"**.
4. En la app del conductor: recibe la solicitud en la bandeja → cotiza.
5. En la PWA: acepta la cotización.
6. En el admin: `http://localhost:5175` puedes ver las solicitudes y gestionar conductores.

---

## Escenario 2 — Lanzamiento a producción real

Cuando los cambios estén probados y listos para usuarios reales.

### PWA Cliente → Vercel

El deploy es automático al hacer push a `main`. Las variables de entorno están configuradas en el dashboard de Vercel (Settings → Environment Variables). No se requiere acción manual.

```bash
git add .
git commit -m "feat: descripción del cambio"
git push origin main
# Vercel hace el deploy automáticamente en desvare.app
```

### Dashboard Admin → Vercel

Igual que la PWA — deploy automático desde `main`. URL: `admin.desvare.app`

### App Conductores → Play Store (APK/AAB)

> **Crítico:** Vite bake las variables en el build. Antes de compilar, el `driver-app/.env` debe tener `VITE_DEV_MODE=false` y apuntar a producción (ya lo hace por defecto).

```bash
cd driver-app

# 1. Asegúrate de que el .env tenga:
#    VITE_API_URL=https://api.desvare.app
#    VITE_DEV_MODE=false

# 2. Compilar
npm run build

# 3. Sincronizar con Capacitor
npx cap sync android

# 4. Abrir Android Studio y generar el AAB firmado
npx cap open android
# En Android Studio: Build → Generate Signed Bundle / APK → Android App Bundle
```

Luego sube el `.aab` a [Google Play Console](https://play.google.com/console) → Desvare Conductor → Producción → Nueva versión.

### Backend → DigitalOcean

El backend ya está corriendo en producción. Para redesplegar cambios:

```bash
# SSH al servidor
cd /ruta/del/proyecto/backend
git pull origin main
npm install
pm2 restart server
```

---

## Variables de entorno — referencia completa

### client-pwa

| Variable | Descripción | Dónde obtenerla |
|---|---|---|
| `VITE_API_URL` | URL del backend | `https://api.desvare.app` (prod) / `http://localhost:5000` (local backend) |
| `VITE_SOCKET_URL` | URL del socket | Igual que API_URL |
| `VITE_MAPBOX_TOKEN` | Token de mapas | [account.mapbox.com](https://account.mapbox.com) |
| `VITE_GOOGLE_MAPS_API_KEY` | Geocoding y Places | Google Cloud Console → Credenciales → Browser key |
| `VITE_FIREBASE_*` | Notificaciones push web | Firebase Console → Configuración del proyecto → App web |
| `VITE_FIREBASE_VAPID_KEY` | Clave push web | Firebase → Cloud Messaging → Certificados web push |
| `VITE_SENTRY_DSN` | Monitoreo de errores | sentry.io → tu proyecto → Settings → DSN |

### driver-app

| Variable | Descripción | Valor |
|---|---|---|
| `VITE_API_URL` | URL del backend | `https://api.desvare.app` |
| `VITE_SOCKET_URL` | URL del socket | `https://api.desvare.app` |
| `VITE_MAPBOX_TOKEN` | Token de mapas | [account.mapbox.com](https://account.mapbox.com) |
| `VITE_DEV_MODE` | Omite permisos nativos en browser | `true` en local, `false` al compilar APK |
| `VITE_SENTRY_DSN` | Monitoreo de errores | sentry.io |

---

## Troubleshooting

### Error CORS al conectar con el backend
- Verifica que `VITE_API_URL` en el `.env` apunte a `https://api.desvare.app`.
- Reinicia el servidor de desarrollo después de cambiar el `.env`.

### El mapa no carga
- Verifica que `VITE_MAPBOX_TOKEN` esté definido y sea válido.
- Revisa la consola del navegador: un error 401 de Mapbox indica token incorrecto.

### El conductor no recibe solicitudes
- Confirma que PWA y app del conductor apuntan al mismo backend.
- Verifica que el conductor esté en estado "Activo" en la app.

### La app Android no conecta
- El `.env` debe tener `VITE_API_URL=https://api.desvare.app` antes de compilar.
- Un build con URL incorrecta requiere recompilar desde cero.

### Error 401 al aceptar cotización
- El token JWT expiró. Cierra sesión y vuelve a ingresar.

---

## Equipo

Desarrollado por el equipo de Desvare. Todos los derechos reservados.
