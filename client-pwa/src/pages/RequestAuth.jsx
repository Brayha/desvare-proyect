import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonSpinner } from "@ionic/react";
import { useToast } from "@hooks/useToast";
import { requestAPI } from "../services/api";
import socketService from "../services/socket";
import { useAuth } from "../contexts/AuthContext";
import { MapPicker } from "../components/Map/MapPicker";
import AuthModal from "../components/AuthModal/AuthModal";
import { vehicleAPI } from "../services/vehicleAPI";
import "./RequestAuth.css";

const RequestAuth = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  const { login: authLogin, refreshVehicles } = useAuth();

  const [routeData, setRouteData]     = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar datos de ruta y vehículo al montar
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      history.replace("/waiting-quotes");
      return;
    }

    const storedRoute = localStorage.getItem("requestData");
    if (!storedRoute) {
      showError("Selecciona primero tu destino");
      history.replace("/tabs/desvare");
      return;
    }

    try {
      setRouteData(JSON.parse(storedRoute));
    } catch {
      showError("Error al cargar datos de la ruta");
      history.replace("/tabs/desvare");
      return;
    }

    const storedVehicle = localStorage.getItem("vehicleData");
    if (storedVehicle) {
      try { setVehicleData(JSON.parse(storedVehicle)); } catch { /* no bloqueamos */ }
    }

    // Abrir el modal con un pequeño delay para que el mapa cargue
    const t = setTimeout(() => setIsModalOpen(true), 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Enviar solicitud a conductores (sin cambios respecto al flujo anterior) ────

  const sendRequestToDrivers = async (user) => {
    try {
      console.log("📡 sendRequestToDrivers - Iniciando...");

      if (!socketService.isConnected()) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      socketService.registerClient(user.id);

      const requestData = {
        clientId:    user.id,
        clientName:  user.name,
        clientPhone: user.phone || "N/A",
        clientEmail: user.email || "N/A",
        origin: {
          coordinates: [routeData.origin.lng, routeData.origin.lat],
          address:     routeData.origin.address,
        },
        destination: {
          coordinates: [routeData.destination.lng, routeData.destination.lat],
          address:     routeData.destination.address,
        },
        distance: routeData.routeInfo.distance,
        duration: routeData.routeInfo.duration,
      };

      if (vehicleData) {
        requestData.vehicleId       = vehicleData.vehicleId || null;
        requestData.vehicleSnapshot = vehicleData.vehicleSnapshot;
        requestData.serviceDetails  = vehicleData.serviceDetails;
      }

      const response  = await requestAPI.createRequest(requestData);
      const requestId = response.data.requestId;
      localStorage.setItem("currentRequestId", requestId);
      console.log("✅ Solicitud creada con ID:", requestId);

      const socketData = {
        requestId,
        clientId:   user.id,
        clientName: user.name,
        origin: {
          address: routeData.origin.address,
          lat:     routeData.origin.lat,
          lng:     routeData.origin.lng,
        },
        destination: {
          address: routeData.destination.address,
          lat:     routeData.destination.lat,
          lng:     routeData.destination.lng,
        },
        distance: routeData.routeInfo.distance,
        duration: routeData.routeInfo.duration,
      };

      if (vehicleData) {
        socketData.vehicleSnapshot = vehicleData.vehicleSnapshot;
        socketData.serviceDetails  = vehicleData.serviceDetails;
      }

      socketService.sendNewRequest(socketData);
      console.log("✅ Solicitud emitida via Socket.IO");
    } catch (error) {
      console.error("❌ Error en sendRequestToDrivers:", error);
      throw error;
    }
  };

  // ─── Callback de autenticación exitosa ───────────────────────────────────────

  const handleAuthSuccess = async (user) => {
    try {
      // Guardar vehículo en BD si fue creado antes de autenticarse
      if (vehicleData?.vehicleSnapshot && !vehicleData.vehicleId) {
        console.log("🚗 Guardando vehículo creado antes de autenticación...");
        try {
          const payload = {
            userId:       user.id,
            category:     vehicleData.vehicleSnapshot.category,
            brand:        vehicleData.vehicleSnapshot.brand,
            model:        vehicleData.vehicleSnapshot.model,
            licensePlate: vehicleData.vehicleSnapshot.licensePlate,
            year:         vehicleData.vehicleSnapshot.year,
            color:        vehicleData.vehicleSnapshot.color,
          };

          const categoryId = vehicleData.vehicleSnapshot.category?.id;
          if (["AUTOS", "CAMIONETAS"].includes(categoryId)) {
            payload.isArmored = vehicleData.vehicleSnapshot.isArmored || false;
          } else if (categoryId === "CAMIONES" && vehicleData.vehicleSnapshot.truckData) {
            const valid = Object.fromEntries(
              Object.entries(vehicleData.vehicleSnapshot.truckData).filter(([, v]) => v != null && v !== "")
            );
            if (Object.keys(valid).length > 0) payload.truckData = valid;
          } else if (categoryId === "BUSES" && vehicleData.vehicleSnapshot.busData) {
            const valid = Object.fromEntries(
              Object.entries(vehicleData.vehicleSnapshot.busData).filter(([, v]) => v != null && v !== "")
            );
            if (Object.keys(valid).length > 0) payload.busData = valid;
          }

          const vRes = await vehicleAPI.createVehicle(payload);
          const savedId = vRes.data.data?._id || vRes.data._id;
          vehicleData.vehicleId = savedId;
          localStorage.setItem("vehicleData", JSON.stringify(vehicleData));
          await refreshVehicles();
          showSuccess("✅ Vehículo guardado en tu garaje");
        } catch (vErr) {
          const msg = vErr.response?.data?.error || "No se pudo guardar el vehículo";
          showError(`⚠️ ${msg}. El servicio continuará.`);
        }
      }

      // Verificar que hay datos suficientes para crear la solicitud
      if (!vehicleData?.vehicleSnapshot || !vehicleData?.serviceDetails?.problem) {
        showSuccess("✅ Sesión iniciada correctamente");
        history.replace("/tabs/desvare");
        return;
      }

      await sendRequestToDrivers(user);

      await new Promise((r) => setTimeout(r, 100));
      history.replace("/waiting-quotes");
    } catch (err) {
      console.error("❌ Error post-autenticación:", err);
      showError("Error al enviar la solicitud. Intenta de nuevo.");
    }
  };

  // ─── Modal cerrado por el usuario ─────────────────────────────────────────────

  const handleModalDismiss = () => {
    setIsModalOpen(false);
    setTimeout(() => history.goBack(), 300);
  };

  if (!routeData) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      {/* Mapa de fondo (desenfocado) */}
      <div className="auth-background-map">
        <MapPicker
          origin={routeData.origin}
          destination={routeData.destination}
          onRouteCalculated={() => {}}
        />
      </div>

      {/* Modal de autenticación unificado */}
      <AuthModal
        isOpen={isModalOpen}
        onDismiss={handleModalDismiss}
        onSuccess={handleAuthSuccess}
      />
    </IonPage>
  );
};

export default RequestAuth;
