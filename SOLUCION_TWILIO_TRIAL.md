# 🔧 Solución: Error OTP Twilio Trial Account

## 🎯 Problema Identificado

```
❌ Error enviando OTP con Twilio Verify: The phone number is unverified. 
Trial accounts cannot send messages to unverified numbers; 
verify it at twilio.com/user/account/phone-numbers/verified
Error code: 21608
```

### Causa:
Tu cuenta de Twilio está en **modo Trial (prueba)**, lo que significa que **solo puede enviar SMS a números de teléfono que hayas verificado previamente** en tu consola de Twilio.

### Números afectados en los logs:
- `3505790415`
- `3008578866`

---

## 📋 Soluciones Disponibles

### **Solución 1: Verificar Números en Twilio (Rápida - Para Testing)** ⭐ RECOMENDADA PARA AHORA

Esta es la solución más rápida si estás en fase de pruebas:

#### Pasos:

1. **Ir a la consola de Twilio:**
   ```
   https://www.twilio.com/console/phone-numbers/verified
   ```

2. **Iniciar sesión con tu cuenta de Twilio**

3. **Agregar un número de prueba:**
   - Click en "**+ Add a new number**" o "**Verify a number**"
   - Ingresa el número con formato internacional: `+573008578866`
   - Click en "**Verify**"

4. **Verificar el número:**
   - Twilio te enviará un código de verificación por SMS
   - Ingresa el código que recibiste
   - El número quedará verificado

5. **Repetir para cada número que quieras probar**
   - Puedes verificar hasta **10 números** en una cuenta Trial

#### Ventajas:
- ✅ Solución inmediata (5 minutos)
- ✅ No requiere pago
- ✅ Puedes verificar hasta 10 números
- ✅ Perfecto para testing y desarrollo

#### Desventajas:
- ❌ Solo funciona con números específicos que verifiques
- ❌ No sirve para producción con usuarios reales
- ❌ Cada tester necesita tener su número verificado

---

### **Solución 2: Actualizar a Cuenta Paga (Para Producción)** 🚀

Para permitir que **cualquier usuario** se registre sin restricciones:

#### Pasos:

1. **Ir a la sección de facturación:**
   ```
   https://www.twilio.com/console/billing
   ```

2. **Agregar saldo a tu cuenta:**
   - Click en "**Add funds**" o "**Upgrade account**"
   - Agregar al menos **$20 USD** (recomendado)
   - Ingresar método de pago (tarjeta de crédito)

3. **Confirmar la actualización:**
   - Tu cuenta automáticamente se actualizará de Trial a cuenta activa
   - Las restricciones de números verificados se eliminarán

#### Costos aproximados:
- **SMS en Colombia:** ~$0.045 USD por mensaje
- **Con $20 USD:** ~440 mensajes SMS
- **Con $50 USD:** ~1,100 mensajes SMS

#### Ventajas:
- ✅ Funciona con **cualquier número de teléfono**
- ✅ Listo para producción
- ✅ Sin restricciones de números verificados
- ✅ Escalable

#### Desventajas:
- ❌ Requiere inversión inicial (~$20 USD)
- ❌ Costos por uso (pay-as-you-go)

---

### **Solución 3: Modo de Desarrollo con OTP Fijo (Solo Testing Local)** 🔧

Crear un bypass temporal que use un código OTP fijo para desarrollo:

#### Implementación:

Modificar `backend/services/sms.js` para agregar un modo de desarrollo:

```javascript
/**
 * Envía código OTP usando Twilio Verify API
 * En modo desarrollo, usa OTP fijo sin enviar SMS real
 */
const sendOTP = async (phoneNumber) => {
  // 🔧 MODO DESARROLLO: Usar OTP fijo
  const DEV_MODE = process.env.NODE_ENV === 'development' || process.env.TWILIO_DEV_MODE === 'true';
  
  if (DEV_MODE) {
    console.log('🔧 MODO DESARROLLO: OTP fijo activado');
    console.log(`📱 Número: ${phoneNumber}`);
    console.log(`🔑 Código OTP de desarrollo: 123456`);
    return { 
      success: true, 
      devMode: true,
      message: 'OTP de desarrollo: 123456'
    };
  }

  // Código normal de Twilio...
  const client = twilioClient || initializeTwilio();
  // ... resto del código
};

/**
 * Verifica código OTP
 * En modo desarrollo, acepta código fijo '123456'
 */
const verifyOTP = async (phoneNumber, code) => {
  // 🔧 MODO DESARROLLO: Aceptar OTP fijo
  const DEV_MODE = process.env.NODE_ENV === 'development' || process.env.TWILIO_DEV_MODE === 'true';
  
  if (DEV_MODE) {
    const isValid = code === '123456';
    console.log(`🔧 MODO DESARROLLO: Verificando OTP ${code} - ${isValid ? '✅ Válido' : '❌ Inválido'}`);
    return { 
      success: isValid,
      devMode: true,
      message: isValid ? 'OTP correcto' : 'OTP incorrecto (usa 123456)'
    };
  }

  // Código normal de Twilio...
  const client = twilioClient || initializeTwilio();
  // ... resto del código
};
```

