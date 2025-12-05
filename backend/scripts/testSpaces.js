/**
 * Script de prueba para verificar la conexión a DigitalOcean Spaces
 * Ejecutar con: node backend/scripts/testSpaces.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { S3Client, PutObjectCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');

console.log('🔍 Iniciando prueba de conexión a DigitalOcean Spaces...\n');

// Mostrar configuración (sin mostrar secretos completos)
console.log('📋 Configuración detectada:');
console.log('  Endpoint:', process.env.DO_SPACES_ENDPOINT);
console.log('  Region:', process.env.DO_SPACES_REGION);
console.log('  Bucket:', process.env.DO_SPACES_BUCKET);
console.log('  Access Key:', process.env.DO_SPACES_KEY ? `${process.env.DO_SPACES_KEY.substring(0, 8)}...` : '❌ NO CONFIGURADO');
console.log('  Secret Key:', process.env.DO_SPACES_SECRET ? `${process.env.DO_SPACES_SECRET.substring(0, 8)}...` : '❌ NO CONFIGURADO');
console.log('');

// Configurar cliente S3
const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT}`,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
  forcePathStyle: false,
  signatureVersion: 'v4',
});

const testConnection = async () => {
  try {
    console.log('📤 Intentando subir archivo de prueba...');

    // Crear un archivo de prueba simple
    const testContent = Buffer.from(`Desvare Connection Test - ${new Date().toISOString()}`);
    const testKey = `test/connection-test-${Date.now()}.txt`;

    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      ACL: 'private',
    });

    await s3Client.send(command);

    const publicUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${testKey}`;

    console.log('✅ ¡CONEXIÓN EXITOSA!');
    console.log('✅ El archivo de prueba se subió correctamente.');
    console.log(`📎 URL: ${publicUrl}`);
    console.log('');
    console.log('🎉 Las credenciales de DigitalOcean Spaces están correctamente configuradas.');
    console.log('');

  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN\n');
    console.error('Código de error:', error.name);
    console.error('Mensaje:', error.message);
    console.error('');

    if (error.name === 'SignatureDoesNotMatch') {
      console.error('🔧 SOLUCIÓN:');
      console.error('  1. Verifica que DO_SPACES_KEY y DO_SPACES_SECRET estén correctos');
      console.error('  2. Regenera las credenciales en DigitalOcean → API → Spaces Keys');
      console.error('  3. Asegúrate de no tener espacios en blanco al copiar/pegar');
    } else if (error.name === 'NoSuchBucket') {
      console.error('🔧 SOLUCIÓN:');
      console.error(`  1. El bucket "${process.env.DO_SPACES_BUCKET}" no existe`);
      console.error('  2. Créalo en DigitalOcean → Spaces → Create Space');
      console.error('  3. O cambia DO_SPACES_BUCKET al nombre correcto');
    } else if (error.name === 'InvalidAccessKeyId') {
      console.error('🔧 SOLUCIÓN:');
      console.error('  1. La Access Key es inválida o fue eliminada');
      console.error('  2. Genera una nueva en DigitalOcean → API → Spaces Keys');
    } else {
      console.error('🔧 Revisa la documentación de DigitalOcean Spaces');
      console.error('   https://docs.digitalocean.com/products/spaces/');
    }
    console.error('');
    console.error('Detalles completos del error:');
    console.error(error);
  }
};

testConnection();

