import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
  IonProgressBar,
  IonText,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
} from "@ionic/react";
import {
  Profile,
  Location,
  Building,
  DocumentText,
  Camera,
  Truck,
  Map,
} from "iconsax-react";
import { authAPI, citiesAPI, vehicleAPI } from "../services/api";
import { Input } from "../components/Input/Input";
import TruckTypeSelector from "../components/TruckTypeSelector";
import TruckBrandSelector from "../components/TruckBrandSelector";
import TruckModelSelector from "../components/TruckModelSelector";
import TruckPlateInput from "../components/TruckPlateInput";
import PhotoUploadStep from "../components/PhotoUploadStep/PhotoUploadStep";
import idCardImage from "../assets/img/id-card.png";
import selfieImage from "../assets/img/selfie.png";
import licenseImage from "../assets/img/license.png";
import soatImage from "../assets/img/soat.png";
import propertyImage from "../assets/img/id.png";
import securityImage from "../assets/img/Security.png";
import truckImage from "../assets/img/tow.png";
import "./CompleteRegistration.css";

/**
 * Flujo de Registro Completo para Conductores (13 pasos - Separados para mejor UX)
 *
 * Paso 1: Ubicación (ciudad, dirección)
 * Paso 2: Cédula (Frente y Atrás) 🆕 Separado
 * Paso 3: Selfie 🆕 Separado
 * Paso 4: Licencia de Tránsito (Frente y Atrás) 🆕 Separado
 * Paso 5: SOAT 🆕 Separado
 * Paso 6: Tarjeta de Propiedad (Frente y Atrás) 🆕 Separado
 * Paso 7: Seguro Todo Riesgo (Opcional) 🆕 Separado
 * Paso 8: Foto de la Grúa 🆕 Separado
 * Paso 9: Tipo de grúa (Liviana / Pesada)
 * Paso 10: Marca del vehículo base
 * Paso 11: Modelo del vehículo base
 * Paso 12: Placa de la grúa
 * Paso 13: Capacidades del vehículo (qué puede llevar)
 *
 * Nota: Se eliminó la selección de tipo de entidad (Natural/Jurídica) para simplificar el MVP.
 * Por defecto todos los conductores se registran como Persona Natural.
 */

// Capacidades permitidas por tipo de grúa (según canPickup del catálogo)
const CAPABILITIES_BY_TRUCK_TYPE = {
  GRUA_MOTO:    ['MOTOS'],
  GRUA_LIVIANA: ['AUTOS', 'CAMIONETAS'],
  GRUA_PESADA:  ['AUTOS', 'CAMIONETAS', 'CAMIONES', 'BUSES'],
};

const CAPABILITY_LABELS = {
  MOTOS:     'Motos',
  AUTOS:     'Autos / Carros',
  CAMIONETAS:'Camionetas y SUVs',
  CAMIONES:  'Camiones de carga',
  BUSES:     'Buses y busetas',
};

