import React from 'react';
import { IonIcon, IonText } from '@ionic/react';
import { locationOutline, alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import './LocationBanner.css';

/**
 * Banner superior que muestra el estado de la geolocalización del conductor
 * Estados:
 * - loading: Obteniendo ubicación...
 * - active: Ubicación activa (GPS conectado)
 * - error: Error de ubicación
 */
const LocationBanner = ({ loading, error, location }) => {
  // No mostrar nada si no hay error, no está cargando y no hay ubicación
  if (!loading && !error && !location) {
    return null;
  }

  // Estado: Cargando
  if (loading && !location) {
    return (
      <div className="location-banner location-banner-loading">
        <IonIcon icon={locationOutline} className="location-icon spinning" />
        <div className="location-text">
          <IonText className="location-title">Obteniendo ubicación...</IonText>
          <IonText className="location-subtitle">Por favor, permite el acceso a tu ubicación</IonText>
        </div>
      </div>
    );
  }

  // Estado: Error
  if (error) {
    return (
      <div className="location-banner location-banner-error">
        <IonIcon icon={alertCircleOutline} className="location-icon" />
        <div className="location-text">
          <IonText className="location-title">Error de ubicación</IonText>
          <IonText className="location-subtitle">Revisa los permisos en la configuración del navegador</IonText>
        </div>
      </div>
    );
  }

  // Estado: Activo (con ubicación)
  if (location) {
    return (
      <div className="location-banner location-banner-active">
        <IonIcon icon={checkmarkCircleOutline} className="location-icon" />
        <div className="location-text">
          <IonText className="location-title">Ubicación activa</IonText>
          <IonText className="location-subtitle">
            GPS conectado • Precisión: {location.accuracy ? Math.round(location.accuracy) : '—'}m
          </IonText>
        </div>
      </div>
    );
  }

  return null;
};

export default LocationBanner;

