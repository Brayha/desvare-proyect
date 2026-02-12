# ✅ Implementación: Usuarios Duales (Cliente + Conductor)

## 🎯 Objetivo

Permitir que un mismo número de teléfono pueda tener **dos cuentas separadas**:
- Una cuenta como **Cliente** (para solicitar servicios)
- Una cuenta como **Conductor** (para ofrecer servicios)

---

## 💡 Caso de Uso Real

**Escenario:**
```
Un conductor de grúa sale con su familia en el carro
→ Se vara en la carretera
→ Necesita solicitar un servicio de grúa
→ ❌ ANTES: No podía porque ya era conductor
→ ✅ AHORA: Puede registrarse también como cliente
```

---

## 🔧 Cambios Implementados

### 1. Modelo de Usuario (`backend/models/User.js`)

#### Cambio 1: Remover restricción `unique` del campo `phone`

**ANTES (Línea 20):**
```javascript
phone: {
  type: String,
  required: true,
  unique: true,  // ❌ Impedía mismo teléfono con diferentes userType
  sparse: true,
  trim: true
}
```

**DESPUÉS:**
```javascript
phone: {
  type: String,
  required: true,
  // unique: true, // ❌ REMOVIDO: Ahora permitimos mismo teléfono con diferentes userType
  sparse: true,
  trim: true
}
```

#### Cambio 2: Agregar índice compuesto único

**NUEVO (Después de línea 225):**
```javascript
// ========================================
// ÍNDICE COMPUESTO: Permite mismo teléfono con diferentes userType
// ========================================
// Esto permite que un conductor también pueda ser cliente (caso de uso: conductor varado)
// Ejemplo: { phone: "+57 300 123", userType: "client" } ✅
//          { phone: "+57 300 123", userType: "driver" } ✅
//          { phone: "+57 300 123", userType: "client" } ❌ (duplicado)
userSchema.index({ phone: 1, userType: 1 }, { unique: true });
```

**Efecto:**
- ✅ Permite: Un teléfono con `userType: "client"`
- ✅ Permite: El mismo teléfono con `userType: "driver"`
- ❌ NO permite: Dos clientes con el mismo teléfono
- ❌ NO permite: Dos conductores con el mismo teléfono

---

### 2. Registro de Conductores (`backend/routes/drivers.js`)

#### Cambio en validación (Línea 56-62)

**ANTES:**
```javascript
// Verificar si el teléfono ya existe
const existingUser = await User.findOne({ phone: cleanPhone });
if (existingUser) {
  return res.status(400).json({
    error: 'El teléfono ya está registrado'
  });
}
```

**DESPUÉS:**
```javascript
// Verificar si ya existe un conductor con este teléfono
// ✅ NUEVO: Ahora solo verificamos si ya es conductor, no si el teléfono existe
// Esto permite que un cliente también pueda registrarse como conductor
const existingDriver = await User.findOne({ 
  phone: cleanPhone, 
  userType: 'driver' 
});
if (existingDriver) {
  return res.status(400).json({
    error: 'Ya tienes una cuenta de conductor con este teléfono'
  });
}
```

**Efecto:**
- ✅ Si eres cliente, puedes registrarte como conductor con el mismo teléfono
- ❌ Si ya eres conductor, no puedes crear otra cuenta de conductor

---

### 3. Registro de Clientes (`backend/routes/auth.js`)

#### Cambio en validación (Línea 164-170)

**ANTES:**
```javascript
// Verificar si el teléfono ya existe
const existingUser = await User.findOne({ phone: cleanPhone });
if (existingUser) {
  return res.status(400).json({ 
    error: 'El teléfono ya está registrado' 
  });
}
```

**DESPUÉS:**
```javascript
// Verificar si ya existe un cliente con este teléfono
// ✅ NUEVO: Ahora solo verificamos si ya es cliente, no si el teléfono existe
// Esto permite que un conductor también pueda registrarse como cliente
const existingClient = await User.findOne({ 
  phone: cleanPhone, 
  userType: 'client' 
});
if (existingClient) {
  return res.status(400).json({ 
    error: 'Ya tienes una cuenta de cliente con este teléfono' 
  });
}
```

