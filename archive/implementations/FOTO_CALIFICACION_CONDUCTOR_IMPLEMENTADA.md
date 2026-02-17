# Foto y Calificación Real del Conductor - PWA

## Fecha
31 de Enero, 2026

## Implementación Completada

Se ha implementado la funcionalidad para mostrar la **foto real** y **calificación real** del conductor en el modal de cotizaciones del cliente (PWA).

## Cambios Realizados

### 1. Backend - Socket.IO (`backend/server.js`)

**Líneas modificadas**: ~245-282

**Cambio**: Cuando un conductor envía una cotización, el backend ahora busca información completa del conductor y la incluye en el evento Socket.IO.

```javascript
socket.on('quote:send', async (data) => {
  // Buscar información completa del conductor
  const driver = await User.findById(data.driverId);
  
  const quoteData = {
    requestId: data.requestId,
    driverId: data.driverId,
    driverName: data.driverName,
    amount: data.amount,
    location: data.location,
    // ✅ NUEVOS CAMPOS
    driverPhoto: driver.driverProfile?.documents?.selfie || null,
    driverRating: driver.driverProfile?.rating || 5,
    driverServiceCount: driver.driverProfile?.totalServices || 0,
    timestamp: new Date()
  };
  
  io.to(clientSocketId).emit('quote:received', quoteData);
});
```

### 2. Backend - REST API (`backend/routes/requests.js`)

**Líneas modificadas**: ~482-560

**Cambio**: El endpoint `GET /api/requests/:id` ahora enriquece las cotizaciones con datos del conductor.

```javascript
// Enriquecer las cotizaciones con datos del conductor
const enrichedQuotes = await Promise.all(
  request.quotes.map(async (quote) => {
    const driver = await User.findById(quote.driverId);
    return {
      ...quote.toObject(),
      // Agregar información del conductor
      driverPhoto: driver?.driverProfile?.documents?.selfie || null,
      driverRating: driver?.driverProfile?.rating || 5,
      driverServiceCount: driver?.driverProfile?.totalServices || 0
    };
  })
);

// Devolver quotes enriquecidas
res.json({
  request: {
    quotes: enrichedQuotes,
    quotesCount: enrichedQuotes.length,
    // ... otros campos
  }
});
```

### 3. Frontend PWA - QuoteDetailSheet (`client-pwa/src/components/QuoteDetailSheet/QuoteDetailSheet.jsx`)

**Líneas modificadas**: ~32-49, ~132-151

**Cambios**:

1. **Extraer datos reales del conductor** (líneas 45-48):
```javascript
const driverPhoto = quote.driverPhoto || "https://ionicframework.com/docs/img/demos/avatar.svg";
const driverRating = quote.driverRating || 5;
const driverServiceCount = quote.driverServiceCount || 0;
```

2. **Mostrar foto real del conductor** (líneas 136-146):
```jsx
<div className="driver-avatar">
  {quote.driverPhoto ? (
    <img 
      src={driverPhoto} 
      alt={quote.driverName}
      onError={(e) => {
        // Fallback a inicial si falla la carga
        e.target.style.display = 'none';
        e.target.parentElement.textContent = quote.driverName?.charAt(0) || "C";
      }}
    />
  ) : (
    quote.driverName?.charAt(0) || "C"
  )}
</div>
```

3. **Mostrar calificación y servicios reales** (líneas 152-158):
```jsx
<div className="rating-compact">
  <IonIcon icon={star} className="star-icon" />
  <span>{driverRating.toFixed(1)}</span>
  <span className="service-count">({driverServiceCount} servicios)</span>
</div>
```

### 4. Frontend PWA - WaitingQuotes (`client-pwa/src/pages/WaitingQuotes.jsx`)

**Líneas modificadas**: ~194-221, ~425-441

**Cambios**:

1. **Socket.IO Listener** - Agregados logs para debugging (líneas 194-221):
```javascript
socketService.onQuoteReceived((quote) => {
  console.log("📸 Foto del conductor:", quote.driverPhoto || "❌ Sin foto");
  console.log("⭐ Rating del conductor:", quote.driverRating || "❌ Sin rating");
  console.log("🚗 Servicios completados:", quote.driverServiceCount || "❌ Sin servicios");
  // ... resto del código
});
```

