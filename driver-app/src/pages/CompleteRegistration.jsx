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

  // Estados de error
  const [errors, setErrors] = useState({});

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

  // 🆕 Función para cargar marcas de grúas según el tipo
  const loadTruckBrands = async (type) => {
    try {
      setIsLoading(true);
      console.log("🔄 Cargando marcas para:", type);
      const response = await vehicleAPI.getBrands(type);
      const brandsData = response.data?.data || [];
      setTruckBrands(brandsData);
      console.log(`✅ ${brandsData.length} marcas cargadas para ${type}`);
    } catch (error) {
      console.error("❌ Error cargando marcas de grúas:", error);
      setTruckBrands([]);
      alert("Error al cargar marcas. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Función para cargar modelos de grúas según la marca
  const loadTruckModels = async (brandId, type) => {
    try {
      setIsLoading(true);
      console.log("🔄 Cargando modelos para marca:", brandId);
      const response = await vehicleAPI.getModels(brandId, type);
      const modelsData = response.data?.data || [];
      setTruckModels(modelsData);
      console.log(`✅ ${modelsData.length} modelos cargados`);
    } catch (error) {
      console.error("❌ Error cargando modelos de grúas:", error);
      setTruckModels([]);
      alert("Error al cargar modelos. Intenta de nuevo.");
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

  // 🆕 Cargar marcas cuando se seleccione el tipo de grúa
  useEffect(() => {
    if (truckType) {
      console.log("🚚 Tipo de grúa seleccionado:", truckType);
      loadTruckBrands(truckType);
      // Reset marca y modelo al cambiar tipo
      setTruckBrand(null);
      setTruckModel(null);
      setCustomBrand("");
      setCustomModel("");
    }
  }, [truckType]);

  // 🆕 Cargar modelos cuando se seleccione la marca
  useEffect(() => {
    if (truckBrand && truckBrand.id !== "OTHER" && truckType) {
      console.log("🚚 Marca seleccionada:", truckBrand.name);
      loadTruckModels(truckBrand.id, truckType);
      // Reset modelo al cambiar marca
      setTruckModel(null);
      setCustomModel("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truckBrand]);

  const totalSteps = 13; // 🆕 Aumentado de 8 a 13 pasos para mejor UX (documentos separados)
  const progress = currentStep / totalSteps;

  const validateStep = () => {
    const newErrors = {};

    switch (currentStep) {
      // Paso 1: Ciudad y dirección
      case 1:
        if (!city) newErrors.city = "Selecciona tu ciudad";
        if (!address) newErrors.address = "Ingresa tu dirección";
        break;

      // Paso 2: Cédula (Frente y Atrás)
      case 2:
        if (!cedulaFront)
          newErrors.cedulaFront = "Sube la foto frontal de tu cédula";
        if (!cedulaBack)
          newErrors.cedulaBack = "Sube la foto trasera de tu cédula";
        break;

      // Paso 3: Selfie
      case 3:
        if (!selfie) newErrors.selfie = "Sube una selfie tuya";
        break;

      // Paso 4: Licencia de Tránsito (Frente y Atrás)
      case 4:
        if (!licenciaTransitoFront)
          newErrors.licenciaTransitoFront =
            "Sube la licencia de tránsito (frente)";
        if (!licenciaTransitoBack)
          newErrors.licenciaTransitoBack =
            "Sube la licencia de tránsito (atrás)";
        break;

      // Paso 5: SOAT
      case 5:
        if (!soat) newErrors.soat = "Sube el SOAT";
        break;

      // Paso 6: Tarjeta de Propiedad (Frente y Atrás)
      case 6:
        if (!tarjetaPropiedadFront)
          newErrors.tarjetaPropiedadFront =
            "Sube la tarjeta de propiedad (frente)";
        if (!tarjetaPropiedadBack)
          newErrors.tarjetaPropiedadBack =
            "Sube la tarjeta de propiedad (atrás)";
        break;

      // Paso 7: Seguro Todo Riesgo (Opcional)
      case 7:
        // Opcional, no hay validación requerida
        break;

      // Paso 8: Foto de la Grúa
      case 8:
        if (!towTruckPhoto)
          newErrors.towTruckPhoto = "Sube una foto de tu grúa";
        break;

      // Paso 9: Tipo de grúa
      case 9:
        if (!truckType) {
          newErrors.truckType = "Selecciona el tipo de grúa";
        }
        break;

      // Paso 10: Marca del vehículo
      case 10:
        if (!truckBrand) {
          newErrors.truckBrand = "Selecciona la marca del vehículo";
        } else if (truckBrand.id === "OTHER" && !customBrand.trim()) {
          newErrors.customBrand = "Escribe la marca de tu vehículo";
        }
        break;

      // Paso 11: Modelo del vehículo
      case 11:
        if (!truckModel) {
          newErrors.truckModel = "Selecciona el modelo del vehículo";
        } else if (truckModel.id === "OTHER" && !customModel.trim()) {
          newErrors.customModel = "Escribe el modelo de tu vehículo";
        }
        break;

      // Paso 12: Placa de la grúa
      case 12: {
        if (!truckPlate || truckPlate.length < 6) {
          newErrors.truckPlate = "Ingresa una placa válida (6 caracteres)";
        }
        // Validar formato colombiano básico: 3 letras + 3 números/letras
        const plateRegex = /^[A-Z]{3}[0-9]{3}$|^[A-Z]{3}[0-9]{2}[A-Z]$/;
        if (truckPlate && !plateRegex.test(truckPlate)) {
          newErrors.truckPlate = "Formato inválido. Usa ABC123 o ABC12D";
        }
        break;
      }

      // Paso 13: Capacidades
      case 13: {
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

    try {
      // Obtener userId del usuario guardado
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        alert(
          "Error: No se encontró la sesión. Por favor inicia sesión de nuevo."
        );
        history.replace("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user._id; // ✅ Cambiado de user.id a user._id para consistencia con backend

      console.log("👤 Usuario ID:", userId);

      // Paso A: Enviar datos básicos + datos de grúa
      const towTruckData = {
        truckType,
        licensePlate: truckPlate,
      };

      // Si seleccionó marca/modelo del catálogo
      if (truckBrand && truckBrand.id !== "OTHER") {
        towTruckData.baseBrandId = truckBrand.id;
        towTruckData.baseBrand = truckBrand.name;
      }
      if (truckModel && truckModel.id !== "OTHER") {
        towTruckData.baseModelId = truckModel.id;
        towTruckData.baseModel = truckModel.name;
      }

      // Si seleccionó "Otro" en marca/modelo
      if (truckBrand?.id === "OTHER" && customBrand) {
        towTruckData.customBrand = customBrand;
      }
      if (truckModel?.id === "OTHER" && customModel) {
        towTruckData.customModel = customModel;
      }

      console.log("🚚 Datos de grúa a enviar:", towTruckData);

      await authAPI.registerDriverComplete({
        userId,
        entityType,
        city,
        address,
        towTruck: towTruckData, // 🆕 Incluir datos de la grúa
      });

      console.log("✅ Datos básicos guardados");

      // Paso B: Subir documentos (convertir a base64)
      console.log("📤 Enviando documentos...");

      const documents = [];

      if (cedulaFront) {
        const base64 = await fileToBase64(cedulaFront);
        documents.push({ file: base64, documentType: "cedula-front" });
      }
      if (cedulaBack) {
        const base64 = await fileToBase64(cedulaBack);
        documents.push({ file: base64, documentType: "cedula-back" });
      }
      if (selfie) {
        const base64 = await fileToBase64(selfie);
        documents.push({ file: base64, documentType: "selfie" });
      }
      if (licenciaTransitoFront) {
        const base64 = await fileToBase64(licenciaTransitoFront);
        documents.push({ file: base64, documentType: "licencia-front" });
      }
      if (licenciaTransitoBack) {
        const base64 = await fileToBase64(licenciaTransitoBack);
        documents.push({ file: base64, documentType: "licencia-back" });
      }
      if (soat) {
        const base64 = await fileToBase64(soat);
        documents.push({ file: base64, documentType: "soat" });
      }
      if (tarjetaPropiedadFront) {
        const base64 = await fileToBase64(tarjetaPropiedadFront);
        documents.push({ file: base64, documentType: "tarjeta-front" });
      }
      if (tarjetaPropiedadBack) {
        const base64 = await fileToBase64(tarjetaPropiedadBack);
        documents.push({ file: base64, documentType: "tarjeta-back" });
      }
      if (seguroTodoRiesgo) {
        const base64 = await fileToBase64(seguroTodoRiesgo);
        documents.push({ file: base64, documentType: "seguro" });
      }
      if (towTruckPhoto) {
        const base64 = await fileToBase64(towTruckPhoto);
        documents.push({ file: base64, documentType: "grua-photo" });
      }

      console.log(`📎 Subiendo ${documents.length} documentos...`);

      await authAPI.uploadDriverDocuments({
        userId,
        documents,
      });

      console.log("✅ Documentos subidos");

      // Paso C: Enviar capacidades
      const selectedCapabilities = Object.keys(vehicleCapabilities).filter(
        (key) => vehicleCapabilities[key]
      );

      await authAPI.setDriverCapabilities({
        userId,
        vehicleCapabilities: selectedCapabilities,
      });

      console.log("✅ Capacidades guardadas");

      // Navegar a vista "En Revisión"
      history.replace("/under-review");
    } catch (error) {
      console.error("❌ Error en registro completo:", error);
      alert("Error al enviar el registro. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (setter) => async (e) => {
    const file = e.target.files[0];
    if (file) {
      setter(file);
    }
  };

  // Comprimir imagen y convertir a base64
  // Reduce fotos de cámara nativa (~5-10MB) a ~200-400KB sin perder legibilidad de documentos
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          const QUALITY = 0.75;

          let width = img.width;
          let height = img.height;

          // Escalar manteniendo proporción
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width / height > MAX_WIDTH / MAX_HEIGHT) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            } else {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a JPEG comprimido (menor tamaño que PNG)
          const compressed = canvas.toDataURL('image/jpeg', QUALITY);
          resolve(compressed);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
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

      // Paso 2: Cédula (Frente y Atrás)
      case 2:
        return (
          <div className="step-content">
            <img src={idCardImage} alt="Cédula" className="step-image" />
            <h2 className="step-title">Fotos de tu cedula</h2>
            <p className="step-description">
              Necesitamos que le tomes foto a tu cedula por delante y por detras
            </p>

            <FileUpload
              label="Cédula (Frente)"
              file={cedulaFront}
              onChange={handleFileChange(setCedulaFront)}
              error={errors.cedulaFront}
            />

            <FileUpload
              label="Cédula (Atrás)"
              file={cedulaBack}
              onChange={handleFileChange(setCedulaBack)}
              error={errors.cedulaBack}
            />
          </div>
        );

      // Paso 3: Selfie
      case 3:
        return (
          <div className="step-content">
            <img src={selfieImage} alt="Selfie" className="step-image" />
            <h2 className="step-title">Una selfie 😉</h2>
            <p className="step-description">
              Tomate una buena foto que veran tus clientes
            </p>

            <FileUpload
              label="Selfie tuya"
              file={selfie}
              onChange={handleFileChange(setSelfie)}
              error={errors.selfie}
            />
          </div>
        );

      // Paso 4: Licencia de Tránsito (Frente y Atrás)
      case 4:
        return (
          <div className="step-content">
            <img src={licenseImage} alt="Selfie" className="step-image" />
            <h2 className="step-title">Licencia de transito</h2>
            <p className="step-description">
              Necesitamos que le tomes foto a tu licencia de tránsito por
              delante y por detras
            </p>

            <FileUpload
              label="Licencia de Tránsito (Frente)"
              file={licenciaTransitoFront}
              onChange={handleFileChange(setLicenciaTransitoFront)}
              error={errors.licenciaTransitoFront}
            />

            <FileUpload
              label="Licencia de Tránsito (Atrás)"
              file={licenciaTransitoBack}
              onChange={handleFileChange(setLicenciaTransitoBack)}
              error={errors.licenciaTransitoBack}
            />
          </div>
        );

      // Paso 5: SOAT
      case 5:
        return (
          <div className="step-content">
            <img src={soatImage} alt="SOAT" className="step-image" />
            <h2 className="step-title">Seguro SOAT</h2>
            <p className="step-description">
            Por nuestra seguridad y la del cliente, necesitamos saber si estas al día con el soat.
            </p>

            <FileUpload
              label="SOAT"
              file={soat}
              onChange={handleFileChange(setSoat)}
              error={errors.soat}
            />
          </div>
        );

      // Paso 6: Tarjeta de Propiedad (Frente y Atrás)
      case 6:
        return (
          <div className="step-content">
            <img src={propertyImage} alt="Property" className="step-image" />
            <h2 className="step-title">Tarjeta de propiedad de la grua que usarás</h2>
            <p className="step-description">
            Necesitamos saber de quien es el grúa que recogera el vehiculo del cliente
            </p>

            <FileUpload
              label="Tarjeta de Propiedad (Frente)"
              file={tarjetaPropiedadFront}
              onChange={handleFileChange(setTarjetaPropiedadFront)}
              error={errors.tarjetaPropiedadFront}
            />

            <FileUpload
              label="Tarjeta de Propiedad (Atrás)"
              file={tarjetaPropiedadBack}
              onChange={handleFileChange(setTarjetaPropiedadBack)}
              error={errors.tarjetaPropiedadBack}
            />
          </div>
        );

      // Paso 7: Seguro Todo Riesgo (Opcional)
      case 7:
        return (
          <div className="step-content">
            <img src={securityImage} alt="Security" className="step-image" />
            <h2 className="step-title">Seguro todo riesgo</h2>
            <p className="step-description">
              <strong>Opcional.</strong> Esto nos ayudara con los clientes con sus vehiculos en los patios de movilidad
            </p>

            <FileUpload
              label="Seguro Todo Riesgo (Opcional)"
              file={seguroTodoRiesgo}
              onChange={handleFileChange(setSeguroTodoRiesgo)}
              error={errors.seguroTodoRiesgo}
            />
          </div>
        );

      // Paso 8: Foto de la Grúa
      case 8:
        return (
          <div className="step-content">
            <img src={truckImage} alt="Truck" className="step-image" />
            <h2 className="step-title">Foto de tu Grúa</h2>
            <p className="step-description">
              Sube una foto clara de tu grúa completa.
            </p>

            <FileUpload
              label="Foto de tu grúa"
              file={towTruckPhoto}
              onChange={handleFileChange(setTowTruckPhoto)}
              error={errors.towTruckPhoto}
            />
          </div>
        );

      // Paso 9: Tipo de grúa
      case 9:
        return (
          <TruckTypeSelector
            selectedType={truckType}
            onSelect={setTruckType}
            error={errors.truckType}
          />
        );

      // 🆕 Paso 10: Marca del vehículo base
      case 10:
        return (
          <TruckBrandSelector
            brands={truckBrands}
            selectedBrand={truckBrand}
            customBrand={customBrand}
            onSelect={setTruckBrand}
            onCustomBrandChange={setCustomBrand}
            isLoading={isLoading}
            error={errors.truckBrand || errors.customBrand}
          />
        );

      // 🆕 Paso 11: Modelo del vehículo base
      case 11:
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
            isLoading={isLoading}
            error={errors.truckModel || errors.customModel}
          />
        );

      // 🆕 Paso 12: Placa de la grúa
      case 12:
        return (
          <TruckPlateInput
            plate={truckPlate}
            onPlateChange={setTruckPlate}
            plateError={errors.truckPlate}
          />
        );

      // Paso 13: Capacidades
      case 13: {
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
              {Object.keys(vehicleCapabilities).map((key) => (
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
                  <span className="capability-label">{key}</span>
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

          {/* Navigation Buttons */}
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
              ) : (
                "Siguiente"
              )}
            </IonButton>
          </div>
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
