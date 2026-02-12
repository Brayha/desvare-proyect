# ⚡ ACCIÓN INMEDIATA: Corregir Backend y DNS

## 🎯 Tienes 2 Problemas:

1. ❌ **Backend .env en DigitalOcean** - URLs incorrectas
2. ❌ **DNS en Vercel** - Configuración inválida

---

## 📋 PASO 1: Corregir Backend (.env) en DigitalOcean

### Conectar y actualizar:

```bash
# 1. Conectar
ssh root@tu-servidor-digitalocean

# 2. Ir al backend
cd /home/desvare/desvare-proyect/backend

# 3. Backup
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 4. Editar
nano .env
```

### En nano, cambiar estas líneas:

#### Línea 3:
```env
NODE_ENV=production
```

#### Línea 31:
```env
TWILIO_DEV_MODE=false
```

#### Línea 35:
```env
JWT_SECRET=desvare_production_2026_super_secret_key_change_this
```

#### Línea 38 (CLIENT_URL):
```env
CLIENT_URL=https://desvare.app,https://www.desvare.app,https://desvare-proyect-mpdw.vercel.app
```

#### Línea 39 (DRIVER_URL):
```env
DRIVER_URL=https://driver.desvare.app,http://localhost:8100,http://localhost:5174,capacitor://localhost,ionic://localhost
```

#### Línea 40 (ADMIN_URL):
```env
ADMIN_URL=https://admin.desvare.app,https://desvare-admin.vercel.app,http://localhost:5176
```

### Guardar:
- `Ctrl + X`
- `Y`
- `Enter`

### Reiniciar:
```bash
pm2 restart desvare-backend
pm2 logs desvare-backend --lines 30
```

---

## 📋 PASO 2: Corregir DNS en GoDaddy

### A. Ir a GoDaddy DNS:

1. Login: https://sso.godaddy.com/
2. Ir a: "Mis productos" → "DNS"
3. Buscar: `desvare.app`
4. Click: "Manage DNS"

### B. Configurar estos registros:

#### Registro A para @ (desvare.app):
```
Tipo: A
Nombre: @
Valor: 76.76.21.21
TTL: 600
```

#### Registro A para api (api.desvare.app):
```
Tipo: A
Nombre: api
Valor: 161.35.227.156
TTL: 600
```

#### Registro CNAME para www:
```
Tipo: CNAME
Nombre: www
Valor: cname.vercel-dns.com
TTL: 600
```

#### Registro CNAME para admin:
```
Tipo: CNAME
Nombre: admin
Valor: cname.vercel-dns.com
TTL: 600
```

### C. Guardar cambios en GoDaddy

---

## 📋 PASO 3: Configurar Dominios en Vercel

### A. Ir a Vercel:

1. https://vercel.com/brayan-garcias-projects/desvare-proyect-mpdw/settings/domains

### B. Agregar dominios:

Click en "Add Domain" y agregar uno por uno:
- `desvare.app`
- `www.desvare.app`
- `admin.desvare.app`

### C. Esperar verificación:

- Vercel verificará automáticamente
- Puede tomar 10-30 minutos

---

## 📋 PASO 4: Verificar Número en Twilio

**IMPORTANTE:** Tu cuenta sigue en Trial.

1. **Ir a:** https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. **Agregar:** Tu número `+57 XXX XXX XXXX`
3. **Verificar** con código SMS

---

## ✅ Resultado Final

### Arquitectura:

```
PWA (usuarios)           → https://desvare.app (Vercel)
Admin (panel)           → https://admin.desvare.app (Vercel)
Driver App (localhost)  → http://localhost:8100 → API producción
Backend API             → https://api.desvare.app (DigitalOcean)
```

### URLs del Backend (.env):

```env
CLIENT_URL=https://desvare.app,https://www.desvare.app,https://desvare-proyect-mpdw.vercel.app
DRIVER_URL=https://driver.desvare.app,http://localhost:8100,http://localhost:5174,capacitor://localhost,ionic://localhost
ADMIN_URL=https://admin.desvare.app,https://desvare-admin.vercel.app,http://localhost:5176
```

### DNS en GoDaddy:

| Dominio | Tipo | Valor | Apunta a |
|---------|------|-------|----------|
| desvare.app | A | 76.76.21.21 | Vercel |
| www.desvare.app | CNAME | cname.vercel-dns.com | Vercel |
| admin.desvare.app | CNAME | cname.vercel-dns.com | Vercel |
| api.desvare.app | A | 161.35.227.156 | DigitalOcean |

---

## 🧪 Testing

### Después de 30 minutos:

1. **PWA:** https://desvare.app
   - Registrarse con número verificado
   - Debe funcionar

2. **Admin:** https://admin.desvare.app
   - Login con admin
   - Debe funcionar

3. **Driver App:** http://localhost:8100
   - Desde tu Mac
   - Debe conectarse al backend

---

## 📊 Checklist

### DigitalOcean (.env):
- [ ] NODE_ENV=production
- [ ] CLIENT_URL corregido
- [ ] DRIVER_URL corregido
- [ ] ADMIN_URL corregido
- [ ] JWT_SECRET actualizado
- [ ] TWILIO_DEV_MODE=false
- [ ] Backend reiniciado
- [ ] Logs verificados

### GoDaddy (DNS):
- [ ] A @ → 76.76.21.21
- [ ] A api → 161.35.227.156
- [ ] CNAME www → cname.vercel-dns.com
- [ ] CNAME admin → cname.vercel-dns.com
- [ ] Cambios guardados

### Vercel (Dominios):
- [ ] desvare.app agregado
- [ ] www.desvare.app agregado
- [ ] admin.desvare.app agregado
- [ ] Verificación exitosa

### Twilio:
- [ ] Número verificado
- [ ] SMS de prueba exitoso

---

## 🆘 Si algo falla

### Backend no reinicia:
```bash
pm2 status
pm2 restart desvare-backend --force
pm2 logs desvare-backend --lines 50
```

### DNS no propaga:
- Esperar 1-2 horas
- Verificar en: https://dnschecker.org/
- Limpiar caché DNS local

### Vercel no valida:
- Verificar que DNS esté correcto en GoDaddy
- Esperar 30-60 minutos
- Contactar soporte de Vercel si persiste

---

**Fecha:** 12 de febrero de 2026  
**Prioridad:** Alta  
**Tiempo estimado:** 30-60 minutos (+ propagación DNS)
