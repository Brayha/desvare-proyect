# ✅ Checklist de Testing - Flujo Cancelación y Nueva Solicitud

**Fecha:** 22 de Diciembre, 2025  
**Objetivo:** Validar que el flujo completo funcione sin "cotizaciones fantasma"

---

## 🎯 Escenario de Prueba

**Historia de Usuario:**
> Como cliente, mi carro se desvaró en Soacha. Solicité una grúa pero logré arrancar, así que cancelé. Avancé 500 metros y el carro se volvió a apagar en Kennedy. Solicito una nueva grúa con ubicación diferente.

---

## 📋 Paso 1: Setup Inicial

### Backend
```bash
cd backend
npm run dev
```

**✅ Verificar:**
- [ ] Servidor corriendo en puerto 5001
- [ ] Mensaje: "🚀 Servidor corriendo en puerto 5001"
- [ ] Mensaje: "✅ Conectado a MongoDB Atlas"
- [ ] Mensaje: "📡 Socket.IO listo para conexiones"

---

### Client PWA
```bash
cd client-pwa
npm run dev
```

**✅ Verificar:**
- [ ] Corriendo en http://localhost:5173
- [ ] Sin errores en consola
- [ ] Socket.IO conecta: "✅ Socket.IO conectado exitosamente"

---

### Driver App
```bash
cd driver-app
npm run dev
```

**✅ Verificar:**
- [ ] Corriendo en http://localhost:5175
- [ ] Sin errores en consola
- [ ] Socket.IO conecta: "✅ Conectado al servidor Socket.IO"

---

## 📋 Paso 2: Solicitud #1 (Ubicación A - Soacha)

### Cliente (PWA)

1. **Login/Register**
   - [ ] Login como cliente (Itachi Uchiha)
   - [ ] Ve pantalla de Home

2. **Solicitar Servicio**
   - [ ] Click "Cotizar servicio de grúa"
   - [ ] Permite permisos de ubicación
   - [ ] **Origen:** Soacha, Cundinamarca (captura ubicación)
   - [ ] **Destino:** Tintalito, Ciudad Kennedy, Bogotá
   - [ ] Selecciona vehículo: BYD Song Plus
   - [ ] Selecciona problema: "vc db fgd dg dfg"
   - [ ] Click "Buscar Cotizaciones"

**✅ Verificar en Consola Cliente:**
```
📍 Origen: Soacha, Cundinamarca, Colombia
📍 Destino: Tintalito, Ciudad Kennedy, Bogotá
📦 Payload de solicitud: { origin: {...}, destination: {...} }
✅ Solicitud enviada correctamente
💾 RequestId guardado en localStorage: [ID]
```

**✅ Verificar localStorage:**
```javascript
// En DevTools Console
localStorage.getItem('currentRequestId'); // ← Debe tener valor
localStorage.getItem('requestData'); // ← Debe tener JSON
localStorage.getItem('quotesReceived'); // ← null o []
```

---

### Conductor (Driver App)

3. **Recibir Solicitud**
   - [ ] Toggle en ACTIVO (verde)
   - [ ] Aparece card de solicitud de "Itachi Uchiha"
   - [ ] Muestra vehículo: BYD Song Plus
   - [ ] Muestra origen: Soacha
   - [ ] Muestra destino: Tintalito

**✅ Verificar en Consola Conductor:**
```
📥 Nueva solicitud recibida: { clientName: 'Itachi Uchiha', ... }
✅ Solicitud normalizada: { status: 'pending', quotesCount: 0 }
```

4. **Cotizar**
   - [ ] Click "Cotizar"
   - [ ] Ingresa monto: $200,012
   - [ ] Click "Enviar Cotización"

**✅ Verificar en Consola Conductor:**
```
💰 Enviando cotización: $200,012
✅ Cotización enviada exitosamente
📊 Solicitud actualizada: { quotesCount: 1, status: 'quoted' }
```

---

### Cliente (PWA) - Recibir Cotización

