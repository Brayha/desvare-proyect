# 🧪 Cómo Probar el Sistema de Notificaciones

**Guía paso a paso para testing**

---

## 🚀 Preparación

### 1. Iniciar Backend
```bash
cd backend
npm run dev
```

**Verificar en consola:**
```
✅ Conectado a MongoDB Atlas
⏰ Iniciando verificador de expiración
🚀 Servidor corriendo en puerto 5001
📡 Socket.IO listo
```

### 2. Iniciar Client PWA
```bash
cd client-pwa
npm run dev
```

**Verificar:**
```
VITE v5.4.2  ready
➜  Local:   http://localhost:5173/
```

### 3. Iniciar Driver App
```bash
cd driver-app
npm run dev
```

**Verificar:**
```
VITE v7.1.12  ready
➜  Local:   http://localhost:5175/
```

---

## 🎬 Escenario de Prueba Completo

### Paso 1: Cliente Solicita Servicio

1. **Abre navegador #1:** `http://localhost:5173`

2. **Registra nuevo cliente:**
   - Click en "Registrarme"
   - Llena datos (nombre, teléfono, email)
   - Verifica OTP (código: 0000)

3. **Crea vehículo:**
   - Selecciona categoría
   - Elige marca y modelo
   - Ingresa placa

4. **Solicita servicio:**
   - Selecciona origen (arrastra pin en mapa)
   - Selecciona destino
   - Describe problema
   - Envía solicitud

5. **Espera en WaitingQuotes:**
   - Debes ver el mapa con tu ubicación (pin azul)
   - Mensaje: "Buscando conductores..."

**Verificar en consola del navegador:**
```javascript
✅ Socket.IO conectado exitosamente
👤 Registrando cliente: [clientId]
```

---

### Paso 2: Conductor Recibe y Cotiza

1. **Abre navegador #2 (o ventana incógnita):** `http://localhost:5175`

2. **Inicia sesión como conductor:**
   - Usa credenciales de un conductor aprobado
   - O crea uno nuevo y apruébalo desde admin

3. **Verifica estado:**
   - Toggle debe estar en "Activo" (verde)
   - Debes ver la solicitud en la bandeja

4. **Envía cotización:**
   - Click en "Cotizar"
   - Ingresa monto (ej: 120000)
   - Envía

**Verificar en consola del navegador (conductor):**
```javascript
🚗 Conductor registrado: [driverId] - Estado: 🟢 ACTIVO
📥 Nueva solicitud recibida: [datos]
💰 Cotización enviada: [monto]
```

**Verificar en consola del backend:**
```javascript
👤 Cliente registrado: [clientId]
🚗 Conductor registrado: [driverId] - Estado: 🟢 ACTIVO
✅ Solicitud emitida a 1 conductores ACTIVOS
💰 Cotización recibida del conductor
📤 Enviando cotización al cliente...
```

---

### Paso 3: Cliente Recibe Notificación

