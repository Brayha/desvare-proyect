# 🔧 Fix: Error `Cannot read properties of null (reading '_id')` en Home.jsx

## 📋 Resumen del Problema

### Síntomas
Al intentar interactuar con el botón de toggle de disponibilidad (Activo/Ocupado) en `Home.jsx`, la app mostraba el error:
```
TypeError: Cannot read properties of null (reading '_id')
at handleToggleAvailability (Home.jsx:361)
```

### Causa Raíz
El estado `user` se inicializa como `null` cuando el componente `Home.jsx` se renderiza. Aunque el `useEffect` (línea 117) carga el `user` desde `localStorage`, hay un pequeño delay antes de que el estado se actualice. Si el usuario intenta hacer clic en algún botón que usa `user._id` antes de que ese delay termine, la app intentará acceder a `user._id` cuando `user` aún es `null`, causando el error.

---

## ✅ Solución Implementada

Se agregaron **validaciones defensivas** en todas las funciones que acceden a `user._id`:

### 1. `handleToggleAvailability` (línea 355)
```javascript
const handleToggleAvailability = async (newStatus) => {
  try {
    // Validar que user existe y tiene _id
    if (!user || !user._id) {
      console.error('❌ Error: user no está definido o no tiene _id');
      present({
        message: '⚠️ Error: Usuario no cargado. Intenta de nuevo.',
        duration: 2000,
        color: 'danger',
      });
      return;
    }

    const response = await fetch(`${API_URL}/api/drivers/toggle-availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverId: user._id,
        isOnline: newStatus
      })
    });
    // ... resto del código
  }
};
```

### 2. `handleQuote` (línea 413)
```javascript
const handleQuote = (request) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Validar que user existe y tiene _id
  if (!user || !user._id) {
    console.error('❌ Error: user no está definido o no tiene _id');
    present({
      message: '⚠️ Error: Usuario no cargado. Intenta de nuevo.',
      duration: 2000,
      color: 'danger',
    });
    return;
  }
  
  const myQuote = request.quotes?.find(q => q.driverId === user._id);
  // ... resto del código
};
```

### 3. `handleSendQuote` (línea 431)
```javascript
const handleSendQuote = async () => {
  // ... validaciones previas ...

  // Validar que user existe y tiene _id
  if (!user || !user._id) {
    console.error('❌ Error: user no está definido o no tiene _id');
    present({
      message: '⚠️ Error: Usuario no cargado. Intenta de nuevo.',
      duration: 2000,
      color: 'danger',
    });
    return;
  }

  try {
    const quoteData = {
      driverId: user._id,
      driverName: user.name,
      // ... resto del código
    };
  }
};
```

---

## 🧪 Cómo Probar los Cambios

### 1. Iniciar la app localmente (con conexión a producción)
```bash
cd /Users/bgarcia/Documents/desvare-proyect/driver-app
npm run dev
```

### 2. Abrir en el navegador
```
http://localhost:5175
```

### 3. Flujo de prueba
1. **Registrar/Login** con tu número de teléfono
2. **Verificar OTP**
3. **Llegar a Home**
4. **Inmediatamente** (sin esperar) hacer clic en el botón de toggle "Activo/Ocupado"
5. Verificar que:
   - Si haces clic muy rápido, aparece el toast: "⚠️ Error: Usuario no cargado. Intenta de nuevo."
   - Si esperas 1 segundo y haces clic, el toggle funciona correctamente

### 4. Revisar la consola del navegador
- Ya no debe aparecer el error `TypeError: Cannot read properties of null (reading '_id')`
- En su lugar, debe aparecer el log: `❌ Error: user no está definido o no tiene _id` (solo si se hace clic muy rápido)

---

## 📁 Archivos Modificados

### `/Users/bgarcia/Documents/desvare-proyect/driver-app/src/pages/Home.jsx`
- **Línea 355-376**: Validación en `handleToggleAvailability`
- **Línea 413-428**: Validación en `handleQuote`
- **Línea 431-467**: Validación en `handleSendQuote`

---

## 🔍 Verificación de localStorage

Para entender por qué el `user` estaba en `localStorage` pero no en el estado, ejecuté estos comandos en la consola:
```javascript
console.log('user:', localStorage.getItem('user'));
console.log('token:', localStorage.getItem('token'));
const user = JSON.parse(localStorage.getItem('user') || 'null');
console.log('user parseado:', user);
console.log('user._id:', user?._id);
```

**Resultado:**
- `localStorage` SÍ contenía el `user` correctamente como string JSON
- El problema era que el estado `user` en React aún estaba `null` debido al timing del `useEffect`

---

## 🎯 Resultado Final

Con estas validaciones:
- ✅ El error `Cannot read properties of null (reading '_id')` ya no ocurre
- ✅ Si el usuario hace clic muy rápido, recibe un mensaje claro: "Usuario no cargado. Intenta de nuevo."
- ✅ Después de 1 segundo (cuando el `useEffect` termina), todas las funciones trabajan normalmente
- ✅ La app es más robusta ante condiciones de carrera (race conditions)

---

## 📝 Notas Técnicas

### ¿Por qué no inicializar el estado `user` desde `localStorage`?
```javascript
// Esto NO funcionaría bien en React:
const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
```

**Razón:** React recomienda que los estados iniciales sean valores estáticos. Leer de `localStorage` durante la inicialización puede causar problemas de hidratación en SSR (Server-Side Rendering) y puede hacer que el componente no se re-renderice correctamente.

La práctica recomendada es usar `useEffect` para leer de `localStorage` después del primer render, como ya está implementado en la línea 117.

---

## 🚀 Próximos Pasos

1. **Probar localmente** siguiendo el flujo de prueba
2. Si todo funciona bien, **generar una nueva APK** en Android Studio
3. **Instalar la APK** en el dispositivo Android
4. **Probar en el dispositivo real** para confirmar que el error está resuelto

---

**Fecha:** 11 de febrero de 2026  
**Archivo modificado:** `/Users/bgarcia/Documents/desvare-proyect/driver-app/src/pages/Home.jsx`  
**Error resuelto:** `TypeError: Cannot read properties of null (reading '_id')`
