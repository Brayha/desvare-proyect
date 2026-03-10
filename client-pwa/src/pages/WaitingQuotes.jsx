import { useState, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  useIonAlert,
} from "@ionic/react";
import { chevronDownCircleOutline } from "ionicons/icons";
import { Notification } from "iconsax-react";
import { MapPicker } from "../components/Map/MapPicker";
import { useToast } from "@hooks/useToast";
import { useNotification } from "../hooks/useNotification";
import QuoteSlider from "../components/QuoteSlider/QuoteSlider";
import QuoteDetailSheet from "../components/QuoteDetailSheet/QuoteDetailSheet";
import socketService from "../services/socket";
// import { formatDistance, formatDuration } from "../utils/mapbox"; // Para uso futuro
import "./WaitingQuotes.css";

import logo from "../assets/img/Desvare.svg";

// ============================================
// API URL Configuration
// ============================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ============================================
// 🧪 EXPERIMENT-QUOTES: Flag para activar/desactivar
// ============================================
const EXPERIMENT_QUOTES = false; // ⚠️ Desactivado para probar con conductores reales

// 🧪 EXPERIMENT-QUOTES: Generar cotizaciones aleatorias cerca del origen
const generateRandomQuotes = (originLat, originLng) => {
  const quotes = [];
  const driverNames = [
    "Carlos Rodríguez",
    "Ana María López",
    "Jorge Martínez",
    "Luisa Gómez",
    "Pedro Sánchez",
    "María Fernanda",
  ];

  // Distancia máxima del origen: 10km (en grados, ~0.01 = ~1km)
  const maxDistance = 0.1; // ~10km máximo

  for (let i = 0; i < 6; i++) {
    // Generar ángulo aleatorio para posición diferente
    const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5; // Distribuir alrededor
    // Distancia aleatoria hasta 10km
    const distance = Math.random() * maxDistance;

    const lat = originLat + distance * Math.cos(angle);
    const lng = originLng + distance * Math.sin(angle);

    // Precio aleatorio entre $80,000 y $150,000
    const amount = Math.floor(80000 + Math.random() * 70000);

    quotes.push({
      driverId: `experiment-driver-${i}`,
      driverName: driverNames[i],
      amount: amount,
      location: {
        lat: lat,
        lng: lng,
      },
      timestamp: new Date(),
    });
  }

  return quotes;
};

