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
import carIcon from "../assets/img/vehicles/car.svg";
import motoIcon from "../assets/img/vehicles/moto.svg";
import camionetaIcon from "../assets/img/vehicles/camioneta.svg";
import camionIcon from "../assets/img/vehicles/camion.svg";
import busIcon from "../assets/img/vehicles/bus.svg";

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
          <div className="card-service-status-badge my-quote-badge">
          ${myQuote.amount.toLocaleString('es-CO')}
          </div>
        </div>
      );
    }
    
    if (request.status === "accepted") {
      return (
        <div className="card-service-status-badge card-service-approved-badge">
          Aprobada
        </div>
      );
    }
    if (request.quotesCount > 0) {
      return (
        <div className="card-service-status-badge card-service-send">
          {request.quotesCount} Cotización{request.quotesCount > 1 ? 'es' : ''}
        </div>
      );
    }
    return (
      <div className="card-service-status-badge card-service-new-badge">
        Nuevo
      </div>
    );
  };

  return (
    <div
      className={`card-service ${request.status}`}
      onClick={() => onQuote(request)}
      style={{ cursor: "pointer" }}
    >
      <div className="card-service-content">
        {/* Header: Hora y Estado */}
        <div className="card-service-header">
          <p color="medium" className="time">
            {formatTime(request.timestamp)}
          </p>
          {getStatusBadge()}
        </div>

       
        <div className="location-section-wrapper">
          {/* Origen */}
          <div className="location-section">
            <div className="rc-location-icon rc-location-icon-with-line">
              <Location size="20" variant="Bold" color="#0055FF" />
            </div>
            <div className="location-text">
              <IonText color="medium" className="location-label">
                Origen
              </IonText>
              <IonText className="location-address">
                {request.origin.address}
              </IonText>
            </div>
          </div>

          {/* Destino */}
          <div className="location-section">
            <div className="rc-location-icon">
              <Location size="20" variant="Bold" color="#FF5500" />
            </div>
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
          <div className="vehicle-info-service-card">
            <div className="vehicle-icon">
              <img
                src={getVehicleIcon(request.vehicle?.icon)}
                alt={request.vehicle?.category || "Vehículo"}
                className="vehicle-svg-icon"
              />
            </div>
            <div className="vehicle-details-service-card"> 
              <h2 className="vehicle-brand">
                {request.vehicle?.brand || "N/A"}
              </h2>
              <h3 className="vehicle-model" color="medium">
                {request.vehicle?.model || "N/A"}
              </h3>
            </div>
            {/* <div className="distance-info-service-card">
              <p className="distance-service-card">
               {request.durationMin || "N/A"} Min
              </p>
              <p className="distance-km-service-card">
                {request.distanceKm || "N/A"} km
              </p>
            </div> */}
          </div>

          {/* Problema */}
          {/* <div className="problem-section">
            <IonText color="medium" className="section-label">
              Problema
            </IonText>
            <IonText className="problem-text">
              {request.problem || "Sin descripción"}
            </IonText>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
