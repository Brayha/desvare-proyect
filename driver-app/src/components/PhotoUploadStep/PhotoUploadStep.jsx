import React, { useRef, useState } from "react";
import { Camera, Gallery, TickCircle } from "iconsax-react";
import {
  chooseFromGallery,
  isNativeCameraAvailable,
  takePhoto,
} from "../../utils/camera";
import "./PhotoUploadStep.css";

/**
 * Componente de carga de fotos con 3 estados progresivos:
 *   Estado 0 — Imagen grande + zona de carga (primera foto)
 *   Estado 1 — Imagen mediana + preview foto 1 + zona de carga (segunda foto, si existe)
 *   Estado 2 — Imagen pequeña + dos previews lado a lado + botón Siguiente
 *
 * Para pasos de 1 sola foto: Estado 0 → Estado 1 (preview + botón)
 * Para pasos opcionales: botón Siguiente visible desde el inicio
 */
const PhotoUploadStep = ({
  image,
  title,
  description,
  photos, // Array de { label, file, onChange, error }
  isOptional,
  continueLabel,
  onComplete,
}) => {
  const isReady = (photo) =>
    photo.status === "saved" || photo.status === "selected";
  const uploadedCount = photos.filter(isReady).length;
  const totalPhotos = photos.length;
  const allDone = uploadedCount === totalPhotos;
  const showContinue = allDone || isOptional;
  const isUploading = photos.some((photo) => photo.status === "uploading");

  // 0 = grande, 1 = mediana, 2 = pequeña
  const imageStage = Math.min(uploadedCount, 2);

  // Modo grilla: lado a lado en cuanto la segunda zona aparece (primera foto cargada)
  const gridMode = isReady(photos[0]) && totalPhotos === 2;

  return (
    <div className="pus-container">
      <div className="pus-container-inner">
        {/* Imagen ilustrativa — se encoge progresivamente */}
        <div className={`pus-hero pus-hero--stage${imageStage}`}>
          <img src={image} alt="" className="pus-hero-img" />
        </div>

        {/* Encabezado */}
        <div
          className={`pus-header ${uploadedCount > 0 ? "pus-header--compact" : ""}`}
        >
          <h2 className="pus-title">{title}</h2>
          {uploadedCount === 0 && (
            <p className="pus-description">{description}</p>
          )}
          {isOptional && uploadedCount === 0 && (
            <span className="pus-optional-badge">Opcional</span>
          )}
        </div>

        {/* Zonas de carga */}
        <div className={`pus-zones ${gridMode ? "pus-zones--grid" : ""}`}>
          {/* Zona 1 — siempre visible */}
          <PhotoZone
            label={photos[0].label}
            file={photos[0].file}
            onSelect={photos[0].onSelect}
            onRetry={photos[0].onRetry}
            status={photos[0].status}
            error={photos[0].error}
            compact={gridMode}
          />

          {/* Zona 2 — aparece con animación después de cargar la primera */}
          {totalPhotos > 1 && isReady(photos[0]) && (
            <div className="pus-zone-appear">
              <PhotoZone
                label={photos[1].label}
                file={photos[1].file}
                onSelect={photos[1].onSelect}
                onRetry={photos[1].onRetry}
                status={photos[1].status}
                error={photos[1].error}
                compact={gridMode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Botón Siguiente — aparece con animación cuando todo está listo */}
      {showContinue && (
        <div className="pus-continue-appear">
          <button
            className="pus-continue-btn"
            onClick={onComplete}
            disabled={isUploading}
          >
            {isUploading
              ? "Guardando…"
              : continueLabel
                ? continueLabel
                : isOptional && uploadedCount === 0
                  ? "Omitir"
                  : "Siguiente"}
          </button>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Zona individual de carga / preview
───────────────────────────────────────────── */
/**
 * file ahora es un DataURL (string base64) en lugar de un File object.
 * Se convierte en handleFileChange al momento de seleccionar, lo que evita
 * que Android WebView invalide la referencia al archivo al desmontar el componente.
 */
const PhotoZone = ({
  label,
  file,
  onSelect,
  onRetry,
  status,
  error,
  compact,
}) => {
  const inputRef = useRef(null);
  const [captureError, setCaptureError] = useState("");
  const isNative = isNativeCameraAvailable();
  const isUploading = status === "uploading";
  const isSaved = status === "saved";
  const previewSource =
    typeof file === "string" &&
    (file.startsWith("data:") || file.startsWith("http"))
      ? file
      : null;

  const selectNative = async (source) => {
    setCaptureError("");
    try {
      const selected = source === "camera" ? await takePhoto() : await chooseFromGallery();
      if (selected) await onSelect(selected);
    } catch {
      setCaptureError("No pudimos abrir esa opción. Intenta de nuevo.");
    }
  };

  const handleWebFile = (event) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (selected) onSelect(selected);
  };

  return (
    <div
      className={`pus-zone
        ${isSaved ? "pus-zone--uploaded" : ""}
        ${error ? "pus-zone--error" : ""}
        ${compact ? "pus-zone--compact" : ""}
      `}
    >
      {!isNative && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleWebFile}
          className="pus-zone-input"
          disabled={isUploading}
        />
      )}

      {file ? (
        <div
          className="pus-zone-preview"
          onClick={() => !isNative && inputRef.current?.click()}
        >
          {previewSource && (
            <img src={previewSource} alt={label} className="pus-preview-img" />
          )}
          <div className="pus-preview-footer">
            <TickCircle size="18" color="#10B981" variant="Bold" />
            <span className="pus-preview-label">{label}</span>
            <span className="pus-upload-status">
              {isUploading
                ? "Subiendo…"
                : status === "error"
                  ? "Error"
                  : isSaved
                    ? "Guardado"
                    : "Listo"}
            </span>
          </div>
        </div>
      ) : (
        /* Zona vacía para cargar */
        <div className="pus-zone-empty">
          <div className="pus-zone-icon">
            <Camera size="28" color="#9CA3AF" />
          </div>
          <span className="pus-zone-text">{label}</span>
        </div>
      )}

      {isNative && !isUploading && (
        <div className="pus-source-actions">
          <button type="button" onClick={() => selectNative("camera")}>
            <Camera size="18" /> Tomar foto
          </button>
          <button type="button" onClick={() => selectNative("gallery")}>
            <Gallery size="18" /> Elegir de galería
          </button>
        </div>
      )}
      {status === "error" && (
        <button type="button" className="pus-retry-btn" onClick={onRetry}>
          Reintentar subida
        </button>
      )}
      {(error || captureError) && (
        <span className="pus-zone-error">{error || captureError}</span>
      )}
    </div>
  );
};

export default PhotoUploadStep;