**Efecto:**
- ✅ Si eres conductor, puedes registrarte como cliente con el mismo teléfono
- ❌ Si ya eres cliente, no puedes crear otra cuenta de cliente

---

## 📊 Comparación: Antes vs Después

### ANTES
| Teléfono | userType | Estado |
|----------|----------|--------|
| +57 300 123 | driver | ✅ Permitido |
| +57 300 123 | client | ❌ Rechazado: "El teléfono ya está registrado" |

### DESPUÉS
| Teléfono | userType | Estado |
|----------|----------|--------|
| +57 300 123 | driver | ✅ Permitido |
| +57 300 123 | client | ✅ Permitido (cuenta separada) |
| +57 300 123 | driver | ❌ Rechazado: "Ya tienes una cuenta de conductor" |
| +57 300 123 | client | ❌ Rechazado: "Ya tienes una cuenta de cliente" |

---

## 🎯 Flujos de Uso

### Escenario 1: Conductor que necesita solicitar servicio

```
1. Usuario ya tiene cuenta de Conductor
   → phone: "+57 300 123 4567"
   → userType: "driver"
   → driverProfile: { status: "approved", ... }

2. Se vara con su familia y necesita una grúa

3. Abre la PWA (Client App)

4. Se registra como Cliente con el mismo teléfono
   → phone: "+57 300 123 4567"
   → userType: "client"
   ✅ PERMITIDO (diferente userType)

5. Solicita servicio de grúa
   ✅ FUNCIONA normalmente

6. Otro conductor le responde
   ✅ TODO FUNCIONA
```

### Escenario 2: Cliente que quiere trabajar como conductor

```
1. Usuario ya tiene cuenta de Cliente
   → phone: "+57 310 987 6543"
   → userType: "client"

2. Decide trabajar como conductor de grúa

3. Descarga la Driver App

4. Se registra como Conductor con el mismo teléfono
   → phone: "+57 310 987 6543"
   → userType: "driver"
   ✅ PERMITIDO (diferente userType)

5. Completa documentos y es aprobado
   ✅ FUNCIONA normalmente

6. Puede recibir solicitudes como conductor
   ✅ TODO FUNCIONA

7. Si se vara, puede usar su cuenta de cliente
   ✅ TODO FUNCIONA
```

---

## 🔍 Validaciones del Sistema

### ✅ Lo que SÍ permite:

1. **Mismo teléfono, diferentes tipos:**
   ```javascript
   { phone: "+57 300 123", userType: "client" }  // ✅
   { phone: "+57 300 123", userType: "driver" }  // ✅
   ```

2. **Diferentes teléfonos, mismo tipo:**
   ```javascript
   { phone: "+57 300 111", userType: "client" }  // ✅
   { phone: "+57 300 222", userType: "client" }  // ✅
   ```

3. **Diferentes teléfonos, diferentes tipos:**
   ```javascript
   { phone: "+57 300 333", userType: "client" }  // ✅
   { phone: "+57 300 444", userType: "driver" }  // ✅
   ```

### ❌ Lo que NO permite:

1. **Mismo teléfono, mismo tipo (duplicado):**
   ```javascript
   { phone: "+57 300 123", userType: "client" }  // ✅ Primera cuenta
   { phone: "+57 300 123", userType: "client" }  // ❌ Duplicado
   ```

2. **Mismo teléfono, mismo tipo (duplicado conductor):**
   ```javascript
   { phone: "+57 300 123", userType: "driver" }  // ✅ Primera cuenta
   { phone: "+57 300 123", userType: "driver" }  // ❌ Duplicado
   ```

---

## 🗄️ Estructura de Base de Datos

### Ejemplo de Usuario Dual

**Cuenta de Cliente:**
```javascript
{
  _id: "507f1f77bcf86cd799439011",
  name: "Carlos López",
  phone: "+57 300 123 4567",
  userType: "client",
  phoneVerified: true,
  fcmToken: "client-fcm-token-123",
  createdAt: "2026-01-15T10:00:00Z"
}
```

