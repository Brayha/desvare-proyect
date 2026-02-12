# 🚀 Pasos de Despliegue - Visual

## ✅ Estado Actual

- ✅ Código modificado localmente
- ✅ Commit creado: `69a262d`
- ✅ Push completado a GitHub
- 🔄 Ahora: Desplegar en el servidor

---

## 📋 Pasos a Seguir en la Consola de DigitalOcean

### 🟢 Paso 1: Ir al directorio del backend

**Comando:**
```bash
cd /root/desvare-proyect/backend
```

**Qué hace:** Te mueve al directorio donde está el código del backend

**Resultado esperado:** El prompt cambia a mostrar `/root/desvare-proyect/backend`

---

### 🟢 Paso 2: Actualizar el código desde GitHub

**Comando:**
```bash
git pull origin main
```

**Qué hace:** Descarga los cambios que acabamos de hacer push

**Resultado esperado:**
```
Updating aed042f..69a262d
Fast-forward
 backend/models/User.js       | 15 +++++++++++++--
 backend/routes/auth.js       | 12 ++++++++----
 backend/routes/drivers.js    | 12 ++++++++----
 3 files changed, 29 insertions(+), 10 deletions(-)
```

**✅ Si ves esto, el código se actualizó correctamente**

---

### 🟢 Paso 3: Eliminar el índice antiguo de MongoDB

**Comando (todo en una línea):**
```bash
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(async () => { const User = mongoose.connection.collection('users'); try { await User.dropIndex('phone_1'); console.log('✅ Índice phone_1 eliminado'); } catch (error) { console.log('ℹ️ Índice phone_1 no existe'); } process.exit(0); });"
```

**Qué hace:** Elimina el índice antiguo que impedía tener el mismo teléfono con diferentes tipos de usuario

**Resultado esperado:**
```
✅ Índice phone_1 eliminado
```

O:
```
ℹ️ Índice phone_1 no existe
```

**✅ Cualquiera de los dos está bien**

---

### 🟢 Paso 4: Reiniciar el backend

**Comando:**
```bash
pm2 restart desvare-backend
```

**Qué hace:** Reinicia el servidor backend para que cargue los cambios

**Resultado esperado:**
```
[PM2] Applying action restartProcessId on app [desvare-backend](ids: [ 0 ])
[PM2] [desvare-backend](0) ✓
```

**✅ Si ves el ✓, el backend se reinició correctamente**

---

### 🟢 Paso 5: Verificar que está funcionando

**Comando:**
```bash
pm2 logs desvare-backend --lines 20
```

**Qué hace:** Muestra los últimos 20 logs del backend

**Resultado esperado (busca estas líneas):**
```
✅ MongoDB conectado exitosamente
✅ Servidor corriendo en puerto 5001
```

**✅ Si ves estos mensajes, todo está funcionando**

---

## 🎯 Comando Todo-en-Uno (Opcional)

Si quieres ejecutar todo de una vez, copia y pega esto:

```bash
cd /root/desvare-proyect/backend && git pull origin main && node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(async () => { const User = mongoose.connection.collection('users'); try { await User.dropIndex('phone_1'); console.log('✅ Índice eliminado'); } catch (e) { console.log('ℹ️ Índice no existe'); } process.exit(0); });" && pm2 restart desvare-backend && echo "" && echo "✅ Despliegue completado" && pm2 logs desvare-backend --lines 10
```

---

## 🧪 Probar la Nueva Funcionalidad

### Prueba 1: Registrar Conductor

1. Abrir: https://driver.desvare.app
2. Registrarte con: `+57 350 579 0415`
3. Verificar OTP
4. ✅ Debe funcionar

### Prueba 2: Registrar Cliente con el mismo teléfono

1. Abrir: https://desvare.app
2. Registrarte con el **mismo teléfono**: `+57 350 579 0415`
3. Verificar OTP
4. ✅ **Debe funcionar sin errores** (esto es lo nuevo)

### Prueba 3: Intentar duplicar (debe fallar)

1. Intentar registrarte de nuevo como cliente con el mismo teléfono
2. ❌ Debe mostrar: "Ya tienes una cuenta de cliente con este teléfono"

---

## 🐛 Troubleshooting

### ❌ Error: "fatal: not a git repository"

**Problema:** No estás en el directorio correcto

**Solución:**
```bash
cd /root/desvare-proyect/backend
```

---

### ❌ Error: "Cannot find module 'mongoose'"

**Problema:** Faltan dependencias

**Solución:**
```bash
npm install
```

---

### ❌ Backend no inicia después de reiniciar

**Solución 1:** Ver logs completos
```bash
pm2 logs desvare-backend --lines 50
```

**Solución 2:** Reiniciar de nuevo
```bash
pm2 restart desvare-backend
```

**Solución 3:** Verificar estado
```bash
pm2 status
```

---

## ✅ Checklist de Verificación

Después de ejecutar todos los comandos, verifica:

- [ ] `git pull` se ejecutó sin errores
- [ ] El índice se eliminó (o no existía)
- [ ] PM2 reinició correctamente (viste el ✓)
- [ ] Los logs muestran "MongoDB conectado"
- [ ] Los logs muestran "Servidor corriendo en puerto 5001"
- [ ] No hay errores en rojo en los logs
- [ ] Puedes registrarte como conductor
- [ ] Puedes registrarte como cliente con el mismo teléfono

---

## 📊 Resumen Visual

```
┌─────────────────────────────────────────┐
│  1. cd /root/desvare-proyect/backend    │
│     ↓                                   │
│  2. git pull origin main                │
│     ↓                                   │
│  3. node -e "..." (eliminar índice)     │
│     ↓                                   │
│  4. pm2 restart desvare-backend         │
│     ↓                                   │
│  5. pm2 logs desvare-backend            │
│     ↓                                   │
│  ✅ Listo para probar                   │
└─────────────────────────────────────────┘
```

---

**Tiempo estimado:** 5 minutos  
**Dificultad:** Fácil (solo copiar y pegar)  
**Riesgo:** Bajo (cambios retrocompatibles)
