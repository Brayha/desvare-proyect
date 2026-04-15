import { useState, useEffect } from "react";
import { registerPlugin } from '@capacitor/core';

// Bridge al plugin nativo de background geolocation
const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonText,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonBadge,
  useIonToast,
  useIonAlert,
} from "@ionic/react";
import { Routing, Call, Location, UserTick } from "iconsax-react";
import RequestDetailMap from "../components/RequestDetailMap";
import socketService from "../services/socket"; // ✅ Importar socketService
import "./ActiveService.css"; // ✅ Reutilizar mismo CSS

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
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ActiveService = () => {
  const history = useHistory();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();

  const [serviceData, setServiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completing, setCompleting] = useState(false); // ✅ Estado para loading al completar

  // ✅ Estados para el mapa y conductor
  const [driverPhoto, setDriverPhoto] = useState(
    "https://ionicframework.com/docs/img/demos/avatar.svg",
  );
  const [driverAddress, setDriverAddress] = useState("Obteniendo ubicación...");
  const [driverLocation, setDriverLocation] = useState({
    lat: 4.6097,
    lng: -74.0817,
  }); // Bogotá por defecto

  // ✅ Estado para controlar las 2 fases
  const [codeValidated, setCodeValidated] = useState(false);

  // 🗺️ Función para abrir navegación en apps externas
  const openNavigation = (destinationCoords, destinationAddress) => {
    if (!destinationCoords || !destinationCoords.coordinates) {
      present({
        message: "No hay coordenadas disponibles para navegar",
        duration: 2000,
        color: "warning",
      });
      return;
    }

    const [lng, lat] = destinationCoords.coordinates;

    // URLs para cada app de navegación
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    const appleMapsUrl = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;

    presentAlert({
      header: "Abrir en:",
      message: "Selecciona tu app de navegación preferida",
      buttons: [
        {
          text: "🗺️ Google Maps",
          handler: () => {
            window.open(googleMapsUrl, "_system");
          },
        },
        {
          text: "🚗 Waze",
          handler: () => {
            window.open(wazeUrl, "_system");
          },
        },
        {
          text: "🍎 Apple Maps",
          handler: () => {
            window.open(appleMapsUrl, "_system");
          },
        },
        {
          text: "Cancelar",
          role: "cancel",
        },
      ],
    });
  };

  useEffect(() => {
    console.log("🚗 ActiveService - Inicializando...");

    // ✅ RESETEAR estado de validación para cada nuevo servicio
    setCodeValidated(false);
    console.log(
      "🔄 Estado de validación reseteado - Nuevo servicio requiere código",
    );

    // Cargar datos del servicio activo desde localStorage
    const activeServiceData = localStorage.getItem("activeService");

    if (!activeServiceData) {
      console.log("❌ No hay servicio activo");
      present({
        message: "No se encontraron datos del servicio",
        duration: 2000,
        color: "danger",
      });
      history.push("/home");
      return;
    }

    try {
      const parsedData = JSON.parse(activeServiceData);
      console.log("📦 Servicio activo cargado:", parsedData);
      console.log("📍 Estructura de origin:", parsedData.origin);
      console.log("📍 Estructura de destination:", parsedData.destination);

      // ✅ Normalizar: Si no hay vehicle pero sí vehicleSnapshot, usar vehicleSnapshot
      if (!parsedData.vehicle && parsedData.vehicleSnapshot) {
        parsedData.vehicle = parsedData.vehicleSnapshot;
        console.log("✅ Datos del vehículo normalizados desde vehicleSnapshot");
      }

      // ✅ Si faltan datos del vehículo o teléfono, buscar del backend
      if (
        !parsedData.vehicle &&
        !parsedData.vehicleSnapshot &&
        parsedData.requestId
      ) {
        console.log("⚠️ Faltan datos del vehículo - Buscando del backend...");
        loadCompleteRequestData(parsedData);
      } else {
        setServiceData(parsedData);
        setIsLoading(false);
      }

      // ⚡ Cargar datos del conductor en paralelo
      loadDriverPhoto();
      loadDriverAddress();
    } catch (error) {
      console.error("❌ Error al parsear servicio activo:", error);
      history.push("/home");
      return;
    }
  }, [history, present]);

  // TRACKING GPS EN TIEMPO REAL - Usa BackgroundGeolocation para funcionar
  // incluso cuando el app está en background, pantalla bloqueada o en otra app.
  useEffect(() => {
    if (!serviceData || !serviceData.requestId) return;

    const userData = localStorage.getItem('user');
    const driverUser = userData ? JSON.parse(userData) : null;
    const driverId = serviceData.driverId || driverUser?._id || driverUser?.id;

    // Estado mutable compartido entre el watcher y el handler de reconexión
    const state = {
      watcherId: null,
      lastLocation: null,
    };

    // Asegurar socket conectado y conductor registrado
    const ensureSocketReady = () => {
      if (!socketService.isConnected()) {
        socketService.connect();
      }
      if (driverId) {
        socketService.registerDriver(driverId);
      }
    };
    ensureSocketReady();

    // Cuando el socket reconecta: re-registrar y reenviar última ubicación conocida
    const handleReconnect = () => {
      console.log('🔄 ActiveService - Socket reconectado, re-registrando...');
      if (driverId) {
        socketService.registerDriver(driverId);
      }
      // Reenviar la última ubicación para que el cliente la vea de inmediato
      if (state.lastLocation) {
        socketService.sendLocationUpdate({
          requestId: serviceData.requestId,
          driverId,
          ...state.lastLocation,
        });
        console.log('📡 Última ubicación reenviada tras reconexión:', state.lastLocation.location);
      }
    };
    socketService.onReconnect(handleReconnect);

    // Cuando la app vuelve a primer plano: reconectar socket y registrar conductor
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 App volvió al primer plano - verificando conexión...');
        ensureSocketReady();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Iniciar BackgroundGeolocation - funciona en background y pantalla bloqueada
    const startBgTracking = async () => {
      console.log('🛰️ Iniciando BackgroundGeolocation (foreground service)...');
      try {
        state.watcherId = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: 'El conductor está en camino. El tracking GPS está activo.',
            backgroundTitle: 'Desvare - Servicio en progreso',
            requestPermissions: true,
            stale: false,
            distanceFilter: 10, // metros mínimos para emitir nueva posición
          },
          (location, error) => {
            if (error) {
              if (error.code === 'NOT_AUTHORIZED') {
                console.warn('⚠️ Permiso de ubicación denegado en background');
              } else {
                console.error('❌ BackgroundGeolocation error:', error.code, error.message);
              }
              return;
            }

            const payload = {
              requestId: serviceData.requestId,
              driverId,
              location: { lat: location.latitude, lng: location.longitude },
              heading: location.bearing || 0,
              speed: location.speed || 0,
              accuracy: location.accuracy || 0,
            };

            state.lastLocation = payload;
            socketService.sendLocationUpdate(payload);
            console.log('📍 Ubicación enviada:', payload.location, `±${location.accuracy?.toFixed(0)}m`);
          }
        );
        console.log('✅ BackgroundGeolocation activo, watcher ID:', state.watcherId);
      } catch (err) {
        console.error('❌ No se pudo iniciar BackgroundGeolocation:', err);
        // Fallback: usar navigator.geolocation clásico
        startFallbackTracking();
      }
    };

    // Fallback por si el plugin falla (no debería pasar en producción)
    const startFallbackTracking = () => {
      console.log('⚠️ Usando fallback navigator.geolocation...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const payload = {
            requestId: serviceData.requestId,
            driverId,
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed || 0,
            accuracy: pos.coords.accuracy || 0,
          };
          state.lastLocation = payload;
          socketService.sendLocationUpdate(payload);
        },
        (err) => console.warn('⚠️ Fallback GPS error:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
      );
    };

    startBgTracking();

    return () => {
      socketService.offReconnect(handleReconnect);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (state.watcherId !== null) {
        BackgroundGeolocation.removeWatcher({ id: state.watcherId });
        console.log('🛑 BackgroundGeolocation detenido');
      }
    };
  }, [serviceData]);

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
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000,
          },
        );
      }
    } catch (error) {
      console.error("❌ Error en loadDriverAddress:", error);
      setDriverAddress("Bogotá, Colombia");
    }
  };

  const loadCompleteRequestData = async (parsedData) => {
    try {
      console.log("🔄 Obteniendo datos completos del request del backend...");
      const response = await fetch(
        `${API_URL}/api/requests/${parsedData.requestId}`,
      );
      const data = await response.json();

      if (response.ok && data.request) {
        console.log("✅ Datos completos del request obtenidos:", data.request);

        // Mezclar datos del localStorage con datos del backend
        const completeData = {
          ...parsedData, // Mantener requestId, amount, securityCode, etc.
          clientPhone: data.request.clientPhone || parsedData.clientPhone,
          vehicle:
            data.request.vehicleSnapshot ||
            parsedData.vehicleSnapshot ||
            parsedData.vehicle,
          vehicleSnapshot:
            data.request.vehicleSnapshot || parsedData.vehicleSnapshot,
          problem: data.request.serviceDetails?.problem || parsedData.problem,
          serviceDetails:
            data.request.serviceDetails || parsedData.serviceDetails,
        };

        console.log("✅ Datos mezclados:", completeData);
        setServiceData(completeData);

        // Actualizar localStorage con datos completos
        localStorage.setItem("activeService", JSON.stringify(completeData));
      } else {
        console.warn(
          "⚠️ No se pudieron obtener datos completos, usando datos básicos",
        );
        setServiceData(parsedData);
      }
    } catch (error) {
      console.error("❌ Error al obtener datos completos del request:", error);
      // Usar datos básicos del localStorage si falla
      setServiceData(parsedData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (serviceData?.clientName && serviceData?.origin?.address) {
      // Usar el teléfono que venga en los datos del servicio
      // O buscar el teléfono en la base de datos si es necesario
      const phoneNumber = serviceData.clientPhone || "No disponible";

      if (phoneNumber !== "No disponible") {
        window.location.href = `tel:${phoneNumber}`;
      } else {
        present({
          message: "Teléfono del cliente no disponible",
          duration: 2000,
          color: "warning",
        });
      }
    }
  };

  const handleStartNavigation = () => {
    // FASE 1: Navegar al origen (recogida)
    // FASE 2: Navegar al destino
    const targetLocation = codeValidated
      ? serviceData?.destination?.coordinates
      : serviceData?.origin?.coordinates;

    if (targetLocation) {
      const [lng, lat] = targetLocation;
      const destination = codeValidated ? "destino" : "punto de recogida";

      // Abrir Google Maps con navegación
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(mapsUrl, "_blank");

      present({
        message: `🧭 Navegando al ${destination}...`,
        duration: 2000,
        color: "success",
      });
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

  const handleVerifySecurityCode = () => {
    presentAlert({
      header: "🔒 Validar Código de Seguridad",
      message: "Solicita al cliente el código de 4 dígitos para ver el destino",
      inputs: [
        {
          name: "code",
          type: "tel",
          placeholder: "••••",
          maxlength: 4,
        },
      ],
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "Verificar",
          handler: (data) => {
            const inputCode = data.code?.toString();
            const correctCode = serviceData.securityCode?.toString();

            if (inputCode === correctCode) {
              setCodeValidated(true);
              present({
                message: "✅ Código correcto. Ahora puedes ver el destino.",
                duration: 2500,
                color: "success",
              });
              console.log("✅ Código validado - Mostrando destino");
            } else {
              present({
                message: "❌ Código incorrecto. Intenta de nuevo.",
                duration: 2000,
                color: "danger",
              });
              console.log("❌ Código incorrecto");
              return false; // Mantener el alert abierto
            }
          },
        },
      ],
    });
  };

  const handleCompleteService = () => {
    presentAlert({
      header: "✅ Completar Servicio",
      message:
        "¿Confirmas que llegaste al destino y completaste el servicio exitosamente?",
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "Confirmar",
          handler: async () => {
            setCompleting(true);

            try {
              const user = JSON.parse(localStorage.getItem("user"));
              const completedAt = new Date();

              console.log("📡 Completando servicio:", {
                requestId: serviceData.requestId,
                driverId: user._id,
              });

              // 1. Actualizar en el backend
              const response = await fetch(
                `${API_URL}/api/requests/${serviceData.requestId}/complete`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    driverId: user._id,
                    completedAt: completedAt,
                  }),
                },
              );

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                  errorData.error || "Error al completar servicio",
                );
              }

              const data = await response.json();
              console.log("✅ Backend confirmó completado:", data);

              // 2. Notificar por Socket.IO al cliente
              socketService.completeService({
                requestId: serviceData.requestId,
                clientId: data.request.clientId,
                driverId: user._id,
                driverName: user.name,
                completedAt: completedAt,
              });

              // 3. Limpiar localStorage
              localStorage.removeItem("activeService");
              console.log("🗑️ activeService removido del localStorage");

              // 4. Cambiar estado a DISPONIBLE
              const updatedUser = { ...user };
              updatedUser.driverProfile.isOnline = true;
              localStorage.setItem("user", JSON.stringify(updatedUser));
              console.log("🟢 Estado cambiado a DISPONIBLE");

              present({
                message:
                  "🎉 ¡Servicio completado! Ahora estás disponible para nuevos servicios.",
                duration: 3000,
                color: "success",
              });

              // 5. Volver al Home (disponible para nuevos servicios)
              setTimeout(() => {
                history.replace("/home");
              }, 500);
            } catch (error) {
              console.error("❌ Error al completar servicio:", error);
              present({
                message:
                  error.message ||
                  "Error al completar servicio. Intenta de nuevo.",
                duration: 3000,
                color: "danger",
              });
            } finally {
              setCompleting(false);
            }

            return true; // Cerrar el alert
          },
        },
      ],
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading || !serviceData) {
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
              <p>Cargando servicio activo...</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Validar que existan coordenadas (formato flexible)
  const hasValidOrigin =
    serviceData.origin &&
    ((serviceData.origin.coordinates &&
      serviceData.origin.coordinates.length === 2) ||
      (serviceData.origin.lat && serviceData.origin.lng));

  if (!hasValidOrigin) {
    console.error("❌ Coordenadas inválidas:", {
      origin: serviceData.origin,
      destination: serviceData.destination,
    });

    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonText color="danger">
            <h3>Error: No se encontraron coordenadas del servicio</h3>
            <p>Estructura del origen: {JSON.stringify(serviceData.origin)}</p>
            <p>Por favor, intenta aceptar el servicio nuevamente.</p>
          </IonText>
          <button
            className="send-quote-button"
            onClick={() => history.push("/home")}
            style={{ margin: "20px" }}
          >
            Volver al Inicio
          </button>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <div className="request-detail-page">
        {/* Mapa */}
        <div className="map-section">
          <RequestDetailMap
            request={{
              origin: serviceData.origin,
              destination:
                codeValidated && serviceData.destination
                  ? serviceData.destination
                  : null,
              vehicle: serviceData.vehicle,
              problem:
                serviceData.problem || serviceData.serviceDetails?.problem,
            }}
            driverLocation={driverLocation}
            driverPhoto={driverPhoto}
            showDestination={codeValidated}
          />
        </div>

        {/* Contenido de detalles */}
        <div className="detail-content-active-service">
          <div className="request-detail-content-active-service">
            <h2 className="type-title">Servicio Activo</h2>
            <div className="detail-content">
              <div className="request-detail-content">
                {/* Monto Acordado Destacado */}
                <div
                  style={{
                    width: "100%",
                    background: "white",
                    padding: "10px",
                    borderRadius: "10px",
                    textAlign: "center",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <IonText
                    style={{
                      color: "#9CA3AF",
                      fontSize: "14px",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Monto Acordado
                  </IonText>
                  <IonText
                    style={{
                      color: "#9CA3AF",
                      fontSize: "24px",
                      fontWeight: "bold",
                      display: "block",
                      margin: "0",
                    }}
                  >
                    {formatAmount(serviceData.amount)}
                  </IonText>
                </div>

                {/* Cliente */}
                <div className="location-section">
                  <div className="person-icon">
                    <UserTick size="24" variant="Bulk" color="#9CA3AF" />
                  </div>
                  <div className="location-text">
                    <IonText color="medium" className="location-label">
                      {serviceData.clientName}
                    </IonText>
                    <IonText className="location-address">
                      {serviceData.clientPhone}
                    </IonText>
                  </div>
                  {/* Botones de Acción */}
                  <button className="call-button" onClick={handleCall}>
                    <Call size="24" variant="Bulk" color="#9CA3AF" />
                  </button>
                </div>

                {/* Vehículo */}
                {serviceData.vehicle && (
                  <div className="vehicle-problem-card-confirmed">
                    <div className="vehicle-info-confirmed">
                      <div className="vehicle-icon-confirmed">
                        <img
                          src={getVehicleIcon(
                            serviceData.vehicle.icon ||
                              serviceData.vehicle.category?.id ||
                              "🚗",
                          )}
                          alt={
                            typeof serviceData.vehicle.category === "object"
                              ? serviceData.vehicle.category?.name
                              : serviceData.vehicle.category || "Vehículo"
                          }
                          className="vehicle-svg-icon"
                        />
                      </div>
                      <div className="vehicle-details-confirmed">
                        <h3 className="vehicle-brand-confirmed">
                          {typeof serviceData.vehicle.brand === "object"
                            ? serviceData.vehicle.brand?.name
                            : serviceData.vehicle.brand || "N/A"}
                        </h3>
                        <p className="vehicle-model-confirmed">
                          {typeof serviceData.vehicle.model === "object"
                            ? serviceData.vehicle.model?.id
                            : serviceData.vehicle.model || "N/A"}
                        </p>
                      </div>
                      <p className="vehicle-plate-confirmed">
                        {serviceData.vehicle.licensePlate}
                      </p>
                    </div>

                    {serviceData.problem && (
                      <div className="problem-section">
                        <IonText color="medium" className="section-label">
                          Problema reportado
                        </IonText>
                        <IonText className="problem-text">
                          {serviceData.problem}
                        </IonText>
                      </div>
                    )}

                    {/* Datos adicionales del vehículo */}
                    {(serviceData.vehicle.isArmored ||
                      serviceData.serviceDetails?.basement?.isInBasement ||
                      serviceData.vehicle.truckData ||
                      serviceData.vehicle.busData) && (
                      <div className="vehicle-additional-badge-active-service">
                        {/* Blindado (Autos y Camionetas) */}
                        {serviceData.vehicle.isArmored && (
                          <div className="detail-badge">🛡️ Blindado</div>
                        )}

                        {/* Sótano (del serviceDetails actual) */}
                        {serviceData.serviceDetails?.basement?.isInBasement && (
                          <div className="detail-badge">
                            🏢 Sótano nivel{" "}
                            {serviceData.serviceDetails.basement.level}
                          </div>
                        )}

                        {/* Datos específicos de CAMIONES */}
                        {serviceData.vehicle.truckData && (
                          <>
                            {serviceData.vehicle.truckData.trailerType && (
                              <div className="detail-badge">
                                🚛{" "}
                                {serviceData.vehicle.truckData.trailerType
                                  .replace("_", " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </div>
                            )}
                            {serviceData.vehicle.truckData.axleType && (
                              <div className="detail-badge">
                                🛞{" "}
                                {serviceData.vehicle.truckData.axleType ===
                                "sencilla"
                                  ? "Llanta Sencilla"
                                  : "Llanta Doble"}
                              </div>
                            )}
                            {serviceData.vehicle.truckData.length && (
                              <div className="detail-badge">
                                📏 Largo: {serviceData.vehicle.truckData.length}{" "}
                                m
                              </div>
                            )}
                            {serviceData.vehicle.truckData.height && (
                              <div className="detail-badge">
                                📐 Alto: {serviceData.vehicle.truckData.height}{" "}
                                m
                              </div>
                            )}
                            {serviceData.vehicle.truckData.tonnage && (
                              <div className="detail-badge">
                                ⚖️ {serviceData.vehicle.truckData.tonnage} ton
                              </div>
                            )}
                            {serviceData.serviceDetails?.truckCurrentState
                              ?.isLoaded && (
                              <div className="detail-badge">
                                📦 Cargado:{" "}
                                {
                                  serviceData.serviceDetails.truckCurrentState
                                    .currentWeight
                                }{" "}
                                ton
                              </div>
                            )}
                          </>
                        )}

                        {/* Datos específicos de BUSES */}
                        {serviceData.vehicle.busData && (
                          <>
                            {serviceData.vehicle.busData.passengerCapacity && (
                              <div className="detail-badge">
                                👥{" "}
                                {serviceData.vehicle.busData.passengerCapacity}{" "}
                                pasajeros
                              </div>
                            )}
                            {serviceData.vehicle.busData.axleType && (
                              <div className="detail-badge">
                                🛞{" "}
                                {serviceData.vehicle.busData.axleType ===
                                "sencilla"
                                  ? "Llanta Sencilla"
                                  : "Llanta Doble"}
                              </div>
                            )}
                            {serviceData.vehicle.busData.length && (
                              <div className="detail-badge">
                                📏 Largo: {serviceData.vehicle.busData.length} m
                              </div>
                            )}
                            {serviceData.vehicle.busData.height && (
                              <div className="detail-badge">
                                📐 Alto: {serviceData.vehicle.busData.height} m
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* FASE 1: Punto de Recogida (Origen) */}
                {!codeValidated && (
                  <div className="location-section">
                    <div className="location-icon">
                      <Location size="24" variant="Bulk" color="#0055FF" />
                    </div>
                    <div className="location-text">
                      <IonText color="medium" className="location-label">
                        Punto de Recogida
                      </IonText>
                      <IonText className="location-address">
                        {serviceData.origin.address}
                      </IonText>
                      <button
                        className="go-to-navigation-button"
                        onClick={() =>
                          openNavigation(
                            serviceData.origin,
                            serviceData.origin.address,
                          )
                        }
                      >
                        <Routing size="24" variant="Bulk" color="#9CA3AF" />
                        Abrir ruta
                      </button>
                    </div>
                  </div>
                )}

                {/* FASE 2: Destino Final (solo después de validar código) */}
                {codeValidated && serviceData.destination && (
                  <div className="location-section">
                    <div className="location-icon-destination">
                      <Location size="24" variant="Bold" color="#eb445a" />
                    </div>
                    <div className="location-text">
                      <IonText color="medium" className="location-label">
                        🔴 Destino Final
                      </IonText>
                      <IonText className="location-address">
                        {serviceData.destination.address}
                      </IonText>
                      <button
                        className="go-to-navigation-button"
                        onClick={() =>
                          openNavigation(
                            serviceData.destination,
                            serviceData.destination.address,
                          )
                        }
                      >
                        <Routing size="24" variant="Bulk" color="#9CA3AF" />
                        Navegar al destino
                      </button>
                    </div>
                  </div>
                )}

                {/* FASE 1: Código de Seguridad Pendiente */}
                {!codeValidated && (
                  <div
                    style={{
                      width: "100%",
                      background:
                        "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
                      padding: "25px",
                      borderRadius: "15px",
                      textAlign: "center",
                      boxShadow: "0 4px 10px rgba(243, 156, 18, 0.3)",
                    }}
                  >
                    <IonText
                      style={{
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "700",
                        display: "block",
                        marginBottom: "10px",
                      }}
                    >
                      🔒 Código de Seguridad Requerido
                    </IonText>
                    <IonText
                      style={{
                        color: "white",
                        fontSize: "14px",
                        display: "block",
                        marginBottom: "15px",
                        opacity: 0.9,
                      }}
                    >
                      Solicita al cliente el código de 4 dígitos en el punto de
                      recogida para ver el destino
                    </IonText>
                    <button
                      className="send-quote-button"
                      style={{
                        background: "white",
                        color: "#f39c12",
                        marginBottom: 0,
                      }}
                      onClick={handleVerifySecurityCode}
                    >
                      🔐 Validar Código
                    </button>
                  </div>
                )}

                

                {codeValidated && (
                  <button
                    className="send-quote-button"
                    onClick={handleCompleteService}
                    disabled={completing}
                    style={{ background: "#0055ff" }}
                  >
                    {completing ? "⏳ Completando..." : "Completar Servicio"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </IonPage>
  );
};

export default ActiveService;
