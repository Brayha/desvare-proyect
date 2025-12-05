/**
 * Script de prueba para verificar configuración del backend
 * Ejecutar con: node test-setup.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n🔍 VERIFICANDO CONFIGURACIÓN DEL BACKEND\n');
console.log('==========================================\n');

let allGood = true;

// 1. Variables de entorno
console.log('📝 VARIABLES DE ENTORNO:');
const envVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'DO_SPACES_KEY',
  'DO_SPACES_SECRET',
  'DO_SPACES_ENDPOINT',
  'DO_SPACES_BUCKET',
  'DO_SPACES_REGION',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT_PATH'
];

envVars.forEach(varName => {
  const exists = !!process.env[varName];
  console.log(`  ${exists ? '✅' : '❌'} ${varName}: ${exists ? 'Configurado' : 'FALTA'}`);
  if (!exists && varName.includes('DO_SPACES') || varName.includes('FIREBASE')) {
    allGood = false;
  }
});

// 2. Archivo Firebase
console.log('\n📁 ARCHIVO FIREBASE:');
const firebasePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
const firebaseExists = fs.existsSync(path.resolve(__dirname, firebasePath));
console.log(`  ${firebaseExists ? '✅' : '❌'} ${firebasePath}: ${firebaseExists ? 'Existe' : 'NO ENCONTRADO'}`);
if (!firebaseExists) {
  allGood = false;
}

// 3. Módulos instalados
console.log('\n📦 DEPENDENCIAS:');
const dependencies = [
  '@aws-sdk/client-s3',
  'firebase-admin',
  'multer',
  'sharp'
];

dependencies.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`  ✅ ${dep}: Instalado`);
  } catch (e) {
    console.log(`  ❌ ${dep}: NO INSTALADO`);
    allGood = false;
  }
});

// 4. Archivos creados
console.log('\n📄 ARCHIVOS CREADOS:');
const files = [
  'models/User.js',
  'services/storage.js',
  'services/notifications.js',
  'routes/drivers.js'
];

files.forEach(file => {
  const exists = fs.existsSync(path.resolve(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}: ${exists ? 'Existe' : 'FALTA'}`);
  if (!exists) {
    allGood = false;
  }
});

// Resultado final
console.log('\n==========================================\n');
if (allGood) {
  console.log('✅ ¡TODO CONFIGURADO CORRECTAMENTE!');
  console.log('\n🚀 Puedes iniciar el servidor con: npm run dev\n');
  process.exit(0);
} else {
  console.log('❌ HAY PROBLEMAS DE CONFIGURACIÓN');
  console.log('\n📋 Revisa el archivo: ENV_SETUP_INSTRUCTIONS.md\n');
  process.exit(1);
}

