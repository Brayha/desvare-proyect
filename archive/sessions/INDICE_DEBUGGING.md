# 📚 Índice de Documentación: WebView Debugging

**Última actualización:** 11 de Febrero, 2026  
**Tema:** Habilitar debugging de Driver App con Chrome DevTools

---

## 🚀 INICIO RÁPIDO

¿Primera vez? Empieza aquí:

1. **Lee:** `INSTRUCCIONES_RAPIDAS_DEBUGGING.md` (5 minutos)
2. **Ejecuta:** `./check-debug-setup.sh` (1 minuto)
3. **Compila:** `./rebuild-driver-debug.sh` (10 minutos)
4. **Debuggea:** Chrome → `chrome://inspect` → inspect

---

## 📖 DOCUMENTACIÓN COMPLETA

### **Guías Principales**

#### 1. **INSTRUCCIONES_RAPIDAS_DEBUGGING.md** ⚡
**Para:** Empezar rápidamente  
**Tiempo de lectura:** 5 minutos  
**Contenido:**
- Instrucciones paso a paso
- Comandos más comunes
- Troubleshooting básico
- Ejemplos prácticos

**Cuándo usar:** Primera vez o referencia rápida

---

#### 2. **SOLUCION_WEBVIEW_DEBUGGING.md** 📘
**Para:** Guía completa y detallada  
**Tiempo de lectura:** 15 minutos  
**Contenido:**
- Explicación detallada de los cambios
- Troubleshooting avanzado
- Comandos útiles de ADB y Logcat
- Debugging de problemas específicos
- Compatibilidad y limitaciones

**Cuándo usar:** Cuando necesitas entender en profundidad o resolver problemas

---

#### 3. **RESUMEN_CAMBIOS_DEBUGGING.md** 📊
**Para:** Resumen ejecutivo  
**Tiempo de lectura:** 10 minutos  
**Contenido:**
- Comparación antes/después
- Lista de archivos modificados
- Impacto en producción
- Conceptos clave explicados
- Mejoras futuras opcionales

**Cuándo usar:** Para entender qué se cambió y por qué

---

#### 4. **DIAGRAMA_FLUJO_DEBUGGING.md** 🔄
**Para:** Visualización del proceso  
**Tiempo de lectura:** 10 minutos  
**Contenido:**
- Diagramas visuales del flujo completo
- Arquitectura de debugging
- Ciclo de desarrollo
- Checklists visuales
- Estados de la app

**Cuándo usar:** Para entender el flujo visualmente

---

#### 5. **RESUMEN_FINAL_DEBUGGING_2026_02_11.md** 📋
**Para:** Resumen completo de la sesión  
**Tiempo de lectura:** 15 minutos  
**Contenido:**
- Problema original y solución
- Todos los cambios realizados
- Casos de uso de debugging
- Estadísticas de la sesión
- Próximos pasos

**Cuándo usar:** Para tener una visión completa de todo lo implementado

---

### **Scripts de Automatización**

#### 1. **check-debug-setup.sh** 🔍
**Propósito:** Verificar que todo está configurado correctamente  
**Tiempo de ejecución:** 10 segundos  
**Qué hace:**
- Verifica MainActivity.java
- Verifica capacitor.config.json
- Verifica variables de entorno
- Verifica ADB instalado
- Verifica dispositivo conectado
- Verifica Node.js y npm
- Verifica Capacitor CLI
- Verifica Android SDK
- Verifica proyecto Android
- Verifica Chrome instalado

**Cuándo usar:** Antes de compilar, para detectar problemas

**Cómo usar:**
```bash
cd /Users/bgarcia/Documents/desvare-proyect
./check-debug-setup.sh
```

---

#### 2. **rebuild-driver-debug.sh** 🔧
**Propósito:** Recompilar e instalar la app automáticamente  
**Tiempo de ejecución:** 10-15 minutos  
**Qué hace:**
1. Build del frontend (`npm run build`)
2. Sincronización con Capacitor (`npx cap sync`)
3. Limpieza de builds anteriores (`./gradlew clean`)
4. Compilación del APK debug (`./gradlew assembleDebug`)
5. Instalación en dispositivo (`adb install`)
6. Apertura de la app

**Cuándo usar:** Cada vez que necesites recompilar

