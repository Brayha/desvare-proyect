# 🔧 Troubleshooting - Proyecto Desvare

**Última actualización:** 14 de febrero de 2026

---

## 📋 Índice de Problemas

- [Frontend (Vercel)](#frontend-vercel)
- [Backend (DigitalOcean)](#backend-digitalocean)
- [OTP / Autenticación](#otp--autenticación)
- [Tracking / Socket.IO](#tracking--socketio)
- [Base de Datos](#base-de-datos)
- [Errores Comunes](#errores-comunes)

---

## 🌐 Frontend (Vercel)

### ❌ 404 Error al refrescar página

**Síntomas:**
- La página carga correctamente al navegar desde home
- Al refrescar la página (F5) aparece 404 NOT_FOUND
- Afecta rutas como `/login`, `/profile`, `/tracking/:id`

**Causa:**
Falta configuración de SPA (Single Page Application) routing en Vercel.

**Solución:**

1. Verificar que existe `vercel.json` en la raíz del proyecto:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

2. Si el archivo no existe, créalo en:
   - `client-pwa/vercel.json`
   - `driver-app/vercel.json`
   - `admin-dashboard/vercel.json`

3. Hacer commit y push:
```bash
git add client-pwa/vercel.json
git commit -m "Fix: Add vercel.json for SPA routing"
git push origin main
```

4. Esperar deployment automático o forzar redeploy en Vercel.

---

### ❌ Build falla con "Module not found"

**Error típico:**
```
Rollup failed to resolve import "axios" from "/vercel/path0/shared/services/api.js"
```

**Causa:**
Referencias a carpeta `shared/` que ya no existe (fue eliminada durante desacoplamiento).

**Solución:**

1. Buscar imports problemáticos:
```bash
cd client-pwa  # o driver-app / admin-dashboard
grep -r "@shared" src/
grep -r "../../../shared" src/
```

2. Actualizar imports a rutas relativas locales:
```javascript
// ❌ Antes
import { api } from '@shared/services/api';
import logo from '../../../shared/img/Desvare.svg';

// ✅ Después
import { api } from '../services/api';
import logo from '../assets/img/Desvare.svg';
```

3. Verificar `vite.config.js` no tenga aliases a `shared`:
```javascript
// ❌ Quitar esto
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, '../shared/src'),
  }
}
```

4. Probar build local:
```bash
npm run build
```

---

### ❌ Build exitoso pero cambios no se reflejan

**Síntomas:**
- Build verde en Vercel
- El sitio sigue mostrando versión antigua
- Cambios no aparecen

**Solución:**

1. Verificar que el deployment correcto está en producción:
   - Ir a Vercel Dashboard → Deployments
   - Buscar el deployment con el commit hash correcto
   - Click en "Promote to Production"

2. Si el problema persiste, limpiar caché:
   - Ir a "Deployments"
   - Click en "Redeploy"
   - **Desmarcar** "Use existing build cache"

3. Forzar nuevo deployment:
```bash
git commit --allow-empty -m "Force Vercel rebuild"
git push origin main
```

---

### ❌ Variables de entorno no funcionan

**Síntomas:**
- `import.meta.env.VITE_API_URL` es `undefined`
- La app no puede conectarse al backend

**Solución:**

1. Verificar que las variables estén configuradas en Vercel:
   - Settings → Environment Variables
   - Deben tener el prefijo `VITE_`

2. Verificar que estén disponibles en todos los entornos:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

3. Después de agregar/modificar variables, hacer redeploy.

4. Verificar en el código:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

---

## 🖥️ Backend (DigitalOcean)

### ❌ Backend no responde / 502 Bad Gateway

**Síntomas:**
- Error 502 al hacer requests a `https://api.desvare.app/`
- Frontend muestra "Network Error"

**Diagnóstico:**

```bash
# Conectar al servidor
ssh root@desvare-backend

# Verificar estado de PM2
pm2 status

# Ver logs
pm2 logs desvare-backend --lines 50
```

**Soluciones según el problema:**

#### PM2 no está corriendo
```bash
pm2 start server.js --name desvare-backend
pm2 save
```

#### Backend crasheado
```bash
# Ver error en logs
pm2 logs desvare-backend --err --lines 100

# Reiniciar
pm2 restart desvare-backend
```

#### Puerto incorrecto en Nginx
```bash
# Verificar configuración
cat /etc/nginx/sites-available/desvare-api | grep proxy_pass

# Debe apuntar a puerto 5001
proxy_pass http://localhost:5001;

# Si está mal, editar:
sudo nano /etc/nginx/sites-available/desvare-api

# Reiniciar Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

### ❌ "ReferenceError: jwt is not defined"

**Error en logs:**
```
ReferenceError: jwt is not defined
at /home/desvare/desvare-proyect/backend/routes/drivers.js:152:19
```

**Causa:**
Falta import de jsonwebtoken en el archivo.

**Solución:**

```bash
# Verificar imports en el archivo problemático
nano /home/desvare/desvare-proyect/backend/routes/drivers.js
```

Agregar al inicio:
```javascript
const jwt = require('jsonwebtoken');
```

Reiniciar:
```bash
pm2 restart desvare-backend
```

---

### ❌ "SyntaxError: Unexpected token"

**Error en logs:**
```
SyntaxError: Unexpected token ')' at /home/desvare/desvare-proyect/backend/routes/requests.js:280
```

**Causa:**
Error de sintaxis en el código.

**Solución:**

1. Ver el código problemático:
```bash
sed -n '275,285p' /home/desvare/desvare-proyect/backend/routes/requests.js
```

2. Corregir el error de sintaxis (paréntesis extra, llaves mal cerradas, etc.)

3. Si el error persiste después de corregir:
```bash
# Hard reset
pm2 delete desvare-backend
cd /home/desvare/desvare-proyect/backend
git pull origin main
pm2 start server.js --name desvare-backend
pm2 save
```

---

### ❌ Cambios en .env no se aplican

**Síntomas:**
- Cambié `PORT=5001` pero sigue usando 5000
- Variables de entorno no actualizadas

**Solución:**

1. Verificar que .env esté correcto:
```bash
cat .env | grep PORT
cat .env | grep NODE_ENV
```

2. **IMPORTANTE:** Verificar que no haya variables juntas en una línea:
```bash
# ❌ MAL
NODE_ENV=production PORT=5001

# ✅ BIEN
NODE_ENV=production
PORT=5001
```

3. Reiniciar con nuevas variables:
```bash
pm2 delete desvare-backend
pm2 start server.js --name desvare-backend --update-env
pm2 save
```

4. Verificar logs:
```bash
pm2 logs desvare-backend --lines 20
```

Debe mostrar:
```
🚀 Servidor corriendo en puerto 5001
```

---

### ❌ "Port 5001 already in use"

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solución:**

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :5001

# Matar el proceso
sudo kill -9 PID

# O matar todos los procesos Node
pm2 delete all
pm2 start server.js --name desvare-backend
```

---

## 🔐 OTP / Autenticación

### ❌ OTP no llega por SMS

**Síntomas:**
- Usuario ingresa teléfono
- No recibe código SMS
- No hay error visible

**Diagnóstico:**

```bash
# Ver logs del backend
pm2 logs desvare-backend | grep -i twilio
```

**Soluciones según el problema:**

#### Credenciales Twilio incorrectas
```bash
# Verificar variables
cat .env | grep TWILIO

# Deben estar todas presentes:
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxx
```

#### Número en formato incorrecto
Los números deben tener formato internacional sin espacios:
```
❌ +57 319 257 9562
✅ +573192579562
```

#### Twilio Verify Service no configurado
Verificar en logs:
```
✅ Twilio Verify inicializado correctamente
Service SID: VAb8c7c5794adc9930367857aa9501d15a
```

Si no aparece, revisar configuración en Twilio Dashboard.

---

### ❌ "Invalid verification code"

**Síntomas:**
- OTP llega correctamente
- Al ingresar el código, da error de código inválido

**Causas comunes:**

1. **Código expirado:** Los códigos de Twilio Verify expiran en 10 minutos.

2. **Formato incorrecto:** El código debe tener 6 dígitos numéricos.

3. **Teléfono diferente:** El código se valida contra el teléfono específico que lo solicitó.

**Solución:**

Solicitar nuevo código y validar inmediatamente.

---

### ❌ "User not found" después de verificar OTP

**Síntomas:**
- OTP se verifica correctamente
- Pero el login falla con "Usuario no encontrado"

**Causa:**
El usuario no existe en la base de datos.

**Solución (Cliente PWA):**

El registro automático debe crear el usuario. Verificar logs:
```bash
pm2 logs desvare-backend | grep "Nuevo usuario registrado"
```

Si no se registra, verificar endpoint `/api/auth/verify-otp` en el backend.

**Solución (Driver App):**

Los conductores deben ser registrados manualmente desde el Admin Dashboard con estado `approved`.

---

## 🗺️ Tracking / Socket.IO

### ❌ Tracking no funciona / Ubicación no se actualiza

**Síntomas:**
- El mapa no muestra la ubicación del conductor
- La ubicación no se actualiza en tiempo real

**Diagnóstico:**

Abrir la consola del navegador:
```javascript
// En cliente PWA o Driver App
console.log('Socket connected:', socket.connected);
```

**Soluciones según el problema:**

#### Socket.IO no conecta
```bash
# Verificar logs del backend
pm2 logs desvare-backend | grep -i socket
```

Debe mostrar:
```
📡 Socket.IO listo para conexiones en tiempo real
🔌 Nuevo cliente conectado: xxxxx
```

#### CORS bloqueando Socket.IO
Verificar que las URLs estén en la whitelist del backend:
```javascript
// backend/server.js
const corsOptions = {
  origin: [
    'https://www.desvare.app',
    'https://driver.desvare.app',
    // ... más URLs
  ]
};
```

#### Geolocalización bloqueada
Verificar permisos del navegador:
- Debe estar en HTTPS (no HTTP)
- Usuario debe aceptar permisos de ubicación

---

### ❌ "Socket connection error"

**Error en consola:**
```
WebSocket connection failed: Error during WebSocket handshake
```

**Causa:**
Nginx no está configurado para WebSocket upgrade.

**Solución:**

```bash
# Verificar configuración Nginx
sudo nano /etc/nginx/sites-available/desvare-api
```

Debe tener estas líneas:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_cache_bypass $http_upgrade;
```

Reiniciar Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 💾 Base de Datos

### ❌ "MongoNetworkError: connection timed out"

**Error en logs:**
```
MongoNetworkError: connection timed out
```

**Causa:**
IP del servidor no está permitida en MongoDB Atlas.

**Solución:**

1. Ir a MongoDB Atlas → Network Access
2. Agregar IP del servidor DigitalOcean
3. O permitir todas las IPs: `0.0.0.0/0` (solo desarrollo)

---

### ❌ "Authentication failed"

**Error:**
```
MongoError: Authentication failed
```

**Causa:**
Usuario o contraseña incorrectos en connection string.

**Solución:**

```bash
# Verificar MONGODB_URI
cat .env | grep MONGODB_URI
```

El formato debe ser:
```
mongodb+srv://usuario:password@cluster.mongodb.net/desvare?retryWrites=true&w=majority
```

Si la contraseña tiene caracteres especiales, deben estar URL-encoded:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`

---

## 🔥 Errores Comunes

### "Cannot read property 'map' of undefined"

**Causa:**
Intentar mapear un array que aún no se cargó o es undefined.

**Solución:**
```javascript
// ❌ Antes
{data.map(item => ...)}

// ✅ Después
{data && data.length > 0 && data.map(item => ...)}
// o
{(data || []).map(item => ...)}
```

---

### "Maximum call stack size exceeded"

**Causa:**
Recursión infinita, generalmente en `useEffect` sin dependencias correctas.

**Solución:**
```javascript
// ❌ Causa loop infinito
useEffect(() => {
  setData([...data, newItem]);
});

// ✅ Correcto
useEffect(() => {
  setData([...data, newItem]);
}, []); // o dependencias específicas
```

---

### "CORS policy: No 'Access-Control-Allow-Origin'"

**Causa:**
El frontend intenta acceder al backend desde un origen no permitido.

**Solución:**

Agregar origen en backend:
```javascript
// backend/server.js
const corsOptions = {
  origin: [
    'https://www.desvare.app',
    'https://driver.desvare.app',
    'https://admin.desvare.app',
    'http://localhost:5173', // desarrollo
  ],
  credentials: true
};
```

---

## 📞 Últimos Recursos

Si el problema persiste:

1. **Revisar logs completos:**
```bash
# Backend
pm2 logs desvare-backend --lines 200

# Nginx
sudo tail -f /var/log/nginx/error.log
```

2. **Verificar configuración actual:**
   - `docs/CONFIGURACION_ACTUAL.md`

3. **Consultar guía de deployment:**
   - `docs/DEPLOYMENT_GUIDE.md`

4. **Git status y últimos cambios:**
```bash
git log --oneline -10
git diff HEAD~1
```

---

## 🔄 Checklist de Troubleshooting General

Cuando algo no funciona:

- [ ] Ver logs del backend (`pm2 logs`)
- [ ] Ver consola del navegador (F12)
- [ ] Verificar variables de entorno (backend y frontend)
- [ ] Verificar que el código está actualizado (`git status`)
- [ ] Probar en modo incógnito (descartar caché)
- [ ] Verificar conexión a internet / VPN
- [ ] Reiniciar servicios (PM2, Nginx)
- [ ] Verificar dominios y certificados SSL
- [ ] Comparar con última versión funcional (`git log`)
