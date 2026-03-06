import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
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
import { navigateCircleOutline, add } from "ionicons/icons";
import { Location, Refresh } from "iconsax-react";
import { MapPicker } from "../components/Map/MapPicker";
import VehicleWizardModal from "../components/VehicleWizardModal/VehicleWizardModal";
import { useGeolocation } from "../hooks/useGeolocation";
import { useToast } from "@hooks/useToast";
import { IonProgressBar } from "@ionic/react";
import {
  getAddressFromCoordinates,
  searchAddress,
  getPlaceDetails,
} from "../utils/mapbox";
import { requestAPI } from "../services/api";
import socketService from "../services/socket";
import { useAuth } from "../contexts/AuthContext";
import { getVehicleImageFromVehicle } from "../utils/vehicleImages";
import { Button } from "../components/Button/Button";
import "./RequestService.css";
import logo from "../assets/img/Desvare.svg";

const RequestService = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  const { user: currentUser, isLoggedIn, setShowNotificationPrompt } = useAuth();

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
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [isEditingOrigin, setIsEditingOrigin] = useState(false); // Para saber si estamos editando origen o destino

  const [isSendingRequest, setIsSendingRequest] = useState(false); // Para detectar cambios reales

  // Estados del wizard de vehículos
  const [showVehicleWizard, setShowVehicleWizard] = useState(false);
  const [vehicleData, setVehicleData] = useState(null); // Datos completos del vehículo y servicio

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGeolocation]);

  // Mostrar error de geolocalización
  useEffect(() => {
    if (geoError) {
      showError(geoError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoError]);

  // ✅ Cargar datos previos del localStorage (cuando cliente cancela búsqueda)
  useEffect(() => {
    const savedRequestData = localStorage.getItem('requestData');
    const currentRequestId = localStorage.getItem('currentRequestId');
    
    if (savedRequestData) {
      try {
        const parsed = JSON.parse(savedRequestData);
        console.log('🔄 Cargando datos previos desde localStorage:', parsed);
        
        // Cargar origen previo
        if (parsed.origin && !origin) {
          setOrigin({
            lat: parsed.origin.lat,
            lng: parsed.origin.lng,
            address: parsed.origin.address
          });
          console.log('✅ Origen cargado:', parsed.origin.address);
        }
        
        // Cargar destino previo
        if (parsed.destination && !destination) {
          setDestination({
            lat: parsed.destination.lat,
            lng: parsed.destination.lng,
            address: parsed.destination.address
          });
          console.log('✅ Destino cargado:', parsed.destination.address);
        }
        
        // Cargar información de ruta previa
        if (parsed.routeInfo && !routeInfo) {
          setRouteInfo(parsed.routeInfo);
          console.log('✅ Ruta cargada:', parsed.routeInfo);
        }
        
        // Cargar vehículo previo (estructura completa)
        if (parsed.vehicleSnapshot && parsed.serviceDetails && !vehicleData) {
          setVehicleData({
            vehicleId: parsed.vehicleId, // Puede ser undefined si no existe
            vehicleSnapshot: parsed.vehicleSnapshot,
            serviceDetails: parsed.serviceDetails
          });
          console.log('✅ Vehículo cargado:', {
            vehicleId: parsed.vehicleId,
            marca: parsed.vehicleSnapshot.brand.name,
            modelo: parsed.vehicleSnapshot.model.name,
            placa: parsed.vehicleSnapshot.licensePlate,
            problema: parsed.serviceDetails.problem
          });
        }
        
        // ✅ Limpiar currentRequestId antiguo para evitar conflictos
        if (currentRequestId) {
          localStorage.removeItem('currentRequestId');
          console.log('🗑️ RequestId antiguo eliminado (usuario canceló búsqueda)');
        }
        
        showSuccess('📋 Datos previos cargados. Puedes editarlos y buscar nuevamente.');
      } catch (error) {
        console.error('❌ Error al cargar datos previos:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar

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
      console.log("⏸️ Búsqueda pausada - query sin cambios");
      return;
    }

    // Mostrar indicador de carga inmediatamente
    setIsSearching(true);

    const delayDebounce = setTimeout(async () => {
      try {
        console.log(`🔍 Buscando "${searchQuery}"...`);

        // Pasar la ubicación del usuario para priorizar resultados cercanos
        const userLocation = origin
          ? { lat: origin.lat, lng: origin.lng }
          : null;
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
  }, [searchQuery, lastSearchQuery]);

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
      if (place.source === "google" && place.place_id) {
        setIsSearching(true);
        console.log("🔍 Obteniendo coordenadas del lugar seleccionado...");

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
        throw new Error("No se pudo obtener las coordenadas del lugar");
      }

      // Aplicar el cambio según si estamos editando origen o destino
      if (isEditingOrigin) {
        setOrigin(newLocation);
        handleCloseModal();
        showSuccess("✅ Origen actualizado");

        // Si ya había un destino, la ruta se recalculará automáticamente
        if (destination) {
          console.log("🔄 Recalculando ruta con nuevo origen...");
        }
      } else {
        setDestination(newLocation);
        handleCloseModal();
        showSuccess("✅ Destino seleccionado");
      }
    } catch (error) {
      console.error("❌ Error al seleccionar ubicación:", error);
      showError("Error al obtener coordenadas del lugar");
      setIsSearching(false);
    }
  };

  const handleEditRoute = () => {
    setDestination(null);
    setRouteInfo(null);
  };

  // Handlers del wizard de vehículos
  const handleOpenVehicleWizard = () => {
    setShowVehicleWizard(true);
  };

  const handleVehicleWizardComplete = (data) => {
    console.log("✅ Vehículo y servicio configurados:", data);
    setVehicleData(data);
    showSuccess("✅ Vehículo agregado correctamente");
  };

  const handleVehicleWizardDismiss = () => {
    setShowVehicleWizard(false);
  };

  // Función para enviar solicitud directamente (usuario ya logueado)
  const sendRequestDirectly = async () => {
    if (!currentUser || !origin || !destination || !routeInfo) {
      showError("Faltan datos para enviar la solicitud");
      return;
    }

    if (!vehicleData) {
      showError("Agrega tu vehículo primero");
      return;
    }

    setIsSendingRequest(true);

    try {
      console.log("📤 Usuario logueado - Enviando solicitud directamente...");

      // Socket.IO ya está conectado desde App.jsx, solo registrar cliente
      socketService.registerClient(currentUser.id);
      console.log("👤 Cliente registrado en Socket.IO:", currentUser.id);

      // Crear objeto de solicitud con datos del vehículo
      const requestPayload = {
        clientId: currentUser.id,
        clientName: currentUser.name,
        clientPhone: currentUser.phone || "N/A",
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
        vehicleId: vehicleData.vehicleId,
        vehicleSnapshot: vehicleData.vehicleSnapshot,
        serviceDetails: vehicleData.serviceDetails,
      };

      console.log("📦 Payload de solicitud:", requestPayload);

      // Crear solicitud en la base de datos
      const response = await requestAPI.createRequest(requestPayload);

      const requestId = response.data.requestId;

      // Guardar el requestId en localStorage
      localStorage.setItem("currentRequestId", requestId);

      // Guardar también requestData para WaitingQuotes
      localStorage.setItem(
        "requestData",
        JSON.stringify({
          origin,
          destination,
          routeInfo,
          vehicleId: vehicleData.vehicleId,
          vehicleSnapshot: vehicleData.vehicleSnapshot,
          serviceDetails: vehicleData.serviceDetails,
        })
      );

      console.log("📡 Enviando evento Socket.IO a conductores...");
      console.log("🎯 Request ID:", requestId);

      // Emitir evento de nueva solicitud vía Socket.IO con TODOS los datos incluyendo vehículo
      socketService.sendNewRequest({
        requestId: requestId,
        clientId: currentUser.id,
        clientName: currentUser.name,
        origin: {
          address: origin.address,
          lat: origin.lat,
          lng: origin.lng,
        },
        destination: {
          address: destination.address,
          lat: destination.lat,
          lng: destination.lng,
        },
        distance: routeInfo.distance,
        duration: routeInfo.duration,
        vehicleSnapshot: vehicleData.vehicleSnapshot,
        serviceDetails: vehicleData.serviceDetails,
      });

      console.log("✅ Solicitud enviada correctamente");
      showSuccess("✅ Buscando conductores...");

      // Guardar requestId en localStorage para WaitingQuotes
      localStorage.setItem("currentRequestId", requestId);
      console.log("💾 RequestId guardado en localStorage:", requestId);

      // Esperar un momento para asegurar que localStorage se sincroniza
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirigir a waiting quotes usando replace para evitar loops
      console.log("🔄 Redirigiendo a /waiting-quotes...");
      history.replace("/waiting-quotes");

      // Mostrar prompt de notificaciones DESPUÉS de iniciar la búsqueda
      const promptDismissed =
        localStorage.getItem("notificationPromptDismissed") === "true";
      const shouldPrompt =
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default" &&
        !promptDismissed;
      if (shouldPrompt) {
        setShowNotificationPrompt(true);
      }
    } catch (error) {
      console.error("❌ Error al enviar solicitud:", error);
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

    if (!vehicleData) {
      showError("⚠️ Agrega tu vehículo primero");
      return;
    }

    console.log("📦 RouteInfo que se guardará:", routeInfo);
    console.log("📦 VehicleData que se guardará:", vehicleData);

    // Si el usuario YA está logueado, enviar solicitud directamente
    if (isLoggedIn && currentUser) {
      console.log("✅ Usuario logueado - Enviando solicitud directamente");
      sendRequestDirectly();
      return;
    }

    // Si NO está logueado, guardar datos y redirigir a login/registro
    console.log("ℹ️ Usuario no logueado - Redirigiendo a login/registro");

    // Guardar datos en localStorage para la siguiente página
    localStorage.setItem(
      "requestData",
      JSON.stringify({
        origin,
        destination,
        routeInfo,
        vehicleId: vehicleData.vehicleId,
        vehicleSnapshot: vehicleData.vehicleSnapshot,
        serviceDetails: vehicleData.serviceDetails,
      })
    );

    // Guardar vehicleData por separado (para que RequestAuth pueda leerlo - compatibilidad)
    localStorage.setItem("vehicleData", JSON.stringify(vehicleData));
    console.log("💾 vehicleData guardado en localStorage");

    showSuccess("✅ Datos guardados");

    // Navegar a la página de autenticación/confirmación
    history.push("/request-auth");
  };

  return (
    <IonPage>
      <IonContent className="request-service-page">
        {/* TODO: LOGO */}
        <div className="logo-content" onClick={() => history.replace("/home")}>
          <img src={logo} alt="logo" />
        </div>

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
            <div className="search-bottom-bar-container-wrapper">
              <div className="search-bottom-bar-container">
                {/* Dirección de origen (clickeable para editar) */}
                <div
                  className="origin-display"
                  onClick={() => handleOpenSearchModal(true)}
                >
                  <div className="origin-icon">
                    <Location size="30" color="#0055ff" variant="Bulk" />
                  </div>
                  <div className="origin-text">
                    <small>Origen</small>
                    <p>{origin.address}</p>
                  </div>
                  <div className="edit-button">
                    <p>Editar</p>
                  </div>
                </div>

                {/* Botón de destino */}
                <div
                  className="search-button"
                  onClick={() => handleOpenSearchModal(false)}
                >
                  <div className="search-button-content">
                    <h2>¿A dónde vamos?</h2>
                    <p>
                      Llevaremos tu vehículo a tu taller de confianza, tu casa o
                      una dirección en específica?
                    </p>
                  </div>

                  <div className="add-button">
                    <IonIcon icon={add} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tarjeta inferior con información de ruta - solo si hay destino */}
          {origin && destination && (
            <div className="search-bottom-bar-container-wrapper">
              <div className="confirm-route-card">
                <div className="route-header">
                  <h3>Confirma el trayecto</h3>

                  <div className="edit-button" onClick={handleEditRoute}>
                    <p>Editar</p>
                  </div>
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
                        <p className="location-address">
                          {destination.address}
                        </p>
                      </IonText>
                    </div>
                  </div>
                </div>

                {/* Información de ruta (distancia y tiempo) */}
                {routeInfo && (
                  <div className="route-stats-info">
                    <div className="stat-item-confirmation">
                      <IonText>Distancia</IonText>
                      <IonText>
                        <strong>{routeInfo.distanceText}</strong>
                      </IonText>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat-item-confirmation">
                      <IonText color="medium">Tiempo est.</IonText>
                      <IonText>
                        <strong>{routeInfo.durationText}</strong>
                      </IonText>
                    </div>
                  </div>
                )}

                {/* Botón de agregar vehículo - Solo si NO hay vehículo */}
                {!vehicleData && (
                  <div
                    className="search-button"
                    onClick={handleOpenVehicleWizard}
                  >
                    <div className="search-button-content">
                      <h2>Agrega tu vehículo</h2>
                      <p>Moto, carro, camioneta, bus o camión?</p>
                    </div>

                    <div className="add-button">
                      <IonIcon icon={add} />
                    </div>
                  </div>
                )}

                {/* Card vehículo agregado - Solo si hay vehículo */}
                {vehicleData?.vehicleSnapshot && (
                  <div className="vehicle-added-card">
                    <div
                      className="vehicle-added-card-content"
                      onClick={handleOpenVehicleWizard}
                    >
                      <div className="vehicle-added-card-content-image-container">
                        <img
                          src={getVehicleImageFromVehicle(
                            vehicleData.vehicleSnapshot
                          )}
                          alt={
                            vehicleData.vehicleSnapshot.category?.name ||
                            "Vehículo"
                          }
                        />
                        <div className="vehicle-added-card-content-text">
                          <h3 className="marca">
                            {vehicleData.vehicleSnapshot.brand.name}
                          </h3>
                          <p className="modelo">
                            {vehicleData.vehicleSnapshot.model.name}
                          </p>
                        </div>
                      </div>

                      <div className="vehicle-added-card-content-buttons">
                        <div className="placa">
                          <p>{vehicleData.vehicleSnapshot.licensePlate}</p>
                        </div>
                        <Refresh size="20" color="#9CA3AF" variant="Linear" />
                      </div>

                    </div>
                    <div className="problem-card">
                      <h4>Problema</h4>
                      <p>{vehicleData.serviceDetails.problem}</p>
                    </div>
                  </div>
                )}

                {/* Botón Buscar Cotizaciones - Solo si hay vehículo */}
                {vehicleData?.vehicleSnapshot && (
                  <button
                    className="lp-btn lp-btn--primary lp-nav__cta-mobile"
                    onClick={handleConfirmRoute}
                    disabled={!routeInfo || isSendingRequest}
                    loading={isSendingRequest}
                  >
                    {isSendingRequest
                      ? "Enviando solicitud..."
                      : "Buscar Cotizaciones"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal de búsqueda de destino */}
        <IonModal
          mode="ios"
          isOpen={showModal}
          onDidDismiss={handleCloseModal}
          className="modal-search-container"
        >
          <IonContent mode="ios" className="modal-search-content">
            <div className="modal-header">
              <h2>{isEditingOrigin ? "Cambiar origen" : "¿A dónde vamos?"}</h2>
              <button className="edit-button" onClick={handleCloseModal}>
                <p>Cancelar</p>
              </button>
            </div>
            {/* Input de búsqueda unificado */}
            <div className="location-input-container">
              <div
                className={`location-input ${
                  isEditingOrigin ? "origin" : "destination"
                }`}
              >
                <div className="location-icon">
                  <Location
                    size="24"
                    color={isEditingOrigin ? "#0055ff" : "#FF5500"}
                    variant="Bold"
                  />
                </div>
                <div className="input-content">
                  <label>{isEditingOrigin ? "Nuevo origen" : "Destino"}</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isEditingOrigin
                        ? "Buscar nueva ubicación de origen..."
                        : "Buscar dirección en Colombia..."
                    }
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Indicador de carga */}
            {isSearching && (
              <div className="search-loading">
                <IonProgressBar type="indeterminate"></IonProgressBar>
                <IonText className="search-loading-text">Buscando...</IonText>
              </div>
            )}

            {/* Lista de resultados */}
            {searchResults.length > 0 && (
              <IonList className="results-list" mode="ios">
                {searchResults.map((place) => (
                  <IonItem
                    key={place.id}
                    mode="ios"
                    lines="none"
                    button
                    onClick={() => handleSelectDestination(place)}
                    className="result-item"
                  >
                    <IonIcon
                      icon={navigateCircleOutline}
                      mode="ios"
                      slot="start"
                      color="medium"
                    />
                    <IonLabel mode="ios">
                      <h3>{place.name}</h3>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}

            {/* Mensaje cuando no hay resultados */}
            {searchQuery.length >= 3 &&
              !isSearching &&
              searchResults.length === 0 && (
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

        {/* Modal de wizard de vehículos */}
        <VehicleWizardModal
          isOpen={showVehicleWizard}
          onDismiss={handleVehicleWizardDismiss}
          onComplete={handleVehicleWizardComplete}
        />
      </IonContent>
    </IonPage>
  );
};

export default RequestService;