**En el navegador del cliente (#1), deberías ver:**

1. ✨ **Banner de notificación aparece desde arriba**
   - Gradiente morado
   - Icono 💰 animado
   - Nombre del conductor
   - Monto en COP
   - Botón de cerrar [X]

2. 🔊 **Sonido se reproduce** (si existe archivo)

3. 📳 **Dispositivo vibra** (solo en móviles)

4. 📍 **Marcador aparece en el mapa**
   - Muestra el precio
   - Ubicación del conductor

5. ⏱️ **Banner se cierra automáticamente** después de 5 segundos

**Verificar en consola del navegador (cliente):**
```javascript
💰 Cotización recibida en WaitingQuotes: {...}
📍 Ubicación del conductor: { lat, lng }
🔔 Notificación mostrada: { hasSound: true, hasVibration: true }
```

---

## 🧪 Tests Específicos

### Test 1: Notificación Visual

**Objetivo:** Verificar que el banner aparezca correctamente

**Pasos:**
1. Seguir flujo completo
2. Cuando conductor envíe cotización...

**✅ Debe pasar:**
- Banner aparece desde arriba con animación suave
- Muestra nombre del conductor correctamente
- Muestra monto en formato COP ($120,000)
- Muestra icono "Ver en el mapa"
- Tiene botón [X] para cerrar
- Barra de progreso se anima
- Se cierra automáticamente después de 5s

---

### Test 2: Sonido

**Prerequisito:** Archivo `client-pwa/public/notification-sound.mp3` debe existir

**Pasos:**
1. Seguir flujo completo
2. Tener volumen del dispositivo activado
3. Cuando conductor envíe cotización...

**✅ Debe pasar:**
- Sonido se reproduce automáticamente
- Volumen es moderado (70%)
- No hay cortes ni distorsión

**Si no tienes el archivo:**
- La app funcionará igual
- Solo no sonará (se loggea advertencia en consola)

---

### Test 3: Vibración

**Prerequisito:** Usar dispositivo móvil real o simulador

**Pasos:**
1. Usar smartphone (Android/iOS)
2. Seguir flujo completo
3. Cuando conductor envíe cotización...

**✅ Debe pasar:**
- Dispositivo vibra con patrón: 200ms, pausa 100ms, 200ms
- Vibración es perceptible pero no molesta

**En desktop:**
- No vibra (normal, no está soportado)

---

### Test 4: Pull to Refresh

**Objetivo:** Verificar actualización manual

**Pasos:**
1. Cliente está en WaitingQuotes
2. Ya recibió algunas cotizaciones
3. Deslizar hacia abajo desde el top

**✅ Debe pasar:**
- Animación de "actualizar" aparece
- Mensaje: "Actualizando cotizaciones..."
- Llama al backend (ver Network tab)
- Lista se actualiza
- Toast muestra: "X cotizaciones actualizadas"

---

### Test 5: Múltiples Cotizaciones

**Objetivo:** Ver múltiples notificaciones

**Pasos:**
1. Tener 2-3 conductores conectados
2. Todos envían cotizaciones (rápido)

**✅ Debe pasar:**
- Notificaciones aparecen una tras otra
- No se superponen (se apilan verticalmente si están activas)
- Cada una se cierra automáticamente
- Marcadores de todos los conductores aparecen en el mapa
- Mapa hace auto-zoom para mostrar todos

---

### Test 6: Socket.IO Desconectado

**Objetivo:** Manejo de errores

**Pasos:**
1. Cliente en WaitingQuotes
2. Detener backend (`Ctrl+C`)
3. Esperar unos segundos

**✅ Debe pasar:**
- Consola muestra: "❌ Socket.IO desconectado"
- Cliente intenta reconectar automáticamente
- Reiniciar backend
- Cliente se reconecta automáticamente
- Todo vuelve a funcionar

---

### Test 7: Toggle Activo/Ocupado (Conductor)

**Objetivo:** Filtrado funciona

**Escenario A - Conductor ACTIVO:**
1. Conductor con toggle en "Activo" (verde)
2. Cliente envía solicitud

**✅ Debe pasar:**
- Conductor recibe la solicitud
- Aparece en su bandeja
- Puede cotizar

**Escenario B - Conductor OCUPADO:**
1. Conductor cambia toggle a "Ocupado" (rojo)
2. Cliente envía solicitud

**✅ Debe pasar:**
- Conductor NO recibe la solicitud
- No aparece en su bandeja
- Mensaje: "Estás OCUPADO. Activa tu disponibilidad..."

**Verificar en backend:**
```javascript
// Cuando conductor está ACTIVO:
✅ Solicitud emitida a 1 conductores ACTIVOS

// Cuando conductor está OCUPADO:
✅ Solicitud emitida a 0 conductores ACTIVOS
```

---

## 📊 Checklist de Testing

Usa esta lista para verificar que todo funciona:

### Básico
- [ ] Backend inicia sin errores
- [ ] Client PWA inicia sin errores
- [ ] Driver App inicia sin errores
- [ ] Socket.IO conecta correctamente

### Cliente
- [ ] Puede registrarse
- [ ] Puede crear vehículo
- [ ] Puede solicitar servicio
- [ ] Ve mapa con su ubicación
- [ ] Socket.IO se conecta
- [ ] Se registra como cliente en Socket.IO

### Conductor
- [ ] Puede iniciar sesión
- [ ] Ve solicitudes en bandeja
- [ ] Puede enviar cotización
- [ ] Toggle Activo/Ocupado funciona
- [ ] Cuando está ocupado, no recibe solicitudes

### Notificaciones
- [ ] Banner aparece correctamente
- [ ] Animación es suave
- [ ] Muestra información correcta
- [ ] Sonido funciona (si archivo existe)
- [ ] Vibración funciona (en móviles)
- [ ] Marcador aparece en mapa
- [ ] Auto-cierre funciona (5s)
- [ ] Cerrar manual funciona [X]
- [ ] Múltiples notificaciones se manejan bien

### Pull to Refresh
- [ ] Animación aparece
- [ ] Llama al backend
- [ ] Actualiza lista
- [ ] Toast de confirmación aparece

---

## 🐛 Troubleshooting

### Problema: Banner no aparece

**Verificar:**
1. ¿Socket.IO está conectado? (ver consola)
2. ¿Cliente está registrado? (ver logs backend)
3. ¿Conductor está activo? (toggle verde)

### Problema: No suena

**Solución:**
1. Verificar que `/public/notification-sound.mp3` existe
2. Volumen del dispositivo activado
3. Primera interacción del usuario desbloquea audio

### Problema: No vibra

**Normal en:**
- Desktop/laptop
- Algunos navegadores

**Verificar en móvil:**
- Permisos de vibración
- Modo silencio/vibración del dispositivo

### Problema: Cotización no llega al cliente

**Verificar:**
1. Backend corriendo: `localhost:5001`
2. Socket.IO conectado (ambos lados)
3. Cliente registrado en Socket.IO
4. Conductor está activo (no ocupado)

**En consola del backend buscar:**
```javascript
⚠️ Cliente no encontrado con ID: [clientId]
```

Si aparece, significa que el cliente no está registrado correctamente.

---

## 📝 Notas Importantes

### Sonido
- Archivo debe llamarse exactamente: `notification-sound.mp3`
- Ubicación: `client-pwa/public/notification-sound.mp3`
- Si no existe, la app funciona igual (sin sonido)

### Vibración
- Solo funciona en dispositivos móviles físicos
- Algunos simuladores no lo soportan
- Desktop/laptop no vibran

### Socket.IO
- Reconexión automática está activada
- Máximo 5 intentos de reconexión
- Timeout de 10 segundos

---

## ✅ Testing Exitoso

Si todo funciona, deberías poder:

1. ✅ Cliente solicita servicio
2. ✅ Conductor recibe solicitud (si está activo)
3. ✅ Conductor envía cotización
4. ✅ Cliente recibe notificación instantánea con sonido y vibración
5. ✅ Marcador aparece en mapa
6. ✅ Pull to refresh actualiza correctamente
7. ✅ Toggle activo/ocupado filtra correctamente

---

**¡Sistema de notificaciones funcionando al 100%!** 🎉

---

*Para más detalles técnicos, consulta:*
- [NOTIFICACIONES_IN_APP_IMPLEMENTADAS.md](NOTIFICACIONES_IN_APP_IMPLEMENTADAS.md)
- [SISTEMA_COMPLETO_FILTRADO_Y_EXPIRACION.md](SISTEMA_COMPLETO_FILTRADO_Y_EXPIRACION.md)