#### Agregar variable de entorno:

En `backend/.env`:
```env
# Modo desarrollo para OTP (true = usa código fijo 123456, false = usa Twilio)
TWILIO_DEV_MODE=true
```

#### Ventajas:
- ✅ No requiere cuenta de Twilio activa
- ✅ Testing rápido sin SMS reales
- ✅ Código OTP fijo conocido: `123456`
- ✅ Gratis

#### Desventajas:
- ❌ Solo para desarrollo local
- ❌ NO usar en producción
- ❌ No prueba la integración real con Twilio

---

## 🎯 Recomendación

### Para AHORA (Testing inmediato):
**Usar Solución 1: Verificar números en Twilio**
- Toma 5 minutos
- Gratis
- Puedes probar con 10 números diferentes

### Para PRODUCCIÓN (Lanzamiento):
**Usar Solución 2: Actualizar a cuenta paga**
- Inversión inicial: $20 USD
- Permite registros de usuarios reales
- Sin restricciones

### Para DESARROLLO LOCAL:
**Usar Solución 3: Modo desarrollo con OTP fijo**
- No requiere SMS reales
- Testing rápido
- Código fijo: `123456`

---

## 🚀 Pasos Inmediatos Recomendados

### Opción A: Verificar tu número ahora (5 minutos)

1. Ir a: https://www.twilio.com/console/phone-numbers/verified
2. Click en "Add a new number"
3. Ingresar: `+573008578866` (tu número de prueba)
4. Verificar con el código que te llegue por SMS
5. ¡Listo! Ya puedes registrarte en la PWA con ese número

### Opción B: Activar modo desarrollo (10 minutos)

1. Modificar `backend/services/sms.js` con el código de la Solución 3
2. Agregar `TWILIO_DEV_MODE=true` en `backend/.env`
3. Reiniciar el backend: `pm2 restart desvare-backend`
4. Usar código OTP fijo: `123456` para cualquier registro

---

## 📊 Comparación de Soluciones

| Solución | Tiempo | Costo | Para Testing | Para Producción |
|----------|--------|-------|--------------|-----------------|
| 1. Verificar números | 5 min | Gratis | ✅ Sí (10 números) | ❌ No |
| 2. Cuenta paga | 10 min | $20 USD | ✅ Sí | ✅ Sí |
| 3. Modo desarrollo | 10 min | Gratis | ✅ Sí (local) | ❌ No |

---

## 🔍 Verificar que funciona

Después de aplicar cualquier solución, probar:

1. **Abrir la PWA:** https://desvare.app
2. **Registrarse con el número:**
   - Si usaste Solución 1: Usar el número verificado
   - Si usaste Solución 2: Usar cualquier número
   - Si usaste Solución 3: Usar cualquier número y código `123456`
3. **Verificar logs del backend:**
   ```bash
   pm2 logs desvare-backend --lines 20
   ```
4. **Buscar:**
   - ✅ `OTP enviado a +57... vía Twilio Verify` (Soluciones 1 y 2)
   - ✅ `MODO DESARROLLO: OTP fijo activado` (Solución 3)

---

## 📝 Resumen

- **Problema:** Cuenta Trial de Twilio solo envía SMS a números verificados
- **Error:** `21608 - The phone number is unverified`
- **Solución rápida:** Verificar números en consola de Twilio (5 min, gratis)
- **Solución producción:** Actualizar a cuenta paga ($20 USD)
- **Solución desarrollo:** Modo OTP fijo con código `123456`

---

**Fecha:** 12 de febrero de 2026  
**Estado:** Pendiente de aplicar solución  
**Prioridad:** Alta (bloquea registros de usuarios)
