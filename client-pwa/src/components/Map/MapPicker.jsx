import { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import { IonButton, IonIcon, IonText, IonSpinner } from '@ionic/react';
import { location as locationIcon } from 'ionicons/icons';
import { Location } from 'iconsax-react';
import { getRoute, formatDistance, formatDuration, calculateBounds } from '../../utils/mapbox';
import './MapPicker.css';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Coordenadas iniciales: Bogotá, Colombia
const INITIAL_VIEW_STATE = {
  longitude: -74.0721,
  latitude: 4.7110,
  zoom: 12,
};

/**
 * Componente MapPicker - Mapa interactivo para seleccionar origen y destino
 * 
 * @param {Object} origin - Punto de origen { lat, lng, address }
 * @param {Object} destination - Punto de destino { lat, lng, address }
 * @param {Function} onOriginChange - Callback cuando cambia el origen
 * @param {Function} onDestinationChange - Callback cuando cambia el destino
 * @param {Function} onRouteCalculated - Callback cuando se calcula una ruta
 */
const MapPicker = ({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onRouteCalculated,
}) => {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [route, setRoute] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // 'origin' | 'destination' | null

  // Calcular ruta cuando ambos puntos estén definidos
  useEffect(() => {
    if (origin && destination) {
      calculateRoute();
    } else {
      setRoute(null);
      if (onRouteCalculated) {
        onRouteCalculated(null);
      }
    }
  }, [origin, destination]);

  // Ajustar zoom cuando hay ruta
  useEffect(() => {
    if (route && route.geometry && mapRef.current) {
      const bounds = calculateBounds(route.geometry.coordinates);
      if (bounds) {
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          duration: 1000,
        });
      }
    }
  }, [route]);

  const calculateRoute = async () => {
    setIsCalculatingRoute(true);
    try {
      const routeData = await getRoute(
        [origin.lng, origin.lat],
        [destination.lng, destination.lat]
      );
      
      setRoute(routeData);
      
      if (onRouteCalculated) {
        onRouteCalculated({
          distance: routeData.distance,
          duration: routeData.duration,
          distanceText: formatDistance(routeData.distance),
          durationText: formatDuration(routeData.duration),
        });
      }
    } catch (error) {
      console.error('Error calculando ruta:', error);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleMapClick = useCallback((event) => {
    if (!selectionMode) return;

    const { lng, lat } = event.lngLat;
    const newPoint = { lat, lng, address: 'Cargando dirección...' };

    if (selectionMode === 'origin') {
      onOriginChange(newPoint);
      setSelectionMode(null);
    } else if (selectionMode === 'destination') {
      onDestinationChange(newPoint);
      setSelectionMode(null);
    }
  }, [selectionMode, onOriginChange, onDestinationChange]);

  const handleMarkerDragEnd = useCallback((event, type) => {
    const { lng, lat } = event.lngLat;
    const newPoint = { lat, lng, address: 'Cargando dirección...' };

    if (type === 'origin') {
      onOriginChange(newPoint);
    } else if (type === 'destination') {
      onDestinationChange(newPoint);
    }
  }, [onOriginChange, onDestinationChange]);

  // Estilo de la línea de ruta
  const routeLayerStyle = {
    id: 'route',
    type: 'line',
    paint: {
      'line-color': '#3880ff',
      'line-width': 4,
      'line-opacity': 0.8,
    },
  };

  return (
    <div className="map-picker-container">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        cursor={selectionMode ? 'crosshair' : 'grab'}
      >
        {/* Control de navegación (zoom +/-) */}
        <NavigationControl position="top-right" />

        {/* Marcador de Origen */}
        {origin && (
          <Marker
            longitude={origin.lng}
            latitude={origin.lat}
            anchor="bottom"
            draggable
            onDragEnd={(e) => handleMarkerDragEnd(e, 'origin')}
          >
            <Location size="32" color="#3880ff" variant="Bold" />
          </Marker>
        )}

        {/* Marcador de Destino */}
        {destination && (
          <Marker
            longitude={destination.lng}
            latitude={destination.lat}
            anchor="bottom"
            draggable
            onDragEnd={(e) => handleMarkerDragEnd(e, 'destination')}
          >
            <Location size="32" color="#eb445a" variant="Bold" />
          </Marker>
        )}

        {/* Línea de Ruta */}
        {route && route.geometry && (
          <Source id="route" type="geojson" data={route.geometry}>
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

      {/* Controles inferiores */}
      <div className="map-controls">
        <IonButton
          size="small"
          fill={selectionMode === 'origin' ? 'solid' : 'outline'}
          onClick={() => setSelectionMode(selectionMode === 'origin' ? null : 'origin')}
        >
          <IonIcon icon={locationIcon} slot="start" />
          {selectionMode === 'origin' ? 'Cancelar' : 'Seleccionar Origen'}
        </IonButton>

        <IonButton
          size="small"
          fill={selectionMode === 'destination' ? 'solid' : 'outline'}
          onClick={() => setSelectionMode(selectionMode === 'destination' ? null : 'destination')}
        >
          <IonIcon icon={locationIcon} slot="start" />
          {selectionMode === 'destination' ? 'Cancelar' : 'Seleccionar Destino'}
        </IonButton>
      </div>
    </div>
  );
};

export { MapPicker };
export default MapPicker;

