#!/bin/bash

# 🔧 Script para Aplicar Fix de ProGuard a Plugins de Capacitor
# Fecha: 11 de Febrero, 2026
# Propósito: Corregir error de proguard-android.txt en node_modules

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Aplicando fix de ProGuard a plugins de Capacitor...${NC}"
echo ""

# Directorio base
BASE_DIR="/Users/bgarcia/Documents/desvare-proyect/driver-app"

# Lista de archivos a corregir (relativos a BASE_DIR)
FILES=(
  "node_modules/@capacitor/android/capacitor/build.gradle"
  "node_modules/@capacitor/camera/android/build.gradle"
  "node_modules/@capacitor/push-notifications/android/build.gradle"
  "node_modules/@capacitor/geolocation/android/build.gradle"
)

FIXED=0
NOT_FOUND=0

for file in "${FILES[@]}"; do
  FULL_PATH="$BASE_DIR/$file"
  
  if [ -f "$FULL_PATH" ]; then
    # Verificar si ya tiene el fix aplicado
    if grep -q "proguard-android.txt" "$FULL_PATH"; then
      # Aplicar el fix
      sed -i '' "s/proguard-android.txt/proguard-android-optimize.txt/g" "$FULL_PATH"
      echo -e "${GREEN}✅ Corregido: $file${NC}"
      ((FIXED++))
    else
      echo -e "${YELLOW}⚠️  Ya corregido: $file${NC}"
    fi
  else
    echo -e "${RED}❌ No encontrado: $file${NC}"
    ((NOT_FOUND++))
  fi
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📊 RESUMEN${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Archivos corregidos: $FIXED${NC}"
echo -e "${YELLOW}⚠️  Archivos no encontrados: $NOT_FOUND${NC}"
echo ""

if [ $FIXED -gt 0 ]; then
  echo -e "${GREEN}✅ Fix aplicado exitosamente${NC}"
  echo ""
  echo -e "${BLUE}Próximos pasos:${NC}"
  echo "1. Abre Android Studio"
  echo "2. Sync Gradle (si aparece el banner)"
  echo "3. Build → Generate APKs"
else
  echo -e "${YELLOW}⚠️  No se aplicaron cambios (archivos ya corregidos o no encontrados)${NC}"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
