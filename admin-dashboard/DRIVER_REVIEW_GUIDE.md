# 📋 Guía de Revisión de Conductores - Admin Dashboard

## ✅ **Cambios Implementados**

### **1. Badge de Estado Visible**
Ahora se muestra claramente el estado del conductor con un badge de colores:

- 🟡 **Pendiente Documentos** → Amarillo (aún está completando el registro)
- 🟡 **En Revisión** → Amarillo (listo para que lo revises)
- 🟢 **Aprobado** → Verde (conductor activo)
- 🔴 **Rechazado** → Rojo (no aprobado)
- 🔴 **Suspendido** → Rojo (cuenta suspendida)

---

### **2. Botones de Acción Mejorados**
Los botones ahora aparecen según el estado:

#### **Si está en `pending_review`:**
- ✅ **Aprobar Conductor** (cambia estado a `approved`)
- ❌ **Rechazar** (requiere razón, cambia a `rejected`)

El botón de aprobación permanece deshabilitado hasta completar la información obligatoria de la grúa.

#### **Si está `rejected` o `suspended`:**
- 🔓 **Activar Conductor** (reactiva la cuenta)

Un conductor rechazado también debe tener completos y guardados los datos obligatorios de la
grúa antes de poder activarse. Un conductor suspendido conserva su aprobación previa.

#### **Siempre disponible:**
- 🗑️ **Eliminar Conductor** (elimina permanentemente)

---

### **3. Visualización Completa de Documentos**

Ahora se muestran **TODOS** los documentos del conductor, organizados en 2 secciones:

#### **📄 Documentos Personales:**
1. ✅ Cédula (Frente)
2. ✅ Cédula (Atrás)
3. ✅ Selfie

#### **🚛 Documentos de la Grúa:**
1. ✅ Licencia de Tránsito (Frente)
2. ✅ Licencia de Tránsito (Atrás)
3. SOAT (Opcional)
4. ✅ Tarjeta de Propiedad (Frente)
5. ✅ Tarjeta de Propiedad (Atrás)
6. ✅ Seguro Todo Riesgo (Opcional)
7. ✅ Foto de la Grúa

**Si un documento obligatorio NO está subido:**
- Se muestra un cuadro gris con "❌ No subido"
- Ayuda a identificar qué falta

SOAT y seguro todo riesgo se identifican como **opcionales**. Si no fueron agregados, se muestra
"Opcional · No agregado" y su ausencia no bloquea la aprobación.

---

### **4. Información Editable de la Grúa**
El administrador puede corregir y guardar:

- Tipo: `GRUA_MOTO`, `GRUA_LIVIANA` o `GRUA_PESADA`
- Marca (texto libre)
- Modelo o referencia (texto libre)
- Placa en formato `ABC123` o `ABC12D`
- Una o más capacidades:

- MOTOS
- AUTOS
- CAMIONETAS
- CAMIONES
- BUSES

Los valores existentes se cargan desde `towTruck` y `vehicleCapabilities`. Para registros antiguos,
la marca y el modelo también se recuperan desde `customBrand` y `customModel`.

---

## 🔄 **Flujo de Revisión Completo**

### **Paso 1: Ver Conductores Pendientes**
```
Dashboard → Conductores → Filtrar "🟡 Pendientes"
```

### **Paso 2: Abrir Detalle del Conductor**
```
Click en el conductor → Se abre la vista completa
```

### **Paso 3: Revisar Información**
Verás:
- ✅ Badge de estado en la parte superior
- ✅ Información personal (teléfono, email, ciudad, tipo)
- ✅ Todos los documentos organizados
- ✅ Formulario editable de la grúa y sus capacidades

### **Paso 4: Revisar Documentos**
- Haz click en cada imagen para verla en grande
- Verifica que:
  - Las cédulas sean legibles
  - El selfie coincida con la cédula
  - Los documentos obligatorios de la grúa estén vigentes
  - La foto de la grúa sea clara

