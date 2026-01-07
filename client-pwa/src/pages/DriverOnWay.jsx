import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonModal,
  IonList,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonTextarea,
  IonButtons,
} from "@ionic/react";
import { call, star, closeOutline, alertCircleOutline } from "ionicons/icons";
import { Moneys, Refresh2 } from "iconsax-react";
import { MapPicker } from "../components/Map/MapPicker";
import { useToast } from "@hooks/useToast";
import socketService from "../services/socket";
import "./DriverOnWay.css";

import logo from "@shared/src/img/Desvare.svg";

const DriverOnWay = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();

  const [serviceData, setServiceData] = useState(null);
  // const [driverLocation, setDriverLocation] = useState(null); // ← No usado aún
  const [isLoading, setIsLoading] = useState(true);
  // const [estimatedTime, setEstimatedTime] = useState("Calculando..."); // ← No usado aún

  // Estados del modal de cancelación
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  // Razones de cancelación
  const cancellationReasons = [
    { value: "resuelto", label: "✅ Ya me desvaré / El carro prendió" },
    { value: "conductor_no_viene", label: "⏰ El conductor no viene" },
    { value: "conductor_no_responde", label: "📵 El conductor no responde" },
    { value: "otra_grua", label: "🚛 Otra grúa me recogió" },
    { value: "muy_caro", label: "💰 Muy caro" },
    { value: "muy_lejos", label: "📍 El conductor está muy lejos" },
    { value: "otro", label: "📝 Otro motivo" },
  ];

  useEffect(() => {
    console.log("🔄 DriverOnWay - Inicializando...");

    // Cargar datos del servicio aceptado
    const activeServiceData = localStorage.getItem("activeService");

    if (!activeServiceData) {
      showError("No se encontraron datos del servicio");
      history.push("/home");
      return;
    }

    const parsedData = JSON.parse(activeServiceData);
    console.log("📦 Servicio activo cargado:", parsedData);

    setServiceData(parsedData);
    setIsLoading(false);

    // Socket.IO ya está conectado desde App.jsx
    if (!socketService.socket?.connected) {
      console.log("🔌 Conectando Socket.IO...");
      socketService.connect();
    } else {
      console.log("✅ Socket.IO ya conectado");
    }

    return () => {
      console.log("🧹 DriverOnWay - Cleanup");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCall = () => {
    if (serviceData?.driver?.phone) {
      window.location.href = `tel:${serviceData.driver.phone}`;
    } else {
      showError("No se pudo obtener el teléfono del conductor");
    }
  };

  // const handleChat = () => {
  //   showInfo("Chat próximamente disponible");
  // };

  const handleCancelService = () => {
    console.log("🚨 handleCancelService llamado - Abriendo modal de razones");
    setShowCancellationModal(true);
  };

  const handleCallFromModal = () => {
    console.log("📞 Llamando al conductor desde modal");
    if (serviceData?.driver?.phone) {
      window.location.href = `tel:${serviceData.driver.phone}`;
      // Cerrar modal después de iniciar la llamada
      setTimeout(() => {
        setShowCancellationModal(false);
        setSelectedReason("");
        setCustomReason("");
      }, 500);
    }
  };

  const handleConfirmCancellation = () => {
    console.log("📝 Confirmando cancelación con razón:", selectedReason);

    const cancellationData = {
      reason: selectedReason,
      customReason: selectedReason === "otro" ? customReason : null,
    };

    // Cerrar modal
    setShowCancellationModal(false);

    // ✅ Limpiar TODO completamente
    localStorage.removeItem("activeService");
    localStorage.removeItem("currentRequestId");
    localStorage.removeItem("requestData");
    localStorage.removeItem("quotesReceived");

    // Notificar al backend y al conductor con el método correcto
    socketService.cancelServiceWithDetails({
      requestId: serviceData.requestId,
      reason: cancellationData.reason,
      customReason: cancellationData.customReason,
      clientName: serviceData.clientName,
      vehicle: serviceData.vehicle,
      origin: serviceData.origin,
      destination: serviceData.destination,
      problem: serviceData.problem,
    });

    // Reset estados
    setSelectedReason("");
    setCustomReason("");

    showSuccess("Servicio cancelado");

    // ✅ Forzar navegación limpia sin conflictos de estado
    // Usamos window.location en lugar de history.replace() para evitar
    // conflictos con componentes montados (WaitingQuotes)
    window.location.href = "/home";
  };

  const handleCloseModal = () => {
    console.log("❌ Cerrando modal de cancelación");
    setShowCancellationModal(false);
    setSelectedReason("");
    setCustomReason("");
  };

  // const formatAmount = (amount) => {
  //   return new Intl.NumberFormat("es-CO", {
  //     style: "currency",
  //     currency: "COP",
  //     minimumFractionDigits: 0,
  //     maximumFractionDigits: 0,
  //   }).format(amount);
  // };

  const isConfirmDisabled =
    !selectedReason || (selectedReason === "otro" && !customReason.trim());

  if (isLoading || !serviceData) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="driver-on-way-page" fullscreen>
        <div className="logo-content" onClick={() => history.replace("/home")}>
          <img src={logo} alt="logo" />
        </div>
        {/* Mapa con tracking en tiempo real */}
        <div className="map-container-tracking">
          <MapPicker
            origin={serviceData.origin}
            destination={null}
            onRouteCalculated={() => {}}
            quotes={[]} // ← Sin ubicación del conductor por ahora
            onQuoteClick={null}
          />

          {/* Información del servicio */}
          <div className="service-info-section">
            {/* Overlay con info del conductor */}
            <div className="confirm-driver-info-section">
              <div className="confirm-driver-info-header">
                <div className="confirm-driver-info-header-compact">
                  <div className="driver-avatar-small">
                    {serviceData.driver?.name?.charAt(0) || "C"}
                  </div>
                  <div className="confirm-driver-info-details">
                    <h3>{serviceData.driver?.name}</h3>
                    <div className="confirm-driver-info-meta">
                      <IonIcon icon={star} className="star-icon" />
                      <span>{serviceData.driver?.rating || "4.8"}</span>
                      <span className="separator">•</span>
                      <span>
                        {serviceData.driver?.totalServices || "0"} servicios
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <IonButton
                expand="block"
                onClick={handleCall}
                className="call-button"
              >
                <IonIcon icon={call} slot="start" />
                Llamar
              </IonButton>
              {/* <IonButton
                expand="block"
                fill="outline"
                onClick={handleChat}
                className="chat-button"
              >
                <IonIcon icon={chatbubbleEllipses} slot="start" />
                Chat
              </IonButton> */}

              <div className="quote-summary-container">
                <div className="box-items">
                  <div className="info-items">
                    <div className="info-item">
                      <p>Valor</p>
                      <h4>$90.000</h4>
                    </div>
                  </div>
                  <div className="info-items">
                    <div className="info-item">
                      <p>Método de pago</p>
                      <h4>Efectivo</h4>
                    </div>
                  </div>
                </div>
                <div className="code-box">
                  <div className="box-info">
                    <h4>🔒 Código de Seguridad</h4>
                    <div className="code-digits">
                      {serviceData.securityCode
                        ?.split("")
                        .map((digit, index) => (
                          <div key={index} className="digit">
                            {digit}
                          </div>
                        ))}
                    </div>
                  </div>
                  <p>
                    Cuando tu vehículo este sobre la grúa, dale este código al
                    condutor para habilitarle el destino
                  </p>
                </div>
              </div>

              <IonButton
                expand="block"
                fill="clear"
                color="danger"
                onClick={handleCancelService}
                className="cancel-service-button"
              >
                Cancelar Servicio
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>

      {/* Modal de Cancelación - INLINE SIMPLE */}
      <IonModal
        isOpen={showCancellationModal}
        onDidDismiss={handleCloseModal}
        backdropDismiss={false}
      >
        <IonHeader>
          <IonToolbar color="danger">
            <IonTitle>
              <IonIcon
                icon={alertCircleOutline}
                style={{ marginRight: "8px", verticalAlign: "middle" }}
              />
              Cancelar Servicio
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleCloseModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {/* Botón para llamar antes de cancelar */}
          {serviceData?.driver?.phone && (
            <IonButton
              expand="block"
              fill="outline"
              color="primary"
              onClick={handleCallFromModal}
              style={{ marginBottom: "20px" }}
            >
              <IonIcon icon={call} slot="start" />
              Llamar a {serviceData.driver.name || "conductor"} antes de
              cancelar
            </IonButton>
          )}

          <IonText color="medium">
            <p style={{ marginBottom: "16px" }}>
              ¿Por qué deseas cancelar el servicio?
            </p>
          </IonText>

          <IonRadioGroup
            value={selectedReason}
            onIonChange={(e) => {
              console.log("📝 Razón seleccionada:", e.detail.value);
              setSelectedReason(e.detail.value);
            }}
          >
            <IonList>
              {cancellationReasons.map((reason) => (
                <IonItem
                  key={reason.value}
                  lines="none"
                  style={{ marginBottom: "8px" }}
                >
                  <IonRadio slot="start" value={reason.value} />
                  <IonLabel>{reason.label}</IonLabel>
                </IonItem>
              ))}
            </IonList>
          </IonRadioGroup>

          {/* Campo de texto para "Otro motivo" */}
          {selectedReason === "otro" && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <IonText color="medium">
                <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                  Por favor, describe el motivo:
                </p>
              </IonText>
              <IonTextarea
                value={customReason}
                onIonInput={(e) => setCustomReason(e.detail.value)}
                placeholder="Escribe aquí..."
                rows={4}
                maxlength={200}
                style={{
                  background: "#fff",
                  borderRadius: "8px",
                  padding: "8px",
                  border: "1px solid #ddd",
                }}
              />
              <IonText color="medium">
                <p
                  style={{
                    fontSize: "12px",
                    textAlign: "right",
                    marginTop: "4px",
                  }}
                >
                  {customReason.length}/200
                </p>
              </IonText>
            </div>
          )}

          {/* Botones de acción */}
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <IonButton
              expand="block"
              color="danger"
              onClick={handleConfirmCancellation}
              disabled={isConfirmDisabled}
              size="large"
            >
              Confirmar Cancelación
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              onClick={handleCloseModal}
            >
              Volver
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default DriverOnWay;
