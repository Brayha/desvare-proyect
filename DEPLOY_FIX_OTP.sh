#!/bin/bash

# 🚀 Script de Deploy: Fix OTP Twilio Trial
# Fecha: 12 de febrero de 2026
# Descripción: Activa modo desarrollo OTP para evitar restricciones de Twilio Trial

echo "🚀 Iniciando deploy del fix OTP..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar que estamos en el directorio correcto
echo -e "${BLUE}📂 Verificando directorio...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: No se encuentra backend/.env${NC}"
    echo "   Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi
echo -e "${GREEN}✅ Directorio correcto${NC}"
echo ""

# 2. Hacer backup del .env actual
echo -e "${BLUE}💾 Haciendo backup de .env...${NC}"
cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Backup creado${NC}"
echo ""

# 3. Verificar si ya existe la variable TWILIO_DEV_MODE
echo -e "${BLUE}🔍 Verificando configuración actual...${NC}"
if grep -q "TWILIO_DEV_MODE" backend/.env; then
    echo -e "${YELLOW}⚠️  TWILIO_DEV_MODE ya existe en .env${NC}"
    CURRENT_VALUE=$(grep "TWILIO_DEV_MODE" backend/.env | cut -d '=' -f2)
    echo "   Valor actual: $CURRENT_VALUE"
else
    echo -e "${YELLOW}⚠️  TWILIO_DEV_MODE no existe, se agregará${NC}"
fi
echo ""

# 4. Mostrar cambios que se van a hacer
echo -e "${BLUE}📝 Cambios a realizar:${NC}"
echo "   1. Modificado: backend/services/sms.js (ya hecho localmente)"
echo "   2. Agregado: TWILIO_DEV_MODE=true en backend/.env"
echo "   3. Reiniciar: pm2 restart desvare-backend"
echo ""

# 5. Preguntar confirmación
read -p "¿Continuar con el deploy? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deploy cancelado${NC}"
    exit 1
fi
echo ""

# 6. Agregar commits
echo -e "${BLUE}📦 Preparando commits...${NC}"
git add backend/services/sms.js
git add backend/.env
git add SOLUCION_TWILIO_TRIAL.md
git add ACTIVAR_MODO_DESARROLLO_OTP.md
git add RESUMEN_PROBLEMA_OTP.md
git add DEPLOY_FIX_OTP.sh
echo -e "${GREEN}✅ Archivos agregados${NC}"
echo ""

# 7. Crear commit
echo -e "${BLUE}💾 Creando commit...${NC}"
git commit -m "$(cat <<'EOF'
fix: Agregar modo desarrollo OTP para evitar restricciones Twilio Trial

Problema:
- Cuenta Twilio en modo Trial solo envía SMS a números verificados
- Error 21608: The phone number is unverified
- Bloquea registro de nuevos usuarios

Solución:
- Agregado modo desarrollo con código OTP fijo: 123456
- Variable TWILIO_DEV_MODE=true en .env
- No requiere SMS reales para testing
- Detecta error 21608 y sugiere soluciones

Archivos modificados:
- backend/services/sms.js: Modo desarrollo OTP
- backend/.env: Variable TWILIO_DEV_MODE=true

Documentación:
- SOLUCION_TWILIO_TRIAL.md: Todas las soluciones
- ACTIVAR_MODO_DESARROLLO_OTP.md: Instrucciones de uso
- RESUMEN_PROBLEMA_OTP.md: Resumen del problema

IMPORTANTE: Cambiar TWILIO_DEV_MODE=false antes de producción
EOF
)"
echo -e "${GREEN}✅ Commit creado${NC}"
echo ""

# 8. Push a origin
echo -e "${BLUE}🚀 Haciendo push a origin...${NC}"
git push origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Push exitoso${NC}"
else
    echo -e "${RED}❌ Error en push${NC}"
    exit 1
fi
echo ""

# 9. Instrucciones para DigitalOcean
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deploy local completado${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Ahora ejecuta estos comandos en DigitalOcean:${NC}"
echo ""
echo -e "${BLUE}# 1. Conectar por SSH${NC}"
echo "   ssh root@tu-servidor-digitalocean"
echo ""
echo -e "${BLUE}# 2. Ir al directorio del backend${NC}"
echo "   cd /home/desvare/desvare-proyect/backend"
echo ""
echo -e "${BLUE}# 3. Actualizar código${NC}"
echo "   git pull origin main"
echo ""
echo -e "${BLUE}# 4. Reiniciar PM2${NC}"
echo "   pm2 restart desvare-backend"
echo ""
echo -e "${BLUE}# 5. Verificar logs${NC}"
echo "   pm2 logs desvare-backend --lines 20"
echo ""
echo -e "${BLUE}# Buscar en los logs:${NC}"
echo "   🔧 MODO DESARROLLO ACTIVADO: OTP fijo sin SMS real"
echo "   🔑 Código OTP de desarrollo: 123456"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🧪 Testing:${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "1. Ir a: https://desvare.app"
echo "2. Registrarse con cualquier número"
echo "3. Ingresar código: 123456"
echo "4. ✅ Debe funcionar"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   Antes de producción, cambiar TWILIO_DEV_MODE=false"
echo ""
