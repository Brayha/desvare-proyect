# 🗑️ Guía: Limpiar Base de Datos de Producción

**Fecha:** 2026-02-06  
**Objetivo:** Eliminar todos los usuarios y conductores de prueba para empezar desde cero con usuarios válidos en producción.

---

## ⚠️ ADVERTENCIA

Esta operación **eliminará TODOS los datos** de usuarios, conductores, solicitudes y cotizaciones en la base de datos de producción (MongoDB Atlas).

**Solo ejecuta esto si:**
- ✅ Estás en fase de desarrollo/pruebas
- ✅ NO tienes usuarios reales/clientes pagos
- ✅ Quieres empezar desde cero con una base de datos limpia

---

## 🎯 ¿Por qué hacer esto?

**Problema actual:**
- Usuarios creados en base de datos **local** (localhost)
- Tokens JWT válidos pero usuarios **no existen en producción**
- Notificaciones push **no funcionan** porque el token FCM no se puede registrar

**Solución:**
- Limpiar la base de datos de producción
- Crear usuarios directamente en producción (https://desvare.app)
- Todos los tokens FCM se registrarán correctamente
- Las notificaciones push funcionarán para todos

---

## 📋 OPCIÓN 1: Limpiar desde MongoDB Atlas (Recomendado)

### Paso 1: Acceder a MongoDB Atlas

1. Ve a [https://cloud.mongodb.com/](https://cloud.mongodb.com/)
2. Inicia sesión con tu cuenta
3. Selecciona tu cluster de producción
4. Click en "Browse Collections"

### Paso 2: Identificar las colecciones a limpiar

Las colecciones principales son:
- **users** - Todos los usuarios (clientes y conductores)
- **requests** - Todas las solicitudes de servicio
- **vehicles** - Vehículos registrados

### Paso 3: Eliminar documentos

**Para cada colección:**

1. Click en la colección (ej: "users")
2. Click en el botón "Delete" (🗑️) en cada documento
3. O ejecutar un comando de eliminación masiva (ver abajo)

**Comando de eliminación masiva (desde mongosh):**

```javascript
// Conectar a tu cluster
mongosh "mongodb+srv://tu-cluster.mongodb.net/desvare" --username tu-usuario

// Eliminar todos los usuarios
db.users.deleteMany({})

// Eliminar todas las solicitudes
db.requests.deleteMany({})

// Opcional: Mantener los datos de vehículos (marcas, modelos, categorías)
// NO ejecutes esto si quieres conservar el catálogo:
// db.vehicles.deleteMany({})
```

---

## 📋 OPCIÓN 2: Crear un endpoint de limpieza (Más rápido)

### Paso 1: Crear endpoint temporal en el backend

**Archivo:** `backend/routes/admin.js`

Agregar este endpoint temporal (solo para desarrollo):

```javascript
// 🗑️ SOLO PARA DESARROLLO - Eliminar antes de producción real
router.delete('/clean-database', async (req, res) => {
  try {
    // Verificar que sea un admin (o agregar una clave secreta)
    const { secretKey } = req.body;
    
    if (secretKey !== 'DESVARE_CLEAN_DB_2026') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Eliminar todos los usuarios
    const usersDeleted = await User.deleteMany({});
    
    // Eliminar todas las solicitudes
    const requestsDeleted = await Request.deleteMany({});

    console.log('🗑️ Base de datos limpiada:', {
      usuarios: usersDeleted.deletedCount,
      solicitudes: requestsDeleted.deletedCount
    });

    res.json({
      success: true,
      message: 'Base de datos limpiada exitosamente',
      deleted: {
        users: usersDeleted.deletedCount,
        requests: requestsDeleted.deletedCount
      }
    });

  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Paso 2: Ejecutar el endpoint

**Desde Postman o curl:**

```bash
curl -X DELETE https://api.desvare.app/api/admin/clean-database \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "DESVARE_CLEAN_DB_2026"}'
```

**O desde la consola del navegador:**

```javascript
fetch('https://api.desvare.app/api/admin/clean-database', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secretKey: 'DESVARE_CLEAN_DB_2026' })
})
.then(res => res.json())
.then(data => console.log('✅ Resultado:', data))
.catch(err => console.error('❌ Error:', err));
```

### Paso 3: Eliminar el endpoint después de usarlo

⚠️ **IMPORTANTE:** Una vez que hayas limpiado la base de datos, **elimina este endpoint** del código para evitar problemas de seguridad.

---

## 📋 OPCIÓN 3: Script Node.js directo (Más técnico)

### Crear script temporal

**Archivo:** `backend/scripts/cleanDatabase.js`

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
const Request = require('../models/Request');

async function cleanDatabase() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Eliminar todos los usuarios
    const usersResult = await User.deleteMany({});
    console.log(`🗑️ Usuarios eliminados: ${usersResult.deletedCount}`);

    // Eliminar todas las solicitudes
    const requestsResult = await Request.deleteMany({});
    console.log(`🗑️ Solicitudes eliminadas: ${requestsResult.deletedCount}`);

    console.log('✅ Base de datos limpiada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanDatabase();
```

