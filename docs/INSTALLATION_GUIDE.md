# 📚 Guía de Instalación Paso a Paso - Desvare App

Esta guía te llevará desde cero hasta tener el sistema completo funcionando.

## ✅ Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** (versión 18 o superior)
   - Descarga desde: https://nodejs.org/
   - Verifica: `node --version`

2. **npm** (viene con Node.js)
   - Verifica: `npm --version`

3. **MongoDB Atlas** (base de datos en la nube - GRATIS)
   - Crea una cuenta en: https://www.mongodb.com/cloud/atlas
   - Sigue los pasos para crear un cluster gratuito

4. **Git** (opcional, para control de versiones)
   - Descarga desde: https://git-scm.com/

## 🗄️ PASO 1: Configurar MongoDB Atlas

### 1.1. Crear cuenta en MongoDB Atlas

1. Ve a https://www.mongodb.com/cloud/atlas
2. Haz clic en "Try Free"
3. Regístrate con tu email
4. Crea un cluster gratuito (M0)

### 1.2. Configurar acceso

1. En "Database Access", crea un usuario:
   - Username: `desvare_admin`
   - Password: Genera una contraseña segura (guárdala)
   - Rol: "Atlas admin"

2. En "Network Access", agrega tu IP:
   - Haz clic en "Add IP Address"
   - Selecciona "Allow access from anywhere" (0.0.0.0/0)
   - Para desarrollo local

### 1.3. Obtener string de conexión

1. Haz clic en "Connect" en tu cluster
2. Selecciona "Connect your application"
3. Copia el string de conexión, se verá así:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Reemplaza `<username>` y `<password>` con tus credenciales
5. Agrega el nombre de base de datos después de `.net/`:
   ```
   mongodb+srv://desvare_admin:tu_password@cluster0.xxxxx.mongodb.net/desvare?retryWrites=true&w=majority
   ```

## 🔧 PASO 2: Instalar y Configurar Backend

### 2.1. Instalar dependencias

```bash
cd backend
npm install
```

Espera a que se instalen todos los paquetes (puede tomar 1-2 minutos).

### 2.2. Configurar variables de entorno

```bash
# Crear archivo .env desde el ejemplo
cp .env.example .env
```

Ahora edita el archivo `.env` con tu editor favorito:

```env
PORT=5000
NODE_ENV=development

# IMPORTANTE: Pega aquí tu string de conexión de MongoDB Atlas
MONGODB_URI=mongodb+srv://desvare_admin:tu_password@cluster0.xxxxx.mongodb.net/desvare?retryWrites=true&w=majority

# Cambia esto por un secreto aleatorio largo
JWT_SECRET=mi_super_secreto_seguro_cambiar_en_produccion_12345

# URLs de las apps (dejar así para desarrollo local)
CLIENT_URL=http://localhost:5173
DRIVER_URL=http://localhost:5174
```

### 2.3. Probar el backend

```bash
npm run dev
```

Deberías ver:
```
🚀 Servidor corriendo en puerto 5000
✅ Conectado a MongoDB Atlas
📡 Socket.IO listo para conexiones en tiempo real
```

Si ves esto, ¡perfecto! Presiona `Ctrl+C` para detenerlo por ahora.

## 📱 PASO 3: Instalar PWA de Clientes

Abre una **nueva terminal** (deja el backend por ahora):

### 3.1. Instalar dependencias

```bash
cd client-pwa
npm install
```

### 3.2. Configurar variables de entorno

```bash
cp .env.example .env
```

El archivo `.env` ya debería estar bien para desarrollo local:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 3.3. Probar la PWA

```bash
npm run dev
```

Deberías ver:
```
  VITE ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

Abre tu navegador en `http://localhost:5173` - deberías ver la pantalla de login.

## 🚗 PASO 4: Instalar App de Conductores

Abre otra **nueva terminal**:

### 4.1. Instalar dependencias

```bash
cd driver-app
npm install
```

### 4.2. Configurar variables de entorno

```bash
cp .env.example .env
```

El archivo `.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 4.3. Probar la app

```bash
npm run dev
```

Deberías ver:
```
  VITE ready in XXX ms

  ➜  Local:   http://localhost:5174/
```

Abre tu navegador en `http://localhost:5174` - deberías ver la pantalla de login de conductor.

## ✨ PASO 5: Probar el Sistema Completo

Ahora deberías tener 3 terminales abiertas:

