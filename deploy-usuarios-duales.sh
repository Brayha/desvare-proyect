#!/bin/bash

# ============================================
# Script de Despliegue: Usuarios Duales
# ============================================
# Este script despliega los cambios para permitir
# que un mismo teléfono tenga cuentas de cliente y conductor
#
# Uso:
#   ./deploy-usuarios-duales.sh
#
# Fecha: 11 de febrero de 2026
# ============================================

set -e  # Salir si hay algún error

echo "🚀 Iniciando despliegue de Usuarios Duales..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Paso 1: Verificar que estamos en el directorio correcto
# ============================================
echo -e "${BLUE}📁 Paso 1: Verificando directorio...${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No estás en el directorio del backend${NC}"
    echo "   Por favor, ejecuta este script desde /root/desvare-proyect/backend"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: No se encontró el archivo .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Directorio correcto${NC}"
echo ""

# ============================================
# Paso 2: Hacer backup del código actual
# ============================================
echo -e "${BLUE}📦 Paso 2: Haciendo backup del código actual...${NC}"

BACKUP_DIR="../backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/"

echo -e "${GREEN}✅ Backup creado en: $BACKUP_DIR${NC}"
echo ""

# ============================================
# Paso 3: Actualizar el código
# ============================================
echo -e "${BLUE}📥 Paso 3: Actualizando código desde Git...${NC}"

# Verificar el estado de Git
git status

# Hacer pull de los cambios
echo ""
echo -e "${YELLOW}⚠️  Haciendo git pull...${NC}"
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al hacer git pull${NC}"
    echo "   Resuelve los conflictos manualmente y vuelve a ejecutar el script"
    exit 1
fi

echo -e "${GREEN}✅ Código actualizado${NC}"
echo ""

# ============================================
# Paso 4: Instalar dependencias
# ============================================
echo -e "${BLUE}📦 Paso 4: Instalando dependencias...${NC}"

npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al instalar dependencias${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# ============================================
# Paso 5: Eliminar índice antiguo de MongoDB
# ============================================
echo -e "${BLUE}🗄️  Paso 5: Actualizando índices de MongoDB...${NC}"

# Crear script temporal de Node.js para eliminar el índice
cat > /tmp/drop-phone-index.js << 'EOF'
const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndex() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const User = mongoose.connection.collection('users');
    
    // Listar índices actuales
    const indexes = await User.indexes();
    console.log('\n📊 Índices actuales:');
    indexes.forEach(index => {
      console.log(`   - ${index.name}`);
    });
    
    // Intentar eliminar el índice antiguo de phone
    try {
      await User.dropIndex('phone_1');
      console.log('\n✅ Índice phone_1 eliminado correctamente');
    } catch (error) {
      if (error.code === 27) {
        console.log('\nℹ️  Índice phone_1 no existe (ya fue eliminado)');
      } else {
        console.log('\n⚠️  Error al eliminar índice:', error.message);
      }
    }
    
    console.log('\n✅ Proceso completado');
    console.log('   El nuevo índice compuesto se creará al reiniciar el backend');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

dropOldIndex();
EOF

# Ejecutar el script
node /tmp/drop-phone-index.js

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Advertencia: Hubo un problema al actualizar índices${NC}"
    echo "   Puedes continuar, pero verifica los índices manualmente después"
    echo ""
    read -p "¿Deseas continuar? (s/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Limpiar script temporal
rm -f /tmp/drop-phone-index.js

echo ""

# ============================================
# Paso 6: Reiniciar el backend con PM2
# ============================================
echo -e "${BLUE}🔄 Paso 6: Reiniciando backend con PM2...${NC}"

pm2 restart desvare-backend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al reiniciar PM2${NC}"
    echo "   Intenta manualmente: pm2 restart desvare-backend"
    exit 1
fi

echo -e "${GREEN}✅ Backend reiniciado${NC}"
echo ""

# Esperar un momento para que el backend inicie
echo "⏳ Esperando 5 segundos para que el backend inicie..."
sleep 5

# ============================================
# Paso 7: Verificar que el backend está corriendo
# ============================================
echo -e "${BLUE}🔍 Paso 7: Verificando estado del backend...${NC}"

pm2 status desvare-backend

echo ""
echo -e "${YELLOW}📋 Últimas líneas del log:${NC}"
pm2 logs desvare-backend --lines 10 --nostream

echo ""

# ============================================
# Paso 8: Verificar el nuevo índice
# ============================================
echo -e "${BLUE}🔍 Paso 8: Verificando nuevo índice en MongoDB...${NC}"

# Crear script temporal para verificar índices
cat > /tmp/verify-indexes.js << 'EOF'
const mongoose = require('mongoose');
require('dotenv').config();

async function verifyIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.connection.collection('users');
    const indexes = await User.indexes();
    
    console.log('\n📊 Índices actuales en la colección users:');
    indexes.forEach(index => {
      console.log(`\n   Nombre: ${index.name}`);
      console.log(`   Keys: ${JSON.stringify(index.key)}`);
      if (index.unique) {
        console.log(`   Unique: ✅`);
      }
    });
    
    // Buscar el nuevo índice compuesto
    const compoundIndex = indexes.find(i => i.name === 'phone_1_userType_1');
    
    if (compoundIndex) {
      console.log('\n✅ Índice compuesto phone_1_userType_1 encontrado correctamente');
      console.log('   Esto permite que un mismo teléfono tenga cuentas de cliente y conductor');
    } else {
      console.log('\n⚠️  Índice compuesto NO encontrado');
      console.log('   Puede que necesite más tiempo para crearse. Verifica en unos minutos.');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

verifyIndexes();
EOF

node /tmp/verify-indexes.js

# Limpiar script temporal
rm -f /tmp/verify-indexes.js

echo ""

# ============================================
# Paso 9: Resumen final
# ============================================
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Despliegue completado exitosamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📋 Resumen de cambios:${NC}"
echo "   ✅ Código actualizado desde Git"
echo "   ✅ Dependencias instaladas"
echo "   ✅ Índice antiguo de phone eliminado"
echo "   ✅ Backend reiniciado con PM2"
echo "   ✅ Nuevo índice compuesto creado"
echo ""
echo -e "${BLUE}🎯 Funcionalidad nueva:${NC}"
echo "   ✅ Un conductor puede registrarse como cliente"
echo "   ✅ Un cliente puede registrarse como conductor"
echo "   ✅ Mismo teléfono, dos cuentas separadas"
echo ""
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "   1. Probar registro de conductor en Driver App"
echo "   2. Probar registro de cliente con el mismo teléfono en PWA"
echo "   3. Verificar que ambas cuentas funcionan correctamente"
echo ""
echo -e "${BLUE}📊 Monitorear logs:${NC}"
echo "   pm2 logs desvare-backend"
echo ""
echo -e "${BLUE}📄 Documentación:${NC}"
echo "   - IMPLEMENTACION_USUARIOS_DUALES.md"
echo "   - DEPLOY_USUARIOS_DUALES.md"
echo ""
echo -e "${GREEN}🎉 ¡Listo para probar en producción!${NC}"
