# 🔧 Fix: Métodos de Tracking en Socket Services

## Fecha
1 de Febrero, 2026

## Problema Detectado

Después de implementar el sistema de tracking en tiempo real, las aplicaciones mostraban el error:

```
Uncaught ReferenceError: socketService is not defined
```

Aunque los imports estaban correctos, el problema real era que los archivos locales de `socket.js` en cada aplicación **NO tenían los métodos de tracking**.

## Causa Raíz

El proyecto tiene **3 archivos `socket.js` diferentes**:

1. ✅ `shared/services/socket.js` - Tenía los métodos de tracking (líneas 105-121)
2. ❌ `driver-app/src/services/socket.js` - NO tenía los métodos
3. ❌ `client-pwa/src/services/socket.js` - NO tenía los métodos

Las aplicaciones importaban sus versiones locales, no la versión shared:

```javascript
// driver-app/src/pages/ActiveService.jsx
import socketService from "../services/socket"; // ← Archivo local sin métodos

// client-pwa/src/pages/DriverOnWay.jsx
import socketService from "../services/socket"; // ← Archivo local sin métodos
```

## Solución Implementada

Se agregaron los métodos de tracking a ambos archivos locales para mantener la independencia de cada aplicación.

### Archivo 1: `driver-app/src/services/socket.js`

**Líneas agregadas**: 135-157 (después de `completeService()`, antes de `export default`)

```javascript
// ========================================
// 🆕 TRACKING EN TIEMPO REAL
// ========================================

sendLocationUpdate(data) {
  if (this.socket) {
    this.socket.emit('driver:location-update', data);
  }
}

onLocationUpdate(callback) {
  if (this.socket) {
    this.socket.on('driver:location-update', callback);
  }
}

offLocationUpdate() {
  if (this.socket) {
    this.socket.off('driver:location-update');
  }
}
```

### Archivo 2: `client-pwa/src/services/socket.js`

**Líneas agregadas**: 183-205 (después de `offServiceCompleted()`, antes de `export default`)

```javascript
// ========================================
// 🆕 TRACKING EN TIEMPO REAL
// ========================================

sendLocationUpdate(data) {
  if (this.socket) {
    this.socket.emit('driver:location-update', data);
  }
}

onLocationUpdate(callback) {
  if (this.socket) {
    this.socket.on('driver:location-update', callback);
  }
}

offLocationUpdate() {
  if (this.socket) {
    this.socket.off('driver:location-update');
  }
}
```

## Métodos Agregados

### `sendLocationUpdate(data)`
- **Propósito**: Enviar ubicación GPS del conductor al backend
- **Evento Socket.IO**: `driver:location-update`
- **Usado en**: `driver-app/src/pages/ActiveService.jsx` (línea ~220)

### `onLocationUpdate(callback)`
- **Propósito**: Escuchar actualizaciones de ubicación del conductor
- **Evento Socket.IO**: `driver:location-update`
- **Usado en**: `client-pwa/src/pages/DriverOnWay.jsx` (línea ~91)

### `offLocationUpdate()`
- **Propósito**: Limpiar listener al desmontar componente
- **Usado en**: Cleanup de useEffect en ambas apps

## Verificación

Después de agregar los métodos:

```bash
# Limpiar cache de Vite
cd driver-app && rm -rf node_modules/.vite
cd client-pwa && rm -rf node_modules/.vite

# Reiniciar servidores
npm run dev
```

## Resultado

✅ **Error resuelto**  
✅ Métodos disponibles en ambas aplicaciones  
✅ Tracking en tiempo real funcional  
✅ Sin errores de linter  

## Alternativa Considerada (No Implementada)

**Opción 2**: Cambiar imports para usar el archivo shared:

```javascript
// driver-app
import socketService from "../../../shared/services/socket";

// client-pwa
import socketService from "../../shared/services/socket";
```

**Por qué no se implementó**: Se prefirió mantener la independencia de cada aplicación y evitar dependencias cruzadas que puedan complicar el build.

## Lección Aprendida

Cuando se trabaja con múltiples aplicaciones en un monorepo:

1. ✅ Verificar que todos los archivos locales tengan los métodos necesarios
2. ✅ No asumir que el archivo shared se está usando
3. ✅ Revisar los imports reales, no solo la existencia de métodos en shared
4. ✅ Considerar usar un linter que detecte métodos no definidos

## Archivos Modificados en este Fix

1. ✅ `driver-app/src/services/socket.js` - Agregados 3 métodos
2. ✅ `client-pwa/src/services/socket.js` - Agregados 3 métodos
3. ✅ `TRACKING_TIEMPO_REAL_IMPLEMENTADO.md` - Documentación actualizada

---

**Estado**: ✅ Completado  
**Sistema de Tracking**: 🟢 Funcional
