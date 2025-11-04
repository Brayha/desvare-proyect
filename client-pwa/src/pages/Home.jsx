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
import socketService from '../services/socket';

const Home = () => {
  const history = useHistory();
  const [present] = useIonToast();
  
  const [user, setUser] = useState(null);
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      history.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Registrar cliente (Socket.IO ya está conectado desde App.jsx)
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
      // Solo limpiar el listener, no desconectar (manejado por App.jsx)
      socketService.offQuoteReceived();
    };
  }, [history, present]);

  // TODO: Esta función no se usa actualmente, el flujo de solicitudes ahora es:
  // RequestService → RequestAuth → WaitingQuotes
  // Mantener comentado por si se necesita en el futuro
  /*
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

    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      present({
        message: 'Error al enviar solicitud',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };
  */

  const handleLogout = () => {
    console.log('👋 Cerrando sesión...');
    
    // Limpiar TODOS los datos de localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('requestData');
    localStorage.removeItem('currentRequestId');
    
    // NO desconectar Socket.IO aquí - se maneja en App.jsx al desmontar
    // Solo limpiar listeners locales
    socketService.offQuoteReceived();
    
    // Redirigir al home (sin autenticación)
    // El componente InitialRedirect en App.jsx lo redirigirá a /location-permission
    history.replace('/');
    
    present({
      message: '👋 Sesión cerrada correctamente',
      duration: 2000,
      color: 'success',
    });
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

