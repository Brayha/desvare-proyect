import { useState } from 'react';
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
  IonText,
  IonInput,
  IonSpinner,
  useIonToast,
} from '@ionic/react';
import { requestAPI } from '../services/api';
import './QuoteAmount.css';

const QuoteAmount = () => {
  const history = useHistory();
  const location = useLocation();
  const [present] = useIonToast();
  
  const request = location.state?.request;
  const driverLocation = location.state?.driverLocation;
  
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [loading, setLoading] = useState(false);

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
      console.log('✅ Cotización enviada correctamente');
      
      present({
        message: '✅ Cotización enviada',
        duration: 1500,
        color: 'success',
      });

      // Volver al home después de enviar
      history.replace('/home');

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
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p>Cargando...</p>
            </IonText>
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
            <IonBackButton defaultHref="/request-detail" text="" />
          </IonButtons>
          <IonTitle>Cotiza el servicio</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="quote-amount-page">
        <div className="quote-content">
          {/* Texto descriptivo */}
          <div className="description-text">
            <IonText color="medium">
              Este será el valor que tu cliente verá
            </IonText>
          </div>

          {/* Monto grande - Display */}
          <div className="amount-display">
            <IonText className="amount-text">
              {formatAmount(amount)}
            </IonText>
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
                type="number"
                value={amount}
                onIonInput={handleAmountChange}
                placeholder="0"
                className="amount-input"
                inputmode="numeric"
                min="0"
                step="1"
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