**Cómo usar:**
```bash
cd /Users/bgarcia/Documents/desvare-proyect
./rebuild-driver-debug.sh
```

---

## 🎯 FLUJO DE TRABAJO RECOMENDADO

### **Primera Vez (Setup Inicial)**

```
1. Leer: INSTRUCCIONES_RAPIDAS_DEBUGGING.md
   └─ Tiempo: 5 minutos

2. Ejecutar: ./check-debug-setup.sh
   └─ Tiempo: 10 segundos
   └─ Verificar que todo esté OK

3. Ejecutar: ./rebuild-driver-debug.sh
   └─ Tiempo: 10-15 minutos
   └─ Recompilar e instalar

4. Abrir: chrome://inspect
   └─ Tiempo: 1 minuto
   └─ Verificar que la app aparezca

5. Click: "inspect"
   └─ ¡Listo para debuggear!
```

---

### **Debugging Diario**

```
1. Conectar dispositivo con USB

2. Abrir app en dispositivo

3. Chrome → chrome://inspect → inspect

4. Debuggear:
   ├─ Ver logs en Console
   ├─ Ver peticiones en Network
   ├─ Ver WebSocket en Network → WS
   └─ Poner breakpoints en Sources

5. Si encuentras un bug:
   ├─ Anotar el error
   ├─ Corregir en VS Code
   ├─ ./rebuild-driver-debug.sh
   └─ Verificar que se solucionó
```

---

### **Troubleshooting**

```
Si algo no funciona:

1. Ejecutar: ./check-debug-setup.sh
   └─ Ver qué está fallando

2. Leer: SOLUCION_WEBVIEW_DEBUGGING.md
   └─ Sección "Troubleshooting"

3. Usar Logcat:
   └─ adb logcat | grep -i desvare

4. Reiniciar ADB:
   └─ adb kill-server && adb start-server

5. Reinstalar app:
   └─ ./rebuild-driver-debug.sh
```

---

## 📁 ARCHIVOS MODIFICADOS

### **Código Fuente**

#### `driver-app/android/app/src/main/java/com/desvare/driver/MainActivity.java`
**Cambio:** Agregado `WebView.setWebContentsDebuggingEnabled(true)`  
**Líneas:** 5 → 20  
**Impacto:** Habilita debugging en builds DEBUG

#### `driver-app/capacitor.config.json`
**Cambio:** Agregada configuración de debugging y seguridad  
**Líneas:** 4 → 18  
**Impacto:** Mejora seguridad y habilita debugging

---

## 🐛 CASOS DE USO COMUNES

### **1. Debuggear Geolocalización**
**Archivo:** `SOLUCION_WEBVIEW_DEBUGGING.md` → Sección "Debugging de Problemas Comunes"  
**Comandos:**
```javascript
Capacitor.Plugins.Geolocation.getCurrentPosition()
  .then(pos => console.log('📍', pos))
  .catch(err => console.error('❌', err));
```

### **2. Debuggear API/Network**
**Archivo:** `INSTRUCCIONES_RAPIDAS_DEBUGGING.md` → Sección "Debugging de Problemas Comunes"  
**Herramienta:** Chrome DevTools → Network tab

### **3. Debuggear Socket.IO**
**Archivo:** `RESUMEN_FINAL_DEBUGGING_2026_02_11.md` → Sección "Casos de Uso"  
**Herramienta:** Chrome DevTools → Network → WS tab

### **4. Ver Logs con Logcat**
**Archivo:** `SOLUCION_WEBVIEW_DEBUGGING.md` → Sección "Debugging con Logcat"  
**Comandos:**
```bash
adb logcat | grep -i desvare
adb logcat | grep -i "console\|chromium"
```

---

## 🎓 CONCEPTOS CLAVE

### **¿Qué es WebView Debugging?**
Permite que Chrome DevTools se conecte a la WebView de la app móvil.  
**Leer más:** `RESUMEN_CAMBIOS_DEBUGGING.md` → Sección "Conceptos Clave"

### **¿Por qué no está habilitado por defecto?**
Por seguridad, rendimiento y privacidad.  
**Leer más:** `RESUMEN_CAMBIOS_DEBUGGING.md` → Sección "Conceptos Clave"

