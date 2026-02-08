# 🚨 Error: Registro de Conductor - Error 500 al subir documentos

**Fecha:** 2026-02-08  
**Problema:** Error 500 al registrar conductor en el paso de subir documentos  
**Estado:** ✅ DIAGNOSTICADO - SOLUCIÓN DISPONIBLE

---

## 🔍 DIAGNÓSTICO

### Error en la consola:
```
POST http://api.desvare.app/api/drivers/upload-documents 500 (Internal Server Error)
Error en registro completo:
AxiosError {message: 'Request failed with status code 500', ...}
```

### Causa raíz:
El backend de producción (`https://api.desvare.app`) **NO tiene configuradas las credenciales de DigitalOcean Spaces** en el archivo `.env`.

Cuando el conductor intenta registrarse y subir sus documentos (cédula, licencia, SOAT, etc.), el backend intenta subirlos a DigitalOcean Spaces pero falla porque no encuentra las credenciales necesarias.

### Código afectado:
**Archivo:** `backend/services/storage.js` (líneas 10-19)

```javascript
const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT}`,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,      // ← NO EXISTE en prod
    secretAccessKey: process.env.DO_SPACES_SECRET, // ← NO EXISTE en prod
  },
});
```

---

## ✅ SOLUCIONES DISPONIBLES

### OPCIÓN 1: Configurar credenciales en el servidor (RECOMENDADO) ⭐

Esta es la solución definitiva para que funcione en producción.

**Pasos:**

1. **SSH al servidor:**
   ```bash
   ssh root@161.35.227.156
   ```

2. **Ir a la carpeta del backend:**
   ```bash
   cd /home/desvare/desvare-proyect/backend
   ```

3. **Editar el archivo `.env`:**
   ```bash
   nano .env
   ```

4. **Agregar estas líneas** (al final del archivo):
   ```env
   # DigitalOcean Spaces (Almacenamiento de documentos)
   DO_SPACES_KEY=DO00FN37AFVMTVFKTCUR
   DO_SPACES_SECRET=l7OsTP8RlbViYqIlc0E9Hbx7/dvBJ91RxxP5EaRoEXg
   DO_SPACES_ENDPOINT=fra1.digitaloceanspaces.com
   DO_SPACES_BUCKET=desvare
   DO_SPACES_REGION=fra1
   ```

5. **Guardar y salir:**
   - Ctrl + O (guardar)
   - Enter (confirmar)
   - Ctrl + X (salir)

6. **Reiniciar el backend:**
   ```bash
   pm2 restart desvare-backend
   ```

7. **Verificar que funcionó:**
   ```bash
   pm2 logs desvare-backend --lines 20
   ```

   Deberías ver:
   ```
   ✅ Servidor corriendo en puerto 5001
   ✅ MongoDB conectado
   ```

**Ventajas:**
- ✅ Solución definitiva
- ✅ Funciona para todos los conductores
- ✅ Los documentos se guardan en la nube

**Desventajas:**
- ⚠️ Requiere acceso SSH al servidor

---

### OPCIÓN 2: Usar backend local para pruebas (RÁPIDO) ⚡

Esta opción es solo para pruebas locales, pero te permite probar **ahora mismo** sin esperar.

**Pasos:**

1. **Iniciar el backend local:**
   ```bash
   # Terminal 4 (nuevo)
   cd backend
   npm start
   ```

   Deberías ver:
   ```
   ✅ Servidor corriendo en puerto 5001
   ✅ MongoDB conectado exitosamente
   ✅ Socket.IO inicializado
   ```

2. **Cambiar el `.env` de driver-app:**
   ```bash
   # Editar el archivo
   code driver-app/.env
   ```

   Cambiar las URLs:
   ```env
   VITE_API_URL=http://localhost:5001
   VITE_SOCKET_URL=http://localhost:5001
   ```

3. **Reiniciar la Driver App:**
   ```bash
   # Detener (Ctrl + C)
   # Volver a iniciar
   cd driver-app
   npm run dev -- --port 5174
   ```

4. **Probar el registro de conductor:**
   - Ir a `http://localhost:5174/complete-registration`
   - Completar el formulario
   - Subir documentos
   - **Ahora debería funcionar** ✅

**Ventajas:**
- ✅ Funciona inmediatamente
- ✅ Bueno para pruebas locales
- ✅ Los documentos se guardan en DigitalOcean Spaces

**Desventajas:**
- ⚠️ Solo funciona en local
- ⚠️ Usa la base de datos de producción (MongoDB Atlas)
- ⚠️ No es la solución final para producción

---

### OPCIÓN 3: Crear endpoint de prueba sin almacenamiento (TEMPORAL)

Si quieres solo probar el flujo sin subir documentos reales, puedo crear un endpoint de prueba que simule la subida.

**NO recomiendo esta opción** porque no prueba la funcionalidad real.

---

## 📊 COMPARACIÓN DE OPCIONES

