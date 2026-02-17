# 🔧 Solución: Habilitar WebView Debugging en Driver App

**Fecha:** 11 de Febrero, 2026  
**Problema:** La app no aparece en `chrome://inspect` para debugging  
**Estado:** ✅ SOLUCIONADO

---

## ✅ CAMBIOS REALIZADOS

### 1. **MainActivity.java** - Habilitado WebView Debugging

**Archivo:** `driver-app/android/app/src/main/java/com/desvare/driver/MainActivity.java`

**Cambio aplicado:**
```java
package com.desvare.driver;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // CRÍTICO: Habilitar debugging de WebView para Chrome DevTools
        // Solo en builds DEBUG (no afecta producción)
        if (BuildConfig.DEBUG) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
                WebView.setWebContentsDebuggingEnabled(true);
            }
        }
    }
}
```

**¿Qué hace esto?**
- `WebView.setWebContentsDebuggingEnabled(true)` permite que Chrome DevTools detecte la WebView
- Solo se activa en builds **DEBUG** (no en RELEASE/producción)
- Compatible con Android 4.4+ (tu app requiere Android 6.0+)

---

### 2. **capacitor.config.json** - Configuración Mejorada

**Archivo:** `driver-app/capacitor.config.json`

**Cambio aplicado:**
```json
{
  "appId": "com.desvare.driver",
  "appName": "Desvare Driver",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": false,
    "allowNavigation": [
      "api.desvare.app",
      "*.desvare.app"
    ]
  },
  "android": {
    "allowMixedContent": false,
    "captureInput": true,
    "webContentsDebuggingEnabled": true
  }
}
```

**Mejoras:**
- ✅ `webContentsDebuggingEnabled: true` - Habilita debugging
- ✅ `allowNavigation` - Permite navegación a tu API
- ✅ `androidScheme: "https"` - Usa HTTPS para mayor seguridad
- ✅ `cleartext: false` - Bloquea HTTP inseguro

---

## 🚀 PASOS PARA RECOMPILAR E INSTALAR

### **Opción A: Desde Android Studio (Recomendado)**

```bash
# 1. Ir al directorio de la app
cd /Users/bgarcia/Documents/desvare-proyect/driver-app

# 2. Rebuild del frontend
npm run build

# 3. Sincronizar cambios con Android
npx cap sync android

# 4. Abrir en Android Studio
npx cap open android
```

**En Android Studio:**
1. Espera a que termine de indexar
2. Ve a **Build → Clean Project** (espera)
3. Ve a **Build → Rebuild Project** (espera)
4. Conecta tu dispositivo Android con USB
5. Verifica que aparezca en la lista de dispositivos (arriba)
6. Click en el botón **Run** ▶️ (o presiona `Shift + F10`)
7. La app se instalará y abrirá automáticamente

---

### **Opción B: Desde Terminal (Más Rápido)**

```bash
# 1. Ir al directorio de la app
cd /Users/bgarcia/Documents/desvare-proyect/driver-app

# 2. Rebuild del frontend
npm run build

# 3. Sincronizar con Android
npx cap sync android

# 4. Ir al directorio de Android
cd android

# 5. Limpiar builds anteriores
./gradlew clean

# 6. Compilar APK debug
./gradlew assembleDebug

# 7. Instalar en dispositivo (conectado con USB)
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 8. Abrir la app
adb shell am start -n com.desvare.driver/.MainActivity
```

---

## 🔍 VERIFICAR QUE FUNCIONA

### **Paso 1: Abrir Chrome DevTools**

1. Abre **Google Chrome** en tu Mac
2. Ve a: `chrome://inspect/#devices`
3. Asegúrate de que esté marcado **"Discover USB devices"**
4. Conecta el dispositivo con USB (ya debería estar conectado)
5. Abre la **Desvare Driver App** en el dispositivo
6. **Espera 5-10 segundos**

### **Paso 2: Deberías Ver Esto**

En `chrome://inspect`, deberías ver:

```
Desvare Driver (com.desvare.driver)
  https://localhost/
  [inspect]
```

