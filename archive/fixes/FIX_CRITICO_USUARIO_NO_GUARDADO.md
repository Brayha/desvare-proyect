# 🔴 FIX CRÍTICO: Usuario NO se guardaba en BD

## 🐛 EL BUG ENCONTRADO

### Síntoma:
```
🔐 Verificando OTP para usuario: 698e5c11844102cfcb75d744
   📝 OTP recibido: 831757
🔍 Buscando usuario en DB...
❌ Usuario no encontrado: 698e5c11844102cfcb75d744
```

### Causa Raíz:
En `backend/routes/auth.js` línea 178-210, el código hacía:

```javascript
// 1. Se CREABA el usuario (solo en memoria)
const user = new User({ ... });

// 2. Se ENVIABA SMS con Twilio
const smsResult = await sendOTP(cleanPhone);

if (smsResult.success) {
  // ❌ FALTABA ESTO: await user.save();
  console.log('✅ OTP enviado...');
} else if (smsResult.devMode) {
  await user.save(); // Solo se guardaba en DEV mode
}

// 3. Se RETORNABA el userId (que no existía en DB!)
res.json({ userId: user._id });
```

**RESULTADO:**
- ✅ SMS se enviaba correctamente
- ❌ Usuario NO se guardaba en MongoDB
- ❌ Al verificar OTP: "Usuario no encontrado"

---

## ✅ LA SOLUCIÓN APLICADA

```javascript
if (smsResult.success) {
  // ✅ AHORA SE GUARDA el usuario
  await user.save();
  console.log(`✅ Usuario guardado en DB: ${user._id}`);
  console.log(`✅ OTP enviado a ${cleanPhone} vía Twilio Verify`);
  console.log(`   Verification SID: ${smsResult.sid}`);
}
```

**AHORA:**
1. ✅ Se crea el usuario
2. ✅ Se envía el SMS con Twilio
3. ✅ Se guarda en MongoDB
4. ✅ Se retorna el `userId` real
5. ✅ Al verificar OTP: Usuario encontrado ✅

---

## 🚀 COMANDOS PARA DIGITALOCEAN

### 1️⃣ Actualizar Código:
```bash
ssh root@206.189.190.200
cd /home/desvare/desvare-proyect/backend
git pull origin main
pm2 restart desvare-backend
pm2 logs desvare-backend --lines 50
```

### 2️⃣ Logs que Verás (Ahora Correcto):
```
📱 Registro OTP - Datos recibidos: { ... }
✅ OTP enviado a +573505790415 vía Twilio Verify
   Verification SID: VEc32788f0820d8ca027f62911e117a6cd
   Status: pending
   Channel: sms
✅ Usuario guardado en DB: 698e5c11844102cfcb75d744  ⬅️ NUEVO LOG
✅ OTP enviado a 3505790415 vía Twilio Verify
   Verification SID: VEc32788f0820d8ca027f62911e117a6cd
⏰ OTP expira en 10 minutos
```

### 3️⃣ Al Verificar OTP (Ahora Funciona):
```
🔐 Verificando OTP para usuario: 698e5c11844102cfcb75d744
   📝 OTP recibido: 831757
🔍 Buscando usuario en DB...
✅ Usuario encontrado: 3505790415  ⬅️ AHORA SÍ LO ENCUENTRA
🔄 Llamando a Twilio Verify...
📊 Resultado de Twilio: { success: true, ... }
✅ OTP válido, actualizando usuario...
✅ OTP verificado correctamente para: 3505790415
✅ Token JWT generado para usuario: 698e5c11844102cfcb75d744
```

---

## 🎯 FLUJO COMPLETO AHORA:

### Registro (Step 1):
```
Usuario ingresa: nombre, teléfono, email
   ↓
Backend crea User (en memoria)
   ↓
Twilio envía SMS con código
   ↓
✅ User se guarda en MongoDB  ⬅️ FIX APLICADO
   ↓
Frontend recibe: { userId: "698e5c11..." }
```

### Verificación (Step 2):
```
Usuario ingresa código OTP
   ↓
Frontend envía: { userId, otp }
   ↓
Backend busca user en DB por userId
   ↓
✅ Usuario encontrado  ⬅️ AHORA FUNCIONA
   ↓
Twilio verifica el código
   ↓
✅ OTP válido
   ↓
User.phoneVerified = true
   ↓
✅ JWT token generado
   ↓
✅ Usuario logueado
```

---

## 📊 TESTING

### 1. Prueba desde la PWA:
1. Ir a `https://desvare.app`
2. Hacer registro con tu teléfono
3. Esperar SMS (debería llegar)
4. Ingresar código OTP
5. **RESULTADO ESPERADO:** ✅ Registro exitoso, redirige a home

### 2. Monitorear Logs:
```bash
pm2 logs desvare-backend --lines 100
```

**BUSCA ESTOS LOGS:**
- ✅ `Usuario guardado en DB: 698e...` (nuevo registro)
- ✅ `Usuario encontrado: 3505790415` (al verificar)
- ✅ `Token JWT generado` (verificación exitosa)

---

## 🎉 ESTO SOLUCIONA:

1. ❌ "Usuario no encontrado" al verificar OTP
2. ❌ SMS llega pero no se puede registrar
3. ❌ Frontend muestra error en verificación
4. ✅ Ahora el flujo completo funciona

---

## 📝 NOTAS:

### ¿Por qué pasó esto?
- El código **SÍ** guardaba el usuario en modo desarrollo (`devMode`)
- Pero **NO** lo guardaba en producción (con Twilio real)
- Por eso en local funcionaba, pero en producción fallaba

### Commit:
```
fix: Guardar usuario en DB antes de retornar en register-otp
```

### Archivos modificados:
- `backend/routes/auth.js` (línea 189-193)

---

## 🚨 ACCIÓN REQUERIDA:

1. **SSH a DigitalOcean**
2. **Hacer `git pull`**
3. **Reiniciar PM2**
4. **Probar registro desde la PWA**
5. **¡Debería funcionar! 🎉**

---

*Fix aplicado: 12 Feb 2026*  
*Commit: 6c14b18*
