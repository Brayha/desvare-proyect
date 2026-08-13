const MAX_IMAGE_DIMENSION = 1200;
const JPEG_QUALITY = 0.75;

export const dataURLToBlob = (dataUrl) => {
  const [metadata, encoded] = dataUrl.split(",");
  const mimeType = metadata.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const bytes = atob(encoded);
  const buffer = new Uint8Array(bytes.length);

  for (let index = 0; index < bytes.length; index += 1) {
    buffer[index] = bytes.charCodeAt(index);
  }

  return new Blob([buffer], { type: mimeType });
};

export const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadImage = (dataUrl) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

export const normalizeImage = async (source) => {
  const originalDataUrl =
    typeof source === "string" ? source : await fileToDataURL(source);

  try {
    const image = await loadImage(originalDataUrl);
    let { width, height } = image;

    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    return originalDataUrl;
  }
};

export const imageToBlob = (image) => {
  if (image instanceof Blob) return image;
  if (typeof image === "string" && image.startsWith("data:")) {
    return dataURLToBlob(image);
  }
  throw new TypeError("La imagen debe ser un DataURL, File o Blob");
};

export const createDocumentFormData = (image, documentType) => {
  const blob = imageToBlob(image);
  const extension = blob.type?.split("/")[1] || "jpg";
  const formData = new FormData();
  formData.append("file", blob, `${documentType}-${Date.now()}.${extension}`);
  formData.append("documentType", documentType);
  return formData;
};
