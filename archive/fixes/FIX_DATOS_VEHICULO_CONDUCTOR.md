# 🔧 FIX: Datos del Vehículo Visibles para el Conductor

**Fecha:** 2026-01-05  
**Problema:** Conductor no podía ver información del vehículo del cliente  
**Causa:** Socket.IO no enviaba `vehicleSnapshot` ni `serviceDetails`

---

## 🐛 Problema Identificado

Cuando los conductores recibían solicitudes de servicio, NO podían ver:
- ❌ Marca del vehículo
- ❌ Modelo del vehículo  
- ❌ Placa
- ❌ Problema/descripción

**Impacto:**
- 🔴 **CRÍTICO** - El conductor necesita esta información para decidir si acepta la solicitud
- El conductor no sabe qué tipo de vehículo atender
- No puede preparar el equipo adecuado

---

## 🔍 Diagnóstico:

### Síntomas:
En la vista del conductor (`driver-app/src/pages/Home.jsx`):
- ✅ Solicitudes aparecían en la bandeja
- ❌ Datos del vehículo mostraban `undefined undefined`
- ❌ Placa mostraba `undefined`
- ❌ Problema no se mostraba

### Causa Raíz:

**Backend - Socket.IO (`backend/server.js` líneas 186-209):**

El evento `request:new` que se dispara cuando un cliente solicita servicio **NO incluía** los datos del vehículo:

```javascript
// ❌ ANTES:
io.to('active-drivers').emit('request:received', {
  requestId: data.requestId,
  clientId: data.clientId,
  clientName: data.clientName,
  origin: data.origin,
  destination: data.destination,
  distance: data.distance,
  duration: data.duration,
  timestamp: new Date()
  // ❌ Faltaban: vehicle, problem, distanceKm, durationMin
});
```

**Nota:** El endpoint REST `/api/requests/nearby/:driverId` SÍ enviaba estos datos correctamente, pero solo al cargar la bandeja inicialmente. Las solicitudes que llegaban en tiempo real por Socket.IO no tenían esta información.

---

## ✅ Solución Aplicada

### Archivo 1: `backend/server.js`

**Cambio en evento `request:new` (Líneas ~186-232):**

```javascript
// Cliente solicita cotización
socket.on('request:new', (data) => {
  console.log('📢 Nueva solicitud de cotización recibida');
  console.log('📦 Datos completos:', JSON.stringify(data, null, 2));
  
  const activeDriversCount = io.sockets.adapter.rooms.get('active-drivers')?.size || 0;
  const totalDriversCount = io.sockets.adapter.rooms.get('drivers')?.size || 0;
  
  console.log(`🚗 Conductores totales conectados: ${totalDriversCount}`);
  console.log(`🟢 Conductores ACTIVOS: ${activeDriversCount}`);
  
  // Helper para obtener icono según categoría
  const getCategoryIcon = (categoryId) => {
    const icons = {
      'MOTOS': '🏍️',
      'AUTOS': '🚗',
      'CAMIONETAS': '🚙',
      'CAMIONES': '🚚',
      'BUSES': '🚌'
    };
    return icons[categoryId] || '🚗';
  };
  
  // ✅ AHORA: Enviar con datos completos del vehículo
  io.to('active-drivers').emit('request:received', {
    requestId: data.requestId,
    clientId: data.clientId,
    clientName: data.clientName,
    origin: data.origin,
    destination: data.destination,
    distance: data.distance,
    duration: data.duration,
    // ✅ AGREGADO: Datos del vehículo
    vehicle: data.vehicleSnapshot ? {
      category: data.vehicleSnapshot.category?.name || 'N/A',
      brand: data.vehicleSnapshot.brand?.name || 'N/A',
      model: data.vehicleSnapshot.model?.name || 'N/A',
      licensePlate: data.vehicleSnapshot.licensePlate || 'N/A',
      icon: getCategoryIcon(data.vehicleSnapshot.category?.id)
    } : null,
    // ✅ AGREGADO: Datos del servicio (problema)
    problem: data.serviceDetails?.problem || 'Sin descripción',
    // Distancia y tiempo formateados
    distanceKm: (data.distance / 1000).toFixed(1),
    durationMin: Math.round(data.duration / 60),
    timestamp: new Date()
  });
  
  console.log(`✅ Solicitud emitida a ${activeDriversCount} conductores ACTIVOS`);
});
```

---

### Archivo 2: `driver-app/src/pages/Home.jsx`

**Mejora en normalización de datos (Líneas ~119-147):**

