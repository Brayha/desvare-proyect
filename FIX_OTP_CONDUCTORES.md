# 🔧 Fix: OTP por SMS para Conductores

## 🎯 Problema Identificado

Los conductores **NO recibían SMS** al registrarse, solo se generaba un OTP local en el backend que no se enviaba.

### Síntoma:
```
Driver App: Registro → ❌ No llega SMS
PWA: Login → ✅ Sí llega SMS
```

### Causa:
El registro de conductores (`/api/drivers/register-initial`) usaba **OTP local** en lugar de **Twilio Verify**.

---

## ✅ Solución Implementada

Actualizado `backend/routes/drivers.js` para usar **Twilio Verify** igual que el login de clientes.

### Cambios:

1. **Agregado import de Twilio:**
   ```javascript
   const { sendOTP, verifyOTP } = require('../services/sms');
   ```

2. **Reemplazado OTP local por Twilio Verify:**
   ```javascript
   // ANTES
   const otpCode = driver.generateOTP();
   await driver.save();
   console.log(`✅ Conductor registrado - OTP para ${cleanPhone}: ${otpCode}`);
   
   // DESPUÉS
   const smsResult = await sendOTP(cleanPhone);
   if (smsResult.success) {
     console.log(`✅ OTP enviado a ${cleanPhone} vía Twilio Verify`);
   }
   ```

---

## 🚀 Desplegar en Producción

### Comando Rápido (Copia y Pega):

```bash
cd /home/desvare/desvare-proyect/backend && git pull origin main && pm2 restart desvare-backend && pm2 logs desvare-backend --lines 10
```

### Paso a Paso:

1. **SSH o Consola de DigitalOcean**

2. **Ir al backend:**
   ```bash
   cd /home/desvare/desvare-proyect/backend
   ```

3. **Actualizar código:**
   ```bash
   git pull origin main
   ```

4. **Reiniciar PM2:**
   ```bash
   pm2 restart desvare-backend
   ```

5. **Verificar logs:**
   ```bash
   pm2 logs desvare-backend --lines 20
   ```

---

## 🧪 Probar el Fix

### Prueba 1: Registro de Conductor (Debe llegar SMS)

1. Abrir Driver App: http://localhost:5175/ (o https://driver.desvare.app)
2. Registrarse con un número nuevo: `+57 300 888 7777`
3. ✅ **Debe llegar SMS** con el código OTP
4. Verificar el código
5. ✅ Debe funcionar

### Prueba 2: Verificar logs del backend

Después de registrarse, los logs deben mostrar:

```
✅ OTP enviado a 3008887777 vía Twilio Verify
   Verification SID: VE...
   Status: pending
   Channel: sms
```

**NO debe mostrar:**
```
✅ Conductor registrado - OTP para 3008887777: 123456  ❌ (OTP local)
```

---

## 📊 Resultado Esperado

### ANTES del Fix:
```
Driver App Registro → OTP local → ❌ No llega SMS
PWA Login → Twilio Verify → ✅ Llega SMS
```

### DESPUÉS del Fix:
```
Driver App Registro → Twilio Verify → ✅ Llega SMS
PWA Login → Twilio Verify → ✅ Llega SMS
```

---

## 🔍 Verificación en Logs

### Logs correctos (después del fix):

```
📱 Registro inicial conductor - Datos recibidos: { name: '...', phone: '...' }
✅ OTP enviado a +57... vía Twilio Verify
   Verification SID: VE...
   Status: pending
   Channel: sms
⏰ OTP expira en 10 minutos
```

### Logs incorrectos (antes del fix):

```
📱 Registro inicial conductor - Datos recibidos: { name: '...', phone: '...' }
✅ Conductor registrado - OTP para ...: 123456  ❌ (OTP local, no se envía)
⏰ OTP expira en 10 minutos
```

---

## 📝 Archivos Modificados

- `backend/routes/drivers.js` (líneas 15, 81-108)

---

## 🎯 Resumen

- **Problema:** Conductores no recibían SMS al registrarse
- **Causa:** Usaba OTP local en lugar de Twilio Verify
- **Solución:** Actualizado para usar Twilio Verify
- **Resultado:** Ahora los conductores reciben SMS real
- **Commit:** `209130f` - fix: Usar Twilio Verify para OTP en registro de conductores

---

**Fecha:** 12 de febrero de 2026  
**Tiempo de despliegue:** 2 minutos  
**Riesgo:** Bajo (solo mejora funcionalidad existente)
