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
```

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

