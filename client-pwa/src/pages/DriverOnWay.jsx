import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonLabel,
  useIonAlert,
} from '@ionic/react';
import { call, chatbubbleEllipses, star, person, location, home, personOutline } from 'ionicons/icons';
import { MapPicker } from '../components/Map/MapPicker';
import { useToast } from '@hooks/useToast';
import socketService from '../services/socket';
import './DriverOnWay.css';

const DriverOnWay = () => {
  const history = useHistory();
  const { showSuccess, showError, showInfo } = useToast();
  const [presentAlert] = useIonAlert();
  
  const [serviceData, setServiceData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState('Calculando...');

  useEffect(() => {
    console.log('🔄 DriverOnWay - Inicializando...');
    
    // Cargar datos del servicio aceptado
    const activeServiceData = localStorage.getItem('activeService');
    
    if (!activeServiceData) {
      showError('No se encontraron datos del servicio');
      history.push('/home');
      return;
    }

    const parsedData = JSON.parse(activeServiceData);
    console.log('📦 Servicio activo cargado:', parsedData);
    
    setServiceData(parsedData);
    setIsLoading(false);

    // Socket.IO ya está conectado desde App.jsx, solo reutilizamos
    if (!socketService.socket?.connected) {
      console.log('🔌 Conectando Socket.IO...');
      socketService.connect();
    } else {
      console.log('✅ Socket.IO ya conectado');
    }
    
    // TODO: Implementar tracking en tiempo real
    // socketService.onDriverLocationUpdate((location) => {
    //   setDriverLocation(location);
    //   // Actualizar tiempo estimado
    // });

    return () => {
      console.log('🧹 DriverOnWay - Cleanup');
      // No desconectar socket aquí para mantener la sesión
    };
  }, []); // ✅ Array vacío para ejecutar solo una vez

  const handleCall = () => {
    if (serviceData?.driver?.phone) {
      window.location.href = `tel:${serviceData.driver.phone}`;
    } else {
      showError('No se pudo obtener el teléfono del conductor');
    }
  };

  const handleChat = () => {
    showInfo('Chat próximamente disponible');
    // TODO: Navegar a chat
  };

  const handleCancelService = () => {
    presentAlert({
      header: '¿Cancelar servicio?',
      message: 'El conductor ya está en camino. ¿Estás seguro de que deseas cancelar el servicio?',
      buttons: [
        {
          text: 'No, continuar',
          role: 'cancel'
        },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: () => {
            // Limpiar datos del servicio
            localStorage.removeItem('activeService');
            localStorage.removeItem('currentRequestId');
            
            // TODO: Notificar al backend y al conductor
            // socketService.emit('service:cancel', { requestId: serviceData.requestId });
            
            showSuccess('Servicio cancelado');
            history.push('/home');
          }
        }
      ]
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading || !serviceData) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="driver-on-way-page" fullscreen>
        {/* Mapa con tracking en tiempo real - SOLO origen + conductor */}
        <div className="map-container-tracking">
          <MapPicker
            origin={serviceData.origin}
            destination={null} // ✅ Sin destino para no trazar ruta
            onRouteCalculated={() => {}}
            quotes={driverLocation ? [{
              driverId: serviceData.driver?.id,
              driverName: serviceData.driver?.name,
              location: driverLocation,
              amount: serviceData.amount
            }] : []} // Mostrar conductor cuando tengamos ubicación en tiempo real
            onQuoteClick={null}
          />

          {/* Overlay con info del conductor */}
          <div className="driver-info-overlay">
            <IonCard className="driver-card">
              <IonCardContent>
                <div className="driver-header-compact">
                  <div className="driver-avatar-small">
                    {serviceData.driver?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="driver-details">
                    <h3>{serviceData.driver?.name}</h3>
                    <div className="driver-meta">
                      <IonIcon icon={star} className="star-icon" />
                      <span>{serviceData.driver?.rating || '4.8'}</span>
                      <span className="separator">•</span>
                      <span>{serviceData.driver?.totalServices || '0'} servicios</span>
                    </div>
                  </div>
                </div>

                <div className="eta-section">
                  <IonIcon icon={location} className="eta-icon" />
                  <div className="eta-info">
                    <p className="eta-label">Llegada estimada</p>
                    <p className="eta-time">{estimatedTime}</p>
                  </div>
                </div>

                <div className="action-buttons">
                  <IonButton 
                    expand="block" 
                    onClick={handleCall}
                    className="call-button"
                  >
                    <IonIcon icon={call} slot="start" />
                    Llamar
                  </IonButton>
                  <IonButton 
                    expand="block" 
                    fill="outline"
                    onClick={handleChat}
                    className="chat-button"
                  >
                    <IonIcon icon={chatbubbleEllipses} slot="start" />
                    Chat
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </div>

        {/* Información del servicio */}
        <div className="service-info-section">
          <div className="security-code-container">
            <IonText color="medium">
              <p className="code-label">🔒 Código de Seguridad</p>
            </IonText>
            <div className="security-code">
              {serviceData.securityCode?.split('').map((digit, index) => (
                <div key={index} className="code-digit">
                  {digit}
                </div>
              ))}
            </div>
            <IonText color="medium">
              <p className="code-instruction">
                Dale este código al conductor cuando llegue
              </p>
            </IonText>
          </div>

          <div className="service-details">
            <div className="detail-row">
              <span className="detail-label">Monto acordado</span>
              <span className="detail-value">{formatAmount(serviceData.amount)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Grúa</span>
              <span className="detail-value">
                {serviceData.driver?.towTruck?.type || 'Grúa'} • 
                {serviceData.driver?.towTruck?.licensePlate || 'N/A'}
              </span>
            </div>
          </div>

          <IonButton 
            expand="block" 
            fill="clear" 
            color="danger"
            onClick={handleCancelService}
            className="cancel-service-button"
          >
            Cancelar Servicio
          </IonButton>
        </div>
      </IonContent>

      {/* Footer con Tabs de Navegación */}
      <IonFooter className="driver-on-way-footer">
        <IonTabBar>
          <IonTabButton tab="home" href="/driver-on-way" selected={true}>
            <IonIcon icon={home} />
            <IonLabel>Desvare</IonLabel>
          </IonTabButton>
          
          <IonTabButton tab="account" href="/my-account">
            <IonIcon icon={personOutline} />
            <IonLabel>Mi cuenta</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonFooter>
    </IonPage>
  );
};

export default DriverOnWay;
