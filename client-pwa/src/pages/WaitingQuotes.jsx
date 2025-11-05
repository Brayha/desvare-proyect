import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { MapPicker } from "../components/Map/MapPicker";
import { useToast } from "@hooks/useToast";
import socketService from "../services/socket";
// import { formatDistance, formatDuration } from "../utils/mapbox"; // Para uso futuro
import "./WaitingQuotes.css";

// ============================================
// 🧪 EXPERIMENT-QUOTES: Flag para activar/desactivar
// ============================================
const EXPERIMENT_QUOTES = true; // ⚠️ Cambiar a false para desactivar el experimento

// 🧪 EXPERIMENT-QUOTES: Generar cotizaciones aleatorias cerca del origen
const generateRandomQuotes = (originLat, originLng) => {
  const quotes = [];
  const driverNames = [
    "Carlos Rodríguez",
    "Ana María López", 
    "Jorge Martínez",
    "Luisa Gómez",
    "Pedro Sánchez",
    "María Fernanda"
  ];
  
  // Distancia máxima del origen: 10km (en grados, ~0.01 = ~1km)
  const maxDistance = 0.10; // ~10km máximo
  
  for (let i = 0; i < 6; i++) {
    // Generar ángulo aleatorio para posición diferente
    const angle = (Math.PI * 2 * i) / 6 + (Math.random() * 0.5); // Distribuir alrededor
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
        lng: lng
      },
      timestamp: new Date()
    });
  }
  
  return quotes;
};

const WaitingQuotes = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();
  
  const [user, setUser] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setRequestSent] = useState(false);
  const [, setRequestId] = useState(null);
  const [quotesReceived, setQuotesReceived] = useState([]);

  useEffect(() => {
    let isMounted = true; // Flag para evitar actualizaciones si el componente se desmonta

    const initializeData = () => {
      // Verificar que tengamos todos los datos necesarios
      const userData = localStorage.getItem('user');
      const storedRouteData = localStorage.getItem('requestData');
      const currentRequestId = localStorage.getItem('currentRequestId');

      // Si falta algo, redirigir
      if (!userData) {
        if (isMounted) {
          showError("Debes iniciar sesión primero");
          history.push('/request-auth');
        }
        return;
      }

      if (!storedRouteData) {
        if (isMounted) {
          showError("No se encontraron datos de la ruta");
          history.push('/request-service');
        }
        return;
      }

      if (!currentRequestId) {
        if (isMounted) {
          showError("No se encontró la solicitud. Por favor, intenta de nuevo.");
          history.push('/request-service');
        }
        return;
      }

      // Cargar datos en el state
      const parsedUser = JSON.parse(userData);
      const parsedRouteData = JSON.parse(storedRouteData);

      console.log('📋 WaitingQuotes - Datos cargados:', {
        user: parsedUser.name,
        requestId: currentRequestId,
        routeInfo: parsedRouteData.routeInfo
      });

      if (isMounted) {
        setUser(parsedUser);
        setRouteData(parsedRouteData);
        setRequestId(currentRequestId);
        setRequestSent(true); // La solicitud ya fue enviada en RequestAuth
        setIsLoading(false);
      }

      console.log('✅ WaitingQuotes - Componente listo');

      // Solo escuchar cotizaciones (Socket.IO ya está conectado desde App.jsx)
      socketService.onQuoteReceived((quote) => {
        if (!isMounted) return;
        
        console.log('💰 Cotización recibida en WaitingQuotes:', quote);
        console.log('📍 Ubicación del conductor:', quote.location);
        console.log('💵 Monto:', quote.amount);
        
        setQuotesReceived((prev) => [...prev, quote]);
      });
    };

    initializeData();

    return () => {
      isMounted = false;
      // Limpiar listener de cotizaciones al desmontar
      socketService.offQuoteReceived();
      console.log('🧹 Limpiando listeners de cotizaciones');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar el componente

  // ============================================
  // 🧪 EXPERIMENT-QUOTES: Enviar cotizaciones aleatorias después de la primera real
  // ============================================
  useEffect(() => {
    if (!EXPERIMENT_QUOTES) return; // Si el experimento está desactivado, no hacer nada
    
    const timeoutIds = []; // Array para guardar los IDs de los timeouts
    
    // Solo disparar cuando llegue la PRIMERA cotización real
    if (quotesReceived.length === 1 && routeData?.origin) {
      console.log('🧪 EXPERIMENT-QUOTES: Iniciando envío de cotizaciones aleatorias...');
      
      // Generar 6 cotizaciones aleatorias
      const randomQuotes = generateRandomQuotes(
        routeData.origin.lat,
        routeData.origin.lng
      );
      
      // Enviar cada cotización con delay fijo de 3 segundos
      randomQuotes.forEach((quote, index) => {
        const delay = 3000; // 3 segundos fijos entre cada cotización
        
        const timeoutId = setTimeout(() => {
          console.log(`🧪 EXPERIMENT-QUOTES: Enviando cotización #${index + 1} (${quote.driverName}) - $${quote.amount.toLocaleString()}`);
          setQuotesReceived((prev) => [...prev, quote]);
        }, delay * (index + 1)); // Secuencial: 3s, 6s, 9s, 12s, 15s, 18s
        
        timeoutIds.push(timeoutId); // Guardar el ID para limpiarlo después
      });
    }
    
    // Cleanup: Limpiar todos los timeouts si el componente se desmonta
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      if (timeoutIds.length > 0) {
        console.log('🧹 EXPERIMENT-QUOTES: Limpiando timeouts pendientes');
      }
    };
  }, [quotesReceived.length, routeData]);
  // ============================================
  // 🧪 FIN EXPERIMENT-QUOTES
  // ============================================

  const handleCancelRequest = () => {
    console.log('🚫 Cancelando solicitud...');
    
    // TODO: Emitir evento de cancelación a conductores via Socket.IO
    // socketService.emit('request:cancel', { requestId });
    
    // Limpiar datos de la solicitud
    localStorage.removeItem('requestData');
    localStorage.removeItem('currentRequestId');
    
    showSuccess('Solicitud cancelada');
    
    // Volver al Home para reiniciar el proceso
    history.replace('/home');
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
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner />
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
            <IonButton onClick={handleCancelRequest}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Buscando Cotizaciones</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="waiting-quotes-page">
        {/* Mapa fullscreen - SOLO origen, sin destino ni ruta */}
        <div className={`map-container-fullscreen ${quotesReceived.length > 0 ? 'with-quotes' : ''}`}>
          <MapPicker
            origin={routeData.origin}
            destination={null}
            onRouteCalculated={() => {}}
            quotes={quotesReceived}
            onQuoteClick={(quote) => {
              console.log('💰 Click en cotización:', quote);
              // TODO: Abrir bottom sheet con detalles del conductor
            }}
          />

          {/* Overlay de búsqueda - SOLO si NO hay cotizaciones */}
          {quotesReceived.length === 0 && (
            <div className="search-overlay">
              <div className="search-content">
                <IonSpinner name="crescent" color="light" className="search-spinner" />
                <IonText color="light">
                  <h2>Buscando conductores...</h2>
                </IonText>
                <IonText color="light" className="search-subtitle">
                  <p>Esto puede tomar unos segundos</p>
                </IonText>
              </div>
            </div>
          )}
        </div>

        {/* Bottom sheet mínimo - SOLO si NO hay cotizaciones */}
        {quotesReceived.length === 0 && (
          <div className="bottom-sheet-minimal">
            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              onClick={handleCancelRequest}
              className="cancel-button"
            >
              🚫 Cancelar Solicitud
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default WaitingQuotes;

