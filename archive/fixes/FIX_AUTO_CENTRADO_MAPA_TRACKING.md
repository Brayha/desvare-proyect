# 🗺️ Fix: Auto-centrado del Mapa en Tracking

## Fecha
1 de Febrero, 2026

## Problema Reportado

Después de implementar el sistema de tracking en tiempo real, el conductor aparecía en el mapa pero **el usuario tenía que buscarlo manualmente** haciendo zoom out o moviendo el mapa.

**Experiencia esperada**: Como en Uber/Didi, el mapa debería ajustarse automáticamente para mostrar tanto el origen (punto de recogida) como la ubicación del conductor en tiempo real.

## Solución Implementada

Se agregó un nuevo `useEffect` en `MapPicker.jsx` que detecta cuando llega la ubicación del conductor y ajusta el viewport del mapa automáticamente.

### Archivo Modificado

**`client-pwa/src/components/Map/MapPicker.jsx`**

**Líneas agregadas**: ~135-161 (después del useEffect de quotes, antes de `calculateRoute`)

```javascript
// 🆕 Ajustar viewport cuando aparece la ubicación del conductor (tracking en tiempo real)
useEffect(() => {
  if (!origin || !driverLocation || !mapRef.current || !isMapLoaded) return;

  console.log('🚗 Ajustando mapa para mostrar conductor + origen');

  // Crear bounds que incluyan origen y conductor
  const coordinates = [
    [origin.lng, origin.lat],
    [driverLocation.lng, driverLocation.lat]
  ];

  const bounds = coordinates.reduce((bounds, coord) => {
    return bounds.extend(coord);
  }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

  // Aplicar bounds con padding generoso
  mapRef.current.fitBounds(bounds, {
    padding: {
      top: 100,
      bottom: 250,  // Espacio para la tarjeta del conductor
      left: 80,
      right: 80,
    },
    duration: 1500,
    maxZoom: 15, // No acercar demasiado
  });
}, [driverLocation, origin, isMapLoaded]);
```

## Cómo Funciona

### 1. **Detección de Cambios**
El `useEffect` se ejecuta cuando:
- ✅ Cambia `driverLocation` (nueva ubicación GPS del conductor)
- ✅ Cambia `origin` (punto de recogida)
- ✅ El mapa está cargado (`isMapLoaded`)

### 2. **Validación de Datos**
```javascript
if (!origin || !driverLocation || !mapRef.current || !isMapLoaded) return;
```
Solo se ejecuta si todos los datos necesarios están disponibles.

### 3. **Cálculo de Bounds**
```javascript
const coordinates = [
  [origin.lng, origin.lat],        // 📍 Punto de recogida
  [driverLocation.lng, driverLocation.lat]  // 🚗 Conductor
];

const bounds = coordinates.reduce((bounds, coord) => {
  return bounds.extend(coord);
}, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
```
Crea un rectángulo (bounds) que incluye ambos puntos.

### 4. **Aplicación del Viewport**
```javascript
mapRef.current.fitBounds(bounds, {
  padding: {
    top: 100,      // Espacio superior para el header
    bottom: 250,   // Espacio inferior para la tarjeta del conductor
    left: 80,      // Espacio lateral izquierdo
    right: 80,     // Espacio lateral derecho
  },
  duration: 1500,  // Animación suave de 1.5 segundos
  maxZoom: 15,     // No acercar demasiado (mantener contexto)
});
```

## Padding Explicado

El padding asegura que los elementos importantes no queden ocultos por la UI:

```
┌─────────────────────────────┐
│  top: 100px (header)        │
│                             │
│  🚗 ← Conductor visible     │
│                             │
│  📍 ← Origen visible        │
│                             │
│  bottom: 250px (tarjeta)    │
└─────────────────────────────┘
   ↑                       ↑
 left: 80px          right: 80px
```

## Comportamiento

### Primera Carga
1. Cliente acepta cotización
2. Navega a `DriverOnWay.jsx`
3. Socket.IO recibe primera ubicación del conductor
4. **Mapa se ajusta automáticamente** para mostrar ambos puntos

