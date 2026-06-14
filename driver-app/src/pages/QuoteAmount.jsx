import { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonText,
  IonInput,
  IonSpinner,
  useIonToast,
} from '@ionic/react';
import { requestAPI } from '../services/api';
import socketService from '../services/socket';
import './QuoteAmount.css';
import { arrowBack } from 'ionicons/icons';

const QuoteAmount = () => {
  const history = useHistory();
  const location = useLocation();
  const [present] = useIonToast();
  
  // Leer de location.state primero (navegación normal desde RequestDetail).
  // Si Ionic perdió el state (background resume, hot-reload, push notification),
  // recuperamos del localStorage que Home.jsx guarda antes de hacer history.push.
  const request = location.state?.request || (() => {
    try { return JSON.parse(localStorage.getItem('pendingRequestDetail')); } catch { return null; }
  })();
  const driverLocation = location.state?.driverLocation || (() => {
    try { return JSON.parse(localStorage.getItem('pendingDriverLocation')); } catch { return null; }
  })();
  
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState(false);

  // Si después de 4 segundos no hay datos, redirigir al home
  useEffect(() => {
    if (!request || !driverLocation) {
      const timer = setTimeout(() => {
        setInitError(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [request, driverLocation]);

  const handleAmountChange = (e) => {
    const value = e.detail.value;
    // Remover todos los puntos y espacios para obtener solo números
    const cleanValue = value.replace(/[.\s]/g, '');
    
    // Solo permitir números
    if (cleanValue === '' || /^\d+$/.test(cleanValue)) {
      setAmount(cleanValue);
      // Formatear con separador de miles para mostrar en el input
      if (cleanValue) {
        const formatted = parseInt(cleanValue).toLocaleString('es-CO');
        setDisplayAmount(formatted);
      } else {
        setDisplayAmount('');
      }
    }
  };

  const formatAmount = (value) => {
    if (!value) return '$ 0';
    // Formatear con separador de miles para pesos colombianos
    return `$ ${parseInt(value).toLocaleString('es-CO')}`;
  };

  const handleSendQuote = async () => {
    // Validaciones
    if (!amount || parseInt(amount) <= 0) {
      present({
        message: 'Por favor ingresa un monto válido',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    if (!driverLocation) {
      present({
        message: '⚠️ No se pudo obtener tu ubicación',
        duration: 2000,
        color: 'danger',
      });
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      setLoading(true);
      
      const quoteData = {
        driverId: user._id,
        driverName: user.name,
        amount: parseInt(amount),
        location: {
          lat: driverLocation.lat,
          lng: driverLocation.lng,
        },
      };

      console.log('📤 Enviando cotización al servidor:', quoteData);

      await requestAPI.addQuote(request.requestId, quoteData);
      console.log('✅ Cotización enviada correctamente (REST)');

      // Notificar al cliente en tiempo real vía socket
      socketService.sendQuote({
        requestId: request.requestId,
        clientId: request.clientId,
        ...quoteData,
      });

      // Guardar la solicitud cotizada en localStorage para que Home la muestre
      // con el badge correcto aunque el backend no la devuelva en /nearby (DEV sin GPS)
      const quotedRequest = {
        ...request,
        quotes: [
          ...(request.quotes || []),
          { driverId: quoteData.driverId, driverName: quoteData.driverName, amount: quoteData.amount },
        ],
      };
      localStorage.setItem('lastQuotedRequest', JSON.stringify(quotedRequest));

      // Limpiar el respaldo de RequestDetail: ya no hace falta porque la
      // cotización se envió correctamente.
      localStorage.removeItem('pendingRequestDetail');
      localStorage.removeItem('pendingDriverLocation');

      present({
        message: '✅ Cotización enviada',
        duration: 1500,
        color: 'success',
      });

      // window.location.replace limpia el stack de Ionic completamente,
      // evitando que RequestDetail quede montado debajo de Home
      setTimeout(() => {
        window.location.replace('/home');
      }, 400);

    } catch (error) {
      console.error('❌ Error al enviar cotización:', error);
      present({
        message: 'Error al enviar cotización. Por favor intenta de nuevo.',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!request || !driverLocation) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '15px' }}>
            {initError ? (
              <>
                <IonText color="danger"><p>No se pudieron cargar los datos de la solicitud.</p></IonText>
                <IonButton onClick={() => history.replace('/home')}>Volver al inicio</IonButton>
              </>
            ) : (
              <>
                <IonSpinner name="crescent" />
                <IonText color="medium"><p>Cargando...</p></IonText>
              </>
            )}
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>

      <IonContent className="quote-amount-page">
        <IonFab slot="fixed" vertical="top" horizontal="start">
          <IonFabButton color="light" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBack} />
          </IonFabButton>
        </IonFab>
        <div className="quote-content">
          {/* Texto descriptivo */}

          {/* Monto grande - Display */}
          <div className="amount-display">
            <IonText className="amount-text">
              {formatAmount(amount)}
            </IonText>
            <p className="text-description">Este será el valor que tu cliente verá</p>
          </div>

          {/* Card de Input */}
          <div className="amount-input-card">
            <div className="input-header">
              <IonText className="input-title">
                Ingresa el valor a cobrar
              </IonText>
              <IonText color="medium" className="input-subtitle">
                Define el valor de tu servicio para que el cliente pueda escoger qué cotización le gusta más
              </IonText>
            </div>

            <div className="input-wrapper">
              <span className="currency-symbol">$</span>
              <IonInput
                type="text"
                value={displayAmount}
                onIonInput={handleAmountChange}
                placeholder="0"
                className="amount-input"
                inputmode="numeric"
              />
            </div>
          </div>

          {/* Botón de enviar */}
          <IonButton
            expand="block"
            onClick={handleSendQuote}
            disabled={!amount || parseInt(amount) <= 0 || loading}
            className="send-button"
            size="large"
          >
            {loading ? (
              <>
                <IonSpinner name="crescent" />
                <span style={{ marginLeft: '10px' }}>Enviando...</span>
              </>
            ) : (
              'Enviar cotización'
            )}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default QuoteAmount;
