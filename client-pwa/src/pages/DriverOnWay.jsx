import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSpinner,
  useIonAlert,
} from "@ionic/react";
import { call, logoWhatsapp, chatbubbleEllipses } from "ionicons/icons";
import { Location, Moneys } from "iconsax-react";
import { MapPicker } from "../components/Map/MapPicker";
import { useToast } from "@hooks/useToast";
import socketService from "../services/socket";
import ChatModal from "../components/ChatModal/ChatModal";
import "./DriverOnWay.css";

import logo from "../assets/img/Desvare.svg";

const API_URL = import.meta.env.VITE_API_URL || 'https://api.desvare.app';

// Intervalo de polling REST cuando el socket no entrega la ubicación
// (común en iOS Safari y cuando la app va a background)
const LOCATION_POLL_INTERVAL_MS = 8000;

const DriverOnWay = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  const [presentAlert] = useIonAlert();

  const [serviceData, setServiceData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverHeading, setDriverHeading] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [_lastLocationSource, setLastLocationSource] = useState(null);
  // true cuando el conductor ingresó el código y el vehículo ya está en la grúa
  const [serviceStarted, setServiceStarted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

    // Asegurar que el socket esté conectado y el cliente registrado
    const userData = localStorage.getItem("user");
    const clientId = userData ? JSON.parse(userData).id : null;

    const ensureConnected = () => {
      if (!socketService.isConnected()) {
        console.log("🔌 DriverOnWay - Reconectando socket...");
        socketService.connect();
      }
      if (clientId) {
        socketService.registerClient(clientId);
        console.log("👤 DriverOnWay - Cliente re-registrado:", clientId);
      }
    };

    ensureConnected();

    // Polling REST: fallback cuando el socket no entrega la ubicación.
    // Se define aquí para poder usarlo también en el visibilitychange y onReconnect.
    const storedService = JSON.parse(localStorage.getItem("activeService") || "{}");
    const activeRequestId = storedService.requestId || parsedData?.requestId;

    const pollDriverLocation = async () => {
      if (!activeRequestId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/requests/${activeRequestId}/location`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.location?.lat != null && data.location?.lng != null) {
          console.log('📍 [Polling] Ubicación del conductor:', data.location);
          setDriverLocation({ lat: data.location.lat, lng: data.location.lng });
          setDriverHeading(data.location.heading || 0);
          setLastLocationSource('polling');
        }
      } catch {
        // Silencioso — no interrumpir la UX si el polling falla
      }
    };

    // Heartbeat: enviar ping cada 25s para que el backend actualice el socketId
    // Crítico en iOS Safari — el socket puede reconectar con un ID nuevo sin avisar
    const heartbeatInterval = setInterval(() => {
      if (clientId && socketService.isConnected()) {
        socketService.getSocket()?.emit("client:ping", { clientId });
      } else if (!socketService.isConnected()) {
        console.log("🏓 DriverOnWay - Socket caído, reconectando...");
        ensureConnected();
      }
    }, 25000);

    // Al reconectar el socket: re-registrar cliente y hacer polling inmediato.
    // Esto resuelve el caso donde el cliente fue a YouTube/WhatsApp y volvió:
    // el socket reconecta automáticamente pero el backend necesita el nuevo socketId.
    const handleSocketReconnect = () => {
      console.log("🔄 DriverOnWay - Socket reconectado, re-registrando cliente...");
      if (clientId) {
        socketService.registerClient(clientId);
      }
      // Polling inmediato para mostrar ubicación actual sin esperar 8 segundos
      pollDriverLocation();
    };
    socketService.onReconnect(handleSocketReconnect);

    // Visibilitychange: cuando el usuario vuelve a la app desde otra app o desbloquea pantalla
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👁️ DriverOnWay - App visible de nuevo, actualizando...");
        ensureConnected();
        // Polling inmediato para mostrar ubicación actual sin esperar el próximo ciclo
        pollDriverLocation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Flag para evitar que los socket handlers se disparen más de una vez
    let socketHandled = false;

    // ✅ Escuchar cuando el conductor completa el servicio
    socketService.onServiceCompleted((data) => {
      if (socketHandled) return;
      socketHandled = true;
      console.log('✅ Servicio completado por el conductor:', data);
      
      showSuccess('¡Servicio completado! El conductor llegó al destino.');
      
      const completedServiceData = {
        requestId: data.requestId || parsedData.requestId,
        driver: parsedData.driver,
        amount: parsedData.amount,
        origin: parsedData.origin,
        destination: parsedData.destination,
        completedAt: data.completedAt
      };
      
      localStorage.setItem('completedService', JSON.stringify(completedServiceData));
      localStorage.removeItem('activeService');
      localStorage.removeItem('activeServiceStatus');
      localStorage.removeItem('currentRequestId');
      
      setTimeout(() => {
        window.location.replace('/rate-service');
      }, 1500);
    });

    // Escuchar actualizaciones de ubicación del conductor en tiempo real (socket)
    socketService.onLocationUpdate((data) => {
      console.log('📍 [Socket] Ubicación del conductor actualizada:', data);
      setDriverLocation({ lat: data.location.lat, lng: data.location.lng });
      setDriverHeading(data.heading || 0);
      setLastLocationSource('socket');
    });

    // El conductor ingresó el código: vehículo en la grúa, vamos al destino
    socketService.onServiceStarted((data) => {
      console.log('🚛 Servicio iniciado (código validado):', data);
      setServiceStarted(true);
      showSuccess('¡Tu vehículo ya está en la grúa! Vamos al destino 🚛');
    });

    // El conductor canceló el servicio: informar al cliente y redirigir
    socketService.onServiceCancelled((data) => {
      if (socketHandled) return;
      socketHandled = true;
      console.log('🚫 El conductor canceló el servicio:', data);

      localStorage.removeItem('activeService');
      localStorage.removeItem('activeServiceStatus');
      localStorage.removeItem('currentRequestId');

      const reason = data.reason || 'Sin motivo especificado';

      presentAlert({
        header: '😔 Servicio cancelado',
        message: `El conductor canceló el servicio.\n\nMotivo: "${reason}"\n\nTe llevaremos de vuelta para que puedas solicitar un nuevo servicio con tus datos guardados.`,
        backdropDismiss: false,
        buttons: [
          {
            text: 'Solicitar nuevo servicio',
            handler: () => {
              // requestData y vehicleData siguen en localStorage → RequestService los cargará
              history.replace('/tabs/desvare');
            },
          },
          {
            text: 'Ir al inicio',
            role: 'cancel',
            handler: () => {
              history.replace('/home');
            },
          },
        ],
      });
    });

    // Primera consulta inmediata al montar (muestra la última posición conocida)
    pollDriverLocation();
    const locationPollInterval = setInterval(pollDriverLocation, LOCATION_POLL_INTERVAL_MS);

    // POLLING DE ESTADO: fallback para service:started y service:completed cuando el socket falla.
    // Flags para evitar múltiples alertas/redirects en bucle
    let statusHandled = false;

    const pollServiceStatus = async () => {
      if (!activeRequestId || statusHandled) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/requests/${activeRequestId}/location`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        if (!res.ok) return;
        const data = await res.json();
        const status = data.status;
        if (!status) return;
        console.log(`🔄 [Polling status] ${status}`);
        if (status === 'in_progress') {
          setServiceStarted(true);
        } else if (status === 'completed') {
          statusHandled = true;
          const completedServiceData = {
            requestId: activeRequestId,
            driver: parsedData?.driver,
            amount: parsedData?.amount,
            origin: parsedData?.origin,
            destination: parsedData?.destination,
            completedAt: new Date().toISOString(),
          };
          localStorage.setItem('completedService', JSON.stringify(completedServiceData));
          localStorage.removeItem('activeService');
          showSuccess('¡Servicio completado!');
          setTimeout(() => window.location.replace('/rate-service'), 1000);
        } else if (status === 'cancelled') {
          statusHandled = true;
          localStorage.removeItem('activeService');
          localStorage.removeItem('currentRequestId');
          presentAlert({
            header: '😔 Servicio cancelado',
            message: 'El conductor canceló el servicio. Te llevaremos de vuelta para que puedas solicitar uno nuevo.',
            backdropDismiss: false,
            buttons: [
              {
                text: 'Solicitar nuevo servicio',
                handler: () => history.replace('/tabs/desvare'),
              },
              {
                text: 'Ir al inicio',
                role: 'cancel',
                handler: () => history.replace('/home'),
              },
            ],
          });
        }
      } catch {
        // silencioso
      }
    };
    pollServiceStatus(); // inmediato al montar
    const statusPollInterval = setInterval(pollServiceStatus, 10000);

    // Contador de mensajes no leídos
    const handleIncomingChat = () => {
      setChatOpen((open) => {
        if (!open) setUnreadCount((n) => n + 1);
        return open;
      });
    };
    socketService.onChatMessage(handleIncomingChat);

    return () => {
      console.log("🧹 DriverOnWay - Cleanup");
      clearInterval(heartbeatInterval);
      clearInterval(locationPollInterval);
      clearInterval(statusPollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      socketService.offReconnect(handleSocketReconnect);
      socketService.offServiceCompleted();
      socketService.offServiceStarted();
      socketService.offServiceCancelled();
      socketService.offLocationUpdate();
      socketService.offChatMessage(handleIncomingChat);
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

  const handleWhatsApp = () => {
    const phone = '573505790415';
    const clientName = serviceData?.clientName || 'Cliente';
    // vehicleSnapshot tiene brand.name / model.name / licensePlate directamente
    const vs    = serviceData?.vehicleSnapshot;
    const brand = vs?.brand?.name || '';
    const model = vs?.model?.name || '';
    const plate = vs?.licensePlate || 'Sin placa';
    const requestId = serviceData?.requestId || '';

    const vehicle = [brand, model].filter(Boolean).join(' ') || 'No especificado';

    const message = encodeURIComponent(
      `Hola, tengo un problema con mi servicio en curso.\n\n` +
      `👤 Cliente: ${clientName}\n` +
      `🚗 Vehículo: ${vehicle}\n` +
      `🔢 Placa: ${plate}\n` +
      `🆔 ID Servicio: ${requestId}`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  // Generar estrellas dinámicamente basadas en el rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <>
        {"⭐".repeat(fullStars)}
        {hasHalfStar && "⭐"}
        {"☆".repeat(emptyStars)}
      </>
    );
  };

  // Formatear el monto como moneda colombiana
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Formatear placa con guión después de 3 caracteres (ABC-123)
  const formatLicensePlate = (plate) => {
    if (!plate) return "Sin placa";
    
    // Limpiar la placa (eliminar espacios y guiones existentes)
    const cleanPlate = plate.replace(/[\s-]/g, '').toUpperCase();
    
    // Si tiene más de 3 caracteres, agregar el guión
    if (cleanPlate.length > 3) {
      return `${cleanPlate.slice(0, 3)}-${cleanPlate.slice(3)}`;
    }
    
    return cleanPlate;
  };

  // const handleChat = () => {
  //   showInfo("Chat próximamente disponible");
  // };

  const handleCancelService = () => {
    console.log("🚨 handleCancelService llamado - Mostrando alert nativo");
    
    // Primero, ofrecer llamar al conductor
    presentAlert({
      header: 'Cancelar Servicio',
      mode: 'ios',
      message: serviceData?.driver?.phone 
        ? `¿Estás seguro que deseas cancelar el servicio?`
        : '¿Estás seguro que deseas cancelar el servicio?',
      buttons: [
        {
          text: 'No, volver',
          role: 'cancel'
        },
        {
          text: 'Si, cancelar',
          cssClass: 'alert-button-confirm',
          handler: () => {
            // Usar setTimeout para asegurar que el primer alert se cierre antes
            setTimeout(() => {
              showCancellationReasons();
            }, 250);
          }
        }
      ]
    });
  };

  const showCancellationReasons = () => {
    presentAlert({
      header: 'Cancelar Servicio',
      message: '¿Por qué deseas cancelar el servicio?',
      inputs: [
        {
          type: 'radio',
          label: 'Ya me desvaré / El carro prendió',
          value: 'resuelto',
          checked: true
        },
        {
          type: 'radio',
          label: 'El conductor no viene',
          value: 'conductor_no_viene'
        },
        {
          type: 'radio',
          label: 'El conductor no responde',
          value: 'conductor_no_responde'
        },
        {
          type: 'radio',
          label: 'Otra grúa me recogió',
          value: 'otra_grua'
        },
        {
          type: 'radio',
          label: 'Muy caro',
          value: 'muy_caro'
        },
        {
          type: 'radio',
          label: 'El conductor está muy lejos',
          value: 'muy_lejos'
        },
        {
          type: 'radio',
          label: 'Otro motivo',
          value: 'otro'
        }
      ],
      buttons: [
        {
          text: 'Volver',
          role: 'cancel'
        },
        {
          text: 'Confirmar Cancelación',
          cssClass: 'alert-button-confirm',
          handler: (reason) => {
            if (!reason) {
              showError('Selecciona un motivo');
              return false;
            }
            
            if (reason === 'otro') {
              // Usar setTimeout para encadenar alerts correctamente
              setTimeout(() => {
                presentAlert({
                  header: 'Otro Motivo',
                  message: 'Describe el motivo de la cancelación:',
                  inputs: [
                    {
                      name: 'customReason',
                      type: 'textarea',
                      placeholder: 'Escribe aquí...',
                      attributes: {
                        maxlength: 200
                      }
                    }
                  ],
                  buttons: [
                    {
                      text: 'Volver',
                      role: 'cancel'
                    },
                    {
                      text: 'Confirmar',
                      handler: (data) => {
                        if (!data.customReason || data.customReason.trim() === '') {
                          showError('Debes escribir un motivo');
                          return false;
                        }
                        confirmCancellation(reason, data.customReason);
                        return true; // Cerrar el alert después de confirmar
                      }
                    }
                  ]
                });
              }, 250);
              return true; // Cerrar el primer alert
            }
            
            // Cancelar con motivo predefinido
            confirmCancellation(reason);
            return true; // Cerrar el alert después de confirmar
          }
        }
      ]
    });
  };

  const confirmCancellation = (reason, customReason = null) => {
    console.log("📝 Confirmando cancelación con razón:", reason, customReason);

    // ✅ Limpiar TODO completamente
    localStorage.removeItem("activeService");
    localStorage.removeItem("currentRequestId");
    localStorage.removeItem("requestData");
    localStorage.removeItem("quotesReceived");

    // Notificar al backend y al conductor con el método correcto
    socketService.cancelServiceWithDetails({
      requestId: serviceData.requestId,
      reason: reason,
      customReason: customReason,
      clientName: serviceData.clientName,
      vehicle: serviceData.vehicle,
      origin: serviceData.origin,
      destination: serviceData.destination,
      problem: serviceData.problem,
    });

    showSuccess("Servicio cancelado");

    // ✅ Forzar navegación limpia sin conflictos de estado
    window.location.href = "/home";
  };

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
      <IonContent className="driver-on-way-page" fullscreen scrollY={true}>
        <div className="dow-layout">
          {/* ── Mapa fijo arriba ── */}
          <div className="dow-map-container">
            <div className="logo-content" onClick={() => history.replace("/home")}>
              <img src={logo} alt="logo" />
            </div>
            <MapPicker
              origin={serviceData.origin}
              destination={serviceStarted ? serviceData.destination : null}
              onRouteCalculated={() => {}}
              quotes={[]}
              onQuoteClick={null}
              driverLocation={driverLocation}
              driverHeading={driverHeading}
              driverPhoto={serviceData.driver?.photo}
              driverName={serviceData.driver?.name}
            />
          </div>

          {/* ── Card inferior con toda la info ── */}
          <div className="dow-info-card">

            {/* 1. Header de estado */}
            {serviceStarted ? (
              <div className="dow-status-bar dow-status-bar--progress">
                <span className="dow-status-icon">🚛</span>
                <div>
                  <p className="dow-status-title">¡Tu vehículo ya está en la grúa!</p>
                  <p className="dow-status-subtitle">Vamos hacia el destino</p>
                </div>
              </div>
            ) : (
              <div className="dow-status-bar dow-status-bar--waiting">
                <span className="dow-status-icon">🛣️</span>
                <div>
                  <p className="dow-status-title">El conductor está en camino</p>
                  <p className="dow-status-subtitle">Espera, pronto llegará a tu ubicación</p>
                </div>
              </div>
            )}

            {/* 2. Info del conductor */}
            <div className="dow-driver-row">
              <div className="driver-avatar-small">
                {serviceData.driver?.photo ? (
                  <img
                    src={serviceData.driver.photo}
                    alt={serviceData.driver?.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = serviceData.driver?.name?.charAt(0) || 'C';
                    }}
                  />
                ) : (
                  serviceData.driver?.name?.charAt(0)?.toUpperCase() || 'C'
                )}
              </div>
              <div className="dow-driver-info">
                <p className="dow-driver-name">{serviceData.driver?.name}</p>
                <span className="stars-rating">{renderStars(serviceData.driver?.rating || 5)}</span>
              </div>
              <p className="vehicle-plate-confirmed-driver-on-way">
                {formatLicensePlate(serviceData.driver?.towTruck?.licensePlate)}
              </p>
            </div>

            {/* 3. Botones de acción */}
            <div className="dow-actions dow-actions--three">
              <IonButton expand="block" onClick={handleCall} className="dow-btn-call">
                <IonIcon icon={call} slot="start" />
                Llamar
              </IonButton>
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => { setChatOpen(true); setUnreadCount(0); }}
                className="dow-btn-chat"
              >
                <IonIcon icon={chatbubbleEllipses} slot="start" />
                Chat
                {unreadCount > 0 && (
                  <span className="dow-chat-badge">{unreadCount}</span>
                )}
              </IonButton>
            </div>

            {/* 4. Código de seguridad (solo Fase 1) */}
            {!serviceStarted && (
              <div className="dow-section">
                <div className="code-box">
                  <div className="box-info">
                    <h4>🔒 Código de Seguridad</h4>
                    <div className="code-digits">
                      {serviceData.securityCode?.split('').map((digit, i) => (
                        <div key={i} className="digit">{digit}</div>
                      ))}
                    </div>
                  </div>
                  <p>Cuando tu vehículo esté sobre la grúa, dale este código al conductor para habilitarle el destino</p>
                </div>
              </div>
            )} 

            {/* 5. Origen y destino — usando estilos de RequestService */}
            <div className="dow-section">
              <div className="confirm-route-card">
                <div className="route-header">
                  <h3>Trayecto del servicio</h3>
                </div>
                <div className="route-locations">
                  <div className="route-location-item">
                    <div className="route-icon origin-marker" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                      <Location size="20" color="#3880ff" variant="Bold" />
                    </div>
                    <div className="route-location-info">
                      <p className="location-type">Origen</p>
                      <p className="location-address">{serviceData.origin?.address || 'Punto de recogida'}</p>
                    </div>
                  </div>
                  <div className="route-location-item">
                    <div className="route-icon destination-marker">
                      <Location size="20" color="#eb445a" variant="Bold" />
                    </div>
                    <div className="route-location-info">
                      <p className="location-type">Destino</p>
                      <p className="location-address">{serviceData.destination?.address || 'Destino del servicio'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Pago */}
            <div className="dow-section">
              <div className="dow-payment-row">
                <Moneys size="22" color="#22C55E" variant="Bold" />
                <div className="dow-payment-info">
                  <p className="dow-payment-label">Método de pago</p>
                  <p className="dow-payment-value">Efectivo</p>
                </div>
                <p className="dow-payment-amount">{formatAmount(serviceData.amount || 0)}</p>
              </div>
            </div>

            <div className="dow-section dow-help-card" onClick={handleWhatsApp}>
              <span className="dow-help-icon">🆘</span>
              <div className="dow-help-text">
                <p className="dow-help-title">¿Necesitas ayuda?</p>
                <p className="dow-help-subtitle">Contacta al soporte de Desvare</p>
              </div>
              <button className="dow-help-whatsapp-btn" aria-label="Abrir WhatsApp de soporte">
                <IonIcon icon={logoWhatsapp} />
              </button>
            </div>

            {/* 7. Cancelar (solo Fase 1) */}
            {!serviceStarted && (
              <div className="dow-section">
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
            )}
          </div>
        </div>

        {/* ── Chat en tiempo real ── */}
        <ChatModal
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          requestId={serviceData?.requestId}
          currentUserId={JSON.parse(localStorage.getItem('user') || '{}')?.id}
          otherName={serviceData?.driver?.name || 'Conductor'}
        />
      </IonContent>
    </IonPage>
  );
};

export default DriverOnWay;
