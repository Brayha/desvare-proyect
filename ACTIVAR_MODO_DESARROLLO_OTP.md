# 🔧 Activar/Desactivar Modo Desarrollo OTP

## 🎯 ¿Qué es el Modo Desarrollo OTP?

Es un modo especial que **evita enviar SMS reales** y usa un **código OTP fijo: `123456`** para todos los registros y logins.

### ✅ Ventajas:
- No requiere cuenta paga de Twilio
- No necesitas verificar números en Twilio
- Testing rápido sin esperar SMS
- Gratis

### ⚠️ Desventajas:
- Solo para desarrollo/testing
- NO usar en producción
- No prueba la integración real con Twilio

---

## 🚀 Activar Modo Desarrollo

### Paso 1: Editar archivo .env

Abrir `backend/.env` y cambiar:

```env
# Cambiar de false a true
TWILIO_DEV_MODE=true
```

### Paso 2: Reiniciar el backend

En tu servidor de DigitalOcean:

```bash
cd /home/desvare/desvare-proyect/backend
pm2 restart desvare-backend
```

O en local:

```bash
cd backend
npm run dev
```

### Paso 3: Verificar en los logs

Deberías ver:

```
🔧 MODO DESARROLLO ACTIVADO: OTP fijo sin SMS real
📱 Número: 3008578866
🔑 Código OTP de desarrollo: 123456
⚠️ Este modo es solo para testing. NO usar en producción.
```

---

## 🧪 Probar el Modo Desarrollo

### Registro de Usuario:

1. Abrir la PWA: https://desvare.app
2. Registrarse con **cualquier número**: `300 123 4567`
3. **NO recibirás SMS** (es normal en modo desarrollo)
4. Ingresar código: `123456`
5. ✅ Debe funcionar

### Verificación en logs:

```bash
pm2 logs desvare-backend --lines 20
```

Buscar:
```
🔧 MODO DESARROLLO: Verificando OTP para 3001234567
   Código ingresado: 123456
   Resultado: ✅ VÁLIDO
```

---

## 🔴 Desactivar Modo Desarrollo (Para Producción)

### Paso 1: Editar archivo .env

Abrir `backend/.env` y cambiar:

```env
# Cambiar de true a false
TWILIO_DEV_MODE=false
```

### Paso 2: Asegurarse de tener cuenta paga de Twilio

Si tu cuenta sigue en modo Trial, debes:

**Opción A:** Verificar números en Twilio
- https://www.twilio.com/console/phone-numbers/verified

**Opción B:** Actualizar a cuenta paga
- https://www.twilio.com/console/billing
- Agregar al menos $20 USD

### Paso 3: Reiniciar el backend

```bash
pm2 restart desvare-backend
```

### Paso 4: Verificar en los logs

Deberías ver:

```
✅ OTP enviado a +573008578866 vía Twilio Verify
   Verification SID: VE...
   Status: pending
   Channel: sms
```

---

## 📊 Comparación

| Modo | Código OTP | Envía SMS | Requiere Twilio Paga | Para Producción |
|------|------------|-----------|----------------------|-----------------|
| **Desarrollo** (`TWILIO_DEV_MODE=true`) | Fijo: `123456` | ❌ No | ❌ No | ❌ No |
| **Producción** (`TWILIO_DEV_MODE=false`) | Aleatorio | ✅ Sí | ✅ Sí | ✅ Sí |

---

## 🔍 Troubleshooting

### Problema: El código 123456 no funciona

**Solución:**
1. Verificar que `TWILIO_DEV_MODE=true` en `.env`
2. Reiniciar el backend: `pm2 restart desvare-backend`
3. Verificar logs: `pm2 logs desvare-backend --lines 20`
4. Buscar: `🔧 MODO DESARROLLO ACTIVADO`

### Problema: Sigue intentando enviar SMS real

**Solución:**
1. Verificar que guardaste el archivo `.env`
2. Verificar que no hay espacios extras: `TWILIO_DEV_MODE=true` (sin espacios)
3. Reiniciar PM2: `pm2 restart desvare-backend`

### Problema: Error "Twilio no configurado"

**Solución:**
- Esto es normal en modo desarrollo
- El sistema automáticamente usa OTP fijo
- Verificar logs para confirmar que usa código `123456`

---

## 📝 Resumen Rápido

### Para Testing Local:
```bash
# 1. Activar modo desarrollo
echo "TWILIO_DEV_MODE=true" >> backend/.env

# 2. Reiniciar backend
pm2 restart desvare-backend

# 3. Usar código fijo: 123456
```

### Para Producción:
```bash
# 1. Desactivar modo desarrollo
# Editar backend/.env y cambiar a: TWILIO_DEV_MODE=false

# 2. Asegurar cuenta paga de Twilio

# 3. Reiniciar backend
pm2 restart desvare-backend
```

---

## ⚠️ IMPORTANTE

**NUNCA dejar `TWILIO_DEV_MODE=true` en producción**

Esto permitiría que cualquiera se registre con el código `123456`, lo cual es un **riesgo de seguridad**.

Antes de hacer deploy a producción:
1. ✅ Cambiar `TWILIO_DEV_MODE=false`
2. ✅ Verificar cuenta paga de Twilio
3. ✅ Probar envío de SMS real
4. ✅ Reiniciar el backend

---

**Fecha:** 12 de febrero de 2026  
**Modo actual:** Desarrollo (`TWILIO_DEV_MODE=true`)  
**Código OTP fijo:** `123456`
