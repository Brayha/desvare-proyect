# 🖥️ Comandos para la Consola de DigitalOcean

## ✅ Push Completado

Los cambios ya fueron enviados al repositorio de Git. Ahora puedes ejecutar estos comandos en la consola de DigitalOcean.

---

## 📋 Comandos a Ejecutar (Copia y Pega)

### Paso 1: Navegar al directorio del backend

```bash
cd /root/desvare-proyect/backend
```

### Paso 2: Ver el estado actual de Git

```bash
git status
```

### Paso 3: Hacer pull de los cambios

```bash
git pull origin main
```

**Resultado esperado:**
```
remote: Enumerating objects: 7, done.
remote: Counting objects: 100% (7/7), done.
remote: Compressing objects: 100% (4/4), done.
remote: Total 4 (delta 3), reused 4 (delta 3), pack-reused 0
Unpacking objects: 100% (4/4), done.
From https://github.com/Brayha/desvare-proyect
   aed042f..69a262d  main       -> origin/main
Updating aed042f..69a262d
Fast-forward
 backend/models/User.js       | 15 +++++++++++++--
 backend/routes/auth.js       | 12 ++++++++----
 backend/routes/drivers.js    | 12 ++++++++----
 3 files changed, 29 insertions(+), 10 deletions(-)
```

### Paso 4: Eliminar el índice antiguo de MongoDB

**Opción A: Comando completo en una línea**

```bash
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(async () => { const User = mongoose.connection.collection('users'); try { await User.dropIndex('phone_1'); console.log('✅ Índice phone_1 eliminado'); } catch (error) { console.log('ℹ️ Índice phone_1 no existe'); } process.exit(0); });"
```

**Opción B: Paso a paso (más fácil de ver errores)**

1. Abrir Node.js:
```bash
node
```

2. Copiar y pegar este código:
```javascript
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    const User = mongoose.connection.collection('users');
    try {
      await User.dropIndex('phone_1');
      console.log('✅ Índice phone_1 eliminado');
    } catch (error) {
      console.log('ℹ️ Índice phone_1 no existe o ya fue eliminado');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
```

3. Presionar `Enter` y esperar el resultado

### Paso 5: Reiniciar PM2

```bash
pm2 restart desvare-backend
```

**Resultado esperado:**
```
[PM2] Applying action restartProcessId on app [desvare-backend](ids: [ 0 ])
[PM2] [desvare-backend](0) ✓
```

### Paso 6: Ver los logs para verificar

```bash
pm2 logs desvare-backend --lines 20
```

**Logs esperados:**
```
✅ MongoDB conectado exitosamente
✅ Servidor corriendo en puerto 5001
```

### Paso 7: Verificar el nuevo índice (Opcional)

```bash
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(async () => { const User = mongoose.connection.collection('users'); const indexes = await User.indexes(); console.log('📊 Índices:'); indexes.forEach(i => console.log('  -', i.name)); const compound = indexes.find(i => i.name === 'phone_1_userType_1'); if (compound) console.log('✅ Índice compuesto creado'); else console.log('⚠️ Índice compuesto NO encontrado'); process.exit(0); });"
```

---

## 🎯 Resumen de Comandos (Todo en Uno)

Si quieres ejecutar todo de una vez, copia y pega esto:

```bash
cd /root/desvare-proyect/backend && \
git pull origin main && \
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(async () => { const User = mongoose.connection.collection('users'); try { await User.dropIndex('phone_1'); console.log('✅ Índice eliminado'); } catch (e) { console.log('ℹ️ Índice no existe'); } process.exit(0); });" && \
pm2 restart desvare-backend && \
echo "" && \
echo "✅ Despliegue completado" && \
echo "" && \
pm2 logs desvare-backend --lines 10
```

---

## 🐛 Si algo sale mal

### Error: "fatal: not a git repository"

**Solución:**
```bash
cd /root/desvare-proyect/backend
git status
```

### Error: "Cannot find module 'mongoose'"

**Solución:**
```bash
npm install
```

### Error: "PM2 not found"

**Solución:**
```bash
npm install -g pm2
```

### Backend no inicia

**Ver logs completos:**
```bash
pm2 logs desvare-backend --lines 50
```

**Reiniciar de nuevo:**
```bash
pm2 restart desvare-backend
```

---

## ✅ Verificación Final

Después de ejecutar todos los comandos, verifica:

1. **PM2 está corriendo:**
   ```bash
   pm2 status
   ```
   Debe mostrar `desvare-backend` con estado `online`

2. **No hay errores en los logs:**
   ```bash
   pm2 logs desvare-backend --lines 20
   ```
   No debe haber errores en rojo

3. **El backend responde:**
   ```bash
   curl http://localhost:5001
   ```
   Debe responder (aunque sea con un error 404, significa que está corriendo)

---

## 🧪 Probar la Nueva Funcionalidad

Una vez desplegado, puedes probar:

1. **Abrir Driver App:** https://driver.desvare.app
   - Registrarte como conductor con: `+57 350 579 0415`

2. **Abrir PWA:** https://desvare.app
   - Registrarte como cliente con el **mismo teléfono**: `+57 350 579 0415`
   - ✅ Debe funcionar sin errores

---

## 📝 Notas Importantes

- **Los comandos deben ejecutarse en orden**
- **Espera a que cada comando termine antes de ejecutar el siguiente**
- **Si ves errores, copia el mensaje completo para poder ayudarte**
- **El índice compuesto se crea automáticamente al reiniciar PM2**

---

**Tiempo estimado:** 5 minutos  
**Commit:** `69a262d` - feat: Permitir usuarios duales  
**Archivos modificados:** 3 (User.js, drivers.js, auth.js)
