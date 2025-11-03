# 🔍 Guía de Debugging - Google Places API

## Pasos para que funcione "jg automotriz" y otros negocios

### 1. ✅ Verificar que el Backend esté corriendo

Abre una terminal y ejecuta:

```bash
cd backend
npm run dev
```

**Deberías ver:**
```
🚀 Servidor corriendo en puerto 5001
📡 Socket.IO listo para conexiones en tiempo real
✅ Conectado a MongoDB Atlas
```

---

### 2. ✅ Verificar la API Key en el Frontend

Abre el archivo `client-pwa/.env` y verifica que tengas:

```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSy_TU_CLAVE_REAL_AQUI
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiYnJ5YW5w...
VITE_API_URL=http://localhost:5001
```

**Importante:** 
- La API Key debe ser la que creaste en Google Cloud Console
- NO debe tener espacios al inicio ni al final
- Debe empezar con `AIza`

---

### 3. ✅ Reiniciar el Frontend

```bash
cd client-pwa
npm run dev
```

**Importante:** Si ya estaba corriendo, detenlo (Ctrl+C) y reinícialo para que tome los cambios del `.env`

---

### 4. 🧪 Probar la Búsqueda

1. Abre tu app en el navegador
2. Ve a "Solicitar Servicio"
3. Haz clic en "¿A dónde vamos?"
4. Escribe: **"jg automotriz"**
5. **Abre la Consola del Navegador (F12)**

---

### 5. 📊 Ver los Logs en la Consola

**Si todo funciona bien, deberías ver:**

```
🔍 Buscando en Google Places: jg automotriz
📊 Respuesta de Google Places: {status: 'OK', resultados: 5}
✅ 5 resultados encontrados en Google Places
📍 Obteniendo detalles de lugares...
✅ 5 lugares con coordenadas obtenidas
```

**Y luego los resultados:**
- J.G AUTOMOTRIZ Diagonal 79a Bis, Bogotá
- J.G. AUTOMOTRIZ Carrera 8, Mesitas del Colegio
- JG Automotriz José Manuel Iturregui, Lima, Perú

---

### 6. ❌ Problemas Comunes y Soluciones

#### Problema 1: "REQUEST_DENIED"

**En consola verás:**
```
❌ Google Places API Key inválida o restricciones de dominio
```

**Solución:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Clic en tu API Key
3. En "Application restrictions":
   - Selecciona **"HTTP referrers"**
   - Agrega: `http://localhost:5001/*`
   - Agrega: `http://localhost:5173/*`
4. En "API restrictions":
   - Marca **"Places API"**
5. Guarda y espera 5 minutos

---

#### Problema 2: "No se encontraron resultados"

**En consola verás:**
```
ℹ️ No se encontraron resultados en Google Places
```

**Causas posibles:**
- La API Key está mal copiada en el `.env`
- No reiniciaste el frontend después de agregar la API Key
- La Places API no está habilitada en Google Cloud

**Solución:**
1. Verifica el `.env`: `cat client-pwa/.env`
2. Reinicia el frontend: Ctrl+C y luego `npm run dev`
3. Verifica en [Google Cloud Console](https://console.cloud.google.com/apis/library/places-backend.googleapis.com) que Places API esté habilitada

---

#### Problema 3: Error 500 del Proxy

**En consola verás:**
```
❌ Error HTTP del proxy: 500
```

**Solución:**
- Verifica que el backend esté corriendo
- Revisa los logs del backend (terminal donde corre `npm run dev`)
- Verifica que `VITE_API_URL` sea `http://localhost:5001`

---

#### Problema 4: Solo aparece "Buscando..." sin resultados

**Causas:**
- El backend no está corriendo
- La URL del backend está mal configurada
- Hay un error de red

**Solución:**
1. Verifica que el backend corra en puerto 5001
2. En el navegador, abre: `http://localhost:5001/`
3. Deberías ver: `{"message":"Desvare Backend API funcionando correctamente"}`
4. Si no funciona, revisa que no haya otro proceso usando el puerto 5001

---

### 7. 🔍 Prueba Manual del Proxy

Abre esta URL en tu navegador:

```
http://localhost:5001/api/google-places-proxy?input=jg%20automotriz&key=TU_API_KEY_AQUI&language=es&components=country:co
```

**Reemplaza `TU_API_KEY_AQUI` con tu API Key real**

**Si funciona, deberías ver:**
```json
{
  "predictions": [
    {
      "description": "J.G AUTOMOTRIZ, Diagonal 79a Bis, Bogotá, Colombia",
      "place_id": "ChIJ..."
    }
  ],
  "status": "OK"
}
```

**Si ves `REQUEST_DENIED`:**
- Tu API Key es inválida o tiene restricciones incorrectas

**Si ves `ZERO_RESULTS`:**
- La búsqueda funciona pero no encontró ese lugar específico

---

### 8. ✅ Checklist Final

- [ ] Backend corriendo en puerto 5001
- [ ] Frontend corriendo en puerto 5173
- [ ] Archivo `client-pwa/.env` tiene `VITE_GOOGLE_MAPS_API_KEY`
- [ ] Places API habilitada en Google Cloud
- [ ] API Key con restricciones correctas
- [ ] Ambos servicios reiniciados después de cambios
- [ ] Consola del navegador abierta (F12) para ver logs

---

### 9. 📝 Ejemplo de Búsquedas que Deberían Funcionar

Una vez configurado correctamente, prueba estas búsquedas:

| Búsqueda | Resultados Esperados |
|----------|---------------------|
| "jg automotriz" | Talleres JG Automotriz en Bogotá |
| "unicentro bogota" | Centro Comercial Unicentro |
| "exito calle 100" | Almacén Éxito Calle 100 |
| "torre colpatria" | Torre Colpatria, Centro de Bogotá |
| "mcdonald's chapinero" | Restaurantes McDonald's en Chapinero |

---

### 10. 🆘 Si Nada Funciona

**Opción 1: Verificar la API Key directamente en Google**

1. Ve a: https://www.google.com/maps/search/jg+automotriz+bogota
2. Si ves resultados, significa que Google Places tiene esos datos
3. El problema es de configuración en tu app

**Opción 2: Usar solo Mapbox temporalmente**

Si Google Places no funciona, la app automáticamente usa Mapbox como respaldo. Verás en consola:
```
⚠️ Google Maps API Key no configurada, usando Mapbox...
```

**Opción 3: Revisar logs del backend**

En la terminal donde corre el backend, busca:
```
🔍 Proxy Google Places: https://maps.googleapis.com/maps/api/place/autocomplete/json
❌ Error de Google Places: REQUEST_DENIED
```

Esto te dirá exactamente qué está fallando.

---

## 🎯 Resultado Esperado Final

Cuando escribas "jg automotriz" en el buscador, deberías ver:

```
✅ Resultados:
📍 J.G AUTOMOTRIZ - Diagonal 79a Bis, Bogotá, Colombia
📍 J.G. AUTOMOTRIZ - Carrera 8, Mesitas del Colegio
📍 JG Automotriz - (otras ubicaciones)
```

Y al seleccionar uno, el mapa debe mostrar la ruta desde tu ubicación hasta ese taller.

---

**¿Listo para probar? ¡Sigue los pasos en orden y avísame qué ves en la consola!** 🚀

