import { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonButton,
  IonContent,
  IonPage,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { DocumentText, Location, Map, Truck } from "iconsax-react";
import { authAPI, citiesAPI } from "../services/api";
import { Input } from "../components/Input/Input";
import PhotoUploadStep from "../components/PhotoUploadStep/PhotoUploadStep";
import { createDocumentFormData, normalizeImage } from "../utils/imageUpload";
import idCardImage from "../assets/img/id-card.png";
import selfieImage from "../assets/img/selfie.png";
import licenseImage from "../assets/img/license.png";
import soatImage from "../assets/img/soat.png";
import propertyImage from "../assets/img/id.png";
import securityImage from "../assets/img/Security.png";
import truckImage from "../assets/img/tow.png";
import "./CompleteRegistration.css";

const TOTAL_STEPS = 10;
const ALL_CAPABILITIES = ["MOTOS", "AUTOS", "CAMIONETAS", "CAMIONES", "BUSES"];
const CAPABILITY_LABELS = {
  MOTOS: "Motos",
  AUTOS: "Autos / Carros",
  CAMIONETAS: "Camionetas y SUVs",
  CAMIONES: "Camiones de carga",
  BUSES: "Buses y busetas",
};

const DOCUMENTS = {
  cedulaFront: { type: "cedula-front", path: ["documents", "cedula", "front"] },
  cedulaBack: { type: "cedula-back", path: ["documents", "cedula", "back"] },
  selfie: { type: "selfie", path: ["documents", "selfie"] },
  licenciaFront: {
    type: "licencia-front",
    path: ["documents", "licenciaTransito", "front"],
  },
  licenciaBack: {
    type: "licencia-back",
    path: ["documents", "licenciaTransito", "back"],
  },
  tarjetaFront: {
    type: "tarjeta-front",
    path: ["documents", "tarjetaPropiedad", "front"],
  },
  tarjetaBack: {
    type: "tarjeta-back",
    path: ["documents", "tarjetaPropiedad", "back"],
  },
  gruaPhoto: { type: "grua-photo", path: ["towTruck", "photoUrl"] },
  soat: { type: "soat", path: ["documents", "soat", "url"] },
  seguro: { type: "seguro", path: ["documents", "seguroTodoRiesgo", "url"] },
};

const emptyPhotos = () =>
  Object.fromEntries(
    Object.keys(DOCUMENTS).map((key) => [
      key,
      { file: null, status: "empty", error: "" },
    ]),
  );

const readPath = (object, path) =>
  path.reduce((value, key) => value?.[key], object);

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const CompleteRegistration = () => {
  const history = useHistory();
  const user = useMemo(getStoredUser, []);
  const userId = user?._id;
  const resumeKey = userId ? `driverRegistrationUploads:${userId}` : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [photos, setPhotos] = useState(emptyPhotos);
  const [useLegacyUpload, setUseLegacyUpload] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [vehicleCapabilities, setVehicleCapabilities] = useState(
    Object.fromEntries(ALL_CAPABILITIES.map((key) => [key, false])),
  );

  useEffect(() => {
    if (!userId) {
      history.replace("/login");
      return;
    }

    const fallbackCities = [
      "Bogotá",
      "Medellín",
      "Cali",
      "Barranquilla",
      "Cartagena",
      "Bucaramanga",
      "Pereira",
      "Santa Marta",
    ].map((name) => ({ name }));

    citiesAPI
      .getAll()
      .then((response) =>
        setCities(Array.isArray(response.data) ? response.data : fallbackCities),
      )
      .catch(() => setCities(fallbackCities));

    let cached = {};
    try {
      cached = JSON.parse(localStorage.getItem(resumeKey) || "{}");
    } catch {
      cached = {};
    }

    const reconcile = (profile) => {
      const cachedLocation = cached.location || {};
      setCity((current) => current || profile.city || cachedLocation.city || "");
      setAddress(
        (current) =>
          current || profile.address || cachedLocation.address || "",
      );
      if (Array.isArray(profile.vehicleCapabilities)) {
        setVehicleCapabilities((current) => {
          const next = { ...current };
          profile.vehicleCapabilities.forEach((capability) => {
            if (capability in next) next[capability] = true;
          });
          return next;
        });
      }
      setPhotos((current) => {
        const next = { ...current };
        Object.entries(DOCUMENTS).forEach(([key, config]) => {
          const remoteUrl = readPath(profile, config.path);
          const cachedUpload = cached[key];
          if (remoteUrl || cachedUpload?.saved) {
            next[key] = {
              file: remoteUrl || cachedUpload.url || true,
              status: "saved",
              error: "",
            };
          }
        });
        return next;
      });
    };

    authAPI
      .getMyProfile()
      .then((response) =>
        reconcile(response.data?.driver || response.data?.profile || response.data),
      )
      .catch(() => reconcile({}));
  }, [history, resumeKey, userId]);

  const persistResumeState = (patch) => {
    if (!resumeKey) return;
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(resumeKey) || "{}");
    } catch {
      stored = {};
    }
    localStorage.setItem(resumeKey, JSON.stringify({ ...stored, ...patch }));
  };

  useEffect(() => {
    if (!resumeKey || (!city && !address)) return;
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(resumeKey) || "{}");
    } catch {
      stored = {};
    }
    localStorage.setItem(
      resumeKey,
      JSON.stringify({ ...stored, location: { city, address } }),
    );
  }, [address, city, resumeKey]);

  const persistSuccessfulUpload = (key, url) => {
    persistResumeState({ [key]: { saved: true, ...(url ? { url } : {}) } });
  };

  const uploadPhoto = async (key, image) => {
    if (useLegacyUpload) {
      setPhotos((current) => ({
        ...current,
        [key]: { file: image, status: "selected", error: "" },
      }));
      return;
    }

    setPhotos((current) => ({
      ...current,
      [key]: { file: image, status: "uploading", error: "" },
    }));

    try {
      const response = await authAPI.uploadDriverDocument(
        createDocumentFormData(image, DOCUMENTS[key].type),
      );
      const url =
        response.data?.url ||
        response.data?.documentUrl ||
        response.data?.document?.url ||
        null;
      persistSuccessfulUpload(key, url);
      setPhotos((current) => ({
        ...current,
        [key]: { file: url || image, status: "saved", error: "" },
      }));
    } catch (error) {
      if ([404, 405, 501].includes(error.response?.status)) {
        setUseLegacyUpload(true);
        setPhotos((current) => ({
          ...current,
          [key]: { file: image, status: "selected", error: "" },
        }));
        return;
      }
      setPhotos((current) => ({
        ...current,
        [key]: {
          file: image,
          status: "error",
          error: "No se pudo guardar. Revisa tu conexión y reintenta.",
        },
      }));
    }
  };

  const selectPhoto = (key) => async (source) => {
    try {
      const normalized = await normalizeImage(source);
      await uploadPhoto(key, normalized);
    } catch {
      setPhotos((current) => ({
        ...current,
        [key]: {
          file: null,
          status: "error",
          error: "No pudimos procesar esta imagen.",
        },
      }));
    }
  };

  const retryPhoto = (key) => () => {
    if (photos[key].file) uploadPhoto(key, photos[key].file);
  };

  const photoConfig = (key, label) => ({
    label,
    file: photos[key].file,
    status: photos[key].status,
    error: photos[key].error || errors[key],
    onSelect: selectPhoto(key),
    onRetry: retryPhoto(key),
  });

  const validateStep = () => {
    const nextErrors = {};
    const ready = (key) =>
      photos[key].status === "saved" || photos[key].status === "selected";

    if (currentStep === 1) {
      if (!city) nextErrors.city = "Selecciona tu ciudad";
      if (!address.trim()) nextErrors.address = "Ingresa tu dirección";
    }
    if (currentStep === 3) {
      if (!ready("cedulaFront")) nextErrors.cedulaFront = "Guarda la foto frontal";
      if (!ready("cedulaBack")) nextErrors.cedulaBack = "Guarda la foto trasera";
    }
    if (currentStep === 4 && !ready("selfie")) nextErrors.selfie = "Guarda tu selfie";
    if (currentStep === 5) {
      if (!ready("licenciaFront")) nextErrors.licenciaFront = "Guarda la foto frontal";
      if (!ready("licenciaBack")) nextErrors.licenciaBack = "Guarda la foto trasera";
    }
    if (currentStep === 6) {
      if (!ready("tarjetaFront")) nextErrors.tarjetaFront = "Guarda la foto frontal";
      if (!ready("tarjetaBack")) nextErrors.tarjetaBack = "Guarda la foto trasera";
    }
    if (currentStep === 7 && !ready("gruaPhoto")) {
      nextErrors.gruaPhoto = "Guarda una foto de tu grúa";
    }
    if (
      currentStep === 8 &&
      !Object.values(vehicleCapabilities).some(Boolean)
    ) {
      nextErrors.capabilities = "Selecciona al menos una capacidad";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep === 1) {
      persistResumeState({ location: { city, address } });
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((step) => step + 1);
      setErrors({});
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
      setErrors({});
    } else {
      history.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep() || !userId) return;
    setIsLoading(true);
    setSubmitError("");

    try {
      await authAPI.registerDriverComplete({
        userId,
        entityType: "natural",
        city,
        address,
      });

      if (useLegacyUpload) {
        const documents = Object.entries(photos)
          .filter(([, photo]) => photo.status === "selected")
          .map(([key, photo]) => ({
            file: photo.file,
            documentType: DOCUMENTS[key].type,
          }));
        if (documents.length) {
          await authAPI.uploadDriverDocuments({ userId, documents });
        }
      }

      const capabilitiesResponse = await authAPI.setDriverCapabilities({
        userId,
        vehicleCapabilities: Object.keys(vehicleCapabilities).filter(
          (key) => vehicleCapabilities[key],
        ),
      });
      if (capabilitiesResponse.data?.status !== "pending_review") {
        const compatibilityError = new Error(
          "El servidor todavía requiere información adicional para enviar el perfil a revisión.",
        );
        compatibilityError.code = "REGISTRATION_NOT_READY";
        throw compatibilityError;
      }
      if (resumeKey) localStorage.removeItem(resumeKey);
      history.replace("/under-review");
    } catch (error) {
      console.error("Error finalizando el registro:", error);
      setSubmitError(
        error.code === "REGISTRATION_NOT_READY"
          ? "El servidor aún no admite el registro sin SOAT. Intenta nuevamente cuando el backend esté actualizado o agrega el SOAT para continuar."
          : "No pudimos finalizar el registro. Tus fotos guardadas no se repetirán; intenta de nuevo.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderPhotoStep = (props) => (
    <PhotoUploadStep
      {...props}
      continueLabel={currentStep === TOTAL_STEPS ? "Finalizar" : undefined}
      onComplete={handleNext}
    />
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="step-icon">
              <Location size="48" color="#0055FF" variant="Bulk" />
            </div>
            <div className="step-title-container">
              <h2 className="step-title">Ubicación</h2>
              <p className="step-description">¿Desde dónde operas tu grúa?</p>
            </div>
            <div className="modern-input-wrapper">
              <div className={`modern-input-group ${errors.city ? "has-error" : ""}`}>
                <div className="modern-input-icon">
                  <Location size="24" color={errors.city ? "#EF4444" : "#9CA3AF"} />
                </div>
                <IonSelect
                  value={city}
                  placeholder="Selecciona tu ciudad"
                  onIonChange={(event) => setCity(event.detail.value)}
                  interface="action-sheet"
                  className="modern-select-field"
                >
                  {cities.map((item, index) => (
                    <IonSelectOption key={`${item.name}-${index}`} value={item.name}>
                      {item.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </div>
              {errors.city && <span className="modern-input-error">{errors.city}</span>}
            </div>
            <Input
              type="text"
              placeholder="Dirección completa"
              value={address}
              onChange={setAddress}
              error={errors.address}
              icon={<Map size="24" color={errors.address ? "#EF4444" : "#9CA3AF"} />}
            />
          </div>
        );
      case 2:
        return (
          <div className="step-content docs-intro">
            <div className="step-icon">
              <DocumentText size="48" color="#0055FF" variant="Bulk" />
            </div>
            <div className="step-title-container">
              <h2 className="step-title">Ten estos documentos listos</h2>
              <p className="step-description">
                Guardaremos cada foto al seleccionarla para que puedas continuar después.
              </p>
            </div>
            <div className="docs-intro-list">
              {[
                ["🪪", "Cédula de ciudadanía", "Frente y reverso"],
                ["🤳", "Selfie tuya", "1 foto"],
                ["📋", "Licencia de tránsito", "Frente y reverso"],
                ["📄", "Tarjeta de propiedad", "Frente y reverso"],
                ["🚛", "Foto de tu grúa", "1 foto"],
                ["🛡️", "SOAT", "Opcional · al final"],
                ["🔒", "Seguro todo riesgo", "Opcional · al final"],
              ].map(([emoji, label, detail]) => (
                <div key={label} className="docs-intro-item">
                  <span className="docs-intro-emoji">{emoji}</span>
                  <div className="docs-intro-info">
                    <span className="docs-intro-label">{label}</span>
                    <span className="docs-intro-detail">{detail}</span>
                  </div>
                  <span className="docs-intro-check">✓</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return renderPhotoStep({
          image: idCardImage,
          title: "Fotos de tu cédula",
          description: "Toma una foto por delante y otra por detrás",
          photos: [
            photoConfig("cedulaFront", "Foto de frente"),
            photoConfig("cedulaBack", "Foto por detrás"),
          ],
        });
      case 4:
        return renderPhotoStep({
          image: selfieImage,
          title: "Una selfie 😉",
          description: "Tómate una foto clara que verán tus clientes",
          photos: [photoConfig("selfie", "Selfie tuya")],
        });
      case 5:
        return renderPhotoStep({
          image: licenseImage,
          title: "Licencia de tránsito",
          description: "Toma una foto por delante y otra por detrás",
          photos: [
            photoConfig("licenciaFront", "Foto de frente"),
            photoConfig("licenciaBack", "Foto por detrás"),
          ],
        });
      case 6:
        return renderPhotoStep({
          image: propertyImage,
          title: "Tarjeta de propiedad",
          description: "Toma una foto por delante y otra por detrás",
          photos: [
            photoConfig("tarjetaFront", "Foto de frente"),
            photoConfig("tarjetaBack", "Foto por detrás"),
          ],
        });
      case 7:
        return renderPhotoStep({
          image: truckImage,
          title: "Foto de tu grúa",
          description: "Sube una foto clara de tu grúa completa",
          photos: [photoConfig("gruaPhoto", "Foto de la grúa")],
        });
      case 8:
        return (
          <div className="step-content">
            <div className="step-icon">
              <Truck size="48" color="#0055FF" variant="Bulk" />
            </div>
            <h2 className="step-title">¿Qué puedes llevar?</h2>
            <p className="step-description">
              Selecciona todos los tipos de vehículos que puedes transportar.
            </p>
            <div className="capabilities-grid">
              {ALL_CAPABILITIES.map((key) => (
                <button
                  type="button"
                  key={key}
                  className={`capability-option ${vehicleCapabilities[key] ? "selected" : ""}`}
                  onClick={() =>
                    setVehicleCapabilities((current) => ({
                      ...current,
                      [key]: !current[key],
                    }))
                  }
                >
                  <div className="capability-checkbox">
                    {vehicleCapabilities[key] && "✓"}
                  </div>
                  <span className="capability-label">{CAPABILITY_LABELS[key]}</span>
                </button>
              ))}
            </div>
            {errors.capabilities && (
              <IonText color="danger" className="step-error">
                <small>{errors.capabilities}</small>
              </IonText>
            )}
          </div>
        );
      case 9:
        return renderPhotoStep({
          image: soatImage,
          title: "Seguro SOAT",
          description: "Puedes agregarlo ahora o continuar sin este documento",
          photos: [photoConfig("soat", "Foto del SOAT")],
          isOptional: true,
        });
      case 10:
        return renderPhotoStep({
          image: securityImage,
          title: "Seguro todo riesgo",
          description: "Puedes agregarlo ahora o finalizar sin este documento",
          photos: [photoConfig("seguro", "Foto del seguro")],
          isOptional: true,
        });
      default:
        return null;
    }
  };

  const isPhotoStep = currentStep >= 3 && currentStep <= 7;
  const isOptionalPhotoStep = currentStep >= 9;

  return (
    <IonPage>
      <IonContent className="complete-registration-content">
        <IonProgressBar
          value={currentStep / TOTAL_STEPS}
          className="registration-progress"
        />
        <div className="complete-registration-container">
          <div className="step-indicator">
            Paso {currentStep} de {TOTAL_STEPS}
          </div>
          {renderStep()}
          {submitError && (
            <div className="submit-error-box">
              <p className="submit-error-text">{submitError}</p>
              <IonButton expand="block" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? <IonSpinner name="crescent" /> : "Reintentar"}
              </IonButton>
            </div>
          )}
          {!isPhotoStep && !isOptionalPhotoStep && (
            <div className="navigation-buttons">
              <IonButton
                fill="outline"
                className="nav-button back-button"
                onClick={handleBack}
                disabled={isLoading}
              >
                {currentStep === 1 ? "Cancelar" : "Atrás"}
              </IonButton>
              <IonButton
                className="nav-button next-button"
                onClick={handleNext}
                disabled={isLoading}
              >
                {currentStep === 2 ? "¡Los tengo listos!" : "Siguiente"}
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CompleteRegistration;