| Aspecto | Opción 1 (Servidor) | Opción 2 (Local) |
|---------|---------------------|------------------|
| **Tiempo de setup** | 10 minutos | 2 minutos |
| **Requiere SSH** | ✅ Sí | ❌ No |
| **Solución definitiva** | ✅ Sí | ❌ No |
| **Para producción** | ✅ Sí | ❌ No |
| **Para pruebas** | ✅ Sí | ✅ Sí |
| **Documentos en la nube** | ✅ Sí | ✅ Sí |

---

## 🎯 FLUJO COMPLETO DESPUÉS DE LA SOLUCIÓN

### Con backend de producción configurado:

```
Driver App (localhost:5174) → Backend (api.desvare.app) → DigitalOcean Spaces
    ↓                              ↓                          ↓
Conductor registra           Recibe documentos          Guarda archivos
    ↓                              ↓                          ↓
Sube documentos              Procesa imágenes           Genera URLs públicas
    ↓                              ↓                          ↓
Recibe confirmación          Guarda URLs en MongoDB     ✅ Completado
    ↓
Admin aprueba conductor
```

---

## 🧪 PROBAR QUE FUNCIONA

Después de aplicar la solución (Opción 1 o 2):

1. **Abrir Driver App:**
   ```
   http://localhost:5174/complete-registration
   ```

2. **Completar formulario:**
   - Nombre: "Conductor Prueba"
   - Teléfono: 3001234567
   - Email: conductor@test.com

3. **Ingresar OTP:**
   - Ver consola del backend para el código
   - Ej: `OTP para 3001234567: 123456`

4. **Subir documentos:**
   - Cédula (frente y reverso)
   - Licencia de tránsito
   - SOAT
   - Tarjeta de propiedad
   - Seguro todo riesgo
   - Selfie
   - Foto de la grúa

5. **Verificar en consola:**
   ```
   ✅ Documento subido: cedula-front para usuario 60a8b0d1f0fd2f001c8e4a1b
   📎 URL: https://desvare.fra1.digitaloceanspaces.com/drivers/...
   ```

6. **Admin Dashboard:**
   - Ir a `http://localhost:5176/drivers`
   - Ver el conductor en la lista "Pendientes"
   - Hacer click para ver detalles
   - **Verificar que las imágenes se muestran** ✅
   - Aprobar conductor

---

## 🔧 TROUBLESHOOTING

### Error persiste después de configurar credenciales:

1. **Verificar que las credenciales estén en el servidor:**
   ```bash
   ssh root@161.35.227.156
   cat /home/desvare/desvare-proyect/backend/.env | grep DO_SPACES
   ```

2. **Verificar que el backend se reinició:**
   ```bash
   pm2 logs desvare-backend
   ```

3. **Probar las credenciales manualmente:**
   ```bash
   # Instalar AWS CLI
   npm install -g aws-cli
   
   # Configurar credenciales
   aws configure set aws_access_key_id DO00FN37AFVMTVFKTCUR
   aws configure set aws_secret_access_key l7OsTP8RlbViYqIlc0E9Hbx7/dvBJ91RxxP5EaRoEXg
   
   # Probar conexión
   aws s3 ls --endpoint-url=https://fra1.digitaloceanspaces.com
   ```

### Credenciales inválidas o expiradas:

Si las credenciales están mal, necesitas generar nuevas desde DigitalOcean:

1. Ir a https://cloud.digitalocean.com/spaces
2. API → Spaces Keys
3. Generate New Key
4. Copiar Access Key y Secret Key
5. Actualizar en el `.env` del servidor

---

## 📝 NOTAS IMPORTANTES

1. **Seguridad:**
   - Las credenciales de DigitalOcean Spaces son sensibles
   - No las commitees a Git
   - Solo están en el `.env` del servidor

2. **Almacenamiento:**
   - Los documentos se suben a DigitalOcean Spaces
   - Las URLs son públicas pero aleatorias (seguras)
   - Solo el admin puede ver los documentos

3. **Procesamiento de imágenes:**
   - El backend optimiza las imágenes antes de subirlas
   - Máximo 1920x1920px
   - Calidad 85%
   - Formato JPEG

4. **Límites:**
   - Tamaño máximo por archivo: 10MB
   - Solo imágenes permitidas
   - Se procesan en paralelo para velocidad

---

## 🎯 RESULTADO ESPERADO

Después de aplicar la solución:

```
✅ Conductor puede registrarse completamente
✅ Documentos se suben a DigitalOcean Spaces
✅ URLs se guardan en MongoDB
✅ Admin puede ver los documentos
✅ Admin puede aprobar/rechazar conductor
✅ Sistema funciona en producción
```

---

## 📞 SIGUIENTE PASO

**Para terminar la configuración completa:**

1. ✅ Configurar ADMIN_URL (ya hecho)
2. ✅ Crear usuario admin (ya hecho)
3. **🟡 Configurar credenciales de DigitalOcean Spaces** ← ESTE PASO
4. 🟡 Commit y push de cambios
5. 🟡 Probar flujo completo

---

**Estado:** 🔴 BLOQUEADO - Necesita credenciales en el servidor  
**Prioridad:** ALTA - Necesario para registrar conductores  
**Tiempo estimado:** 10 minutos (Opción 1) o 2 minutos (Opción 2)