### Actualizaciones en Tiempo Real
1. Conductor se mueve (cada 10 metros)
2. Nueva ubicación llega vía Socket.IO
3. `driverLocation` se actualiza en el estado
4. **Mapa se re-ajusta suavemente** (animación de 1.5s)

### Zoom Inteligente
- ✅ Si conductor está lejos → Zoom out para mostrar ambos
- ✅ Si conductor está cerca → Zoom moderado (max 15)
- ✅ Siempre mantiene contexto visual (no acerca demasiado)

## Ejemplo Visual

### Antes (sin auto-centrado)
```
Usuario ve solo el origen 📍
Tiene que buscar manualmente al conductor 🚗
```

### Después (con auto-centrado)
```
┌──────────────────────┐
│                      │
│   🚗 Conductor       │
│    ↓ 2.5 km         │
│   📍 Origen          │
│                      │
└──────────────────────┘
Ambos visibles automáticamente
```

## Integración con Sistema de Tracking

Este fix complementa el sistema de tracking implementado previamente:

1. **Backend** (`server.js`): Recibe ubicación GPS del conductor
2. **Socket.IO**: Envía ubicación al cliente específico
3. **DriverOnWay.jsx**: Actualiza estado `driverLocation`
4. **MapPicker.jsx**: 
   - Renderiza marcador circular del conductor
   - **🆕 Auto-centra el mapa** ← Este fix

## Testing

### Escenario 1: Primera Carga
1. Cliente acepta cotización
2. Abre vista `DriverOnWay`
3. ✅ Mapa debe mostrar automáticamente conductor + origen

### Escenario 2: Conductor en Movimiento
1. Conductor se mueve hacia el origen
2. Cada 10 metros envía nueva ubicación
3. ✅ Mapa debe re-ajustarse suavemente

### Escenario 3: Conductor Muy Lejos
1. Conductor está a 10+ km del origen
2. ✅ Mapa debe hacer zoom out suficiente para mostrar ambos

### Escenario 4: Conductor Muy Cerca
1. Conductor está a < 500m del origen
2. ✅ Mapa debe mantener zoom máximo 15 (no acercar demasiado)

## Logs de Consola

Cuando el mapa se ajusta, verás:
```
🚗 Ajustando mapa para mostrar conductor + origen
```

## Archivos Modificados

1. ✅ `client-pwa/src/components/Map/MapPicker.jsx` - Agregado useEffect de auto-centrado
2. ✅ `TRACKING_TIEMPO_REAL_IMPLEMENTADO.md` - Documentación actualizada

## Mejoras Futuras Opcionales

### 1. **Centrado Inteligente según Distancia**
```javascript
// Si conductor está muy cerca, centrar en origen
if (distance < 500) {
  mapRef.current.flyTo({
    center: [origin.lng, origin.lat],
    zoom: 16
  });
} else {
  // Usar bounds como ahora
}
```

### 2. **Animación Suave Solo en Primera Carga**
```javascript
const [isFirstLoad, setIsFirstLoad] = useState(true);

useEffect(() => {
  // ...
  mapRef.current.fitBounds(bounds, {
    padding: { /* ... */ },
    duration: isFirstLoad ? 1500 : 500, // Más rápido en updates
  });
  setIsFirstLoad(false);
}, [driverLocation]);
```

### 3. **Botón "Re-centrar"**
Agregar un botón flotante para que el usuario pueda re-centrar manualmente:
```jsx
<button onClick={recenterMap}>
  📍 Re-centrar
</button>
```

## Resultado

✅ **Mapa se centra automáticamente** al cargar la vista  
✅ **Se re-ajusta suavemente** cuando el conductor se mueve  
✅ **Padding correcto** para no ocultar UI  
✅ **Zoom inteligente** según distancia  
✅ **Experiencia tipo Uber/Didi** lograda  

---

**Estado**: ✅ Completado  
**UX**: 🟢 Mejorada significativamente