5. **Ver Cotización**
   - [ ] Banner de notificación aparece
   - [ ] Sonido reproduce (si configurado)
   - [ ] Vibración (en móvil)
   - [ ] Marcador aparece en mapa
   - [ ] Cotización: $200,012 de "driver 07"

**✅ Verificar en Consola Cliente:**
```
💰 Cotización recibida en WaitingQuotes: { driverName: 'driver 07', amount: 200012 }
📍 Ubicación del conductor: { lat: ..., lng: ... }
```

6. **Aceptar Cotización**
   - [ ] Click en marcador del mapa
   - [ ] Sheet modal aparece con info del conductor
   - [ ] Click "Aceptar Cotización"
   - [ ] Confirmar en alert

**✅ Verificar:**
- [ ] Navega a `/driver-on-way`
- [ ] Muestra código de seguridad: 6562
- [ ] Muestra monto acordado: $200.012

**✅ Verificar en Consola Cliente:**
```
✅ Aceptando cotización: { driverId: '...', amount: 200012 }
📡 Enviando aceptación de cotización: { requestId: '...', ... }
✅ Servicio aceptado, redirigiendo...
```

---

### Conductor (Driver App) - Servicio Aceptado

7. **Recibir Aceptación**
   - [ ] Toast: "¡Tu cotización fue aceptada!"
   - [ ] Solicitud desaparece de la bandeja
   - [ ] Toggle cambia a OCUPADO (rojo) automáticamente
   - [ ] Navega a `/active-service`

**✅ Verificar en Consola Conductor:**
```
🎉 ¡Tu cotización fue aceptada! { clientName: 'Itachi Uchiha', securityCode: '6562', amount: 200012 }
✅ Conductor puesto en OCUPADO automáticamente
```

**✅ Verificar localStorage Conductor:**
```javascript
localStorage.getItem('activeService'); // ← Debe tener JSON del servicio
```

---

## 📋 Paso 3: Cancelar Servicio #1 (Cliente Arrancó)

### Cliente (PWA)

8. **Cancelar Servicio**
   - [ ] En vista "Conductor en Camino"
   - [ ] Click "Cancelar Servicio"
   - [ ] Confirma en alert
   - [ ] Selecciona razón: "✅ Ya me desvaré / El carro prendió"
   - [ ] Click "Confirmar Cancelación"

**✅ Verificar en Consola Cliente:**
```
🚨 handleCancelService llamado
✅ Usuario confirmó, abriendo modal de razones
📝 Confirmando cancelación con razón: resuelto
🚫 Cancelando servicio con detalles: [requestId]
📝 Razón: resuelto
```

**✅ Verificar localStorage Cliente (DEBE ESTAR VACÍO):**
```javascript
localStorage.getItem('activeService'); // ← null
localStorage.getItem('currentRequestId'); // ← null
localStorage.getItem('requestData'); // ← null
localStorage.getItem('quotesReceived'); // ← null ⭐ CRÍTICO
```

**✅ Verificar navegación:**
- [ ] Vuelve a `/home` con `history.replace()`
- [ ] NO puede volver atrás con el botón del navegador

---

### Backend

**✅ Verificar en Consola Backend:**
```
🚫 Solicitud cancelada por cliente: [requestId]
📝 Razón: resuelto
✅ Solicitud actualizada a estado "cancelled" en DB
🟢 Conductor [driverId] liberado y puesto en ACTIVO
📢 Notificando a todos los conductores...
✅ Notificación de cancelación enviada a conductores
```

---

### Conductor (Driver App)

9. **Recibir Cancelación**
   - [ ] Toast/Modal: "Servicio cancelado"
   - [ ] Muestra razón: "Ya me desvaré / El carro prendió"
   - [ ] Toggle cambia a ACTIVO (verde) automáticamente
   - [ ] Navega de vuelta a `/home`

**✅ Verificar en Consola Conductor:**
```
🚫 EVENTO CANCELACIÓN RECIBIDO
📝 RequestId recibido: [requestId]
📝 Razón: resuelto
📊 Requests después de filtrar: [] ⭐ CRÍTICO (debe estar vacío)
🚨 Servicio activo cancelado por el cliente
🟢 Conductor liberado y puesto en ACTIVO
```

