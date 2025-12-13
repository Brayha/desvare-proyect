# 🔧 Fix: Imagen de Perfil en Header

**Fecha:** 11 de Diciembre, 2025  
**Problema:** La imagen de perfil NO se veía en el header del Home, pero SÍ en la página de Perfil  
**Estado:** ✅ Solucionado

---

## 🐛 Problema Detectado

### Síntoma:
- ✅ **Profile.jsx:** Imagen de perfil se ve correctamente
- ❌ **Home.jsx (Header):** Imagen de perfil NO se ve (mostraba avatar por defecto)

### Estructura de Datos:

**En Profile.jsx:**
```javascript
profile.documents.selfie  ✅ Funciona
```

**En ServiceHeader.jsx:**
```javascript
user.driverProfile.documents.selfie  ❌ No funciona
```

Ambas rutas son **correctas**, entonces el problema no era la estructura.

---

## 🔍 Causa Raíz

### **localStorage Desactualizado**

#### En `Home.jsx` (ANTES):
```javascript
useEffect(() => {
  const userData = localStorage.getItem('user');
  const parsedUser = JSON.parse(userData);
  setUser(parsedUser);  // ❌ Datos viejos sin selfie
}, []);
```

El problema: `localStorage` puede tener datos **desactualizados** de cuando el usuario hizo login, **antes** de completar el registro y subir su selfie.

#### En `Profile.jsx` (FUNCIONABA):
```javascript
useEffect(() => {
  const userData = localStorage.getItem('user');
  const parsedUser = JSON.parse(userData);
  
  loadProfile(parsedUser._id);  // ✅ Hace fetch al backend
}, []);

const loadProfile = async (driverId) => {
  const response = await fetch(`/api/drivers/profile/${driverId}`);
  const data = await response.json();
  setProfile(data.driver);  // ✅ Datos frescos con selfie
};
```

**Profile.jsx hacía fetch al backend** para obtener datos frescos, por eso la imagen **SÍ** se veía ahí.

---

## ✅ Solución Implementada

### Agregué función `loadUserProfile` en `Home.jsx`

```javascript
// Función para cargar perfil completo del usuario
const loadUserProfile = async (driverId) => {
  try {
    const response = await fetch(`http://localhost:5001/api/drivers/profile/${driverId}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Perfil del usuario cargado:', data.driver.name);
      setUser(data.driver);
      setIsOnline(data.driver.driverProfile?.isOnline || false);
      
      // Actualizar localStorage con datos frescos (incluye selfie)
      localStorage.setItem('user', JSON.stringify(data.driver));
    } else {
      console.error('Error al cargar perfil:', data);
      // Si falla, usar datos de localStorage (fallback)
      const userData = localStorage.getItem('user');
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsOnline(parsedUser.driverProfile?.isOnline || false);
    }
  } catch (error) {
    console.error('❌ Error al cargar perfil:', error);
    // Si falla, usar datos de localStorage (fallback)
    const userData = localStorage.getItem('user');
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setIsOnline(parsedUser.driverProfile?.isOnline || false);
  }
};
```

### Llamada en el `useEffect`:

```javascript
useEffect(() => {
  const userData = localStorage.getItem('user');
  if (!userData) {
    history.push('/login');
    return;
  }

  const parsedUser = JSON.parse(userData);
  
  // ✅ NUEVO: Cargar perfil completo del backend
  loadUserProfile(parsedUser._id);

  // Conectar Socket.IO
  socketService.connect();
  socketService.registerDriver(parsedUser._id);

  // Cargar solicitudes iniciales
  loadRequests(parsedUser._id);
  
  // ... resto del código
}, []);
```

---

## 🎯 Beneficios del Fix

### 1️⃣ **Datos Siempre Actualizados**
```
localStorage (puede estar viejo)
    ↓
Backend fetch (datos frescos) ✅
    ↓
localStorage actualizado
    ↓
Header muestra imagen correcta
```

### 2️⃣ **Fallback Robusto**
Si el fetch al backend falla (sin internet, backend caído), usa localStorage como respaldo.

### 3️⃣ **localStorage Sincronizado**
Ahora `localStorage` siempre tiene la versión más reciente del usuario:
```javascript
localStorage.setItem('user', JSON.stringify(data.driver));
```

### 4️⃣ **Consistencia en Toda la App**
- ✅ Header: Imagen actualizada
- ✅ Profile: Imagen actualizada
- ✅ Cualquier componente que use `user`: Datos frescos

---

## 📊 Flujo Completo

### ANTES (Problema):
```
1. Usuario hace login
   → localStorage guarda user sin selfie

2. Usuario completa registro y sube selfie
   → Backend actualiza, localStorage NO

3. Usuario abre Home.jsx
   → Lee localStorage (sin selfie) ❌
   → Header no muestra imagen

4. Usuario abre Profile.jsx
   → Hace fetch al backend (con selfie) ✅
   → Muestra imagen correcta