2. **Pull to Refresh** - Incluir nuevos campos al mapear (líneas 429-441):
```javascript
const formattedQuotes = data.request.quotes.map((q) => ({
  driverId: q.driverId,
  driverName: q.driverName,
  amount: q.amount,
  location: q.location || null,
  timestamp: q.timestamp,
  // ✅ NUEVOS CAMPOS
  driverPhoto: q.driverPhoto || null,
  driverRating: q.driverRating || 5,
  driverServiceCount: q.driverServiceCount || 0
}));
```

### 5. Frontend PWA - Estilos (`client-pwa/src/components/QuoteDetailSheet/QuoteDetailSheet.css`)

**Líneas modificadas**: ~56-69

**Cambio**: Agregados estilos para que la imagen se muestre correctamente dentro del avatar circular.

```css
.driver-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
  overflow: hidden; /* ✅ NUEVO */
}

.driver-avatar img {  /* ✅ NUEVO */
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

## Datos del Modelo User (Conductor)

Los datos vienen del modelo `User` con `userType: 'driver'`:

```javascript
{
  driverProfile: {
    documents: {
      selfie: String, // URL de la foto del conductor
      // ... otros documentos
    },
    rating: Number, // Default: 5, Range: 1-5
    totalServices: Number, // Default: 0
    // ... otros campos
  }
}
```

## Flujo de Datos

### 1. En Tiempo Real (Socket.IO)
```
Conductor envía cotización
  ↓
Backend busca datos del conductor (foto, rating, servicios)
  ↓
Backend emite evento 'quote:received' con datos completos
  ↓
Cliente recibe cotización con foto y rating
  ↓
PWA muestra foto y calificación en QuoteDetailSheet
```

### 2. Al Recargar (REST API)
```
Cliente solicita GET /api/requests/:id
  ↓
Backend obtiene request con cotizaciones
  ↓
Backend enriquece cada cotización con datos del conductor
  ↓
Cliente recibe cotizaciones enriquecidas
  ↓
