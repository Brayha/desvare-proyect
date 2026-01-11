import { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonText,
  IonSpinner,
} from '@ionic/react';
import { Location } from 'iconsax-react';
import RequestDetailMap from '../components/RequestDetailMap';
import './RequestDetail.css';

// Importar iconos SVG de vehículos
import carIcon from '../../../shared/src/img/vehicles/car.svg';
import motoIcon from '../../../shared/src/img/vehicles/moto.svg';
import camionetaIcon from '../../../shared/src/img/vehicles/camioneta.svg';
import camionIcon from '../../../shared/src/img/vehicles/camion.svg';
import busIcon from '../../../shared/src/img/vehicles/bus.svg';

const RequestDetail = () => {
  const history = useHistory();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [driverPhoto, setDriverPhoto] = useState('https://ionicframework.com/docs/img/demos/avatar.svg');

  const request = location.state?.request;
  const driverLocation = location.state?.driverLocation;

  useEffect(() => {
    // Cargar foto del conductor desde el API
    const loadDriverPhoto = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const response = await fetch(`http://localhost:5001/api/drivers/profile/${parsedUser._id}`);
          const data = await response.json();
          
          if (response.ok && data.driver?.documents?.selfie) {
            setDriverPhoto(data.driver.documents.selfie);
            console.log('✅ Foto del conductor cargada');
          }
        }
      } catch (error) {
        console.error('❌ Error al cargar foto del conductor:', error);
      }
    };

    loadDriverPhoto();

    if (!request || !driverLocation) {
      console.warn('⚠️ No hay datos de la solicitud. Redirigiendo a inicio...');
      setTimeout(() => {
        history.replace('/home');
      }, 1500);
    } else {
      setLoading(false);
    }
  }, [request, driverLocation, history]);

  const getVehicleIcon = (iconEmoji) => {
    const iconMap = {
      '🏍️': motoIcon,
      '🚗': carIcon,
      '🚙': camionetaIcon,
      '🚚': camionIcon,
      '🚌': busIcon,
    };
    return iconMap[iconEmoji] || carIcon;
  };

  const handleSendQuote = () => {
    history.push('/quote-amount', {
      request: request,
      driverLocation: driverLocation
    });
  };

  if (loading || !request || !driverLocation) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '15px' }}>
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p>Cargando detalles...</p>
            </IonText>
            {!request && (
              <IonText color="danger">
                <p>No hay datos de la solicitud - Redirigiendo a inicio...</p>
              </IonText>
            )}
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
            <IonBackButton defaultHref="/home" text="Atrás" />
          </IonButtons>
          <IonTitle>Detalle del servicio</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="request-detail-page">
        {/* Mapa */}
        <div className="map-section">
          <RequestDetailMap
            request={request}
            driverLocation={driverLocation}
          />
        </div>

        {/* Contenido de detalles */}
        <div className="detail-content">
          {/* Información de ubicación del conductor */}
          <div className="user-location-card">
            <div className="user-avatar">
              <img 
                src={driverPhoto} 
                alt="Conductor" 
                onError={(e) => {
                  e.target.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                }}
              />
            </div>
            <div className="user-info">
              <IonText className="user-name">
                <h3>Tu</h3>
              </IonText>
              <IonText color="medium" className="user-address">
                <p>{driverLocation.address || `${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(4)}`}</p>
              </IonText>
            </div>
          </div>

          {/* Origen aproximado */}
          <div className="location-section">
            <Location size="24" variant="Bold" color="#3880ff" />
            <div className="location-text">
              <IonText color="medium" className="location-label">
                Origen aproximado
              </IonText>
              <IonText className="location-address">
                {request.origin.address}
              </IonText>
              <IonText color="medium" className="location-hint">
                <small>La ubicación exacta se oculta para proteger la solicitud</small>
              </IonText>
            </div>
          </div>

          {/* Destino */}
          <div className="location-section">
            <Location size="24" variant="Bold" color="#eb445a" />
            <div className="location-text">
              <IonText color="medium" className="location-label">
                Destino
              </IonText>
              <IonText className="location-address">
                {request.destination.address}
              </IonText>
            </div>
          </div>

          {/* Vehículo y Problema */}
          <div className="vehicle-problem-card">
            <div className="vehicle-info">
              <div className="vehicle-icon">
                <img
                  src={getVehicleIcon(request.vehicle?.icon)}
                  alt={request.vehicle?.category || "Vehículo"}
                  className="vehicle-svg-icon"
                />
              </div>
              <div className="vehicle-details">
                <IonText className="vehicle-brand">
                  <h3>{request.vehicle?.brand || "N/A"}</h3>
                </IonText>
                <IonText color="medium" className="vehicle-model">
                  <p>{request.vehicle?.model || "N/A"}</p>
                </IonText>
                <IonText color="medium" className="vehicle-plate">
                  <p>{request.vehicle?.licensePlate || "N/A"}</p>
                </IonText>
              </div>
              <div className="distance-time-info">
                <IonText className="distance">
                  <strong>{request.durationMin || "N/A"} Min</strong>
                </IonText>
                <IonText color="medium" className="distance-km">
                  {request.distanceKm || "N/A"} km
                </IonText>
              </div>
            </div>

            <div className="problem-section">
              <IonText color="medium" className="section-label">
                Problema
              </IonText>
              <IonText className="problem-text">
                {request.problem || "Sin descripción"}
              </IonText>
            </div>
          </div>

          {/* Botón de enviar cotización */}
          <IonButton
            expand="block"
            onClick={handleSendQuote}
            className="send-quote-button"
            color="primary"
            size="large"
          >
            Enviar cotización
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RequestDetail;