El SOAT y el seguro todo riesgo pueden revisarse si existen, pero son opcionales.

### **Paso 5: Completar y guardar la grúa**
1. Selecciona el tipo de grúa
2. Confirma o corrige marca, modelo/referencia y placa (`ABC123` o `ABC12D`)
3. Selecciona al menos una capacidad
4. Haz click en "Guardar información de la grúa"
5. Espera el mensaje de éxito; el detalle se refresca con los datos persistidos

Si falta un dato, la pantalla enumera los campos pendientes y mantiene bloqueada la aprobación.

### **Paso 6: Tomar Decisión**

#### **Si TODO está correcto:**
1. Click en "✅ Aprobar Conductor"
2. Confirma la acción
3. El conductor cambia a estado `approved`
4. Ya puede recibir servicios en la app

#### **Si algo está mal:**
1. Click en "❌ Rechazar"
2. Ingresa la razón del rechazo (ej: "Cédula borrosa", "Documentos vencidos")
3. El conductor ve la razón y puede volver a intentar

---

## 📊 **Estados del Conductor**

| Estado | Descripción | Acciones Disponibles |
|--------|-------------|---------------------|
| `pending_documents` | Está completando el registro | Suspender |
| `pending_review` | Listo para revisión ⚠️ | **Aprobar (si la grúa está completa), Rechazar**, Suspender |
| `approved` | Aprobado y activo ✅ | Suspender |
| `rejected` | Rechazado ❌ | Activar, Suspender |
| `suspended` | Suspendido 🔒 | Activar |

---

## ⚠️ **Criterios de Aprobación**

### **✅ Documentos que DEBEN estar:**
1. Cédula (ambos lados) - Legible, vigente
2. Selfie - Clara, coincide con cédula
3. Licencia de Tránsito - Vigente, legible
4. Tarjeta de Propiedad - Legible
5. Foto de la Grúa - Clara, se ve el vehículo completo

### **ℹ️ Documentos opcionales:**
- SOAT
- Seguro todo riesgo

No deben rechazarse ni bloquearse aprobaciones únicamente por la ausencia de estos documentos.

### **✅ Información que DEBE ser correcta:**
- Ciudad operativa válida
- Tipo de entidad correcto
- Tipo de grúa
- Marca
- Modelo o referencia
- Placa válida en formato `ABC123` o `ABC12D`
- Al menos 1 capacidad de vehículo

La interfaz impide iniciar la aprobación mientras falte alguno de los datos obligatorios de la
grúa y comunica cuáles faltan. El backend sigue siendo la autoridad final y vuelve a validar al
procesar la aprobación.

### **❌ Razones para RECHAZAR:**
- Documentos ilegibles o borrosos
- Documentos vencidos
- Selfie no coincide con cédula
- Grúa no es apta (muy dañada, sin equipo)
- Documentos no corresponden al conductor
- Información falsa o fraudulenta

---

## 🎯 **Acceso Rápido**

**URL del Admin Dashboard:**
```
http://localhost:5174
```

**Credenciales:**
```
Email: desvareweb@gmail.com
Password: admin123*
```

**Ruta directa a conductores:**
```
http://localhost:5174/drivers
```

---

## 🚀 **Próximas Mejoras (Opcionales)**

- [ ] Sistema de verificación por documentos (marcar cada uno)
- [ ] Zoom de imágenes en modal
- [ ] Comparación facial automática (selfie vs cédula)
- [ ] Notificación push al conductor cuando es aprobado/rechazado
- [ ] Historial de cambios de estado
- [ ] Comentarios/notas del admin en cada documento
- [ ] Aprobación por múltiples admins (workflow)

---

## 📞 **Soporte**

Si encuentras algún problema:
1. Revisa la consola del navegador (F12)
2. Verifica que el backend esté corriendo (puerto 5001)
3. Verifica que el conductor haya completado el registro en la app

---

**¡Listo para aprobar conductores!** 🚛✅

