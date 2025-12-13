import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonSpinner, IonProgressBar, IonText, IonSelect, IonSelectOption, IonItem, IonLabel } from '@ionic/react';
import { Profile, Location, Building, DocumentText, Camera, Truck } from 'iconsax-react';
import { authAPI, citiesAPI } from '../services/api';
import { Input } from '../../../shared/components';
import './CompleteRegistration.css';

/**
 * Flujo de Registro Completo para Conductores (6 pasos)
 * 
 * Paso 1: Tipo de entidad (Natural / Jurídica)
 * Paso 2: Datos personales / empresa
 * Paso 3: Ubicación (ciudad, dirección)
 * Paso 4: Documentos del conductor
 * Paso 5: Documentos y fotos de la grúa
 * Paso 6: Capacidades del vehículo (qué puede llevar)
 */

const CompleteRegistration = () => {
  const history = useHistory();
  
  // Estados del flujo
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState([]);
  
  // Paso 1: Tipo de entidad
  const [entityType, setEntityType] = useState(''); // 'natural' | 'juridica'
  
  // Paso 2: Datos personales / empresa
  const [companyName, setCompanyName] = useState('');
  const [companyNIT, setCompanyNIT] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  
  // Paso 3: Ubicación
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  
  // Paso 4: Documentos del conductor
  const [cedulaFront, setCedulaFront] = useState(null);
  const [cedulaBack, setCedulaBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  
  // Paso 5: Documentos y fotos de la grúa
  const [licenciaTransitoFront, setLicenciaTransitoFront] = useState(null);
  const [licenciaTransitoBack, setLicenciaTransitoBack] = useState(null);
  const [soat, setSoat] = useState(null);
  const [tarjetaPropiedadFront, setTarjetaPropiedadFront] = useState(null);
  const [tarjetaPropiedadBack, setTarjetaPropiedadBack] = useState(null);
  const [seguroTodoRiesgo, setSeguroTodoRiesgo] = useState(null);
  const [towTruckPhoto, setTowTruckPhoto] = useState(null);
  
  // Paso 6: Capacidades del vehículo
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
      { name: 'Bogotá', region: 'Andina' },
      { name: 'Medellín', region: 'Andina' },
      { name: 'Cali', region: 'Pacífica' },
      { name: 'Barranquilla', region: 'Caribe' },
      { name: 'Cartagena', region: 'Caribe' },
      { name: 'Bucaramanga', region: 'Andina' },
      { name: 'Pereira', region: 'Andina' },
      { name: 'Santa Marta', region: 'Caribe' }
    ];
    console.log('✅ Usando ciudades fallback:', fallbackCities.length);
    setCities(fallbackCities);
  };

  // Cargar ciudades al montar el componente
  useEffect(() => {
    const loadCities = async () => {
      try {
        console.log('🔄 Cargando ciudades...');
        const response = await citiesAPI.getAll();
        console.log('✅ Respuesta ciudades:', response);
        
        // Verificar que response.data sea un array
        if (response && response.data && Array.isArray(response.data)) {
          console.log('✅ Ciudades cargadas:', response.data.length, 'ciudades');
          setCities(response.data);
        } else {
          console.warn('⚠️ Respuesta no es un array, usando fallback');
          setFallbackCities();
        }
      } catch (error) {
        console.error('❌ Error cargando ciudades:', error);
        setFallbackCities();
      }
    };

    loadCities();
  }, []);

  const totalSteps = 6;
  const progress = currentStep / totalSteps;

  const validateStep = () => {
    const newErrors = {};
    
    switch (currentStep) {
      case 1:
        if (!entityType) {
          newErrors.entityType = 'Selecciona un tipo de entidad';
        }
        break;
      
      case 2:
        if (entityType === 'juridica') {
          if (!companyName) newErrors.companyName = 'Ingresa el nombre de la empresa';
          if (!companyNIT) newErrors.companyNIT = 'Ingresa el NIT';
          if (!companyAddress) newErrors.companyAddress = 'Ingresa la dirección de la empresa';
        }
        break;
      
      case 3:
        if (!city) newErrors.city = 'Selecciona tu ciudad';
        if (!address) newErrors.address = 'Ingresa tu dirección';
        break;
      
      case 4:
        if (!cedulaFront) newErrors.cedulaFront = 'Sube la foto frontal de tu cédula';
        if (!cedulaBack) newErrors.cedulaBack = 'Sube la foto trasera de tu cédula';
        if (!selfie) newErrors.selfie = 'Sube una selfie tuya';
        break;
      
      case 5:
        if (!licenciaTransitoFront) newErrors.licenciaTransitoFront = 'Sube la licencia de tránsito (frente)';
        if (!licenciaTransitoBack) newErrors.licenciaTransitoBack = 'Sube la licencia de tránsito (atrás)';
        if (!soat) newErrors.soat = 'Sube el SOAT';
        if (!tarjetaPropiedadFront) newErrors.tarjetaPropiedadFront = 'Sube la tarjeta de propiedad (frente)';
        if (!tarjetaPropiedadBack) newErrors.tarjetaPropiedadBack = 'Sube la tarjeta de propiedad (atrás)';
        if (!towTruckPhoto) newErrors.towTruckPhoto = 'Sube una foto de tu grúa';
        break;
      
      case 6: {
        const hasCapability = Object.values(vehicleCapabilities).some(v => v);
        if (!hasCapability) {
          newErrors.capabilities = 'Selecciona al menos un tipo de vehículo que puedas llevar';
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
    console.log('📝 Enviando registro completo...');
    setIsLoading(true);

    try {
      // Obtener userId del usuario guardado
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        alert('Error: No se encontró la sesión. Por favor inicia sesión de nuevo.');
        history.replace('/login');
        return;
      }
      
      const user = JSON.parse(userStr);
      const userId = user._id; // ✅ Cambiado de user.id a user._id para consistencia con backend

      console.log('👤 Usuario ID:', userId);

      // Paso A: Enviar datos básicos
      await authAPI.registerDriverComplete({
        userId,
        entityType,
        city,
        address,
        ...(entityType === 'juridica' && {
          companyInfo: {
            companyName: companyName,
            nit: companyNIT,
            legalRepresentative: companyName, // Por ahora usamos el mismo nombre, después se puede pedir por separado
          },
        }),
      });

      console.log('✅ Datos básicos guardados');

      // Paso B: Subir documentos (convertir a base64)
      console.log('📤 Enviando documentos...');
      
      const documents = [];
      
      if (cedulaFront) {
        const base64 = await fileToBase64(cedulaFront);
        documents.push({ file: base64, documentType: 'cedula-front' });
      }
      if (cedulaBack) {
        const base64 = await fileToBase64(cedulaBack);
        documents.push({ file: base64, documentType: 'cedula-back' });
      }
      if (selfie) {
        const base64 = await fileToBase64(selfie);
        documents.push({ file: base64, documentType: 'selfie' });
      }
      if (licenciaTransitoFront) {
        const base64 = await fileToBase64(licenciaTransitoFront);
        documents.push({ file: base64, documentType: 'licencia-front' });
      }
      if (licenciaTransitoBack) {
        const base64 = await fileToBase64(licenciaTransitoBack);
        documents.push({ file: base64, documentType: 'licencia-back' });
      }
      if (soat) {
        const base64 = await fileToBase64(soat);
        documents.push({ file: base64, documentType: 'soat' });
      }
      if (tarjetaPropiedadFront) {
        const base64 = await fileToBase64(tarjetaPropiedadFront);
        documents.push({ file: base64, documentType: 'tarjeta-front' });
      }
      if (tarjetaPropiedadBack) {
        const base64 = await fileToBase64(tarjetaPropiedadBack);
        documents.push({ file: base64, documentType: 'tarjeta-back' });
      }
      if (seguroTodoRiesgo) {
        const base64 = await fileToBase64(seguroTodoRiesgo);
        documents.push({ file: base64, documentType: 'seguro' });
      }
      if (towTruckPhoto) {
        const base64 = await fileToBase64(towTruckPhoto);
        documents.push({ file: base64, documentType: 'grua-photo' });
      }

      console.log(`📎 Subiendo ${documents.length} documentos...`);

      await authAPI.uploadDriverDocuments({
        userId,
        documents,
      });

      console.log('✅ Documentos subidos');

      // Paso C: Enviar capacidades
      const selectedCapabilities = Object.keys(vehicleCapabilities).filter(
        (key) => vehicleCapabilities[key]
      );

      await authAPI.setDriverCapabilities({
        userId,
        vehicleCapabilities: selectedCapabilities,
      });

      console.log('✅ Capacidades guardadas');

      // Navegar a vista "En Revisión"
      history.replace('/under-review');
    } catch (error) {
      console.error('❌ Error en registro completo:', error);
      alert('Error al enviar el registro. Intenta de nuevo.');
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
      case 1:
        return (
          <div className="step-content">
            <div className="step-icon">
              <Profile size="48" color="#0055FF" variant="Bulk" />
            </div>
            <h2 className="step-title">Tipo de entidad</h2>
            <p className="step-description">
              ¿Eres persona natural o trabajas con una empresa?
            </p>

            <div className="entity-options">
              <button
                className={`entity-option ${entityType === 'natural' ? 'selected' : ''}`}
                onClick={() => setEntityType('natural')}
              >
                <div className="entity-option-icon">
                  <Profile size="32" color={entityType === 'natural' ? '#0055FF' : '#6B7280'} />
                </div>
                <div className="entity-option-text">
                  <h3>Persona Natural</h3>
                  <p>Trabajo por cuenta propia</p>
                </div>
              </button>

              <button
                className={`entity-option ${entityType === 'juridica' ? 'selected' : ''}`}
                onClick={() => setEntityType('juridica')}
              >
                <div className="entity-option-icon">
                  <Building size="32" color={entityType === 'juridica' ? '#0055FF' : '#6B7280'} />
                </div>
                <div className="entity-option-text">
                  <h3>Persona Jurídica</h3>
                  <p>Tengo una empresa</p>
                </div>
              </button>
            </div>

            {errors.entityType && (
              <IonText color="danger" className="step-error">
                <small>{errors.entityType}</small>
              </IonText>
            )}
          </div>
        );

      case 2:
        if (entityType === 'natural') {
          return (
            <div className="step-content">
              <div className="step-icon">
                <Profile size="48" color="#0055FF" variant="Bulk" />
              </div>
              <h2 className="step-title">Datos personales</h2>
              <p className="step-description">
                Como persona natural, solo necesitamos confirmar tus datos básicos.
              </p>
              <IonText color="success">
                <p>✅ Continúa al siguiente paso</p>
              </IonText>
            </div>
          );
        } else {
          return (
            <div className="step-content">
              <div className="step-icon">
                <Building size="48" color="#0055FF" variant="Bulk" />
              </div>
              <h2 className="step-title">Datos de la empresa</h2>
              <p className="step-description">
                Ingresa la información legal de tu empresa.
              </p>

              <Input
                type="text"
                placeholder="Nombre de la empresa"
                value={companyName}
                onChange={setCompanyName}
                error={errors.companyName}
                icon={<Building size="24" color={errors.companyName ? '#EF4444' : '#9CA3AF'} />}
              />

              <Input
                type="text"
                placeholder="NIT (sin dígito de verificación)"
                value={companyNIT}
                onChange={setCompanyNIT}
                error={errors.companyNIT}
                icon={<DocumentText size="24" color={errors.companyNIT ? '#EF4444' : '#9CA3AF'} />}
              />

              <Input
                type="text"
                placeholder="Dirección de la empresa"
                value={companyAddress}
                onChange={setCompanyAddress}
                error={errors.companyAddress}
                icon={<Location size="24" color={errors.companyAddress ? '#EF4444' : '#9CA3AF'} />}
              />
            </div>
          );
        }

      case 3:
        return (
          <div className="step-content">
            <div className="step-icon">
              <Location size="48" color="#0055FF" variant="Bulk" />
            </div>
            <h2 className="step-title">Ubicación</h2>
            <p className="step-description">
              ¿Desde dónde operas tu grúa?
            </p>

            {/* IonSelect con estilo moderno */}
            <div className="modern-input-wrapper">
              <div className={`modern-input-group ${errors.city ? 'has-error' : ''}`}>
                <div className="modern-input-icon">
                  <Location size="24" color={errors.city ? '#EF4444' : '#9CA3AF'} />
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
                      <IonSelectOption key={`${c.name}-${index}`} value={c.name}>
                        {c.name} - {c.region}
                      </IonSelectOption>
                    ))
                  ) : (
                    <IonSelectOption value="" disabled>Cargando ciudades...</IonSelectOption>
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
              icon={<Location size="24" color={errors.address ? '#EF4444' : '#9CA3AF'} />}
            />
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <div className="step-icon">
              <Camera size="48" color="#0055FF" variant="Bulk" />
            </div>
            <h2 className="step-title">Tus documentos</h2>
            <p className="step-description">
              Sube fotos claras de tu cédula y una selfie.
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

            <FileUpload
              label="Selfie tuya"
              file={selfie}
              onChange={handleFileChange(setSelfie)}
              error={errors.selfie}
            />
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <div className="step-icon">
              <Truck size="48" color="#0055FF" variant="Bulk" />
            </div>
            <h2 className="step-title">Documentos de tu grúa</h2>
            <p className="step-description">
              Sube los documentos legales y una foto de tu grúa.
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

            <FileUpload
              label="SOAT"
              file={soat}
              onChange={handleFileChange(setSoat)}
              error={errors.soat}
            />

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

            <FileUpload
              label="Seguro Todo Riesgo (Opcional)"
              file={seguroTodoRiesgo}
              onChange={handleFileChange(setSeguroTodoRiesgo)}
              error={errors.seguroTodoRiesgo}
            />

            <FileUpload
              label="Foto de tu grúa"
              file={towTruckPhoto}
              onChange={handleFileChange(setTowTruckPhoto)}
              error={errors.towTruckPhoto}
            />
          </div>
        );

      case 6:
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
                  className={`capability-option ${vehicleCapabilities[key] ? 'selected' : ''}`}
                  onClick={() =>
                    setVehicleCapabilities({
                      ...vehicleCapabilities,
                      [key]: !vehicleCapabilities[key],
                    })
                  }
                >
                  <div className="capability-checkbox">
                    {vehicleCapabilities[key] && '✓'}
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
            <span>Paso {currentStep} de {totalSteps}</span>
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
              {currentStep === 1 ? 'Cancelar' : 'Atrás'}
            </IonButton>

            <IonButton
              className="nav-button next-button"
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <IonSpinner name="crescent" />
              ) : currentStep === totalSteps ? (
                'Finalizar'
              ) : (
                'Siguiente'
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
      <div className={`file-upload-box ${error ? 'error' : ''} ${file ? 'uploaded' : ''}`}>
        <input
          type="file"
          accept="image/*"
          onChange={onChange}
          className="file-upload-input"
        />
        <div className="file-upload-content">
          <Camera size="32" color={file ? '#10B981' : '#9CA3AF'} />
          <span className="file-upload-text">
            {file ? `✓ ${file.name}` : 'Toca para subir foto'}
          </span>
        </div>
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export default CompleteRegistration;

