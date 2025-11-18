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
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../AuthModal/AuthModal';
import './VehicleWizardModal.css';

/**
 * Modal Wizard para crear/seleccionar vehículo y agregar detalles del servicio
 * 
 * Flujo: Seleccionar/crear vehículo → Agregar detalles del servicio
 * 
 * @param {boolean} isOpen - Controla si el modal está abierto
 * @param {function} onDismiss - Callback al cerrar el modal
 * @param {function} onComplete - Callback con datos completos del vehículo y servicio
 */
const VehicleWizardModal = ({ 
  isOpen, 
  onDismiss, 
  onComplete
}) => {
  const { showSuccess, showError, showWarning } = useToast();
  const { user, vehicles: userVehicles, refreshVehicles } = useAuth();
  
  // Obtener userId dinámicamente del contexto (se actualiza después del login)
  const userId = user?.id || null;

  // Estados del wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [intentionalCreate, setIntentionalCreate] = useState(false); // Para diferenciar creación manual vs auto-redirect

  // Estados de datos del vehículo
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
  
  // Estado para modal de autenticación
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Definir pasos del wizard (siempre incluye servicio)
  const STEPS = isCreatingNew
    ? [
        // Flujo de creación: vehículo + servicio
        { id: 'category', title: 'Categoría', description: '¿Qué tipo de vehículo es?' },
        { id: 'brand', title: 'Marca', description: 'Selecciona la marca' },
        { id: 'model', title: 'Modelo', description: 'Selecciona el modelo' },
        { id: 'plate', title: 'Placa', description: 'Ingresa la placa' },
        { id: 'specifics', title: 'Detalles', description: 'Información adicional' },
        { id: 'service', title: 'Servicio', description: '¿Qué problema tiene?' },
      ]
    : [
        // Flujo de selección: lista + servicio
        { id: 'list', title: 'Mis Vehículos', description: 'Selecciona o agrega uno nuevo' },
        { id: 'service', title: 'Servicio', description: '¿Qué problema tiene?' },
      ];

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

  // Cargar categorías cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // LIMPIAR localStorage corrupto para evitar errores de data vieja
      // Solo limpiamos vehicleData si ya existe routeData (estamos en flujo de servicio)
      const routeData = localStorage.getItem('routeData');
      if (routeData && !userId) {
        // Usuario no logueado con ruta activa: limpiar vehicleData viejo
        localStorage.removeItem('vehicleData');
        console.log('🧹 localStorage.vehicleData limpiado (prevenir data corrupta)');
      }
      
      loadCategories();
      
      if (!userId) {
        // Usuario no logueado: ir directo a crear vehículo
        setIsCreatingNew(true);
        setCurrentStep(0);
      }
      // Si está logueado, los vehículos ya están disponibles desde AuthContext
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  // Auto-detectar si usuario no tiene vehículos
  useEffect(() => {
    // Solo ejecutar si:
    // 1. Modal está abierto
    // 2. Usuario está logueado
    // 3. No estamos cargando
    // 4. Ya se cargaron los vehículos (userVehicles no es undefined)
    // 5. No hay vehículos
    // 6. No estamos ya en modo crear
    if (
      isOpen && 
      userId && 
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
  }, [userVehicles, isOpen, userId, isLoading]);

  // CRÍTICO: Detectar login durante el wizard y cambiar a modo lista
  useEffect(() => {
    // Detectar cuando usuario hace login desde el wizard:
    // 1. Modal está abierto
    // 2. userId cambió a un valor (ya no es null)
    // 3. Estamos en modo crear
    // 4. Hay vehículos disponibles
    // 5. NO es una creación intencional (click en "Agregar otro vehículo")
    if (
      isOpen && 
      userId && 
      isCreatingNew && 
      userVehicles && 
      userVehicles.length > 0 &&
      !intentionalCreate // ← NUEVO: Solo revertir si NO es intencional
    ) {
      console.log('🔄 Usuario hizo login durante wizard → Cambiar a modo lista de vehículos');
      
      // Resetear datos del formulario de creación (evitar data corrupta)
      setVehicleData({
        category: null,
        brand: null,
        model: null,
        licensePlate: '',
        year: '',
        color: '',
        specifics: {},
      });
      
      // Cambiar a modo selección
      setIsCreatingNew(false);
      setCurrentStep(0); // Volver al primer paso (lista de vehículos)
      setSelectedVehicle(null); // Limpiar selección previa
    }
  }, [userId, isOpen, isCreatingNew, userVehicles, intentionalCreate]);

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
    
    // Crear specifics limpio: solo incluir campos que existen
    const specifics = {};
    if (vehicle.isArmored !== undefined) {
      specifics.isArmored = vehicle.isArmored;
    }
    if (vehicle.truckData && Object.keys(vehicle.truckData).length > 0) {
      specifics.truckData = vehicle.truckData;
    }
    if (vehicle.busData && Object.keys(vehicle.busData).length > 0) {
      specifics.busData = vehicle.busData;
    }
    
    setVehicleData({
      category: vehicle.category,
      brand: vehicle.brand,
      model: vehicle.model,
      licensePlate: vehicle.licensePlate,
      year: vehicle.year,
      color: vehicle.color,
      specifics,
    });

    // 🚀 Avanzar automáticamente al siguiente paso (service details)
    console.log('✅ Vehículo seleccionado, avanzando automáticamente...');
    setCurrentStep(currentStep + 1);
  };

  const handleAddNewVehicle = () => {
    console.log('➕ Usuario hace click en "Agregar otro vehículo"');
    
    // Marcar como creación intencional para evitar que el useEffect lo revierta
    setIntentionalCreate(true);
    
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
          // No validar aquí, el avance es automático al seleccionar
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

  // Función para manejar login exitoso desde el modal
  const handleAuthSuccess = async (userData) => {
    console.log('✅ Usuario autenticado desde wizard:', userData);
    setShowAuthModal(false);
    showSuccess('¡Sesión iniciada! Ahora puedes seleccionar tu vehículo');
    
    // El AuthContext ya actualizó los vehículos
    // El wizard se re-renderiza automáticamente mostrando la lista
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
        
        if (['AUTOS', 'CAMIONETAS', 'ELECTRICOS'].includes(categoryId)) {
          newVehiclePayload.isArmored = vehicleData.specifics?.isArmored || false;
        } else if (categoryId === 'CAMIONES' && vehicleData.specifics?.truckData) {
          // Filtrar solo propiedades con valor
          const validTruckData = Object.keys(vehicleData.specifics.truckData)
            .filter(key => vehicleData.specifics.truckData[key] != null && vehicleData.specifics.truckData[key] !== '')
            .reduce((obj, key) => {
              obj[key] = vehicleData.specifics.truckData[key];
              return obj;
            }, {});
          
          if (Object.keys(validTruckData).length > 0) {
            newVehiclePayload.truckData = validTruckData;
          }
        } else if (categoryId === 'BUSES' && vehicleData.specifics?.busData) {
          // Filtrar solo propiedades con valor
          const validBusData = Object.keys(vehicleData.specifics.busData)
            .filter(key => vehicleData.specifics.busData[key] != null && vehicleData.specifics.busData[key] !== '')
            .reduce((obj, key) => {
              obj[key] = vehicleData.specifics.busData[key];
              return obj;
            }, {});
          
          if (Object.keys(validBusData).length > 0) {
            newVehiclePayload.busData = validBusData;
          }
        }
        const response = await vehicleAPI.createVehicle(newVehiclePayload);
        vehicleId = response.data.data?._id || response.data._id;
        
        // Actualizar lista global de vehículos en el contexto
        await refreshVehicles();
        console.log('✅ Lista de vehículos actualizada en el contexto');
        
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
      } else if (categoryId === 'CAMIONES' && vehicleData.specifics?.truckData) {
        // Filtrar solo propiedades con valor
        const validTruckData = Object.keys(vehicleData.specifics.truckData)
          .filter(key => vehicleData.specifics.truckData[key] != null && vehicleData.specifics.truckData[key] !== '')
          .reduce((obj, key) => {
            obj[key] = vehicleData.specifics.truckData[key];
            return obj;
          }, {});
        
        if (Object.keys(validTruckData).length > 0) {
          vehicleSnapshot.truckData = validTruckData;
        }
      } else if (categoryId === 'BUSES' && vehicleData.specifics?.busData) {
        // Filtrar solo propiedades con valor
        const validBusData = Object.keys(vehicleData.specifics.busData)
          .filter(key => vehicleData.specifics.busData[key] != null && vehicleData.specifics.busData[key] !== '')
          .reduce((obj, key) => {
            obj[key] = vehicleData.specifics.busData[key];
            return obj;
          }, {});
        
        if (Object.keys(validBusData).length > 0) {
          vehicleSnapshot.busData = validBusData;
        }
      }

      // Devolver datos completos: vehículo + servicio
      const completeData = {
        vehicleId, // ID del vehículo (null si usuario no está logueado)
        vehicleSnapshot,
        serviceDetails: {
          problem: serviceDetails.problem.trim(),
          basement: serviceDetails.basement,
          truckCurrentState: serviceDetails.truckCurrentState,
        },
      };

      console.log('✅ Datos completos:', completeData);
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
    setIntentionalCreate(false); // ← NUEVO: Resetear bandera de creación intencional
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
            selectedCategory={vehicleData.category}
            isLoading={isLoading}
          />
        );

      case 'model':
        return (
          <VehicleModelSelector
            models={models}
            onSelect={handleSelectModel}
            selectedModel={vehicleData.model}
            selectedCategory={vehicleData.category}
            selectedBrand={vehicleData.brand}
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
    <>
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
            {/* Botón "Ya tienes cuenta" si no está logueado */}
            {!userId && currentStep === 0 ? (
              <IonButton 
                onClick={() => {
                  console.log('🔐 Usuario quiere iniciar sesión → Abriendo modal de auth');
                  setShowAuthModal(true);
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

    {/* Modal de autenticación */}
    <AuthModal
      isOpen={showAuthModal}
      onDismiss={() => setShowAuthModal(false)}
      onSuccess={handleAuthSuccess}
    />
    </>
  );
};

export default VehicleWizardModal;

