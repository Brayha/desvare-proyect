import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { Location } from 'iconsax-react';
import { IonSpinner, IonText } from '@ionic/react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './RequestDetailMap.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Estilo de la línea de ruta
const routeLayerStyle = {
  id: 'route-layer',
  type: 'line',
  paint: {
    'line-color': '#0055FF',
    'line-width': 4,
    'line-opacity': 0.8,
  },
};

/**
 * Calcula los límites (bounds) para ajustar el zoom del mapa
 */
const calculateBounds = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return null;
  
  let minLng = coordinates[0][0];
  let maxLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];
  
  coordinates.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
  
  // Agregar padding (5%)
  const lngPadding = (maxLng - minLng) * 0.05 || 0.01;
  const latPadding = (maxLat - minLat) * 0.05 || 0.01;
  
  return [
    [minLng - lngPadding, minLat - latPadding],
    [maxLng + lngPadding, maxLat + latPadding]
  ];
};

const RequestDetailMap = ({ request, driverLocation }) => {
  const mapRef = useRef(null);
  const [route, setRoute] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  
  // Validar y obtener coordenadas de forma segura
  const getCoordinates = () => {
    if (!request?.origin) return { lng: -74.0721, lat: 4.7110 };
    
    // Si tiene el formato coordinates: [lng, lat]
    if (request.origin.coordinates && Array.isArray(request.origin.coordinates)) {
      return {
        lng: request.origin.coordinates[0] || -74.0721,
        lat: request.origin.coordinates[1] || 4.7110
      };
    }
    
    // Si tiene el formato lng/lat directo
    if (request.origin.lng && request.origin.lat) {
      return {
        lng: request.origin.lng,
        lat: request.origin.lat
      };
    }
    
    return { lng: -74.0721, lat: 4.7110 };
  };
  
  const initialCoords = getCoordinates();
  const [viewState, setViewState] = useState({
    longitude: initialCoords.lng,
    latitude: initialCoords.lat,
    zoom: 12,
  });

  // Calcular ruta cuando cambian los datos
  useEffect(() => {
    const calculateRoute = async () => {
    setIsCalculatingRoute(true);
    
    try {
      // Obtener coordenadas de forma segura
      const getOriginCoords = () => {
        if (request.origin.coordinates && Array.isArray(request.origin.coordinates)) {
          return { lng: request.origin.coordinates[0], lat: request.origin.coordinates[1] };
        }
        return { lng: request.origin.lng, lat: request.origin.lat };
      };
      
      const getDestCoords = () => {
        if (request.destination.coordinates && Array.isArray(request.destination.coordinates)) {
          return { lng: request.destination.coordinates[0], lat: request.destination.coordinates[1] };
        }
        return { lng: request.destination.lng, lat: request.destination.lat };
      };
      
      const originCoords = getOriginCoords();
      const destCoords = getDestCoords();
      
      console.log('📍 Coordenadas para ruta:', {
        driver: { lng: driverLocation.lng, lat: driverLocation.lat },
        origin: originCoords,
        destination: destCoords
      });
      
      // Waypoints: conductor → origen → destino
      const waypoints = [
        `${driverLocation.lng},${driverLocation.lat}`,
        `${originCoords.lng},${originCoords.lat}`,
        `${destCoords.lng},${destCoords.lat}`
      ].join(';');

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      
      console.log('🗺️ Calculando ruta con 3 waypoints...');
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const routeGeometry = data.routes[0].geometry;
        setRoute(routeGeometry);
        
        console.log('✅ Ruta calculada exitosamente');
        
        // Ajustar zoom para mostrar toda la ruta
        setTimeout(() => {
          if (mapRef.current && routeGeometry.coordinates) {
            const bounds = calculateBounds(routeGeometry.coordinates);
            if (bounds) {
              mapRef.current.fitBounds(bounds, {
                padding: { top: 60, bottom: 60, left: 40, right: 40 },
                duration: 1000,
              });
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error('❌ Error calculando ruta:', error);
    } finally {
      setIsCalculatingRoute(false);
    }
    };

    if (request && driverLocation && MAPBOX_TOKEN) {
      calculateRoute();
    }
  }, [request, driverLocation]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="map-error">
        <IonText color="danger">
          <p>⚠️ Token de Mapbox no configurado</p>
        </IonText>
      </div>
    );
  }

  if (!request || !driverLocation) {
    return (
      <div className="map-loading">
        <IonSpinner />
        <IonText color="medium">
          <p>Cargando mapa...</p>
        </IonText>
      </div>
    );
  }

  return (
    <div className="request-detail-map-container">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Marcador del Conductor */}
        <Marker 
          longitude={driverLocation.lng} 
          latitude={driverLocation.lat}
          anchor="bottom"
        >
          <div className="driver-marker">🚛</div>
        </Marker>

        {/* Marcador de Origen */}
        <Marker 
          longitude={request.origin.coordinates?.[0] || request.origin.lng} 
          latitude={request.origin.coordinates?.[1] || request.origin.lat}
          anchor="bottom"
        >
          <Location size="40" color="#3880ff" variant="Bold" />
        </Marker>

        {/* Marcador de Destino */}
        <Marker 
          longitude={request.destination.coordinates?.[0] || request.destination.lng} 
          latitude={request.destination.coordinates?.[1] || request.destination.lat}
          anchor="bottom"
        >
          <Location size="40" color="#eb445a" variant="Bold" />
        </Marker>

        {/* Línea de Ruta */}
        {route && (
          <Source id="route" type="geojson" data={route}>
            <Layer {...routeLayerStyle} />
          </Source>
        )}
      </Map>

      {/* Overlay de carga */}
      {isCalculatingRoute && (
        <div className="map-loading-overlay">
          <IonSpinner color="primary" />
          <IonText color="primary">
            <p>Calculando ruta...</p>
          </IonText>
        </div>
      )}
    </div>
  );
};

export default RequestDetailMap;
