#!/bin/bash

# 🔧 Script de Recompilación: Driver App (Debug Mode)
# Fecha: 11 de Febrero, 2026
# Propósito: Recompilar la Driver App con WebView debugging habilitado

set -e  # Salir si hay algún error

echo "🚀 Iniciando recompilación de Driver App..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -d "driver-app" ]; then
    print_error "Error: No se encuentra el directorio driver-app"
    echo "Por favor ejecuta este script desde: /Users/bgarcia/Documents/desvare-proyect"
    exit 1
fi

# Paso 1: Ir al directorio de la app
print_step "Paso 1/7: Navegando a driver-app..."
cd driver-app
print_success "En directorio: $(pwd)"
echo ""

# Paso 2: Verificar que node_modules existe
if [ ! -d "node_modules" ]; then
    print_warning "node_modules no existe. Instalando dependencias..."
    npm install
    print_success "Dependencias instaladas"
else
    print_success "node_modules existe"
fi
echo ""

# Paso 3: Build del frontend
print_step "Paso 2/7: Compilando frontend (npm run build)..."
npm run build
print_success "Frontend compilado → dist/"
echo ""

# Paso 4: Sincronizar con Capacitor
print_step "Paso 3/7: Sincronizando con Capacitor (npx cap sync)..."
npx cap sync android
print_success "Capacitor sincronizado"
echo ""

# Paso 5: Limpiar builds anteriores
print_step "Paso 4/7: Limpiando builds anteriores..."
cd android
./gradlew clean
print_success "Builds anteriores eliminados"
echo ""

# Paso 6: Compilar APK debug
print_step "Paso 5/7: Compilando APK debug (esto puede tardar 1-2 minutos)..."
./gradlew assembleDebug
print_success "APK debug compilado"
echo ""

# Verificar que el APK existe
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ ! -f "$APK_PATH" ]; then
    print_error "Error: No se generó el APK"
    exit 1
fi

APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
print_success "APK generado: $APK_SIZE"
echo ""

# Paso 7: Verificar dispositivo conectado
print_step "Paso 6/7: Verificando dispositivo Android..."
DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device" | wc -l | xargs)

if [ "$DEVICE_COUNT" -eq "0" ]; then
    print_warning "No hay dispositivos conectados"
    echo ""
    echo "Por favor:"
    echo "1. Conecta tu dispositivo Android con USB"
    echo "2. Activa 'Depuración USB' en el dispositivo"
    echo "3. Autoriza la conexión cuando aparezca el prompt"
    echo "4. Ejecuta: adb devices"
    echo ""
    print_warning "APK generado en: $APK_PATH"
    echo "Puedes instalarlo manualmente con:"
    echo "  adb install -r $APK_PATH"
    exit 0
fi

print_success "Dispositivo(s) conectado(s): $DEVICE_COUNT"
adb devices
echo ""

# Paso 8: Instalar APK
print_step "Paso 7/7: Instalando APK en dispositivo..."
adb install -r "$APK_PATH"
print_success "APK instalado"
echo ""

# Paso 9: Abrir la app
print_step "Abriendo la app..."
adb shell am start -n com.desvare.driver/.MainActivity
print_success "App abierta"
echo ""

# Resumen final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "¡RECOMPILACIÓN COMPLETADA!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 La app está instalada y abierta en tu dispositivo"
echo ""
echo "🔍 SIGUIENTE PASO: Abrir Chrome DevTools"
echo ""
echo "1. Abre Google Chrome en tu Mac"
echo "2. Ve a: chrome://inspect/#devices"
echo "3. Espera 5-10 segundos"
echo "4. Deberías ver: 'Desvare Driver (com.desvare.driver)'"
echo "5. Click en 'inspect'"
echo ""
echo "📝 Si no aparece, revisa:"
echo "   - SOLUCION_WEBVIEW_DEBUGGING.md (sección Troubleshooting)"
echo ""
echo "🐛 Para ver logs en tiempo real:"
echo "   adb logcat | grep -i desvare"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
