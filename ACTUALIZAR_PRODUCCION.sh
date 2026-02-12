#!/bin/bash

# 🚀 Script para Actualizar a Producción
# Fecha: 12 de febrero de 2026

echo "🚀 Actualizando configuración para PRODUCCIÓN..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📝 Cambios que se aplicarán:${NC}"
echo "   1. NODE_ENV=production"
echo "   2. URLs de producción (desvare.app)"
echo "   3. JWT_SECRET seguro"
echo "   4. TWILIO_DEV_MODE=false"
echo ""

# Hacer commit de los cambios locales
echo -e "${BLUE}💾 Haciendo commit de cambios locales...${NC}"
git add backend/.env
git add ACTUALIZAR_PRODUCCION.sh
git commit -m "config: Configuración para producción

- NODE_ENV=production
- URLs de producción configuradas
- JWT_SECRET actualizado
- TWILIO_DEV_MODE=false
- Listo para testing en producción
"

echo -e "${GREEN}✅ Commit creado${NC}"
echo ""

# Push
echo -e "${BLUE}🚀 Haciendo push...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Push exitoso${NC}"
else
    echo -e "${RED}❌ Error en push${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Cambios locales completados${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 AHORA ejecuta estos comandos en DigitalOcean:${NC}"
echo ""
echo -e "${BLUE}# 1. Conectar por SSH${NC}"
echo "   ssh root@tu-servidor-digitalocean"
echo ""
echo -e "${BLUE}# 2. Ir al directorio del backend${NC}"
echo "   cd /home/desvare/desvare-proyect/backend"
echo ""
echo -e "${BLUE}# 3. Hacer backup del .env actual${NC}"
echo "   cp .env .env.backup.\$(date +%Y%m%d_%H%M%S)"
echo ""
echo -e "${BLUE}# 4. Actualizar código${NC}"
echo "   git pull origin main"
echo ""
echo -e "${BLUE}# 5. Editar .env en el servidor${NC}"
echo "   nano .env"
echo ""
echo -e "${YELLOW}   Cambiar estas líneas:${NC}"
echo "   NODE_ENV=production"
echo "   CLIENT_URL=https://desvare.app,https://www.desvare.app"
echo "   DRIVER_URL=https://driver.desvare.app"
echo "   ADMIN_URL=https://admin.desvare.app"
echo "   JWT_SECRET=desvare_production_2026_super_secret_key_change_this"
echo "   TWILIO_DEV_MODE=false"
echo ""
echo -e "${BLUE}# 6. Guardar y salir${NC}"
echo "   Ctrl+X, Y, Enter"
echo ""
echo -e "${BLUE}# 7. Reiniciar PM2${NC}"
echo "   pm2 restart desvare-backend"
echo ""
echo -e "${BLUE}# 8. Verificar logs${NC}"
echo "   pm2 logs desvare-backend --lines 30"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🧪 Testing en Producción:${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "1. Verificar tu número en Twilio:"
echo "   https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
echo ""
echo "2. Ir a: https://desvare.app"
echo ""
echo "3. Registrarse con el número verificado"
echo ""
echo "4. ✅ Debe llegar SMS real"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   Tu cuenta de Twilio sigue en Trial."
echo "   Solo funcionará con números verificados en Twilio."
echo "   Para usuarios reales, contacta a Twilio Support."
echo ""