const WaitingQuotes = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  const [presentAlert] = useIonAlert();
  const { playSound, vibrate } = useNotification();
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  const [user, setUser] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setRequestSent] = useState(false);
  const [requestId, setRequestId] = useState(null);

  // ✅ CRÍTICO: Inicializar con función para limpiar ANTES del primer render
  const [quotesReceived, setQuotesReceived] = useState(() => {
    // Limpiar localStorage inmediatamente al crear el estado
    localStorage.removeItem("quotesReceived");
    console.log(
      "🗑️ Limpieza preventiva: quotesReceived eliminado del localStorage"
    );
    return [];
  });

  const [selectedQuote, setSelectedQuote] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Carga las cotizaciones guardadas en BD (útil al reconectar o al hacer pull-to-refresh)
  const fetchQuotesFromBackend = useCallback(async () => {
    const currentRequestId = localStorage.getItem("currentRequestId");
    if (!currentRequestId) return;

    try {
      const response = await fetch(`${API_URL}/api/requests/${currentRequestId}`);
      const data = await response.json();

      if (response.ok && data.request?.quotes?.length > 0) {
        const formattedQuotes = data.request.quotes.map((q) => ({
          driverId: q.driverId,
          driverName: q.driverName,
          amount: q.amount,
          location: q.location || null,
          timestamp: q.timestamp,
          driverPhoto: q.driverPhoto || null,
          driverRating: q.driverRating || 5,
          driverServiceCount: q.driverServiceCount || 0,
        }));
        setQuotesReceived(formattedQuotes);
        console.log(`✅ ${formattedQuotes.length} cotizaciones cargadas del backend`);
      }
    } catch (error) {
      console.error("❌ Error al obtener cotizaciones del backend:", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true; // Flag para evitar actualizaciones si el componente se desmonta
    console.log("🔄 WaitingQuotes - useEffect ejecutándose");

    const initializeData = () => {
      // ✅ LIMPIAR cotizaciones y estado al montar el componente
      console.log("🧹 Limpiando estado anterior de cotizaciones");

      // ✅ CRÍTICO: Limpiar localStorage de cotizaciones antiguas
      localStorage.removeItem("quotesReceived");
      console.log("🗑️ quotesReceived eliminado del localStorage");

      setQuotesReceived([]);
      setSelectedQuote(null);
      setSheetOpen(false);
      setIsAccepting(false);

      // Verificar que tengamos todos los datos necesarios
      const userData = localStorage.getItem("user");
      const storedRouteData = localStorage.getItem("requestData");
      const currentRequestId = localStorage.getItem("currentRequestId");

      console.log("📦 Datos en localStorage:", {
        hasUser: !!userData,
        hasRouteData: !!storedRouteData,
        hasRequestId: !!currentRequestId,
        isMounted,
      });

      // Si falta algo, redirigir
      if (!userData) {
        if (isMounted) {
          console.log("❌ No hay usuario, redirigiendo a /request-auth");
          showError("Debes iniciar sesión primero");
          history.push("/request-auth");
        }
        return false;
      }

      if (!storedRouteData) {
        if (isMounted) {
          console.log("❌ No hay datos de ruta, redirigiendo a /home");
          // Limpiar requestId huérfano para evitar bucle con el botón verde del Home
          localStorage.removeItem("currentRequestId");
          showError("No se encontraron datos de la ruta");
          history.push("/home");
        }
        return false;
      }

      if (!currentRequestId) {
        if (isMounted) {
          console.log("❌ No hay requestId, redirigiendo a /home");
          showError(
            "No se encontró la solicitud. Por favor, intenta de nuevo."
          );
          history.push("/home");
        }
        return false;
      }

      // Cargar datos en el state
      const parsedUser = JSON.parse(userData);
      const parsedRouteData = JSON.parse(storedRouteData);

      console.log("📋 WaitingQuotes - Datos cargados:", {
        userId: parsedUser.id, // ✅ Verificar que id existe
        userName: parsedUser.name,
        requestId: currentRequestId,
        routeInfo: parsedRouteData.routeInfo,
      });

      if (isMounted) {
        setUser(parsedUser);
        setRouteData(parsedRouteData);
        setRequestId(currentRequestId);
        setRequestSent(true); // La solicitud ya fue enviada en RequestAuth
        setIsLoading(false);
      }

      console.log("✅ WaitingQuotes - Componente listo");
      return true;
    };

    // Inicializar datos
    const success = initializeData();

    // Solo registrar listener si la inicialización fue exitosa
    if (success) {
      console.log("👂 Registrando listener de cotizaciones");

      // Obtener el requestId actual para validación
      const currentRequestId = localStorage.getItem("currentRequestId");
      console.log("🎯 Listener configurado para requestId:", currentRequestId);

      socketService.onQuoteReceived((quote) => {
        console.log("💰 Cotización recibida en WaitingQuotes:", quote);
        console.log("📍 Ubicación del conductor:", quote.location);
        console.log("💵 Monto:", quote.amount);
        console.log("📸 Foto del conductor:", quote.driverPhoto || "❌ Sin foto");
        console.log("⭐ Rating del conductor:", quote.driverRating || "❌ Sin rating");
        console.log("🚗 Servicios completados:", quote.driverServiceCount || "❌ Sin servicios");

        // ✅ VALIDACIÓN CRÍTICA: Verificar que la cotización sea del request actual
        if (quote.requestId !== currentRequestId) {
          console.warn("⚠️ Cotización de request antiguo IGNORADA:", {
            cotizacionRequestId: quote.requestId,
            actualRequestId: currentRequestId,
          });
          return; // ← IGNORAR cotizaciones de otros requests
        }

        console.log("✅ Cotización válida para el request actual");

        // Agregar cotización a la lista
        setQuotesReceived((prev) => [...prev, quote]);

        // Sonido + vibración al llegar cotización (el card inferior es la notificación visual)
        playSound();
        vibrate();
      });

      // Reconexión: re-registrar cliente y recuperar cotizaciones perdidas
      const rawSocket = socketService.getSocket();
      if (rawSocket) {
        rawSocket.on('reconnect', () => {
          if (!isMounted) return;
          console.log('🔄 Socket reconectado - re-registrando cliente y recuperando cotizaciones');
          const userData = localStorage.getItem("user");
          if (userData) {
            const parsedUser = JSON.parse(userData);
            socketService.registerClient(parsedUser.id);
          }
          fetchQuotesFromBackend();
        });
      }

      // ✅ Escuchar cancelaciones de cotizaciones
      socketService.onQuoteCancelled((data) => {
        console.log("🚫 Cotización cancelada en WaitingQuotes:", data);

        // Remover la cotización cancelada de la lista
        if (isMounted) {
          setQuotesReceived((prev) => {
            const filtered = prev.filter(q => q.driverId !== data.driverId);
            console.log(`📊 Cotizaciones después de cancelación: ${filtered.length}`);
            
            // ✅ Si filtered.length === 0, el componente automáticamente
            //    mostrará el loader "Buscando cotizaciones..." (líneas 669-692)
            //    y seguirá escuchando nuevas cotizaciones por Socket.IO
            // ✅ NO redirigir, mantener al cliente en la búsqueda activa
            
            return filtered;
          });

          // ✅ Cerrar modal si la cotización cancelada es la que está abierta
          setSelectedQuote((currentQuote) => {
            if (currentQuote && currentQuote.driverId === data.driverId) {
              console.log('⚠️ La cotización en el modal fue cancelada - Cerrando modal');
              setSheetOpen(false); // Cerrar el modal
              
              // Mostrar notificación al cliente
              showError(`${data.driverName} canceló su cotización`);
              
              return null; // Limpiar la cotización seleccionada
            }
            return currentQuote; // Mantener si es otra cotización
          });
        }
      });
    }

    // Cleanup function
    return () => {
      console.log("🧹 WaitingQuotes - Desmontando componente");
      isMounted = false;
      socketService.offQuoteReceived();
      socketService.offQuoteCancelled();
      const rawSocket = socketService.getSocket();
      if (rawSocket) rawSocket.off('reconnect');
      console.log("🔇 Listeners de cotizaciones removidos");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar el componente

  // ✅ SEGUNDO useEffect: Detectar cambio de requestId y limpiar estado
  useEffect(() => {
    const currentRequestId = localStorage.getItem("currentRequestId");

    console.log("🔄 Detectando cambios en requestId:", {
      requestIdEnEstado: requestId,
      requestIdEnStorage: currentRequestId,
      cotizacionesActuales: quotesReceived.length,
    });

    // Si hay cotizaciones pero el requestId cambió, limpiar
    if (
      quotesReceived.length > 0 &&
      requestId &&
      requestId !== currentRequestId
    ) {
      console.warn("⚠️ RequestId cambió! Limpiando cotizaciones antiguas:", {
        requestIdAntiguo: requestId,
        requestIdNuevo: currentRequestId,
        cotizacionesALimpiar: quotesReceived.length,
      });

      setQuotesReceived([]);
      setSelectedQuote(null);
      setSheetOpen(false);
    }

    // Actualizar requestId en el estado si cambió
    if (requestId !== currentRequestId) {
      console.log("🆕 Actualizando requestId en estado:", currentRequestId);
      setRequestId(currentRequestId);
    }
  }, [requestId, quotesReceived.length]); // ← Se ejecuta cuando cambia requestId o cantidad de cotizaciones

  // ============================================
  // 🧪 EXPERIMENT-QUOTES: Enviar cotizaciones aleatorias después de la primera real
  // ============================================
  useEffect(() => {
    if (!EXPERIMENT_QUOTES) return; // Si el experimento está desactivado, no hacer nada

    const timeoutIds = []; // Array para guardar los IDs de los timeouts

    // Solo disparar cuando llegue la PRIMERA cotización real
    if (quotesReceived.length === 1 && routeData?.origin) {
      console.log(
        "🧪 EXPERIMENT-QUOTES: Iniciando envío de cotizaciones aleatorias..."
      );

      // Generar 6 cotizaciones aleatorias
      const randomQuotes = generateRandomQuotes(
        routeData.origin.lat,
        routeData.origin.lng
      );

      // Enviar cada cotización con delay fijo de 3 segundos
      randomQuotes.forEach((quote, index) => {
        const delay = 3000; // 3 segundos fijos entre cada cotización

        const timeoutId = setTimeout(() => {
          console.log(
            `🧪 EXPERIMENT-QUOTES: Enviando cotización #${index + 1} (${
              quote.driverName
            }) - $${quote.amount.toLocaleString()}`
          );
          setQuotesReceived((prev) => [...prev, quote]);
        }, delay * (index + 1)); // Secuencial: 3s, 6s, 9s, 12s, 15s, 18s

        timeoutIds.push(timeoutId); // Guardar el ID para limpiarlo después
      });
    }

    // Cleanup: Limpiar todos los timeouts si el componente se desmonta
    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
      if (timeoutIds.length > 0) {
        console.log("🧹 EXPERIMENT-QUOTES: Limpiando timeouts pendientes");
      }
    };
  }, [quotesReceived.length, routeData]);
  // ============================================
  // 🧪 FIN EXPERIMENT-QUOTES
  // ============================================

  const handleCancelRequest = () => {
    console.log("🚫 Cancelando solicitud...");

    // Obtener el requestId y datos antes de limpiar
    const currentRequestId = localStorage.getItem("currentRequestId");
    const requestData = localStorage.getItem("requestData");

    if (currentRequestId) {
      // Parsear datos para obtener información del cliente y vehículo
      let clientName = user?.name || "Cliente";
      let vehicle = null;
      let origin = null;
      let destination = null;
      let problem = null;

      if (requestData) {
        try {
          const parsed = JSON.parse(requestData);
          vehicle = parsed.vehicleSnapshot;
          origin = parsed.origin;
          destination = parsed.destination;
          problem = parsed.serviceDetails?.problem;
        } catch (error) {
          console.error("Error al parsear requestData:", error);
        }
      }

      // Emitir evento de cancelación con detalles completos
      socketService.cancelServiceWithDetails({
        requestId: currentRequestId,
        reason: "cliente_cancelo_busqueda",
        customReason: "El cliente canceló mientras esperaba cotizaciones",
        clientName: clientName,
        vehicle: vehicle,
        origin: origin,
        destination: destination,
        problem: problem,
      });
      console.log(
        "📡 Evento de cancelación con detalles enviado a conductores"
      );
    }

    // ✅ Limpiar solo la solicitud actual, MANTENER requestData para edición
    // localStorage.removeItem("requestData"); ← NO eliminar, mantener origen/destino/vehículo
    // localStorage.removeItem("currentRequestId"); ← NO eliminar AQUÍ, RequestService lo limpiará
    localStorage.removeItem("activeService");
    localStorage.removeItem("quotesReceived");

    // ✅ Limpiar estado de cotizaciones en memoria
    setQuotesReceived([]);
    setSelectedQuote(null);
    setSheetOpen(false);

    showSuccess("Solicitud cancelada");

    // ✅ Volver a /tabs/desvare para que pueda EDITAR y volver a buscar
    // IMPORTANTE: Redirigir SIN eliminar currentRequestId para evitar race condition
    history.replace("/tabs/desvare");
  };

  // Pull to Refresh - Recargar cotizaciones desde el backend
  const handleRefresh = async (event) => {
    console.log("🔄 Pull to refresh activado");
    try {
      await fetchQuotesFromBackend();
      showSuccess("Cotizaciones actualizadas");
    } catch (error) {
      console.error("❌ Error al refrescar cotizaciones:", error);
      showError("Error al actualizar cotizaciones");
    } finally {
      event.detail.complete();
    }
  };

  // Manejar click en marcador del mapa
  const handleQuoteClick = (quote) => {
    console.log("💰 Click en cotización:", quote);
    console.log("🔍 Estructura completa del quote:", {
      driverId: quote.driverId,
      driverName: quote.driverName,
      amount: quote.amount,
      todasLasPropiedades: Object.keys(quote),
    });
    setSelectedQuote(quote);
    setSheetOpen(true);
  };

  // Aceptar cotización
  const handleAcceptQuote = async (quote) => {
    console.log("✅ Aceptando cotización:", quote);

    // Confirmar con el usuario
    presentAlert({
      mode: "ios",
      header: "Confirmar Aceptación",
      message: `¿Deseas aceptar la cotización de ${
        quote.driverName
      } por $${quote.amount.toLocaleString()}?`,
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "Aceptar",
          handler: async () => {
            await processAcceptance(quote);
          },
        },
      ],
    });
  };

  const processAcceptance = async (quote) => {
    setIsAccepting(true);

    try {
      const currentRequestId = localStorage.getItem("currentRequestId");

      // ✅ VALIDACIÓN 1: Verificar requestId
      if (!currentRequestId) {
        console.error("❌ No hay currentRequestId en localStorage");
        showError("Error: No se encontró la solicitud");
        setIsAccepting(false);
        return;
      }

      // ✅ VALIDACIÓN 2: Verificar que user existe y tiene id
      if (!user || !user.id) {
        console.error("❌ Usuario no cargado o sin id:", user);
        showError("Error: Usuario no encontrado. Intenta recargar la página.");
        setIsAccepting(false);
        return;
      }

      // ✅ VALIDACIÓN 3: Verificar que quote existe y tiene driverId
      if (!quote || !quote.driverId) {
        console.error("❌ Cotización inválida o sin driverId:", quote);
        showError("Error: Cotización inválida");
        setIsAccepting(false);
        return;
      }

      // ✅ LOG DE DEBUG: Mostrar exactamente qué vamos a enviar
      console.log("📤 Enviando aceptación de cotización:", {
        requestId: currentRequestId,
        clientId: user.id,
        driverId: quote.driverId,
        amount: quote.amount,
        driverName: quote.driverName,
      });

      // Llamar al endpoint de aceptación
      const response = await fetch(
        `${API_URL}/api/requests/${currentRequestId}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: user.id,
            driverId: quote.driverId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Cotización aceptada exitosamente:", data);

        // Notificar por Socket.IO
        socketService.acceptService({
          requestId: currentRequestId,
          clientId: user.id,
          clientName: user.name,
          clientPhone: user.phone || data.request.clientPhone,
          acceptedDriverId: quote.driverId,
          amount: quote.amount,
          securityCode: data.request.securityCode,
          origin: routeData.origin,
          destination: routeData.destination,
          vehicle: data.request.vehicleSnapshot?.vehicle,
          vehicleSnapshot: data.request.vehicleSnapshot,
          problem: data.request.serviceDetails?.problem,
          serviceDetails: data.request.serviceDetails,
          otherDriverIds: data.otherDriverIds || [],
        });

        // Guardar datos del servicio aceptado
        localStorage.setItem(
          "activeService",
          JSON.stringify({
            requestId: currentRequestId,
            driver: data.request.assignedDriver,
            securityCode: data.request.securityCode,
            amount: quote.amount,
            origin: routeData.origin,
            destination: routeData.destination,
            vehicle: data.request.vehicleSnapshot?.vehicle,
            vehicleSnapshot: data.request.vehicleSnapshot,
            problem: data.request.serviceDetails?.problem,
            serviceDetails: data.request.serviceDetails,
          })
        );

        // ✅ CRÍTICO: Limpiar cotizaciones del localStorage
        localStorage.removeItem("quotesReceived");
        localStorage.removeItem("requestData");
        console.log("🗑️ Cotizaciones y requestData limpiados del localStorage");

        // Cerrar sheet
        setSheetOpen(false);

        showSuccess("¡Cotización aceptada!");

        // Navegar a vista "Conductor en Camino" usando tabs
        setTimeout(() => {
          history.push("/driver-on-way");
        }, 500);
      } else {
        // ❌ Error del backend - Mostrar detalles
        console.error("❌ Backend rechazó la aceptación:", {
          status: response.status,
          error: data.error,
          requestId: currentRequestId,
          clientId: user.id,
          driverId: quote.driverId,
        });
        showError(data.error || "Error al aceptar cotización");
      }
    } catch (error) {
      // ❌ Error de red o JavaScript
      console.error("❌ Error crítico al aceptar cotización:", error);
      showError("Error de conexión. Verifica tu internet.");
    } finally {
      setIsAccepting(false);
    }
  };

  // Estas funciones se usarán cuando implementemos el bottom sheet de detalles
  // const handleViewQuotes = () => {
  //   history.push('/home');
  // };

  // const getDistanceText = () => {
  //   if (!routeData?.routeInfo) return 'Calculando...';
  //   return routeData.routeInfo.distanceText || formatDistance(routeData.routeInfo.distance);
  // };

  // const getDurationText = () => {
  //   if (!routeData?.routeInfo) return 'Calculando...';
  //   return routeData.routeInfo.durationText || formatDuration(routeData.routeInfo.duration);
  // };

  if (isLoading || !user || !routeData) {
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
      <IonContent className="waiting-quotes-page" fullscreen>
      <div className="logo-content" onClick={() => history.replace("/home")}>
          <img src={logo} alt="logo" />
        </div>
        {/* Pull to Refresh */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={chevronDownCircleOutline}
            pullingText="Desliza para actualizar"
            refreshingSpinner="circles"
            refreshingText="Actualizando cotizaciones..."
          />
        </IonRefresher>

        {/* Mapa fullscreen - Sin header ni footer */}
        <div className="map-container-fullscreen-no-header">
          <MapPicker
            origin={routeData.origin}
            destination={null}
            onRouteCalculated={() => {}}
            quotes={quotesReceived}
            onQuoteClick={handleQuoteClick}
            focusedQuoteLocation={quotesReceived[activeQuoteIndex]?.location || null}
          />

          {/* Sin cotizaciones: aviso SMS + spinner */}
          {quotesReceived.length === 0 && (
            <div className="floating-card-top">
              <div className="sms-notification-card">
                <Notification
                  size="28"
                  variant="Bold"
                  className="sms-icon"
                  color="#0055ff"
                />
                <IonText className="sms-text">
                  Cuando lleguen las cotizaciones te notificaremos vía mensaje
                  de texto
                </IonText>
              </div>
            </div>
          )}

          {quotesReceived.length === 0 && (
            <div className="floating-card-bottom">
              <div className="search-status-card">
                <div className="spinner-container">
                  <IonText className="search-text">
                    <h3>Buscando cotizaciones...</h3>
                    <p>
                      Las grúas están revisando tu servicio y pronto llegarán
                      sus cotizaciones
                    </p>
                  </IonText>
                  <IonSpinner
                    name="crescent"
                    className="search-spinner-large"
                  />
                </div>
                <button
                  onClick={handleCancelRequest}
                  className="cancel-request-button"
                >
                  <p>Cancelar búsqueda</p>
                </button>
              </div>
            </div>
          )}

          {/* Con cotizaciones: slider inferior */}
          {quotesReceived.length > 0 && (
            <QuoteSlider
              quotes={quotesReceived}
              onQuoteClick={handleQuoteClick}
              onSlideChange={(index) => setActiveQuoteIndex(index)}
              onCancel={handleCancelRequest}
            />
          )}
        </div>

        {/* Sheet Modal con detalles de cotización */}
        <QuoteDetailSheet
          isOpen={sheetOpen}
          onDismiss={() => setSheetOpen(false)}
          quote={selectedQuote}
          onAccept={handleAcceptQuote}
          isAccepting={isAccepting}
        />
      </IonContent>
    </IonPage>
  );
};

export default WaitingQuotes;
