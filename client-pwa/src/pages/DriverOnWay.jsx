import { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'https://api.desvare.app';
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSpinner,
  useIonAlert,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from "@ionic/react";
import { call } from "ionicons/icons";
import { Moneys, Refresh2 } from "iconsax-react";
import { MapPicker } from "../components/Map/MapPicker";
import { useToast } from "@hooks/useToast";
import socketService from "../services/socket";
import "./DriverOnWay.css";

import logo from "../assets/img/Desvare.svg";

const DriverOnWay = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  const [presentAlert] = useIonAlert();

  const [serviceData, setServiceData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverHeading, setDriverHeading] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // true cuando el conductor ingresó el código → servicio "en camino al destino"
  const [serviceStarted, setServiceStarted] = useState(false);
  const serviceDataRef = useRef(null); // ref para acceder en callbacks sin stale closure
  const navigatedRef = useRef(false);  // evitar navegaciones dobles
  const pageRef = useRef(null);        // ref para la IonPage (deshabilitar swipe-back)

  // Deshabilitar swipe-back de Ionic mientras el usuario está rastreando al conductor
  useIonViewWillEnter(() => {
    if (pageRef.current) {
      const ionRouter = document.querySelector('ion-router-outlet');
      if (ionRouter) {
        ionRouter.swipeGesture = false;
      }
    }
  });
  useIonViewWillLeave(() => {
    const ionRouter = document.querySelector('ion-router-outlet');
    if (ionRouter) {
      ionRouter.swipeGesture = true;
    }
  });

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
    serviceDataRef.current = parsedData;
    setIsLoading(false);

    // Usar clientId del activeService (guardado en el momento de aceptar la cotización)
    // como fuente primaria, con fallback a localStorage.user
    const storedUser = localStorage.getItem("user");
    const clientId = parsedData.clientId
      || (storedUser ? JSON.parse(storedUser)?.id || JSON.parse(storedUser)?._id : null);

    // Garantizar conexión socket
    if (!socketService.socket?.connected) {
      socketService.connect();
    }

    // Registrar cliente INMEDIATAMENTE al entrar al tracking.
    // Esto actualiza activeServices en el backend con el socketId actual,
    // evitando que los location-updates del conductor lleguen a un socket viejo.
    if (clientId) {
      socketService.registerClient(clientId);
      console.log('📡 Cliente registrado en socket al entrar a DriverOnWay:', clientId);
    }

    // ─────────────────────────────────────────────
    // Función central: navegar a calificación
    // ─────────────────────────────────────────────
    const goToRating = (completedAt) => {
      if (navigatedRef.current) return; // evitar doble ejecución
      navigatedRef.current = true;

      const data = serviceDataRef.current;
      const completedServiceData = {
        requestId: data.requestId,
        driver: data.driver,
        amount: data.amount,
        origin: data.origin,
        destination: data.destination,
        completedAt: completedAt || new Date().toISOString(),
      };
      localStorage.setItem('completedService', JSON.stringify(completedServiceData));

      // Navegar ANTES de limpiar para evitar que WaitingQuotes (en memoria)
      // detecte el cambio de key y redirija a /home antes que nosotros
      showSuccess('¡Servicio completado! El conductor llegó al destino.');
      history.replace('/rate-service');

      // Limpiar después de navegar (ya no afecta WaitingQuotes)
      setTimeout(() => {
        localStorage.removeItem('activeService');
        localStorage.removeItem('currentRequestId');
        localStorage.removeItem('requestData');
      }, 500);
    };

    // ─────────────────────────────────────────────
    // Capa 1: socket → notificación inmediata
    // ─────────────────────────────────────────────
    socketService.onServiceCompleted((data) => {
      console.log('✅ [SOCKET] Servicio completado recibido:', data);
      goToRating(data.completedAt);
    });

    // ─────────────────────────────────────────────
    // Capa 2: polling REST cada 15s (red de seguridad)
    // Si el socket falla, esto garantiza que el cliente
    // siempre se entera cuando el conductor termina.
    // ─────────────────────────────────────────────
    const checkServiceStatus = async () => {
      if (navigatedRef.current) return;
      const reqId = serviceDataRef.current?.requestId;
      if (!reqId) return;
      try {
        const res = await fetch(`${API_URL}/api/requests/${reqId}`);
        if (!res.ok) return;
        const body = await res.json();
        const status = body.request?.status || body.status;
        if (status === 'completed') {
          console.log('✅ [POLLING] Servicio completado detectado via REST');
          goToRating(body.request?.completedAt || body.completedAt);
        }
      } catch (err) {
        console.warn('⚠️ Error en polling de estado:', err.message);
      }
    };

    const pollInterval = setInterval(checkServiceStatus, 15000);

    // ─────────────────────────────────────────────
    // Función central de recuperación de conexión
    // ─────────────────────────────────────────────
    const recoverConnection = () => {
      if (!socketService.isConnected()) socketService.connect();
      if (clientId) socketService.registerClient(clientId);
      checkServiceStatus();
    };

    // Fix: socket.on('connect') es el evento correcto en Socket.IO v4
    // Dispara en conexión inicial Y en cada reconexión (reconnect no dispara en v4)
    const rawSocket = socketService.getSocket();
    if (rawSocket) {
      rawSocket.on('connect', () => {
        console.log('🔄 Socket reconectado en DriverOnWay - re-registrando cliente...');
        recoverConnection();
      });
    }

    // ─────────────────────────────────────────────
    // Visibilitychange: app visible → verificar estado
    // Cubre: desbloquear pantalla, volver de otra app
    // ─────────────────────────────────────────────
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ DriverOnWay visible - verificando socket y estado del servicio...');
        recoverConnection();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ─────────────────────────────────────────────
    // window.online: red recuperada (sale del metro, etc.)
    // ─────────────────────────────────────────────
    const handleOnline = () => {
      console.log('🌐 Red recuperada en DriverOnWay - reconectando...');
      recoverConnection();
    };
    window.addEventListener('online', handleOnline);

    // ─────────────────────────────────────────────
    // Heartbeat cada 25s: mantiene socket vivo en iOS
    // iOS mata WebSockets inactivos en ~30s
    // ─────────────────────────────────────────────
    const heartbeatInterval = setInterval(() => {
      if (clientId && socketService.isConnected()) {
        socketService.getSocket()?.emit('client:ping', { clientId });
      } else if (!socketService.isConnected()) {
        recoverConnection();
      }
    }, 25000);

    // ─────────────────────────────────────────────
    // Tracking de ubicación conductor en tiempo real
    // ─────────────────────────────────────────────
    socketService.onLocationUpdate((data) => {
      setDriverLocation({ lat: data.location.lat, lng: data.location.lng });
      setDriverHeading(data.heading || 0);
    });

    // ─────────────────────────────────────────────
    // Capa 3: escuchar que el conductor validó el código
    // → mostrar nueva UI "en camino al destino"
    // ─────────────────────────────────────────────
    const rawSocket2 = socketService.getSocket();
    if (rawSocket2) {
      rawSocket2.off('service:started');
      rawSocket2.on('service:started', (data) => {
        console.log('🔑 [SOCKET] Código validado — servicio en curso:', data);
        setServiceStarted(true);
        showSuccess('¡Tu vehículo ya está en la grúa! En camino al destino.');
      });
    }

    return () => {
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
      socketService.offServiceCompleted();
      socketService.offLocationUpdate();
      const rawSock = socketService.getSocket();
      if (rawSock) {
        rawSock.off('connect');
        rawSock.off('service:started');
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
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

  const handleShareLocation = () => {
    const driverName = serviceData?.driver?.name || 'el conductor';
    const plate = serviceData?.driver?.towTruck?.licensePlate
      ? `Placa: ${formatLicensePlate(serviceData.driver.towTruck.licensePlate)}.`
      : '';
    const amount = formatAmount(serviceData?.amount || 0);
    const originAddr = serviceData?.origin?.address || '';
    const destAddr = serviceData?.destination?.address || '';

    let mapsLink = '';
    if (driverLocation?.lat && driverLocation?.lng) {
      mapsLink = `\n📍 Ubicación actual del conductor: https://maps.google.com/?q=${driverLocation.lat},${driverLocation.lng}`;
    }

    const text = `Hola, estoy usando Desvare 🚛\n\n` +
      `Mi vehículo fue recogido por ${driverName}. ${plate}\n` +
      `💰 Valor acordado: ${amount}\n` +
      `📌 Origen: ${originAddr}\n` +
      `🏁 Destino: ${destAddr}` +
      mapsLink +
      `\n\nPor favor haz seguimiento de mi trayecto.`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
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
      header: '⚠️ Cancelar Servicio',
      mode: "ios",
      message: serviceData?.driver?.phone 
        ? `¿Deseas llamar a ${serviceData.driver.name} antes de cancelar?`
        : '¿Estás seguro que deseas cancelar el servicio?',
      buttons: [
        {
          text: 'Volver',
          role: 'cancel'
        },
        ...(serviceData?.driver?.phone ? [{
          text: `📞 Llamar a ${serviceData.driver.name}`,
          handler: () => {
            window.location.href = `tel:${serviceData.driver.phone}`;
            return true; // Cerrar el alert después de iniciar la llamada
          }
        }] : []),
        {
          text: 'Continuar con cancelación',
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
    <IonPage ref={pageRef} className="ion-page-no-swipe-back">
      <IonContent className="driver-on-way-page" fullscreen scrollY={false}>
        <div className="logo-content" onClick={() => history.replace("/home")}>
          <img src={logo} alt="logo" />
        </div>
        {/* Mapa con tracking en tiempo real */}
        <div className="map-container-tracking">
          <MapPicker
            origin={serviceData.origin}
            destination={null}
            onRouteCalculated={() => {}}
            quotes={[]}
            onQuoteClick={null}
            driverLocation={driverLocation} // 🆕 Ubicación en tiempo real
            driverHeading={driverHeading}   // 🆕 Dirección del vehículo
            driverPhoto={serviceData.driver?.photo} // 🆕 Foto del conductor
            driverName={serviceData.driver?.name}   // 🆕 Nombre del conductor
          />

          {/* Información del servicio */}
          <div className="service-info-section">
            {/* Overlay con info del conductor */}
            <div className="confirm-driver-info-section">
              <div className="confirm-driver-info-header">
                <div className="confirm-driver-info-header-compact">
                  <div className="driver-avatar-small">
                    {serviceData.driver?.photo ? (
                      <img 
                        src={serviceData.driver.photo} 
                        alt={serviceData.driver?.name} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.textContent = serviceData.driver?.name?.charAt(0) || "C";
                        }}
                      />
                    ) : (
                      serviceData.driver?.name?.charAt(0) || "C"
                    )}
                  </div>
                  <div className="confirm-driver-info-details">
                    <h3>{serviceData.driver?.name}</h3>
                    <div className="confirm-driver-info-meta">
                      <span className="stars-rating">
                        {renderStars(serviceData.driver?.rating || 5)}
                      </span>
                    </div>
                  </div>
                  <p className="vehicle-plate-confirmed-driver-on-way">
                    {formatLicensePlate(serviceData.driver?.towTruck?.licensePlate)}
                  </p>
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
                      <h4>{formatAmount(serviceData.amount || 0)}</h4>
                    </div>
                  </div>
                  <div className="info-items">
                    <div className="info-item">
                      <p>Método de pago</p>
                      <h4>{serviceData.paymentMethod || "Efectivo"}</h4>
                    </div>
                  </div>
                </div>

                {!serviceStarted ? (
                  /* ── Estado: esperando que el conductor ingrese el código ── */
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
                      Cuando tu vehículo esté sobre la grúa, dale este código al
                      conductor para habilitarle el destino
                    </p>
                  </div>
                ) : (
                  /* ── Estado: código validado → servicio en curso ── */
                  <div className="service-in-progress-box">
                    <div className="sip-header">
                      <span className="sip-icon">🚛</span>
                      <div>
                        <h4 className="sip-title">¡Tu vehículo está en camino!</h4>
                        <p className="sip-subtitle">El conductor ya tiene la dirección del destino</p>
                      </div>
                    </div>
                    <div className="sip-route">
                      <div className="sip-route-item sip-route-item--done">
                        <span className="sip-dot sip-dot--done">✓</span>
                        <span>{serviceData.origin?.address || 'Origen'}</span>
                      </div>
                      <div className="sip-route-line" />
                      <div className="sip-route-item">
                        <span className="sip-dot sip-dot--dest">🏁</span>
                        <span>{serviceData.destination?.address || 'Destino'}</span>
                      </div>
                    </div>
                    <IonButton
                      expand="block"
                      onClick={handleShareLocation}
                      className="share-location-button"
                    >
                      📤 Compartir seguimiento por WhatsApp
                    </IonButton>
                  </div>
                )}
              </div>

              {!serviceStarted && (
                <IonButton
                  expand="block"
                  fill="clear"
                  color="danger"
                  onClick={handleCancelService}
                  className="cancel-service-button"
                >
                  Cancelar Servicio
                </IonButton>
              )}
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverOnWay;
