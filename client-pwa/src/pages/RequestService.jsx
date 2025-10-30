import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonText,
  IonSpinner,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/react';
import { arrowBack, locate, navigateCircleOutline } from 'ionicons/icons';
import { Location as LocationIcon } from 'iconsax-react';
import { MapPicker } from '../components/Map/MapPicker';
import { Card, Button, Input } from '@components';
import { useGeolocation } from '../hooks/useGeolocation';
import { useToast } from '@hooks/useToast';
import { searchAddress, getAddressFromCoordinates } from '../utils/mapbox';
import './RequestService.css';

const RequestService = () => {
  const history = useHistory();
  const { showSuccess, showError, showWarning } = useToast();
  
  // Geolocalización
  const {
    location: currentGeolocation,
    loading: geoLoading,
    error: geoError,
    requestLocation,
  } = useGeolocation();

  // Estados del formulario
  const [origin, setOrigin] = useState(null); // { lat, lng, address }
  const [destination, setDestination] = useState(null); // { lat, lng, address }
  const [routeInfo, setRouteInfo] = useState(null); // { distance, duration, distanceText, durationText }
  
  // Búsqueda de direcciones
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState(null); // 'origin' | 'destination'

  // Actualizar ubicación de origen cuando se obtiene geolocalización
  useEffect(() => {
    if (currentGeolocation && !origin) {
      const newOrigin = {
        lat: currentGeolocation.latitude,
        lng: currentGeolocation.longitude,
        address: 'Tu ubicación actual',
      };
      
      setOrigin(newOrigin);
      
      // Obtener dirección real
      getAddressFromCoordinates(newOrigin.lng, newOrigin.lat)
        .then((address) => {
          setOrigin(prev => ({ ...prev, address }));
        });
      
      showSuccess('✅ Ubicación obtenida correctamente');
    }
  }, [currentGeolocation, origin, showSuccess]);

  // Mostrar error de geolocalización
  useEffect(() => {
    if (geoError) {
      showError(geoError);
    }
  }, [geoError, showError]);

  // Buscar direcciones mientras el usuario escribe
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchAddress(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error buscando dirección:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleUseCurrentLocation = () => {
    if (geoLoading) {
      showWarning('⏳ Obteniendo tu ubicación...');
      return;
    }
    requestLocation();
  };

  const handleOriginChange = (newOrigin) => {
    setOrigin(newOrigin);
    
    // Obtener dirección si no la tiene
    if (newOrigin && !newOrigin.address) {
      getAddressFromCoordinates(newOrigin.lng, newOrigin.lat)
        .then((address) => {
          setOrigin(prev => ({ ...prev, address }));
        });
    }
  };

  const handleDestinationChange = (newDestination) => {
    setDestination(newDestination);
    
    // Obtener dirección si no la tiene
    if (newDestination && !newDestination.address) {
      getAddressFromCoordinates(newDestination.lng, newDestination.lat)
        .then((address) => {
          setDestination(prev => ({ ...prev, address }));
        });
    }
  };

  const handleSearchSelect = async (place) => {
    const newPoint = {
      lat: place.coordinates[1],
      lng: place.coordinates[0],
      address: place.name,
    };

    if (searchType === 'origin') {
      setOrigin(newPoint);
    } else if (searchType === 'destination') {
      setDestination(newPoint);
    }

    // Limpiar búsqueda
    setSearchQuery('');
    setSearchResults([]);
    setSearchType(null);
  };

  const handleContinue = () => {
    if (!origin) {
      showWarning('⚠️ Por favor selecciona un punto de origen');
      return;
    }
    
    if (!destination) {
      showWarning('⚠️ Por favor selecciona un punto de destino');
      return;
    }

    if (!routeInfo) {
      showWarning('⚠️ Espera mientras calculamos la ruta');
      return;
    }

    // Guardar datos en localStorage para la siguiente página
    localStorage.setItem('requestData', JSON.stringify({
      origin,
      destination,
      routeInfo,
    }));

    // Navegar a la siguiente página (formulario de detalles)
    history.push('/request-details');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" icon={arrowBack} />
          </IonButtons>
          <IonTitle>Solicitar Servicio</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding request-service-page">
        <Card title="Paso 1: Ubicación y Ruta">
          {/* Mapa Interactivo */}
          <MapPicker
            origin={origin}
            destination={destination}
            onOriginChange={handleOriginChange}
            onDestinationChange={handleDestinationChange}
            onRouteCalculated={setRouteInfo}
          />

          {/* Información de Ubicación */}
          <div className="location-info">
            {/* Origen */}
            <div className="location-item">
              <div className="location-icon origin-icon">
                <LocationIcon size="24" color="#3880ff" variant="Bold" />
              </div>
              <div className="location-details">
                <IonText color="medium">
                  <p className="location-label">Origen</p>
                </IonText>
                <IonText>
                  <p className="location-address">
                    {origin ? origin.address : 'No seleccionado'}
                  </p>
                </IonText>
              </div>
              {!origin && (
                <Button
                  size="small"
                  fill="clear"
                  onClick={handleUseCurrentLocation}
                  disabled={geoLoading}
                >
                  {geoLoading ? <IonSpinner /> : <IonIcon icon={locate} />}
                </Button>
              )}
            </div>

            {/* Destino */}
            <div className="location-item">
              <div className="location-icon destination-icon">
                <LocationIcon size="24" color="#eb445a" variant="Bold" />
              </div>
              <div className="location-details">
                <IonText color="medium">
                  <p className="location-label">Destino</p>
                </IonText>
                <IonText>
                  <p className="location-address">
                    {destination ? destination.address : 'No seleccionado'}
                  </p>
                </IonText>
              </div>
            </div>
          </div>

          {/* Buscador de Direcciones */}
          <div className="search-section">
            <Input
              label="Buscar dirección"
              placeholder="Ej: Calle 100 con Carrera 15, Bogotá"
              value={searchQuery}
              onIonInput={(e) => setSearchQuery(e.detail.value)}
              iconComponent={<LocationIcon size="20" />}
            />
            
            {searchResults.length > 0 && (
              <div className="search-actions">
                <Button
                  size="small"
                  fill="outline"
                  onClick={() => setSearchType('origin')}
                >
                  Usar como Origen
                </Button>
                <Button
                  size="small"
                  fill="outline"
                  onClick={() => setSearchType('destination')}
                >
                  Usar como Destino
                </Button>
              </div>
            )}

            {/* Resultados de búsqueda */}
            {isSearching && (
              <div className="search-loading">
                <IonSpinner />
                <IonText color="medium">Buscando...</IonText>
              </div>
            )}

            {searchResults.length > 0 && searchType && (
              <IonList className="search-results">
                {searchResults.map((place) => (
                  <IonItem
                    key={place.id}
                    button
                    onClick={() => handleSearchSelect(place)}
                  >
                    <IonIcon icon={navigateCircleOutline} slot="start" />
                    <IonLabel>
                      <h3>{place.name}</h3>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </div>

          {/* Resumen de Ruta */}
          {routeInfo && (
            <div className="route-summary">
              <IonText color="success">
                <h3>✅ Ruta Calculada</h3>
              </IonText>
              <div className="route-stats">
                <div className="route-stat">
                  <IonText color="medium">Distancia:</IonText>
                  <IonText><strong>{routeInfo.distanceText}</strong></IonText>
                </div>
                <div className="route-stat">
                  <IonText color="medium">Tiempo estimado:</IonText>
                  <IonText><strong>{routeInfo.durationText}</strong></IonText>
                </div>
              </div>
            </div>
          )}

          {/* Botón Continuar */}
          <Button
            expand="block"
            onClick={handleContinue}
            disabled={!origin || !destination || !routeInfo}
          >
            Continuar al Paso 2
          </Button>
        </Card>
      </IonContent>
    </IonPage>
  );
};

export default RequestService;