```javascript
// Escuchar nuevas solicitudes
socketService.onRequestReceived((request) => {
  console.log('📥 Nueva solicitud recibida:', request);
  
  // Normalizar la solicitud para asegurar que tenga todos los campos necesarios
  const normalizedRequest = {
    ...request,
    id: request.requestId,
    requestId: request.requestId,
    status: request.status || 'pending',
    quotesCount: request.quotesCount || 0,
    // ✅ Asegurar que vehicle existe con valores por defecto
    vehicle: request.vehicle || {
      icon: '🚗',
      brand: 'N/A',
      model: 'N/A',
      licensePlate: 'N/A'
    },
    // ✅ Asegurar que problem existe
    problem: request.problem || 'Sin descripción',
    // ✅ Asegurar que distanceKm y durationMin existen
    distanceKm: request.distanceKm || (request.distance ? (request.distance / 1000).toFixed(1) : 'N/A'),
    durationMin: request.durationMin || (request.duration ? Math.round(request.duration / 60) : 'N/A')
  };
  
  console.log('✅ Solicitud normalizada:', normalizedRequest);
  setRequests((prev) => [normalizedRequest, ...prev]);
  // ...
});
```

---

### Archivo 3: `driver-app/src/components/RequestCard.jsx`

**Mejora en manejo de datos faltantes (Líneas ~44-75):**

```javascript
{/* Vehículo */}
<div className="vehicle-info">
  <div className="vehicle-icon">
    <span className="vehicle-emoji">{request.vehicle?.icon || '🚗'}</span>
  </div>
  <div className="vehicle-details">
    <IonText className="vehicle-model">
      <strong>{request.vehicle?.brand || 'N/A'} {request.vehicle?.model || 'N/A'}</strong>
    </IonText>
    <IonText className="vehicle-plate" color="medium">
      {request.vehicle?.licensePlate || 'N/A'}
    </IonText>
  </div>
  <div className="distance-info">
    <IonText className="distance">
      <strong>{request.durationMin || 'N/A'} MIN</strong>
    </IonText>
    <IonText className="distance-km" color="medium">
      {request.distanceKm || 'N/A'} km
    </IonText>
  </div>
</div>

{/* Problema */}
<div className="problem-section">
  <IonText color="medium" className="section-label">
    Problema
  </IonText>
  <IonText className="problem-text">
    {request.problem || 'Sin descripción'}
  </IonText>
</div>
```

**Cambios:**
- Agregado `|| 'N/A'` a todos los campos para manejar valores `undefined`
- Agregado optional chaining (`?.`) en todos los accesos
- Asegurar que siempre hay un fallback visible

---

## 🎯 Resultado Esperado

Ahora cuando un conductor recibe una solicitud:

1. ✅ Ve la marca y modelo del vehículo (ej: "BYD Song Plus")
2. ✅ Ve la placa del vehículo (ej: "QQQ-333")
3. ✅ Ve el problema descrito por el cliente (ej: "Se me apagó el carro")
4. ✅ Ve la distancia en km (ej: "21.9 km")
5. ✅ Ve el tiempo estimado en minutos (ej: "58 MIN")
6. ✅ Ve el icono correcto según el tipo de vehículo (🏍️ 🚗 🚙 🚚 🚌)

**Esto aplica para:**
- ✅ Solicitudes que llegan en tiempo real (Socket.IO)
- ✅ Solicitudes cargadas al abrir la bandeja (REST API `/nearby`)

---

## 🧪 Cómo Probar

### Prueba 1: Solicitud Nueva (Socket.IO)

1. **Cliente:** Solicita un servicio
   - Selecciona vehículo: BYD Song Plus (QQQ-333)
   - Describe problema: "Se me desvaró en la autopista"
2. **Conductor:** Debe ver inmediatamente en la notificación y la bandeja:
   - ✅ "BYD Song Plus"
   - ✅ "QQQ-333"
   - ✅ "Se me desvaró en la autopista"
   - ✅ Icono 🚙 (camioneta)

### Prueba 2: Recargar Bandeja (REST API)

1. **Conductor:** Cierra y abre la app
2. **Conductor:** Arrastra para refrescar la bandeja
3. **Verifica:** Los datos del vehículo siguen visibles correctamente

---

## 📝 Notas Técnicas

### ¿Por qué dos fuentes de datos?

El sistema tiene dos formas de enviar solicitudes a los conductores:

1. **Socket.IO (`request:received`):** 
   - Notificación instantánea cuando se crea una nueva solicitud
   - Más rápido pero requiere que el conductor esté conectado

2. **REST API (`/api/requests/nearby/:driverId`):**
   - Carga inicial al abrir la app
   - Refresco manual (pull-to-refresh)
   - Más lento pero garantiza que no se pierden solicitudes

Ambas rutas ahora envían la misma estructura de datos para consistencia.

---

## ✅ Estado: COMPLETADO Y LISTO PARA PRUEBA