### **¿Cómo funciona BuildConfig.DEBUG?**
Permite código condicional según el tipo de build.  
**Leer más:** `RESUMEN_CAMBIOS_DEBUGGING.md` → Sección "Conceptos Clave"

### **¿Afecta a producción?**
No, gracias a `if (BuildConfig.DEBUG)`.  
**Leer más:** `RESUMEN_CAMBIOS_DEBUGGING.md` → Sección "Impacto en Producción"

---

## 📊 COMPARACIÓN RÁPIDA

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Debugging** | ❌ Imposible | ✅ Completo |
| **Logs** | ❌ No visibles | ✅ En Console |
| **Network** | ❌ No visible | ✅ En Network tab |
| **Breakpoints** | ❌ No soportado | ✅ Funcional |
| **Producción** | ✅ Seguro | ✅ Seguro |

---

## 🔧 COMANDOS MÁS USADOS

### **Verificación**
```bash
./check-debug-setup.sh
adb devices
```

### **Compilación**
```bash
./rebuild-driver-debug.sh
```

### **Debugging**
```bash
adb logcat | grep -i desvare
adb logcat | grep -i "console\|chromium"
```

### **ADB Útiles**
```bash
adb kill-server && adb start-server
adb install -r app-debug.apk
adb shell am start -n com.desvare.driver/.MainActivity
adb shell am force-stop com.desvare.driver
```

---

## 📞 AYUDA RÁPIDA

### **¿Primera vez?**
→ Lee `INSTRUCCIONES_RAPIDAS_DEBUGGING.md`

### **¿Necesitas detalles?**
→ Lee `SOLUCION_WEBVIEW_DEBUGGING.md`

### **¿Algo no funciona?**
→ Ejecuta `./check-debug-setup.sh`

### **¿Quieres entender el flujo?**
→ Lee `DIAGRAMA_FLUJO_DEBUGGING.md`

### **¿Necesitas un resumen?**
→ Lee `RESUMEN_FINAL_DEBUGGING_2026_02_11.md`

---

## ✅ CHECKLIST RÁPIDO

**Antes de empezar:**
- [ ] Leer `INSTRUCCIONES_RAPIDAS_DEBUGGING.md`
- [ ] Ejecutar `./check-debug-setup.sh`
- [ ] Conectar dispositivo con USB
- [ ] Activar Depuración USB

**Para debuggear:**
- [ ] Ejecutar `./rebuild-driver-debug.sh`
- [ ] Abrir app en dispositivo
- [ ] Chrome → `chrome://inspect`
- [ ] Click en "inspect"
- [ ] ¡Empezar a debuggear!

---

## 🎉 RESULTADO FINAL

Después de implementar estos cambios:

✅ WebView debugging habilitado  
✅ App aparece en `chrome://inspect`  
✅ Logs visibles en Console  
✅ Peticiones HTTP visibles en Network  
✅ Debugging completo disponible  
✅ Seguro para producción  
✅ Documentación completa  
✅ Scripts de automatización  

---

## 📈 ESTADÍSTICAS

- **Archivos de documentación:** 5
- **Scripts creados:** 2
- **Archivos modificados:** 2
- **Líneas de documentación:** ~1,500
- **Líneas de código:** ~50
- **Tiempo de implementación:** ~60 minutos
- **Estado:** ✅ 100% COMPLETADO

---

## 📚 ÍNDICE ALFABÉTICO

- **check-debug-setup.sh** - Script de verificación
- **DIAGRAMA_FLUJO_DEBUGGING.md** - Diagramas visuales
- **INSTRUCCIONES_RAPIDAS_DEBUGGING.md** - Guía rápida
- **MainActivity.java** - Archivo modificado (WebView debugging)
- **rebuild-driver-debug.sh** - Script de recompilación
- **RESUMEN_CAMBIOS_DEBUGGING.md** - Resumen ejecutivo
- **RESUMEN_FINAL_DEBUGGING_2026_02_11.md** - Resumen completo
- **SOLUCION_WEBVIEW_DEBUGGING.md** - Guía completa

---

**Fecha:** 11 de Febrero, 2026  
**Versión:** 1.0  
**Estado:** ✅ COMPLETO

¡Feliz debugging! 🚀
