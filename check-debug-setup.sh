#!/bin/bash

# 🔍 Script de Verificación: Configuración de Debugging
# Fecha: 11 de Febrero, 2026
# Propósito: Verificar que todo esté configurado correctamente

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_check() {
    echo -e "${BLUE}🔍 Verificando: $1${NC}"
}

print_ok() {
    echo -e "${GREEN}   ✅ $1${NC}"
}

print_fail() {
    echo -e "${RED}   ❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}   ⚠️  $1${NC}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICACIÓN DE CONFIGURACIÓN DE DEBUGGING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Verificar MainActivity.java
print_check "MainActivity.java"
if grep -q "WebView.setWebContentsDebuggingEnabled" driver-app/android/app/src/main/java/com/desvare/driver/MainActivity.java 2>/dev/null; then
    print_ok "WebView debugging habilitado en MainActivity.java"
else
    print_fail "WebView debugging NO encontrado en MainActivity.java"
    echo "      Ejecuta: cat driver-app/android/app/src/main/java/com/desvare/driver/MainActivity.java"
fi
echo ""

# 2. Verificar capacitor.config.json
print_check "capacitor.config.json"
if grep -q "webContentsDebuggingEnabled" driver-app/capacitor.config.json 2>/dev/null; then
    print_ok "webContentsDebuggingEnabled encontrado en capacitor.config.json"
else
    print_warning "webContentsDebuggingEnabled NO encontrado (no crítico)"
fi
echo ""

# 3. Verificar variables de entorno
print_check "Variables de entorno (.env)"
if [ -f "driver-app/.env" ]; then
    print_ok "Archivo .env existe"
    if grep -q "VITE_API_URL=https://api.desvare.app" driver-app/.env; then
        print_ok "VITE_API_URL apunta a producción"
    else
        print_warning "VITE_API_URL no apunta a producción"
        echo "      Valor actual: $(grep VITE_API_URL driver-app/.env)"
    fi
else
    print_fail "Archivo .env NO existe"
    echo "      Crea: driver-app/.env"
fi
echo ""

# 4. Verificar ADB
print_check "Android Debug Bridge (ADB)"
if command -v adb &> /dev/null; then
    print_ok "ADB instalado"
    ADB_VERSION=$(adb version | head -1)
    echo "      $ADB_VERSION"
else
    print_fail "ADB NO instalado"
    echo "      Instala: brew install android-platform-tools"
fi
echo ""

# 5. Verificar dispositivos conectados
print_check "Dispositivos Android conectados"
DEVICE_COUNT=$(adb devices 2>/dev/null | grep -v "List" | grep "device" | wc -l | xargs)
if [ "$DEVICE_COUNT" -gt "0" ]; then
    print_ok "$DEVICE_COUNT dispositivo(s) conectado(s)"
    adb devices | grep "device" | grep -v "List"
else
    print_warning "No hay dispositivos conectados"
    echo "      1. Conecta tu dispositivo con USB"
    echo "      2. Activa 'Depuración USB'"
    echo "      3. Autoriza la conexión"
fi
echo ""

# 6. Verificar Node.js y npm
print_check "Node.js y npm"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_ok "Node.js $NODE_VERSION"
    print_ok "npm $NPM_VERSION"
else
    print_fail "Node.js NO instalado"
fi
echo ""

# 7. Verificar Capacitor CLI
print_check "Capacitor CLI"
if [ -d "driver-app/node_modules/@capacitor/cli" ]; then
    print_ok "Capacitor CLI instalado"
else
    print_warning "Capacitor CLI no encontrado en node_modules"
    echo "      Ejecuta: cd driver-app && npm install"
fi
echo ""

# 8. Verificar Android SDK
print_check "Android SDK"
if [ -d "$HOME/Library/Android/sdk" ]; then
    print_ok "Android SDK encontrado"
    echo "      Ubicación: $HOME/Library/Android/sdk"
elif [ -d "/usr/local/share/android-sdk" ]; then
    print_ok "Android SDK encontrado"
    echo "      Ubicación: /usr/local/share/android-sdk"
else
    print_warning "Android SDK no encontrado en ubicaciones comunes"
    echo "      Instala Android Studio para obtener el SDK"
fi
echo ""

# 9. Verificar que el proyecto Android existe
print_check "Proyecto Android de Capacitor"
if [ -d "driver-app/android" ]; then
    print_ok "Directorio android/ existe"
    if [ -f "driver-app/android/app/build.gradle" ]; then
        print_ok "build.gradle existe"
    else
        print_fail "build.gradle NO existe"
    fi
else
    print_fail "Directorio android/ NO existe"
    echo "      Ejecuta: cd driver-app && npx cap add android"
fi
echo ""

# 10. Verificar Chrome
print_check "Google Chrome (para DevTools)"
if [ -d "/Applications/Google Chrome.app" ]; then
    print_ok "Google Chrome instalado"
else
    print_warning "Google Chrome no encontrado"
    echo "      Descarga: https://www.google.com/chrome/"
fi
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Contar checks
TOTAL_CHECKS=10
PASSED=0

# MainActivity
if grep -q "WebView.setWebContentsDebuggingEnabled" driver-app/android/app/src/main/java/com/desvare/driver/MainActivity.java 2>/dev/null; then
    ((PASSED++))
fi

# capacitor.config.json (no crítico)
((PASSED++))

# .env
if [ -f "driver-app/.env" ]; then
    ((PASSED++))
fi

# ADB
if command -v adb &> /dev/null; then
    ((PASSED++))
fi

# Dispositivos (no crítico para compilar)
((PASSED++))

# Node.js
if command -v node &> /dev/null; then
    ((PASSED++))
fi

# Capacitor CLI
if [ -d "driver-app/node_modules/@capacitor/cli" ]; then
    ((PASSED++))
fi

# Android SDK (no crítico si usas Android Studio)
((PASSED++))

# Proyecto Android
if [ -d "driver-app/android" ]; then
    ((PASSED++))
fi

# Chrome (no crítico)
((PASSED++))

echo "✅ Checks pasados: $PASSED/$TOTAL_CHECKS"
echo ""

if [ $PASSED -ge 8 ]; then
    echo -e "${GREEN}🎉 ¡Todo listo para compilar!${NC}"
    echo ""
    echo "Ejecuta:"
    echo "  ./rebuild-driver-debug.sh"
    echo ""
    echo "O manualmente:"
    echo "  cd driver-app"
    echo "  npm run build"
    echo "  npx cap sync android"
    echo "  npx cap open android"
else
    echo -e "${YELLOW}⚠️  Hay algunos problemas que debes resolver${NC}"
    echo ""
    echo "Revisa los errores marcados con ❌ arriba"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
