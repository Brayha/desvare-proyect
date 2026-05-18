import React, { useRef } from "react";
import { Camera, TickCircle } from "iconsax-react";
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
  onComplete,
}) => {
  const uploadedCount = photos.filter((p) => p.file != null).length;
  const totalPhotos = photos.length;
  const allDone = uploadedCount === totalPhotos;
  const showContinue = allDone || isOptional;

  // 0 = grande, 1 = mediana, 2 = pequeña
  const imageStage = Math.min(uploadedCount, 2);

  // Modo grilla: lado a lado en cuanto la segunda zona aparece (primera foto cargada)
  const gridMode = photos[0].file != null && totalPhotos === 2;

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
            onChange={photos[0].onChange}
            error={photos[0].error}
            compact={gridMode}
          />

          {/* Zona 2 — aparece con animación después de cargar la primera */}
          {totalPhotos > 1 && photos[0].file && (
            <div className="pus-zone-appear">
              <PhotoZone
                label={photos[1].label}
                file={photos[1].file}
                onChange={photos[1].onChange}
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
          <button className="pus-continue-btn" onClick={onComplete}>
            {isOptional && uploadedCount === 0 ? "Omitir" : "Siguiente"}
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
const PhotoZone = ({ label, file, onChange, error, compact }) => {
  const inputRef = useRef(null);

  return (
    <div
      className={`pus-zone
        ${file ? "pus-zone--uploaded" : ""}
        ${error ? "pus-zone--error" : ""}
        ${compact ? "pus-zone--compact" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="pus-zone-input"
      />

      {file ? (
        /* Preview usando el DataURL directamente como src */
        <div
          className="pus-zone-preview"
          onClick={() => inputRef.current?.click()}
        >
          <img src={file} alt={label} className="pus-preview-img" />
          <div className="pus-preview-footer">
            <TickCircle size="18" color="#10B981" variant="Bold" />
            <span className="pus-preview-label">{label}</span>
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

      {error && <span className="pus-zone-error">{error}</span>}
    </div>
  );
};

export default PhotoUploadStep;
