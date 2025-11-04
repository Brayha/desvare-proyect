# 🧪 GUÍA DE PRUEBAS - Flujo Completo End-to-End

## 🎯 **OBJETIVO**
Probar el flujo completo desde que un cliente solicita una grúa hasta que un conductor recibe la cotización.

---

## 📋 **PRE-REQUISITOS**

### 1. **Base de datos MongoDB corriendo**
```bash
# Verifica que MongoDB esté corriendo
mongod --version
```

### 2. **Variables de entorno configuradas**
Asegúrate que `/backend/.env` tenga:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/desvare
JWT_SECRET=tu_secreto_super_seguro
VITE_MAPBOX_TOKEN=tu_token_de_mapbox
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_de_google
```

---

## 🚀 **PASOS PARA PROBAR**

### **PASO 1: Iniciar el Backend** 🔧

```bash
cd /Users/bgarcia/Documents/desvare-proyect/backend
npm run dev
```

**Logs esperados:**
```
🚀 Servidor corriendo en puerto 3001
🌍 Conectado a MongoDB
🔌 Socket.IO configurado
```

---

### **PASO 2: Abrir la App del Conductor PRIMERO** 🚗

```bash
cd /Users/bgarcia/Documents/desvare-proyect/driver-app
npm run dev
```

Abrir en el navegador:
```
http://localhost:5174/
```

**Acciones:**
1. Hacer login como conductor existente
2. **DEJAR ESTA PESTAÑA ABIERTA Y VISIBLE**
3. Abrir la consola de desarrollador (F12) para ver los logs

**Logs esperados en la consola:**
```
✅ Conectado al servidor Socket.IO
🚗 Conductor registrado en Socket.IO
```

---

### **PASO 3: Abrir la App del Cliente (Nueva pestaña)** 👤

```bash
cd /Users/bgarcia/Documents/desvare-proyect/client-pwa
npm run dev
```

Abrir en **OTRA PESTAÑA** del navegador:
```
http://localhost:5173/
```

---

### **PASO 4: Flujo del Cliente (Paso a Paso)** 📱

#### **4.1 Permisos de Ubicación**
- Deberías ver la página `LocationPermission`
- Click en "Permitir acceso a ubicación"
- **Permitir** cuando el navegador pida permisos
- Espera que detecte tu ubicación

**Logs esperados:**
```
✅ Ubicación obtenida correctamente. Redirigiendo...
```

---

#### **4.2 Selección de Ruta**
- Deberías ver el mapa con tu ubicación actual
- El campo "Origen" ya debería tener tu dirección actual
- Click en el campo "¿A dónde vamos?"
- Escribe un destino (ej: "Centro Andino Bogotá")
- Selecciona un destino de la lista
- El mapa mostrará la ruta
- **Click en "Confirmar Ruta"**

**Logs esperados:**
```
✅ Destino seleccionado
✅ Ruta confirmada
```

---

#### **4.3 Login o Registro**
- Deberías ver la página `RequestAuth` con el resumen de tu ruta
- **Opción A: Login** (si ya tienes cuenta)
  - Tab "Iniciar Sesión"
  - Email: `tu_email@ejemplo.com`
  - Contraseña: `tu_contraseña`
  - Click en "Iniciar Sesión"
  
- **Opción B: Registro** (si es tu primera vez)
  - Tab "Registrarse"
  - Nombre: `Juan Pérez`
  - Email: `juanperez@ejemplo.com`
  - Teléfono: `+57 300 123 4567`
  - Contraseña: `micontraseña123`
  - Click en "Registrarse"

**Logs esperados (IMPORTANTES):**
```
[Cliente - Console F12]
🔌 Conectando Socket.IO después del login...
✅ Socket.IO conectado exitosamente
👤 Cliente registrado en Socket.IO: [client-id]
📤 Enviando solicitud a conductores desde RequestAuth...
📦 Payload que se enviará: { ... }
📡 Enviando evento Socket.IO a conductores...
🎯 Request ID: [request-id]
✅ Solicitud enviada correctamente
```

```
[Backend - Terminal]
🔌 Nuevo cliente conectado: [socket-id]
👤 Cliente registrado: [client-id]  ← SOLO 1 VEZ ✅
📦 Datos recibidos en el backend: { ... }
✅ Nueva solicitud creada: [request-id]  ← SOLO 1 VEZ ✅
📍 Origen: [tu dirección de origen]
📍 Destino: [tu dirección de destino]
📢 Nueva solicitud de cotización recibida
🚗 Conductores conectados en sala "drivers": 1  ← DEBE SER 1 o más ✅
✅ Solicitud emitida a conductores en sala "drivers"
```

---

#### **4.4 Esperando Cotizaciones**
- Deberías ser redirigido a `WaitingQuotes`
- Verás el mapa con tu ruta
- Mensaje: "Buscando conductores cercanos..."
- Resumen de tu solicitud abajo

**Logs esperados:**
```
[Cliente - Console F12]
📋 WaitingQuotes - Solicitud ya enviada desde RequestAuth
🎯 Request ID: [request-id]
👤 Usuario: Juan Pérez
```

---

### **PASO 5: Verificar que el Conductor Recibió la Solicitud** 🎉

**Cambiar a la pestaña del Conductor (http://localhost:5174/)**

**Logs esperados en la consola del conductor:**
```
📥 Nueva solicitud recibida: {
  requestId: "[request-id]",
  clientName: "Juan Pérez",
  origin: "[dirección de origen]",
  destination: "[dirección de destino]",
  distance: 16834.131,
  duration: 2464.978
}
```

**En la UI del conductor deberías ver:**
- Nueva tarjeta de solicitud con:
  - Nombre del cliente
  - Origen y destino
  - Distancia y tiempo estimado
  - Botón "Ver Detalles"
  - Input para ingresar cotización

---

### **PASO 6: Enviar Cotización (Conductor)** 💰

**En la pestaña del conductor:**
1. Ingresa un monto (ej: `50000`)
2. Click en "Enviar Cotización"

**Logs esperados:**
```
[Conductor - Console F12]
📤 Enviando cotización de $50000
```

```
[Backend - Terminal]
💰 Cotización recibida de conductor [driver-id] para solicitud [request-id]
📤 Cotización enviada al cliente [client-id]
```

---

### **PASO 7: Verificar que el Cliente Recibió la Cotización** ✅

**Cambiar a la pestaña del Cliente (http://localhost:5173/waiting-quotes)**

**Logs esperados:**
```
[Cliente - Console F12]
💰 Cotización recibida en WaitingQuotes: {
  driverId: "[driver-id]",
  driverName: "Carlos Conductor",
  amount: 50000,
  requestId: "[request-id]"
}
```

**En la UI del cliente deberías ver:**
- Toast: "Nueva cotización: $50,000"
- Botón "Ver 1 Cotización" (con badge)

---

## ✅ **CHECKLIST DE ÉXITO**

### **Backend:**
- [ ] MongoDB conectado
- [ ] Servidor corriendo en puerto 3001
- [ ] Socket.IO configurado
- [ ] Solo 1 registro de cliente en logs
- [ ] Solo 1 solicitud creada en logs
- [ ] Conductores conectados > 0

### **Conductor:**
- [ ] Login exitoso
- [ ] Socket.IO conectado
- [ ] Recibe la solicitud con todos los datos
- [ ] Puede enviar cotización

### **Cliente:**
- [ ] Permisos de ubicación otorgados
- [ ] Origen detectado automáticamente
- [ ] Destino seleccionado correctamente
- [ ] Ruta mostrada en el mapa
- [ ] Login/Registro exitoso
- [ ] Socket.IO conectado (1 solo registro)
- [ ] Solicitud enviada (1 sola vez)
- [ ] Redirigido a WaitingQuotes
- [ ] Recibe cotización del conductor

---

## 🐛 **TROUBLESHOOTING**

### **Problema: Conductor no recibe la solicitud**

**Verificar:**
1. ¿El conductor hizo login ANTES que el cliente?
2. ¿La consola del conductor muestra "Conductor registrado en Socket.IO"?
3. ¿Los logs del backend muestran "Conductores conectados en sala 'drivers': 1"?
4. ¿El backend muestra "Solicitud emitida a conductores en sala 'drivers'"?

**Solución:**
- Recargar la página del conductor
- Hacer login de nuevo
- Verificar que aparezca "🚗 Conductor registrado"
- **LUEGO** hacer el flujo del cliente

---

### **Problema: Múltiples "Cliente registrado" en backend**

**Síntoma:**
```
👤 Cliente registrado: [client-id]
👤 Cliente registrado: [client-id]
👤 Cliente registrado: [client-id]
...
```

**Causa:** El flujo viejo aún está activo

**Solución:**
1. Hacer logout en el cliente
2. Limpiar localStorage (F12 > Application > Local Storage > Clear All)
3. Recargar la página del cliente
4. Hacer el flujo completo desde el inicio

---

### **Problema: Cliente no recibe cotización**

**Verificar:**
1. ¿El cliente está en la página `/waiting-quotes`?
2. ¿La consola del cliente muestra el listener de cotizaciones?
3. ¿Los logs del backend muestran "Cotización enviada al cliente [client-id]"?

**Solución:**
- Verificar que el `requestId` sea el mismo en conductor y cliente
- Reenviar la cotización desde el conductor

---

### **Problema: "Error al enviar solicitud"**

**Verificar:**
1. ¿El backend está corriendo?
2. ¿MongoDB está corriendo?
3. ¿Los datos de origen/destino están completos?

**Solución:**
- Verificar logs del backend
- Verificar payload en consola del cliente
- Verificar que el modelo de Request en backend esté actualizado

---

## 📊 **MÉTRICAS DE ÉXITO**

| Métrica | Esperado | Actual |
|---------|----------|--------|
| Registros de cliente en backend | 1 | ✅ |
| Solicitudes creadas | 1 | ✅ |
| Conductores notificados | 1 | ✅ |
| Cotizaciones recibidas por cliente | 1+ | ✅ |

---

## 🎉 **¡TODO FUNCIONANDO!**

Si completaste todos los pasos y viste todos los logs esperados, **¡felicidades!** El flujo está funcionando correctamente.

### **Próximos pasos:**
1. ✅ Mostrar cotizaciones en el mapa
2. ✅ Click en cotización para ver detalles del conductor
3. ✅ Aceptar cotización
4. ✅ Tracking en tiempo real del conductor
5. ✅ Historial de solicitudes

---

**Fecha de última actualización:** 2025-01-06
**Estado:** ✅ Listo para pruebas

