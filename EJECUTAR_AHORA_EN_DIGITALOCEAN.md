# 🚀 EJECUTAR AHORA EN DIGITALOCEAN

## ✅ Cambios Locales Completados

- ✅ Configuración de producción actualizada
- ✅ Commit creado
- ✅ Push a GitHub exitoso

---

## 📋 AHORA: Comandos para DigitalOcean

### 1. Conectar al Servidor

```bash
ssh root@tu-servidor-digitalocean
```

---

### 2. Copiar y Pegar Este Bloque Completo

```bash
# Ir al backend
cd /home/desvare/desvare-proyect/backend

# Backup del .env actual
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Actualizar código
git pull origin main

# Mostrar instrucciones
echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Código actualizado"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "AHORA edita el archivo .env:"
echo ""
echo "  nano .env"
echo ""
echo "Cambiar estas líneas:"
echo ""
echo "  Línea 3:  NODE_ENV=production"
echo "  Línea 35: JWT_SECRET=desvare_production_2026_super_secret_key_change_this"
echo "  Línea 38: CLIENT_URL=https://desvare.app,https://www.desvare.app"
echo "  Línea 39: DRIVER_URL=https://driver.desvare.app"
echo "  Línea 40: ADMIN_URL=https://admin.desvare.app"
echo "  Línea 31: TWILIO_DEV_MODE=false"
echo ""
echo "Guardar: Ctrl+X, Y, Enter"
echo ""
echo "Después ejecutar:"
echo "  pm2 restart desvare-backend"
echo "  pm2 logs desvare-backend --lines 30"
echo ""
```

---

### 3. Editar el Archivo .env

```bash
nano .env
```

**Cambiar estas 6 líneas:**

```env
NODE_ENV=production
JWT_SECRET=desvare_production_2026_super_secret_key_change_this
TWILIO_DEV_MODE=false
CLIENT_URL=https://desvare.app,https://www.desvare.app
DRIVER_URL=https://driver.desvare.app
ADMIN_URL=https://admin.desvare.app
```

**Guardar:** `Ctrl+X`, `Y`, `Enter`

---

### 4. Reiniciar el Backend

```bash
pm2 restart desvare-backend
```

---

### 5. Verificar los Logs

```bash
pm2 logs desvare-backend --lines 30
```

**Buscar:**
```
✅ Twilio Verify inicializado correctamente
```

**NO debe aparecer:**
```
🔧 MODO DESARROLLO ACTIVADO
```

---

## 🧪 Probar en Producción

### A. Verificar tu Número en Twilio

1. **Ir a:** https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. **Click:** "Add a new Caller ID"
3. **Agregar:** Tu número `+57 XXX XXX XXXX`
4. **Verificar** con el código SMS

### B. Probar el Registro

1. **Ir a:** https://desvare.app
2. **Registrarse** con el número verificado
3. **Esperar SMS** (10-30 segundos)
4. **Ingresar código**
5. ✅ **Debe funcionar**

---

## 📊 Verificación Final

### En los logs del servidor:

```bash
pm2 logs desvare-backend --lines 20
```

**Debe mostrar:**
```
📱 Registro OTP - Datos recibidos: { ... }
✅ OTP enviado a +57XXXXXXXXX vía Twilio Verify
   Verification SID: VE...
   Status: pending
   Channel: sms
```

---

## ⚠️ IMPORTANTE

Tu cuenta de Twilio **sigue en Trial**. Solo funciona con números verificados.

**Para testing:** Verifica 2-3 números en Twilio  
**Para producción:** Contacta Twilio Support

---

## 🆘 Si algo falla

### Ver logs completos:
```bash
pm2 logs desvare-backend --lines 50
```

### Verificar configuración:
```bash
cat .env | grep -E "NODE_ENV|TWILIO|CLIENT_URL"
```

### Restaurar backup:
```bash
cp .env.backup.YYYYMMDD_HHMMSS .env
pm2 restart desvare-backend
```

---

**Fecha:** 12 de febrero de 2026  
**Estado:** ✅ Listo para ejecutar  
**Próximo paso:** Conectar a DigitalOcean y ejecutar comandos
