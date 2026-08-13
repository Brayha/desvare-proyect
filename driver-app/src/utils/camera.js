/**
 * Utilidades para captura de fotos con Capacitor Camera
 * Compatible con iOS, Android y Web (fallback a input file)
 */

import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

/**
 * Toma una foto usando la cámara nativa o el selector de archivos
 * @param {Object} options - Opciones de captura
 * @param {boolean} options.allowGallery - Permitir seleccionar desde galería
 * @param {number} options.quality - Calidad de la imagen (0-100)
 * @returns {Promise<Blob>} - Archivo de imagen como Blob
 */
const isCancellation = (error) =>
  error?.message?.toLowerCase().includes("cancel") ||
  error?.message?.toLowerCase().includes("user cancelled");

export const isNativeCameraAvailable = () => Capacitor.isNativePlatform();

export const requestCameraPermissions = async (source = "camera") => {
  if (!isNativeCameraAvailable()) return true;
  const permissions = await Camera.requestPermissions({
    permissions: source === "gallery" ? ["photos"] : ["camera", "photos"],
  });
  if (source === "gallery") return permissions.photos === "granted";
  return permissions.camera === "granted" || permissions.photos === "granted";
};

const pickNativeImage = async (source, quality = 80) => {
  const granted = await requestCameraPermissions(
    source === CameraSource.Photos ? "gallery" : "camera",
  );
  if (!granted) {
    throw new Error("Necesitamos permiso para usar la cámara o la galería.");
  }
  try {
    const image = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source,
      quality,
      allowEditing: false,
      correctOrientation: true,
    });
    const response = await fetch(image.webPath);
    const blob = await response.blob();
    return new File([blob], `photo_${Date.now()}.${image.format || "jpeg"}`, {
      type: blob.type || `image/${image.format || "jpeg"}`,
    });
  } catch (error) {
    if (isCancellation(error)) return null;
    throw error;
  }
};

export const takePhoto = () => pickNativeImage(CameraSource.Camera);

// CameraSource.Photos abre la galería directamente y no solicita permiso de cámara.
export const chooseFromGallery = () => pickNativeImage(CameraSource.Photos);

// Alias conservado para consumidores existentes.
export const takePicture = ({ allowGallery = true } = {}) =>
  pickNativeImage(allowGallery ? CameraSource.Prompt : CameraSource.Camera);

