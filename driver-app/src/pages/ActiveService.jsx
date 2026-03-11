import { useState, useEffect, useRef } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
// BackgroundGeolocation se importa dinámicamente solo en plataforma nativa
// para evitar que Vite intente resolverlo al compilar (el paquete no tiene bundle web)
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonSpinner,
  IonText,
  useIonToast,
  useIonAlert,
} from "@ionic/react";
import { Call, Location } from "iconsax-react";
import RequestDetailMap from "../components/RequestDetailMap";
import socketService from "../services/socket";
import "./ActiveService.css";

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
  const [completing, setCompleting] = useState(false);

  const [driverPhoto, setDriverPhoto] = useState(
    "https://ionicframework.com/docs/img/demos/avatar.svg",
  );
  const [, setDriverAddress] = useState("Obteniendo ubicación...");
  const [driverLocation, setDriverLocation] = useState({
    lat: 4.6097,
    lng: -74.0817,
  });

  // Estado para controlar las 3 fases
  const [codeValidated, setCodeValidated] = useState(false);

  // Inputs inline del código de seguridad
  const [codeDigits, setCodeDigits] = useState(["", "", "", ""]);
  const codeInputRefs = useRef([]);

  // Extrae lat/lng de un objeto de coordenadas (soporta ambos formatos)
  const extractCoords = (coordsObj) => {
    if (!coordsObj) return null;
    if (coordsObj.coordinates && Array.isArray(coordsObj.coordinates)) {
      return { lng: coordsObj.coordinates[0], lat: coordsObj.coordinates[1] };
    }
    if (coordsObj.lat != null && coordsObj.lng != null) {
      return { lat: coordsObj.lat, lng: coordsObj.lng };
    }
    return null;
  };

  // Abre selector de app de navegación con las coordenadas del destino actual
  const openNavigation = (coordsObj) => {
    const coords = extractCoords(coordsObj);
    if (!coords) {
      present({ message: "No hay coordenadas disponibles para navegar", duration: 2000, color: "warning" });
      return;
    }
    const { lat, lng } = coords;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    const appleMapsUrl = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;

    // Guardamos las URLs antes de abrir el alert para evitar problemas de closure en Capacitor
    const urls = { google: googleMapsUrl, waze: wazeUrl, apple: appleMapsUrl };

    presentAlert({
      header: "Abrir con",
      buttons: [
        { text: "🗺️ Google Maps", handler: () => { setTimeout(() => window.open(urls.google, "_system"), 100); } },
        { text: "🚗 Waze",        handler: () => { setTimeout(() => window.open(urls.waze, "_system"), 100); } },
        { text: "🍎 Apple Maps",  handler: () => { setTimeout(() => window.open(urls.apple, "_system"), 100); } },
        { text: "Cancelar", role: "cancel" },
      ],
    });
  };

  // Maneja el cambio en cada caja del código de seguridad
  const handleCodeDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...codeDigits];
    newDigits[index] = digit;
    setCodeDigits(newDigits);
    if (digit && index < 3) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  // Verifica el código ingresado en los inputs inline
  const handleInlineCodeVerify = () => {
    const inputCode = codeDigits.join("");
    if (inputCode.length !== 4) {
      present({ message: "Ingresa los 4 dígitos del código", duration: 2000, color: "warning" });
      return;
    }
    const correctCode = serviceData.securityCode?.toString();
    if (inputCode === correctCode) {
      setCodeValidated(true);
      present({ message: "✅ Código correcto. Ahora puedes ver el destino.", duration: 2500, color: "success" });
    } else {
      present({ message: "❌ Código incorrecto. Intenta de nuevo.", duration: 2000, color: "danger" });
      setCodeDigits(["", "", "", ""]);
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    }
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

  // TRACKING EN TIEMPO REAL CON BACKGROUND GPS
  // Usa @capacitor-community/background-geolocation que levanta un Foreground Service
  // en Android: muestra una notificación persistente y mantiene el GPS activo
  // aunque el conductor cambie de app, use Waze/Google Maps o bloquee la pantalla.
  useEffect(() => {
    let watcherId = null;
    let lastSentLocation = null;
    const MIN_DISTANCE_METERS = 10;

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3;
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const sendLocation = (location) => {
      let shouldSend = true;
      if (lastSentLocation) {
        shouldSend = calculateDistance(
          lastSentLocation.lat, lastSentLocation.lng,
          location.lat, location.lng
        ) >= MIN_DISTANCE_METERS;
      }
      if (shouldSend) {
        socketService.sendLocationUpdate({
          requestId: serviceData.requestId,
          driverId: serviceData.driverId,
          location,
          heading: location.bearing || 0,
          speed: location.speed || 0,
          accuracy: location.accuracy || 0,
        });
        lastSentLocation = location;
        console.log('📍 Ubicación enviada:', location, `±${location.accuracy || 0}m`);
      }
    };

    const startTracking = async () => {
      if (!serviceData?.requestId) return;

      if (!Capacitor.isNativePlatform()) {
        // Fallback para desarrollo en navegador (sin background)
        console.log('🎯 Tracking GPS web (modo desarrollo)');
        const id = navigator.geolocation.watchPosition(
          (pos) => sendLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            bearing: pos.coords.heading || 0,
            speed: pos.coords.speed || 0,
            accuracy: pos.coords.accuracy || 0,
          }),
          (err) => console.error('❌ Error GPS web:', err),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
        );
        watcherId = { type: 'web', id };
        return;
      }

      console.log('📍 Iniciando Background GPS (Foreground Service)...');
      try {
        // Import dinámico: solo se resuelve en runtime nativo, no en build web
        const { default: BackgroundGeolocation } = await import('@capacitor-community/background-geolocation');

        // Registrar el watcher con Foreground Service
        // Android mostrará: "Desvare - Servicio activo en curso"
        watcherId = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: 'Tu ubicación está siendo compartida con el cliente',
            backgroundTitle: 'Desvare — Servicio activo',
            requestPermissions: true,   // Solicita permisos si no están dados
            stale: false,               // No usar ubicaciones cacheadas
            distanceFilter: MIN_DISTANCE_METERS, // Solo actualizar si se movió ≥10m
          },
          (location, error) => {
            if (error) {
              if (error.code === 'NOT_AUTHORIZED') {
                console.warn('⚠️ Permiso de ubicación denegado');
              } else {
                console.error('❌ Error Background GPS:', error);
              }
              return;
            }
            if (location) {
              sendLocation({
                lat: location.latitude,
                lng: location.longitude,
                bearing: location.bearing || 0,
                speed: location.speed || 0,
                accuracy: location.accuracy || 0,
              });
            }
          }
        );
        console.log('✅ Background GPS iniciado, watcherId:', watcherId);
      } catch (err) {
        console.error('❌ Error iniciando Background GPS:', err);
        // Fallback a @capacitor/geolocation si falla el background
        console.log('🔄 Cayendo a Geolocation estándar como fallback...');
        try {
          const id = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
            (pos, e) => {
              if (e) { console.error('❌ Error GPS fallback:', e); return; }
              if (pos) sendLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                bearing: pos.coords.heading || 0,
                speed: pos.coords.speed || 0,
                accuracy: pos.coords.accuracy || 0,
              });
            }
          );
          watcherId = { type: 'capacitor', id };
        } catch (fallbackErr) {
          console.error('❌ Error en fallback GPS:', fallbackErr);
        }
      }
    };

    if (serviceData?.requestId) {
      startTracking();
    }

    // Cleanup: detener el Foreground Service al salir de la vista
    return () => {
      if (watcherId === null) return;

      if (typeof watcherId === 'string') {
        // Es un watcherId de BackgroundGeolocation (string UUID)
        import('@capacitor-community/background-geolocation')
          .then(({ default: BG }) => BG.removeWatcher({ id: watcherId }))
          .then(() => console.log('🛑 Background GPS detenido'))
          .catch((e) => console.warn('⚠️ Error deteniendo Background GPS:', e));
      } else if (watcherId?.type === 'web') {
        navigator.geolocation.clearWatch(watcherId.id);
        console.log('🛑 GPS web detenido');
      } else if (watcherId?.type === 'capacitor') {
        Geolocation.clearWatch({ id: watcherId.id });
        console.log('🛑 GPS Capacitor detenido');
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

  // Navegar al destino activo según la fase (usado por botón flotante del mapa)
  const handleFloatingNav = () => {
    const target = codeValidated ? serviceData?.destination : serviceData?.origin;
    openNavigation(target);
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
              // El backend también enviará push notification y emitirá socket desde el REST endpoint.
              // Este emit es redundante pero garantiza notificación inmediata si el socket está activo.
              const emitComplete = () => {
                return socketService.completeService({
                  requestId: serviceData.requestId,
                  clientId: data.request.clientId,
                  driverId: user._id,
                  driverName: user.name,
                  completedAt: completedAt,
                });
              };

              if (!emitComplete()) {
                // Socket caído: reconectar y reintentar una vez
                console.log('🔄 Socket caído al completar - reconectando y reintentando...');
                socketService.connect();
                setTimeout(() => emitComplete(), 2000);
              }

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
        <div className="as-loading">
          <IonSpinner name="crescent" />
          <IonText color="medium"><p>Cargando servicio activo...</p></IonText>
        </div>
      </IonPage>
    );
  }

  const hasValidOrigin =
    serviceData.origin &&
    ((serviceData.origin.coordinates && serviceData.origin.coordinates.length === 2) ||
      (serviceData.origin.lat && serviceData.origin.lng));

  if (!hasValidOrigin) {
    return (
      <IonPage>
        <div className="as-loading">
          <IonText color="danger">
            <p>Error: No se encontraron coordenadas del servicio.</p>
          </IonText>
          <button className="as-complete-btn" onClick={() => history.push("/home")}>
            Volver al Inicio
          </button>
        </div>
      </IonPage>
    );
  }

  // Datos del vehículo normalizados
  const veh = serviceData.vehicle;
  const vehBrand = veh ? (typeof veh.brand === "object" ? veh.brand?.name : veh.brand) : null;
  const vehModel = veh ? (typeof veh.model === "object" ? veh.model?.name || veh.model?.id : veh.model) : null;
  const vehColor = veh?.color || null;
  const vehYear  = veh?.year  || null;
  const vehSubtitle = [vehModel, vehYear, vehColor].filter(Boolean).join(" · ");

  return (
    <IonPage>
      <div className="as-page">

        {/* ── MAPA ── */}
        <div className="as-map-wrapper">
          <RequestDetailMap
            request={{
              origin: serviceData.origin,
              destination: codeValidated && serviceData.destination ? serviceData.destination : null,
              vehicle: veh,
              problem: serviceData.problem || serviceData.serviceDetails?.problem,
            }}
            driverLocation={driverLocation}
            driverPhoto={driverPhoto}
            showDestination={codeValidated}
          />

          {/* Etiqueta fase (top-left) */}
          <div className="as-map-phase-label">
            <span className={`as-map-dot ${codeValidated ? "as-map-dot--dest" : "as-map-dot--origin"}`} />
            {codeValidated ? "Destino" : "Recogida"}
          </div>

          {/* Botón flotante de navegación (top-right) */}
          <button className="as-map-nav-btn" onClick={handleFloatingNav}>
            🗺️ Navegar
          </button>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div className="as-progress">
          {/* Paso 1 */}
          <div className={`as-step ${!codeValidated ? "as-step--active" : "as-step--done"}`}>
            <div className="as-step-circle">
              {codeValidated ? <span className="as-step-check">✓</span> : <span>1</span>}
            </div>
            <span className="as-step-label">Al cliente</span>
          </div>

          <div className={`as-step-line ${codeValidated ? "as-step-line--done" : ""}`} />

          {/* Paso 2 */}
          <div className={`as-step ${codeValidated ? "as-step--done" : ""}`}>
            <div className="as-step-circle">
              {codeValidated ? <span className="as-step-check">✓</span> : <span>2</span>}
            </div>
            <span className="as-step-label">Verificar</span>
          </div>

          <div className={`as-step-line ${codeValidated ? "as-step-line--done" : ""}`} />

          {/* Paso 3 */}
          <div className={`as-step ${codeValidated ? "as-step--active" : ""}`}>
            <div className="as-step-circle"><span>3</span></div>
            <span className="as-step-label">Al destino</span>
          </div>
        </div>

        {/* ── CARD SCROLLABLE ── */}
        <div className="as-card-scroll">
          <div className="as-card">

            {/* CLIENTE */}
            <div className="as-section">
              <span className="as-section-label">CLIENTE</span>
              <div className="as-client-row">
                <div className="as-client-info">
                  <span className="as-client-name">{serviceData.clientName}</span>
                  <span className="as-client-phone">{serviceData.clientPhone}</span>
                </div>
                <button className="as-call-btn" onClick={handleCall}>
                  <Call size="22" variant="Bulk" color="#22c55e" />
                </button>
              </div>
            </div>

            <div className="as-divider" />

            {/* VEHÍCULO A REMOLCAR */}
            {veh && (
              <>
                <div className="as-section">
                  <span className="as-section-label">VEHÍCULO A REMOLCAR</span>
                  <div className="as-vehicle-row">
                    <img
                      src={getVehicleIcon(veh.icon || veh.category?.id || "🚗")}
                      alt={vehBrand || "Vehículo"}
                      className="as-vehicle-icon"
                    />
                    <div className="as-vehicle-info">
                      <span className="as-vehicle-name">{vehBrand || "N/A"}</span>
                      {vehSubtitle ? <span className="as-vehicle-sub">{vehSubtitle}</span> : null}
                    </div>
                    {veh.licensePlate && (
                      <span className="as-plate">{veh.licensePlate}</span>
                    )}
                  </div>

                  {/* Badges adicionales (blindado, sótano, camión, bus) */}
                  {(veh.isArmored || serviceData.serviceDetails?.basement?.isInBasement ||
                    veh.truckData || veh.busData) && (
                    <div className="as-badges">
                      {veh.isArmored && <span className="as-badge">🛡️ Blindado</span>}
                      {serviceData.serviceDetails?.basement?.isInBasement && (
                        <span className="as-badge">🏢 Sótano nivel {serviceData.serviceDetails.basement.level}</span>
                      )}
                      {veh.truckData?.trailerType && (
                        <span className="as-badge">🚛 {veh.truckData.trailerType.replace("_", " ")}</span>
                      )}
                      {veh.truckData?.axleType && (
                        <span className="as-badge">🛞 {veh.truckData.axleType === "sencilla" ? "Llanta Sencilla" : "Llanta Doble"}</span>
                      )}
                      {veh.truckData?.length && <span className="as-badge">📏 Largo: {veh.truckData.length} m</span>}
                      {veh.truckData?.height && <span className="as-badge">📐 Alto: {veh.truckData.height} m</span>}
                      {veh.truckData?.tonnage && <span className="as-badge">⚖️ {veh.truckData.tonnage} ton</span>}
                      {serviceData.serviceDetails?.truckCurrentState?.isLoaded && (
                        <span className="as-badge">📦 Cargado: {serviceData.serviceDetails.truckCurrentState.currentWeight} ton</span>
                      )}
                      {veh.busData?.passengerCapacity && (
                        <span className="as-badge">👥 {veh.busData.passengerCapacity} pasajeros</span>
                      )}
                      {veh.busData?.axleType && (
                        <span className="as-badge">🛞 {veh.busData.axleType === "sencilla" ? "Llanta Sencilla" : "Llanta Doble"}</span>
                      )}
                      {veh.busData?.length && <span className="as-badge">📏 Largo: {veh.busData.length} m</span>}
                      {veh.busData?.height && <span className="as-badge">📐 Alto: {veh.busData.height} m</span>}
                    </div>
                  )}

                  {serviceData.problem && (
                    <p className="as-problem">{serviceData.problem}</p>
                  )}
                </div>
                <div className="as-divider" />
              </>
            )}

            {/* VALOR ACORDADO */}
            <div className="as-section">
              <span className="as-section-label">VALOR ACORDADO</span>
              <div className="as-amount-row">
                <span className="as-amount-label">Total del servicio</span>
                <div className="as-amount-right">
                  <span className="as-amount">{formatAmount(serviceData.amount)}</span>
                  <span className="as-amount-sub">Aceptado por el cliente</span>
                </div>
              </div>
            </div>

            <div className="as-divider" />

            {/* DIRECCIÓN DE RECOGIDA */}
            <div className="as-section">
              <div className="as-location-header">
                <span className="as-section-label">DIRECCIÓN DE RECOGIDA</span>
                {codeValidated && (
                  <span className="as-completed-badge">✓ COMPLETADA</span>
                )}
              </div>
              <div className={`as-location-row ${codeValidated ? "as-location-row--done" : ""}`}>
                <Location size="20" variant="Bulk" color={codeValidated ? "#9CA3AF" : "#0055FF"} />
                <div className="as-location-info">
                  <span className="as-location-sub">Ubicación del cliente</span>
                  <span className={`as-location-addr ${codeValidated ? "as-location-addr--done" : ""}`}>
                    {serviceData.origin.address}
                  </span>
                </div>
              </div>
            </div>

            <div className="as-divider" />

            {/* DESTINO */}
            <div className="as-section">
              <span className="as-section-label">DESTINO</span>
              {codeValidated && serviceData.destination ? (
                <div className="as-location-row">
                  <span className="as-dest-flag">🏁</span>
                  <div className="as-location-info">
                    <span className="as-location-sub">Taller destino</span>
                    <span className="as-location-addr">{serviceData.destination.address}</span>
                  </div>
                </div>
              ) : (
                <div className="as-location-locked">
                  <span>🔒</span>
                  <span className="as-locked-text">Se revelará al verificar el vehículo</span>
                </div>
              )}
            </div>

            {/* SECCIÓN DE CÓDIGO (Paso 1 y 2) */}
            {!codeValidated && (
              <>
                <div className="as-divider" />
                <div className="as-code-section">
                  <h3 className="as-code-title">Verificar recogida</h3>
                  <p className="as-code-desc">
                    Cuando el vehículo esté sobre la grúa, pídele al cliente el código de 4 dígitos.
                  </p>
                  <div className="as-code-inputs">
                    {codeDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (codeInputRefs.current[i] = el)}
                        className="as-code-input"
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      />
                    ))}
                  </div>
                  <button className="as-verify-btn" onClick={handleInlineCodeVerify}>
                    🔒 Verificar código
                  </button>
                </div>
              </>
            )}

            {/* BOTÓN FINALIZAR (Paso 3) */}
            {codeValidated && (
              <div className="as-complete-wrapper">
                <button
                  className="as-complete-btn"
                  onClick={handleCompleteService}
                  disabled={completing}
                >
                  {completing ? "⏳ Finalizando..." : "🏁 Finalizar servicio"}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </IonPage>
  );
};

export default ActiveService;
