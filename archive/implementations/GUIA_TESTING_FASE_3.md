# 🧪 Guía de Testing - Fase 3: Aceptación de Cotizaciones

**Cómo probar el sistema completo paso a paso**

---

## 🚀 Preparación

### 1. Asegúrate de tener todo corriendo:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Client PWA
cd client-pwa
npm run dev

# Terminal 3: Driver App
cd driver-app
npm run dev
```

---

## 🎬 Escenario de Prueba Completo

### **PASO 1: Cliente Solicita Servicio**

1. **Navegar:** `http://localhost:5173`
2. **Registrar/Iniciar sesión** como cliente
3. **Solicitar servicio:**
   - Selecciona origen y destino
   - Describe problema
   - Envía solicitud
4. **Llega a WaitingQuotes**
   - Ve mapa con pin azul (su ubicación)
   - Mensaje: "Buscando conductores..."

---

### **PASO 2: Conductor Cotiza**

1. **Navegar (otro navegador):** `http://localhost:5175`
2. **Iniciar sesión** como conductor aprobado
3. **Verificar estado:** Toggle debe estar en "ACTIVO" (🟢)
4. **Ver solicitud** en la bandeja
5. **Cotizar:**
   - Click en "Cotizar"
   - Ingresa monto (ej: 120000)
   - Envía

**✅ Verificar en client-pwa:**
- Banner de notificación aparece
- Sonido (si existe archivo)
- Marcador aparece en el mapa con precio

---

### **PASO 3: Cliente Abre Sheet Modal**

