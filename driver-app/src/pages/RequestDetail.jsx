import { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonText,
  IonSpinner,
} from "@ionic/react";
import { Location } from "iconsax-react";
import RequestDetailMap from "../components/RequestDetailMap";
import "./RequestDetail.css";

// Importar iconos SVG de vehículos
import carIcon from "../assets/img/vehicles/car.svg";
import motoIcon from "../assets/img/vehicles/moto.svg";
import camionetaIcon from "../assets/img/vehicles/camioneta.svg";
import camionIcon from "../assets/img/vehicles/camion.svg";
import busIcon from "../assets/img/vehicles/bus.svg";

// ============================================
// API URL Configuration
// ============================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const RequestDetail = () => {
  const history = useHistory();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [driverPhoto, setDriverPhoto] = useState(
    "https://ionicframework.com/docs/img/demos/avatar.svg",
  );
  const [driverAddress, setDriverAddress] = useState("Cargando ubicación...");

  const request = location.state?.request;
  const driverLocation = location.state?.driverLocation;

  useEffect(() => {
    // Cargar foto del conductor desde el API
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

    // Geocodificación inversa para obtener dirección legible del conductor
    const getDriverAddress = async () => {
      try {
        if (!driverLocation) return;

        const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
        if (!MAPBOX_TOKEN) {
          setDriverAddress(
            `${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(
              4,
            )}`,
          );
          return;
        }

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${driverLocation.lng},${driverLocation.lat}.json?access_token=${MAPBOX_TOKEN}&language=es`,
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          // Obtener la dirección más completa posible
          const address = data.features[0].place_name;
          setDriverAddress(address);
          console.log("📍 Dirección del conductor:", address);
        } else {
          setDriverAddress(
            `${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(
              4,
            )}`,
          );
        }
      } catch (error) {
        console.error("❌ Error obteniendo dirección:", error);
        setDriverAddress(
          `${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(4)}`,
        );
      }
    };

    loadDriverPhoto();
    getDriverAddress();

    if (!request || !driverLocation) {
      console.warn("⚠️ No hay datos de la solicitud. Redirigiendo a inicio...");
      setTimeout(() => {
        history.replace("/home");
      }, 1500);
    } else {
      setLoading(false);
    }
  }, [request, driverLocation, history]);

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

  const handleSendQuote = () => {
    history.push("/quote-amount", {
      request: request,
      driverLocation: driverLocation,
    });
  };

  if (loading || !request || !driverLocation) {
    return (
      <IonPage>
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
            {!request && (
              <IonText color="danger">
                <p>No hay datos de la solicitud - Redirigiendo a inicio...</p>
              </IonText>
            )}
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="Atrás" />
          </IonButtons>
          <IonTitle>Detalle del servicio</IonTitle>
        </IonToolbar>
      </IonHeader>

      <div className="request-detail-page">
        {/* Mapa */}
        <div className="map-section">
          <RequestDetailMap
            request={request}
            driverLocation={driverLocation}
            driverPhoto={driverPhoto}
          />
        </div>

        {/* Contenido de detalles */}
        <div className="detail-content-request-detail">
          <div className="request-detail-content-request-detail">
            <h3 className="type-title">Nueva solicitud</h3>
            {/* Información de ubicación del conductor */}
            <div className="card-request-detail">
              <h2 className="quote-title">Detalle del servicio</h2>
              <div className="user-location-card">
                <div className="user-avatar">
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
                  <IonText className="user-name">
                    <h3>Tu</h3>
                  </IonText>
                  <IonText color="medium" className="user-address">
                    <p>{driverAddress}</p>
                  </IonText>
                </div>
              </div>

              {/* Origen aproximado */}
              <div className="location-section">
                <div className="location-icon">
                  <Location size="24" variant="Bold" color="#3880ff" />
                </div>
                <div className="location-text">
                  <IonText color="medium" className="location-label">
                    Origen aproximado
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

              {/* Vehículo y Problema */}
              <div className="vehicle-problem-card">
                <div className="vehicle-info-request-detail">
                  <div className="vehicle-icon-request-detail">
                    <img
                      src={getVehicleIcon(
                        request.vehicle?.icon ||
                          request.vehicleSnapshot?.category?.id ||
                          "🚗",
                      )}
                      alt={
                        typeof request.vehicle?.category === "object"
                          ? request.vehicle?.category?.name
                          : request.vehicle?.category ||
                            request.vehicleSnapshot?.category?.name ||
                            "Vehículo"
                      }
                      className="vehicle-svg-icon"
                    />
                  </div>
                  <div className="vehicle-details-request-detail">
                    <h3 className="vehicle-brand-request-detail">
                      {typeof request.vehicle?.brand === "object"
                        ? request.vehicle?.brand?.name
                        : request.vehicle?.brand ||
                          request.vehicleSnapshot?.brand?.name ||
                          "N/A"}
                    </h3>
                    <p className="vehicle-model-request-detail">
                      {typeof request.vehicle?.model === "object"
                        ? request.vehicle?.model?.id
                        : request.vehicle?.model ||
                          request.vehicleSnapshot?.model?.id ||
                          "N/A"}
                    </p>
                  </div>
                  <div className="distance-time-info">
                      <p className="vehicle-brand-request-detail">{request.durationMin || "N/A"} Min</p>
                      <p className="vehicle-model-request-detail">{request.distanceKm || "N/A"} km</p>
                  </div>
                </div>

                <div className="problem-section">
                  <IonText color="medium" className="section-label">
                    Problema
                  </IonText>
                  <IonText className="problem-text">
                    {request.problem || "Sin descripción"}
                  </IonText>
                </div>

                {/* Datos adicionales del vehículo */}
                {(request.vehicleSnapshot?.isArmored ||
                  request.serviceDetails?.basement?.isInBasement ||
                  request.vehicleSnapshot?.truckData ||
                  request.vehicleSnapshot?.busData) && (
                  <div className="vehicle-additional-badge-request-detail">
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

              {/* Botón de enviar cotización */}
              <button
                expand="block"
                onClick={handleSendQuote}
                className="send-quote-button"
              >
                Enviar cotización
              </button>
            </div>
          </div>
        </div>
      </div>
    </IonPage>
  );
};

export default RequestDetail;
