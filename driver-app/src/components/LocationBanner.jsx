import React from 'react';
import { IonIcon } from '@ionic/react';
import { locationOutline, alertCircleOutline, checkmarkCircleOutline, settingsOutline } from 'ionicons/icons';
import './LocationBanner.css';

/**
 * Banner superior que muestra el estado de la geolocalización del conductor.
 * Cuando hay error, muestra un botón de acción para solicitar permiso nuevamente
 * o abrir ajustes del sistema si ya fue denegado permanentemente.
 */
const LocationBanner = ({ loading, error, location, onRequestPermission }) => {
  if (!loading && !error && !location) return null;

  // Estado: Cargando
  if (loading && !location) {
    return (
      <div className="location-banner location-banner-loading">
        <IonIcon icon={locationOutline} className="location-icon spinning" />
        <div className="location-text">
          <span className="location-title">Obteniendo ubicación...</span>
          <span className="location-subtitle">Activa el GPS para recibir solicitudes</span>
        </div>
      </div>
    );
  }

  // Estado: Error — con botón de acción
  if (error) {
    return (
      <div className="location-banner location-banner-error">
        <IonIcon icon={alertCircleOutline} className="location-icon" />
        <div className="location-text">
          <span className="location-title">Ubicación no disponible</span>
          <span className="location-subtitle">Sin GPS no puedes recibir solicitudes</span>
        </div>
        {onRequestPermission && (
          <button className="location-action-btn" onClick={onRequestPermission}>
            <IonIcon icon={settingsOutline} />
            <span>Activar</span>
          </button>
        )}
      </div>
    );
  }

  // Estado: Activo
  if (location) {
    return (
      <div className="location-banner location-banner-active">
        <IonIcon icon={checkmarkCircleOutline} className="location-icon" />
        <div className="location-text">
          <span className="location-title">Ubicación activa</span>
          <span className="location-subtitle">
            GPS conectado · Precisión: {location.accuracy ? Math.round(location.accuracy) : '—'}m
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export default LocationBanner;