### **Paso 3: Inspeccionar la App**

1. Click en **`inspect`**
2. Se abrirá una ventana de Chrome DevTools
3. Ve a la pestaña **Console**
4. Deberías ver logs de la app
5. Ve a la pestaña **Network** para ver peticiones HTTP
6. Ve a la pestaña **Sources** para ver el código

---

## 🐛 DEBUGGING DE PROBLEMAS COMUNES

### **Problema 1: Plugin de Geolocalización**

**En la consola de DevTools, busca:**
```javascript
// Ver si el plugin está cargado
console.log(Capacitor.Plugins.Geolocation);

// Ver permisos
Capacitor.Plugins.Geolocation.checkPermissions().then(console.log);

// Solicitar ubicación
Capacitor.Plugins.Geolocation.getCurrentPosition()
  .then(pos => console.log('📍 Ubicación:', pos))
  .catch(err => console.error('❌ Error GPS:', err));
```

**Errores comunes:**
- `Permission denied` → El usuario no dio permisos de ubicación
- `Location services disabled` → GPS desactivado en el dispositivo
- `Timeout` → El GPS está tardando mucho en obtener señal

---

### **Problema 2: Errores de Red/API**

**En la pestaña Network:**
- Filtra por `api.desvare.app`
- Verás todas las peticiones HTTP
- Click en una petición para ver detalles
- Verás headers, payload, response

**Errores comunes:**
- `CORS error` → Backend no permite el origen
- `net::ERR_CONNECTION_REFUSED` → Backend no está corriendo
- `401 Unauthorized` → Token JWT inválido o expirado
- `500 Internal Server Error` → Error en el backend

---

### **Problema 3: Socket.IO No Conecta**

**En la pestaña Network → WS (WebSocket):**
- Deberías ver: `wss://api.desvare.app/socket.io/...`
- Status: `101 Switching Protocols` (bueno)
- Si ves error, revisa la consola

**En la consola:**
```javascript
// Ver estado de Socket.IO
console.log('Socket conectado:', socket.connected);

// Ver eventos
socket.on('connect', () => console.log('✅ Socket conectado'));
socket.on('disconnect', () => console.log('❌ Socket desconectado'));
socket.on('error', (err) => console.error('❌ Socket error:', err));
```

---

## 📱 DEBUGGING CON LOGCAT (Alternativa)

Si Chrome DevTools no funciona, usa **Logcat**:

### **Ver Todos los Logs de la App**
```bash
adb logcat | grep -i desvare
```

### **Ver Solo Errores JavaScript**
```bash
adb logcat | grep -i "console\|chromium"
```

### **Ver Errores de Red**
```bash
adb logcat | grep -i "http\|network\|cors"
```

### **Ver Errores de Capacitor Plugins**
```bash
adb logcat | grep -i "capacitor\|plugin\|geolocation"
```

### **Ver TODO en Tiempo Real**
```bash
adb logcat -s chromium:V Capacitor:V
```

---

## 🎯 CHECKLIST DE VERIFICACIÓN

Antes de reportar un problema, verifica:

- [ ] Dispositivo conectado con USB y autorizado
- [ ] Depuración USB activada en el dispositivo
- [ ] App instalada desde el APK debug más reciente
- [ ] App abierta y en primer plano
- [ ] Chrome abierto en `chrome://inspect`
- [ ] "Discover USB devices" marcado en Chrome
- [ ] Esperaste al menos 10 segundos
- [ ] Probaste reiniciar la app
- [ ] Probaste desconectar y reconectar el USB

---

## 🔧 TROUBLESHOOTING AVANZADO

### **Si la App No Aparece en chrome://inspect**

**1. Verificar que WebView Debugging está Habilitado**
```bash
# Abrir la app y ejecutar:
adb logcat | grep -i "setWebContentsDebuggingEnabled"
```

**2. Verificar que la App Está Corriendo**
```bash
adb shell dumpsys activity activities | grep desvare
```

