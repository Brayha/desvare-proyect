import { useState, useEffect } from "react";
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
import { getAddressFromCoordinates, searchAddress, getPlaceDetails } from "../utils/mapbox";
import { requestAPI } from "../services/api";
import socketService from "../services/socket";
import "./RequestService.css";

const RequestService = () => {
  const history = useHistory();
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

  // Verificar si el usuario ya está logueado
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setIsLoggedIn(true);
      setCurrentUser(parsedUser);
      console.log('✅ Usuario ya logueado:', parsedUser.name);
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
      console.log('ℹ️ Usuario no logueado');
    }
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
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [isEditingOrigin, setIsEditingOrigin] = useState(false); // Para saber si estamos editando origen o destino

  // Estado de usuario logueado
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false); // Para detectar cambios reales

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
    // Si no hay query suficiente, limpiar resultados
    if (searchQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      setLastSearchQuery("");
      return;
    }

    // 🔥 CLAVE: Solo buscar si el query cambió realmente
    if (searchQuery === lastSearchQuery) {
      console.log('⏸️ Búsqueda pausada - query sin cambios');
      return;
    }

    // Mostrar indicador de carga inmediatamente
    setIsSearching(true);

    const delayDebounce = setTimeout(async () => {
      try {
        console.log(`🔍 Buscando "${searchQuery}"...`);
        
        // Pasar la ubicación del usuario para priorizar resultados cercanos
        const userLocation = origin ? { lat: origin.lat, lng: origin.lng } : null;
        const results = await searchAddress(searchQuery, userLocation);
        
        setSearchResults(results);
        setLastSearchQuery(searchQuery); // 🔥 Guardar query buscado para no repetir
        console.log(`✅ ${results.length} resultados encontrados`);
      } catch (error) {
        console.error("Error buscando dirección:", error);
        showError("Error al buscar dirección");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 1000); // 1 segundo de debounce (más tiempo = menos llamadas)

    return () => {
      clearTimeout(delayDebounce);
      // No limpiar isSearching aquí para que se vea el spinner
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, origin, showError]);

  const handleOpenSearchModal = (isOrigin = false) => {
    setIsEditingOrigin(isOrigin);
    setShowModal(true);
    setSearchQuery("");
    setSearchResults([]);
    setLastSearchQuery(""); // Resetear búsqueda anterior
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSearchQuery("");
    setSearchResults([]);
    setLastSearchQuery(""); // Resetear búsqueda anterior
    setIsEditingOrigin(false);
  };

  const handleSelectDestination = async (place) => {
    try {
      let newLocation = null;
      
      // Si el lugar viene de Google Places (sin coordenadas), obtener detalles
      if (place.source === 'google' && place.place_id) {
        setIsSearching(true);
        console.log('🔍 Obteniendo coordenadas del lugar seleccionado...');
        
        const details = await getPlaceDetails(place.place_id);
        
        newLocation = {
          lat: details.coordinates[1],
          lng: details.coordinates[0],
          address: details.name,
        };
        setIsSearching(false);
      } else if (place.coordinates) {
        // Si ya tiene coordenadas (viene de Mapbox), usar directamente
        newLocation = {
          lat: place.coordinates[1],
          lng: place.coordinates[0],
          address: place.name,
        };
      } else {
        throw new Error('No se pudo obtener las coordenadas del lugar');
      }

      // Aplicar el cambio según si estamos editando origen o destino
      if (isEditingOrigin) {
        setOrigin(newLocation);
        handleCloseModal();
        showSuccess("✅ Origen actualizado");
        
        // Si ya había un destino, la ruta se recalculará automáticamente
        if (destination) {
          console.log('🔄 Recalculando ruta con nuevo origen...');
        }
      } else {
        setDestination(newLocation);
        handleCloseModal();
        showSuccess("✅ Destino seleccionado");
      }
    } catch (error) {
      console.error('❌ Error al seleccionar ubicación:', error);
      showError("Error al obtener coordenadas del lugar");
      setIsSearching(false);
    }
  };

  const handleEditRoute = () => {
    setDestination(null);
    setRouteInfo(null);
  };

  // Función para enviar solicitud directamente (usuario ya logueado)
  const sendRequestDirectly = async () => {
    if (!currentUser || !origin || !destination || !routeInfo) {
      showError('Faltan datos para enviar la solicitud');
      return;
    }
    
    setIsSendingRequest(true);

    try {
      console.log('📤 Usuario logueado - Enviando solicitud directamente...');

      // Verificar si Socket.IO está conectado, si no, conectar
      const socket = socketService.connect();
      
      await new Promise((resolve) => {
        if (socket.connected) {
          console.log('✅ Socket.IO ya estaba conectado');
          resolve();
        } else {
          socket.once('connect', () => {
            console.log('✅ Socket.IO conectado exitosamente');
            resolve();
          });
        }
      });

      // Registrar cliente si no está registrado
      socketService.registerClient(currentUser.id);
      console.log('👤 Cliente registrado en Socket.IO:', currentUser.id);

      // Crear objeto de solicitud
      const requestPayload = {
        clientId: currentUser.id,
        clientName: currentUser.name,
        clientPhone: currentUser.phone || 'N/A',
        clientEmail: currentUser.email,
        origin: {
          coordinates: [origin.lng, origin.lat],
          address: origin.address,
        },
        destination: {
          coordinates: [destination.lng, destination.lat],
          address: destination.address,
        },
        distance: routeInfo.distance,
        duration: routeInfo.duration,
      };

      console.log('📦 Payload de solicitud:', requestPayload);

      // Crear solicitud en la base de datos
      const response = await requestAPI.createRequest(requestPayload);
      
      const requestId = response.data.requestId;
      
      // Guardar el requestId en localStorage
      localStorage.setItem('currentRequestId', requestId);

      // Guardar también requestData para WaitingQuotes
      localStorage.setItem(
        "requestData",
        JSON.stringify({
          origin,
          destination,
          routeInfo,
        })
      );

      console.log('📡 Enviando evento Socket.IO a conductores...');
      console.log('🎯 Request ID:', requestId);
      
      // Emitir evento de nueva solicitud vía Socket.IO
      socketService.sendNewRequest({
        requestId: requestId,
        clientId: currentUser.id,
        clientName: currentUser.name,
        origin: origin.address,
        destination: destination.address,
        distance: routeInfo.distance,
        duration: routeInfo.duration,
      });

      console.log('✅ Solicitud enviada correctamente');
      showSuccess('✅ Buscando conductores...');

      // Redirigir a waiting quotes
      setTimeout(() => {
        history.push('/waiting-quotes');
      }, 500);

    } catch (error) {
      console.error('❌ Error al enviar solicitud:', error);
      showError(error.response?.data?.error || "Error al enviar solicitud");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleConfirmRoute = () => {
    if (!routeInfo) {
      showError("⚠️ Espera mientras calculamos la ruta");
      return;
    }

    console.log('📦 RouteInfo que se guardará:', routeInfo);

    // Si el usuario YA está logueado, enviar solicitud directamente
    if (isLoggedIn && currentUser) {
      console.log('✅ Usuario logueado - Enviando solicitud directamente');
      sendRequestDirectly();
      return;
    }

    // Si NO está logueado, guardar datos y redirigir a login/registro
    console.log('ℹ️ Usuario no logueado - Redirigiendo a login/registro');

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

    // Navegar a la página de autenticación/confirmación
    history.push('/request-auth');
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
              {/* Dirección de origen (clickeable para editar) */}
              <div className="origin-display" onClick={() => handleOpenSearchModal(true)}>
                <div className="origin-icon">
                  <Location size="20" color="#3880ff" variant="Bold" />
                </div>
                <div className="origin-text">
                  <small>Origen</small>
                  <p>{origin.address}</p>
                </div>
                <IonIcon icon={navigateCircleOutline} className="edit-icon" />
              </div>
              
              {/* Botón de destino */}
              <div className="search-button" onClick={() => handleOpenSearchModal(false)}>
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
                disabled={!routeInfo || isSendingRequest}
                className="confirm-button"
              >
                {isSendingRequest ? (
                  <>
                    <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                    Enviando solicitud...
                  </>
                ) : isLoggedIn ? (
                  '🚀 Buscar Cotizaciones'
                ) : (
                  'Confirmo la ruta'
                )}
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
              <IonTitle>{isEditingOrigin ? 'Cambiar origen' : '¿A dónde vamos?'}</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="modal-search-content">
            {/* Input de búsqueda unificado */}
            <div className="location-input-container">
              <div className={`location-input ${isEditingOrigin ? 'origin' : 'destination'}`}>
                <div className="location-icon">
                  <Location size="24" color={isEditingOrigin ? "#3880ff" : "#eb445a"} variant="Bold" />
                </div>
                <div className="input-content">
                  <label>{isEditingOrigin ? 'Nuevo origen' : 'Destino'}</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isEditingOrigin ? "Buscar nueva ubicación de origen..." : "Buscar dirección en Colombia..."}
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
