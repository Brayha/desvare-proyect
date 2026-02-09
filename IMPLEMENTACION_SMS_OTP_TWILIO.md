# 🚀 IMPLEMENTACIÓN SMS OTP CON TWILIO

**Fecha:** 9 de febrero de 2026  
**Estado:** ✅ Código implementado - Pendiente credenciales

---

## 📋 RESUMEN

Se implementó el envío de códigos OTP por SMS usando Twilio para autenticación de usuarios (clientes y conductores) en la plataforma Desvare.

---

## ✅ CAMBIOS IMPLEMENTADOS

### 1. Backend - Nuevo Servicio SMS

**📁 `backend/services/sms.js`** (nuevo archivo)

Funciones principales:
- `sendOTP(phoneNumber, otpCode)` - Envía código de verificación por SMS
- `sendQuoteNotification(phoneNumber, driverName, amount)` - Notificación de cotización (fallback iOS)

Características:
- ✅ Inicialización automática de Twilio
- ✅ Validación de variables de entorno
- ✅ Manejo de errores robusto
- ✅ Logging detallado
- ✅ Formato automático de números colombianos (+57)
- ✅ Mensajes personalizados

---

### 2. Backend - Integración con Autenticación

**📁 `backend/routes/auth.js`**

Modificaciones:
- Importación del servicio SMS
- Integración en `POST /register-otp`
- Integración en `POST /login-otp`
- Logs informativos de resultado

```javascript
const { sendOTP } = require('../services/sms');

// En register-otp y login-otp:
const smsResult = await sendOTP(cleanPhone, otpCode);
if (smsResult.success) {
  console.log(`✅ SMS enviado - SID: ${smsResult.sid}`);
} else {
  console.log(`📱 OTP de respaldo: ${otpCode}`);
}
```

---

### 3. Backend - Generación de OTP Aleatorio

**📁 `backend/models/User.js`**

Cambio en `generateOTP()`:

```javascript
// ANTES:
code: '0000'  // Fijo para testing

// AHORA:
code: Math.floor(100000 + Math.random() * 900000).toString()  // 6 dígitos aleatorios
```

---

### 4. Backend - Variables de Entorno

**📁 `backend/.env`**

Nuevas variables agregadas:

```bash
# Twilio SMS (para OTP)
TWILIO_ACCOUNT_SID=AC76c4d35ca07b7e6b5367866898af95
TWILIO_AUTH_TOKEN=TU_AUTH_TOKEN_AQUI
TWILIO_PHONE_NUMBER=TU_NUMERO_TWILIO_AQUI
```

---

## 🔧 CONFIGURACIÓN PENDIENTE EN TWILIO

### Paso 1: Obtener Auth Token

1. Ve a tu dashboard de Twilio (donde estás ahora)
2. En "Account Info", click en **"Show"** en el Auth Token
3. Copia el token completo
4. Reemplaza `TU_AUTH_TOKEN_AQUI` en `.env`

### Paso 2: Comprar Número de Teléfono

1. Ve a: **Phone Numbers** → **Buy a number**
2. O directo: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
3. Selecciona:
   - **Country:** Colombia (+57)
   - **Capabilities:** SMS (debe tener ✓)
4. Click **"Search"**
5. Compra un número (~$1.50/mes)
6. Copia el número (ej: `+573001234567`)
7. Reemplaza `TU_NUMERO_TWILIO_AQUI` en `.env`

---

## 🧪 TESTING LOCAL

### 1. Configurar Variables

```bash
# Backend local
cd backend
nano .env

# Actualizar:
TWILIO_AUTH_TOKEN=tu_token_real
TWILIO_PHONE_NUMBER=+57XXXXXXXXXX
```

### 2. Reiniciar Backend

```bash
npm run dev
```

### 3. Probar Registro

```bash
# Desde PWA (http://localhost:5173)
# 1. Ir a /register
# 2. Ingresar tu número real
# 3. Verificar que llegue SMS
# 4. Ingresar código recibido
```

### 4. Verificar Logs

```bash
# En terminal del backend deberías ver:
✅ Twilio inicializado correctamente
✅ SMS enviado a +57XXXXXXXXXX - SID: SM...
   Message SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Status: sent
```

---

## 🌐 DESPLIEGUE A PRODUCCIÓN