PWA muestra foto y calificación en QuoteDetailSheet
```

## Comportamiento

### Con Foto del Conductor
- ✅ Se muestra la foto real del conductor en el avatar circular
- ✅ Si la foto falla al cargar, muestra la inicial del nombre como fallback

### Sin Foto del Conductor
- ✅ Muestra la inicial del nombre del conductor
- ✅ Con fondo degradado morado (gradiente existente)

### Calificación y Servicios
- ✅ Muestra el rating real con 1 decimal (ej: 4.8)
- ✅ Muestra el número real de servicios completados
- ✅ Fallback a 5.0 y 0 servicios si no hay datos

## Ejemplo de Respuesta

### Socket.IO Event: `quote:received`
```javascript
{
  requestId: "697e3a309b5e07219e17b574b",
  driverId: "693a2c16d33f0bd24299a42e",
  driverName: "Pepito Perez",
  amount: 120000,
  location: { type: "Point", coordinates: [-74.0817, 4.6097] },
  driverPhoto: "https://desvare-spaces.nyc3.digitaloceanspaces.com/selfies/123.jpg",
  driverRating: 4.8,
  driverServiceCount: 127,
  timestamp: "2026-01-31T17:30:00.000Z"
}
```

### REST API Response: `GET /api/requests/:id`
```javascript
{
  request: {
    quotes: [
      {
        driverId: "693a2c16d33f0bd24299a42e",
        driverName: "Pepito Perez",
        amount: 120000,
        status: "pending",
        driverPhoto: "https://desvare-spaces.nyc3.digitaloceanspaces.com/selfies/123.jpg",
        driverRating: 4.8,
        driverServiceCount: 127,
        timestamp: "2026-01-31T17:30:00.000Z"
      }
    ]
  }
}
```

## Próximas Mejoras (Opcionales)

### 1. Sistema de Reseñas Completo
Actualmente las reseñas en el slider son estáticas (hardcoded). Para implementar reseñas reales:

1. **Crear modelo `Rating`**:
```javascript
const ratingSchema = new mongoose.Schema({
  requestId: { type: ObjectId, ref: 'Request' },
  driverId: { type: ObjectId, ref: 'User' },
  clientId: { type: ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});
```

2. **Agregar al backend**:
```javascript
// Al enriquecer cotizaciones, agregar últimas 3-5 reseñas
const reviews = await Rating.find({ driverId: quote.driverId })
  .sort({ createdAt: -1 })
  .limit(5)
  .populate('clientId', 'name');

quoteData.driverReviews = reviews.map(r => ({
  clientName: r.clientId.name.split(' ')[0] + ' ' + r.clientId.name.split(' ')[1]?.charAt(0) + '.',
  rating: r.rating,
  comment: r.comment,
  date: formatRelativeDate(r.createdAt)
}));
```

3. **Actualizar frontend**:
```jsx
// Usar reviews reales en lugar de array hardcoded
const reviews = quote.driverReviews || [];
```

### 2. Avatar Placeholder Mejorado
- Generar avatares con colores basados en el ID del conductor
- Usar servicio como Gravatar o DiceBear para avatares generativos

### 3. Verificación de Conductor
- Badge de "Verificado" si el conductor tiene documentos aprobados
- Badge de "Top Conductor" si tiene rating > 4.5 y > 50 servicios

## Archivos Modificados

1. ✅ `backend/server.js` - Socket.IO handler (envío de cotizaciones)
2. ✅ `backend/routes/requests.js` - REST API endpoints (envío y aceptación de cotizaciones)
3. ✅ `client-pwa/src/components/QuoteDetailSheet/QuoteDetailSheet.jsx` - Componente React
4. ✅ `client-pwa/src/components/QuoteDetailSheet/QuoteDetailSheet.css` - Estilos
5. ✅ `client-pwa/src/pages/WaitingQuotes.jsx` - Pull to refresh + logs de debugging
6. ✅ `client-pwa/src/pages/DriverOnWay.jsx` - Vista de conductor en camino

## Testing

Para probar:

1. **Como conductor**: Envía una cotización a una solicitud
2. **Como cliente**: Abre la solicitud y verás la cotización con:
   - ✅ Foto real del conductor (si tiene)
   - ✅ Calificación real del conductor
   - ✅ Número real de servicios completados

**Nota**: Los conductores existentes pueden tener:
- Rating: 5.0 (default)
- Total Services: 0 (default)
- Foto: Solo si la subieron durante el registro

## Resultado Visual

**Antes**:
- Avatar con inicial del nombre
- Rating fijo: 4.8
- Servicios fijos: 127

**Ahora**:
- ✅ Foto real del conductor (o inicial como fallback)
- ✅ Rating real del conductor (con 1 decimal)
- ✅ Servicios reales completados

Esto genera mayor **confianza** en el cliente al ver información real y verificable del conductor antes de aceptar una cotización.

---

## Actualización: Vista "Conductor en Camino"

### Problema Detectado
Después de aceptar una cotización, en la vista `DriverOnWay.jsx` no se mostraba la foto del conductor, aunque la lógica de renderizado ya existía.

### Solución Implementada

#### Backend - Endpoint de Aceptación (`backend/routes/requests.js`)

**Líneas modificadas**: ~344-362

Cuando un cliente acepta una cotización, el backend ahora incluye la foto del conductor:

```javascript
// Preparar datos del conductor para el cliente
const driverInfo = {
  id: driver._id,
  name: driver.name,
  phone: driver.phone,
  photo: driver.driverProfile?.documents?.selfie || null, // ✅ AGREGADO
  rating: driver.driverProfile.rating,
  totalServices: driver.driverProfile.totalServices,
  towTruck: driver.driverProfile.towTruck,
  vehicleCapabilities: driver.driverProfile.vehicleCapabilities
};

// Debug log para verificar
console.log('🔍 DEBUG - driverInfo preparado:', {
  id: driverInfo.id,
  name: driverInfo.name,
  tieneFoto: !!driverInfo.photo,
  photo: driverInfo.photo ? `${driverInfo.photo.substring(0, 50)}...` : '❌ Sin foto',
  rating: driverInfo.rating
});
```

#### Flujo de Datos

1. **Cliente acepta cotización** en `WaitingQuotes.jsx`
2. **Backend responde** con `request.assignedDriver` que incluye `photo`
3. **WaitingQuotes guarda** en `localStorage` como `activeService.driver`
4. **DriverOnWay.jsx lee** `serviceData.driver.photo` y lo renderiza

#### Frontend - DriverOnWay.jsx

**Líneas**: 319-332 (ya implementado, solo faltaba el dato)

```jsx
<div className="driver-avatar-small">
  {serviceData.driver?.photo ? (
    <img 
      src={serviceData.driver.photo} 
      alt={serviceData.driver?.name} 
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.parentElement.textContent = 
          serviceData.driver?.name?.charAt(0) || "C";
      }}
    />
  ) : (
    serviceData.driver?.name?.charAt(0) || "C"
  )}