### Ejecutar el script

```bash
# SSH al servidor
ssh root@161.35.227.156

# Ir a la carpeta del backend
cd /home/desvare/desvare-proyect/backend

# Ejecutar el script
node scripts/cleanDatabase.js
```

---

## ✅ Después de limpiar la base de datos

### 1. Limpiar localStorage en el navegador

En la consola del navegador:

```javascript
// Limpiar todo el localStorage
localStorage.clear();

// Recargar la página
location.href = '/';
```

### 2. Registrarte de nuevo en producción

1. Ve a https://desvare.app/register
2. Registra tu usuario de prueba:
   - Nombre: Brayhan Garcia
   - Teléfono: 3192579562
   - Email: brayhan@test.com
   - Contraseña: (tu contraseña de prueba)

3. Acepta los permisos de notificación cuando aparezca el prompt

4. Verifica en la consola:
   ```
   ✅ Token FCM obtenido: ...
   ✅ Token FCM registrado en el servidor
   ```

### 3. Registrar conductores de prueba

1. Abre una ventana de incógnito
2. Ve a la Driver App (puerto 5174 o la URL de producción)
3. Registra conductores de prueba
4. Aprueba sus cuentas desde el Admin Dashboard

### 4. Probar el flujo completo

1. **Cliente:** Solicitar servicio
2. **Conductor:** Enviar cotización
3. **Verificar que el cliente recibe:**
   - ✅ Marcador en el mapa (Socket.IO)
   - ✅ Banner amarillo con sonido (notificación in-app)
   - ✅ Notificación push del navegador (si está en otra pestaña)

---

## 🎯 Resultado Esperado

Después de limpiar la base de datos y crear usuarios nuevos:

| Funcionalidad | Antes | Después |
|---------------|-------|---------|
| Token FCM registrado | ❌ | ✅ |
| Notificaciones push | ❌ | ✅ |
| Notificaciones in-app | ❌ | ✅ (código descomentado) |
| Socket.IO | ✅ | ✅ |
| Usuarios válidos en producción | ❌ | ✅ |

---

## 📝 Notas Importantes

1. **Mantén el catálogo de vehículos:**
   - NO elimines las colecciones de `vehiclebrands`, `vehiclemodels`, `vehiclecategories`
   - Estas son configuraciones del sistema, no datos de usuarios

2. **Backup antes de limpiar (opcional):**
   ```bash
   # Exportar usuarios antes de eliminar
   mongoexport --uri="mongodb+srv://..." --collection=users --out=users_backup.json
   ```

3. **Solo en desarrollo:**
   - Esta operación es **irreversible**
   - Solo hazlo si estás 100% seguro de que no hay datos de producción reales

---

**Estado:** 📝 Pendiente de ejecución  
**Prioridad:** ALTA (para que las notificaciones funcionen en producción)  
**Tiempo estimado:** 5-10 minutos
