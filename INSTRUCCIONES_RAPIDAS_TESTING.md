# ⚡ Instrucciones Rápidas de Testing

**Testing de todo lo implementado hoy en 15 minutos**

---

## 🎯 Testing Rápido (15 min)

### **Paso 1: Iniciar Todo** (2 min)

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd client-pwa && npm run dev

# Terminal 3
cd driver-app && npm run dev
```

---

### **Paso 2: Flujo Cliente** (5 min)

1. **Abre:** `http://localhost:5173`
2. **Registra** nuevo cliente (OTP: 0000)
3. **Crea vehículo**
4. **Solicita servicio** (origen → destino)
5. **Espera en WaitingQuotes**

**✅ Debes ver:**
- Mapa con pin azul
- Mensaje "Buscando conductores..."

---

### **Paso 3: Flujo Conductor** (3 min)

1. **Abre (otro navegador):** `http://localhost:5175`
2. **Inicia sesión** como conductor
3. **Verifica:** Toggle en "ACTIVO" (🟢)
4. **Cotiza:** Click "Cotizar" → Monto → Enviar

**✅ Debes ver en cliente:**
- 🔔 Notificación banner
- 💰 Marcador en mapa

---

### **Paso 4: Sheet Modal** (3 min)

**En cliente:**

1. **Click** en marcador del mapa
2. **Ver** Sheet Modal abrirse (30%)
3. **Deslizar** hacia arriba (60%)
4. **Deslizar** hacia arriba (100%)
5. **Click** "Aceptar por $X"
6. **Confirmar** en alerta

**✅ Debes ver:**
- Sheet con breakpoints funcionando
- Código de seguridad generado
- Navegación a DriverOnWay

---

### **Paso 5: Notificaciones** (2 min)

**En driver-app:**

**✅ Debes ver:**
- 🎉 Alerta "¡Cotización Aceptada!"
- Toggle cambia a OCUPADO (🔴)
- Card desaparece de bandeja

---

## 🐛 Si Algo Falla

### No ves notificaciones:
```bash
# Verificar Socket.IO en consola:
✅ Socket.IO conectado
```

### Sheet Modal no abre:
```bash
# Verificar en consola:
💰 Click en cotización: {...}
```

### Conductor no cambia a OCUPADO:
```bash
# Pull to Refresh en driver-app
Desliza hacia abajo
```

---

## ✅ Testing Completo

Si completaste los 5 pasos sin errores:

**¡Todo funciona! 🎉**

Puedes proceder a:
1. Ejecutar script de limpieza
2. Testing más exhaustivo
3. Implementar siguiente fase

---

**Tiempo total:** ~15 minutos  
**Cobertura:** 90% de funcionalidades core

---

*Para testing detallado, consulta: [GUIA_TESTING_FASE_3.md](GUIA_TESTING_FASE_3.md)*