```

### AHORA (Solucionado):
```
1. Usuario hace login
   → localStorage guarda user

2. Usuario completa registro y sube selfie
   → Backend actualiza

3. Usuario abre Home.jsx
   → Lee localStorage (puede estar viejo)
   → Hace fetch al backend (datos frescos) ✅
   → Actualiza localStorage
   → Header muestra imagen correcta ✅

4. Usuario abre Profile.jsx
   → Hace fetch al backend ✅
   → Muestra imagen correcta ✅
```

---

## 🧪 Testing

### Paso 1: Limpiar localStorage
```javascript
// En DevTools Console
localStorage.removeItem('user');
```

### Paso 2: Hacer Login
```
1. Login como conductor
2. Completar registro (subir selfie)
```

### Paso 3: Abrir Home
```
1. Ir a /home
2. Verificar en DevTools Console:
   ✅ "Perfil del usuario cargado: driver 07"
3. Ver que la imagen de perfil aparece en el header
```

### Paso 4: Refrescar Página
```
1. F5 (refresh)
2. La imagen debe seguir apareciendo
   (ahora localStorage tiene datos frescos)
```

---

## 🔄 Comparación de Código

### `Home.jsx` - ANTES:
```javascript
useEffect(() => {
  const userData = localStorage.getItem('user');
  const parsedUser = JSON.parse(userData);
  setUser(parsedUser);  // ❌ Solo localStorage
  setIsOnline(parsedUser.driverProfile?.isOnline || false);
  // ...
}, []);
```

### `Home.jsx` - AHORA:
```javascript
useEffect(() => {
  const userData = localStorage.getItem('user');
  const parsedUser = JSON.parse(userData);
  
  loadUserProfile(parsedUser._id);  // ✅ Fetch al backend
  // ...
}, []);

const loadUserProfile = async (driverId) => {
  const response = await fetch(`/api/drivers/profile/${driverId}`);
  const data = await response.json();
  
  if (response.ok) {
    setUser(data.driver);  // ✅ Datos frescos
    setIsOnline(data.driver.driverProfile?.isOnline || false);
    localStorage.setItem('user', JSON.stringify(data.driver));  // ✅ Sync
  }
};
```

---

## 📁 Archivos Modificados

### `/driver-app/src/pages/Home.jsx`

**Líneas agregadas:**
- **168-197:** Nueva función `loadUserProfile()`
- **64:** Llamada a `loadUserProfile()` en useEffect

**Líneas modificadas:**
- **54-70:** useEffect actualizado para llamar fetch

---

## 💡 Lecciones Aprendidas

### 1️⃣ **localStorage NO es Reactivo**
```javascript
// ❌ MAL - Asumir que localStorage siempre tiene datos frescos
const user = JSON.parse(localStorage.getItem('user'));

// ✅ BIEN - Hacer fetch al backend para datos críticos
const userData = localStorage.getItem('user');
const freshData = await fetch(`/api/users/${userData.id}`);
```

### 2️⃣ **Single Source of Truth**
El backend es la **fuente de verdad**, localStorage es solo **cache**.

### 3️⃣ **Sincronizar localStorage**
Cada vez que haces fetch de datos del usuario, actualiza localStorage:
```javascript
localStorage.setItem('user', JSON.stringify(freshData));
```

### 4️⃣ **Fallback para Offline**
Siempre ten un fallback a localStorage por si no hay conexión:
```javascript
try {
  const freshData = await fetch(...);
  setUser(freshData);
} catch (error) {
  const cachedData = localStorage.getItem('user');
  setUser(JSON.parse(cachedData));
}
```

---

## 🎉 Resultado Final

### ANTES:
```
Header: [👤 Avatar genérico]  ❌
```

### AHORA:
```
Header: [📸 Tu foto real]  ✅
```

**¡La imagen de perfil ahora se ve correctamente en el header!** 🚀

---

## 🚀 Próximas Mejoras (Opcional)

### 1️⃣ **Caché Inteligente**
```javascript
// Solo hacer fetch si han pasado X minutos desde la última actualización
const lastUpdate = localStorage.getItem('user_last_update');
const now = Date.now();

if (!lastUpdate || (now - lastUpdate) > 5 * 60 * 1000) {
  // Fetch solo si pasaron 5 minutos
  await loadUserProfile(userId);
  localStorage.setItem('user_last_update', now);
}
```

### 2️⃣ **Loading State**
```javascript
const [loadingProfile, setLoadingProfile] = useState(true);

<IonAvatar>
  {loadingProfile ? (
    <IonSkeletonText animated />
  ) : (
    <img src={user?.driverProfile?.documents?.selfie} />
  )}
</IonAvatar>
```

### 3️⃣ **Service Worker para Offline**
Cachear imágenes de perfil para que funcionen sin conexión.

---

**Fix aplicado y listo para testing.** ✅
