import React, { useEffect, useRef } from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonText } from '@ionic/react';
import { locationOutline, navigateCircleOutline } from 'ionicons/icons';
import './LocationMap.css';

/**
 * Mapa pequeño que muestra la ubicación actual del conductor
 * Usa un mapa estático de OpenStreetMap (sin necesidad de API key)
 */
const LocationMap = ({ location, loading, error }) => {
  const mapRef = useRef(null);

  if (loading && !location) {
    return (
      <IonCard className="location-map-card">
        <IonCardHeader>
          <IonCardTitle className="location-map-title">
            <IonIcon icon={locationOutline} /> Tu Ubicación
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="location-map-placeholder">
            <IonIcon icon={navigateCircleOutline} className="map-placeholder-icon spinning" />
            <IonText>Obteniendo ubicación...</IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  if (error) {
    return (
      <IonCard className="location-map-card location-map-error">
        <IonCardHeader>
          <IonCardTitle className="location-map-title">
            <IonIcon icon={locationOutline} /> Tu Ubicación
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="location-map-placeholder">
            <IonIcon icon={locationOutline} className="map-placeholder-icon" />
            <IonText color="danger">
              <small>No se pudo obtener tu ubicación</small>
            </IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  if (!location) {
    return null;
  }

  // URL del mapa estático usando OpenStreetMap + Leaflet
  // Alternativa: Usar MapTiler, Mapbox, o Google Maps Static API
  const { lat, lng } = location;
  const zoom = 15;
  
  // Usar OpenStreetMap Static Map (sin necesidad de API key)
  const mapImageUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <IonCard className="location-map-card">
      <IonCardHeader>
        <IonCardTitle className="location-map-title">
          <IonIcon icon={locationOutline} /> Tu Ubicación Actual
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent className="location-map-content">
        <div className="location-map-container">
          <iframe
            ref={mapRef}
            title="Mapa de ubicación"
            width="100%"
            height="200"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src={mapImageUrl}
            className="location-map-iframe"
          />
        </div>
        
        <div className="location-coordinates">
          <IonIcon icon={navigateCircleOutline} className="coordinates-icon" />
          <div className="coordinates-text">
            <IonText className="coordinates-label">Coordenadas:</IonText>
            <IonText className="coordinates-value">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </IonText>
          </div>
        </div>

        {location.accuracy && (
          <div className="location-accuracy">
            <IonText color="medium">
              <small>Precisión: ~{Math.round(location.accuracy)} metros</small>
            </IonText>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default LocationMap;

