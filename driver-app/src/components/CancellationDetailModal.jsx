import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon,
} from '@ionic/react';
import { closeCircleOutline, carOutline, personOutline, timeOutline } from 'ionicons/icons';
import './CancellationDetailModal.css';

const CancellationDetailModal = ({ isOpen, onDismiss, cancellationData }) => {
  if (!cancellationData) return null;

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

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="cancellation-modal">
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>
            <IonIcon icon={closeCircleOutline} style={{ marginRight: '8px' }} />
            Servicio Cancelado
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding cancellation-content">
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
                  {cancellationData.vehicle?.brand} {cancellationData.vehicle?.model}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Placa:</span>
                <span className="detail-value">{cancellationData.vehicle?.licensePlate}</span>
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

        {/* Detalle del Cliente */}
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
              <div className="detail-row">
                <span className="detail-label">Origen:</span>
                <span className="detail-value">{cancellationData.origin?.address}</span>
              </div>
              {cancellationData.destination && (
                <div className="detail-row">
                  <span className="detail-label">Destino:</span>
                  <span className="detail-value">{cancellationData.destination.address}</span>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        {/* Información Adicional */}
        <div className="info-box">
          <IonText color="medium">
            <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
              💡 <strong>Nota:</strong> Este servicio ha sido removido de tu bandeja. 
              Continúas activo para recibir nuevas solicitudes.
            </p>
          </IonText>
        </div>

        {/* Botón de Cierre */}
        <IonButton 
          expand="block" 
          onClick={onDismiss}
          color="primary"
          className="close-button"
          size="large"
        >
          Entendido
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default CancellationDetailModal;
