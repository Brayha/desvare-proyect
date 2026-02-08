import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonIcon,
  IonBadge,
  IonSpinner,
} from '@ionic/react';
import { 
  personOutline, 
  callOutline, 
  mailOutline, 
  locationOutline,
  starOutline,
  cashOutline,
  logOutOutline,
  carSportOutline
} from 'ionicons/icons';
import socketService from '../services/socket';
import './Profile.css';

// ============================================
// API URL Configuration
// ============================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Profile = () => {
  const history = useHistory();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      history.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Cargar perfil completo
    loadProfile(parsedUser._id);
  }, [history]);

  const loadProfile = async (driverId) => {
    try {
      const response = await fetch(`${API_URL}/api/drivers/profile/${driverId}`);
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.driver);
      } else {
        console.error('Error al cargar perfil:', data);
      }
    } catch (error) {
      console.error('❌ Error al cargar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('hasSeenLocationModal');
    socketService.disconnect();
    history.push('/login');
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Mi Perfil</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
          <IonText>
            <p>Cargando perfil...</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  if (!profile) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Mi Perfil</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText color="danger">
            <p>Error al cargar el perfil</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Mi Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding profile-content">
        {/* Avatar y nombre */}
        <div className="profile-header">
          <img 
            src={profile.documents?.selfie || 'https://ionicframework.com/docs/img/demos/avatar.svg'} 
            alt={profile.name}
            className="profile-avatar"
          />
          <IonText>
            <h2>{profile.name}</h2>
          </IonText>
          <IonBadge color={profile.status === 'approved' ? 'success' : 'warning'}>
            {profile.status === 'approved' ? 'Aprobado' : profile.status}
          </IonBadge>
        </div>

        {/* Información personal */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Información Personal</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonIcon icon={personOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Nombre</h3>
                <p>{profile.name}</p>
              </IonLabel>
            </IonItem>

            <IonItem lines="none">
              <IonIcon icon={callOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Teléfono</h3>
                <p>{profile.phone}</p>
              </IonLabel>
            </IonItem>

            {profile.email && (
              <IonItem lines="none">
                <IonIcon icon={mailOutline} slot="start" color="primary" />
                <IonLabel>
                  <h3>Email</h3>
                  <p>{profile.email}</p>
                </IonLabel>
              </IonItem>
            )}

            <IonItem lines="none">
              <IonIcon icon={locationOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Ciudad</h3>
                <p>{profile.city}</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Estadísticas */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Estadísticas</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonIcon icon={starOutline} slot="start" color="warning" />
              <IonLabel>
                <h3>Calificación</h3>
                <p>{profile.rating.toFixed(1)} ⭐</p>
              </IonLabel>
            </IonItem>

            <IonItem lines="none">
              <IonIcon icon={carSportOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Servicios Completados</h3>
                <p>{profile.totalServices}</p>
              </IonLabel>
            </IonItem>

            <IonItem lines="none">
              <IonIcon icon={cashOutline} slot="start" color="success" />
              <IonLabel>
                <h3>Ganancias Totales</h3>
                <p>${profile.totalEarnings.toLocaleString()}</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Capacidades */}
        {profile.vehicleCapabilities && profile.vehicleCapabilities.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Capacidades</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="capabilities-badges">
                {profile.vehicleCapabilities.map((cap, index) => (
                  <IonBadge key={index} color="primary" className="capability-badge">
                    {cap}
                  </IonBadge>
                ))}
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Grúa */}
        {profile.towTruck && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Mi Grúa</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p><strong>Marca:</strong> {profile.towTruck.brand}</p>
                <p><strong>Modelo:</strong> {profile.towTruck.model}</p>
                <p><strong>Placa:</strong> {profile.towTruck.licensePlate}</p>
                {profile.towTruck.year && <p><strong>Año:</strong> {profile.towTruck.year}</p>}
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        {/* Botón de cerrar sesión */}
        <IonButton 
          expand="block" 
          color="danger" 
          onClick={handleLogout}
          className="logout-button"
        >
          <IonIcon icon={logOutOutline} slot="start" />
          Cerrar Sesión
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Profile;

