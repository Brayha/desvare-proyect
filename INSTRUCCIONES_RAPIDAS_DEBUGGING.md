# ⚡ Instrucciones Rápidas: Habilitar Debugging en Driver App

**Última actualización:** 11 de Febrero, 2026  
**Tiempo total:** 10-15 minutos

---

## 🎯 ¿Qué se Hizo?

Se habilitó el **WebView debugging** en la Driver App para que puedas usar Chrome DevTools y ver:
- ✅ Logs de JavaScript en la consola
- ✅ Errores de red y API
- ✅ Eventos de Socket.IO
- ✅ Errores de plugins de Capacitor (GPS, cámara, etc.)
- ✅ Peticiones HTTP en la pestaña Network

---

## 🚀 OPCIÓN 1: Script Automático (Recomendado)

### **Paso 1: Verificar que todo está configurado**

```bash
cd /Users/bgarcia/Documents/desvare-proyect
./check-debug-setup.sh
```

Esto verificará:
- ✅ MainActivity.java tiene WebView debugging
- ✅ Variables de entorno correctas
- ✅ ADB instalado
- ✅ Dispositivo conectado
- ✅ Node.js y Capacitor instalados

### **Paso 2: Recompilar e instalar**

```bash
./rebuild-driver-debug.sh
```

Esto hará automáticamente:
1. Build del frontend (`npm run build`)
2. Sincronización con Capacitor (`npx cap sync`)
3. Limpieza de builds anteriores (`./gradlew clean`)
4. Compilación del APK debug (`./gradlew assembleDebug`)
5. Instalación en el dispositivo (`adb install`)
6. Apertura de la app

### **Paso 3: Abrir Chrome DevTools**

1. Abre **Google Chrome** en tu Mac
2. Ve a: `chrome://inspect/#devices`
3. Espera 5-10 segundos
4. Deberías ver: **"Desvare Driver (com.desvare.driver)"**
5. Click en **"inspect"**
6. ¡Listo! Ya puedes ver logs y debuggear

---

## 🔧 OPCIÓN 2: Manual (Si el script falla)

### **Paso 1: Build del frontend**

```bash
cd /Users/bgarcia/Documents/desvare-proyect/driver-app
npm run build
```

### **Paso 2: Sincronizar con Capacitor**

```bash
npx cap sync android
```

### **Paso 3: Abrir en Android Studio**

```bash
npx cap open android
```

En Android Studio:
1. **Build → Clean Project**
2. **Build → Rebuild Project**
3. Conecta el dispositivo con USB
4. Click en **Run** ▶️

### **Paso 4: Chrome DevTools**

1. Chrome → `chrome://inspect/#devices`
2. Espera a que aparezca la app
3. Click en "inspect"

---

## 🐛 Si No Aparece en chrome://inspect

### **Verificación Rápida**

```bash
# 1. Verificar que el dispositivo está conectado
adb devices

# 2. Verificar que la app está corriendo
adb shell dumpsys activity activities | grep desvare

# 3. Reiniciar ADB
adb kill-server
adb start-server
adb devices
```

### **Ver Logs con Logcat (Alternativa)**

```bash
# Ver todos los logs de la app
adb logcat | grep -i desvare

# Ver solo errores JavaScript
adb logcat | grep -i "console\|chromium"

# Ver errores de red
adb logcat | grep -i "http\|network"

# Ver errores de GPS
adb logcat | grep -i "geolocation\|gps"
```

---

## 📱 Debugging de Problemas Comunes

### **Problema: Geolocalización no funciona**

**En Chrome DevTools Console:**
```javascript
// Ver si el plugin está cargado
console.log(Capacitor.Plugins.Geolocation);

// Ver permisos actuales
Capacitor.Plugins.Geolocation.checkPermissions()
  .then(result => console.log('Permisos GPS:', result));

// Solicitar ubicación
Capacitor.Plugins.Geolocation.getCurrentPosition()
  .then(pos => console.log('📍 Ubicación:', pos))
  .catch(err => console.error('❌ Error GPS:', err));
```

