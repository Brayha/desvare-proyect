import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonBadge,
  IonButton,
  IonButtons,
  IonIcon,
  useIonToast,
} from '@ionic/react';
import { logOutOutline, searchOutline } from 'ionicons/icons';
import { requestAPI } from '../services/api';
import socketService from '../services/socket';

const Home = () => {
  const history = useHistory();
  const [present] = useIonToast();
  
  const [user, setUser] = useState(null);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      history.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Conectar Socket.IO
    socketService.connect();
    socketService.registerClient(parsedUser.id);

    // Escuchar cotizaciones recibidas
    socketService.onQuoteReceived((quote) => {
      console.log('💰 Cotización recibida:', quote);
      setQuotes((prev) => [quote, ...prev]);
      
      present({
        message: `Nueva cotización de ${quote.driverName}: $${quote.amount.toLocaleString()}`,
        duration: 3000,
        color: 'success',
      });
    });

    return () => {
      socketService.offQuoteReceived();
      socketService.disconnect();
    };
  }, [history, present]);

  const handleRequestQuote = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Crear solicitud en la base de datos
      const response = await requestAPI.createRequest({
        clientId: user.id,
        clientName: user.name,
      });

      setCurrentRequest(response.data.request);
      setQuotes([]); // Limpiar cotizaciones anteriores

      // Emitir evento de nueva solicitud vía Socket.IO
      socketService.sendNewRequest({
        requestId: response.data.requestId,
        clientId: user.id,
        clientName: user.name,
      });

      present({
        message: '¡Solicitud enviada! Esperando cotizaciones...',
        duration: 2000,
        color: 'success',
      });

    } catch (error) {
      present({
        message: 'Error al enviar solicitud',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    history.push('/login');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Cliente - {user?.name}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout}>
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Botón para solicitar cotización */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Solicitar Servicio</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton 
              expand="block" 
              size="large"
              onClick={() => history.push('/location-permission')}
            >
              <IonIcon icon={searchOutline} slot="start" />
              Buscar Grúa
            </IonButton>
            {currentRequest && (
              <IonText color="medium" style={{ display: 'block', marginTop: '10px', textAlign: 'center' }}>
                <small>Solicitud #{currentRequest.id.slice(-6)} enviada</small>
              </IonText>
            )}
          </IonCardContent>
        </IonCard>

        {/* Lista de cotizaciones recibidas */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Cotizaciones Recibidas
              {quotes.length > 0 && (
                <IonBadge color="success" style={{ marginLeft: '10px' }}>
                  {quotes.length}
                </IonBadge>
              )}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {quotes.length === 0 ? (
              <IonText color="medium">
                <p>No has recibido cotizaciones aún. Solicita un servicio para comenzar.</p>
              </IonText>
            ) : (
              <IonList>
                {quotes.map((quote, index) => (
                  <IonItem key={index}>
                    <IonLabel>
                      <h2>{quote.driverName}</h2>
                      <h3 style={{ color: 'var(--ion-color-success)' }}>
                        ${quote.amount.toLocaleString()}
                      </h3>
                      <p>{new Date(quote.timestamp).toLocaleString()}</p>
                    </IonLabel>
                    <IonButton slot="end" color="success">
                      Aceptar
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Home;

