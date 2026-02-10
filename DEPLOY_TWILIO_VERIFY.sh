#!/bin/bash
# Script para desplegar Twilio Verify en producción
# Fecha: 9 de febrero de 2026

echo "🚀 DESPLEGANDO TWILIO VERIFY A PRODUCCIÓN"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paso 1: Pull del código
echo -e "${BLUE}📥 PASO 1: Actualizando código desde GitHub...${NC}"
cd /root/desvare-proyect/backend
git pull origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Código actualizado correctamente${NC}"
else
    echo -e "${RED}❌ Error al actualizar código${NC}"
    exit 1
fi

echo ""

# Paso 2: Instalar dependencias
echo -e "${BLUE}📦 PASO 2: Instalando paquete Twilio...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
else
    echo -e "${RED}❌ Error instalando dependencias${NC}"
    exit 1
fi

echo ""

# Paso 3: Configurar variables de entorno
echo -e "${BLUE}🔧 PASO 3: Configurando variables de entorno...${NC}"
echo -e "${YELLOW}⚠️  IMPORTANTE: Necesitas agregar estas variables al .env:${NC}"
echo ""
echo "TWILIO_ACCOUNT_SID=AC76c4d35ca07b7e6b5367866898af95"
echo "TWILIO_AUTH_TOKEN=2e8c46e3105a0e4b30fffb2e64574a9b"
echo "TWILIO_VERIFY_SERVICE_SID=VAb8c7c5794adc9930367857aa9501d15a"
echo ""
echo -e "${YELLOW}¿Quieres que las agregue automáticamente? (s/n)${NC}"
read -r respuesta

if [[ "$respuesta" == "s" || "$respuesta" == "S" ]]; then
    # Verificar si ya existen las variables
    if grep -q "TWILIO_VERIFY_SERVICE_SID" .env; then
        echo -e "${YELLOW}⚠️  Variables de Twilio ya existen en .env${NC}"
        echo -e "${YELLOW}Actualizando valores...${NC}"
        
        # Actualizar valores existentes
        sed -i 's/^TWILIO_ACCOUNT_SID=.*/TWILIO_ACCOUNT_SID=AC76c4d35ca07b7e6b5367866898af95/' .env
        sed -i 's/^TWILIO_AUTH_TOKEN=.*/TWILIO_AUTH_TOKEN=2e8c46e3105a0e4b30fffb2e64574a9b/' .env
        sed -i 's/^TWILIO_VERIFY_SERVICE_SID=.*/TWILIO_VERIFY_SERVICE_SID=VAb8c7c5794adc9930367857aa9501d15a/' .env
    else
        echo -e "${BLUE}Agregando variables de Twilio a .env...${NC}"
        
        # Agregar nuevas variables
        echo "" >> .env
        echo "# Twilio Verify (para OTP - funciona en Colombia)" >> .env
        echo "TWILIO_ACCOUNT_SID=AC76c4d35ca07b7e6b5367866898af95" >> .env
        echo "TWILIO_AUTH_TOKEN=2e8c46e3105a0e4b30fffb2e64574a9b" >> .env
        echo "TWILIO_VERIFY_SERVICE_SID=VAb8c7c5794adc9930367857aa9501d15a" >> .env
    fi
    
    echo -e "${GREEN}✅ Variables configuradas${NC}"
else
    echo -e "${YELLOW}⚠️  Configura manualmente con: nano .env${NC}"
    echo -e "${YELLOW}Presiona Enter cuando hayas terminado...${NC}"
    read -r
fi

echo ""

# Paso 4: Verificar configuración
echo -e "${BLUE}🔍 PASO 4: Verificando configuración...${NC}"
if grep -q "TWILIO_VERIFY_SERVICE_SID" .env; then
    echo -e "${GREEN}✅ Variables de Twilio encontradas en .env${NC}"
    
    # Mostrar valores (ocultando parte del token)
    ACCOUNT_SID=$(grep "TWILIO_ACCOUNT_SID" .env | cut -d '=' -f2)
    AUTH_TOKEN=$(grep "TWILIO_AUTH_TOKEN" .env | cut -d '=' -f2)
    VERIFY_SID=$(grep "TWILIO_VERIFY_SERVICE_SID" .env | cut -d '=' -f2)
    
    echo "   Account SID: ${ACCOUNT_SID:0:10}...${ACCOUNT_SID: -4}"
    echo "   Auth Token: ${AUTH_TOKEN:0:6}...${AUTH_TOKEN: -4}"
    echo "   Verify Service SID: ${VERIFY_SID:0:10}...${VERIFY_SID: -4}"
else
    echo -e "${RED}❌ Variables de Twilio NO encontradas${NC}"
    echo -e "${YELLOW}Configura manualmente con: nano .env${NC}"
    exit 1
fi

echo ""

# Paso 5: Reiniciar PM2
echo -e "${BLUE}🔄 PASO 5: Reiniciando backend con PM2...${NC}"
pm2 restart backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend reiniciado${NC}"
else
    echo -e "${RED}❌ Error reiniciando backend${NC}"
    exit 1
fi

echo ""

# Paso 6: Verificar logs
echo -e "${BLUE}📋 PASO 6: Verificando logs de inicialización...${NC}"
sleep 3
pm2 logs backend --lines 30 --nostream | grep -A 2 "Twilio"

echo ""
echo -e "${GREEN}=========================================="
echo -e "✅ DESPLIEGUE COMPLETADO"
echo -e "==========================================${NC}"
echo ""
echo -e "${BLUE}📊 VERIFICACIONES FINALES:${NC}"
echo ""
echo "1. Verifica que veas este mensaje en los logs:"
echo -e "   ${GREEN}✅ Twilio Verify inicializado correctamente${NC}"
echo ""
echo "2. Prueba el registro desde la PWA:"
echo "   https://app.desvare.app/register"
echo ""
echo "3. Ingresa tu número real y verifica que llegue el SMS"
echo ""
echo -e "${YELLOW}📱 Para ver logs en tiempo real:${NC}"
echo "   pm2 logs backend"
echo ""
echo -e "${YELLOW}🔍 Para ver solo logs de Twilio:${NC}"
echo "   pm2 logs backend | grep Twilio"
echo ""
