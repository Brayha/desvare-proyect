# 🗺️ Configuración de Google Maps API

Este documento explica cómo configurar Google Maps Places API para mejorar las búsquedas de direcciones en la aplicación Desvare.

## 📋 Requisitos Previos

- Cuenta de Google Cloud Platform
- Proyecto creado en Google Cloud Console
- Método de pago configurado (aunque el uso será gratuito dentro del free tier)

## 🔑 Paso 1: Crear API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. En el menú lateral, ve a **APIs & Services > Credentials**
4. Clic en **"+ CREATE CREDENTIALS"** > **"API key"**
5. Copia la API Key generada

## 🔓 Paso 2: Habilitar APIs Necesarias

1. Ve a **APIs & Services > Library**
2. Busca y habilita las siguientes APIs:
   - ✅ **Places API**
   - ✅ **Geocoding API**
   - ✅ **Maps JavaScript API** (opcional, para futuras mejoras)

## 🔒 Paso 3: Restringir la API Key (Seguridad)

### Restricciones de Aplicación:

1. Ve a **Credentials** > Clic en tu API Key
2. En **Application restrictions**:
   - Selecciona **"HTTP referrers (websites)"**
   - Agrega estos dominios:
     ```
     http://localhost:5173/*
     http://localhost:5174/*
     http://localhost:5001/*
     https://tu-dominio-produccion.com/*
     ```

### Restricciones de API:

1. En la misma página, en **API restrictions**:
   - Selecciona **"Restrict key"**
   - Marca solo:
     - Places API
     - Geocoding API

## ⚙️ Paso 4: Configurar Variables de Entorno

### Backend (.env)

```bash
# backend/.env
PORT=5001
NODE_ENV=development
MONGODB_URI=tu_mongodb_uri
JWT_SECRET=tu_jwt_secret

# URLs permitidas para CORS
CLIENT_URL=http://localhost:5173,http://localhost:5175
DRIVER_URL=http://localhost:5174,http://localhost:8100
```

### Frontend (.env)

Crea o edita el archivo `client-pwa/.env`:

```bash
# client-pwa/.env

# Mapbox (para el mapa visual)
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiYnJ5YW5wZXJlenF1aW50ZXJvIiwiYSI6ImNtMnFqd...

# Google Maps (para búsquedas mejoradas)
VITE_GOOGLE_MAPS_API_KEY=AIzaSy_TU_CLAVE_AQUI

# Backend URL
VITE_API_URL=http://localhost:5001
```

## 🚀 Paso 5: Reiniciar Servicios

Después de configurar las variables de entorno:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd client-pwa
npm run dev
```

## 💰 Costos y Límites

### Free Tier de Google Maps:
- **$200 USD gratis al mes**
- Places Autocomplete: $2.83 por 1000 búsquedas
- Place Details: $17 por 1000 detalles

### Estimación para tu app:
- 100-500 búsquedas/día = **$0 USD** (dentro del free tier)
- Solo pagarías si superas ~2,500 búsquedas diarias

## 🔧 Solución de Problemas

### ❌ Error: "REQUEST_DENIED"
**Causa:** API Key inválida o API no habilitada
**Solución:** 
- Verifica que copiaste la API Key correctamente
- Asegúrate de haber habilitado Places API

### ❌ Error: "This API project is not authorized..."
**Causa:** Restricciones de dominio incorrectas
**Solución:**
- Agrega `http://localhost:5001/*` a las restricciones HTTP referrers
- Espera 5 minutos para que los cambios se apliquen

### ❌ La búsqueda no devuelve resultados
**Causa:** Posible problema de CORS o backend no corriendo
**Solución:**
- Verifica que el backend esté corriendo en puerto 5001
- Revisa la consola del navegador para errores
- Verifica que `VITE_API_URL` esté configurado correctamente

### ⚠️ Fallback a Mapbox
Si Google Places falla por cualquier razón, la aplicación automáticamente usará Mapbox como respaldo. Verás un mensaje en la consola:
```
⚠️ VITE_GOOGLE_MAPS_API_KEY no está configurado. Las búsquedas usarán solo Mapbox.
```

## 📊 Monitoreo de Uso

Para ver cuántas llamadas estás haciendo a Google Maps:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Menú > **APIs & Services > Dashboard**
3. Selecciona **Places API**
4. Revisa las métricas de uso

## 🎯 Características Implementadas

Con Google Places API ahora puedes buscar:

- ✅ **Centros comerciales**: "Centro Comercial Unicentro Bogotá"
- ✅ **Empresas**: "Almacén Éxito", "Carulla"
- ✅ **Edificios**: "Torre Colpatria", "Edificio Avianca"
- ✅ **Restaurantes**: "McDonald's Calle 100"
- ✅ **Direcciones exactas**: "Carrera 7 # 32-16, Bogotá"
- ✅ **Barrios y localidades**: "Usaquén", "Chapinero"

## 📝 Notas Adicionales

- La API Key **NO debe** committearse al repositorio
- El archivo `.env` ya está en `.gitignore`
- En producción, usa variables de entorno del hosting (Vercel, Netlify, etc.)
- El proxy en el backend (`/api/google-places-proxy`) evita problemas de CORS

## 🆘 Soporte

Si tienes problemas con la configuración:
1. Revisa la consola del navegador (F12)
2. Revisa los logs del backend
3. Verifica que todas las APIs estén habilitadas
4. Espera 5-10 minutos después de crear/modificar la API Key

---

**Última actualización:** Noviembre 2024

