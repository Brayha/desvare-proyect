import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { Location } from 'iconsax-react';
import { IonSpinner, IonText } from '@ionic/react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './RequestDetailMap.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Estilo para la ruta del conductor al origen (azul oscuro)
const driverToOriginLayerStyle = {
  id: 'driver-to-origin-layer',
  type: 'line',
  paint: {
    'line-color': '#223D62',
    'line-width': 4,
    'line-opacity': 0.8,
  },
};

// Estilo para la ruta del origen al destino (azul brillante)
const originToDestinationLayerStyle = {
  id: 'origin-to-destination-layer',
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

const RequestDetailMap = ({ request, driverLocation, driverPhoto, showDestination = true }) => {
  const mapRef = useRef(null);
  const [driverToOriginRoute, setDriverToOriginRoute] = useState(null);
  const [originToDestinationRoute, setOriginToDestinationRoute] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  
  // Estados para controlar la animación secuencial
  const [showDriver, setShowDriver] = useState(false);
  const [showOrigin, setShowOrigin] = useState(false);
  const [showDriverRoute, setShowDriverRoute] = useState(false);
  const [showDestinationMarker, setShowDestinationMarker] = useState(false);
  const [showDestinationRoute, setShowDestinationRoute] = useState(false);
  
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

  // Calcular rutas cuando cambian los datos
  useEffect(() => {
    const calculateRoutes = async () => {
    setIsCalculatingRoute(true);
    
    // Reiniciar estados de animación
    setShowDriver(false);
    setShowOrigin(false);
    setShowDriverRoute(false);
    setShowDestinationMarker(false);
    setShowDestinationRoute(false);
    
    try {
      // Obtener coordenadas de forma segura
      const getOriginCoords = () => {
        if (request.origin.coordinates && Array.isArray(request.origin.coordinates)) {
          return { lng: request.origin.coordinates[0], lat: request.origin.coordinates[1] };
        }
        return { lng: request.origin.lng, lat: request.origin.lat };
      };
      
      const originCoords = getOriginCoords();
      
      // ✅ Validar si hay destino (puede ser null en FASE 1 de ActiveService)
      const hasDestination = request.destination && 
        (request.destination.coordinates || (request.destination.lng && request.destination.lat));
      
      let destCoords = null;
      if (hasDestination) {
        const getDestCoords = () => {
          if (request.destination.coordinates && Array.isArray(request.destination.coordinates)) {
            return { lng: request.destination.coordinates[0], lat: request.destination.coordinates[1] };
          }
          return { lng: request.destination.lng, lat: request.destination.lat };
        };
        destCoords = getDestCoords();
      }
      
      console.log('📍 Coordenadas para rutas:', {
        driver: { lng: driverLocation.lng, lat: driverLocation.lat },
        origin: originCoords,
        destination: destCoords || 'Sin destino (FASE 1)',
        showDestination
      });
      
      // Calcular ruta 1: Conductor → Origen (color #223D62)
      const route1Waypoints = [
        `${driverLocation.lng},${driverLocation.lat}`,
        `${originCoords.lng},${originCoords.lat}`
      ].join(';');

      const url1 = `https://api.mapbox.com/directions/v5/mapbox/driving/${route1Waypoints}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      
      console.log('🗺️ Calculando ruta Conductor → Origen...');
      
      // Calcular solo ruta 1 (siempre)
      const response1 = await fetch(url1);
      const data1 = await response1.json();
      
      if (data1.routes && data1.routes[0]) {
        setDriverToOriginRoute(data1.routes[0].geometry);
        console.log('✅ Ruta Conductor → Origen calculada');
      }
      
      // ✅ Solo calcular ruta 2 si hay destino Y showDestination es true
      if (hasDestination && showDestination && destCoords) {
        const route2Waypoints = [
          `${originCoords.lng},${originCoords.lat}`,
          `${destCoords.lng},${destCoords.lat}`
        ].join(';');

        const url2 = `https://api.mapbox.com/directions/v5/mapbox/driving/${route2Waypoints}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
        
        console.log('🗺️ Calculando ruta Origen → Destino...');
        
        const response2 = await fetch(url2);
        const data2 = await response2.json();
        
        if (data2.routes && data2.routes[0]) {
          setOriginToDestinationRoute(data2.routes[0].geometry);
          console.log('✅ Ruta Origen → Destino calculada');
        }
      } else {
        // Limpiar ruta de destino si no debe mostrarse
        setOriginToDestinationRoute(null);
        console.log('⏭️ Saltando ruta Origen → Destino (no disponible)');
      }
      
      // Ajustar zoom para mostrar todas las coordenadas relevantes
      setTimeout(() => {
        if (mapRef.current) {
          // Incluir solo coordenadas relevantes según el estado
          const allCoordinates = [
            [driverLocation.lng, driverLocation.lat],
            [originCoords.lng, originCoords.lat]
          ];
          
          // Solo agregar destino si debe mostrarse
          if (hasDestination && showDestination && destCoords) {
            allCoordinates.push([destCoords.lng, destCoords.lat]);
          }
          
          const bounds = calculateBounds(allCoordinates);
          if (bounds) {
            mapRef.current.fitBounds(bounds, {
              padding: { top: 60, bottom: 60, left: 40, right: 40 },
              duration: 1000,
            });
          }
        }
      }, 500);
      
      // 🎬 ANIMACIÓN SECUENCIAL
      // Paso 1: Mostrar conductor (inmediato después de cargar)
      setTimeout(() => {
        setShowDriver(true);
        console.log('🎬 Paso 1: Conductor visible');
      }, 600);
      
      // Paso 2: Mostrar origen
      setTimeout(() => {
        setShowOrigin(true);
        console.log('🎬 Paso 2: Origen visible');
      }, 1200);
      
      // Paso 3: Trazar ruta conductor → origen
      setTimeout(() => {
        setShowDriverRoute(true);
        console.log('🎬 Paso 3: Ruta Conductor → Origen trazada');
      }, 1800);
      
      // ✅ Solo mostrar destino si existe Y showDestination prop es true
      if (hasDestination && showDestination) {
        // Paso 4: Mostrar marcador de destino
        setTimeout(() => {
          setShowDestinationMarker(true);
          console.log('🎬 Paso 4: Destino visible');
        }, 2400);
        
        // Paso 5: Trazar ruta origen → destino
        setTimeout(() => {
          setShowDestinationRoute(true);
          console.log('🎬 Paso 5: Ruta Origen → Destino trazada');
        }, 3000);
      } else {
        console.log('⏭️ Saltando pasos 4 y 5 (sin destino)');
      }
      
    } catch (error) {
      console.error('❌ Error calculando rutas:', error);
    } finally {
      setIsCalculatingRoute(false);
    }
    };

    if (request && driverLocation && MAPBOX_TOKEN) {
      calculateRoutes();
    }
  }, [request, driverLocation, showDestination]);

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
        {/* Marcador del Conductor - Aparece primero */}
        {showDriver && (
          <Marker 
            longitude={driverLocation.lng} 
            latitude={driverLocation.lat}
            anchor="bottom"
          >
            <div className="driver-marker-avatar animate-fade-in">
              <img 
                src={driverPhoto || 'https://ionicframework.com/docs/img/demos/avatar.svg'} 
                alt="Conductor"
                onError={(e) => {
                  e.target.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                }}
              />
            </div>
          </Marker>
        )}

        {/* Marcador de Origen - Aparece segundo */}
        {showOrigin && (
          <Marker 
            longitude={request.origin.coordinates?.[0] || request.origin.lng} 
            latitude={request.origin.coordinates?.[1] || request.origin.lat}
            anchor="bottom"
          >
            <div className="animate-fade-in">
              <Location size="40" color="#3880ff" variant="Bold" />
            </div>
          </Marker>
        )}

        {/* Marcador de Destino - Aparece cuarto (solo si existe destino) */}
        {showDestinationMarker && request.destination && (
          <Marker 
            longitude={request.destination.coordinates?.[0] || request.destination.lng} 
            latitude={request.destination.coordinates?.[1] || request.destination.lat}
            anchor="bottom"
          >
            <div className="animate-fade-in">
              <Location size="40" color="#eb445a" variant="Bold" />
            </div>
          </Marker>
        )}

        {/* Ruta Conductor → Origen - Se traza tercero */}
        {showDriverRoute && driverToOriginRoute && (
          <Source id="driver-to-origin-route" type="geojson" data={driverToOriginRoute}>
            <Layer {...driverToOriginLayerStyle} />
          </Source>
        )}
        
        {/* Ruta Origen → Destino - Se traza quinto */}
        {showDestinationRoute && originToDestinationRoute && (
          <Source id="origin-to-destination-route" type="geojson" data={originToDestinationRoute}>
            <Layer {...originToDestinationLayerStyle} />
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