**✅ Verificar localStorage Conductor:**
```javascript
localStorage.getItem('activeService'); // ← null
```

**✅ Verificar UI Conductor:**
- [ ] Bandeja vacía: "No hay solicitudes pendientes"
- [ ] Toggle en ACTIVO (verde)
- [ ] Modal de cancelación muestra detalles

---

## 📋 Paso 4: Nueva Solicitud #2 (Ubicación B - Kennedy)

### Cliente (PWA)

10. **Solicitar NUEVO Servicio (Diferente Ubicación)**
    - [ ] Desde Home, click "Cotizar servicio de grúa"
    - [ ] **IMPORTANTE:** Permite ubicación de nuevo (puede pedir permisos)
    - [ ] **Origen:** Kennedy, Bogotá ⭐ DIFERENTE DE ANTES
    - [ ] **Destino:** Chía, Cundinamarca ⭐ DIFERENTE DE ANTES
    - [ ] Selecciona vehículo: BYD Song Plus (mismo vehículo)
    - [ ] Selecciona problema: "v dv dg dfgb dg"
    - [ ] Click "Buscar Cotizaciones"

**✅ Verificar en Consola Cliente:**
```
📦 Datos en localStorage: { hasUser: true, hasRouteData: false, hasRequestId: false }
🧹 Limpiando estado anterior de cotizaciones ⭐ CRÍTICO
📍 Origen: Kennedy, Bogotá, Colombia ⭐ NUEVA UBICACIÓN
📍 Destino: Chía, Cundinamarca, Colombia ⭐ NUEVA UBICACIÓN
💾 RequestId guardado en localStorage: [NUEVO_ID] ⭐ ID DIFERENTE
```

**✅ Verificar localStorage Cliente:**
```javascript
const requestId = localStorage.getItem('currentRequestId'); // ← NUEVO ID
const requestData = JSON.parse(localStorage.getItem('requestData'));
console.log(requestData.origin.address); // ← Debe ser "Kennedy"
console.log(requestData.destination.address); // ← Debe ser "Chía"
```

---

### Conductor (Driver App)

11. **Recibir NUEVA Solicitud**
    - [ ] Aparece card de solicitud de "Itachi Uchiha"
    - [ ] Muestra origen: Kennedy (NUEVO)
    - [ ] Muestra destino: Chía (NUEVO)
    - [ ] Muestra distancia diferente (9.8 km vs 36.2 km anterior)

**✅ VERIFICACIÓN CRÍTICA - NO debe aparecer:**
- [ ] ❌ NO debe ver solicitud anterior (Soacha → Tintalito)
- [ ] ❌ NO debe haber duplicados
- [ ] ✅ SOLO debe ver solicitud nueva (Kennedy → Chía)

**✅ Verificar en Consola Conductor:**
```
📥 Nueva solicitud recibida: { 
  clientName: 'Itachi Uchiha',
  origin: { address: 'Kennedy, Bogotá, Colombia' }, ⭐ NUEVA
  destination: { address: 'Chía, Cundinamarca, Colombia' }, ⭐ NUEVA
  distance: 9836, ⭐ DIFERENTE
  requestId: '[NUEVO_ID]' ⭐ DIFERENTE
}
📊 Solicitudes en bandeja: 1 ⭐ SOLO UNA
```

12. **Cotizar NUEVO Servicio**
    - [ ] Click "Cotizar" en la NUEVA solicitud
    - [ ] Ingresa monto: $100,000 (diferente al anterior)
    - [ ] Click "Enviar Cotización"

**✅ Verificar:**
- [ ] Cotización se envía correctamente
- [ ] Cliente la recibe en WaitingQuotes

---

## 📋 Paso 5: Verificación de Pull-to-Refresh

### Conductor (Driver App)

13. **Refrescar Bandeja**
    - [ ] Desliza hacia abajo (Pull to Refresh)
    - [ ] Espera a que termine la animación

**✅ VERIFICACIÓN CRÍTICA:**
- [ ] ❌ NO debe aparecer solicitud cancelada (Soacha → Tintalito)
- [ ] ✅ SOLO debe ver solicitud activa actual (Kennedy → Chía)

