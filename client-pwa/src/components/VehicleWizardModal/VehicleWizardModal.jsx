import React, { useState, useEffect, useCallback } from 'react';
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
 * Flujo:
 * 1. Listar vehículos guardados (si hay) o ir a crear uno nuevo
 * 2. Seleccionar categoría
 * 3. Seleccionar marca
 * 4. Seleccionar modelo
 * 5. Ingresar placa
 * 6. Datos específicos del vehículo (blindaje, dimensiones, etc)
 * 7. Detalles del servicio (problema, sótano, peso)
 * 
 * @param {boolean} isOpen - Controla si el modal está abierto
 * @param {function} onDismiss - Callback al cerrar el modal
 * @param {function} onComplete - Callback con datos completos del vehículo y servicio
 * @param {string} userId - ID del usuario (null si no está logueado)
 */
const VehicleWizardModal = ({ isOpen, onDismiss, onComplete, userId }) => {
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

  // Definir pasos del wizard
  const STEPS = isCreatingNew
    ? [
        { id: 'category', title: 'Categoría', description: '¿Qué tipo de vehículo es?' },
        { id: 'brand', title: 'Marca', description: 'Selecciona la marca' },
        { id: 'model', title: 'Modelo', description: 'Selecciona el modelo' },
        { id: 'plate', title: 'Placa', description: 'Ingresa la placa' },
        { id: 'specifics', title: 'Detalles', description: 'Información adicional' },
        { id: 'service', title: 'Servicio', description: '¿Qué problema tiene?' },
      ]
    : [
        { id: 'list', title: 'Mis Vehículos', description: 'Selecciona o agrega uno nuevo' },
        { id: 'service', title: 'Servicio', description: '¿Qué problema tiene?' },
      ];

  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentStepInfo = STEPS[currentStep];

  // Funciones de carga con useCallback para evitar warnings de dependencias
  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getCategories();
      setCategories(response.data || []);
      console.log('✅ Categorías cargadas:', response.data.length);
    } catch (error) {
      console.error('❌ Error cargando categorías:', error);
      showError('Error al cargar categorías');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  const loadUserVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getUserVehicles(userId);
      setUserVehicles(response.data || []);
      console.log('✅ Vehículos del usuario cargados:', response.data.length);
    } catch (error) {
      console.error('❌ Error cargando vehículos:', error);
      // Si no hay vehículos, no es error crítico
      setUserVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadBrands = useCallback(async (categoryId) => {
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getBrands(categoryId);
      setBrands(response.data || []);
      console.log(`✅ ${response.data.length} marcas cargadas para ${categoryId}`);
    } catch (error) {
      console.error('❌ Error cargando marcas:', error);
      showError('Error al cargar marcas');
      setBrands([]);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  const loadModels = useCallback(async (brandId, categoryId) => {
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getModels(brandId, categoryId);
      setModels(response.data || []);
      console.log(`✅ ${response.data.length} modelos cargados`);
    } catch (error) {
      console.error('❌ Error cargando modelos:', error);
      showError('Error al cargar modelos');
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Cargar categorías y vehículos del usuario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (userId) {
        loadUserVehicles();
      }
    }
  }, [isOpen, userId, loadCategories, loadUserVehicles]);

  // Cargar marcas cuando se selecciona categoría
  useEffect(() => {
    if (vehicleData.category) {
      loadBrands(vehicleData.category.id);
    }
  }, [vehicleData.category, loadBrands]);

  // Cargar modelos cuando se selecciona marca
  useEffect(() => {
    if (vehicleData.brand && vehicleData.category) {
      loadModels(vehicleData.brand.id, vehicleData.category.id);
    }
  }, [vehicleData.brand, vehicleData.category, loadModels]);

  // Handlers de selección
  const handleSelectCategory = (category) => {
    setVehicleData({ ...vehicleData, category, brand: null, model: null });
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
          year: vehicleData.year || null,
          color: vehicleData.color || null,
          ...vehicleData.specifics,
        };

        console.log('📤 Guardando nuevo vehículo:', newVehiclePayload);
        const response = await vehicleAPI.createVehicle(newVehiclePayload);
        vehicleId = response.data._id;
        showSuccess('✅ Vehículo guardado en tu garaje');
      }

      // Preparar datos completos para enviar al padre
      const completeData = {
        vehicleId, // ID del vehículo (null si usuario no está logueado)
        vehicleSnapshot: {
          category: vehicleData.category,
          brand: vehicleData.brand,
          model: vehicleData.model,
          licensePlate: vehicleData.licensePlate,
          year: vehicleData.year || null,
          color: vehicleData.color || null,
          ...vehicleData.specifics,
        },
        serviceDetails: {
          problem: serviceDetails.problem.trim(),
          basement: serviceDetails.basement,
          truckCurrentState: serviceDetails.truckCurrentState,
        },
      };

      console.log('✅ Datos completos del vehículo y servicio:', completeData);
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
            <IonText color="medium" style={{ fontSize: '14px', marginRight: '12px' }}>
              {currentStep + 1}/{totalSteps}
            </IonText>
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

