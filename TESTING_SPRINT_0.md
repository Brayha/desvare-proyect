# 🧪 Testing SPRINT 0 - Guía de Verificación

Esta guía te ayudará a verificar que todos los cambios del SPRINT 0 funcionan correctamente.

---

## 📋 Checklist de Verificación

### ✅ Preparación

- [ ] Cerrar todas las terminales con servidores corriendo
- [ ] Backend en puerto 5000 (verificar que no esté ocupado)
- [ ] Tener 3 terminales abiertas

---

## 🚀 Paso 1: Iniciar Servidores

### Terminal 1 - Backend

```bash
cd /Users/bgarcia/Documents/desvare-proyect/backend
npm run dev
```

**Verificar:**
- ✅ Puerto 5000 libre y funcionando
- ✅ Conectado a MongoDB Atlas
- ✅ Socket.IO listo

**Salida esperada:**
```
✅ Conectado a MongoDB Atlas
🚀 Servidor corriendo en puerto 5000
📡 Socket.IO listo para conexiones en tiempo real
```

**Problema común:**
Si ves `Error: listen EADDRINUSE: address already in use :::5000`:
```bash
# Matar proceso en puerto 5000
lsof -ti:5000 | xargs kill -9

# Luego reiniciar
npm run dev
```

---

### Terminal 2 - PWA Cliente

```bash
cd /Users/bgarcia/Documents/desvare-proyect/client-pwa
npm run dev
```

**Verificar:**
- ✅ Servidor en puerto 5173
- ✅ Sin errores de compilación
- ✅ Path aliases funcionando

**Salida esperada:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Posibles errores:**
```
❌ Cannot find module '@shared/...'
Solución: Verificar que vite.config.js tenga los path aliases
```

---

### Terminal 3 - App Conductor

```bash
cd /Users/bgarcia/Documents/desvare-proyect/driver-app
npm run dev
```

**Verificar:**
- ✅ Servidor en puerto 5174
- ✅ Sin errores de compilación
- ✅ Path aliases funcionando

**Salida esperada:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

---

## 🧪 Paso 2: Verificar PWA Cliente

### 2.1 Abrir en Navegador

```
URL: http://localhost:5173
```

### 2.2 Verificar Login

**Verificaciones visuales:**
- [ ] Background con gradiente morado
- [ ] Card blanco centrado
- [ ] Título "Iniciar Sesión"
- [ ] Input de Email con label flotante
- [ ] Input de Contraseña con label flotante
- [ ] Botón azul grande "Iniciar Sesión"
- [ ] Enlace "Regístrate aquí" abajo

**Interacciones:**
1. **Hover en inputs:** Bordes se vuelven azules ✅
2. **Click en input:** Label sube, borde azul, sombra ✅
3. **Dejar input vacío y submit:** Toast amarillo "Por favor completa todos los campos" ✅
4. **Credenciales incorrectas:** Toast rojo con error ✅

### 2.3 Verificar Register

**Click en "Regístrate aquí"**

**Verificaciones visuales:**
- [ ] Card con título "Crear Cuenta de Cliente"
- [ ] 4 inputs: Nombre, Email, Contraseña, Confirmar Contraseña
- [ ] Botón verde "Registrarse"
- [ ] Enlace "Inicia sesión aquí" abajo

**Interacciones:**
1. **Escribir contraseña diferente en confirmar:**
   - Mensaje rojo "Las contraseñas no coinciden" debajo del input ✅
2. **Ambas contraseñas iguales:**
   - Mensaje desaparece ✅
3. **Contraseña menos de 6 caracteres:**
   - Toast amarillo "La contraseña debe tener al menos 6 caracteres" ✅

### 2.4 Crear Usuario de Prueba

```
Nombre: Cliente Test
Email: cliente@test.com
Contraseña: test123
Confirmar: test123
```

**Resultado esperado:**
- ✅ Loading "Registrando..."
- ✅ Toast verde "¡Registro exitoso!"
- ✅ Redirección a `/home`
- ✅ Página Home carga correctamente

