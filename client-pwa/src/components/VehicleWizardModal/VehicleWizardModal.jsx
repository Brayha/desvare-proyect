import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonText,
  IonProgressBar,
  IonFooter,
} from '@ionic/react';
import { closeOutline, arrowBackOutline, checkmarkOutline } from 'ionicons/icons';
import {
  VehicleCategorySelector,
  VehicleBrandSelector,
  VehicleModelSelector,
  VehiclePlateInput,
  VehicleSpecificsForm,
  ServiceDetailsForm,
  VehicleList,
} from '@components';
import { vehicleAPI } from '../../services/vehicleAPI';
import { useToast } from '@hooks/useToast';
import './VehicleWizardModal.css';

/**
 * Modal Wizard para crear/seleccionar vehículo y agregar detalles del servicio
 * 
 * Flujo depende del contexto:
 * - 'garage': Solo gestión de vehículos (sin servicio)
 * - 'service': Vehículo + detalles del servicio (problema, sótano, peso)
 * 
 * @param {boolean} isOpen - Controla si el modal está abierto
 * @param {function} onDismiss - Callback al cerrar el modal
 * @param {function} onComplete - Callback con datos completos del vehículo y servicio
 * @param {string} userId - ID del usuario (null si no está logueado)
 * @param {string} context - Contexto de uso: 'garage' o 'service' (default: 'service')
 * @param {function} onRequestAuth - Callback cuando usuario no logueado quiere iniciar sesión (opcional)
 */