**En client-pwa (navegador #1):**

1. **Click en marcador** del mapa (💰 $120,000)

**✅ Debe pasar:**
- Sheet Modal se desliza desde abajo
- Empieza en 30% de altura
- Muestra:
  - 👤 Nombre del conductor
  - ⭐ Rating y servicios
  - 💰 Monto
  - 📍 Distancia estimada

2. **Deslizar hacia arriba** (o click en handle)

**✅ Debe pasar:**
- Sheet sube a 60%
- Muestra detalles completos:
  - ✅ Capacidades
  - 🚚 Info de grúa
  - 💬 Sección de reseñas

3. **Deslizar hacia arriba de nuevo**

**✅ Debe pasar:**
- Sheet sube a 100% (fullscreen)
- Backdrop oscurece el mapa
- Muestra reseñas completas

---

### **PASO 4: Cliente Acepta Cotización**

**En el Sheet Modal:**

1. **Click** en botón "Aceptar por $120,000"

**✅ Debe aparecer:**
- Alerta de confirmación
- "¿Deseas aceptar la cotización de [Nombre] por $120,000?"
- Botones: [Cancelar] [Aceptar]

2. **Click** en "Aceptar"

**✅ Debe pasar:**
- Botón muestra "Aceptando..." con spinner
- Llama al backend
- Sheet se cierra
- Toast: "¡Cotización aceptada!"
- Navega a `/driver-on-way`

**✅ Backend debe loggear:**
```
✅ Cotización aceptada para solicitud [id]
👤 Cliente: [nombre]
🚗 Conductor asignado: [nombre] (ahora OCUPADO)
🔒 Código de seguridad: 2435
📢 3 conductores notificados que el servicio fue tomado
```

---

### **PASO 5: Conductor Recibe Notificación**

**En driver-app (navegador #2):**

**✅ Debe aparecer:**
- 🎉 Alerta: "¡Cotización Aceptada!"
- Mensaje: "[Nombre cliente] aceptó tu cotización. Ve a recoger el vehículo."
- Botón: [OK]

**✅ Debe pasar automáticamente:**
- Toggle cambia a "OCUPADO" (🔴)
- Card de la solicitud desaparece de la bandeja
- No recibe más solicitudes nuevas

**✅ Consola debe mostrar:**
```
🎉 ¡Tu cotización fue aceptada! { clientName, securityCode }
🔴 Conductor ahora OCUPADO
```

---

### **PASO 6: Otros Conductores Notificados**

**Si había otros conductores que cotizaron:**

**En sus apps:**

**✅ Debe pasar:**
- Toast: "Este servicio ya fue tomado por otro conductor"
- Card se remueve de su bandeja
- Siguen en estado ACTIVO
- Siguen viendo otras solicitudes

---

### **PASO 7: Vista "Conductor en Camino"**

**En client-pwa (navegador #1):**

**✅ Debe mostrar:**

1. **Mapa (60% superior):**
   - Pin azul en origen
   - Pin rojo en destino
   - Línea de ruta entre ambos

2. **Card del conductor (flotante):**
   - 👤 Avatar con inicial
   - Nombre y rating
   - ⏱️ "Llegada estimada: 15 min"
   - 📞 Botón "Llamar"
   - 💬 Botón "Chat"

3. **Código de seguridad:**
   ```
   🔒 Código de Seguridad
   ┌──┐ ┌──┐ ┌──┐ ┌──┐
   │2 │ │4 │ │3 │ │5 │
   └──┘ └──┘ └──┘ └──┘
   Dale este código al conductor cuando llegue
   ```

4. **Detalles del servicio:**
   - Monto acordado: $120,000
   - Grúa: Mediana • ABC123

5. **Botón de cancelar**

---

### **PASO 8: Probar Botones**

1. **Click "Llamar":**
   - ✅ Abre el dialer del teléfono
   - ✅ Número pre-marcado

2. **Click "Chat":**
   - ✅ Toast: "Chat próximamente disponible"
   - (Será implementado después)

3. **Click "Cancelar Servicio":**
   - ✅ Toast: "Cancelación próximamente"
   - (Será implementado después)

---

### **PASO 9: Probar Pull to Refresh (Driver App)**

**En driver-app:**

1. Envía una cotización
2. **Desliza hacia abajo** desde el top

**✅ Debe pasar:**
- Animación de refresh
- Llama al backend
- Lista se actualiza
- Toast: "X solicitudes actualizadas"
- Card muestra estado correcto ("Cotizada")

---

## 🐛 Troubleshooting

### Problema: Sheet Modal no abre

**Verificar:**
1. ¿Hay cotizaciones en el mapa?
2. ¿Los marcadores son clickeables?
3. Ver consola: "💰 Click en cotización: ..."

### Problema: Aceptación falla

**Verificar en consola:**
```
❌ Error al aceptar cotización: [detalles]
```

**Revisar:**
- Backend corriendo
- requestId en localStorage
- user en localStorage
- Cotización existe en BD

### Problema: Conductor no recibe notificación

**Verificar:**
1. Conductor está conectado a Socket.IO
2. Backend registró al conductor
3. Ver logs backend: "📤 Enviando notificación a conductor..."

### Problema: Toggle no cambia a OCUPADO

**Verificar:**
- Socket.IO recibió 'service:accepted'
- localStorage se actualizó
- Recargar página si es necesario

---

## 📊 Logs Esperados

### **Client PWA:**
```
💰 Click en cotización: { driverName, amount }
✅ Aceptando cotización: { ... }
📤 Llamando endpoint /accept
✅ Cotización aceptada: { securityCode, assignedDriver }
📡 Notificando por Socket.IO
➡️ Navegando a /driver-on-way
```

### **Backend:**
```
✅ Cotización aceptada para solicitud [id]
👤 Cliente: Juan Pérez
🚗 Conductor asignado: Carlos (ahora OCUPADO)
🔒 Código de seguridad: 2435
✅ Conductor [id] notificado de aceptación
🔴 Conductor [id] removido de active-drivers
📢 2 conductores notificados que el servicio fue tomado
```

### **Driver App (Aceptado):**
```
🎉 ¡Tu cotización fue aceptada! { clientName, securityCode }
🔴 Conductor ahora OCUPADO
💾 Servicio activo guardado en localStorage
```

### **Driver App (Otros):**
```
❌ Servicio tomado por otro conductor: [requestId]
🗑️ Removiendo card de la bandeja
```

---

## ✅ Checklist Final

Usa esta lista para verificar que todo funcione:

### Sheet Modal
- [ ] Abre al hacer click en marcador
- [ ] Empieza en breakpoint 0.3
- [ ] Puede deslizarse a 0.6 y 1.0
- [ ] Handle es arrastrable
- [ ] Backdrop aparece desde 0.6
- [ ] Muestra información correcta
- [ ] Botón de aceptar funciona
- [ ] Confirmación aparece

### Aceptación
- [ ] Backend acepta cotización
- [ ] Genera código de seguridad
- [ ] Cambia status a 'accepted'
- [ ] Asigna conductor
- [ ] Marca conductor como ocupado

### Socket.IO
- [ ] Conductor aceptado recibe notificación
- [ ] Muestra alerta y toast
- [ ] Toggle cambia a ocupado
- [ ] Otros conductores notificados
- [ ] Cards se remueven

### Vista DriverOnWay
- [ ] Navega correctamente
- [ ] Mapa muestra origen y destino
- [ ] Card del conductor visible
- [ ] Código de seguridad visible (4 dígitos)
- [ ] Botón llamar funciona
- [ ] Monto y detalles correctos

### Pull to Refresh Driver
- [ ] Deslizar funciona
- [ ] Actualiza desde backend
- [ ] Toast de confirmación
- [ ] Estado de cards correcto

---

## 🎯 Testing Exitoso

Si todo funciona, debes poder completar este flujo sin errores:

1. ✅ Cliente solicita servicio
2. ✅ Conductor cotiza
3. ✅ Cliente ve cotización en mapa
4. ✅ Cliente abre sheet modal
5. ✅ Cliente acepta cotización
6. ✅ Conductor recibe notificación inmediata
7. ✅ Conductor cambia a OCUPADO automáticamente
8. ✅ Otros conductores son notificados
9. ✅ Cliente ve "Conductor en Camino"
10. ✅ Código de seguridad visible

**¡Sistema funcionando al 100%!** 🎉

---

*Para más detalles técnicos, consulta: [FASE_3_ACEPTACION_COTIZACIONES.md](FASE_3_ACEPTACION_COTIZACIONES.md)*
