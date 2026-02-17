# 🚀 Guía de Configuración de DigitalOcean Spaces

## ⚠️ Problema Actual
Las credenciales actuales de DigitalOcean Spaces están fallando con el error:
```
SignatureDoesNotMatch: The request signature we calculated does not match 
the signature you provided. Check your key and signing method.
```

## 📋 Solución: Regenerar Credenciales

### Paso 1: Verificar que el Space "desvare" exista

1. Ve a **DigitalOcean Dashboard**: https://cloud.digitalocean.com/spaces
2. Busca un Space llamado **"desvare"** en la región **Frankfurt (FRA1)**
3. **Si NO existe:**
   - Haz clic en **"Create a Space"**
   - Región: **Frankfurt (FRA1)**
   - Nombre: **desvare** (todo en minúsculas)
   - Permissions: **Private** (recomendado para documentos sensibles)
   - File Listing: **Enabled** (para poder ver las URLs)
   - Haz clic en **"Create a Space"**

### Paso 2: Eliminar las credenciales antiguas

1. Ve a **API → Spaces Keys**: https://cloud.digitalocean.com/account/api/spaces
2. Busca la clave que empieza con **"AW432TB6..."**
3. Haz clic en el **ícono de basura** para eliminarla
4. Confirma la eliminación

### Paso 3: Crear nuevas credenciales

1. En la misma página (**API → Spaces Keys**)
2. Haz clic en **"Generate New Key"** (botón azul arriba a la derecha)
3. En el modal que aparece:
   - **Name**: `Desvare Backend` (o el nombre que prefieras)
   - **Access**: Selecciona **"Full Access"** ✅
4. Haz clic en **"Create Access Key"**

### Paso 4: Copiar las nuevas credenciales

⚠️ **MUY IMPORTANTE**: Las credenciales solo se muestran **UNA VEZ**

1. Se abrirá un modal con:
   - **Access Key ID**: Algo como `AW432TB6VYY6JDSXQTOT`
   - **Secret Access Key**: Algo como `H/V4awSmbPkj0ZpyCNlnblM812Ey9ZKBdtgFV10X7yI`

2. **Copia con MUCHO cuidado**:
   - Haz doble clic en el **Access Key** y cópialo (Cmd+C)
   - Pégalo temporalmente en un archivo de texto (para verificar)
   - Haz lo mismo con el **Secret Key**
   - **VERIFICA** que no haya espacios en blanco al inicio o al final

3. Haz clic en **"I have copied these keys"**

### Paso 5: Actualizar el archivo .env

1. Abre el archivo **`backend/.env`** en Cursor
2. Reemplaza las líneas de DigitalOcean Spaces con las nuevas credenciales:

```env
# DigitalOcean Spaces
DO_SPACES_KEY=TU_NUEVA_ACCESS_KEY_AQUI
DO_SPACES_SECRET=TU_NUEVO_SECRET_KEY_AQUI
DO_SPACES_ENDPOINT=fra1.digitaloceanspaces.com
DO_SPACES_BUCKET=desvare
DO_SPACES_REGION=fra1
```

3. **Guarda el archivo** (Cmd+S)

### Paso 6: Probar la conexión

1. Ejecuta el script de prueba:
   ```bash
   cd backend
   node scripts/testSpaces.js
   ```

2. Si ves este mensaje:
   ```
   ✅ ¡CONEXIÓN EXITOSA!
   ✅ El archivo de prueba se subió correctamente.
   ```
   **¡PERFECTO!** Ya puedes continuar.

3. Si sigue fallando, verifica:
   - ✅ Que no haya espacios en blanco en las credenciales
   - ✅ Que el Space "desvare" exista en la región FRA1
   - ✅ Que las credenciales sean las que acabas de crear

### Paso 7: Reiniciar el backend

1. Detén el servidor backend si está corriendo (Ctrl+C en la terminal)
2. Reinícialo:
   ```bash
   cd backend
   npm run dev
   ```

### Paso 8: Probar el registro completo

1. Ve a la **Driver App** (http://localhost:5173)
2. Registra un nuevo conductor
3. Sube los documentos
4. Verifica en el **Admin Dashboard** (http://localhost:5174) que ahora SÍ aparezcan las fotos

---

## 🆘 Soporte

Si después de seguir todos estos pasos el error persiste:

1. **Verifica el estado de DigitalOcean**: https://status.digitalocean.com/
2. **Contacta al soporte de DigitalOcean**: https://cloud.digitalocean.com/support/tickets/new
3. **Revisa los logs del backend** para ver el error exacto

---

## ✅ Checklist

- [ ] Verificar que el Space "desvare" exista en FRA1
- [ ] Eliminar credenciales antiguas
- [ ] Crear nuevas credenciales con "Full Access"
- [ ] Copiar credenciales sin espacios en blanco
- [ ] Actualizar `backend/.env`
- [ ] Ejecutar `node scripts/testSpaces.js` → ✅ Conexión exitosa
- [ ] Reiniciar el backend
- [ ] Probar registro de conductor completo
- [ ] Verificar en Admin Dashboard que aparezcan las fotos

---

💡 **Tip**: Guarda las credenciales en un gestor de contraseñas (1Password, LastPass, etc.) para no perderlas.

