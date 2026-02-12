# 🚀 Guía de Despliegue: Usuarios Duales en Producción

## 📋 Resumen de Cambios

Se implementó la funcionalidad de **usuarios duales** para permitir que un mismo teléfono pueda tener:
- ✅ Una cuenta de **Cliente** (para solicitar servicios)
- ✅ Una cuenta de **Conductor** (para ofrecer servicios)

**Caso de uso:** Un conductor de grúa que se vara puede solicitar un servicio usando el mismo teléfono.

---

## 📁 Archivos Modificados

1. **`backend/models/User.js`**
   - Removido `unique: true` del campo `phone`
   - Agregado índice compuesto: `{ phone: 1, userType: 1 }`

2. **`backend/routes/drivers.js`**
   - Actualizada validación de registro para verificar solo `userType: 'driver'`

3. **`backend/routes/auth.js`**
   - Actualizada validación de registro para verificar solo `userType: 'client'`

---

## 🚀 Pasos para Desplegar

### Paso 1: Conectarse al servidor

```bash
ssh root@64.23.162.115
# O usa el usuario que tengas configurado
```

### Paso 2: Navegar al directorio del proyecto

```bash
cd /root/desvare-proyect/backend
```

### Paso 3: Hacer backup de la base de datos (RECOMENDADO)

```bash
# Esto es opcional pero recomendado antes de cambios en índices
# Puedes hacerlo desde MongoDB Atlas Compass o desde la terminal
```

### Paso 4: Actualizar el código

```bash
# Ver el estado actual
git status

# Hacer pull de los cambios
git pull origin main

# Si hay conflictos, resolverlos
```

### Paso 5: Instalar dependencias (por si acaso)

```bash
npm install
```

### Paso 6: Recrear el índice de MongoDB

**⚠️ IMPORTANTE:** Necesitas eliminar el índice antiguo de `phone` y crear el nuevo índice compuesto.

#### Opción A: Desde MongoDB Atlas (Recomendado)

1. Ir a MongoDB Atlas: https://cloud.mongodb.com
2. Conectarse a tu cluster
3. Ir a "Collections" → Base de datos `desvare-new` → Colección `users`
4. Click en la pestaña "Indexes"
5. Buscar el índice `phone_1` y eliminarlo (si existe)
6. El nuevo índice `phone_1_userType_1` se creará automáticamente cuando reinicies el backend

#### Opción B: Desde la terminal del servidor

```bash
# Conectarse a MongoDB desde el servidor
node

# Ejecutar en la consola de Node.js:
```

```javascript
const mongoose = require('mongoose');

// Conectar a MongoDB (usa tu URI del .env)
mongoose.connect('tu-mongodb-uri-aqui')
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    
    // Obtener la colección de usuarios
    const User = mongoose.connection.collection('users');
    
    // Ver índices actuales
    const indexes = await User.indexes();
    console.log('📊 Índices actuales:', indexes);
    
    // Eliminar el índice antiguo de phone (si existe)
    try {
      await User.dropIndex('phone_1');
      console.log('✅ Índice phone_1 eliminado');
    } catch (error) {
      console.log('ℹ️ Índice phone_1 no existe o ya fue eliminado');
    }
    
    // El nuevo índice se creará automáticamente al reiniciar el backend
    console.log('✅ Listo. Reinicia el backend para crear el nuevo índice.');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
```

### Paso 7: Reiniciar el backend

```bash
# Reiniciar PM2
pm2 restart desvare-backend

# Verificar que está corriendo
pm2 status

# Ver logs en tiempo real
pm2 logs desvare-backend
```

**Logs esperados:**
```
✅ MongoDB conectado exitosamente
✅ Servidor corriendo en puerto 5001
```

### Paso 8: Verificar el nuevo índice

```bash
# Conectarse a MongoDB de nuevo
node
```

```javascript
const mongoose = require('mongoose');

mongoose.connect('tu-mongodb-uri-aqui')
  .then(async () => {
    const User = mongoose.connection.collection('users');
    const indexes = await User.indexes();
    
    console.log('📊 Índices después del reinicio:');
    indexes.forEach(index => {
      console.log(JSON.stringify(index, null, 2));
    });
    
    // Buscar el nuevo índice compuesto
    const compoundIndex = indexes.find(i => i.name === 'phone_1_userType_1');
    if (compoundIndex) {
      console.log('✅ Índice compuesto creado correctamente');
    } else {
      console.log('⚠️ Índice compuesto NO encontrado');
    }
    
    process.exit(0);
  });
```

---

## 🧪 Pruebas en Producción

### Prueba 1: Conductor que se registra como Cliente

1. **Registrarse como Conductor:**
   - Abrir Driver App: https://driver.desvare.app
   - Registrarse con: `+57 300 123 4567`
   - Verificar OTP
   - Completar registro

2. **Registrarse como Cliente:**
   - Abrir PWA: https://desvare.app
   - Registrarse con el **mismo teléfono**: `+57 300 123 4567`
   - Verificar OTP
   - ✅ Debe funcionar sin errores

