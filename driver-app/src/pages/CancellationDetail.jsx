import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { closeCircleOutline, carOutline, personOutline, timeOutline, homeOutline } from 'ionicons/icons';
import './CancellationDetail.css';

const CancellationDetail = () => {
  const history = useHistory();
  const [cancellationData, setCancellationData] = useState(null);

  useEffect(() => {
    console.log('📋 CancellationDetail - Cargando datos...');
    
    // Cargar datos de cancelación desde localStorage
    const data = localStorage.getItem('lastCancellation');
    
    if (!data) {
      console.log('⚠️ No hay datos de cancelación, redirigiendo a home');
      history.replace('/home');
      return;
    }

    try {
      const parsed = JSON.parse(data);
      console.log('✅ Datos de cancelación cargados:', parsed);
      setCancellationData(parsed);
    } catch (error) {
      console.error('❌ Error parseando datos de cancelación:', error);
      history.replace('/home');
    }
  }, [history]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      day: '2-digit',
      month: 'short',
    }).toUpperCase();
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      'resuelto': '✅ Ya me desvaré / El carro prendió',
      'conductor_no_viene': '⏰ El conductor no viene',
      'conductor_no_responde': '📵 El conductor no responde',
      'otra_grua': '🚛 Otra grúa me recogió',
      'muy_caro': '💰 Muy caro',
      'muy_lejos': '📍 El conductor está muy lejos',
      'otro': '📝 Otro motivo'
    };
    return reasons[reason] || `❓ ${reason}`;
  };

  const handleGoHome = () => {
    // Limpiar datos de cancelación
    localStorage.removeItem('lastCancellation');
    history.replace('/home');
  };

  if (!cancellationData) {
    return null;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>
            <IonIcon icon={closeCircleOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Servicio Cancelado
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="cancellation-detail-page">
        {/* Razón de Cancelación */}
        <div className="cancellation-reason-section">
          <IonText color="danger">
            <h2 className="section-title">🚫 Razón de Cancelación</h2>
          </IonText>
          <IonCard className="reason-card">
            <IonCardContent>
              <p className="reason-main">{getReasonLabel(cancellationData.reason)}</p>
              {cancellationData.customReason && (
                <div className="custom-reason-container">
                  <IonText color="medium">
                    <p className="custom-reason-label">Comentario adicional:</p>
                  </IonText>
                  <p className="custom-reason-text">"{cancellationData.customReason}"</p>
                </div>
              )}
              <div className="cancellation-time">
                <IonIcon icon={timeOutline} />
                <span>{formatTime(cancellationData.cancelledAt || new Date())}</span>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Detalle del Vehículo */}
        {cancellationData.vehicle && (
          <div className="vehicle-section">
            <IonText color="medium">
              <h3 className="section-subtitle">
                <IonIcon icon={carOutline} /> Vehículo
              </h3>
            </IonText>
            <IonCard>
              <IonCardContent className="detail-card">
                <div className="detail-row">
                  <span className="detail-label">Marca/Modelo:</span>
                  <span className="detail-value">
                    {cancellationData.vehicle?.brand || 'N/A'} {cancellationData.vehicle?.model || 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Placa:</span>
                  <span className="detail-value">{cancellationData.vehicle?.licensePlate || 'N/A'}</span>
                </div>
                {cancellationData.problem && (
                  <div className="detail-row">
                    <span className="detail-label">Problema:</span>
                    <span className="detail-value">{cancellationData.problem}</span>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Detalle del Cliente */}
        {cancellationData.clientName && (
          <div className="client-section">
            <IonText color="medium">
              <h3 className="section-subtitle">
                <IonIcon icon={personOutline} /> Cliente
              </h3>
            </IonText>
            <IonCard>
              <IonCardContent className="detail-card">
                <div className="detail-row">
                  <span className="detail-label">Nombre:</span>
                  <span className="detail-value">{cancellationData.clientName}</span>
                </div>
                {cancellationData.origin?.address && (
                  <div className="detail-row">
                    <span className="detail-label">Origen:</span>
                    <span className="detail-value">{cancellationData.origin.address}</span>
                  </div>
                )}
                {cancellationData.destination?.address && (
                  <div className="detail-row">
                    <span className="detail-label">Destino:</span>
                    <span className="detail-value">{cancellationData.destination.address}</span>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Información Adicional */}
        <div className="info-box">
          <IonText color="medium">
            <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
              💡 <strong>Nota:</strong> Este servicio ha sido removido de tu bandeja. 
              Continúas activo para recibir nuevas solicitudes.
            </p>
          </IonText>
        </div>

        {/* Botón Volver al Home */}
        <IonButton 
          expand="block" 
          onClick={handleGoHome}
          color="primary"
          className="home-button"
          size="large"
        >
          <IonIcon icon={homeOutline} slot="start" />
          Volver a la Bandeja
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default CancellationDetail;