</div>
```

### Resultado

Ahora la foto del conductor aparece en **todas** las vistas:
- ✅ Modal de cotizaciones (`QuoteDetailSheet`)
- ✅ Vista de conductor en camino (`DriverOnWay`)
- ✅ Consistencia en toda la experiencia del usuario

---

## Mejora: Visualización de Rating con Estrellas Dinámicas

### Implementación en DriverOnWay.jsx

Se ha mejorado la visualización del rating del conductor para mostrar estrellas dinámicas (⭐) en lugar de un ícono con número.

#### Función de Renderizado

**Líneas agregadas**: ~103-116

```javascript
// Generar estrellas dinámicamente basadas en el rating
const renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <>
      {"⭐".repeat(fullStars)}
      {hasHalfStar && "⭐"}
      {"☆".repeat(emptyStars)}
    </>
  );
};
```

#### Ejemplos de Visualización

| Rating | Visualización |
|--------|---------------|
| 5.0    | ⭐⭐⭐⭐⭐     |
| 4.8    | ⭐⭐⭐⭐⭐     |
| 4.4    | ⭐⭐⭐⭐☆     |
| 3.7    | ⭐⭐⭐⭐☆     |
| 3.2    | ⭐⭐⭐☆☆     |

#### Cambios en el Componente

**Antes**:
```jsx
<div className="confirm-driver-info-meta">
  <IonIcon icon={star} className="star-icon" />
  <span>{serviceData.driver?.rating || "4.8"}</span>
  <span className="separator">•</span>
  <span>{serviceData.driver?.totalServices || "0"} servicios</span>
</div>
```

**Ahora**:
```jsx
<div className="confirm-driver-info-meta">
  <span className="stars-rating">
    {renderStars(serviceData.driver?.rating || 5)}
  </span>
  <span className="separator">•</span>
  <span>{serviceData.driver?.totalServices || "0"} servicios</span>
</div>
```

#### Estilos CSS Agregados

**Archivo**: `client-pwa/src/pages/DriverOnWay.css`

```css
.confirm-driver-info-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stars-rating {
  font-size: 14px;
  line-height: 1;
  letter-spacing: 1px;
}
```

#### Ventajas

1. **Visual más intuitivo**: Las estrellas son universalmente reconocidas
2. **Consistencia**: Similar a los reviews en `QuoteDetailSheet`
3. **Dinámico**: Se genera automáticamente según el rating real del conductor
4. **Limpio**: Elimina dependencia de iconos de Ionic para el rating

---

## Mejora: Datos Reales de Cotización en DriverOnWay

### Problema
En la vista `DriverOnWay.jsx`, los valores de la cotización estaban hardcodeados:
- Valor: `$90.000` (fijo)
- Método de pago: `Efectivo` (fijo)

### Solución Implementada

Se ha actualizado para mostrar los datos reales de la cotización aceptada.

#### Función de Formateo de Moneda

**Líneas agregadas**: ~119-127

```javascript
// Formatear el monto como moneda colombiana
const formatAmount = (amount) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
```

#### Actualización del Componente

**Antes**:
```jsx
<div className="info-item">
  <p>Valor</p>
  <h4>$90.000</h4>
</div>
<div className="info-item">
  <p>Método de pago</p>
  <h4>Efectivo</h4>
</div>
```

**Ahora**:
```jsx
<div className="info-item">
  <p>Valor</p>
  <h4>{formatAmount(serviceData.amount || 0)}</h4>
</div>
<div className="info-item">
  <p>Método de pago</p>
  <h4>{serviceData.paymentMethod || "Efectivo"}</h4>
