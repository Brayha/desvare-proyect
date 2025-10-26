# ⚡ Quick Start - Desvare App

Comandos rápidos para iniciar el sistema completo.

## 🚀 Iniciar Todo (3 Terminales)

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - PWA Cliente
```bash
cd client-pwa
npm run dev
```

### Terminal 3 - App Conductor
```bash
cd driver-app
npm run dev
```

## 🌐 URLs

- **Backend API**: http://localhost:5000
- **PWA Cliente**: http://localhost:5173
- **App Conductor**: http://localhost:5174

## 🧪 Usuarios de Prueba

Después de registrarte, usa estos datos para pruebas rápidas:

### Cliente
```
Email: cliente@test.com
Password: 123456
```

### Conductor
```
Email: conductor@test.com
Password: 123456
```

## 📋 Checklist Primera Vez

- [ ] Instalar dependencias del backend: `cd backend && npm install`
- [ ] Instalar dependencias de PWA: `cd client-pwa && npm install`
- [ ] Instalar dependencias de App: `cd driver-app && npm install`
- [ ] Configurar MongoDB Atlas en `backend/.env`
- [ ] Copiar `.env.example` a `.env` en cada proyecto
- [ ] Iniciar backend
- [ ] Iniciar PWA
- [ ] Iniciar App
- [ ] Registrar un cliente
- [ ] Registrar un conductor
- [ ] Probar solicitud de cotización

## 🔧 Comandos Útiles

### Reinstalar dependencias
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# PWA
cd client-pwa
rm -rf node_modules package-lock.json
npm install

# App
cd driver-app
rm -rf node_modules package-lock.json
npm install
```

### Ver logs en tiempo real
```bash
# Backend
cd backend
npm run dev | grep "🔌\|📢\|💰"

# Ver solo eventos Socket.IO
```

### Limpiar todo
```bash
# Desde la raíz del proyecto
rm -rf backend/node_modules client-pwa/node_modules driver-app/node_modules
rm -rf */package-lock.json
```

## 🐛 Solución Rápida de Problemas

### Backend no inicia
```bash
cd backend
npm install
# Verifica .env
cat .env
```

### PWA/App no carga
```bash
# Limpia cache de Vite
cd client-pwa  # o driver-app
rm -rf node_modules/.vite
npm run dev
```

### Socket.IO no conecta
1. Verifica que backend esté corriendo
2. Abre consola del navegador (F12)
3. Busca errores de conexión
4. Verifica URLs en `.env`

## 📊 Verificar que Todo Funciona

### 1. Backend
```bash
curl http://localhost:5000
# Debería devolver: {"message":"Desvare Backend API funcionando correctamente"}
```

### 2. MongoDB
En los logs del backend deberías ver:
```
✅ Conectado a MongoDB Atlas
```

### 3. Socket.IO
En la consola del navegador (F12) deberías ver:
```
✅ Conectado al servidor Socket.IO
```

## 🎯 Flujo de Prueba Rápido

1. Abre PWA en una ventana: http://localhost:5173
2. Abre App en otra ventana: http://localhost:5174
3. Registra un cliente en PWA
4. Registra un conductor en App
5. En PWA: Click "Buscar Cotización"
6. En App: Debería aparecer alerta → Click "Cotizar" → Ingresa monto → Enviar
7. En PWA: Debería aparecer la cotización

## 🎨 Personalización Rápida

### Cambiar puerto del backend
```bash
# backend/.env
PORT=3000
```

### Cambiar colores de Ionic
```css
/* client-pwa/src/theme/variables.css */
/* driver-app/src/theme/variables.css */
:root {
  --ion-color-primary: #3880ff;
  --ion-color-secondary: #3dc2ff;
}
```

### Cambiar nombre de la app
```javascript
// client-pwa/index.html
<title>Mi App Cliente</title>

// driver-app/index.html
<title>Mi App Conductor</title>
```

## 📦 Scripts NPM Disponibles

### Backend
- `npm start` - Producción
- `npm run dev` - Desarrollo con nodemon

### PWA / App
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build para producción
- `npm run preview` - Preview del build

## 🔥 Atajos

### Abrir todo en VS Code
```bash
code backend client-pwa driver-app
```

### Ver todos los procesos Node
```bash
ps aux | grep node
```

### Matar todos los procesos Node (¡cuidado!)
```bash
killall node
```

## 📚 Documentación Completa

- `README.md` - Documentación general
- `INSTALLATION_GUIDE.md` - Guía de instalación paso a paso
- `REALTIME_COMMUNICATION.md` - Explicación de Socket.IO
- `backend/README.md` - Documentación del backend
- `client-pwa/README.md` - Documentación de la PWA
- `driver-app/README.md` - Documentación de la app

## ⚡ Tips Pro

1. **Usa Concurrently para un solo comando**:
   ```bash
   npm install -g concurrently
   
   # Desde la raíz
   concurrently "cd backend && npm run dev" "cd client-pwa && npm run dev" "cd driver-app && npm run dev"
   ```

2. **Alias útiles** (agrega a tu `.bashrc` o `.zshrc`):
   ```bash
   alias desvare-backend="cd ~/Documents/desvare-proyect/backend && npm run dev"
   alias desvare-client="cd ~/Documents/desvare-proyect/client-pwa && npm run dev"
   alias desvare-driver="cd ~/Documents/desvare-proyect/driver-app && npm run dev"
   ```

3. **VS Code tasks** (`.vscode/tasks.json`):
   ```json
   {
     "version": "2.0.0",
     "tasks": [
       {
         "label": "Start Backend",
         "type": "shell",
         "command": "cd backend && npm run dev",
         "isBackground": true
       }
     ]
   }
   ```

¡Listo para desarrollar! 🚀


