# 🔧 ARCHIVO .env CORRECTO PARA DIGITALOCEAN

## Copiar y pegar TODO este contenido en el .env del servidor

```env
# Configuración del servidor
PORT=5001
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://desvare_admin:L9tM8je0hjRuRQiv@desvare-new.efzig6x.mongodb.net/?appName=desvare-new

# DigitalOcean Spaces
DO_SPACES_KEY=DO00FN37AFVMTVFKTCUR
DO_SPACES_SECRET=l7OsTP8RlbViYqIlc0E9Hbx7/dvBJ91RxxP5EaRoEXg
DO_SPACES_ENDPOINT=fra1.digitaloceanspaces.com
DO_SPACES_BUCKET=desvare
DO_SPACES_REGION=fra1

# Firebase
FIREBASE_PROJECT_ID=desvare-production
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Twilio Verify (USAR TUS CREDENCIALES REALES)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Modo desarrollo para OTP (false = usa Twilio real)
TWILIO_DEV_MODE=false

# JWT Secret
JWT_SECRET=desvare_production_2026_super_secret_key_change_this

# URLs permitidas (CORS) - CORREGIDAS
CLIENT_URL=https://desvare.app,https://www.desvare.app,https://desvare-proyect-mpdw.vercel.app
DRIVER_URL=https://driver.desvare.app,http://localhost:8100,http://localhost:5174,capacitor://localhost,ionic://localhost
ADMIN_URL=https://admin.desvare.app,https://desvare-admin.vercel.app,http://localhost:5176
```

---

## Comandos para Actualizar en DigitalOcean:

```bash
# 1. Conectar
ssh root@tu-servidor-digitalocean

# 2. Ir al backend
cd /home/desvare/desvare-proyect/backend

# 3. Hacer backup
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 4. Editar .env
nano .env

# 5. BORRAR TODO EL CONTENIDO Y PEGAR EL NUEVO (ver arriba)

# 6. Guardar: Ctrl+X, Y, Enter

# 7. Reiniciar
pm2 restart desvare-backend

# 8. Verificar
pm2 logs desvare-backend --lines 30
```

---

## Cambios Específicos:

### CLIENT_URL (corregido):
```env
CLIENT_URL=https://desvare.app,https://www.desvare.app,https://desvare-proyect-mpdw.vercel.app
```
- Agregué el dominio de Vercel que veo en tu pantallazo

### DRIVER_URL (corregido):
```env
DRIVER_URL=https://driver.desvare.app,http://localhost:8100,http://localhost:5174,capacitor://localhost,ionic://localhost
```
- Removí IPs locales innecesarias
- Mantuve localhost para testing en Mac

### ADMIN_URL (corregido):
```env
ADMIN_URL=https://admin.desvare.app,https://desvare-admin.vercel.app,http://localhost:5176
```
- Agregué dominio de producción
- Mantuve Vercel y localhost

---

## ⚠️ IMPORTANTE:
- Usa TUS credenciales reales de Twilio (las que te mostré arriba)
- NO copies placeholders (xxx), usa los valores reales
