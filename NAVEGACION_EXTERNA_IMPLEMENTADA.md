# Navegación Externa - Apps de Mapas

## Fecha
31 de Enero, 2026

## Funcionalidad Implementada

Se ha agregado la capacidad de abrir apps de navegación externas (Google Maps, Waze, Apple Maps) desde la vista de **Servicio Activo** del conductor.

## Ubicación

**Vista**: `driver-app/src/pages/ActiveService.jsx`

## Comportamiento

### Botón "Abrir ruta" - Punto de Recogida
- **Cuándo aparece**: FASE 1 - Antes de validar el código de seguridad
- **Ubicación visual**: Debajo de la dirección del punto de recogida (origen)
- **Acción**: Al hacer clic, muestra un selector con 3 opciones de apps de navegación

### Botón "Navegar al destino" - Destino Final
- **Cuándo aparece**: FASE 2 - Después de validar el código de seguridad
- **Ubicación visual**: Debajo de la dirección del destino final
- **Acción**: Al hacer clic, muestra el mismo selector de apps de navegación

## Apps de Navegación Soportadas

### 1. 🗺️ Google Maps
- **URL Format**: `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=driving`
- **Funciona en**: iOS, Android, Web
- **Comportamiento**: 
  - Si está instalada la app, abre directamente en la app
  - Si no está instalada, abre en el navegador web
- **Ruta**: Traza la ruta desde la ubicación actual del conductor hasta el destino

### 2. 🚗 Waze
- **URL Format**: `https://waze.com/ul?ll=LAT,LNG&navigate=yes`
- **Funciona en**: iOS, Android
- **Comportamiento**:
  - Si está instalada, abre directamente en modo navegación
  - Si no está instalada, intenta abrir el sitio web de Waze
- **Ruta**: Inicia la navegación automáticamente

### 3. 🍎 Apple Maps
- **URL Format**: `https://maps.apple.com/?daddr=LAT,LNG&dirflg=d`
- **Funciona en**: iOS, macOS
- **Comportamiento**:
  - Solo funciona en dispositivos Apple
  - En Android/Windows, puede fallar o abrir en navegador
- **Ruta**: Traza la ruta en modo conducción (dirflg=d)

## Implementación Técnica

### Función Principal

```javascript
const openNavigation = (destinationCoords, destinationAddress) => {
  // 1. Validar que existan coordenadas
  if (!destinationCoords || !destinationCoords.coordinates) {
    present({
      message: "No hay coordenadas disponibles para navegar",
      duration: 2000,
      color: "warning",
    });
    return;
  }

  // 2. Extraer lat/lng (GeoJSON format: [lng, lat])
  const [lng, lat] = destinationCoords.coordinates;

  // 3. Generar URLs para cada app
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;

  // 4. Mostrar selector de apps
  presentAlert({
    header: "Abrir en:",
    message: "Selecciona tu app de navegación preferida",
    buttons: [
      {
        text: "🗺️ Google Maps",
        handler: () => {
          window.open(googleMapsUrl, "_system");
        },
      },
      {
        text: "🚗 Waze",
        handler: () => {
          window.open(wazeUrl, "_system");
        },
      },
      {
        text: "🍎 Apple Maps",
        handler: () => {
          window.open(appleMapsUrl, "_system");
        },
      },
      {
        text: "Cancelar",
        role: "cancel",
      },
    ],
  });
};
```

### Uso en Botones

**Punto de Recogida (Origen)**:
```jsx
<button
  className="go-to-navigation-button"
  onClick={() =>
    openNavigation(
      serviceData.origin,
      serviceData.origin.address
    )
  }
>
  <Routing size="24" variant="Bulk" color="#9CA3AF" />
  Abrir ruta
</button>
```

**Destino Final**:
```jsx
<button
  className="go-to-navigation-button"
  onClick={() =>
    openNavigation(
      serviceData.destination,
      serviceData.destination.address
    )
  }
>
  <Routing size="24" variant="Bulk" color="#9CA3AF" />
  Navegar al destino
</button>
```

## Formato de Coordenadas

Las coordenadas vienen en formato **GeoJSON**:
```javascript
{
  type: "Point",
  coordinates: [-74.0817, 4.6097]  // [longitud, latitud]
}
```

⚠️ **Importante**: GeoJSON usa el orden `[lng, lat]`, pero las URLs de mapas necesitan `lat, lng`, por eso se extrae como:
```javascript
const [lng, lat] = destinationCoords.coordinates;
```

## Flujo de Usuario

1. **Conductor acepta servicio** → Llega a `ActiveService`
2. **Ve el punto de recogida** con botón "Abrir ruta"
3. **Hace clic** → Aparece selector con 3 apps
4. **Selecciona app preferida** (ej: Waze)
5. **Se abre Waze** con la ruta ya trazada
6. **Conductor navega** hacia el punto de recogida
7. **Valida código de seguridad** → Ve el destino final
8. **Hace clic en "Navegar al destino"**
9. **Se abre app** → Conduce al destino final

## Ventajas

✅ **Flexibilidad**: El conductor elige su app preferida
✅ **Navegación en tiempo real**: Apps especializadas con tráfico, alertas, etc.
✅ **Mejor UX**: Profesional y familiar para los conductores
✅ **Compatibilidad**: Funciona en iOS y Android
✅ **Automático**: La ruta ya viene configurada, solo debe seguir indicaciones

## Cómo Probar

### En Desarrollo (localhost)
```bash
# 1. Iniciar driver-app
cd driver-app
npm run dev

# 2. Abrir en dispositivo móvil o emulador
# 3. Aceptar un servicio
# 4. En ActiveService, hacer clic en "Abrir ruta"
# 5. Seleccionar Google Maps o Waze
```

### En Producción
Los deep links funcionan mejor en dispositivos reales con las apps instaladas.

## Notas Técnicas

- **`window.open(url, "_system")`**: En Capacitor/Cordova, `_system` abre en el navegador externo del sistema, permitiendo que los deep links funcionen correctamente.
- Si se omite `_system`, podría abrir en un webview interno sin acceso a las apps nativas.
- Las coordenadas deben existir, de lo contrario muestra un toast de advertencia.

## Archivos Modificados

1. `driver-app/src/pages/ActiveService.jsx`
   - Agregada función `openNavigation` (líneas ~52-98)
   - Botón "Abrir ruta" en origen (onClick agregado)
   - Botón "Navegar al destino" en destino (nuevo botón agregado)

## Próximas Mejoras Opcionales

- 🔄 Recordar la app preferida del conductor (localStorage)
- 🌍 Agregar más apps (Maps.me, Here WeGo, etc.)
- 📱 Detectar plataforma y mostrar solo apps compatibles
- 🎯 Modo navegación directa si solo hay 1 app instalada
