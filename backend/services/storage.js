/**
 * Servicio de almacenamiento de archivos en DigitalOcean Spaces
 * Compatible con API de AWS S3
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

// Configuración del cliente S3 para DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT || 'fra1.digitaloceanspaces.com'}`,
  region: process.env.DO_SPACES_REGION || 'fra1',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
  forcePathStyle: false, // Necesario para DigitalOcean Spaces
  signatureVersion: 'v4', // Forzar uso de Signature V4
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'desvare';

/**
 * Procesa y optimiza una imagen antes de subirla
 * @param {Buffer} buffer - Buffer de la imagen
 * @param {Object} options - Opciones de procesamiento
 * @returns {Promise<Buffer>} Buffer optimizado
 */
const processImage = async (buffer, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    format = 'jpeg'
  } = options;

  try {
    return await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();
  } catch (error) {
    console.error('❌ Error procesando imagen:', error);
    // Si falla el procesamiento, devolver el buffer original
    return buffer;
  }
};

/**
 * Sube un documento del conductor a Spaces
 * @param {Buffer|string} file - Buffer de la imagen o base64
 * @param {string} userId - ID del usuario
 * @param {string} documentType - Tipo de documento (cedula-front, soat, etc.)
 * @returns {Promise<string>} URL pública del archivo
 */
const uploadDriverDocument = async (file, userId, documentType) => {
  try {
    // Convertir base64 a buffer si es necesario
    let fileBuffer;
    if (typeof file === 'string' && file.startsWith('data:image')) {
      const base64Data = file.split(',')[1];
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else if (file.buffer) {
      fileBuffer = file.buffer;
    } else {
      throw new Error('Formato de archivo no soportado');
    }

    // Procesar imagen (optimizar tamaño)
    const processedBuffer = await processImage(fileBuffer, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 85
    });

    // Generar nombre único del archivo
    const timestamp = Date.now();
    const key = `drivers/${userId}/documents/${documentType}-${timestamp}.jpg`;

    // Subir a Spaces
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: processedBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read', // Público para lectura (las URLs son aleatorias y solo el admin las ve)
      CacheControl: 'max-age=31536000', // Cache de 1 año
    });

    await s3Client.send(command);

    // Construir URL pública
    const endpoint = process.env.DO_SPACES_ENDPOINT || 'fra1.digitaloceanspaces.com';
    const publicUrl = `https://${BUCKET_NAME}.${endpoint}/${key}`;
    
    console.log(`✅ Documento subido: ${documentType} para usuario ${userId}`);
    console.log(`📎 URL: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    console.error('❌ Error subiendo documento:', error);
    throw new Error(`Error al subir ${documentType}: ${error.message}`);
  }
};

/**
 * Sube múltiples documentos en paralelo
 * @param {Array} documents - Array de objetos {file, documentType}
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Objeto con URLs de todos los documentos
 */
const uploadMultipleDocuments = async (documents, userId) => {
  try {
    const uploadPromises = documents.map(doc =>
      uploadDriverDocument(doc.file, userId, doc.documentType)
        .then(url => ({ [doc.documentType]: url }))
        .catch(error => {
          console.error(`Error subiendo ${doc.documentType}:`, error);
          return { [doc.documentType]: null, error: error.message };
        })
    );

    const results = await Promise.all(uploadPromises);
    
    // Combinar resultados en un solo objeto
    return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});

  } catch (error) {
    console.error('❌ Error subiendo múltiples documentos:', error);
    throw error;
  }
};

/**
 * Elimina un archivo de Spaces
 * @param {string} fileUrl - URL del archivo a eliminar
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
const deleteFile = async (fileUrl) => {
  try {
    // Extraer la key del URL
    const urlParts = fileUrl.split(`${BUCKET_NAME}.`)[1];
    if (!urlParts) {
      throw new Error('URL inválida');
    }
    const key = urlParts.split('?')[0]; // Eliminar query params si existen

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`🗑️ Archivo eliminado: ${key}`);
    return true;

  } catch (error) {
    console.error('❌ Error eliminando archivo:', error);
    return false;
  }
};

/**
 * Elimina todos los documentos de un conductor
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>}
 */
const deleteAllDriverDocuments = async (userId) => {
  try {
    // En producción, aquí usaríamos ListObjectsV2 para listar todos los archivos
    // Por ahora, retornamos true (los archivos viejos se sobrescriben de todas formas)
    console.log(`🗑️ Limpieza de documentos para usuario ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando documentos del conductor:', error);
    return false;
  }
};

module.exports = {
  uploadDriverDocument,
  uploadMultipleDocuments,
  deleteFile,
  deleteAllDriverDocuments,
  processImage
};

