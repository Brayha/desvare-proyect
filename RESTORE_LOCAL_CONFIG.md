# 🔄 Restaurar Configuración Local

## Paso 1: Actualizar .env

Abre el archivo:
```
/Users/bgarcia/Documents/desvare-proyect/client-pwa/.env
```

Y cámbialo a:
```env
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001

VITE_MAPBOX_TOKEN=pk.ey...
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

(Mantén tus tokens de Mapbox y Google Maps como están)

---

## Paso 2: Iniciar Desarrollo Local

### Terminal 1 - Backend:
```bash
cd /Users/bgarcia/Documents/desvare-proyect/backend
npm start
```

### Terminal 2 - Frontend:
```bash
cd /Users/bgarcia/Documents/desvare-proyect/client-pwa
npm run dev
```

### Acceder:
```
http://localhost:5173
```

---

## ✅ Todo funcionará como antes

- ✅ Backend en localhost:5001
- ✅ Frontend en localhost:5173
- ✅ Sin complicaciones de ngrok
- ✅ Desarrollo normal

---

## 🚀 Para Producción (Después)

Cuando subas a Digital Ocean con desvare.app:

1. Configurarás las variables de entorno en tu servidor
2. Usarás HTTPS automáticamente con tu dominio
3. Todo funcionará perfecto incluyendo geolocalización

---

## 🗑️ Archivos que puedes eliminar (opcional):

- `setup-ngrok.sh` - Ya no lo necesitas
- Certificados SSL locales - Ya los eliminamos
- `RESTORE_LOCAL_CONFIG.md` - Este archivo después de leerlo

---

**¡Listo para seguir desarrollando localmente!** 🎉

