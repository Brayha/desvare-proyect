/**
 * Captura de fotos con Capacitor Camera.
 * - Tomar foto: usa CAMERA.
 * - Galería: usa el Photo Picker del sistema. No pide READ_MEDIA_IMAGES.
 */

import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

const isCancellation = (error) =>
  error?.message?.toLowerCase().includes("cancel") ||
  error?.message?.toLowerCase().includes("user cancelled");

export const isNativeCameraAvailable = () => Capacitor.isNativePlatform();

export const requestCameraPermissions = async () => {
  if (!isNativeCameraAvailable()) return true;
  const permissions = await Camera.requestPermissions({
    permissions: ["camera"],
  });
  return permissions.camera === "granted";
};

const toImageFile = async (image) => {
  const response = await fetch(image.webPath);
  const blob = await response.blob();
  return new File([blob], `photo_${Date.now()}.${image.format || "jpeg"}`, {
    type: blob.type || `image/${image.format || "jpeg"}`,
  });
};

const pickNativeImage = async (source, quality = 80) => {
  if (source === CameraSource.Camera) {
    const granted = await requestCameraPermissions();
    if (!granted) {
      throw new Error("Necesitamos permiso de cámara para tomar la foto.");
    }
  }

  try {
    const image = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source,
      quality,
      allowEditing: false,
      correctOrientation: true,
    });
    return toImageFile(image);
  } catch (error) {
    if (isCancellation(error)) return null;
    throw error;
  }
};

export const takePhoto = () => pickNativeImage(CameraSource.Camera);

// Photo Picker del sistema: no requiere permiso de galería.
export const chooseFromGallery = () => pickNativeImage(CameraSource.Photos);

export const takePicture = ({ allowGallery = true } = {}) =>
  pickNativeImage(allowGallery ? CameraSource.Photos : CameraSource.Camera);
