# 🚀 Pasos para Actualizar a Producción en DigitalOcean

## 📋 Resumen de Cambios

Se actualizarán estas configuraciones para producción:

| Variable | Antes | Después |
|----------|-------|---------|
| `NODE_ENV` | development | **production** |
| `CLIENT_URL` | localhost | **https://desvare.app** |
| `DRIVER_URL` | localhost | **https://driver.desvare.app** |
| `ADMIN_URL` | localhost | **https://admin.desvare.app** |
| `JWT_SECRET` | genérico | **secreto único** |
| `TWILIO_DEV_MODE` | false | **false** ✅ |

---

## 🎯 Paso 1: Conectar al Servidor

```bash
ssh root@tu-servidor-digitalocean
```

O usa la consola web de DigitalOcean.

---

## 🎯 Paso 2: Ir al Directorio del Backend

```bash
cd /home/desvare/desvare-proyect/backend
```

---

## 🎯 Paso 3: Hacer Backup del .env Actual

```bash
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

Esto crea un backup con fecha, por ejemplo: `.env.backup.20260212_161500`

---

## 🎯 Paso 4: Actualizar el Código

```bash
git pull origin main
```

---

## 🎯 Paso 5: Editar el Archivo .env

```bash
nano .env
```

### Cambiar estas líneas:

#### Línea 3: NODE_ENV
**Antes:**
```env
NODE_ENV=development
```

**Después:**
```env
NODE_ENV=production
```

---

#### Línea 35: JWT_SECRET
**Antes:**
```env
JWT_SECRET=tu_secret_super_seguro_aqui_cambiar_en_produccion
```

**Después:**
```env
JWT_SECRET=desvare_production_2026_super_secret_key_change_this
```

---

#### Línea 38: CLIENT_URL
**Antes:**
```env
CLIENT_URL=http://localhost:5173,http://localhost:5175,http://localhost:5174
```

**Después:**
```env
CLIENT_URL=https://desvare.app,https://www.desvare.app
```

---

#### Línea 39: DRIVER_URL
**Antes:**
```env
DRIVER_URL=http://localhost:5174,http://localhost:8100
```

**Después:**
```env
DRIVER_URL=https://driver.desvare.app
```

---

#### Línea 40: ADMIN_URL
**Antes:**
```env
ADMIN_URL=http://localhost:5176
```

**Después:**
```env
ADMIN_URL=https://admin.desvare.app
```

---

#### Línea 31: TWILIO_DEV_MODE (verificar que esté en false)
```env
TWILIO_DEV_MODE=false
```

---

### Guardar el Archivo

1. Presiona `Ctrl + X`
2. Presiona `Y` para confirmar
3. Presiona `Enter` para guardar

---

## 🎯 Paso 6: Verificar los Cambios

```bash
cat .env | grep -E "NODE_ENV|CLIENT_URL|DRIVER_URL|ADMIN_URL|JWT_SECRET|TWILIO_DEV_MODE"
```

**Debe mostrar:**
```
NODE_ENV=production
JWT_SECRET=desvare_production_2026_super_secret_key_change_this
TWILIO_DEV_MODE=false
CLIENT_URL=https://desvare.app,https://www.desvare.app
DRIVER_URL=https://driver.desvare.app
ADMIN_URL=https://admin.desvare.app
```

---

## 🎯 Paso 7: Reiniciar el Backend

```bash
pm2 restart desvare-backend
```

**Debe mostrar:**
```
[PM2] Applying action restartProcessId on app [desvare-backend](ids: [ 0 ])
[PM2] [desvare-backend](0) ✓
```

---

## 🎯 Paso 8: Verificar los Logs

```bash
pm2 logs desvare-backend --lines 30
```

**Buscar:**

✅ **Debe aparecer:**
```
✅ Twilio Verify inicializado correctamente
   Service SID: VAb8c7c5794adc9930367857aa9501d15a
```

❌ **NO debe aparecer:**
```
🔧 MODO DESARROLLO ACTIVADO
```

---

## 🧪 Paso 9: Probar en Producción

### A. Verificar tu Número en Twilio (IMPORTANTE)

1. **Ir a:** https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. **Click en:** "Add a new Caller ID"
3. **Ingresar tu número:** `+57 XXX XXX XXXX`
4. **Verificar** con el código que te llegue por SMS

### B. Probar el Registro

1. **Ir a:** https://desvare.app
2. **Registrarse** con el número que verificaste en Twilio
3. **Esperar SMS** (debe llegar en 10-30 segundos)
4. **Ingresar el código** que recibiste
5. ✅ **Debe funcionar**

---

## 🔍 Verificar en los Logs del Servidor

Después de registrarte, verifica los logs:

```bash
pm2 logs desvare-backend --lines 20
```

**Debe mostrar:**
```
📱 Registro OTP - Datos recibidos: { name: '...', phone: '...' }
✅ OTP enviado a +57XXXXXXXXX vía Twilio Verify
   Verification SID: VE...
   Status: pending
   Channel: sms
```

---

## ⚠️ IMPORTANTE: Limitación de Twilio Trial

Tu cuenta de Twilio **sigue en modo Trial** a pesar de tener $20 de saldo.

### Esto significa:

- ✅ **Funciona:** Con números verificados en Twilio
- ❌ **NO funciona:** Con números aleatorios

### Soluciones:

**Opción 1: Para Testing (Ahora)**
- Verificar 2-3 números de prueba en Twilio
- Probar con esos números
- Máximo 10 números verificados

**Opción 2: Para Producción (Después)**
- Contactar Twilio Support: https://support.twilio.com/
- Explicar que agregaste saldo pero sigue en Trial
- Pedir que activen tu cuenta completamente
- Puede tomar 1-2 días hábiles

---

## 📊 Checklist Final

Antes de probar en producción, verifica:

- [ ] Código actualizado con `git pull`
- [ ] `NODE_ENV=production` en `.env`
- [ ] URLs de producción configuradas
- [ ] `TWILIO_DEV_MODE=false`
- [ ] Backend reiniciado con `pm2 restart`
- [ ] Logs muestran inicialización correcta
- [ ] Número verificado en Twilio
- [ ] Prueba de registro exitosa

---

## 🔄 Comandos Rápidos (Todo en Uno)

Si quieres ejecutar todo de una vez:

```bash
cd /home/desvare/desvare-proyect/backend && \
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) && \
git pull origin main && \
echo "" && \
echo "✅ Código actualizado" && \
echo "" && \
echo "Ahora edita el .env:" && \
echo "nano .env" && \
echo "" && \
echo "Cambiar:" && \
echo "  NODE_ENV=production" && \
echo "  CLIENT_URL=https://desvare.app,https://www.desvare.app" && \
echo "  DRIVER_URL=https://driver.desvare.app" && \
echo "  ADMIN_URL=https://admin.desvare.app" && \
echo "  JWT_SECRET=desvare_production_2026_super_secret_key_change_this" && \
echo "" && \
echo "Después ejecutar:" && \
echo "  pm2 restart desvare-backend" && \
echo "  pm2 logs desvare-backend --lines 30"
```

---

## 📞 Soporte

Si tienes problemas:

1. **Logs del backend:**
   ```bash
   pm2 logs desvare-backend --lines 50
   ```

2. **Estado de PM2:**
   ```bash
   pm2 status
   ```

3. **Verificar .env:**
   ```bash
   cat .env | grep -E "NODE_ENV|TWILIO"
   ```

---

**Fecha:** 12 de febrero de 2026  
**Servidor:** DigitalOcean  
**Modo:** Producción  
**Estado Twilio:** Trial (solo números verificados)