### 1. Actualizar .env en DigitalOcean

```bash
ssh root@desvare.app
cd /root/desvare-proyect/backend
nano .env

# Agregar las 3 variables de Twilio:
TWILIO_ACCOUNT_SID=AC76c4d35ca07b7e6b5367866898af95
TWILIO_AUTH_TOKEN=tu_token_aqui
TWILIO_PHONE_NUMBER=+57XXXXXXXXXX

# Guardar: Ctrl+O, Enter, Ctrl+X
```

### 2. Subir Código

```bash
# En tu Mac:
cd ~/Documents/desvare-proyect
git add .
git commit -m "feat: implementar SMS OTP con Twilio"
git push origin main
```

### 3. Pull y Reiniciar en Servidor

```bash
# En DigitalOcean:
cd /root/desvare-proyect/backend
git pull origin main
npm install  # Instalar twilio
pm2 restart backend
pm2 logs backend --lines 50
```

---

## 📱 FLUJO DE USUARIO

### Cliente/Conductor - Registro

1. Usuario abre PWA/App
2. Ingresa su número: `3001234567` o `+573001234567`
3. Backend:
   - Genera OTP de 6 dígitos
   - Llama a `sendOTP()`
   - Twilio envía SMS
4. Usuario recibe SMS: "Tu código de verificación de Desvare es: 123456. Válido por 10 minutos."
5. Usuario ingresa código en la app
6. Backend valida y autentica

### Cliente/Conductor - Login

1. Usuario ingresa número registrado
2. Backend genera nuevo OTP
3. Envía SMS con nuevo código
4. Usuario ingresa código
5. Login exitoso

---

## 📊 FORMATO DE MENSAJES SMS

### OTP (Autenticación)
```
Tu código de verificación de Desvare es: 123456. Válido por 10 minutos.
```

### Notificación de Cotización (Fallback iOS)
```
💰 Nueva cotización de Juan Pérez: $150,000. Ingresa a Desvare para ver detalles.
```

---

## 🔍 TROUBLESHOOTING

### Error: "Twilio no configurado"

**Causa:** Variables de entorno faltantes

**Solución:**
```bash
# Verificar que .env tenga:
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+57xxx
```

### Error: "Permission denied" al enviar SMS

**Causa:** Cuenta de Twilio en trial mode solo puede enviar a números verificados

**Solución:**
1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Agrega y verifica tu número de prueba
3. O actualiza tu cuenta a "paid" ($20 inicial)

### Error: "Invalid 'To' phone number"

**Causa:** Formato de número incorrecto

**Solución:** El servicio automáticamente agrega `+57` si falta, pero asegúrate que sea un número colombiano válido

---

## 💰 COSTOS TWILIO (Colombia)

- **Número de teléfono:** ~$1.50 USD/mes
- **SMS enviado:** ~$0.04 USD/SMS
- **SMS recibido:** ~$0.01 USD/SMS (si implementas respuestas)

**Ejemplo:**
- 100 usuarios registrándose: 100 SMS × $0.04 = $4 USD
- 50 logins/día: 1,500 SMS/mes × $0.04 = $60 USD/mes

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Instalar paquete `twilio` en backend
- [x] Crear servicio `backend/services/sms.js`
- [x] Integrar `sendOTP()` en `auth.js`
- [x] Cambiar OTP de fijo a aleatorio
- [x] Agregar variables en `.env` local
- [ ] Obtener Auth Token de Twilio
- [ ] Comprar número de teléfono colombiano
- [ ] Actualizar `.env` con credenciales reales
- [ ] Probar en local con tu número
- [ ] Subir cambios a git
- [ ] Desplegar a producción
- [ ] Configurar `.env` en DigitalOcean
- [ ] Probar en producción

---

## 📖 DOCUMENTACIÓN RELACIONADA

- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- [Verificar números en Trial](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account)

---

## 🆘 SOPORTE

Si tienes problemas:

1. Revisa logs del backend: `pm2 logs backend`
2. Verifica status en Twilio Console: https://console.twilio.com/us1/monitor/logs/sms
3. Consulta la documentación de Twilio
4. Contacta soporte de Twilio (tienen buen soporte en español)

---

**Siguiente paso:** Obtén tu Auth Token y compra un número de teléfono para comenzar a probar. 🚀
