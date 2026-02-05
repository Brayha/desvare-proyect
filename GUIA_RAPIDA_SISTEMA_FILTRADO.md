# 🚀 Guía Rápida - Sistema de Filtrado y Expiración

## ⚡ Inicio Rápido

### Paso 1: Limpiar Base de Datos (Recomendado)

```bash
cd backend
node scripts/cleanDatabase.js
```

Cuando te pregunte, escribe: **SI**

Esto eliminará:
- ❌ Todas las solicitudes antiguas
- ❌ Todos los clientes de prueba
- ✅ Mantiene conductores y admins

---

### Paso 2: Iniciar Backend

```bash
cd backend
npm run dev
```

Verás en la consola:
```
✅ Conectado a MongoDB Atlas
⏰ Iniciando verificador de expiración (cada 30 minutos)
🚀 Servidor corriendo en puerto 5001
📡 Socket.IO listo para conexiones en tiempo real
```

---

### Paso 3: Iniciar Driver App

```bash
cd driver-app
npm run dev
```

Ahora accede a: `http://localhost:5175`

---

## 🎮 Cómo Probar el Sistema

### Test 1: Toggle Activo/Ocupado

1. **Inicia sesión** como conductor aprobado
2. Ve a la página **Home** (bandeja de cotizaciones)
3. En el header, verás el toggle **Ocupado** / **Activo**

**Cuando estás ACTIVO (🟢):**
- ✅ Ves solicitudes disponibles
- ✅ Recibes notificaciones de nuevas solicitudes
- ✅ Puedes cotizar servicios

**Cuando estás OCUPADO (🔴):**
- ❌ No ves solicitudes (lista vacía)
- ❌ NO recibes notificaciones
- ⚠️ Mensaje: "Estás OCUPADO. Activa tu disponibilidad..."

---

### Test 2: Verificar Socket.IO

**En el navegador (F12 → Console):**

```javascript
// Cuando cambias el toggle, deberías ver:
📡 Notificado cambio de disponibilidad: ACTIVO
// o
📡 Notificado cambio de disponibilidad: OCUPADO
```

**En la consola del backend:**

```
🟢 Conductor [ID] ahora ACTIVO - Agregado a sala active-drivers
// o
🔴 Conductor [ID] ahora OCUPADO - Removido de sala active-drivers
```

---

### Test 3: Nueva Solicitud desde Cliente

1. Abre la **client-pwa** en otro navegador/tab
2. Crea una nueva solicitud como cliente
3. **En el backend** verás:

```
📢 Nueva solicitud de cotización recibida
🚗 Conductores totales conectados: 2
🟢 Conductores ACTIVOS: 1
✅ Solicitud emitida a 1 conductores ACTIVOS
```

4. **Solo los conductores ACTIVOS** recibirán la notificación

---

## 🔍 Verificar Estado en MongoDB

### Ver solicitudes activas:

```javascript
db.requests.find({ 
  status: { $in: ['pending', 'quoted'] } 
})
```

### Ver solicitudes con fecha de expiración:

```javascript
db.requests.find({}, { 
  _id: 1, 
  status: 1, 
  createdAt: 1, 
  expiresAt: 1 
})
```

### Ver conductores y su estado:

```javascript
db.users.find(
  { userType: 'driver' }, 
  { name: 1, 'driverProfile.isOnline': 1, 'driverProfile.status': 1 }
)
```

---

## 🐛 Troubleshooting

### Problema: No veo solicitudes aunque esté ACTIVO

**Solución:**
1. Verifica en MongoDB que haya solicitudes disponibles
2. Verifica que no hayas cotizado ya esas solicitudes
3. Recarga la página (Pull-to-refresh)

### Problema: Toggle no funciona

**Solución:**
1. Verifica que el backend esté corriendo
2. Revisa la consola del navegador para errores
3. Verifica que `isOnline` se actualice en MongoDB

### Problema: No recibo notificaciones en tiempo real

**Solución:**
1. Verifica que Socket.IO esté conectado (consola del navegador)
2. Verifica que estés en estado ACTIVO
3. Reinicia el backend y refresca el navegador

### Problema: Veo solicitudes antiguas

**Solución:**
```bash
cd backend
node scripts/cleanDatabase.js
# Escribe: SI
```

---

## 📊 Logs Importantes

### Backend - Lo que debes ver:

```
✅ Conectado a MongoDB Atlas
⏰ Iniciando verificador de expiración (cada 30 minutos)
🚗 Conductor registrado: [ID] - Estado: 🟢 ACTIVO
✅ Conductor [ID] unido a sala de conductores activos
📢 Nueva solicitud de cotización recibida
✅ Solicitud emitida a 2 conductores ACTIVOS
```

### Frontend - Lo que debes ver:

```
✅ Conectado al servidor Socket.IO
📥 Nueva solicitud recibida: [datos]
📡 Notificado cambio de disponibilidad: ACTIVO
✅ 5 solicitudes cargadas
```

---

## 🎯 Checklist de Funcionalidad

Usa este checklist para verificar que todo funciona:

- [ ] Script de limpieza funciona correctamente
- [ ] Backend inicia sin errores
- [ ] Driver app inicia en puerto 5175
- [ ] Conductor puede hacer login
- [ ] Toggle Ocupado/Activo funciona visualmente
- [ ] Cuando está OCUPADO, no ve solicitudes
- [ ] Cuando está ACTIVO, ve solicitudes
- [ ] Socket.IO se conecta correctamente
- [ ] Conductor ACTIVO recibe notificaciones de nuevas solicitudes
- [ ] Conductor OCUPADO NO recibe notificaciones
- [ ] Las solicitudes tienen campo `expiresAt`
- [ ] Solicitudes expiradas no aparecen en listados

---

## 📞 Comandos Útiles

### Reiniciar todo desde cero:

```bash
# Terminal 1: Backend
cd backend
node scripts/cleanDatabase.js  # Escribe: SI
npm run dev

# Terminal 2: Driver App
cd driver-app
npm run dev

# Terminal 3 (opcional): Client PWA
cd client-pwa
npm run dev
```

### Ver logs en tiempo real:

```bash
# Backend
cd backend
npm run dev | grep "🟢\|🔴\|📢\|✅"

# Ver solo eventos de Socket.IO
npm run dev | grep "Socket"
```

---

## ✅ Todo Listo!

Si completaste el checklist, tu sistema está funcionando perfectamente:

- 🟢 Filtrado por estado funcionando
- ⏰ Expiración automática activa
- 📡 Socket.IO sincronizado
- 🧹 Base de datos limpia

**¡Felicidades! El sistema está listo para usar.** 🎉

---

*Para más detalles técnicos, consulta: `SISTEMA_COMPLETO_FILTRADO_Y_EXPIRACION.md`*