</div>
```

#### Datos Disponibles en serviceData

El objeto `serviceData` (cargado desde `localStorage.getItem("activeService")`) contiene:

```javascript
{
  requestId: "...",
  driver: {...},
  securityCode: "1234",
  amount: 120000,              // ✅ Monto real de la cotización
  paymentMethod: "Efectivo",   // Por defecto
  origin: {...},
  destination: {...},
  vehicle: {...},
  vehicleSnapshot: {...},
  problem: "...",
  serviceDetails: {...}
}
```

#### Resultado

- ✅ Muestra el **monto real** de la cotización aceptada
- ✅ Formateado correctamente como moneda colombiana (COP)
- ✅ Método de pago con valor por defecto "Efectivo" (preparado para futuros métodos)

#### Mejoras Futuras

Cuando se implemente el sistema de múltiples métodos de pago:
1. Agregar `paymentMethod` al modelo `Request`
2. Permitir que el cliente seleccione el método de pago al aceptar
3. Guardar `paymentMethod` en `activeService`
4. El componente ya está listo para mostrar el método seleccionado

---

## Mejora: Placa Real de la Grúa del Conductor

### Problema
La placa del vehículo del conductor (grúa) estaba hardcodeada como `"eer-456"`, lo que no permitía al cliente identificar correctamente qué grúa iba a llegar.

### Solución Implementada

Se ha actualizado para mostrar la **placa real** de la grúa del conductor desde la base de datos.

#### Estructura de Datos

El objeto `serviceData.driver` (recibido del backend al aceptar una cotización) incluye:

```javascript
{
  id: "...",
  name: "Pepito perez",
  phone: "3001234567",
  photo: "https://...",
  rating: 5,
  totalServices: 10,
  towTruck: {
    truckType: "GRUA_LIVIANA",
    licensePlate: "ABC-123",    // ✅ Placa real
    baseBrand: "Chevrolet",
    baseModel: "NPR",
    year: 2020,
    photoUrl: "https://...",
    // ... otros campos
  },
  vehicleCapabilities: ["AUTOS", "CAMIONETAS"]
}
```

#### Función de Formateo de Placa

**Líneas agregadas**: ~129-142

```javascript
// Formatear placa con guión después de 3 caracteres (ABC-123)
const formatLicensePlate = (plate) => {
  if (!plate) return "Sin placa";
  
  // Limpiar la placa (eliminar espacios y guiones existentes)
  const cleanPlate = plate.replace(/[\s-]/g, '').toUpperCase();
  
  // Si tiene más de 3 caracteres, agregar el guión
  if (cleanPlate.length > 3) {
    return `${cleanPlate.slice(0, 3)}-${cleanPlate.slice(3)}`;
  }
  
  return cleanPlate;
};
```

**Características**:
- Limpia espacios y guiones existentes
- Convierte a mayúsculas
- Agrega el guión automáticamente después de los 3 primeros caracteres
- Formato estándar colombiano: **ABC-123**

#### Actualización del Componente

**Antes**:
```jsx
<p className="vehicle-plate-confirmed-driver-on-way">eer-456</p>
```

**Ahora**:
```jsx
<p className="vehicle-plate-confirmed-driver-on-way">
  {formatLicensePlate(serviceData.driver?.towTruck?.licensePlate)}
</p>
```

**Ejemplos de formateo**:
| Entrada BD     | Salida Mostrada |
|----------------|-----------------|
| `"ABC123"`     | `ABC-123`       |
| `"abc123"`     | `ABC-123`       |
| `"ABC-123"`    | `ABC-123`       |
| `"ABC 123"`    | `ABC-123`       |
| `null`         | `Sin placa`     |

#### Información Completa del Conductor

Ahora la vista muestra:
```
┌─────────────────────────────────┐
│  [FOTO] Pepito perez            │
│         ⭐⭐⭐⭐⭐ • 10 servicios │
│         ABC-123                  │
│                                  │
│  [Llamar]                        │
└─────────────────────────────────┘
```

#### Ventajas

1. ✅ **Identificación precisa**: El cliente puede reconocer la grúa por su placa
2. ✅ **Seguridad**: Confirma que es el conductor correcto
3. ✅ **Profesionalismo**: Información completa y verificable
4. ✅ **Datos reales**: Sincronizado con la base de datos

#### Backend - Modelo User.js

El campo `towTruck.licensePlate` está definido en el modelo:

```javascript
towTruck: {
  licensePlate: {
    type: String,
    uppercase: true  // Se guarda en mayúsculas automáticamente
  },
  // ... otros campos
}
```

Este campo es completado por el conductor durante su registro y puede ser actualizado desde el perfil.

---

## Mejora: Corrección de Estilos en DriverOnWay

### Problemas Detectados

1. **Imagen del conductor**: No se recortaba correctamente en forma circular
2. **Placa del vehículo**: Se mostraba en una segunda línea en lugar de estar en la misma fila

### Solución Implementada

#### 1. Imagen Circular del Conductor

**Archivo**: `client-pwa/src/pages/DriverOnWay.css`

**Antes**:
```css
.driver-avatar-small {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  /* ... otros estilos ... */
}
```

**Ahora**:
```css
.driver-avatar-small {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden; /* ✅ Recorta la imagen en círculo */
  /* ... otros estilos ... */
}

