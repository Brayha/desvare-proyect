import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonSpinner,
  IonBadge,
  IonActionSheet,
  IonAlert,
} from '@ionic/react';
import {
  arrowBack,
  addOutline,
  carOutline,
  ellipsisVertical,
  createOutline,
  trashOutline,
  checkmarkCircle,
} from 'ionicons/icons';
import { Button } from '@components';
import VehicleWizardModal from '../components/VehicleWizardModal/VehicleWizardModal';
import { vehicleAPI } from '../services/vehicleAPI';
import { useToast } from '@hooks/useToast';
import './MyGarage.css';

const MyGarage = () => {
  const history = useHistory();
  const { showSuccess, showError, showWarning } = useToast();

  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  useEffect(() => {
    loadUserAndVehicles();
  }, []);

  const loadUserAndVehicles = async () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      showError('Debes iniciar sesión para ver tu garaje');
      history.replace('/tabs/my-account');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    await loadVehicles(parsedUser.id);
  };

  const loadVehicles = async (userId) => {
    setIsLoading(true);
    try {
      const response = await vehicleAPI.getUserVehicles(userId);
      const vehiclesData = response.data?.data || [];
      setVehicles(vehiclesData);
      console.log('✅ Vehículos cargados:', vehiclesData.length);
    } catch (error) {
      console.error('❌ Error cargando vehículos:', error);
      showError('Error al cargar tus vehículos');
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVehicle = () => {
    setShowWizardModal(true);
  };

  const handleWizardComplete = async (data) => {
    console.log('✅ Vehículo agregado:', data);
    setShowWizardModal(false);
    showSuccess('Vehículo agregado a tu garaje');
    // Recargar lista
    if (user) {
      await loadVehicles(user.id);
    }
  };

  const handleVehicleOptions = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowActionSheet(true);
  };

  const handleEditVehicle = () => {
    showWarning('Función de edición próximamente');
    // TODO: Implementar edición en siguiente paso
  };

  const handleDeleteVehicle = () => {
    setVehicleToDelete(selectedVehicle);
    setShowDeleteAlert(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    try {
      await vehicleAPI.deleteVehicle(vehicleToDelete._id);
      showSuccess('Vehículo eliminado');
      
      // Recargar lista
      if (user) {
        await loadVehicles(user.id);
      }
    } catch (error) {
      console.error('❌ Error eliminando vehículo:', error);
      showError('Error al eliminar vehículo');
    } finally {
      setVehicleToDelete(null);
      setShowDeleteAlert(false);
    }
  };

  const getVehicleIcon = (categoryId) => {
    // Aquí podrías importar iconos específicos por categoría
    return carOutline;
  };

  const getVehicleBadge = (vehicle) => {
    if (vehicle.isArmored) return { text: 'Blindado', color: 'warning' };
    if (vehicle.truckData) return { text: 'Camión', color: 'primary' };
    if (vehicle.busData) return { text: 'Bus', color: 'success' };
    return null;
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => history.goBack()}>
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Mi Garaje</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Cargando vehículos...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Mi Garaje</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleAddVehicle}>
              <IonIcon icon={addOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="my-garage-page">
        <div className="garage-header">
          <IonText>
            <h2>Mis Vehículos</h2>
            <p>{vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''} guardado{vehicles.length !== 1 ? 's' : ''}</p>
          </IonText>
        </div>

        {vehicles.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={carOutline} className="empty-icon" />
            <IonText>
              <h3>No tienes vehículos</h3>
              <p>Agrega tu primer vehículo para empezar a solicitar servicios más rápido</p>
            </IonText>
            <Button expand="block" onClick={handleAddVehicle} className="add-first-vehicle-btn">
              <IonIcon icon={addOutline} slot="start" />
              Agregar vehículo
            </Button>
          </div>
        ) : (
          <IonList className="vehicles-list">
            {vehicles.map((vehicle) => {
              const badge = getVehicleBadge(vehicle);
              return (
                <IonCard key={vehicle._id} className="vehicle-card">
                  <IonCardContent>
                    <div className="vehicle-card-content">
                      <div className="vehicle-icon-container">
                        <IonIcon icon={getVehicleIcon(vehicle.category?.id)} className="vehicle-icon" />
                      </div>
                      
                      <div className="vehicle-info">
                        <div className="vehicle-header">
                          <IonText>
                            <h3 className="vehicle-name">
                              {vehicle.brand?.name} {vehicle.model?.name}
                            </h3>
                          </IonText>
                          {badge && (
                            <IonBadge color={badge.color} className="vehicle-badge">
                              {badge.text}
                            </IonBadge>
                          )}
                        </div>
                        
                        <IonText className="vehicle-details">
                          <p>
                            <strong>Placa:</strong> {vehicle.licensePlate}
                          </p>
                          <p>
                            <strong>Categoría:</strong> {vehicle.category?.name}
                          </p>
                          {vehicle.year && (
                            <p>
                              <strong>Año:</strong> {vehicle.year}
                            </p>
                          )}
                          {vehicle.color && (
                            <p>
                              <strong>Color:</strong> {vehicle.color}
                            </p>
                          )}
                        </IonText>
                      </div>

                      <IonButton
                        fill="clear"
                        onClick={() => handleVehicleOptions(vehicle)}
                        className="options-button"
                      >
                        <IonIcon icon={ellipsisVertical} />
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })}
          </IonList>
        )}

        {vehicles.length > 0 && (
          <div className="garage-footer">
            <Button expand="block" onClick={handleAddVehicle} variant="outline">
              <IonIcon icon={addOutline} slot="start" />
              Agregar otro vehículo
            </Button>
          </div>
        )}
      </IonContent>

      {/* Wizard Modal */}
      <VehicleWizardModal
        isOpen={showWizardModal}
        onDismiss={() => setShowWizardModal(false)}
        onComplete={handleWizardComplete}
        userId={user?.id}
        skipServiceDetails={true} // No preguntar detalles del servicio en Mi Garaje
      />

      {/* Action Sheet */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header={`${selectedVehicle?.brand?.name} ${selectedVehicle?.model?.name}`}
        buttons={[
          {
            text: 'Editar',
            icon: createOutline,
            handler: handleEditVehicle,
          },
          {
            text: 'Eliminar',
            icon: trashOutline,
            role: 'destructive',
            handler: handleDeleteVehicle,
          },
          {
            text: 'Cancelar',
            role: 'cancel',
          },
        ]}
      />

      {/* Delete Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Eliminar vehículo"
        message={`¿Estás seguro de eliminar ${vehicleToDelete?.brand?.name} ${vehicleToDelete?.model?.name}?`}
        buttons={[
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Eliminar',
            role: 'destructive',
            handler: confirmDeleteVehicle,
          },
        ]}
      />
    </IonPage>
  );
};

export default MyGarage;

