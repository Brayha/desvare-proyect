import { useState, useEffect } from "react";
// import { useHistory } from 'react-router-dom'; // TODO: Usar en Paso 4
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
  IonModal,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
} from "@ionic/react";
import { arrowBack, closeOutline, navigateCircleOutline } from "ionicons/icons";
import { Location } from "iconsax-react";
import { MapPicker } from "../components/Map/MapPicker";
import { useGeolocation } from "../hooks/useGeolocation";
import { useToast } from "@hooks/useToast";
import { getAddressFromCoordinates, searchAddress } from "../utils/mapbox";
import "./RequestService.css";

const RequestService = () => {
  // const history = useHistory(); // TODO: Usar en Paso 4
  const { showSuccess, showError } = useToast();

  // Geolocalización
  const {
    location: currentGeolocation,
    loading: geoLoading,
    error: geoError,
    requestLocation,
  } = useGeolocation();

  // Solicitar ubicación al cargar el componente
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Estados del formulario
  const [origin, setOrigin] = useState(null); // { lat, lng, address }
  const [destination, setDestination] = useState(null); // { lat, lng, address }
  const [routeInfo, setRouteInfo] = useState(null); // { distance, duration, distanceText, durationText }

  // Estados del modal de búsqueda
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Actualizar ubicación de origen cuando se obtiene geolocalización
  useEffect(() => {
    if (currentGeolocation && !origin) {
      const newOrigin = {
        lat: currentGeolocation.latitude,
        lng: currentGeolocation.longitude,
        address: "Tu ubicación actual",
      };

      setOrigin(newOrigin);

      // Obtener dirección real
      getAddressFromCoordinates(newOrigin.lng, newOrigin.lat).then(
        (address) => {
          setOrigin((prev) => ({ ...prev, address }));
        }
      );

      showSuccess("✅ Ubicación obtenida correctamente");
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
        console.error("Error buscando dirección:", error);
        showError("Error al buscar dirección");
      } finally {
        setIsSearching(false);
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, showError]);

  const handleOpenSearchModal = () => {
    setShowModal(true);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSelectDestination = (place) => {
    const newDestination = {
      lat: place.coordinates[1],
      lng: place.coordinates[0],
      address: place.name,
    };

    setDestination(newDestination);
    handleCloseModal();
    showSuccess("✅ Destino seleccionado");
  };

  const handleEditRoute = () => {
    setDestination(null);
    setRouteInfo(null);
  };

  const handleConfirmRoute = () => {
    if (!routeInfo) {
      showError("⚠️ Espera mientras calculamos la ruta");
      return;
    }

    // Guardar datos en localStorage para la siguiente página
    localStorage.setItem(
      "requestData",
      JSON.stringify({
        origin,
        destination,
        routeInfo,
      })
    );

    showSuccess("✅ Ruta confirmada");
    // TODO: Navegar a la siguiente página (formulario de detalles)
    // history.push('/request-details');
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

      <IonContent className="request-service-page">
        {/* Mapa a pantalla completa */}
        <div className="fullscreen-map">
          {geoLoading ? (
            <div className="map-loading">
              <IonSpinner name="crescent" color="primary" />
              <IonText color="medium">
                <p>Obteniendo tu ubicación...</p>
              </IonText>
            </div>
          ) : (
            <MapPicker
              origin={origin}
              destination={destination}
              onRouteCalculated={setRouteInfo}
            />
          )}

          {/* Botón para abrir búsqueda - solo si no hay destino */}
          {origin && !destination && (
            <div className="search-bottom-bar-container">
              <div className="search-button" onClick={handleOpenSearchModal}>
                <h2>¿A dónde vamos?</h2>
              </div>
            </div>
          )}

          {/* Tarjeta inferior con información de ruta - solo si hay destino */}
          {origin && destination && (
            <div className="route-info-card">
              <div className="route-header">
                <h3>Confirma el trayecto</h3>
                <IonButton
                  size="small"
                  fill="clear"
                  onClick={handleEditRoute}
                >
                  Editar
                </IonButton>
              </div>

              <div className="route-locations">
                {/* Origen */}
                <div className="route-location-item">
                  <div className="route-icon origin-marker">
                    <Location size="20" color="#3880ff" variant="Bold" />
                  </div>
                  <div className="route-location-info">
                    <IonText color="medium">
                      <p className="location-type">Origen</p>
                    </IonText>
                    <IonText>
                      <p className="location-address">{origin.address}</p>
                    </IonText>
                  </div>
                </div>

                {/* Destino */}
                <div className="route-location-item">
                  <div className="route-icon destination-marker">
                    <Location size="20" color="#eb445a" variant="Bold" />
                  </div>
                  <div className="route-location-info">
                    <IonText color="medium">
                      <p className="location-type">Destino</p>
                    </IonText>
                    <IonText>
                      <p className="location-address">{destination.address}</p>
                    </IonText>
                  </div>
                </div>
              </div>

              {/* Información de ruta (distancia y tiempo) */}
              {routeInfo && (
                <div className="route-stats-info">
                  <div className="stat-item">
                    <IonText color="medium">Distancia</IonText>
                    <IonText>
                      <strong>{routeInfo.distanceText}</strong>
                    </IonText>
                  </div>
                  <div className="stat-divider" />
                  <div className="stat-item">
                    <IonText color="medium">Tiempo est.</IonText>
                    <IonText>
                      <strong>{routeInfo.durationText}</strong>
                    </IonText>
                  </div>
                </div>
              )}

              {/* Botón de confirmar */}
              <IonButton
                expand="block"
                size="large"
                onClick={handleConfirmRoute}
                disabled={!routeInfo}
                className="confirm-button"
              >
                Confirmo la ruta
              </IonButton>
            </div>
          )}
        </div>

        {/* Modal de búsqueda de destino */}
        <IonModal isOpen={showModal} onDidDismiss={handleCloseModal}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={handleCloseModal}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>¿A dónde vamos?</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="modal-search-content">
            {/* Input de Origen (solo lectura) */}
            <div className="location-input-container">
              <div className="location-input origin">
                <div className="location-icon">
                  <Location size="24" color="#3880ff" variant="Bold" />
                </div>
                <div className="input-content">
                  <label>Origen</label>
                  <input
                    type="text"
                    value={origin?.address || "Tu ubicación"}
                    readOnly
                    className="readonly-input"
                  />
                </div>
              </div>

              {/* Input de Destino (editable con búsqueda) */}
              <div className="location-input destination">
                <div className="location-icon">
                  <Location size="24" color="#eb445a" variant="Bold" />
                </div>
                <div className="input-content">
                  <label>Destino</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar dirección en Colombia..."
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Indicador de carga */}
            {isSearching && (
              <div className="search-loading">
                <IonSpinner />
                <IonText color="medium">Buscando...</IonText>
              </div>
            )}

            {/* Lista de resultados */}
            {searchResults.length > 0 && (
              <IonList className="results-list">
                {searchResults.map((place) => (
                  <IonItem
                    key={place.id}
                    button
                    onClick={() => handleSelectDestination(place)}
                    className="result-item"
                  >
                    <IonIcon icon={navigateCircleOutline} slot="start" color="medium" />
                    <IonLabel>
                      <h3>{place.name}</h3>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}

            {/* Mensaje cuando no hay resultados */}
            {searchQuery.length >= 3 && !isSearching && searchResults.length === 0 && (
              <div className="no-results">
                <IonText color="medium">
                  <p>No se encontraron resultados para "{searchQuery}"</p>
                  <p>Intenta con otra dirección en Colombia</p>
                </IonText>
              </div>
            )}

            {/* Instrucciones iniciales */}
            {searchQuery.length < 3 && (
              <div className="search-instructions">
                <IonText color="medium">
                  <p>Escribe al menos 3 caracteres para buscar una dirección</p>
                </IonText>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default RequestService;
