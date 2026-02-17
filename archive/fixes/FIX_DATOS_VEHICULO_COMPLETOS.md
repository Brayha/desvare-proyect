# Fix: Mostrar Datos Completos del Vehículo + Icono Correcto

## Fecha
31 de Enero, 2026

## Problemas Identificados

### 1. Datos Adicionales No Se Mostraban
Los conductores no podían ver los datos adicionales de los vehículos (largo, alto, tipo de llanta, tonelaje, capacidad de pasajeros, etc.) en las vistas de **RequestDetail**, **QuoteDetail** y **ActiveService**.

### 2. Icono Incorrecto del Vehículo
El icono del vehículo mostraba siempre un automóvil 🚗, independientemente del tipo real del vehículo (camión 🚚, bus 🚌, etc.).

## Causa Raíz

**Problema 1 - Datos Faltantes**: Cadena de comunicación incompleta
1. **Backend Socket.IO** - No enviaba `vehicleSnapshot` ni `serviceDetails` completos
2. **Backend REST API** - No incluía `vehicleSnapshot` en respuestas
3. **Frontend Listener** - No preservaba los datos al normalizar

**Problema 2 - Icono Incorrecto**: Ubicación incorrecta
- Buscaba el icono en `request.vehicleSnapshot.vehicle?.icon` (no existe)
- Debía buscar en `request.vehicleSnapshot.category?.id` (CAMIONES, BUSES, etc.)

## Solución Completa

### 1. Backend - Socket.IO (`backend/server.js`)
**Líneas**: 213-237

Agregado `vehicleSnapshot` y `serviceDetails` completos:

```javascript
io.to('active-drivers').emit('request:received', {
  // ... otros campos
  vehicle: { category, brand, model, licensePlate, icon },
  vehicleSnapshot: data.vehicleSnapshot,  // ✅ NUEVO
  serviceDetails: data.serviceDetails,    // ✅ NUEVO
});
```

### 2. Backend - REST API (`backend/routes/requests.js`)
**Líneas**: 596-620

```javascript
const formattedRequests = requests.map(req => ({
  vehicle: { /* datos básicos */ },
  vehicleSnapshot: req.vehicleSnapshot,  // ✅ NUEVO
}));
```

### 3. Frontend - Home.jsx
**Líneas**: 130-165

Preserva los datos al normalizar:

```javascript
const normalizedRequest = {
  ...request,
  vehicleSnapshot: request.vehicleSnapshot,  // ✅ NUEVO
  serviceDetails: request.serviceDetails,    // ✅ NUEVO
};
```

### 4. Frontend - Todas las Vistas

#### Fix del Icono + Badges Implementados

**RequestDetail.jsx** (líneas 113-131, 271-352)
**QuoteDetail.jsx** (líneas 196-220, 530-649)
**ActiveService.jsx** (líneas 260-278, 619-698)

**A. Función `getVehicleIcon` actualizada:**

```javascript
const getVehicleIcon = (iconEmoji) => {
  // Mapeo de emojis (compatibilidad)
  const iconMap = {
    "🏍️": motoIcon,
    "🚗": carIcon,
    "🚙": camionetaIcon,
    "🚚": camionIcon,
    "🚌": busIcon,
  };
  
  // Mapeo de IDs (nuevo)
  const categoryMap = {
    "MOTOS": motoIcon,
    "AUTOS": carIcon,
    "CAMIONETAS": camionetaIcon,
    "CAMIONES": camionIcon,
    "BUSES": busIcon,
  };
  
  return iconMap[iconEmoji] || categoryMap[iconEmoji] || carIcon;
};
```

**B. Uso correcto del icono:**

```javascript
// ❌ ANTES (QuoteDetail)
<img src={getVehicleIcon(request.vehicleSnapshot.vehicle?.icon)} />

// ✅ AHORA
<img src={getVehicleIcon(request.vehicleSnapshot.category?.id || "🚗")} />
```

**C. Badges de datos adicionales implementados:**

```javascript
{(request.vehicleSnapshot?.isArmored ||
  request.serviceDetails?.basement?.isInBasement ||
  request.vehicleSnapshot?.truckData ||
  request.vehicleSnapshot?.busData) && (
  <div className="vehicle-additional-details">
    {/* Camiones */}
    {request.vehicleSnapshot?.truckData && (
      <>
        <div className="detail-badge">🚛 {trailerType}</div>
        <div className="detail-badge">🛞 {axleType}</div>
        <div className="detail-badge">📏 Largo: {length} m</div>
        <div className="detail-badge">📐 Alto: {height} m</div>
        <div className="detail-badge">⚖️ {tonnage} ton</div>
      </>
    )}
    
    {/* Buses */}
    {request.vehicleSnapshot?.busData && (
      <>
        <div className="detail-badge">👥 {passengerCapacity} pasajeros</div>
        <div className="detail-badge">🛞 {axleType}</div>
        <div className="detail-badge">📏 Largo: {length} m</div>
        <div className="detail-badge">📐 Alto: {height} m</div>
      </>
    )}
    
    {/* Comunes */}
    {request.vehicleSnapshot?.isArmored && (
      <div className="detail-badge">🛡️ Blindado</div>
    )}
    {request.serviceDetails?.basement?.isInBasement && (
      <div className="detail-badge">🏢 Sótano nivel {level}</div>
    )}
  </div>
)}
```

### 5. Estilos CSS

**RequestDetail.css**, **QuoteDetail.css**, **ActiveService.css**

```css
.vehicle-additional-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 5px;
}

.detail-badge {
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
```

## Datos Mostrados

### Para CAMIONES
- 🚛 Tipo de trailer
- 🛞 Tipo de llanta
- 📏 Largo (m)
- 📐 Alto (m)
- ⚖️ Tonelaje
- 📦 Carga actual (si aplica)

### Para BUSES
- 👥 Pasajeros
- 🛞 Tipo de llanta
- 📏 Largo (m)
- 📐 Alto (m)

### Para TODOS
- 🛡️ Blindado
- 🏢 Sótano + nivel

## Mapeo de Iconos

| Categoría ID | Emoji | Icono SVG |
|-------------|-------|-----------|
| MOTOS | 🏍️ | motoIcon |
| AUTOS | 🚗 | carIcon |
| CAMIONETAS | 🚙 | camionetaIcon |
| CAMIONES | 🚚 | camionIcon |
| BUSES | 🚌 | busIcon |

## Archivos Modificados

### Backend (2)
1. `backend/server.js`
2. `backend/routes/requests.js`

### Frontend - Lógica (4)
3. `driver-app/src/pages/Home.jsx`
4. `driver-app/src/pages/RequestDetail.jsx`
5. `driver-app/src/pages/QuoteDetail.jsx`
6. `driver-app/src/pages/ActiveService.jsx`

### Frontend - Estilos (3)
7. `driver-app/src/pages/RequestDetail.css`
8. `driver-app/src/pages/QuoteDetail.css`
9. `driver-app/src/pages/ActiveService.css`

## Resultado

✅ Iconos correctos en todas las vistas
✅ Badges con información técnica completa
✅ Conductor puede decidir mejor si aceptar el servicio
✅ Evita aceptar servicios que no puede completar

## Nota Importante

Solo las **nuevas solicitudes** mostrarán los cambios completos.