**✅ Verificar en Consola Conductor:**
```
🔄 Pull to refresh activado en driver-app
🔍 Solicitudes encontradas antes de formatear: 1 ⭐ SOLO UNA
✅ 1 solicitudes cargadas
```

---

## 📋 Paso 6: Verificación en Base de Datos (Opcional)

Si tienes acceso a MongoDB Compass:

**Verificar colección `requests`:**

```javascript
// Solicitud #1 (cancelada)
{
  _id: "[ID_SOLICITUD_1]",
  clientName: "Itachi Uchiha",
  origin: { address: "Soacha, Cundinamarca" },
  destination: { address: "Tintalito, Ciudad Kennedy" },
  status: "cancelled", ⭐ DEBE SER "cancelled"
  cancelledAt: "2025-12-22T...",
  cancellationReason: "resuelto"
}

// Solicitud #2 (activa)
{
  _id: "[ID_SOLICITUD_2]", ⭐ ID DIFERENTE
  clientName: "Itachi Uchiha",
  origin: { address: "Kennedy, Bogotá" }, ⭐ DIFERENTE
  destination: { address: "Chía, Cundinamarca" }, ⭐ DIFERENTE
  status: "quoted", ⭐ DEBE SER "quoted" o "pending"
  quotes: [ { driverId: "...", amount: 100000 } ]
}
```

---

## ✅ Checklist Final de Validación

### Flujo Completo
- [ ] Cliente puede cancelar servicio
- [ ] localStorage se limpia completamente
- [ ] Cliente puede solicitar nuevo servicio
- [ ] Nueva ubicación es diferente
- [ ] Conductor solo ve solicitud nueva
- [ ] NO aparecen solicitudes canceladas

### Estado del Conductor
- [ ] Cambia a OCUPADO al aceptar
- [ ] Cambia a ACTIVO al cancelar cliente
- [ ] Puede recibir nuevas solicitudes después de cancelación

### Base de Datos
- [ ] Solicitud cancelada tiene `status: 'cancelled'`
- [ ] Endpoint `/api/requests/nearby/:driverId` no devuelve canceladas
- [ ] Conductor liberado tiene `isOnline: true`

---

## 🚨 Errores Comunes a Buscar

### ❌ Error 1: "Cotizaciones Fantasma"
**Síntoma:** Conductor ve solicitud cancelada en su bandeja

**Verificar:**
- [ ] Backend filtrado: `status: { $in: ['pending', 'quoted'] }`
- [ ] Listener de cancelación funciona
- [ ] Solicitud se remueve del state: `setRequests(prev => prev.filter(...))`

---

### ❌ Error 2: "Ubicación Repetida"
**Síntoma:** Nueva solicitud usa ubicación anterior

**Verificar:**
- [ ] `requestData` se limpió de localStorage
- [ ] `getCurrentLocation()` obtiene ubicación fresca
- [ ] `maximumAge: 0` en useGeolocation

---

### ❌ Error 3: "Conductor NO se Libera"
**Síntoma:** Conductor sigue OCUPADO después de cancelación

**Verificar:**
- [ ] Backend actualiza: `'driverProfile.isOnline': true`
- [ ] Socket.IO notifica cambio
- [ ] Listener en conductor actualiza toggle

---

## 📊 Resultados Esperados

### ✅ Si TODO está correcto:

```
✅ Cliente cancela servicio → localStorage vacío
✅ Cliente solicita nuevo → ubicación diferente
✅ Conductor NO ve solicitud cancelada
✅ Conductor SOLO ve solicitud nueva
✅ Pull-to-refresh NO muestra canceladas
✅ Conductor se libera automáticamente
✅ Base de datos consistente
```

---

## 🎯 Conclusión

Si pasaste TODOS los checkpoints, el flujo está funcionando correctamente. 

**Las "cotizaciones fantasma" NO deben aparecer.**

---

**Checklist preparado por:** IA Assistant  
**Fecha:** 22 de Diciembre, 2025  
**Versión:** 1.0

