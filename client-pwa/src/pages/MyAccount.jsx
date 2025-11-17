import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonAvatar,
  IonSpinner,
} from '@ionic/react';
import {
  personCircleOutline,
  phonePortraitOutline,
  mailOutline,
  carOutline,
  exitOutline,
  logInOutline,
} from 'ionicons/icons';
import { Button } from '@components';
import AuthModal from '../components/AuthModal/AuthModal';
import socketService from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@hooks/useToast';
import './MyAccount.css';

const MyAccount = () => {
  const history = useHistory();
  const { showSuccess } = useToast();
  const { user, isLoggedIn, vehicles, isLoadingVehicles, login, logout } = useAuth();
  
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Si no está logueado, mostrar modal de autenticación
    if (!isLoggedIn) {
      setShowAuthModal(true);
    }
  }, [isLoggedIn]);

  const handleAuthSuccess = async (userData) => {
    console.log('✅ Usuario autenticado:', userData);
    await login(userData);
    setShowAuthModal(false);
    showSuccess('¡Bienvenido!');
  };

  const handleAuthModalDismiss = () => {
    setShowAuthModal(false);
    // Si el usuario cierra el modal sin loguearse, redirigir a tab de Desvare
    if (!isLoggedIn) {
      history.replace('/tabs/desvare');
    }
  };

  const handleLogout = () => {
    console.log('👋 Cerrando sesión...');

    // Limpiar listeners de Socket.IO
    socketService.offQuoteReceived();

    // Usar el logout del contexto (limpia todo)
    logout();

    // Redirigir a home
    history.replace('/home');
  };

  // Vista cuando NO está logueado (se muestra el modal automáticamente)
  if (!isLoggedIn) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Mi cuenta</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding my-account-page">
          <div className="empty-state">
            <IonIcon icon={logInOutline} className="empty-icon" />
            <IonText>
              <h2>Inicia sesión</h2>
              <p>Accede a tu cuenta para ver tu perfil y gestionar tus vehículos</p>
            </IonText>
            <Button expand="block" onClick={() => setShowAuthModal(true)}>
              Iniciar sesión / Registrarse
            </Button>
          </div>

          <AuthModal
            isOpen={showAuthModal}
            onDismiss={handleAuthModalDismiss}
            onSuccess={handleAuthSuccess}
          />
        </IonContent>
      </IonPage>
    );
  }

  // Vista cuando SÍ está logueado
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mi cuenta</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding my-account-page">
        {/* Avatar y nombre */}
        <div className="profile-header">
          <IonAvatar className="profile-avatar">
            <IonIcon icon={personCircleOutline} />
          </IonAvatar>
          <IonText>
            <h1 className="profile-name">{user?.name || 'Usuario'}</h1>
            <p className="profile-subtitle">Cliente Desvare</p>
          </IonText>
        </div>

        {/* Información del usuario */}
        <IonCard className="profile-card">
          <IonCardHeader>
            <IonCardTitle>Información personal</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonIcon icon={personCircleOutline} slot="start" color="primary" />
                <IonLabel>
                  <p>Nombre</p>
                  <h2>{user?.name || 'N/A'}</h2>
                </IonLabel>
              </IonItem>

              <IonItem>
                <IonIcon icon={phonePortraitOutline} slot="start" color="primary" />
                <IonLabel>
                  <p>Teléfono</p>
                  <h2>{user?.phone || 'N/A'}</h2>
                </IonLabel>
              </IonItem>

              {user?.email && (
                <IonItem>
                  <IonIcon icon={mailOutline} slot="start" color="primary" />
                  <IonLabel>
                    <p>Email</p>
                    <h2>{user.email}</h2>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Mis Vehículos */}
        <IonCard className="vehicles-card">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={carOutline} style={{ marginRight: '8px' }} />
              Mis Vehículos
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {isLoadingVehicles ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <IonText color="medium">Cargando vehículos...</IonText>
              </div>
            ) : vehicles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <IonText color="medium">
                  <p>No tienes vehículos guardados</p>
                  <p style={{ fontSize: '0.9em', marginTop: '8px' }}>
                    Los vehículos se guardan automáticamente cuando solicitas un servicio
                  </p>
                </IonText>
              </div>
            ) : (
              <IonList lines="full">
                {vehicles.map((vehicle) => (
                  <IonItem key={vehicle._id}>
                    <IonIcon icon={carOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h2>{vehicle.brand?.name || 'N/A'} {vehicle.model?.name || ''}</h2>
                      <p>Placa: {vehicle.licensePlate || 'N/A'}</p>
                      <p>Categoría: {vehicle.category?.name || 'N/A'}</p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        {/* Cerrar Sesión */}
        <IonCard className="actions-card">
          <IonCardContent>
            <Button
              expand="block"
              variant="danger"
              onClick={handleLogout}
              className="action-button logout-button"
            >
              <IonIcon icon={exitOutline} slot="start" />
              Cerrar sesión
            </Button>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default MyAccount;