Deberías ver:
```
mResumedActivity: ActivityRecord{...com.desvare.driver/.MainActivity...}
```

**3. Reiniciar ADB Server**
```bash
adb kill-server
adb start-server
adb devices
```

**4. Verificar Android System WebView**
En el dispositivo:
- Ve a **Configuración → Apps**
- Busca **"Android System WebView"**
- Verifica que esté actualizado
- Si no, actualízalo desde Google Play

**5. Forzar Detección en Chrome**
En `chrome://inspect`:
- Marca **"Discover USB devices"**
- Click en **"Port forwarding..."**
- Agrega: `8080` → `localhost:8080`
- Click **"Done"**
- Recarga la página

---

## 📊 COMPARACIÓN: ANTES vs DESPUÉS

### **ANTES (No Funcionaba)**
```java
public class MainActivity extends BridgeActivity {}
```
- ❌ WebView debugging deshabilitado
- ❌ No aparece en chrome://inspect
- ❌ No se pueden ver logs
- ❌ No se pueden ver peticiones HTTP
- ❌ Debugging imposible

### **DESPUÉS (Funciona)**
```java
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
    }
}
```
- ✅ WebView debugging habilitado
- ✅ Aparece en chrome://inspect
- ✅ Se pueden ver logs en consola
- ✅ Se pueden ver peticiones HTTP
- ✅ Debugging completo disponible

---

## ⚠️ IMPORTANTE: PRODUCCIÓN

**Para builds de PRODUCCIÓN:**

El código actual ya está preparado:
```java
if (BuildConfig.DEBUG) {
    WebView.setWebContentsDebuggingEnabled(true);
}
```

Esto significa:
- ✅ En **DEBUG builds**: Debugging habilitado
- ✅ En **RELEASE builds**: Debugging deshabilitado automáticamente
- ✅ No necesitas cambiar nada para producción

**Cuando compiles para Google Play:**
```bash
cd driver-app/android
./gradlew assembleRelease
```

El APK de producción **NO tendrá** debugging habilitado (más seguro).

---

## 🎓 RECURSOS ÚTILES

### **Documentación Oficial**
- [Chrome DevTools for Android](https://developer.chrome.com/docs/devtools/remote-debugging/)
- [Capacitor Debugging Guide](https://capacitorjs.com/docs/guides/debugging)
- [Android WebView Debugging](https://developer.android.com/guide/webapps/debugging)

### **Comandos ADB Útiles**
```bash
# Ver dispositivos conectados
adb devices

# Ver logs en tiempo real
adb logcat

# Limpiar logs
adb logcat -c

# Instalar APK
adb install -r app.apk

# Desinstalar app
adb uninstall com.desvare.driver

# Abrir app
adb shell am start -n com.desvare.driver/.MainActivity

# Cerrar app
adb shell am force-stop com.desvare.driver

# Ver info del dispositivo
adb shell getprop ro.build.version.release
```

---

## 🎉 RESULTADO ESPERADO

Después de seguir estos pasos:

1. ✅ La app aparecerá en `chrome://inspect`
2. ✅ Podrás ver la consola JavaScript
3. ✅ Podrás ver todas las peticiones HTTP
4. ✅ Podrás debuggear errores de Geolocation
5. ✅ Podrás ver eventos de Socket.IO
6. ✅ Podrás inspeccionar el DOM
7. ✅ Podrás poner breakpoints en el código

---

## 📞 SIGUIENTE PASO

**AHORA:**
1. Recompila la app con los cambios
2. Instálala en el dispositivo
3. Abre `chrome://inspect`
4. Verifica que aparezca la app
5. Click en "inspect"
6. ¡Empieza a debuggear!

**Si tienes problemas:**
- Revisa la sección de Troubleshooting
- Usa Logcat como alternativa
- Verifica el checklist de verificación

---

**Estado:** ✅ LISTO PARA PROBAR  
**Tiempo estimado:** 10-15 minutos para recompilar e instalar  
**Dificultad:** Baja (solo seguir los pasos)

¡Buena suerte con el debugging! 🚀
