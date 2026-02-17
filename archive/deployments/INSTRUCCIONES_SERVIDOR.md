# 🖥️ Instrucciones para Actualizar el Servidor (DigitalOcean)

## 🎯 Objetivo

Actualizar el backend en DigitalOcean para activar el modo desarrollo OTP.

---

## 📋 Pasos Detallados

### 1. Conectar por SSH

```bash
ssh root@tu-servidor-digitalocean
```

O usa la consola de DigitalOcean desde el navegador.

---

### 2. Ir al directorio del backend

```bash
cd /home/desvare/desvare-proyect/backend
```

---

### 3. Actualizar el código desde GitHub

```bash
git pull origin main
```

**Deberías ver:**
```
remote: Counting objects: X, done.
remote: Compressing objects: 100% (X/X), done.
Updating abc1234..def5678
Fast-forward
 backend/services/sms.js | XX +++++++++++++++
 1 file changed, XX insertions(+), XX deletions(-)
```

---

### 4. Agregar variable al archivo .env

```bash
nano .env
```

**Agregar al final del archivo:**

```env
# Modo desarrollo para OTP (true = usa código fijo 123456, false = usa Twilio real)
# Activar si tienes cuenta Trial de Twilio y no quieres verificar números
# IMPORTANTE: Cambiar a 'false' en producción
TWILIO_DEV_MODE=true
```

**Guardar y salir:**
- Presiona `Ctrl + X`
- Presiona `Y` para confirmar
- Presiona `Enter` para guardar

---

### 5. Verificar que se agregó correctamente

```bash
cat .env | grep TWILIO_DEV_MODE
```

**Debe mostrar:**
```
TWILIO_DEV_MODE=true
```

---

### 6. Reiniciar el backend con PM2

```bash
pm2 restart desvare-backend
```

**Deberías ver:**
```
[PM2] Applying action restartProcessId on app [desvare-backend](ids: [ 0 ])
[PM2] [desvare-backend](0) ✓
```

---

### 7. Verificar los logs

```bash
pm2 logs desvare-backend --lines 30
```

**Buscar en los logs:**

✅ **Debe aparecer al iniciar:**
```
✅ Twilio Verify inicializado correctamente
   Service SID: VAb8c7c5794adc9930367857aa9501d15a
```

✅ **Cuando alguien se registre, debe aparecer:**
```
🔧 MODO DESARROLLO ACTIVADO: OTP fijo sin SMS real
📱 Número: 3008578866
🔑 Código OTP de desarrollo: 123456
⚠️ Este modo es solo para testing. NO usar en producción.
```

---

## 🧪 Probar que Funciona

### Desde la PWA:

1. **Abrir:** https://desvare.app
2. **Registrarse** con cualquier número: `300 123 4567`
3. **NO recibirás SMS** (es normal en modo desarrollo)
4. **Ingresar código:** `123456`
5. ✅ **Debe funcionar**

### Verificar en los logs del servidor:

```bash
pm2 logs desvare-backend --lines 20
```

**Buscar:**
```
📱 Registro OTP - Datos recibidos: { name: '...', phone: '3001234567', ... }
🔧 MODO DESARROLLO ACTIVADO: OTP fijo sin SMS real
📱 Número: 3001234567
🔑 Código OTP de desarrollo: 123456
```

---

## 🔍 Troubleshooting

### Problema: No aparece "MODO DESARROLLO ACTIVADO"

**Solución 1: Verificar variable en .env**
```bash
cat .env | grep TWILIO_DEV_MODE
```

Si no aparece nada:
```bash
echo "TWILIO_DEV_MODE=true" >> .env
pm2 restart desvare-backend
```

**Solución 2: Verificar que no hay espacios extras**
```bash
nano .env
# Asegurar que la línea sea exactamente:
# TWILIO_DEV_MODE=true
# Sin espacios antes o después del =
```

---

### Problema: Sigue mostrando error de Twilio

**Verificar que el código se actualizó:**
```bash
cd /home/desvare/desvare-proyect/backend
git log --oneline -5
```

Debe aparecer el commit:
```
abc1234 fix: Agregar modo desarrollo OTP para Twilio Trial
```

Si no aparece:
```bash
git pull origin main
pm2 restart desvare-backend
```

---

### Problema: Error "TWILIO_DEV_MODE is not defined"

**Solución:**
```bash
# Agregar la variable
echo "TWILIO_DEV_MODE=true" >> .env

# Reiniciar
pm2 restart desvare-backend

# Verificar
pm2 logs desvare-backend --lines 20
```

---

## 📊 Verificación Final

### Checklist:

- [ ] Código actualizado con `git pull`
- [ ] Variable `TWILIO_DEV_MODE=true` agregada en `.env`
- [ ] Backend reiniciado con `pm2 restart`
- [ ] Logs muestran "MODO DESARROLLO ACTIVADO"
- [ ] Registro en PWA funciona con código `123456`

---

## 🔄 Comandos Rápidos (Copiar y Pegar)

### Todo en uno:

```bash
cd /home/desvare/desvare-proyect/backend && \
git pull origin main && \
echo "" >> .env && \
echo "# Modo desarrollo para OTP" >> .env && \
echo "TWILIO_DEV_MODE=true" >> .env && \
pm2 restart desvare-backend && \
echo "" && \
echo "✅ Actualización completada" && \
echo "" && \
echo "Verificando logs..." && \
pm2 logs desvare-backend --lines 20
```

**Nota:** Este comando:
1. Va al directorio del backend
2. Actualiza el código
3. Agrega la variable al .env
4. Reinicia PM2
5. Muestra los logs

---

## ⚠️ IMPORTANTE: Antes de Producción

Cuando estés listo para producción:

### 1. Desactivar modo desarrollo

```bash
cd /home/desvare/desvare-proyect/backend
nano .env
```

Cambiar:
```env
TWILIO_DEV_MODE=false
```

### 2. Asegurar cuenta paga de Twilio

- Ir a: https://www.twilio.com/console/billing
- Agregar al menos $20 USD

### 3. Reiniciar backend

```bash
pm2 restart desvare-backend
```

### 4. Verificar logs

```bash
pm2 logs desvare-backend --lines 20
```

**Debe mostrar:**
```
✅ OTP enviado a +573008578866 vía Twilio Verify
   Verification SID: VE...
   Status: pending
   Channel: sms
```

**NO debe mostrar:**
```
🔧 MODO DESARROLLO ACTIVADO
```

---

## 📞 Comandos Útiles

### Ver logs en tiempo real:
```bash
pm2 logs desvare-backend
```

### Ver últimas 50 líneas:
```bash
pm2 logs desvare-backend --lines 50
```

### Ver solo errores:
```bash
pm2 logs desvare-backend --err
```

### Ver estado de PM2:
```bash
pm2 status
```

### Reiniciar backend:
```bash
pm2 restart desvare-backend
```

### Ver información del proceso:
```bash
pm2 info desvare-backend
```

---

## 🎉 ¡Listo!

Ahora el backend está actualizado y funcionando en modo desarrollo.

**Código OTP para testing:** `123456`

---

**Fecha:** 12 de febrero de 2026  
**Servidor:** DigitalOcean  
**Backend:** /home/desvare/desvare-proyect/backend  
**Modo:** Desarrollo (TWILIO_DEV_MODE=true)