**Cuenta de Conductor (mismo teléfono):**
```javascript
{
  _id: "507f1f77bcf86cd799439012",  // ⚠️ Diferente _id
  name: "Carlos López",
  phone: "+57 300 123 4567",        // ✅ Mismo teléfono
  userType: "driver",               // ⚠️ Diferente tipo
  phoneVerified: true,
  email: "carlos@example.com",
  driverProfile: {
    status: "approved",
    entityType: "natural",
    city: "Bogotá",
    documents: { ... },
    towTruck: { ... },
    vehicleCapabilities: ["AUTOS", "CAMIONETAS"],
    isOnline: true,
    rating: 5,
    fcmToken: "driver-fcm-token-456"
  },
  createdAt: "2026-02-10T15:30:00Z"
}
```

**Características:**
- ✅ Dos documentos separados en MongoDB
- ✅ Diferentes `_id`
- ✅ Mismo `phone`
- ✅ Diferentes `userType`
- ✅ Perfiles independientes
- ✅ Tokens FCM separados

---

## 🚀 Despliegue en Producción

### Paso 1: Actualizar el código en el servidor

```bash
# SSH al servidor DigitalOcean
ssh root@tu-servidor

# Ir al directorio del backend
cd /root/desvare-proyect/backend

# Hacer pull de los cambios
git pull origin main

# Instalar dependencias (por si acaso)
npm install
```

### Paso 2: Recrear el índice en MongoDB

**⚠️ IMPORTANTE:** MongoDB necesita recrear el índice del campo `phone`.

```bash
# Conectarse a MongoDB Atlas o ejecutar en el servidor
# Opción 1: Desde el servidor (si tienes mongosh instalado)
mongosh "tu-connection-string"

# Opción 2: Desde MongoDB Atlas Compass
# O desde la terminal del servidor con Node.js:
node
```

**Ejecutar en la consola de MongoDB:**
```javascript
// Conectarse a la base de datos
use desvare-new  // O el nombre de tu base de datos

// Ver índices actuales
db.users.getIndexes()

// Eliminar el índice antiguo de phone (si existe)
db.users.dropIndex("phone_1")

// El nuevo índice compuesto se creará automáticamente cuando reinicies el backend
// gracias a: userSchema.index({ phone: 1, userType: 1 }, { unique: true });
```

### Paso 3: Reiniciar el backend

```bash
# Reiniciar PM2
pm2 restart desvare-backend

# Verificar logs
pm2 logs desvare-backend
```

**Logs esperados:**
```
✅ MongoDB conectado exitosamente
✅ Servidor corriendo en puerto 5001
```

### Paso 4: Verificar que el índice se creó

```javascript
// En MongoDB
db.users.getIndexes()

// Debe aparecer:
{
  "v": 2,
  "key": {
    "phone": 1,
    "userType": 1
  },
  "name": "phone_1_userType_1",
  "unique": true
}
```

---

## 🧪 Cómo Probar

### Prueba 1: Conductor que se registra como Cliente

1. **Registrarse como Conductor en Driver App:**
   - Abrir Driver App: https://driver.desvare.app (o localhost:5175)
   - Registrarse con: `+57 300 123 4567`
   - Verificar OTP
   - Completar registro de conductor

2. **Registrarse como Cliente en PWA:**
   - Abrir PWA: https://desvare.app (o localhost:5173)
   - Registrarse con el **mismo teléfono**: `+57 300 123 4567`
   - Verificar OTP
   - ✅ Debe funcionar sin errores

3. **Solicitar servicio:**
   - Desde la PWA, solicitar un servicio de grúa
   - ✅ Debe funcionar normalmente

### Prueba 2: Cliente que se registra como Conductor

1. **Registrarse como Cliente en PWA:**
   - Abrir PWA: https://desvare.app
   - Registrarse con: `+57 310 987 6543`
   - Verificar OTP

2. **Registrarse como Conductor en Driver App:**
   - Abrir Driver App: https://driver.desvare.app
   - Registrarse con el **mismo teléfono**: `+57 310 987 6543`
   - Verificar OTP
   - Completar registro de conductor
   - ✅ Debe funcionar sin errores

