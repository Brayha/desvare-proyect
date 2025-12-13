/**
 * Utilidades para captura de fotos con Capacitor Camera
 * Compatible con iOS, Android y Web (fallback a input file)
 */

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isPlatform } from '@ionic/react';

/**
 * Toma una foto usando la cámara nativa o el selector de archivos
 * @param {Object} options - Opciones de captura
 * @param {boolean} options.allowGallery - Permitir seleccionar desde galería
 * @param {number} options.quality - Calidad de la imagen (0-100)
 * @returns {Promise<Blob>} - Archivo de imagen como Blob
 */
export const takePicture = async (options = {}) => {
  const {
    allowGallery = true,
    quality = 80,
  } = options;

  try {
    // Verificar si estamos en una plataforma nativa
    const isNative = isPlatform('capacitor') || isPlatform('cordova');

    if (isNative) {
      // Usar Capacitor Camera en iOS/Android
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: allowGallery ? CameraSource.Prompt : CameraSource.Camera,
        quality: quality,
        allowEditing: false,
        correctOrientation: true,
      });

      // Convertir la URI a Blob
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      
      // Crear File object con nombre único
      const fileName = `photo_${Date.now()}.${image.format}`;
      return new File([blob], fileName, { type: `image/${image.format}` });
    } else {
      // Fallback para web: usar input file
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (!allowGallery) {
          input.capture = 'camera'; // Forzar cámara en móviles web
        }

        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            resolve(file);
          } else {
            reject(new Error('No se seleccionó ninguna imagen'));
          }
        };

        input.click();
      });
    }
  } catch (error) {
    console.error('Error al capturar imagen:', error);
    throw error;
  }
};

/**
 * Solicita permisos de cámara (solo necesario en plataformas nativas)
 * @returns {Promise<boolean>} - true si tiene permisos
 */
export const requestCameraPermissions = async () => {
  try {
    const isNative = isPlatform('capacitor') || isPlatform('cordova');

    if (isNative) {
      const permissions = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    }

    // En web, los permisos se solicitan automáticamente
    return true;
  } catch (error) {
    console.error('Error solicitando permisos:', error);
    return false;
  }
};

/**
 * Convierte un File/Blob a una URL de datos para previsualización
 * @param {File|Blob} file - Archivo de imagen
 * @returns {Promise<string>} - Data URL
 */
export const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

