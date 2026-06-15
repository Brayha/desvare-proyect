# 🔧 Instrucciones para configurar el archivo .env

## 📝 Ubicación
El archivo `.env` debe estar en: `/backend/.env`

## 🔑 Variables que debes agregar

Abre tu archivo `.env` y agrega estas nuevas variables:

```env
# ============================================
# DIGITALOCEAN SPACES (Almacenamiento)
# ============================================
DO_SPACES_KEY=AW432TB6VYY6JDSXQTOT
DO_SPACES_SECRET=H/V4awSmbPkj0ZpyCNlnblM812Ey9ZKBdtgFV10X7yI
DO_SPACES_ENDPOINT=https://fra1.digitaloceanspaces.com
DO_SPACES_BUCKET=desvare
DO_SPACES_REGION=fra1

# ============================================
# FIREBASE (Notificaciones Push)
# ============================================
FIREBASE_PROJECT_ID=desvare-production
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# ============================================
# REDIS (Escalado horizontal de Socket.IO) — OPCIONAL
# ============================================
# Solo necesaria si vas a correr VARIOS procesos del backend (PM2 cluster,
# o varios droplets). Si NO la defines, todo funciona igual con un solo proceso.
REDIS_URL=redis://127.0.0.1:6379
```

## 🧩 Redis (opcional) — para correr varios procesos del backend

> **¿Lo necesitas ya?** Solo cuando quieras aprovechar varios núcleos de CPU
> (PM2 en modo cluster) o varios servidores. Con un solo proceso, **deja
> `REDIS_URL` sin definir** y el backend se comporta exactamente igual que hoy.

### 1. Instalar Redis en el mismo droplet (Ubuntu)

```bash
sudo apt update
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
# Verificar:
redis-cli ping   # debe responder: PONG
```

### 2. Definir la variable en el `.env` del servidor

```env
REDIS_URL=redis://127.0.0.1:6379
```

### 3. (Cuando vayas a multi-proceso) correr en cluster con PM2

```bash
pm2 start server.js -i max --name desvare-backend
```

> ⚠️ **Importante antes de activar cluster:** con varios procesos, Socket.IO
> necesita *sticky sessions* (o forzar `transports: ['websocket']`). La
> propagación de eventos entre procesos ya queda resuelta por el Redis adapter,
> pero el cutover de cluster debe **probarse en staging** antes de producción,
> porque algunas emisiones del servidor aún usan `socketId` directo en lugar de
> salas (ver nota técnica en el código). Mientras corras **un solo proceso**,
> nada de esto te afecta.

Al arrancar deberías ver en los logs:
- `✅ Redis (pub) conectado` y `✅ Redis (sub) conectado`
- `✅ Socket.IO Redis adapter ACTIVADO (listo para múltiples procesos).`

Si Redis está caído, verás el error pero el servidor **sigue funcionando** en
modo de un solo proceso (la entrega local no se interrumpe).

## ⚠️ IMPORTANTE - Seguridad

1. **Después de la configuración inicial**, deberías:
   - Eliminar la Access Key actual de DigitalOcean
   - Crear una nueva
   - Actualizar estas variables

2. **El archivo `firebase-service-account.json`**:
   - Ya está en `/backend/firebase-service-account.json`
   - Está protegido por `.gitignore`
   - NUNCA lo subas a Git

## ✅ Verificar configuración

Para verificar que todo está bien configurado:

```bash
cd backend
node -e "
require('dotenv').config();
console.log('✅ DO_SPACES_KEY:', process.env.DO_SPACES_KEY ? 'Configurado' : '❌ Falta');
console.log('✅ DO_SPACES_SECRET:', process.env.DO_SPACES_SECRET ? 'Configurado' : '❌ Falta');
console.log('✅ FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Configurado' : '❌ Falta');
console.log('✅ Firebase JSON:', require('fs').existsSync('./firebase-service-account.json') ? 'Existe' : '❌ Falta');
"
```

## 🚀 Siguiente paso

Una vez configurado el `.env`, reinicia el servidor:

```bash
npm run dev
```

Deberías ver en los logs:
- ✅ Conectado a MongoDB Atlas
- ✅ Firebase Admin SDK inicializado correctamente
- 🚀 Servidor corriendo en puerto 5001

