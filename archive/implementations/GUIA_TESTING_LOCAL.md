# 🧪 Guía de Testing Local - PWA y Driver App

## 📋 Setup Inicial

### ✅ Pre-requisitos:
- Backend corriendo en DigitalOcean (`https://api.desvare.app`)
- Variables de entorno correctas en ambos proyectos
- Navegador Chrome o Edge (para mejor DevTools)

---

## 🚀 PASO 1: Levantar Client PWA

### Terminal 1:

```bash
cd /Users/bgarcia/Documents/desvare-proyect/client-pwa
npm run dev
```

**Esperado:**
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Si el puerto 5173 está ocupado:**
```bash
# Matar proceso en puerto 5173
lsof -ti:5173 | xargs kill -9

# O usar otro puerto
vite --port 5175
```

---

## 🚀 PASO 2: Levantar Driver App

### Terminal 2:

```bash
cd /Users/bgarcia/Documents/desvare-proyect/driver-app
npm run dev
```

**Esperado:**
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

---

## 🧪 PASO 3: Configurar Navegadores

### Navegador 1 - Client PWA:

1. Abre Chrome
2. Ve a: `http://localhost:5173`
3. Abre DevTools (Cmd+Shift+I o F12)
4. **Toggle Device Toolbar** (Cmd+Shift+M)
5. Selecciona **"iPhone 12 Pro"** o **"Pixel 5"**

### Navegador 2 - Driver App:

1. Abre otra ventana de Chrome (o modo incógnito)
2. Ve a: `http://localhost:5174`
3. Abre DevTools (Cmd+Shift+I o F12)
4. **Toggle Device Toolbar** (Cmd+Shift+M)
5. Selecciona **"iPhone 12 Pro"** o **"Pixel 5"**

---

## 🔬 PASO 4: Testing del Flujo Completo

### 4.1 Login Cliente (Navegador 1)

1. En Client PWA: Click **"Iniciar Sesión"**
2. Ingresa teléfono: `3001234567`
3. Recibirás OTP en los logs del backend
4. Ingresa el OTP y confirma

**Verificar en DevTools Console:**
```javascript
// Debería mostrar:
✅ Usuario autenticado
```

---

### 4.2 Login Conductor (Navegador 2)

1. En Driver App: Click **"Ya tienes cuenta? Ingresa aquí"**
2. Ingresa teléfono: `3100000000` (Driver Test)
3. El backend generará OTP (ver logs de DigitalOcean)
4. Ingresa el OTP

**Para ver el OTP en DigitalOcean:**
```bash
pm2 logs desvare-backend --lines 10
```

**Busca:**
```
✅ OTP generado para login de conductor 3100000000: 123456
```

---

### 4.3 Pedir Servicio (Navegador 1 - Cliente)

1. En Client PWA: Ve a **"Home"**
2. Click **"Pedir Servicio"**
3. Completa el formulario:
   - **Origen:** Calle 72 #10-15, Bogotá
   - **Destino:** Calle 100 #15-20, Bogotá
   - **Tipo de vehículo:** Auto
   - **Descripción:** "Problema con batería"
4. Click **"Solicitar Grúa"**

**Verificar en DevTools Console:**
```javascript
✅ Solicitud creada exitosamente
🔌 Socket.IO: Solicitud emitida a conductores
```

---

### 4.4 Cotizar Servicio (Navegador 2 - Conductor)

1. En Driver App: Deberías ver la solicitud aparecer automáticamente
2. Click en la solicitud
3. Click **"Enviar Cotización"**
4. Ingresa monto: `150000`
5. Click **"Enviar"**

**Verificar en DevTools Console:**
```javascript
✅ Cotización enviada
🔌 Socket.IO: Cotización emitida al cliente
```

**En Navegador 1 (Cliente):** Deberías ver aparecer la cotización automáticamente

---

### 4.5 Aceptar Cotización (Navegador 1 - Cliente) ⚠️ PUNTO CRÍTICO

