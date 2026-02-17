# 🚀 Guía de Deployment - Proyecto Desvare

**Última actualización:** 14 de febrero de 2026

---

## 📋 Resumen

Esta guía cubre el proceso completo de deployment para todos los componentes del proyecto Desvare:

- **Frontend:** Vercel (3 proyectos: PWA Cliente, Driver App, Admin Dashboard)
- **Backend:** DigitalOcean (Node.js + PM2 + Nginx)
- **Base de Datos:** MongoDB Atlas

---

## 🌐 Deployment Frontend (Vercel)

### Requisitos Previos

1. Cuenta de Vercel conectada a GitHub
2. Repositorio con los cambios pusheados
3. Variables de entorno configuradas

### Configuración para Client PWA

1. **Ir a Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Configurar el Proyecto**
   - **Project Name:** `desvare-client-pwa` (o similar)
   - **Framework Preset:** Vite
   - **Root Directory:** `client-pwa`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Node Version:** 18.x

3. **Variables de Entorno**
   ```
   VITE_API_URL=https://api.desvare.app
   VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_key
   ```

4. **Dominios**
   - Dominio principal: `www.desvare.app`
   - Dominio alternativo: `desvare.app` (redirigir a www)

5. **Verificar `vercel.json`**
   - Debe existir en `client-pwa/vercel.json`
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

### Configuración para Driver App

1. **Configurar Proyecto en Vercel**
   - **Project Name:** `desvare-driver-app`
   - **Framework Preset:** Vite
   - **Root Directory:** `driver-app`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Node Version:** 18.x

2. **Variables de Entorno**
   ```
   VITE_API_URL=https://api.desvare.app
   VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_key
   ```

3. **Dominios**
   - Dominio principal: `driver.desvare.app`

4. **Verificar `vercel.json`**
   - Debe existir en `driver-app/vercel.json`

### Configuración para Admin Dashboard

1. **Configurar Proyecto en Vercel**
   - **Project Name:** `desvare-admin`
   - **Framework Preset:** Vite
   - **Root Directory:** `admin-dashboard`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Node Version:** 18.x

2. **Variables de Entorno**
   ```
   VITE_API_URL=https://api.desvare.app
   ```

3. **Dominios**
   - Dominio principal: `admin.desvare.app`

4. **Verificar `vercel.json`**
   - Debe existir en `admin-dashboard/vercel.json`

### Proceso de Deployment

#### Deployment Automático (Git Push)
```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

Vercel detectará automáticamente los cambios y desplegará todos los proyectos.

#### Deployment Manual (desde Vercel)
1. Ir al dashboard del proyecto
2. Click en "Deployments"
3. Click en "Redeploy" en el último deployment
4. Opción: "Use existing build cache" (desmarcado para rebuild completo)

#### Forzar Nuevo Deployment
```bash
# Crear commit vacío
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main
```

### Solución de Problemas en Vercel

#### Build falla con error de módulos no encontrados
- **Problema:** Referencias a carpeta `shared/` eliminada
- **Solución:** Verificar que no existan imports a `@shared` o `../../../shared`

#### 404 al refrescar páginas
- **Problema:** Falta configuración de SPA routing
- **Solución:** Verificar que existe `vercel.json` con rewrites

#### Build exitoso pero sitio no actualizado
- **Problema:** Vercel sirviendo deployment anterior
- **Solución:** 
  1. Ir a "Deployments"
  2. Encontrar el deployment más reciente con el commit correcto
  3. Click en "Promote to Production"

---

## 🖥️ Deployment Backend (DigitalOcean)

### Requisitos Previos

1. Droplet de DigitalOcean con Ubuntu
2. Acceso SSH
3. Node.js v18+ instalado
4. PM2 instalado globalmente
5. Nginx instalado

### Proceso de Deployment

#### 1. Conectar al Servidor
```bash
ssh root@tu-droplet-ip
# o
ssh root@desvare-backend
```

#### 2. Navegar al Proyecto
```bash
cd /home/desvare/desvare-proyect/backend
```

#### 3. Pull Últimos Cambios
```bash
git pull origin main
```

#### 4. Instalar Dependencias (si hay nuevas)
```bash
npm install
```

#### 5. Verificar Variables de Entorno
```bash
cat .env | grep PORT
cat .env | grep NODE_ENV
```

Debe mostrar:
```
NODE_ENV=production
PORT=5001
```

#### 6. Reiniciar Aplicación con PM2

**Opción A: Restart Simple**
```bash
pm2 restart desvare-backend
```

**Opción B: Restart Completo (cambios en .env)**
```bash
pm2 delete desvare-backend
pm2 start server.js --name desvare-backend --update-env
pm2 save
```

#### 7. Verificar Estado
```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs desvare-backend