**Errores comunes:**
- `Permission denied` → Usuario no dio permisos
- `Location services disabled` → GPS desactivado
- `Timeout` → GPS tardando en obtener señal

### **Problema: API no responde**

**En Chrome DevTools → Network:**
- Filtra por: `api.desvare.app`
- Verás todas las peticiones HTTP
- Click en una para ver detalles

**Errores comunes:**
- `CORS error` → Backend no permite el origen
- `net::ERR_CONNECTION_REFUSED` → Backend caído
- `401 Unauthorized` → Token inválido
- `500 Internal Server Error` → Error en backend

### **Problema: Socket.IO no conecta**

**En Chrome DevTools → Network → WS:**
- Busca: `wss://api.desvare.app/socket.io/`
- Status debe ser: `101 Switching Protocols`

**En Console:**
```javascript
// Ver estado del socket
console.log('Socket conectado:', socket.connected);

// Ver eventos
socket.on('connect', () => console.log('✅ Conectado'));
socket.on('disconnect', () => console.log('❌ Desconectado'));
socket.on('error', (err) => console.error('❌ Error:', err));
```

---

## 📊 Archivos Modificados

### **1. MainActivity.java**
```
driver-app/android/app/src/main/java/com/desvare/driver/MainActivity.java
```
**Cambio:** Agregado `WebView.setWebContentsDebuggingEnabled(true)` en `onCreate()`

### **2. capacitor.config.json**
```
driver-app/capacitor.config.json
```
**Cambio:** Agregada configuración de debugging y navegación segura

---

## 🎓 Comandos Útiles

```bash
# Verificar configuración
./check-debug-setup.sh

# Recompilar e instalar
./rebuild-driver-debug.sh

# Ver dispositivos
adb devices

# Ver logs en tiempo real
adb logcat | grep -i desvare

# Instalar APK manualmente
adb install -r driver-app/android/app/build/outputs/apk/debug/app-debug.apk

# Abrir la app
adb shell am start -n com.desvare.driver/.MainActivity

# Cerrar la app
adb shell am force-stop com.desvare.driver

# Desinstalar la app
adb uninstall com.desvare.driver
```

---

## 📚 Documentación Completa

Para más detalles, revisa:
- **`SOLUCION_WEBVIEW_DEBUGGING.md`** - Guía completa con troubleshooting
- **`check-debug-setup.sh`** - Script de verificación
- **`rebuild-driver-debug.sh`** - Script de recompilación

---

## ⚠️ Importante

**Para PRODUCCIÓN:**
- El código ya está preparado con `if (BuildConfig.DEBUG)`
- En builds RELEASE, el debugging se desactiva automáticamente
- No necesitas cambiar nada para publicar en Google Play

**Para TESTING:**
- Siempre usa builds DEBUG
- Compila con: `./gradlew assembleDebug`
- NO uses: `./gradlew assembleRelease` (para testing)

---

## 🎉 Resultado Esperado

Después de seguir estos pasos:

1. ✅ La app aparece en `chrome://inspect`
2. ✅ Puedes ver la consola JavaScript
3. ✅ Puedes ver peticiones HTTP
4. ✅ Puedes debuggear errores de plugins
5. ✅ Puedes inspeccionar el DOM
6. ✅ Puedes poner breakpoints

---

## 📞 Ayuda Rápida

**Si tienes problemas:**
1. Ejecuta: `./check-debug-setup.sh`
2. Revisa: `SOLUCION_WEBVIEW_DEBUGGING.md`
3. Usa Logcat: `adb logcat | grep -i desvare`

**Si nada funciona:**
- Reinicia el dispositivo
- Reinicia ADB: `adb kill-server && adb start-server`
- Reinstala la app: `adb uninstall com.desvare.driver`
- Vuelve a compilar: `./rebuild-driver-debug.sh`

---

**Estado:** ✅ LISTO PARA USAR  
**Dificultad:** Baja  
**Tiempo:** 10-15 minutos

¡Buena suerte con el debugging! 🚀