1. En Client PWA: Deberías ver la cotización de "Driver Test" por $150,000
2. Click **"Aceptar"**
3. Confirma en el modal

**⚠️ AQUÍ ES DONDE ESTABA FALLANDO**

**Verificar en DevTools Console:**

✅ **Si funciona:**
```javascript
✅ Cotización aceptada exitosamente
🔌 Socket.IO: Confirmación enviada al conductor
POST https://api.desvare.app/api/requests/{id}/accept 200 OK
```

❌ **Si falla:**
```javascript
❌ Error al aceptar cotización
POST https://localhost/api/requests/{id}/accept net::ERR_CONNECTION_REFUSED
```

**Verificar en Network Tab:**
1. Ve a **"Network"** en DevTools
2. Busca la petición `accept`
3. Verifica que la URL sea: `https://api.desvare.app` ✅
4. **NO debe ser:** `https://localhost` ❌

---

## 🔍 Debugging Tips

### Verificar API URL en Consola:

```javascript
// En cualquier navegador, ejecuta en Console:
console.log(import.meta.env.VITE_API_URL)

// Esperado: https://api.desvare.app
// Si es undefined o localhost: ❌ Problema con variables
```

### Verificar Socket.IO Connection:

```javascript
// En Console:
console.log('Socket connected:', socket.connected)

// Esperado: Socket connected: true
```

### Ver Logs del Backend en Tiempo Real:

```bash
# En otra terminal:
ssh root@api.desvare.app
cd /home/desvare/desvare-proyect/backend
pm2 logs --lines 50
```

---

## 📊 Checklist de Verificación

### Antes de Empezar:
- [ ] Backend corriendo en DigitalOcean
- [ ] `pm2 list` muestra `desvare-backend` online
- [ ] Variables `.env` correctas en ambos proyectos

### Durante Testing:
- [ ] Client PWA carga en localhost:5173
- [ ] Driver App carga en localhost:5174
- [ ] DevTools en modo móvil en ambos
- [ ] Login funciona en ambas apps
- [ ] Socket.IO conectado en ambas apps

### Testing de Aceptación:
- [ ] Cliente puede pedir servicio
- [ ] Conductor recibe solicitud automáticamente
- [ ] Conductor puede cotizar
- [ ] Cliente recibe cotización automáticamente
- [ ] **Cliente puede aceptar cotización** ← CRÍTICO
- [ ] Conductor recibe confirmación automáticamente
- [ ] Estados se sincronizan correctamente

---

## 🚨 Troubleshooting

### Problema: "Port already in use"

```bash
# Matar proceso en puerto 5173
lsof -ti:5173 | xargs kill -9

# Matar proceso en puerto 5174
lsof -ti:5174 | xargs kill -9
```

### Problema: "Cannot connect to backend"

Verifica:
1. Backend está corriendo: `curl https://api.desvare.app/api/health`
2. Variables `.env` correctas
3. No hay firewall bloqueando

### Problema: "Socket.IO not connecting"

Verifica en Console:
```javascript
// Debería mostrar:
Socket.IO connection established
```

Si no conecta:
1. Verifica que el backend esté corriendo
2. Verifica CORS en el backend
3. Revisa logs del backend

---

## ✅ Resultado Esperado

Después de este testing, deberías poder:

1. ✅ Hacer login como cliente y conductor
2. ✅ Pedir servicio desde la PWA
3. ✅ Cotizar desde la Driver App
4. ✅ **Aceptar cotización desde la PWA** (esto era lo que fallaba)
5. ✅ Ver estados sincronizados en tiempo real

---

## 📞 Siguiente Paso

Una vez que todo funcione localmente:

1. ✅ Confirmar que el problema está en Vercel (no en el código)
2. ✅ Hacer redeploy correcto en Vercel
3. ✅ Limpiar caché del navegador
4. ✅ Probar en producción

---

**Fecha:** 06/02/2026  
**Última actualización:** Setup de testing local
