import { useState, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButton,
  IonSpinner,
  IonText,
  IonBadge,
  useIonAlert,
  useIonToast,
  useIonViewWillLeave,
  useIonViewWillEnter,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { Location } from "iconsax-react";
import { requestAPI } from "../services/api";
import socketService from "../services/socket";
import RequestDetailMap from "../components/RequestDetailMap";
import "./QuoteDetail.css"; // ✅ Reutilizar el mismo CSS

// Importar iconos SVG de vehículos
import carIcon from "../assets/img/vehicles/car.svg";
import motoIcon from "../assets/img/vehicles/moto.svg";
import camionetaIcon from "../assets/img/vehicles/camioneta.svg";
import camionIcon from "../assets/img/vehicles/camion.svg";
import busIcon from "../assets/img/vehicles/bus.svg";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ============================================
// API URL Configuration
// ============================================
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const QuoteDetail = () => {
  const { requestId } = useParams();
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();

  const [request, setRequest] = useState(null);
  const [myQuote, setMyQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Desmontar mapa antes de la animación de salida de Ionic
  const [showMap, setShowMap] = useState(true);
  useIonViewWillLeave(() => setShowMap(false));
  useIonViewWillEnter(() => setShowMap(true));

  // ✅ NUEVO: Estados para compatibilidad con RequestDetailMap
  const [driverPhoto, setDriverPhoto] = useState(
    "https://ionicframework.com/docs/img/demos/avatar.svg",
  );
  const [driverAddress, setDriverAddress] = useState("Obteniendo ubicación...");
  // ⚡ Ubicación por defecto (Bogotá) mientras se obtiene la real
  const [driverLocation, setDriverLocation] = useState({
    lat: 4.6097,
    lng: -74.0817,
  });

  // Escuchar eventos de socket que afectan al estado de esta cotización mientras
  // el conductor espera respuesta aquí (puede no estar en Home).
  useEffect(() => {
    // 1. El cliente ACEPTÓ mi cotización → ir a ActiveService
    socketService.onServiceAccepted((data) => {
      console.log('🎉 [QuoteDetail] Cotización aceptada por el cliente:', data);

      const parsedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const serviceToSave = {
        ...data,
        driverId: data.driverId || parsedUser?._id || parsedUser?.id,
      };

      localStorage.setItem('activeService', JSON.stringify(serviceToSave));
      localStorage.removeItem('lastQuotedRequest');

      // Marcar conductor como OCUPADO (consistente con Home.onServiceAccepted)
      const updatedUser = { ...parsedUser };
      if (updatedUser.driverProfile) updatedUser.driverProfile.isOnline = false;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      present({
        message: `¡Tu cotización fue aceptada! Cliente: ${data.clientName}`,
        duration: 3000,
        color: 'success',
      });

      setTimeout(() => {
        window.location.replace('/active-service');
      }, 400);
    });

    // 2. El CLIENTE CANCELÓ la búsqueda (antes de aceptar a nadie)
    socketService.onRequestCancelled((data) => {
      console.log('🚫 [QuoteDetail] Solicitud cancelada por el cliente:', data);

      // Solo reaccionar si es la solicitud que estamos viendo
      if (data.requestId?.toString() !== requestId?.toString()) return;

      localStorage.removeItem('lastQuotedRequest');

      present({
        message: 'El cliente canceló la búsqueda',
        duration: 3000,
        color: 'warning',
      });

      setTimeout(() => {
        window.location.replace('/home');
      }, 400);
    });

    // 3. Otro conductor fue seleccionado (service:taken) — ya no hay nada que esperar
    socketService.onServiceTaken((data) => {
      console.log('⚠️ [QuoteDetail] Servicio tomado por otro conductor:', data);

      if (data.requestId?.toString() !== requestId?.toString()) return;

      localStorage.removeItem('lastQuotedRequest');

      present({
        message: 'El cliente eligió a otro conductor',
        duration: 3000,
        color: 'medium',
      });

      setTimeout(() => {
        window.location.replace('/home');
      }, 400);
    });

    // 4. La cotización expiró (backend emite quote:expired al conductor afectado)
    socketService.onQuoteExpired((data) => {
      console.log('⏰ [QuoteDetail] Cotización expirada:', data);

      if (data.requestId?.toString() !== requestId?.toString()) return;

      localStorage.removeItem('lastQuotedRequest');

      present({
        message: 'La cotización expiró sin respuesta del cliente',
        duration: 3000,
        color: 'medium',
      });

      setTimeout(() => {
        window.location.replace('/home');
      }, 400);
    });

    return () => {
      socketService.offServiceAccepted();
      socketService.offRequestCancelled();
      socketService.offServiceTaken();
      socketService.offQuoteExpired();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    // ⚡ Cargar datos críticos primero (bloquea UI)
    loadRequestDetail();

    // ⚡ Cargar datos secundarios en paralelo (no bloquea UI)
    loadDriverPhoto();
    loadDriverAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  // Actualizar tiempo transcurrido cada segundo
  useEffect(() => {
    if (!myQuote) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(myQuote.timestamp).getTime();
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setTimeElapsed(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [myQuote]);

  const loadDriverPhoto = async () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const response = await fetch(
          `${API_URL}/api/drivers/profile/${parsedUser._id}`,
        );
        const data = await response.json();

        if (response.ok && data.driver?.documents?.selfie) {
          setDriverPhoto(data.driver.documents.selfie);
          console.log("✅ Foto del conductor cargada");
        }
      }
    } catch (error) {
      console.error("❌ Error al cargar foto del conductor:", error);
    }
  };

  const loadDriverAddress = async () => {
    try {
      // Obtener ubicación actual del conductor
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            setDriverLocation({ lat, lng });
            console.log("✅ Ubicación GPS obtenida:", { lat, lng });

            if (!MAPBOX_TOKEN) {
              setDriverAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              return;
            }

            // Obtener dirección legible (no bloquea renderizado)
            try {
              const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=es`,
              );
              const data = await response.json();

              if (data.features && data.features.length > 0) {
                const address = data.features[0].place_name;
                setDriverAddress(address);
                console.log("📍 Dirección del conductor:", address);
              } else {
                setDriverAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              }
            } catch (geoError) {
              console.error("⚠️ Error obteniendo dirección:", geoError);
              setDriverAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          },
          (error) => {
            console.error("❌ Error obteniendo ubicación GPS:", error);
            setDriverAddress("Bogotá, Colombia");
            // Mantener ubicación por defecto
          },
          {
            // ⚡ Opciones para GPS más rápido
            enableHighAccuracy: false, // Más rápido, menos preciso (suficiente para mapa)
            timeout: 5000, // Timeout de 5 segundos
            maximumAge: 300000, // Aceptar ubicación cacheada de hasta 5 minutos
          },
        );
      }
    } catch (error) {
      console.error("❌ Error en loadDriverAddress:", error);
      setDriverAddress("Bogotá, Colombia");
    }
  };

  const loadRequestDetail = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      // Cargar del backend
      const response = await requestAPI.getRequest(requestId);
      const requestData = response.data.request;

      console.log("✅ Request cargado del backend:", requestData);

      // Buscar MI cotización
      const quote = requestData.quotes?.find(
        (q) => q.driverId.toString() === user._id.toString(),
      );

      if (!quote) {
        console.log("⚠️ No tienes una cotización para esta solicitud");
        present({
          message: "No tienes una cotización para esta solicitud",
          duration: 2000,
          color: "warning",
        });
        history.goBack();
        return;
      }

      setMyQuote(quote);
      setRequest(requestData);
      console.log("✅ Cotización encontrada:", quote);
    } catch (error) {
      console.error("❌ Error al cargar detalle:", error);
      present({
        message: "Error al cargar detalle de la cotización",
        duration: 2000,
        color: "danger",
      });
      history.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getVehicleIcon = (iconEmoji) => {
    // Mapeo de emojis
    const iconMap = {
      "🏍️": motoIcon,
      "🚗": carIcon,
      "🚙": camionetaIcon,
      "🚚": camionIcon,
      "🚌": busIcon,
    };

    // Mapeo de IDs de categoría
    const categoryMap = {
      MOTOS: motoIcon,
      AUTOS: carIcon,
      CAMIONETAS: camionetaIcon,
      CAMIONES: camionIcon,
      BUSES: busIcon,
    };

    // Intentar primero por emoji, luego por ID de categoría
    return iconMap[iconEmoji] || categoryMap[iconEmoji] || carIcon;
  };

  const handleCancelQuote = () => {
    presentAlert({
      header: "¿Cancelar Cotización?",
      message: "Selecciona el motivo de la cancelación:",
      inputs: [
        {
          type: "radio",
          label: "No puedo atender",
          value: "no_puedo_atender",
          checked: true,
        },
        {
          type: "radio",
          label: "Error en el monto",
          value: "error_monto",
        },
        {
          type: "radio",
          label: "Muy lejos",
          value: "muy_lejos",
        },
        {
          type: "radio",
          label: "Cliente sospechoso",
          value: "cliente_sospechoso",
        },
        {
          type: "radio",
          label: "Otro motivo",
          value: "otro",
        },
      ],
      buttons: [
        {
          text: "Volver",
          role: "cancel",
        },
        {
          text: "Confirmar Cancelación",
          cssClass: "alert-button-confirm",
          handler: async (reason) => {
            if (!reason) {
              present({
                message: "Selecciona un motivo",
                duration: 2000,
                color: "warning",
              });
              return false;
            }

            if (reason === "otro") {
              // Mostrar segundo alert para ingresar motivo personalizado
              presentAlert({
                header: "Otro Motivo",
                message: "Describe el motivo de la cancelación:",
                inputs: [
                  {
                    name: "customReason",
                    type: "textarea",
                    placeholder: "Escribe aquí...",
                  },
                ],
                buttons: [
                  {
                    text: "Cancelar",
                    role: "cancel",
                  },
                  {
                    text: "Confirmar",
                    handler: (data) => {
                      if (
                        !data.customReason ||
                        data.customReason.trim() === ""
                      ) {
                        present({
                          message: "Debes escribir un motivo",
                          duration: 2000,
                          color: "warning",
                        });
                        return false;
                      }
                      cancelQuote(reason, data.customReason);
                    },
                  },
                ],
              });
            } else {
              await cancelQuote(reason);
            }
          },
        },
      ],
    });
  };

  const cancelQuote = async (reason, customReason = null) => {
    setCancelling(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      await requestAPI.cancelQuote(requestId, user._id, {
        reason,
        customReason,
      });

      present({
        message: "Cotización cancelada exitosamente",
        duration: 2000,
        color: "success",
      });

      // Limpiar lastQuotedRequest del localStorage para que no reaparezca en Home
      localStorage.removeItem('lastQuotedRequest');

      // window.location.replace limpia el stack de Ionic completamente
      setTimeout(() => {
        window.location.replace("/home");
      }, 400);
    } catch (error) {
      console.error("Error al cancelar:", error);
      present({
        message: error.response?.data?.error || "Error al cancelar cotización",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = () => {
    if (!myQuote) return null;

    const statusConfig = {
      pending: { color: "warning", text: "Pendiente" },
      accepted: { color: "success", text: "Aceptada" },
      cancelled: { color: "danger", text: "Cancelada" },
      expired: { color: "medium", text: "Expirada" },
    };

    const config = statusConfig[myQuote.status] || statusConfig.pending;

    return (
      <IonBadge
        color={config.color}
        style={{ fontSize: "14px", padding: "8px 12px" }}
      >
        {config.text}
      </IonBadge>
    );
  };

  // ⚡ Solo mostrar loading si NO tenemos los datos críticos del request
  if (loading || !request || !myQuote) {
    return (
      <IonPage>
        <IonFab slot="fixed" vertical="top" horizontal="start">
          <IonFabButton color="light" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBack} />
          </IonFabButton>
        </IonFab>
        <IonContent className="ion-padding ion-text-center">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "15px",
            }}
          >
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p>Cargando detalles...</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Validar coordenadas (error crítico)
  if (!request.origin?.coordinates || !request.destination?.coordinates) {
    return (
      <IonPage>
        <IonFab slot="fixed" vertical="top" horizontal="start">
          <IonFabButton color="light" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBack} />
          </IonFabButton>
        </IonFab>
        <IonContent className="ion-padding">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <IonSpinner name="crescent" />
            <IonText color="medium">Cargando coordenadas...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
    <IonContent>
      <IonFab slot="fixed" vertical="top" horizontal="start">
        <IonFabButton color="light" onClick={() => history.goBack()}>
          <IonIcon icon={arrowBack} />
        </IonFabButton>
      </IonFab>

      <div className="request-detail-page">
        {/* Mapa — se desmonta antes de la animación de salida para evitar
            que Mapbox haga appendChild en un contenedor inválido */}
        <div className="map-section">
          {showMap && (
            <RequestDetailMap
              request={request}
              driverLocation={driverLocation}
              driverPhoto={driverPhoto}
            />
          )}
        </div>

        {/* Contenido de detalles */}
        <div className="detail-content-quote-detail">
          <div className="pending-quote-container">
            <h2 className="quote-title-send-quote">Servicio cotizado</h2>
            {/* Monto Cotizado Destacado */}

            <div className="amount-card">
              <p className="amount-card-label">Monto cotizado:</p>
              <h3 className="amount-card-amount">${myQuote.amount.toLocaleString()}</h3>
              <h4 className="pending-quote-time">
                {" "}
                Enviada hace {timeElapsed}
              </h4>
            </div>
          </div>

          <div className="pending-quote-container">
            <h2 className="quote-title-send-quote">Ruta del servicio</h2>
            {/* Información del conductor (Tu ubicación) */}
            <div className="route-sections">
              {/* Tu ubicación */}
              <div className="user-location-card">
                <div className="user-avatar user-avatar-with-line">
                  <img
                    src={driverPhoto}
                    alt="Conductor"
                    onError={(e) => {
                      e.target.src =
                        "https://ionicframework.com/docs/img/demos/avatar.svg";
                    }}
                  />
                </div>
                <div className="user-info">
                  <IonText color="medium" className="location-label">
                    Mi ubicación
                  </IonText>
                  <IonText color="medium" className="user-address">
                    <p>{driverAddress}</p>
                  </IonText>
                </div>
              </div>

              {/* Origen aproximado */}
              <div className="location-section">
                <div className="location-icon location-icon-with-line">
                  <Location size="24" variant="Bold" color="#0055ff" />
                </div>
                <div className="location-text">
                  <IonText color="medium" className="location-label">
                    Origen
                  </IonText>
                  <IonText className="location-address">
                    {request.origin.address}
                  </IonText>
                </div>
              </div>

              {/* Destino */}
              <div className="location-section">
                <div className="location-icon-destination">
                  <Location size="24" variant="Bold" color="#eb445a" />
                </div>
                <div className="location-text">
                  <IonText color="medium" className="location-label">
                    Destino
                  </IonText>
                  <IonText className="location-address">
                    {request.destination.address}
                  </IonText>
                </div>
              </div>
            </div>{" "}
            {/* fin route-sections */}
          </div>

          <div className="pending-quote-container">
          <h2 className="quote-title-send-quote">Vehículo varado</h2>
            {/* Vehículo y Problema */}
            {request.vehicleSnapshot && (
              <div className="vehicle-problem-card-quote-detail">
                <div className="vehicle-info-quote-detail">
                  <div className="vehicle-icon-quote-detail">
                    <img
                      src={getVehicleIcon(
                        request.vehicleSnapshot.category?.id || "🚗",
                      )}
                      alt={request.vehicleSnapshot.category?.name || "Vehículo"}
                      className="vehicle-svg-icon"
                    />
                  </div>
                  <div className="vehicle-details-quote-detail">
                    <h3 className="vehicle-brand-quote-detail">
                      {request.vehicleSnapshot.brand?.name || "N/A"}
                    </h3>

                    <p className="vehicle-model-quote-detail">
                      {request.vehicleSnapshot.model?.name || "N/A"}
                    </p>
                  </div>
                </div>

                {request.serviceDetails?.problem && (
                  <div className="problem-section">
                    <IonText color="medium" className="section-label">
                      Problema reportado
                    </IonText>
                    <IonText className="problem-text">
                      {request.serviceDetails.problem}
                    </IonText>
                  </div>
                )}

                {/* Datos adicionales del vehículo */}
                {(request.vehicleSnapshot?.isArmored ||
                  request.serviceDetails?.basement?.isInBasement ||
                  request.vehicleSnapshot?.truckData ||
                  request.vehicleSnapshot?.busData) && (
                  <div className="vehicle-additional-badge-quote-detail">
                    {/* Blindado (Autos y Camionetas) */}
                    {request.vehicleSnapshot?.isArmored && (
                      <div className="detail-badge">🛡️ Blindado</div>
                    )}

                    {/* Sótano (del serviceDetails actual) */}
                    {request.serviceDetails?.basement?.isInBasement && (
                      <div className="detail-badge">
                        🏢 Sótano nivel {request.serviceDetails.basement.level}
                      </div>
                    )}

                    {/* Datos específicos de CAMIONES */}
                    {request.vehicleSnapshot?.truckData && (
                      <>
                        {request.vehicleSnapshot.truckData.trailerType && (
                          <div className="detail-badge">
                            🚛{" "}
                            {request.vehicleSnapshot.truckData.trailerType
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                        )}
                        {request.vehicleSnapshot.truckData.axleType && (
                          <div className="detail-badge">
                            🛞{" "}
                            {request.vehicleSnapshot.truckData.axleType ===
                            "sencilla"
                              ? "Llanta Sencilla"
                              : "Llanta Doble"}
                          </div>
                        )}
                        {request.vehicleSnapshot.truckData.length && (
                          <div className="detail-badge">
                            📏 Largo: {request.vehicleSnapshot.truckData.length}{" "}
                            m
                          </div>
                        )}
                        {request.vehicleSnapshot.truckData.height && (
                          <div className="detail-badge">
                            📐 Alto: {request.vehicleSnapshot.truckData.height}{" "}
                            m
                          </div>
                        )}
                        {request.vehicleSnapshot.truckData.tonnage && (
                          <div className="detail-badge">
                            ⚖️ {request.vehicleSnapshot.truckData.tonnage} ton
                          </div>
                        )}
                        {request.serviceDetails?.truckCurrentState
                          ?.isLoaded && (
                          <div className="detail-badge">
                            📦 Cargado:{" "}
                            {
                              request.serviceDetails.truckCurrentState
                                .currentWeight
                            }{" "}
                            ton
                          </div>
                        )}
                      </>
                    )}

                    {/* Datos específicos de BUSES */}
                    {request.vehicleSnapshot?.busData && (
                      <>
                        {request.vehicleSnapshot.busData.passengerCapacity && (
                          <div className="detail-badge">
                            👥{" "}
                            {request.vehicleSnapshot.busData.passengerCapacity}{" "}
                            pasajeros
                          </div>
                        )}
                        {request.vehicleSnapshot.busData.axleType && (
                          <div className="detail-badge">
                            🛞{" "}
                            {request.vehicleSnapshot.busData.axleType ===
                            "sencilla"
                              ? "Llanta Sencilla"
                              : "Llanta Doble"}
                          </div>
                        )}
                        {request.vehicleSnapshot.busData.length && (
                          <div className="detail-badge">
                            📏 Largo: {request.vehicleSnapshot.busData.length} m
                          </div>
                        )}
                        {request.vehicleSnapshot.busData.height && (
                          <div className="detail-badge">
                            📐 Alto: {request.vehicleSnapshot.busData.height} m
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Botón Cancelar Cotización (solo si está pendiente) */}
          {myQuote.status === "pending" && (
            <button
              expand="block"
              onClick={handleCancelQuote}
              disabled={cancelling}
              className="send-quote-button"
              style={{ background: "#eb445a" }}
            >
              {cancelling ? "Cancelando..." : "Cancelar Cotización"}
            </button>
          )}

          {/* Mensaje si ya fue cancelada o expirada */}
          {(myQuote.status === "cancelled" || myQuote.status === "expired") && (
            <div
              style={{
                padding: "15px",
                background: "#f4f4f4",
                borderRadius: "10px",
                textAlign: "center",
                width: "100%",
              }}
            >
              <IonText color="medium">
                <p style={{ margin: "0" }}>
                  {myQuote.status === "cancelled"
                    ? "❌ Esta cotización fue cancelada"
                    : "⏰ Esta cotización expiró"}
                </p>
              </IonText>
            </div>
          )}

          {/* Mensaje si fue aceptada */}
          {myQuote.status === "accepted" && (
            <div
              style={{
                padding: "20px",
                background: "linear-gradient(135deg, #10dc60 0%, #24d6a3 100%)",
                borderRadius: "15px",
                textAlign: "center",
                width: "100%",
                boxShadow: "0 4px 10px rgba(16, 220, 96, 0.3)",
              }}
            >
              <IonText style={{ color: "white" }}>
                <h3 style={{ margin: "0 0 8px 0" }}>
                  🎉 ¡Cotización Aceptada!
                </h3>
                <p style={{ margin: "0", fontSize: "14px" }}>
                  El cliente aceptó tu cotización. Prepárate para el servicio.
                </p>
              </IonText>
            </div>
          )}
        </div>
      </div>
    </IonContent>
    </IonPage>
  );
};

export default QuoteDetail;