3. **Solicitar servicio:**
   - Desde la PWA, solicitar un servicio
   - ✅ Debe funcionar normalmente

### Prueba 2: Verificar que no permite duplicados

1. **Registrarse como Cliente:**
   - Registrarse con: `+57 350 579 0415`

2. **Intentar duplicar:**
   - Intentar registrarse de nuevo como cliente con el mismo teléfono
   - ❌ Debe mostrar: "Ya tienes una cuenta de cliente con este teléfono"

---

## 🔄 Rollback (Si algo sale mal)

Si necesitas revertir los cambios:

### Paso 1: Revertir el código

```bash
cd /root/desvare-proyect/backend

# Ver el último commit
git log --oneline -5

# Revertir al commit anterior
git revert HEAD

# O hacer reset (más agresivo)
git reset --hard HEAD~1
```

### Paso 2: Restaurar el índice antiguo

```bash
node
```

```javascript
const mongoose = require('mongoose');

mongoose.connect('tu-mongodb-uri-aqui')
  .then(async () => {
    const User = mongoose.connection.collection('users');
    
    // Eliminar el índice compuesto
    await User.dropIndex('phone_1_userType_1');
    
    // Crear el índice antiguo
    await User.createIndex({ phone: 1 }, { unique: true });
    
    console.log('✅ Índice antiguo restaurado');
    process.exit(0);
  });
```

### Paso 3: Reiniciar el backend

```bash
pm2 restart desvare-backend
```

---

## 📊 Checklist de Despliegue

- [ ] Conectarse al servidor
- [ ] Navegar al directorio del backend
- [ ] Hacer backup de MongoDB (opcional)
- [ ] Hacer `git pull` de los cambios
- [ ] Eliminar el índice antiguo `phone_1`
- [ ] Reiniciar PM2
- [ ] Verificar que el nuevo índice `phone_1_userType_1` se creó
- [ ] Probar registro de conductor
- [ ] Probar registro de cliente con el mismo teléfono
- [ ] Verificar que no permite duplicados
- [ ] Verificar logs de PM2

---

## 🐛 Troubleshooting

### Error: "E11000 duplicate key error"

**Causa:** El índice antiguo `phone_1` todavía existe.

**Solución:**
```bash
# Eliminar el índice antiguo manualmente
node
```

```javascript
const mongoose = require('mongoose');
mongoose.connect('tu-mongodb-uri-aqui')
  .then(async () => {
    const User = mongoose.connection.collection('users');
    await User.dropIndex('phone_1');
    console.log('✅ Índice eliminado');
    process.exit(0);
  });
```

Luego reiniciar PM2:
```bash
pm2 restart desvare-backend
```

### Error: "Cannot create index with same name but different options"

**Causa:** Hay un conflicto entre el índice antiguo y el nuevo.

**Solución:**
```bash
# Eliminar TODOS los índices de phone
node
```

```javascript
const mongoose = require('mongoose');
mongoose.connect('tu-mongodb-uri-aqui')
  .then(async () => {
    const User = mongoose.connection.collection('users');
    
    // Listar todos los índices
    const indexes = await User.indexes();
    console.log('Índices actuales:', indexes);
    
    // Eliminar índices relacionados con phone
    for (const index of indexes) {
      if (index.name.includes('phone')) {
        await User.dropIndex(index.name);
        console.log(`✅ Eliminado: ${index.name}`);
      }
    }
    
    process.exit(0);
  });
```

Luego reiniciar PM2 para que se cree el nuevo índice.

### Backend no inicia después del cambio

**Verificar logs:**
```bash
pm2 logs desvare-backend --lines 50
```

**Errores comunes:**
- Syntax error en el código → Verificar que el pull se hizo correctamente
- MongoDB no conecta → Verificar que el URI en `.env` es correcto
- Puerto ocupado → Verificar que no hay otro proceso en el puerto 5001

---

## 📝 Notas Importantes

1. **El índice se crea automáticamente:**
   - Mongoose crea el índice compuesto al iniciar el backend
   - No necesitas crearlo manualmente

2. **Usuarios existentes:**
   - Los usuarios existentes NO se ven afectados
   - Pueden seguir usando sus cuentas normalmente

3. **Migración de datos:**
   - NO se requiere migración de datos
   - Los cambios son solo en validaciones e índices

4. **Compatibilidad:**
   - Los cambios son **retrocompatibles**
   - No rompen funcionalidad existente

---

## ✅ Resultado Esperado

Después del despliegue:

- ✅ Backend corriendo sin errores
- ✅ Índice compuesto `phone_1_userType_1` creado
- ✅ Conductores pueden registrarse como clientes
- ✅ Clientes pueden registrarse como conductores
- ✅ No se permiten duplicados del mismo tipo
- ✅ Todas las funcionalidades existentes funcionan normalmente

---

**Fecha:** 11 de febrero de 2026  
**Tiempo estimado de despliegue:** 10-15 minutos  
**Riesgo:** Bajo (cambios mínimos, retrocompatibles)
