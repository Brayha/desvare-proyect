/**
 * Script para convertir todos los documentos privados en públicos
 * Esto es necesario después de cambiar de ACL: 'private' a ACL: 'public-read'
 * 
 * Ejecutar con: node backend/scripts/makeDocumentsPublic.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { S3Client, ListObjectsV2Command, CopyObjectCommand } = require('@aws-sdk/client-s3');

console.log('🔓 Iniciando proceso para hacer documentos públicos...\n');

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

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'desvare';

const makeDocumentsPublic = async () => {
  try {
    console.log(`📂 Bucket: ${BUCKET_NAME}`);
    console.log('🔍 Listando todos los archivos en drivers/...\n');

    // Listar todos los objetos en el bucket que empiecen con "drivers/"
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'drivers/', // Solo archivos de conductores
    });

    const listResult = await s3Client.send(listCommand);

    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log('ℹ️  No se encontraron archivos para actualizar.');
      return;
    }

    console.log(`📊 Encontrados ${listResult.Contents.length} archivos.\n`);
    console.log('🔄 Actualizando permisos a público...\n');

    let successCount = 0;
    let errorCount = 0;

    // Actualizar cada archivo
    for (const object of listResult.Contents) {
      try {
        const key = object.Key;
        
        // Copiar el objeto sobre sí mismo con nuevo ACL (esto actualiza los permisos)
        const copyCommand = new CopyObjectCommand({
          Bucket: BUCKET_NAME,
          CopySource: `${BUCKET_NAME}/${key}`,
          Key: key,
          ACL: 'public-read',
          MetadataDirective: 'REPLACE', // Reemplazar metadatos para forzar el cambio
          ContentType: 'image/jpeg',
          CacheControl: 'max-age=31536000',
          Metadata: {
            'updated': new Date().toISOString(),
          },
        });

        await s3Client.send(copyCommand);
        successCount++;
        console.log(`✅ ${key}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error en ${object.Key}:`, error.message);
      }
    }

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Actualizados: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📁 Total: ${listResult.Contents.length}`);
    console.log('═'.repeat(60));
    console.log('\n');

    if (successCount > 0) {
      console.log('🎉 ¡Documentos ahora son públicos!');
      console.log('💡 Recarga el Admin Dashboard para ver las imágenes.\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  }
};

makeDocumentsPublic();

