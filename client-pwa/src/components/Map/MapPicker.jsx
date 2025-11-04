import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { IonText, IonSpinner } from '@ionic/react';
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
 * @param {Function} onRouteCalculated - Callback cuando se calcula una ruta
 * @param {Array} quotes - Cotizaciones con ubicación de conductores
 * @param {Function} onQuoteClick - Callback cuando se hace click en un price marker
 */
const MapPicker = ({
  origin,
  destination,
  onRouteCalculated,
  quotes = [],
  onQuoteClick = null,
}) => {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [route, setRoute] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Centrar mapa cuando se obtiene el origen
  useEffect(() => {
    if (origin && mapRef.current) {
      mapRef.current.flyTo({
        center: [origin.lng, origin.lat],
        zoom: 15,
        duration: 1500,
      });
    }
  }, [origin]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination]);

  // Ajustar zoom cuando hay ruta
  useEffect(() => {
    if (route && route.geometry && mapRef.current) {
      const bounds = calculateBounds(route.geometry.coordinates);
      if (bounds) {
        // Padding más grande para considerar la tarjeta inferior
        mapRef.current.fitBounds(bounds, {
          padding: {
            top: 80,      // Espacio superior
            bottom: 350,  // Espacio inferior para la tarjeta de ruta
            left: 50,     // Espacio izquierdo
            right: 50,    // Espacio derecho
          },
          duration: 1500, // Animación más suave
        });
      }
    }
  }, [route]);

  // Auto-zoom cuando llegan cotizaciones (WaitingQuotes)
  useEffect(() => {
    // Solo si hay cotizaciones Y hay origen (pero NO hay destino/ruta)
    if (quotes.length > 0 && origin && !destination && mapRef.current) {
      console.log('🔍 Auto-zoom para mostrar origen + cotizaciones');
      
      // Crear array de coordenadas: origen + todas las cotizaciones
      const coordinates = [
        [origin.lng, origin.lat], // Origen
        ...quotes
          .filter(q => q.location && q.location.lat && q.location.lng)
          .map(q => [q.location.lng, q.location.lat]) // Cotizaciones
      ];

      if (coordinates.length > 1) {
        // Calcular bounds que incluyan todos los puntos
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        // Aplicar bounds con padding
        mapRef.current.fitBounds(bounds, {
          padding: {
            top: 80,
            bottom: 100,  // Menos padding abajo (no hay tarjeta grande)
            left: 80,
            right: 80,
          },
          duration: 1500,
          maxZoom: 14, // No acercar demasiado
        });
      }
    }
  }, [quotes, origin, destination]);

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

  // Estilo de la línea de ruta (negra y delgada)
  const routeLayerStyle = {
    id: 'route',
    type: 'line',
    paint: {
      'line-color': '#000000',  // Negro
      'line-width': 3,          // Más delgada
      'line-opacity': 0.8,
    },
  };

  return (
    <div className="map-picker-container">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >

        {/* Marcador de Origen */}
        {origin && (
          <Marker
            longitude={origin.lng}
            latitude={origin.lat}
            anchor="bottom"
          >
            <Location size="40" color="#3880ff" variant="Bold" />
          </Marker>
        )}

        {/* Marcador de Destino */}
        {destination && (
          <Marker
            longitude={destination.lng}
            latitude={destination.lat}
            anchor="bottom"
          >
            <Location size="40" color="#eb445a" variant="Bold" />
          </Marker>
        )}

        {/* Price Markers de Cotizaciones */}
        {quotes && quotes.length > 0 && quotes.map((quote, index) => {
          // Solo mostrar si el quote tiene ubicación
          if (!quote.location || !quote.location.lat || !quote.location.lng) {
            return null;
          }

          return (
            <Marker
              key={quote.driverId || index}
              longitude={quote.location.lng}
              latitude={quote.location.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (onQuoteClick) {
                  onQuoteClick(quote);
                }
              }}
            >
              <div 
                className="price-marker"
                style={{
                  cursor: onQuoteClick ? 'pointer' : 'default',
                  animation: 'bounceIn 0.5s ease-out'
                }}
              >
                ${quote.amount.toLocaleString()}
              </div>
            </Marker>
          );
        })}

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
    </div>
  );
};

export { MapPicker };
export default MapPicker;