# Ver últimos 50 logs
pm2 logs desvare-backend --lines 50
```

#### 8. Verificar Nginx (si cambió configuración)
```bash
# Verificar sintaxis
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver estado
sudo systemctl status nginx
```

### Configuración Inicial (Primera vez)

#### Instalar Dependencias del Sistema
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js v18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx
```

#### Configurar Nginx
```bash
# Crear configuración
sudo nano /etc/nginx/sites-available/desvare-api
```

Contenido:
```nginx
server {
    listen 80;
    server_name api.desvare.app;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activar configuración
sudo ln -s /etc/nginx/sites-available/desvare-api /etc/nginx/sites-enabled/

# Verificar
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx
```

#### Configurar SSL con Certbot (HTTPS)
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d api.desvare.app

# Verificar renovación automática
sudo certbot renew --dry-run
```

#### Configurar PM2 Startup
```bash
# Generar script de inicio
pm2 startup systemd

# Copiar y ejecutar el comando que PM2 devuelve

# Guardar configuración actual
pm2 save
```

### Comandos Útiles para Mantenimiento

```bash
# Ver logs de error
pm2 logs desvare-backend --err

# Ver logs de salida
pm2 logs desvare-backend --out

# Limpiar logs antiguos
pm2 flush desvare-backend

# Monitorear recursos
pm2 monit

# Reiniciar automáticamente si usa mucha memoria
pm2 start server.js --name desvare-backend --max-memory-restart 500M
```

### Solución de Problemas Backend

#### Backend no inicia
```bash
# Ver logs completos
pm2 logs desvare-backend --lines 100 --err

# Verificar sintaxis del código
node -c server.js

# Verificar variables de entorno
pm2 env desvare-backend
```

#### Puerto ya en uso
```bash
# Ver qué proceso usa el puerto 5001
sudo lsof -i :5001

# Matar proceso si es necesario
sudo kill -9 PID
```

#### Cambios no se reflejan
```bash
# Hard reset de PM2
pm2 delete desvare-backend
cd /home/desvare/desvare-proyect/backend
git reset --hard origin/main
npm install
pm2 start server.js --name desvare-backend
pm2 save
```

---

## 🗄️ MongoDB Atlas

### Configuración

1. **Acceder a MongoDB Atlas**
   - https://cloud.mongodb.com/

2. **Verificar Conexión**
   - Database Access: Usuario configurado
   - Network Access: IP del servidor permitida (0.0.0.0/0 para desarrollo)

3. **Connection String**
   - Formato: `mongodb+srv://usuario:password@cluster.mongodb.net/desvare?retryWrites=true&w=majority`
   - Debe estar en `.env` del backend: `MONGODB_URI=...`

### Backup

```bash
# Desde servidor local o DigitalOcean
mongodump --uri="mongodb+srv://usuario:password@cluster.mongodb.net/desvare" --out=/backup/$(date +%Y%m%d)
```

---

## ✅ Checklist de Deployment Completo

### Pre-Deployment
- [ ] Código testeado localmente
- [ ] Cambios commiteados en Git
- [ ] Variables de entorno verificadas
- [ ] No hay referencias a `shared/` en frontend

### Frontend (Vercel)
- [ ] Build local exitoso (`npm run build`)
- [ ] `vercel.json` presente en cada proyecto
- [ ] Variables de entorno configuradas en Vercel
- [ ] Push a `main` realizado
- [ ] Deployments automáticos ejecutados
- [ ] Verificar en navegador cada URL

### Backend (DigitalOcean)
- [ ] Pull de cambios en servidor
- [ ] `npm install` ejecutado (si hay nuevas dependencias)
- [ ] `.env` actualizado
- [ ] PM2 reiniciado con `--update-env`
- [ ] Logs sin errores (`pm2 logs`)
- [ ] Nginx funcionando correctamente
- [ ] API responde correctamente (`curl https://api.desvare.app/health`)

### Post-Deployment
- [ ] Login funciona en PWA
- [ ] Login funciona en Driver App
- [ ] Login funciona en Admin Dashboard
- [ ] Tracking en tiempo real funciona
- [ ] Notificaciones funcionan
- [ ] OTP llega correctamente

---

## 📞 Soporte

Si encuentras problemas durante el deployment:

1. Revisar `docs/TROUBLESHOOTING.md`
2. Verificar logs de PM2 y Vercel
3. Consultar `docs/CONFIGURACION_ACTUAL.md` para configuración actual

---

## 🔄 Rollback (Revertir Deployment)

### Frontend (Vercel)
1. Ir a "Deployments" en Vercel
2. Encontrar el deployment anterior funcional
3. Click en "Promote to Production"

### Backend (DigitalOcean)
```bash
cd /home/desvare/desvare-proyect/backend
git log --oneline -10  # Ver últimos commits
git reset --hard COMMIT_HASH  # Revertir a commit específico
pm2 restart desvare-backend
```

**⚠️ Advertencia:** El rollback puede causar inconsistencias si hubo cambios en la base de datos.