const VehicleWizardModal = ({ 
  isOpen, 
  onDismiss, 
  onComplete, 
  userId, 
  context = 'service',
  onRequestAuth 
}) => {
  const { showSuccess, showError, showWarning } = useToast();

  // Estados del wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Estados de datos del vehículo
  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleData, setVehicleData] = useState({
    category: null,
    brand: null,
    model: null,
    licensePlate: '',
    year: '',
    color: '',
    specifics: {}, // isArmored, truckData, busData
  });

  // Estados de detalles del servicio (siempre se preguntan)
  const [serviceDetails, setServiceDetails] = useState({
    problem: '',
    basement: { isInBasement: false, level: null },
    truckCurrentState: { isLoaded: false, currentWeight: null },
  });

  // Estados de catálogos (dropdowns)
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Determinar si estamos en modo garaje
  const isGarageMode = context === 'garage';

  // Definir pasos del wizard según contexto
  const STEPS = isCreatingNew
    ? (isGarageMode
        ? [
            // Flujo de Mi Garaje: sin servicio
            { id: 'category', title: 'Categoría', description: '¿Qué tipo de vehículo es?' },
            { id: 'brand', title: 'Marca', description: 'Selecciona la marca' },
            { id: 'model', title: 'Modelo', description: 'Selecciona el modelo' },
            { id: 'plate', title: 'Placa', description: 'Ingresa la placa' },
            { id: 'specifics', title: 'Detalles', description: 'Información adicional' },
          ]
        : [
            // Flujo de solicitud de servicio: con servicio
            { id: 'category', title: 'Categoría', description: '¿Qué tipo de vehículo es?' },
            { id: 'brand', title: 'Marca', description: 'Selecciona la marca' },
            { id: 'model', title: 'Modelo', description: 'Selecciona el modelo' },
            { id: 'plate', title: 'Placa', description: 'Ingresa la placa' },
            { id: 'specifics', title: 'Detalles', description: 'Información adicional' },
            { id: 'service', title: 'Servicio', description: '¿Qué problema tiene?' },
          ]
      )
    : (isGarageMode
        ? [
            // En garaje solo mostrar lista (si hay vehículos)
            { id: 'list', title: 'Mis Vehículos', description: 'Selecciona o agrega uno nuevo' },
          ]
        : [
            // En solicitud: lista + servicio
            { id: 'list', title: 'Mis Vehículos', description: 'Selecciona o agrega uno nuevo' },
            { id: 'service', title: 'Servicio', description: '¿Qué problema tiene?' },
          ]
      );

  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentStepInfo = STEPS[currentStep];

  // Funciones de carga - NO usar useCallback para evitar loops infinitos
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getCategories();
      const categoriesData = response.data?.data || [];
      setCategories(categoriesData);
      console.log('✅ Categorías cargadas:', categoriesData.length);
    } catch (error) {
      console.error('❌ Error cargando categorías:', error);
      showError('Error al cargar categorías');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserVehicles = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getUserVehicles(userId);
      const vehiclesData = response.data?.data || [];
      setUserVehicles(vehiclesData);
      console.log('✅ Vehículos del usuario cargados:', vehiclesData.length);
    } catch (error) {
      console.error('❌ Error cargando vehículos:', error);
      // Si no hay vehículos, no es error crítico
      setUserVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBrands = async (categoryId) => {
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getBrands(categoryId);
      const brandsData = response.data?.data || [];
      setBrands(brandsData);
      console.log(`✅ ${brandsData.length} marcas cargadas para ${categoryId}`);
    } catch (error) {
      console.error('❌ Error cargando marcas:', error);
      showError('Error al cargar marcas');
      setBrands([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModels = async (brandId, categoryId) => {
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getModels(brandId, categoryId);
      const modelsData = response.data?.data || [];
      setModels(modelsData);
      console.log(`✅ ${modelsData.length} modelos cargados`);
    } catch (error) {
      console.error('❌ Error cargando modelos:', error);
      showError('Error al cargar modelos');
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar categorías y vehículos del usuario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      
      if (userId && context === 'service') {
        // Modo servicio con usuario logueado: detectar si tiene vehículos
        loadUserVehicles();
      } else if (userId && context === 'garage') {
        // Modo garaje: siempre cargar vehículos
        loadUserVehicles();
      } else if (!userId && context === 'service') {
        // Usuario no logueado en servicio: ir directo a crear
        setIsCreatingNew(true);
        setCurrentStep(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId, context]);

  // Auto-detectar si usuario no tiene vehículos en modo servicio
  useEffect(() => {
    // Solo ejecutar si:
    // 1. Modal está abierto
    // 2. Usuario está logueado
    // 3. Estamos en modo servicio
    // 4. No estamos cargando
    // 5. Ya se cargaron los vehículos (userVehicles no es undefined)
    // 6. No hay vehículos
    // 7. No estamos ya en modo crear
    if (
      isOpen && 
      userId && 
      context === 'service' && 
      !isLoading && 
      userVehicles !== undefined && 
      userVehicles.length === 0 && 
      !isCreatingNew
    ) {
      // Si no tiene vehículos, ir directo a crear
      console.log('🚗 Usuario sin vehículos → Ir directo a crear');
      setIsCreatingNew(true);
      setCurrentStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userVehicles, isOpen, userId, context, isLoading]);

  // Cargar marcas cuando se selecciona categoría
  useEffect(() => {
    if (vehicleData.category) {
      loadBrands(vehicleData.category.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleData.category]);

  // Cargar modelos cuando se selecciona marca
  useEffect(() => {
    if (vehicleData.brand && vehicleData.category) {
      loadModels(vehicleData.brand.id, vehicleData.category.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleData.brand, vehicleData.category]);

  // Handlers de selección
  const handleSelectCategory = (category) => {
    // Limpiar specifics al cambiar de categoría para evitar datos residuales
    setVehicleData({ 
      ...vehicleData, 
      category, 
      brand: null, 
      model: null,
      specifics: {} // Resetear specifics
    });
  };

  const handleSelectBrand = (brand) => {
    setVehicleData({ ...vehicleData, brand, model: null });
  };

  const handleSelectModel = (model) => {
    setVehicleData({ ...vehicleData, model });
  };

  const handlePlateChange = (plate) => {
    setVehicleData({ ...vehicleData, licensePlate: plate });
  };

  const handleSpecificsChange = (specifics) => {
    setVehicleData({ ...vehicleData, specifics });
  };

  const handleServiceDetailsChange = (details) => {
    setServiceDetails(details);
  };

  const handleSelectExistingVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleData({
      category: vehicle.category,
      brand: vehicle.brand,
      model: vehicle.model,
      licensePlate: vehicle.licensePlate,
      year: vehicle.year,
      color: vehicle.color,
      specifics: {
        isArmored: vehicle.isArmored,
        truckData: vehicle.truckData,
        busData: vehicle.busData,
      },
    });
  };

  const handleAddNewVehicle = () => {
    // Reset datos del vehículo anterior
    setSelectedVehicle(null);
    setVehicleData({
      category: null,
      brand: null,
      model: null,
      licensePlate: '',
      year: '',
      color: '',
      specifics: {},
    });
    setServiceDetails({
      problem: '',
      basement: { isInBasement: false, level: null },
      truckCurrentState: { isLoaded: false, currentWeight: null },
    });
    setIsCreatingNew(true);
    setCurrentStep(0);
  };

  // Navegación
  const handleNext = () => {
    // Validaciones por paso
    if (isCreatingNew) {
      switch (currentStepInfo.id) {
        case 'category':
          if (!vehicleData.category) {
            showWarning('Selecciona una categoría');
            return;
          }
          break;
        case 'brand':
          if (!vehicleData.brand) {
            showWarning('Selecciona una marca');
            return;
          }
          break;
        case 'model':
          if (!vehicleData.model) {
            showWarning('Selecciona un modelo');
            return;
          }
          break;
        case 'plate':
          if (!vehicleData.licensePlate || vehicleData.licensePlate.length < 5) {
            showWarning('Ingresa una placa válida');
            return;
          }
          break;
        case 'specifics': {
          // Validar campos específicos según categoría
          const category = vehicleData.category.id;
          if (category === 'CAMIONES') {
            const { truckData } = vehicleData.specifics;
            if (!truckData || !truckData.trailerType || !truckData.length || !truckData.height || !truckData.axleType) {
              showWarning('Completa todos los campos del camión');
              return;
            }
          }
          if (category === 'BUSES') {
            const { busData } = vehicleData.specifics;
            if (!busData || !busData.length || !busData.height || !busData.axleType || !busData.passengerCapacity) {
              showWarning('Completa todos los campos del bus');
              return;
            }
          }
          // La lógica de handleComplete se ejecuta automáticamente
          // en las líneas 366-371 si es el último paso
          break;
        }
        case 'service':
          if (!serviceDetails.problem || serviceDetails.problem.trim().length < 10) {
            showWarning('Describe el problema con más detalle (mín. 10 caracteres)');
            return;
          }
          // Validar sótano si aplica
          if (serviceDetails.basement?.isInBasement && !serviceDetails.basement?.level) {
            showWarning('Indica el nivel del sótano');
            return;
          }
          // Validar peso si aplica
          if (serviceDetails.truckCurrentState?.isLoaded && !serviceDetails.truckCurrentState?.currentWeight) {
            showWarning('Indica el peso del camión');
            return;
          }
          break;
        default:
          break;
      }
    } else {
      // Flujo de seleccionar vehículo existente
      switch (currentStepInfo.id) {
        case 'list':
          if (!selectedVehicle) {
            showWarning('Selecciona un vehículo o agrega uno nuevo');
            return;
          }
          break;
        case 'service':
          if (!serviceDetails.problem || serviceDetails.problem.trim().length < 10) {
            showWarning('Describe el problema con más detalle (mín. 10 caracteres)');
            return;
          }
          // Validar sótano si aplica
          if (serviceDetails.basement?.isInBasement && !serviceDetails.basement?.level) {
            showWarning('Indica el nivel del sótano');
            return;
          }
          // Validar peso si aplica
          if (serviceDetails.truckCurrentState?.isLoaded && !serviceDetails.truckCurrentState?.currentWeight) {
            showWarning('Indica el peso del camión');
            return;
          }
          break;
        default:
          break;
      }
    }

    // Si es el último paso, completar
    if (currentStep === totalSteps - 1) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      handleCloseModal();
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      let vehicleId = selectedVehicle?._id || null;

      // Si estamos creando un nuevo vehículo Y el usuario está logueado, guardarlo
      if (isCreatingNew && userId) {
        const newVehiclePayload = {
          userId,
          category: vehicleData.category,
          brand: vehicleData.brand,
          model: vehicleData.model,
          licensePlate: vehicleData.licensePlate,
          // Convertir year a número o null (no string vacío)
          year: vehicleData.year ? parseInt(vehicleData.year, 10) : null,
          // Convertir color a string válido o null (no string vacío)
          color: vehicleData.color?.trim() || null,
        };

        // Agregar campos específicos según la categoría
        const categoryId = vehicleData.category?.id;
        
        console.log('🔍 DEBUG - vehicleData.specifics:', vehicleData.specifics);
        console.log('🔍 DEBUG - categoryId:', categoryId);
        
        if (['AUTOS', 'CAMIONETAS', 'ELECTRICOS'].includes(categoryId)) {
          newVehiclePayload.isArmored = vehicleData.specifics?.isArmored || false;
          console.log('✅ AUTO/CAMIONETA/ELECTRICO - isArmored:', newVehiclePayload.isArmored);
        } else if (categoryId === 'CAMIONES') {
          // Solo agregar si existe y tiene datos válidos
          console.log('🚚 CAMION - checking truckData:', vehicleData.specifics?.truckData);
          if (vehicleData.specifics?.truckData && Object.keys(vehicleData.specifics.truckData).length > 0) {
            newVehiclePayload.truckData = vehicleData.specifics.truckData;
            console.log('✅ CAMION - truckData agregado');
          } else {
            console.log('⚠️ CAMION - truckData vacío o undefined, NO se agregará');
          }
        } else if (categoryId === 'BUSES') {
          // Solo agregar si existe y tiene datos válidos
          console.log('🚌 BUS - checking busData:', vehicleData.specifics?.busData);
          if (vehicleData.specifics?.busData && Object.keys(vehicleData.specifics.busData).length > 0) {
            newVehiclePayload.busData = vehicleData.specifics.busData;
            console.log('✅ BUS - busData agregado');
          } else {
            console.log('⚠️ BUS - busData vacío o undefined, NO se agregará');
          }
        }

        console.log('📤 Guardando nuevo vehículo:', JSON.stringify(newVehiclePayload, null, 2));
        const response = await vehicleAPI.createVehicle(newVehiclePayload);
        vehicleId = response.data.data?._id || response.data._id;
        showSuccess('✅ Vehículo guardado en tu garaje');
      }

      // Preparar datos completos para enviar al padre
      const vehicleSnapshot = {
        category: vehicleData.category,
        brand: vehicleData.brand,
        model: vehicleData.model,
        licensePlate: vehicleData.licensePlate,
        // Asegurar tipos correctos
        year: vehicleData.year ? parseInt(vehicleData.year, 10) : null,
        color: vehicleData.color?.trim() || null,
      };

      // Agregar campos específicos al snapshot según la categoría
      const categoryId = vehicleData.category?.id;
      if (['AUTOS', 'CAMIONETAS', 'ELECTRICOS'].includes(categoryId)) {
        vehicleSnapshot.isArmored = vehicleData.specifics?.isArmored || false;
      } else if (categoryId === 'CAMIONES') {
        // Solo agregar si existe y tiene datos válidos
        if (vehicleData.specifics?.truckData && Object.keys(vehicleData.specifics.truckData).length > 0) {
          vehicleSnapshot.truckData = vehicleData.specifics.truckData;
        }
      } else if (categoryId === 'BUSES') {
        // Solo agregar si existe y tiene datos válidos
        if (vehicleData.specifics?.busData && Object.keys(vehicleData.specifics.busData).length > 0) {
          vehicleSnapshot.busData = vehicleData.specifics.busData;
        }
      }

      // Si context es 'garage', solo devolver datos del vehículo (sin servicio)
      const completeData = context === 'garage'
        ? {
            vehicleId,
            vehicleSnapshot,
          }
        : {
            vehicleId, // ID del vehículo (null si usuario no está logueado)
            vehicleSnapshot,
            serviceDetails: {
              problem: serviceDetails.problem.trim(),
              basement: serviceDetails.basement,
              truckCurrentState: serviceDetails.truckCurrentState,
            },
          };

      console.log(`✅ Datos completos (context: ${context}):`, completeData);
      onComplete(completeData);
      handleCloseModal();
    } catch (error) {
      console.error('❌ Error al completar wizard:', error);
      showError(error.response?.data?.error || 'Error al guardar vehículo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    // Reset states
    setCurrentStep(0);
    setIsCreatingNew(false);
    setSelectedVehicle(null);
    setVehicleData({
      category: null,
      brand: null,
      model: null,
      licensePlate: '',
      year: '',
      color: '',
      specifics: {},
    });
    setServiceDetails({
      problem: '',
      basement: { isInBasement: false, level: null },
      truckCurrentState: { isLoaded: false, currentWeight: null },
    });
    setCategories([]);
    setBrands([]);
    setModels([]);
    onDismiss();
  };

  // Renderizar contenido del paso actual
  const renderStepContent = () => {
    switch (currentStepInfo.id) {
      case 'list':
        return (
          <VehicleList
            vehicles={userVehicles}
            onSelect={handleSelectExistingVehicle}
            onAddNew={handleAddNewVehicle}
            selectedVehicleId={selectedVehicle?._id}
          />
        );

      case 'category':
        return (
          <VehicleCategorySelector
            categories={categories}
            onSelect={handleSelectCategory}
            selectedCategory={vehicleData.category}
          />
        );

      case 'brand':
        return (
          <VehicleBrandSelector
            brands={brands}
            onSelect={handleSelectBrand}
            selectedBrand={vehicleData.brand}
            isLoading={isLoading}
          />
        );

      case 'model':
        return (
          <VehicleModelSelector
            models={models}
            onSelect={handleSelectModel}
            selectedModel={vehicleData.model}
            isLoading={isLoading}
          />
        );

      case 'plate':
        return (
          <div className="wizard-form-container">
            <VehiclePlateInput
              value={vehicleData.licensePlate}
              onChange={handlePlateChange}
              label="Placa del vehículo"
              placeholder="ABC-123, GIQ-79F, AB2-123"
            />
          </div>
        );

      case 'specifics':
        return (
          <div className="wizard-form-container">
            <VehicleSpecificsForm
              category={vehicleData.category}
              onDataChange={handleSpecificsChange}
              initialData={vehicleData.specifics}
            />
          </div>
        );

      case 'service':
        return (
          <div className="wizard-form-container">
            <ServiceDetailsForm
              vehicleCategory={vehicleData.category}
              onDataChange={handleServiceDetailsChange}
              initialData={serviceDetails}
            />
          </div>
        );

      default:
        return <IonText>Paso no definido</IonText>;
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleCloseModal}
      className="vehicle-wizard-modal"
      mode="ios"
    >
      <IonHeader mode="ios">
        <IonToolbar mode="ios">
          <IonButtons slot="start">
            <IonButton onClick={handleBack}>
              <IonIcon icon={currentStep === 0 ? closeOutline : arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{currentStepInfo.title}</IonTitle>
          <IonButtons slot="end">
            {/* Botón "Ya tienes cuenta" si no está logueado en modo servicio */}
            {!userId && context === 'service' && currentStep === 0 ? (
              <IonButton 
                onClick={() => {
                  onDismiss();
                  // Llamar callback si existe, si no, redirigir a /request-auth
                  if (onRequestAuth) {
                    onRequestAuth();
                  } else {
                    console.log('🔐 Usuario quiere iniciar sesión → Redireccionar a /request-auth');
                  }
                }}
                size="small"
              >
                <IonText style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                  ¿Ya tienes cuenta?
                </IonText>
              </IonButton>
            ) : (
              <IonText color="medium" style={{ fontSize: '14px', marginRight: '12px' }}>
                {currentStep + 1}/{totalSteps}
              </IonText>
            )}
          </IonButtons>
        </IonToolbar>
        <IonProgressBar value={progress / 100} color="primary" />
      </IonHeader>

      <IonContent mode="ios" className="wizard-content">
        <div className="wizard-step-description">
          <IonText color="medium">
            <p>{currentStepInfo.description}</p>
          </IonText>
        </div>

        {renderStepContent()}
      </IonContent>

      <IonFooter mode="ios" className="wizard-footer">
        <IonToolbar mode="ios">
          <IonButton
            expand="block"
            onClick={handleNext}
            disabled={isLoading}
            className="wizard-next-button"
          >
            {isLoading ? (
              'Guardando...'
            ) : currentStep === totalSteps - 1 ? (
              <>
                <IonIcon icon={checkmarkOutline} slot="start" />
                Confirmar
              </>
            ) : (
              'Siguiente'
            )}
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default VehicleWizardModal;

