import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
  IonButton,
  IonBadge,
} from "@ionic/react";
import { Location } from "iconsax-react";
import "./RequestCard.css";

// Importar iconos SVG de vehículos
import carIcon from "../../../shared/src/img/vehicles/car.svg";
import motoIcon from "../../../shared/src/img/vehicles/moto.svg";
import camionetaIcon from "../../../shared/src/img/vehicles/camioneta.svg";
import camionIcon from "../../../shared/src/img/vehicles/camion.svg";
import busIcon from "../../../shared/src/img/vehicles/bus.svg";

const RequestCard = ({ request, onQuote, myQuote }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date
      .toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase();
  };

  // Función para obtener el icono SVG según el emoji
  const getVehicleIcon = (iconEmoji) => {
    const iconMap = {
      "🏍️": motoIcon,
      "🚗": carIcon,
      "🚙": camionetaIcon,
      "🚚": camionIcon,
      "🚌": busIcon,
    };
    return iconMap[iconEmoji] || carIcon; // Por defecto usa el icono de carro
  };

  // Estado de la card (Nuevo, Cotizada, Tu Cotización, Aprobada)
  const getStatusBadge = () => {
    // Si YO coticé, mostrar badge especial con monto
    if (myQuote) {
      return (
        <div className="my-quote-badge-container">
          <IonBadge mode="ios" color="secondary" className="my-quote-badge">
          ${myQuote.amount.toLocaleString('es-CO')}
          </IonBadge>
        </div>
      );
    }
    
    if (request.status === "accepted") {
      return (
        <IonBadge mode="ios" color="success">
          Aprobada
        </IonBadge>
      );
    }
    if (request.quotesCount > 0) {
      return (
        <IonBadge mode="ios" color="secondary">
          {request.quotesCount} Cotización{request.quotesCount > 1 ? 'es' : ''}
        </IonBadge>
      );
    }
    return (
      <IonBadge mode="ios" color="primary">
        Nuevo
      </IonBadge>
    );
  };

  return (
    <div
      className={`request-card ${request.status}`}
      onClick={() => onQuote(request)}
      style={{ cursor: "pointer" }}
    >
      <div className="request-card-content">
        {/* Header: Hora y Estado */}
        <div className="card-header">
          <IonText color="medium" className="time">
            {formatTime(request.timestamp)}
          </IonText>
          {getStatusBadge()}
        </div>

       
        <div className="location-section-wrapper">
          {/* Origen */}
          <div className="location-section">
            <Location size="24" variant="Bold" color="#0055FF" />
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
            <Location size="24" variant="Bold" color="#FF5500" />
            <div className="location-text">
              <IonText color="medium" className="location-label">
                Destino
              </IonText>
              <IonText className="location-address">
                {request.destination.address}
              </IonText>
            </div>
          </div>
        </div>

         {/* Vehículo */}
         <div className="vehicle-section">
          <div className="vehicle-info">
            <div className="vehicle-icon">
              <img
                src={getVehicleIcon(request.vehicle?.icon)}
                alt={request.vehicle?.category || "Vehículo"}
                className="vehicle-svg-icon"
              />
            </div>
            <div className="vehicle-details">
              <h2 className="vehicle-brand">
                {request.vehicle?.brand || "N/A"}
              </h2>
              <h3 className="vehicle-model" color="medium">
                {request.vehicle?.model || "N/A"}
              </h3>
            </div>
            <div className="distance-info">
              <IonText className="distance">
                <strong>{request.durationMin || "N/A"} Min</strong>
              </IonText>
              <IonText className="distance-km" color="medium">
                {request.distanceKm || "N/A"} km
              </IonText>
            </div>
          </div>

          {/* Problema */}
          <div className="problem-section">
            <IonText color="medium" className="section-label">
              Problema
            </IonText>
            <IonText className="problem-text">
              {request.problem || "Sin descripción"}
            </IonText>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