const CompleteRegistration = () => {
  const history = useHistory();

  // Estados del flujo
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState([]);

  // Por defecto siempre Persona Natural (simplificado para MVP)
  const entityType = "natural";

  // Paso 1: Ubicación
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  // Paso 2: Documentos del conductor
  const [cedulaFront, setCedulaFront] = useState(null);
  const [cedulaBack, setCedulaBack] = useState(null);
  const [selfie, setSelfie] = useState(null);

  // Paso 3: Documentos y fotos de la grúa
  const [licenciaTransitoFront, setLicenciaTransitoFront] = useState(null);
  const [licenciaTransitoBack, setLicenciaTransitoBack] = useState(null);
  const [soat, setSoat] = useState(null);
  const [tarjetaPropiedadFront, setTarjetaPropiedadFront] = useState(null);
  const [tarjetaPropiedadBack, setTarjetaPropiedadBack] = useState(null);
  const [seguroTodoRiesgo, setSeguroTodoRiesgo] = useState(null);
  const [towTruckPhoto, setTowTruckPhoto] = useState(null);

  // Paso 4: Tipo de grúa
  const [truckType, setTruckType] = useState(""); // 'GRUA_LIVIANA' | 'GRUA_PESADA'

  // Paso 5: Marca del vehículo base
  const [truckBrand, setTruckBrand] = useState(null); // { id, name }
  const [customBrand, setCustomBrand] = useState(""); // Para marca "Otro"
  const [truckBrands, setTruckBrands] = useState([]);

  // Paso 6: Modelo del vehículo base
  const [truckModel, setTruckModel] = useState(null); // { id, name }
  const [customModel, setCustomModel] = useState(""); // Para modelo "Otro"
  const [truckModels, setTruckModels] = useState([]);

  // Paso 7: Placa de la grúa
  const [truckPlate, setTruckPlate] = useState("");

  // Paso 8: Capacidades del vehículo
  const [vehicleCapabilities, setVehicleCapabilities] = useState({
    MOTOS: false,
    AUTOS: false,
    CAMIONETAS: false,
    CAMIONES: false,
    BUSES: false,
  });

  // Control para saber si los documentos ya se subieron exitosamente
  const [documentsUploaded, setDocumentsUploaded] = useState(false);

  // Estados de error
  const [errors, setErrors] = useState({});
  // Estado de reintento de documentos (si Paso A pasó pero B falló)
  const [uploadFailed, setUploadFailed] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Función para cargar ciudades fallback
  const setFallbackCities = () => {
    // Fallback: ciudades por defecto si falla la API
    const fallbackCities = [
      { name: "Bogotá" },
      { name: "Medellín" },
      { name: "Cali" },
      { name: "Barranquilla" },
      { name: "Cartagena" },
      { name: "Bucaramanga" },
      { name: "Pereira" },
      { name: "Santa Marta" },
    ];
    console.log("✅ Usando ciudades fallback:", fallbackCities.length);
    setCities(fallbackCities);
  };

  // Función para cargar marcas de grúas según el tipo
  const loadTruckBrands = async (type) => {
    try {
      setIsLoading(true);
      setErrors({});
      console.log("🔄 Cargando marcas para:", type);
      const response = await vehicleAPI.getBrands(type);
      const brandsData = response.data?.data || [];
      setTruckBrands(brandsData);
      console.log(`✅ ${brandsData.length} marcas cargadas para ${type}`);
    } catch (error) {
      console.error("❌ Error cargando marcas de grúas:", error);
      setTruckBrands([]);
      setErrors({ truckBrand: "Error al cargar las marcas. Vuelve al paso anterior y selecciona el tipo de grúa de nuevo." });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cargar modelos de grúas según la marca
  const loadTruckModels = async (brandId, type) => {
    try {
      setIsLoading(true);
      setErrors({});
      console.log("🔄 Cargando modelos para marca:", brandId);
      const response = await vehicleAPI.getModels(brandId, type);
      const modelsData = response.data?.data || [];
      setTruckModels(modelsData);
      console.log(`✅ ${modelsData.length} modelos cargados`);
    } catch (error) {
      console.error("❌ Error cargando modelos de grúas:", error);
      setTruckModels([]);
      setErrors({ truckModel: "Error al cargar los modelos. Vuelve al paso anterior y selecciona la marca de nuevo." });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar ciudades al montar el componente
  useEffect(() => {
    const loadCities = async () => {
      try {
        console.log("🔄 Cargando ciudades...");
        const response = await citiesAPI.getAll();
        console.log("✅ Respuesta ciudades:", response);

        // Verificar que response.data sea un array
        if (response && response.data && Array.isArray(response.data)) {
          console.log(
            "✅ Ciudades cargadas:",
            response.data.length,
            "ciudades"
          );
          setCities(response.data);
        } else {
          console.warn("⚠️ Respuesta no es un array, usando fallback");
          setFallbackCities();
        }
      } catch (error) {
        console.error("❌ Error cargando ciudades:", error);
        setFallbackCities();
      }
    };

    loadCities();
  }, []);

  // Cargar marcas cuando se seleccione el tipo de grúa y limpiar selecciones dependientes
  useEffect(() => {
    if (truckType) {
      console.log("🚚 Tipo de grúa seleccionado:", truckType);
      loadTruckBrands(truckType);
      // Reset completo al cambiar tipo (incluyendo lista de modelos)
      setTruckBrand(null);
      setTruckModel(null);
      setTruckModels([]);
      setCustomBrand("");
      setCustomModel("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truckType]);

  // Cargar modelos cuando se seleccione la marca
  useEffect(() => {
    if (truckBrand && truckBrand.id !== "OTHER" && truckType) {
      console.log("🚚 Marca seleccionada:", truckBrand.name);
      loadTruckModels(truckBrand.id, truckType);
      // Reset modelo al cambiar marca
      setTruckModel(null);
      setCustomModel("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truckBrand, truckType]);

  const totalSteps = 14; // Paso 2 = pantalla introductoria de documentos + 13 pasos originales
  const progress = currentStep / totalSteps;

  const validateStep = () => {
    const newErrors = {};

    switch (currentStep) {
      // Paso 1: Ciudad y dirección
      case 1:
        if (!city) newErrors.city = "Selecciona tu ciudad";
        if (!address) newErrors.address = "Ingresa tu dirección";
        break;

      // Paso 2: Intro documentos — sin validación, solo lectura
      case 2:
        break;

      // Paso 3: Cédula (Frente y Atrás)
      case 3:
        if (!cedulaFront)
          newErrors.cedulaFront = "Sube la foto frontal de tu cédula";
        if (!cedulaBack)
          newErrors.cedulaBack = "Sube la foto trasera de tu cédula";
        break;

      // Paso 4: Selfie
      case 4:
        if (!selfie) newErrors.selfie = "Sube una selfie tuya";
        break;

      // Paso 5: Licencia de Tránsito (Frente y Atrás)
      case 5:
        if (!licenciaTransitoFront)
          newErrors.licenciaTransitoFront =
            "Sube la licencia de tránsito (frente)";
        if (!licenciaTransitoBack)
          newErrors.licenciaTransitoBack =
            "Sube la licencia de tránsito (atrás)";
        break;

      // Paso 6: SOAT
      case 6:
        if (!soat) newErrors.soat = "Sube el SOAT";
        break;

      // Paso 7: Tarjeta de Propiedad (Frente y Atrás)
      case 7:
        if (!tarjetaPropiedadFront)
          newErrors.tarjetaPropiedadFront =
            "Sube la tarjeta de propiedad (frente)";
        if (!tarjetaPropiedadBack)
          newErrors.tarjetaPropiedadBack =
            "Sube la tarjeta de propiedad (atrás)";
        break;

      // Paso 8: Seguro Todo Riesgo (Opcional)
      case 8:
        break;

      // Paso 9: Foto de la Grúa
      case 9:
        if (!towTruckPhoto)
          newErrors.towTruckPhoto = "Sube una foto de tu grúa";
        break;

      // Paso 10: Tipo de grúa
      case 10:
        if (!truckType) {
          newErrors.truckType = "Selecciona el tipo de grúa";
        }
        break;

      // Paso 11: Marca del vehículo
      case 11:
        if (!truckBrand) {
          newErrors.truckBrand = "Selecciona la marca del vehículo";
        } else if (truckBrand.id === "OTHER" && !customBrand.trim()) {
          newErrors.customBrand = "Escribe la marca de tu vehículo";
        }
        break;

      // Paso 12: Modelo del vehículo
      case 12:
        if (!truckModel) {
          newErrors.truckModel = "Selecciona el modelo del vehículo";
        } else if (truckModel.id === "OTHER" && !customModel.trim()) {
          newErrors.customModel = "Escribe el modelo de tu vehículo";
        }
        break;

      // Paso 13: Placa de la grúa
      case 13: {
        if (!truckPlate || truckPlate.length < 6) {
          newErrors.truckPlate = "Ingresa una placa válida (6 caracteres)";
        }
        const plateRegex = /^[A-Z]{3}[0-9]{3}$|^[A-Z]{3}[0-9]{2}[A-Z]$/;
        if (truckPlate && !plateRegex.test(truckPlate)) {
          newErrors.truckPlate = "Formato inválido. Usa ABC123 o ABC12D";
        }
        break;
      }

      // Paso 14: Capacidades
      case 14: {
        const hasCapability = Object.values(vehicleCapabilities).some((v) => v);
        if (!hasCapability) {
          newErrors.capabilities =
            "Selecciona al menos un tipo de vehículo que puedas llevar";
        }
        break;
      }

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    } else {
      handleSubmit();
    }
  };

  // Avance automático al seleccionar un ítem del catálogo (marca o modelo)
  const handleAutoAdvance = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    } else {
      history.goBack();
    }
  };

  const handleSubmit = async () => {
    console.log("📝 Enviando registro completo...");
    setIsLoading(true);
    setSubmitError('');
    setUploadFailed(false);

    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        history.replace("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user._id;

      console.log("👤 Usuario ID:", userId);

      // Paso A: Datos básicos + grúa
      const towTruckData = {
        truckType,
        licensePlate: truckPlate,
      };

      if (truckBrand && truckBrand.id !== "OTHER") {
        towTruckData.baseBrandId = truckBrand.id;
        towTruckData.baseBrand = truckBrand.name;
      }
      if (truckModel && truckModel.id !== "OTHER") {
        towTruckData.baseModelId = truckModel.id;
        towTruckData.baseModel = truckModel.name;
      }
      if (truckBrand?.id === "OTHER" && customBrand) {
        towTruckData.customBrand = customBrand;
      }
      if (truckModel?.id === "OTHER" && customModel) {
        towTruckData.customModel = customModel;
      }

      await authAPI.registerDriverComplete({
        userId,
        entityType,
        city,
        address,
        towTruck: towTruckData,
      });

      console.log("✅ Datos básicos guardados");

      // Paso B: Subir documentos (convertir a base64)
      await uploadDocuments(userId);

    } catch (error) {
      console.error("❌ Error en registro (Paso A):", error);
      setSubmitError("Error al guardar tus datos. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocuments = async (userId) => {
    console.log("📤 Preparando documentos para subir...");

    const documents = [];
    const fileMap = [
      { file: cedulaFront, type: "cedula-front" },
      { file: cedulaBack, type: "cedula-back" },
      { file: selfie, type: "selfie" },
      { file: licenciaTransitoFront, type: "licencia-front" },
      { file: licenciaTransitoBack, type: "licencia-back" },
      { file: soat, type: "soat" },
      { file: tarjetaPropiedadFront, type: "tarjeta-front" },
      { file: tarjetaPropiedadBack, type: "tarjeta-back" },
      { file: seguroTodoRiesgo, type: "seguro" },
      { file: towTruckPhoto, type: "grua-photo" },
    ];

    for (const { file, type } of fileMap) {
      if (file) {
        const base64 = await fileToBase64(file);
        documents.push({ file: base64, documentType: type });
      }
    }

    console.log(`📎 Subiendo ${documents.length} documentos...`);

    try {
      await authAPI.uploadDriverDocuments({ userId, documents });
      console.log("✅ Documentos subidos");
      setDocumentsUploaded(true);
    } catch (uploadError) {
      console.error("❌ Error subiendo documentos:", uploadError);
      // Los datos básicos ya se guardaron (Paso A fue exitoso).
      // Permitir reintento sin repetir el Paso A.
      setUploadFailed(true);
      setSubmitError(
        "Tus datos se guardaron pero hubo un problema al subir las fotos. " +
        "Por favor intenta subirlas de nuevo."
      );
      setIsLoading(false);
      return;
    }

    // Paso C: Capacidades
    const selectedCapabilities = Object.keys(vehicleCapabilities).filter(
      (key) => vehicleCapabilities[key]
    );

    try {
      await authAPI.setDriverCapabilities({
        userId,
        vehicleCapabilities: selectedCapabilities,
      });
      console.log("✅ Capacidades guardadas");
    } catch (capError) {
      console.error("❌ Error guardando capacidades:", capError);
      setSubmitError(
        "Tus fotos se subieron correctamente pero hubo un error al guardar las capacidades. " +
        "Por favor intenta de nuevo."
      );
      setUploadFailed(true);
      setIsLoading(false);
      return;
    }

    history.replace("/under-review");
  };

  const handleRetryUpload = async () => {
    setIsLoading(true);
    setSubmitError('');
    setUploadFailed(false);
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setIsLoading(false);
      history.replace("/login");
      return;
    }
    const userId = JSON.parse(userStr)._id;

    if (documentsUploaded) {
      // Las fotos ya subieron — solo reintenta las capacidades
      const selectedCapabilities = Object.keys(vehicleCapabilities).filter(
        (key) => vehicleCapabilities[key]
      );
      try {
        await authAPI.setDriverCapabilities({ userId, vehicleCapabilities: selectedCapabilities });
        history.replace("/under-review");
      } catch (capError) {
        console.error("❌ Error guardando capacidades (reintento):", capError);
        setSubmitError(
          "Sigue habiendo un problema al guardar las capacidades. Verifica tu conexión e intenta de nuevo."
        );
        setUploadFailed(true);
      }
      setIsLoading(false);
      return;
    }

    // Fotos aún no subidas — proceso completo
    await uploadDocuments(userId);
    setIsLoading(false);
  };

  const handleFileChange = (setter) => async (e) => {
    const file = e.target.files[0];
    if (file) {
      setter(file);
    }
  };

  // Función para convertir archivo a base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      // Paso 1: Ciudad y dirección (antes era paso 3)
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

            {/* IonSelect con estilo moderno */}
            <div className="modern-input-wrapper">
              <div
                className={`modern-input-group ${
                  errors.city ? "has-error" : ""
                }`}
              >
                <div className="modern-input-icon">
                  <Location
                    size="24"
                    color={errors.city ? "#EF4444" : "#9CA3AF"}
                  />
                </div>
                <IonSelect
                  value={city}
                  placeholder="Selecciona tu ciudad"
                  onIonChange={(e) => setCity(e.detail.value)}
                  interface="action-sheet"
                  className="modern-select-field"
                >
                  {Array.isArray(cities) && cities.length > 0 ? (
                    cities.map((c, index) => (
                      <IonSelectOption
                        mode="ios"
                        key={`${c.name}-${index}`}
                        value={c.name}
                      >
                        {c.name}
                      </IonSelectOption>
                    ))
                  ) : (
                    <IonSelectOption value="" disabled>
                      Cargando ciudades...
                    </IonSelectOption>
                  )}
                </IonSelect>
              </div>
              {errors.city && (
                <span className="modern-input-error">{errors.city}</span>
              )}
            </div>

            <Input
              type="text"
              placeholder="Dirección completa"
              value={address}
              onChange={setAddress}
              error={errors.address}
              icon={
                <Map size="24" color={errors.address ? "#EF4444" : "#9CA3AF"} />
              }
            />
          </div>
        );

      // Paso 2: Intro — lista de documentos que se van a pedir
      case 2:
        return (
          <div className="step-content docs-intro">
            <div className="step-icon">
              <DocumentText size="48" color="#0055FF" variant="Bulk" />
            </div>
            <div className="step-title-container">
              <h2 className="step-title">Ten estos documentos listos</h2>
              <p className="step-description">
                A continuación te pediremos fotos de los siguientes documentos. Tenlos a la mano o en tu galería.
              </p>
            </div>
            <div className="docs-intro-list">
              {[
                { emoji: '🪪', label: 'Cédula de ciudadanía', detail: 'Frente y reverso' },
                { emoji: '🤳', label: 'Selfie tuya',           detail: '1 foto' },
                { emoji: '📋', label: 'Licencia de tránsito', detail: 'Frente y reverso' },
                { emoji: '🛡️', label: 'SOAT vigente',          detail: '1 foto' },
                { emoji: '📄', label: 'Tarjeta de propiedad', detail: 'Frente y reverso' },
                { emoji: '🔒', label: 'Seguro todo riesgo',   detail: '1 foto · Opcional' },
                { emoji: '🚛', label: 'Foto de tu grúa',      detail: '1 foto' },
              ].map((doc, i) => (
                <div key={i} className="docs-intro-item">
                  <span className="docs-intro-emoji">{doc.emoji}</span>
                  <div className="docs-intro-info">
                    <span className="docs-intro-label">{doc.label}</span>
                    <span className="docs-intro-detail">{doc.detail}</span>
                  </div>
                  <span className="docs-intro-check">✓</span>
                </div>
              ))}
            </div>
          </div>
        );

      // Paso 3: Cédula (Frente y Atrás)
      case 3:
        return (
          <PhotoUploadStep
            image={idCardImage}
            title="Fotos de tu cédula"
            description="Toma foto a tu cédula por delante y por detrás"
            photos={[
              { label: 'Foto de frente', file: cedulaFront, onChange: handleFileChange(setCedulaFront), error: errors.cedulaFront },
              { label: 'Foto por detrás', file: cedulaBack,  onChange: handleFileChange(setCedulaBack),  error: errors.cedulaBack  },
            ]}
            onComplete={handleAutoAdvance}
          />
        );

      // Paso 4: Selfie
      case 4:
        return (
          <PhotoUploadStep
            image={selfieImage}
            title="Una selfie 😉"
            description="Tómate una buena foto que verán tus clientes"
            photos={[
              { label: 'Selfie tuya', file: selfie, onChange: handleFileChange(setSelfie), error: errors.selfie },
            ]}
            onComplete={handleAutoAdvance}
          />
        );

      // Paso 5: Licencia de Tránsito (Frente y Atrás)
      case 5:
        return (
          <PhotoUploadStep
            image={licenseImage}
            title="Licencia de tránsito"
            description="Toma foto a tu licencia de tránsito por delante y por detrás"
            photos={[
              { label: 'Foto de frente', file: licenciaTransitoFront, onChange: handleFileChange(setLicenciaTransitoFront), error: errors.licenciaTransitoFront },
              { label: 'Foto por detrás', file: licenciaTransitoBack,  onChange: handleFileChange(setLicenciaTransitoBack),  error: errors.licenciaTransitoBack  },
            ]}
            onComplete={handleAutoAdvance}
          />
        );

      // Paso 6: SOAT
      case 6:
        return (
          <PhotoUploadStep
            image={soatImage}
            title="Seguro SOAT"
            description="Necesitamos ver que estás al día con el SOAT"
            photos={[
              { label: 'Foto del SOAT', file: soat, onChange: handleFileChange(setSoat), error: errors.soat },
            ]}
            onComplete={handleAutoAdvance}
          />
        );

      // Paso 7: Tarjeta de Propiedad (Frente y Atrás)
      case 7:
        return (
          <PhotoUploadStep
            image={propertyImage}
            title="Tarjeta de propiedad"
            description="Necesitamos saber de quién es la grúa"
            photos={[
              { label: 'Foto de frente', file: tarjetaPropiedadFront, onChange: handleFileChange(setTarjetaPropiedadFront), error: errors.tarjetaPropiedadFront },
              { label: 'Foto por detrás', file: tarjetaPropiedadBack,  onChange: handleFileChange(setTarjetaPropiedadBack),  error: errors.tarjetaPropiedadBack  },
            ]}
            onComplete={handleAutoAdvance}
          />
        );

      // Paso 8: Seguro Todo Riesgo (Opcional)
      case 8:
        return (
          <PhotoUploadStep
            image={securityImage}
            title="Seguro todo riesgo"
            description="Ayuda a clientes con vehículos en patios de movilidad"
            photos={[
              { label: 'Foto del seguro', file: seguroTodoRiesgo, onChange: handleFileChange(setSeguroTodoRiesgo), error: errors.seguroTodoRiesgo },
            ]}
            isOptional
            onComplete={handleAutoAdvance}
          />
        );

      // Paso 9: Foto de la Grúa
      case 9:
        return (
          <PhotoUploadStep
            image={truckImage}
            title="Foto de tu grúa"
            description="Sube una foto clara de tu grúa completa"
            photos={[
              { label: 'Foto de la grúa', file: towTruckPhoto, onChange: handleFileChange(setTowTruckPhoto), error: errors.towTruckPhoto },
            ]}
            onComplete={handleAutoAdvance}
          />
        );

      // Paso 10: Tipo de grúa
      case 10:
        return (
          <TruckTypeSelector
            selectedType={truckType}
            onSelect={setTruckType}
            error={errors.truckType}
          />
        );

      // Paso 11: Marca del vehículo base
      case 11:
        return (
          <TruckBrandSelector
            brands={truckBrands}
            selectedBrand={truckBrand}
            customBrand={customBrand}
            onSelect={setTruckBrand}
            onCustomBrandChange={setCustomBrand}
            onAutoAdvance={handleAutoAdvance}
            isLoading={isLoading}
            error={errors.truckBrand || errors.customBrand}
          />
        );

      // Paso 12: Modelo del vehículo base
      case 12:
        return (
          <TruckModelSelector
            models={truckModels}
            selectedModel={truckModel}
            customModel={customModel}
            brandName={
              truckBrand?.id === "OTHER" ? customBrand : truckBrand?.name
            }
            onSelect={setTruckModel}
            onCustomModelChange={setCustomModel}
            onAutoAdvance={handleAutoAdvance}
            isLoading={isLoading}
            error={errors.truckModel || errors.customModel}
          />
        );

      // Paso 13: Placa de la grúa
      case 13:
        return (
          <TruckPlateInput
            plate={truckPlate}
            onPlateChange={setTruckPlate}
            plateError={errors.truckPlate}
          />
        );

      // Paso 14: Capacidades
      case 14: {
        const allowedCapabilities = CAPABILITIES_BY_TRUCK_TYPE[truckType] || Object.keys(vehicleCapabilities);
        return (
          <div className="step-content">
            <div className="step-icon">
              <Truck size="48" color="#0055FF" variant="Bulk" />
            </div>
            <h2 className="step-title">¿Qué puedes llevar?</h2>
            <p className="step-description">
              Selecciona los tipos de vehículos que tu grúa puede transportar.
            </p>

            <div className="capabilities-grid">
              {allowedCapabilities.map((key) => (
                <button
                  key={key}
                  className={`capability-option ${
                    vehicleCapabilities[key] ? "selected" : ""
                  }`}
                  onClick={() =>
                    setVehicleCapabilities({
                      ...vehicleCapabilities,
                      [key]: !vehicleCapabilities[key],
                    })
                  }
                >
                  <div className="capability-checkbox">
                    {vehicleCapabilities[key] && "✓"}
                  </div>
                  <span className="capability-label">
                    {CAPABILITY_LABELS[key] || key}
                  </span>
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
      }

      default:
        return null;
    }
  };

  return (
    <IonPage>
      <IonContent className="complete-registration-content">
        {/* Progress Bar */}
        <IonProgressBar value={progress} className="registration-progress" />

        <div className="complete-registration-container">
          {/* Step Indicator */}
          <div className="step-indicator">
            <span>
              Paso {currentStep} de {totalSteps}
            </span>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Error general y reintento de documentos */}
          {submitError && (
            <div className="submit-error-box">
              <p className="submit-error-text">{submitError}</p>
              {uploadFailed && (
                <IonButton
                  expand="block"
                  className="retry-upload-button"
                  onClick={handleRetryUpload}
                  disabled={isLoading}
                >
                  {isLoading ? <IonSpinner name="crescent" /> : "Reintentar subir fotos"}
                </IonButton>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          {/* En pasos 3-9 (fotos) PhotoUploadStep maneja el avance; sin botones — swipe para volver */}
          {!uploadFailed && (() => {
            const isPhotoStep = currentStep >= 3 && currentStep <= 9;
            if (isPhotoStep) return null; // Sin botones en pasos de fotos
            return (
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
                  {isLoading ? (
                    <IonSpinner name="crescent" />
                  ) : currentStep === totalSteps ? (
                    "Finalizar"
                  ) : currentStep === 2 ? (
                    "¡Los tengo listos!"
                  ) : (
                    "Siguiente"
                  )}
                </IonButton>
              </div>
            );
          })()}
        </div>
      </IonContent>
    </IonPage>
  );
};

// Componente auxiliar para subir archivos
const FileUpload = ({ label, file, onChange, error }) => {
  return (
    <div className="file-upload-wrapper">
      <label className="file-upload-label">{label}</label>
      <div
        className={`file-upload-box ${error ? "error" : ""} ${
          file ? "uploaded" : ""
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={onChange}
          className="file-upload-input"
        />
        <div className="file-upload-content">
          <Camera size="32" color={file ? "#10B981" : "#9CA3AF"} />
          <span className="file-upload-text">
            {file ? `✓ ${file.name}` : "Toca para subir foto"}
          </span>
        </div>
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export default CompleteRegistration;
