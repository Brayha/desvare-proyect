import { 
  IonCard, 
  IonCardContent, 
  IonIcon, 
  IonText, 
  IonButton, 
  IonBadge 
} from '@ionic/react';
import { locateOutline, locationOutline } from 'ionicons/icons';
import './RequestCard.css';

const RequestCard = ({ request, onQuote }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  };

  // Estado de la card (Nuevo, Cotizada, Aprobada)
  const getStatusBadge = () => {
    if (request.status === 'accepted') {
      return <IonBadge color="success">Aprobada</IonBadge>;
    }
    if (request.quotesCount > 0) {
      return <IonBadge color="warning">Cotizada</IonBadge>;
    }
    return <IonBadge color="primary">Nuevo</IonBadge>;
  };

  return (
    <IonCard className="request-card">
      <IonCardContent>
        {/* Header: Hora y Estado */}
        <div className="card-header">
          <IonText color="medium" className="time">
            {formatTime(request.timestamp)}
          </IonText>
          {getStatusBadge()}
        </div>

        {/* Vehículo */}
        <div className="vehicle-info">
          <div className="vehicle-icon">
            <span className="vehicle-emoji">{request.vehicle?.icon || '🚗'}</span>
          </div>
          <div className="vehicle-details">
            <IonText className="vehicle-model">
              <strong>{request.vehicle?.brand || 'N/A'} {request.vehicle?.model || 'N/A'}</strong>
            </IonText>
            <IonText className="vehicle-plate" color="medium">
              {request.vehicle?.licensePlate || 'N/A'}
            </IonText>
          </div>
          <div className="distance-info">
            <IonText className="distance">
              <strong>{request.durationMin || 'N/A'} MIN</strong>
            </IonText>
            <IonText className="distance-km" color="medium">
              {request.distanceKm || 'N/A'} km
            </IonText>
          </div>
        </div>

        {/* Problema */}
        <div className="problem-section">
          <IonText color="medium" className="section-label">
            Problema
          </IonText>
          <IonText className="problem-text">
            {request.problem || 'Sin descripción'}
          </IonText>
        </div>

        {/* Origen */}
        <div className="location-section">
          <IonIcon icon={locateOutline} color="primary" />
          <div className="location-text">
            <IonText color="medium" className="location-label">
              Origen aproximado
            </IonText>
            <IonText className="location-address">
              {request.origin.address}
            </IonText>
          </div>
        </div>

        {/* Destino */}
        <div className="location-section">
          <IonIcon icon={locationOutline} color="danger" />
          <div className="location-text">
            <IonText color="medium" className="location-label">
              Destino
            </IonText>
            <IonText className="location-address">
              {request.destination.address}
            </IonText>
          </div>
        </div>

        {/* Botón Cotizar */}
        {request.status === 'pending' && (
          <IonButton 
            expand="block" 
            onClick={() => onQuote(request)}
            className="quote-button"
            color="primary"
          >
            Cotizar
          </IonButton>
        )}

        {request.status === 'quoted' && request.quotesCount > 0 && (
          <IonButton 
            expand="block" 
            color="medium"
            disabled
          >
            Cotizada ({request.quotesCount} cotizaciones)
          </IonButton>
        )}

        {request.status === 'accepted' && (
          <IonButton 
            expand="block" 
            color="success"
            onClick={() => onQuote(request)}
          >
            Aprobada - Ver Detalle
          </IonButton>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default RequestCard;