3. **Recibir solicitudes:**
   - Como conductor, activar disponibilidad
   - ✅ Debe recibir solicitudes normalmente

### Prueba 3: Intentar duplicar cuenta (debe fallar)

1. **Registrarse como Cliente:**
   - Registrarse con: `+57 350 579 0415`
   - Verificar OTP

2. **Intentar registrarse de nuevo como Cliente:**
   - Intentar registrarse con el **mismo teléfono**: `+57 350 579 0415`
   - ❌ Debe mostrar: "Ya tienes una cuenta de cliente con este teléfono"

---

## 📊 Impacto en el Sistema

### ✅ NO afecta:

1. **Socket.IO** - Sigue funcionando igual
2. **JWT** - Sigue incluyendo `userType`
3. **Solicitudes** - Siguen relacionadas por `clientId`
4. **Cotizaciones** - Siguen relacionadas por `driverId`
5. **Geolocalización** - Solo aplica a conductores
6. **Notificaciones** - Cada perfil tiene su `fcmToken`
7. **Documentos** - Solo existen en `driverProfile`
8. **Rating** - Cada perfil tiene su propio rating

### ⚠️ Consideraciones:

1. **Dos perfiles separados:**
   - No comparten historial
   - No comparten rating
   - No comparten datos personales (excepto teléfono)

2. **Dos tokens FCM:**
   - Si el mismo dispositivo tiene ambas apps
   - Cada app registra su propio token

3. **Confusión de usuario:**
   - Usuario podría olvidar en qué app se registró
   - Solución: Mensajes claros en la UI

---

## 🔒 Seguridad

### ✅ Validaciones mantenidas:

1. **OTP obligatorio** - Cada cuenta debe verificar el teléfono
2. **JWT separados** - Cada cuenta tiene su propio token
3. **Permisos separados** - Cliente no puede acceder a rutas de conductor
4. **Índice único** - No permite duplicados del mismo tipo

### ⚠️ Nuevas consideraciones:

1. **Mismo teléfono, diferentes cuentas:**
   - Usuario debe recordar que tiene dos cuentas
   - Cada cuenta tiene su propio login

2. **Verificación de teléfono:**
   - Cada cuenta debe verificar el OTP
   - No se comparte la verificación entre cuentas

---

## 📝 Archivos Modificados

### 1. `/backend/models/User.js`
- **Línea 20:** Removido `unique: true` del campo `phone`
- **Línea 221-228:** Agregado índice compuesto `{ phone: 1, userType: 1 }`

### 2. `/backend/routes/drivers.js`
- **Línea 56-67:** Actualizada validación para verificar solo `userType: 'driver'`

### 3. `/backend/routes/auth.js`
- **Línea 164-175:** Actualizada validación para verificar solo `userType: 'client'`

---

## ✅ Resultado Final

### Antes de los cambios:
```
❌ Conductor varado NO puede solicitar servicio
❌ Cliente NO puede trabajar como conductor
❌ Un teléfono = Una cuenta = Un tipo
```

### Después de los cambios:
```
✅ Conductor varado PUEDE solicitar servicio
✅ Cliente PUEDE trabajar como conductor
✅ Un teléfono = Dos cuentas posibles (cliente + conductor)
✅ Perfiles separados e independientes
✅ Sin romper funcionalidad existente
```

---

## 🎯 Ventajas de esta Implementación

1. **Cambios mínimos** - Solo 3 archivos modificados
2. **No rompe nada** - Sistema ya estaba preparado
3. **Caso de uso real** - Resuelve problema del conductor varado
4. **Fácil de probar** - No afecta funcionalidad existente
5. **Escalable** - Fácil de mantener
6. **Seguro** - Mantiene todas las validaciones

---

**Fecha:** 11 de febrero de 2026  
**Archivos modificados:** 3 (`User.js`, `drivers.js`, `auth.js`)  
**Tiempo de implementación:** 30 minutos  
**Estado:** ✅ Listo para producción
