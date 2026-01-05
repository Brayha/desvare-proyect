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
  IonModal,
  IonList,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonTextarea,
  IonButtons,
  useIonAlert,
} from '@ionic/react';
import { call, chatbubbleEllipses, star, person, location, closeOutline, alertCircleOutline } from 'ionicons/icons';
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
  
  // Estados del modal de cancelación
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Razones de cancelación
  const cancellationReasons = [
    { value: 'resuelto', label: '✅ Ya me desvaré / El carro prendió' },
    { value: 'conductor_no_viene', label: '⏰ El conductor no viene' },
    { value: 'conductor_no_responde', label: '📵 El conductor no responde' },
    { value: 'otra_grua', label: '🚛 Otra grúa me recogió' },
    { value: 'muy_caro', label: '💰 Muy caro' },
    { value: 'muy_lejos', label: '📍 El conductor está muy lejos' },
    { value: 'otro', label: '📝 Otro motivo' }
  ];

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

    // Socket.IO ya está conectado desde App.jsx
    if (!socketService.socket?.connected) {
      console.log('🔌 Conectando Socket.IO...');
      socketService.connect();
    } else {
      console.log('✅ Socket.IO ya conectado');
    }

    return () => {
      console.log('🧹 DriverOnWay - Cleanup');
    };
  }, []);

  const handleCall = () => {
    if (serviceData?.driver?.phone) {
      window.location.href = `tel:${serviceData.driver.phone}`;
    } else {
      showError('No se pudo obtener el teléfono del conductor');
    }
  };

  const handleChat = () => {
    showInfo('Chat próximamente disponible');
  };

  const handleCancelService = async () => {
    console.log('🚨 handleCancelService llamado');
    
    // Confirmación previa
    presentAlert({
      header: '⚠️ ¿Cancelar servicio?',
      message: `<strong>${serviceData.driver?.name || 'El conductor'}</strong> ya viene en camino a recogerte. ¿Estás seguro de que deseas cancelar?`,
      buttons: [
        {
          text: 'No, volver',
          role: 'cancel',
          handler: () => {
            console.log('❌ Usuario decidió no cancelar');
          }
        },
        {
          text: 'Sí, cancelar',
          role: 'confirm',
          handler: () => {
            console.log('✅ Usuario confirmó, abriendo modal de razones');
            setShowCancellationModal(true);
          }
        }
      ]
    });
  };

  const handleCallFromModal = () => {
    console.log('📞 Llamando al conductor desde modal');
    if (serviceData?.driver?.phone) {
      window.location.href = `tel:${serviceData.driver.phone}`;
      // Cerrar modal después de iniciar la llamada
      setTimeout(() => {
        setShowCancellationModal(false);
        setSelectedReason('');
        setCustomReason('');
      }, 500);
    }
  };

  const handleConfirmCancellation = () => {
    console.log('📝 Confirmando cancelación con razón:', selectedReason);
    
    const cancellationData = {
      reason: selectedReason,
      customReason: selectedReason === 'otro' ? customReason : null
    };

    // Cerrar modal
    setShowCancellationModal(false);
    
    // ✅ Limpiar TODO completamente
    localStorage.removeItem('activeService');
    localStorage.removeItem('currentRequestId');
    localStorage.removeItem('requestData');
    localStorage.removeItem('quotesReceived');
    
    // Notificar al backend y al conductor con el método correcto
    socketService.cancelServiceWithDetails({ 
      requestId: serviceData.requestId,
      reason: cancellationData.reason,
      customReason: cancellationData.customReason,
      clientName: serviceData.clientName,
      vehicle: serviceData.vehicle,
      origin: serviceData.origin,
      destination: serviceData.destination,
      problem: serviceData.problem
    });
    
    // Reset estados
    setSelectedReason('');
    setCustomReason('');
    
    showSuccess('Servicio cancelado');
    
    // ✅ Forzar navegación limpia sin conflictos de estado
    // Usamos window.location en lugar de history.replace() para evitar
    // conflictos con componentes montados (WaitingQuotes)
    window.location.href = '/home';
  };

  const handleCloseModal = () => {
    console.log('❌ Cerrando modal de cancelación');
    setShowCancellationModal(false);
    setSelectedReason('');
    setCustomReason('');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isConfirmDisabled = !selectedReason || (selectedReason === 'otro' && !customReason.trim());

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
        {/* Mapa con tracking en tiempo real */}
        <div className="map-container-tracking">
          <MapPicker
            origin={serviceData.origin}
            destination={null}
            onRouteCalculated={() => {}}
            quotes={driverLocation ? [{
              driverId: serviceData.driver?.id,
              driverName: serviceData.driver?.name,
              location: driverLocation,
              amount: serviceData.amount
            }] : []}
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

      {/* Modal de Cancelación - INLINE SIMPLE */}
      <IonModal 
        isOpen={showCancellationModal} 
        onDidDismiss={handleCloseModal}
        backdropDismiss={false}
      >
        <IonHeader>
          <IonToolbar color="danger">
            <IonTitle>
              <IonIcon icon={alertCircleOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Cancelar Servicio
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleCloseModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          {/* Botón para llamar antes de cancelar */}
          {serviceData?.driver?.phone && (
            <IonButton 
              expand="block" 
              fill="outline"
              color="primary"
              onClick={handleCallFromModal}
              style={{ marginBottom: '20px' }}
            >
              <IonIcon icon={call} slot="start" />
              Llamar a {serviceData.driver.name || 'conductor'} antes de cancelar
            </IonButton>
          )}

          <IonText color="medium">
            <p style={{ marginBottom: '16px' }}>
              ¿Por qué deseas cancelar el servicio?
            </p>
          </IonText>

          <IonRadioGroup 
            value={selectedReason} 
            onIonChange={(e) => {
              console.log('📝 Razón seleccionada:', e.detail.value);
              setSelectedReason(e.detail.value);
            }}
          >
            <IonList>
              {cancellationReasons.map((reason) => (
                <IonItem key={reason.value} lines="none" style={{ marginBottom: '8px' }}>
                  <IonRadio slot="start" value={reason.value} />
                  <IonLabel>{reason.label}</IonLabel>
                </IonItem>
              ))}
            </IonList>
          </IonRadioGroup>

          {/* Campo de texto para "Otro motivo" */}
          {selectedReason === 'otro' && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
              <IonText color="medium">
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                  Por favor, describe el motivo:
                </p>
              </IonText>
              <IonTextarea
                value={customReason}
                onIonInput={(e) => setCustomReason(e.detail.value)}
                placeholder="Escribe aquí..."
                rows={4}
                maxlength={200}
                style={{ 
                  background: '#fff', 
                  borderRadius: '8px', 
                  padding: '8px',
                  border: '1px solid #ddd'
                }}
              />
              <IonText color="medium">
                <p style={{ fontSize: '12px', textAlign: 'right', marginTop: '4px' }}>
                  {customReason.length}/200
                </p>
              </IonText>
            </div>
          )}

          {/* Botones de acción */}
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <IonButton 
              expand="block" 
              color="danger"
              onClick={handleConfirmCancellation}
              disabled={isConfirmDisabled}
              size="large"
            >
              Confirmar Cancelación
            </IonButton>

            <IonButton 
              expand="block" 
              fill="outline"
              color="medium"
              onClick={handleCloseModal}
            >
              Volver
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default DriverOnWay;
