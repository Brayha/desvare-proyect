# 🚀 EJECUTAR AHORA - Configuración para Testing Driver App

## 🎯 Lo que vamos a lograr:

- ✅ PWA funciona en producción (https://desvare.app)
- ✅ Admin funciona en producción (https://admin.desvare.app)
- ✅ Driver App funciona desde tu Mac (localhost:8100) conectándose al backend de producción

---

## 📋 PASO 1: Conectar a DigitalOcean

```bash
ssh root@tu-servidor-digitalocean
```

---

## 📋 PASO 2: Copiar y Pegar Todo Este Bloque

```bash
cd /home/desvare/desvare-proyect/backend && \
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) && \
git pull origin main && \
echo "" && \
echo "✅ Código actualizado. Ahora edita el .env..."
```

---

## 📋 PASO 3: Editar el archivo .env

```bash
nano .env
```

### Cambiar ESTAS 6 líneas:

#### Línea 3:
```env
NODE_ENV=production
```

#### Línea 31:
```env
TWILIO_DEV_MODE=false
```

#### Línea 35:
```env
JWT_SECRET=desvare_production_2026_super_secret_key_change_this
```

#### Línea 38:
```env
CLIENT_URL=https://desvare.app,https://www.desvare.app
```

#### Línea 39: (IMPORTANTE - incluye localhost para Driver App)
```env
DRIVER_URL=https://driver.desvare.app,http://localhost:8100,http://localhost:5174,capacitor://localhost,ionic://localhost
```

#### Línea 40:
```env
ADMIN_URL=https://admin.desvare.app
```

### Guardar:
- `Ctrl + X`
- `Y`
- `Enter`

---

## 📋 PASO 4: Reiniciar el Backend

```bash
pm2 restart desvare-backend
```

---

## 📋 PASO 5: Verificar los Logs

```bash
pm2 logs desvare-backend --lines 30
```

### Debe mostrar:
```
✅ Twilio Verify inicializado correctamente
```

### NO debe mostrar:
```
🔧 MODO DESARROLLO ACTIVADO
```

---

## 🧪 PASO 6: Probar

### A. Verificar tu número en Twilio (PRIMERO)

1. Ir a: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click: "Add a new Caller ID"
3. Agregar tu número: `+57 XXX XXX XXXX`
4. Verificar con código SMS

### B. Probar PWA (Producción)

1. Ir a: https://desvare.app
2. Registrarse con número verificado
3. Debe llegar SMS
4. ✅ Funciona

### C. Probar Driver App (Mac)

1. En tu Mac, abrir terminal:
   ```bash
   cd /ruta/a/tu/driver-app
   ionic serve
   # o
   npm run dev
   ```

2. Abrir: http://localhost:8100

3. Intentar login/registro

4. Debe conectarse al backend de producción

5. ✅ Funciona

---

## 🔍 Verificar Configuración

```bash
cat .env | grep -E "NODE_ENV|CLIENT_URL|DRIVER_URL|ADMIN_URL|TWILIO_DEV_MODE"
```

### Debe mostrar:
```
NODE_ENV=production
TWILIO_DEV_MODE=false
CLIENT_URL=https://desvare.app,https://www.desvare.app
DRIVER_URL=https://driver.desvare.app,http://localhost:8100,http://localhost:5174,capacitor://localhost,ionic://localhost
ADMIN_URL=https://admin.desvare.app
```

---

## 📊 Estado Final

| App | URL | Estado |
|-----|-----|--------|
| **PWA** | https://desvare.app | ✅ Producción |
| **Admin** | https://admin.desvare.app | ✅ Producción |
| **Driver App** | http://localhost:8100 | ✅ Desarrollo → Producción Backend |
| **Backend** | https://api.desvare.app | ✅ Producción |

---

## ⚠️ Notas Importantes

### 1. Driver App en Localhost:
- Puede conectarse al backend de producción
- Ideal para testing rápido
- No necesitas crear APK cada vez

### 2. Cuando todo funcione:
- Crear APK con Capacitor
- Probar en dispositivo Android real
- Publicar en Play Store

### 3. Twilio Trial:
- Solo funciona con números verificados
- Verificar 2-3 números para testing
- Para producción: contactar Twilio Support

---

## 🆘 Si algo falla

### Backend no reinicia:
```bash
pm2 status
pm2 restart desvare-backend --force
```

### Ver logs completos:
```bash
pm2 logs desvare-backend --lines 100
```

### Restaurar backup:
```bash
cp .env.backup.YYYYMMDD_HHMMSS .env
pm2 restart desvare-backend
```

---

**Fecha:** 12 de febrero de 2026  
**Configuración:** Híbrida (Producción + Desarrollo)  
**Objetivo:** Testing Driver App desde Mac sin APK
