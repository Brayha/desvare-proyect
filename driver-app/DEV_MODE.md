# Guía de Desarrollo Local — driver-app

> **Para la IA:** Este archivo documenta exactamente qué se hizo, por qué, y cómo
> revertirlo. Léelo completo antes de tocar cualquier archivo relacionado con
> permisos nativos o variables de entorno.

---

## El problema que resuelve esto

La `driver-app` usa plugins nativos de Capacitor (GPS background, FCM push
notifications, optimización de batería) que **no existen en el navegador web**.
Sin embargo, para hacer ajustes visuales de CSS/JSX se necesita correr la app
en el navegador con hot-reload (`npm run dev`) para ver los cambios en tiempo real.

El modo DEV desactiva únicamente los plugins nativos problemáticos, sin tocar
la lógica de negocio ni la conexión con el backend real.

---

## Dos modos de funcionamiento

### MODO DEV — Ajustes visuales en el navegador

**Activo cuando:** existe el archivo `driver-app/.env.local` con `VITE_DEV_MODE=true`

| Qué funciona | Qué no aplica en este modo |
|---|---|
| Todo el flujo de Login / OTP / Registro | FCM Push Notifications (no hay en Chrome) |
| Conexión al backend real de producción | Plugin `LocationTracking` (solo Android nativo) |
| Subida de fotos (usa `<input file>` del navegador) | Optimización de batería (solo Android) |
| Socket.IO en tiempo real | |
| GPS (usa la API de geolocalización del navegador) | |
| Home con servicios entrantes | |

**Cómo activarlo:**
```
# El archivo driver-app/.env.local YA EXISTE si seguiste esta guía.
# Si lo borraste, créalo con este contenido:

VITE_API_URL=https://api.desvare.app
VITE_SOCKET_URL=https://api.desvare.app
VITE_DEV_MODE=true
```

**Cómo correrlo:**
```bash
cd driver-app
npm run dev
# Abrir http://localhost:5175 en Chrome
# Activar Device Toolbar (Ctrl+Shift+M) para simular móvil
```

---

### MODO PRODUCCIÓN — APK / instalación real en dispositivo

**Activo cuando:** `driver-app/.env.local` NO existe (o `VITE_DEV_MODE` no está definida)

Todo funciona como hoy: GPS nativo, FCM, optimización de batería, todo. La app
se comporta exactamente igual que antes de estos cambios.

**Cómo volver a producción (cuando termines los ajustes visuales):**
```bash
# Opción A — Borrar el archivo .env.local (recomendado)
rm driver-app/.env.local

# Opción B — Renombrarlo para guardarlo y poder activarlo de nuevo después
mv driver-app/.env.local driver-app/.env.local.dev_backup

# Luego hacer el build normal para APK
cd driver-app
npm run build
# Y el proceso habitual de Capacitor para generar APK...
npx cap sync android
# Abrir Android Studio y generar APK desde ahí
```

> **Importante:** El archivo `.env.local` ya está en `.gitignore` (`*.local`),
> así que nunca se sube a Git ni afecta a otros desarrolladores.

---

## Qué se modificó en el código (y qué NO se tocó)

### Archivos modificados

#### `src/services/pushNotifications.js`
- **Cambio:** Se agregó un bloque `if (VITE_DEV_MODE)` al inicio de
  `initializePushNotifications()`.
- **Efecto:** En modo DEV retorna `false` inmediatamente sin intentar contactar
  FCM. Elimina errores de consola que confunden. En producción, el `if` es
  `false` y el código sigue exactamente igual que antes.

#### `src/pages/PermissionsSetup.jsx`
- **Cambio:** Se agregó un bloque `if (VITE_DEV_MODE)` en
  `handleNotificationsPermission()`.
- **Efecto:** En modo DEV el botón "Activar notificaciones" navega a Home
  directamente sin llamar a `PushNotifications.requestPermissions()` (que
  lanzaría un error en el navegador). En producción, el código es idéntico al
  original.
- **Sin cambios:** El slide de batería ya estaba protegido por `isAndroid`
  (que es `false` en el navegador), por lo que `LocationTracking` nunca se
  llama en el navegador incluso sin VITE_DEV_MODE.

### Archivos que NO se tocaron

Toda la lógica de negocio está intacta:
- `src/services/api.js` — sin cambios
- `src/services/socket.js` — sin cambios
- `src/hooks/useDriverLocation.js` — sin cambios (Geolocation tiene fallback web)
- `src/utils/camera.js` — sin cambios (ya tenía fallback web con `<input file>`)
- Todo el flujo de registro (`LoginOTP`, `VerifyOTP`, `CompleteRegistration`) — sin cambios
- `Home.jsx`, `ActiveService.jsx`, y demás páginas — sin cambios

---

## Pantallas que se pueden ajustar visualmente en modo DEV

- `/login` — Login con número de celular + PIN
- `/verify-otp` — Verificación de código OTP (el SMS llega al celular real)
- `/complete-registration` — Registro completo con fotos y datos del vehículo
- `/permissions` — Pantalla de permisos (ubicación y notificaciones)
- `/home` — Home del conductor con servicios entrantes
- `/request-detail/:id` — Detalle de solicitud de servicio
- `/quote-detail/:id` — Detalle de cotización
- `/active-service` — Servicio activo en curso
- `/profile` — Perfil del conductor
- `/under-review` — Pantalla de revisión pendiente

---

## Checklist para volver a PRODUCCIÓN

Antes de hacer `npm run build` para generar una APK o desplegar, verifica:

- [ ] `driver-app/.env.local` fue borrado o renombrado
- [ ] Correr `npm run build` sin errores
- [ ] Verificar que la APK generada usa la URL de producción correcta
- [ ] Probar en dispositivo físico o emulador que FCM llega
- [ ] Probar que el GPS en background funciona
- [ ] Probar que la optimización de batería se solicita en el primer login

---

*Última actualización: Mayo 2026 — Ajustes visuales de registro y pantallas de home/servicios.*