1. **Terminal 1**: Backend corriendo en puerto 5000
2. **Terminal 2**: PWA Cliente en puerto 5173
3. **Terminal 3**: App Conductor en puerto 5174

### 5.1. Registrar un cliente

1. Ve a `http://localhost:5173`
2. Haz clic en "Regístrate aquí"
3. Completa el formulario:
   - Nombre: "Cliente Prueba"
   - Email: "cliente@test.com"
   - Contraseña: "123456"
4. Haz clic en "Registrarse"
5. Serás redirigido a la página principal

### 5.2. Registrar un conductor

1. Ve a `http://localhost:5174`
2. Haz clic en "Regístrate aquí"
3. Completa el formulario:
   - Nombre: "Conductor Prueba"
   - Email: "conductor@test.com"
   - Contraseña: "123456"
4. Haz clic en "Registrarse"
5. Serás redirigido a la página principal

### 5.3. Probar el flujo de cotización

1. **En la PWA del cliente** (`http://localhost:5173`):
   - Haz clic en "Buscar Cotización"
   - Verás un mensaje de confirmación

2. **En la App del conductor** (`http://localhost:5174`):
   - ¡Deberías ver aparecer una ALERTA!
   - La solicitud se agregará a la lista
   - Haz clic en "Cotizar"

3. **En el modal del conductor**:
   - Ingresa un monto (ej: 25000)
   - Haz clic en "Enviar Cotización"

4. **De vuelta en la PWA del cliente**:
   - ¡Verás aparecer la cotización!
   - Se mostrará el nombre del conductor y el monto

### 5.4. Revisar la consola del backend

En la terminal del backend verás logs como:
```
🔌 Nuevo cliente conectado: [socket-id]
👤 Cliente registrado: [client-id]
🚗 Conductor registrado: [driver-id]
📢 Nueva solicitud de cotización: {...}
💰 Cotización enviada: {...}
```

## 🎉 ¡Felicidades!

Si llegaste hasta aquí y todo funcionó, ¡ya tienes el MVP completo de Desvare App funcionando!

## 🐛 Solución de Problemas Comunes

### Error: "Cannot connect to MongoDB"

**Problema**: El backend no puede conectarse a MongoDB Atlas.

**Soluciones**:
1. Verifica que el string de conexión en `backend/.env` sea correcto
2. Asegúrate de haber reemplazado `<username>` y `<password>`
3. Verifica que hayas agregado tu IP en "Network Access" de MongoDB Atlas
4. Intenta agregar "0.0.0.0/0" para permitir todas las IPs (solo desarrollo)

### Error: "Port 5000 is already in use"

**Problema**: Otro servicio está usando el puerto 5000.

**Solución**:
1. Cambia el puerto en `backend/.env`:
   ```env
   PORT=5001
   ```
2. Actualiza las URLs en las apps:
   ```env
   VITE_API_URL=http://localhost:5001
   VITE_SOCKET_URL=http://localhost:5001
   ```

### Error: "npm install" falla

**Problema**: Error al instalar dependencias.

**Soluciones**:
1. Elimina `node_modules` y `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Verifica tu versión de Node.js:
   ```bash
   node --version
   ```
   Debe ser 18 o superior.

### Socket.IO no conecta

**Problema**: Las apps no reciben eventos en tiempo real.

**Soluciones**:
1. Verifica que el backend esté corriendo
2. Abre la consola del navegador (F12) y busca errores
3. Verifica que las URLs en `.env` sean correctas
4. Recarga las páginas web

### Las páginas están en blanco

**Problema**: La PWA o App no cargan.

**Soluciones**:
1. Abre la consola del navegador (F12) y busca errores
2. Verifica que `npm run dev` no tenga errores
3. Intenta limpiar el cache del navegador
4. Reinicia el servidor de desarrollo

## 📞 Obtener Ayuda

Si tienes problemas:

1. Revisa los logs en las terminales
2. Abre la consola del navegador (F12)
3. Verifica que todas las variables de entorno estén correctas
4. Reinicia todos los servicios

## 🚀 Próximos Pasos

Una vez que todo funcione:

1. **Explora el código**: Revisa la estructura de cada proyecto
2. **Personaliza**: Cambia colores, textos, logos
3. **Agrega funcionalidades**: Consulta el roadmap en README.md
4. **Deploy**: Sigue la guía de deployment en README.md

¡Disfruta desarrollando con Desvare App! 🎊

