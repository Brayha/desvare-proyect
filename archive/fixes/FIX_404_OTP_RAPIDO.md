# ⚡ ACCIÓN INMEDIATA: Fix Error 404 en PWA

## 🎯 Diagnóstico

✅ **Backend funcionando perfectamente:**
- SMS enviado: "Su codigo de verificacion para Desvare OTP es: 765708"
- Twilio funcionando
- Número `3505790415` verificado

❌ **PWA no puede verificar el código:**
- Error: `Request failed with status code 404`
- Causa: Variable `VITE_API_URL` no configurada en Vercel

---

## 🚀 Solución en 3 Pasos

### PASO 1: Agregar Variables en Vercel (5 minutos)

1. **Ir a:**
   ```
   https://vercel.com/brayan-garcias-projects/desvare-proyect-mpdw/settings/environment-variables
   ```

2. **Agregar estas 2 variables:**

   **Variable 1:**
   ```
   Name: VITE_API_URL
   Value: https://api.desvare.app
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

   **Variable 2:**
   ```
   Name: VITE_SOCKET_URL
   Value: https://api.desvare.app
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

3. **Click en "Save"**

---

### PASO 2: Redeploy en Vercel (3 minutos)

1. **Ir a:**
   ```
   https://vercel.com/brayan-garcias-projects/desvare-proyect-mpdw
   ```

2. **Click en "Deployments"**

3. **Click en los 3 puntos (...) del último deployment**

4. **Click en "Redeploy"**

5. **Desmarcar "Use existing Build Cache"**

6. **Click en "Redeploy"**

7. **Esperar 2-3 minutos** a que termine el build

---

### PASO 3: Probar (2 minutos)

1. **Limpiar caché del navegador:**
   ```
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

2. **Ir a:** https://desvare.app

3. **Registrarse con número verificado en Twilio**

4. **Ingresar código del SMS**

5. ✅ **Debe funcionar**

---

## 📊 Estado Actual vs. Esperado

### ANTES (Estado Actual):
```
PWA Frontend → VITE_API_URL no configurada
             → Usa fallback: http://localhost:5001
             → ❌ Error 404
```

### DESPUÉS (Esperado):
```
PWA Frontend → VITE_API_URL: https://api.desvare.app
             → Backend responde correctamente
             → ✅ Login exitoso
```

---

## 🔍 Verificación

### En DevTools (F12):

```javascript
// Consola del navegador:
console.log(import.meta.env.VITE_API_URL);

// Debe mostrar:
"https://api.desvare.app" ✅

// NO debe mostrar:
"http://localhost:5001" ❌
```

---

## ⚠️ Nota Importante

### Números de Testing:

Tu cuenta de Twilio sigue en **Trial**. Solo funcionará con números verificados.

**Números verificados actualmente:**
- ✅ `+57 350 579 0415` (funcionó en tu prueba)

**Para agregar más números:**
1. Ir a: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click en "Add a new Caller ID"
3. Ingresar número: `+57 XXX XXX XXXX`
4. Verificar con código SMS
5. Usar ese número para probar

---

## 📝 Checklist Rápido

### En Vercel:
- [ ] Variable `VITE_API_URL` agregada
- [ ] Variable `VITE_SOCKET_URL` agregada
- [ ] Redeploy iniciado
- [ ] Build completado (ver logs)

### Testing:
- [ ] Caché limpiado (Ctrl+Shift+R)
- [ ] PWA abierta (desvare.app)
- [ ] Registro con número verificado
- [ ] Código ingresado
- [ ] ✅ Login exitoso

---

## 🆘 Si sigue fallando

### Verificar en Network Tab:

1. Abrir DevTools (F12)
2. Tab "Network"
3. Intentar registro
4. Buscar request a `verify-otp`
5. Ver URL completa

**Debe ser:**
```
https://api.desvare.app/api/auth/verify-otp ✅
```

**Si muestra:**
```
http://localhost:5001/api/auth/verify-otp ❌
```

**Entonces:**
- Limpiar caché más agresivamente
- Abrir en ventana de incógnito
- Verificar que las variables estén en el build de Vercel

---

## ⏱️ Tiempo Total Estimado

- Agregar variables: **2 minutos**
- Redeploy: **3 minutos**
- Testing: **2 minutos**
- **Total: ~7 minutos**

---

**Problema:** Error 404 al verificar OTP  
**Causa:** VITE_API_URL no configurada  
**Solución:** Agregar variable en Vercel y redeploy  
**Prioridad:** Alta (bloquea registro de usuarios)
