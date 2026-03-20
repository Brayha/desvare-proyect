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
 * @param {Object} driverLocation - Ubicación en tiempo real del conductor { lat, lng }
 * @param {Number} driverHeading - Dirección del vehículo (0-360°)
 * @param {String} driverPhoto - URL de la foto del conductor
 * @param {String} driverName - Nombre del conductor
 * @param {Object} focusedQuoteLocation - Ubicación { lat, lng } de la cotización activa en el slider
 */
const MapPicker = ({
  origin,
  destination,
  onRouteCalculated,
  quotes = [],
  onQuoteClick = null,
  driverLocation = null,
  driverHeading = 0,
  driverPhoto = null,
  driverName = 'Conductor',
  focusedQuoteLocation = null,
}) => {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [route, setRoute] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  // Controla si el mapa ya se centró automáticamente por primera vez en el conductor
  // Después de ese primer centrado, el usuario controla el mapa libremente
  const hasAutocenteredDriver = useRef(false);
  // Muestra/oculta el botón de re-centrar cuando el usuario mueve el mapa
  const [showRecenterBtn, setShowRecenterBtn] = useState(false);

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

  // ✅ ÚNICO useEffect para manejar zoom/centrado (sin destino/ruta)
  useEffect(() => {
    // Solo ejecutar si hay origen, NO hay destino, el mapa está listo Y cargado
    if (!origin || destination || !mapRef.current || !isMapLoaded) return;

    // Pequeño delay para asegurar que el mapa esté completamente renderizado
    const timer = setTimeout(() => {
      if (quotes.length > 0) {
        // ✅ CASO 1: Hay cotizaciones - Mostrar origen + cotizaciones
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
      } else {
        // ✅ CASO 2: NO hay cotizaciones - Centrar en origen estilo Uber/Didi
        console.log('📍 Centrando en origen (sin cotizaciones)');
        mapRef.current.flyTo({
          center: [origin.lng, origin.lat],
          zoom: 15, // Zoom 15 como solicitaste
          duration: 1500,
          offset: [0, -30], // Desplazar 30px hacia arriba para compensar cards flotantes
        });
      }
    }, 300); // Delay de 300ms para asegurar que el mapa esté listo

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes.length, origin, destination, isMapLoaded]); // ✅ Incluir isMapLoaded

  // Centrar mapa la PRIMERA VEZ que aparece la ubicación del conductor
  // Después de ese primer centrado el usuario controla el mapa libremente (como Uber/Pickup)
  useEffect(() => {
    if (!origin || !driverLocation || !mapRef.current || !isMapLoaded) return;
    if (hasAutocenteredDriver.current) return; // Solo la primera vez

    console.log('🚗 Primer centrado automático conductor + origen');
    hasAutocenteredDriver.current = true;

    const coordinates = [
      [origin.lng, origin.lat],
      [driverLocation.lng, driverLocation.lat]
    ];

    const bounds = coordinates.reduce((b, coord) => b.extend(coord),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
    );

    mapRef.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 250, left: 80, right: 80 },
      duration: 1200,
      maxZoom: 15,
    });
  }, [driverLocation, origin, isMapLoaded]);

  // Función para re-centrar manualmente (botón 📍)
  const handleRecenter = () => {
    if (!origin || !driverLocation || !mapRef.current) return;
    const coordinates = [
      [origin.lng, origin.lat],
      [driverLocation.lng, driverLocation.lat]
    ];
    const bounds = coordinates.reduce((b, coord) => b.extend(coord),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
    );
    mapRef.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 250, left: 80, right: 80 },
      duration: 800,
      maxZoom: 15,
    });
    setShowRecenterBtn(false);
  };

  // Centrar mapa en la cotización activa del slider
  useEffect(() => {
    if (!focusedQuoteLocation || !mapRef.current || !isMapLoaded) return;
    const { lat, lng } = focusedQuoteLocation;
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 800,
      offset: [0, -80],
    });
  }, [focusedQuoteLocation, isMapLoaded]);

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
        onDragStart={() => {
          // El usuario mueve el mapa manualmente → mostrar botón re-centrar
          if (driverLocation) setShowRecenterBtn(true);
        }}
        onLoad={() => {
          console.log('🗺️ Mapa cargado completamente');
          setIsMapLoaded(true);
        }}
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

        {/* 🆕 Marcador del Conductor en Tiempo Real (con foto circular) */}
        {driverLocation && (
          <Marker
            longitude={driverLocation.lng}
            latitude={driverLocation.lat}
            anchor="center"
          >
            <div className="driver-marker-container">
              {/* Pulso animado de fondo */}
              <div className="driver-marker-pulse"></div>
              
              {/* Foto circular del conductor */}
              <div 
                className="driver-marker-photo"
                style={{
                  transform: `rotate(${driverHeading}deg)`
                }}
              >
                {driverPhoto ? (
                  <img 
                    src={driverPhoto} 
                    alt={driverName}
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      e.target.style.display = 'none';
                      e.target.parentElement.classList.add('driver-marker-fallback');
                      e.target.parentElement.textContent = driverName?.charAt(0) || 'C';
                    }}
                  />
                ) : (
                  <div className="driver-marker-fallback">
                    {driverName?.charAt(0) || 'C'}
                  </div>
                )}
              </div>
              
              {/* Indicador de dirección (flecha) */}
              <div 
                className="driver-marker-arrow"
                style={{
                  transform: `rotate(${driverHeading}deg)`
                }}
              >
                ▲
              </div>
            </div>
          </Marker>
        )}

        {/* Línea de Ruta */}
        {route && route.geometry && (
          <Source id="route" type="geojson" data={route.geometry}>
            <Layer {...routeLayerStyle} />
          </Source>
        )}
      </Map>

      {/* Botón re-centrar: aparece cuando el usuario mueve el mapa manualmente */}
      {showRecenterBtn && driverLocation && (
        <button
          onClick={handleRecenter}
          className="map-recenter-btn"
          aria-label="Re-centrar mapa"
        >
          📍
        </button>
      )}

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