---

## 🧪 Paso 3: Verificar App Conductor

### 3.1 Abrir en Navegador

```
URL: http://localhost:5174
```

### 3.2 Verificar Login

**Diferencias con PWA Cliente:**
- [ ] Toolbar color **cyan** (secondary) en vez de azul
- [ ] Título "Desvare - Conductor"
- [ ] Card con "Iniciar Sesión como Conductor"
- [ ] Botón **cyan** en vez de azul
- [ ] Mismo background con gradiente morado

**¡Todo lo demás debe ser idéntico!**

### 3.3 Verificar Register

**Click en "Regístrate aquí"**

**Diferencias con PWA Cliente:**
- [ ] Toolbar color **cyan**
- [ ] Título "Crear Cuenta de Conductor"
- [ ] Botón **cyan**

### 3.4 Crear Conductor de Prueba

```
Nombre: Conductor Test
Email: conductor@test.com
Contraseña: test123
Confirmar: test123
```

**Resultado esperado:**
- ✅ Loading "Registrando..."
- ✅ Toast verde "¡Registro exitoso!"
- ✅ Redirección a `/home`
- ✅ Página Home carga correctamente

---

## 🧪 Paso 4: Verificar Funcionalidad Completa

### 4.1 Flujo de Cotización

**En PWA Cliente (http://localhost:5173):**
1. Login con `cliente@test.com`
2. Click "Buscar Grúa"
3. Verificar que sale "Solicitud enviada"

**En App Conductor (http://localhost:5174):**
1. Login con `conductor@test.com`
2. Debería aparecer alerta con nueva solicitud
3. Ingresar monto de cotización
4. Click "Enviar Cotización"

**De vuelta en PWA Cliente:**
- ✅ Toast verde con cotización recibida
- ✅ Cotización aparece en la lista
- ✅ Muestra nombre, monto y hora

---

## 🔍 Paso 5: Verificar Consola del Navegador

### En ambas apps, abrir DevTools (F12)

**No debe haber errores en rojo ❌**

**Logs esperados (color azul ℹ️):**
```
✅ Conectado al servidor Socket.IO: xxxxx
📝 Cliente registrado: xxxxx
🚗 Conductor registrado: xxxxx
```

**Si hay errores:**
```
❌ Cannot resolve '@shared/...'
→ Problema: Path aliases no configurados
→ Solución: Verificar vite.config.js

❌ Failed to fetch
→ Problema: Backend no está corriendo
→ Solución: Iniciar backend en Terminal 1

❌ Network Error
→ Problema: URL incorrecta en .env
→ Solución: Verificar VITE_API_URL en .env
```

---

## 🎨 Paso 6: Verificar Estilos Compartidos

### Verificar que los estilos se aplican correctamente

**En ambas apps:**
1. **Abrir DevTools → Inspector**
2. **Click en un Input**
3. **Ver estilos aplicados:**
   - ✅ `shared-input-item` presente
   - ✅ Variables CSS (`--ion-color-primary`) funcionando
   - ✅ Border radius de 8px
   - ✅ Transiciones suaves

4. **Hover en Button:**
   - ✅ Sin cambios bruscos
   - ✅ Transición suave

5. **Focus en Input:**
   - ✅ Border azul
   - ✅ Sombra azul sutil

---

## 📊 Paso 7: Verificar Código

### 7.1 Verificar Imports

**Abrir `client-pwa/src/pages/Login.jsx`**

```javascript
// ✅ Debe tener estos imports
import { AuthLayout } from '@layouts/AuthLayout';
import { Button, Input, Card } from '@components';
import { authAPI } from '@services/api';
import { useToast } from '@hooks/useToast';
import storage from '@services/storage';
```

**Abrir `driver-app/src/pages/Login.jsx`**

```javascript
// ✅ Debe tener los mismos imports
import { AuthLayout } from '@layouts/AuthLayout';
import { Button, Input, Card } from '@components';
// ...etc
```

### 7.2 Verificar Path Aliases

**Abrir `client-pwa/vite.config.js`**

```javascript
// ✅ Debe tener esto
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, '../shared'),
    '@components': path.resolve(__dirname, '../shared/components'),
    '@layouts': path.resolve(__dirname, '../shared/layouts'),
    '@hooks': path.resolve(__dirname, '../shared/hooks'),
    '@services': path.resolve(__dirname, '../shared/services'),
    // ...etc
  },
}
```

**Lo mismo en `driver-app/vite.config.js`**

---

## ✅ Checklist Final

### Backend
- [ ] Corriendo en puerto 5000
- [ ] Conectado a MongoDB
- [ ] Socket.IO funcionando
- [ ] Sin errores en consola

### PWA Cliente
- [ ] Corriendo en puerto 5173
- [ ] Login funciona
- [ ] Register funciona
- [ ] Estilos shared aplicados
- [ ] Path aliases funcionando
- [ ] Socket.IO conectado
- [ ] Puede enviar solicitudes
- [ ] Recibe cotizaciones

### App Conductor
- [ ] Corriendo en puerto 5174
- [ ] Login funciona
- [ ] Register funciona
- [ ] Estilos shared aplicados (color secondary)
- [ ] Path aliases funcionando
- [ ] Socket.IO conectado
- [ ] Recibe solicitudes
- [ ] Puede enviar cotizaciones

### Componentes Shared
- [ ] Button renderiza correctamente
- [ ] Input con validaciones funciona
- [ ] Card con elevación funciona
- [ ] AuthLayout con gradiente funciona
- [ ] Estilos globales aplicados
- [ ] Clases utilitarias funcionan

### Servicios Shared
- [ ] authAPI funciona
- [ ] socketService conecta
- [ ] storage guarda datos
- [ ] useToast muestra notificaciones
- [ ] useAuth gestiona sesión

---

## 🐛 Problemas Comunes y Soluciones

### Error: Cannot find module '@shared/...'

**Causa:** Path aliases no configurados correctamente

**Solución:**
1. Verificar que `vite.config.js` tiene `import path from 'path'`
2. Verificar que `resolve.alias` está configurado
3. Reiniciar el servidor de desarrollo (Ctrl+C y `npm run dev`)

### Error: listen EADDRINUSE

**Causa:** Puerto 5000 ocupado

**Solución:**
```bash
lsof -ti:5000 | xargs kill -9
```

### Estilos no se aplican

**Causa:** No se importaron los estilos globales

**Solución:**
Verificar que `main.jsx` tenga:
```javascript
import '@styles/global.css'
```

### Socket.IO no conecta

**Causa:** Backend no está corriendo o URL incorrecta

**Solución:**
1. Verificar backend corriendo
2. Verificar `.env` tiene `VITE_SOCKET_URL=http://localhost:5000`

---

## 🎉 Todo Funcionando

Si todos los checks están ✅, entonces:

**¡SPRINT 0 COMPLETADO EXITOSAMENTE!** 🎊

Estás listo para comenzar el **SPRINT 1: Integración Mapbox + Geolocalización**.

---

## 📸 Capturas Esperadas

### PWA Cliente - Login
- Background: Gradiente morado
- Toolbar: Azul (primary)
- Card: Blanco, centrado, con sombra
- Inputs: Labels flotantes, bordes grises
- Botón: Azul, grande, ancho completo

### App Conductor - Login
- Background: Gradiente morado (mismo)
- Toolbar: **Cyan** (secondary) 🔵
- Card: Blanco, centrado, con sombra (mismo)
- Inputs: Labels flotantes, bordes grises (mismo)
- Botón: **Cyan**, grande, ancho completo 🔵

**La única diferencia visible debe ser el color: azul vs cyan** ✨

---

**Desarrollado para Desvare App** 🚀