.driver-avatar-small img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* ✅ Mantiene proporciones y rellena el círculo */
}
```

#### 2. Placa en la Misma Línea

**Cambios en CSS**:

```css
/* Contenedor principal - evita wrap */
.confirm-driver-info-header-compact {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap; /* ✅ No permite saltos de línea */
}

/* Detalles del conductor - ajuste flexible */
.confirm-driver-info-details {
  display: flex;
  flex-direction: column;
  flex: 1; /* ✅ Toma espacio disponible */
  min-width: 0; /* ✅ Permite ajuste correcto */
}

/* Placa - mantiene en una línea */
.vehicle-plate-confirmed-driver-on-way {
  display: inline-flex; /* ✅ inline-flex en lugar de flex */
  padding: 5px 10px;
  white-space: nowrap; /* ✅ Texto en una sola línea */
  flex-shrink: 0; /* ✅ No se encoge */
  margin: 0;
  /* ... otros estilos ... */
}
```

#### Resultado Visual

**Antes**:
```
┌────────────────────────────┐
│ [IMG]  Pepito perez        │
│        ⭐⭐⭐⭐⭐ • 10 serv. │
│ ABC-123                     │  ← En segunda línea ❌
└────────────────────────────┘
```

**Ahora**:
```
┌────────────────────────────────┐
│ [●]  Pepito perez    [ABC-123] │  ← Todo en una línea ✅
│      ⭐⭐⭐⭐⭐ • 10 servicios   │
└────────────────────────────────┘
```

#### Ventajas

1. ✅ **Imagen circular perfecta**: La foto se recorta correctamente
2. ✅ **Layout compacto**: Toda la información principal en una línea
3. ✅ **Mejor UX**: Más fácil de leer y visualmente más limpio
4. ✅ **Responsive**: Se mantiene en una línea incluso en pantallas pequeñas

---

## Mejora: Estrellas Dinámicas en QuoteDetailSheet

### Implementación

Se ha actualizado `QuoteDetailSheet.jsx` para usar el mismo sistema de estrellas dinámicas que `DriverOnWay.jsx`, proporcionando consistencia visual en toda la aplicación.

#### Función de Renderizado

**Archivo**: `client-pwa/src/components/QuoteDetailSheet/QuoteDetailSheet.jsx`

**Líneas agregadas**: ~44-56

```javascript
// Generar estrellas dinámicamente basadas en el rating
const renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <>
      {"⭐".repeat(fullStars)}
      {hasHalfStar && "⭐"}
      {"☆".repeat(emptyStars)}
    </>
  );
};
```

#### Actualización del Componente

**Antes**:
```jsx
<div className="rating-compact">
  <IonIcon icon={star} className="star-icon" />
  <span>{driverRating.toFixed(1)}</span>
  <span className="service-count">({driverServiceCount} servicios)</span>
</div>
```

**Ahora**:
```jsx
<div className="rating-compact">
  <span className="stars-rating">
    {renderStars(driverRating)}
  </span>
  <span className="service-count">• {driverServiceCount} servicios</span>
</div>
```

#### Estilos CSS Actualizados

**Archivo**: `client-pwa/src/components/QuoteDetailSheet/QuoteDetailSheet.css`

```css
.rating-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.stars-rating {
  font-size: 14px;
  line-height: 1;
  letter-spacing: 1px;
}

.service-count {
  color: #666;
  font-size: 13px;
}
```

#### Resultado Visual

**Antes**:
```
Pepito perez
⭐ 5.0 (10 servicios)
```

**Ahora**:
```
Pepito perez
⭐⭐⭐⭐⭐ • 10 servicios
```

#### Ventajas

1. ✅ **Consistencia**: Mismo estilo en `QuoteDetailSheet` y `DriverOnWay`
2. ✅ **Visual intuitivo**: Las estrellas son más reconocibles que números
3. ✅ **Limpieza**: Eliminada dependencia de iconos de Ionic para rating
4. ✅ **Dinámico**: Se adapta automáticamente al rating real del conductor

#### Ubicaciones con Estrellas Dinámicas

Ahora el sistema de estrellas está implementado en:
- ✅ `client-pwa/src/pages/DriverOnWay.jsx` (Vista de conductor en camino)
- ✅ `client-pwa/src/components/QuoteDetailSheet/QuoteDetailSheet.jsx` (Modal de detalle de cotización)
