# 🔍 TEST: Verificar Variables de Entorno en Producción

## 🎯 Prueba Rápida

Abre la consola del navegador en https://desvare.app (F12) y ejecuta:

```javascript
// Test 1: Verificar variable de entorno
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

// Test 2: Verificar objeto completo
console.log("Todas las vars:", import.meta.env);
```

---

## 📊 Resultados Esperados

### ✅ Si las variables están configuradas:
```javascript
VITE_API_URL: "https://api.desvare.app"
```

### ❌ Si NO están configuradas (problema):
```javascript
VITE_API_URL: undefined
```

---

## 🔧 Si muestra `undefined`:

Significa que el build NO incluyó las variables. Posibles causas:

### Causa 1: Variables en proyecto incorrecto

Verificar que las variables estén en:
```
desvare-proyect-mpdw
```

NO en otro proyecto.

### Causa 2: Build con caché

El build usó caché y no recogió las variables nuevas.

**Solución:**
1. Ir a: https://vercel.com/brayan-garcias-projects/desvare-proyect-mpdw
2. Deployments → ... → Redeploy
3. **DESMARCAR** "Use existing Build Cache"
4. Redeploy

### Causa 3: Variables en entorno incorrecto

Verificar que las variables estén marcadas para:
- ✅ Production
- ✅ Preview  
- ✅ Development

---

## 🆘 Alternativa Rápida: Hardcodear Temporalmente

**SOLO PARA TESTING**, podemos hardcodear la URL temporalmente:

### Archivo: `client-pwa/src/services/api.js`

**Cambiar línea 3 de:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

**A:**
```javascript
const API_URL = 'https://api.desvare.app'; // Temporal - hardcodeado
```

Esto **garantiza** que use la URL correcta, **independientemente** de las variables de entorno.

---

## ⚠️ IMPORTANTE

Si hacemos el hardcodeo temporal:
1. ✅ Funcionará INMEDIATAMENTE
2. ✅ Podrás seguir probando
3. ⚠️ Después debemos revertirlo y usar variables correctamente

---

## 📝 Próximos Pasos

### Paso 1: Test en Consola

Ejecutar el test en F12 → Consola

### Paso 2: Si muestra `undefined`

Hacer el hardcodeo temporal para probar YA

### Paso 3: Commit y Push

```bash
cd client-pwa
# Editar src/services/api.js
git add src/services/api.js
git commit -m "fix: Hardcodear API_URL temporalmente para testing"
git push origin main
```

### Paso 4: Esperar Deploy (2-3 min)

### Paso 5: Probar Registro

Debe funcionar inmediatamente.

---

**Pregunta:** ¿Ejecutaste el test en consola? ¿Qué te muestra?
