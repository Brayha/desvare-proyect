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
  IonModal,
  IonInput,
  useIonToast,
  useIonAlert,
} from '@ionic/react';
import { logOutOutline, carSportOutline } from 'ionicons/icons';
import { requestAPI } from '../services/api';
import socketService from '../services/socket';

const Home = () => {
  const history = useHistory();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState('');

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
    socketService.registerDriver(parsedUser.id);

    // Escuchar nuevas solicitudes
    socketService.onRequestReceived((request) => {
      console.log('📥 Nueva solicitud recibida:', request);
      setRequests((prev) => [request, ...prev]);
      
      // Mostrar alerta de nueva solicitud
      presentAlert({
        header: '¡Nueva Solicitud!',
        message: `${request.clientName} está solicitando una cotización`,
        buttons: [
          {
            text: 'Ver',
            handler: () => {
              handleRespondToRequest(request);
            }
          },
          'OK'
        ]
      });

      present({
        message: `Nueva solicitud de ${request.clientName}`,
        duration: 3000,
        color: 'primary',
      });
    });

    return () => {
      socketService.offRequestReceived();
      socketService.disconnect();
    };
  }, [history, present, presentAlert]);

  const handleRespondToRequest = (request) => {
    setSelectedRequest(request);
    setQuoteAmount('');
    setShowModal(true);
  };

  const handleSendQuote = async () => {
    if (!quoteAmount || isNaN(quoteAmount) || parseFloat(quoteAmount) <= 0) {
      present({
        message: 'Por favor ingresa un monto válido',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    try {
      // Guardar en BD
      await requestAPI.addQuote(selectedRequest.requestId, {
        driverId: user.id,
        driverName: user.name,
        amount: parseFloat(quoteAmount),
      });

      // Enviar por Socket.IO
      socketService.sendQuote({
        requestId: selectedRequest.requestId,
        clientId: selectedRequest.clientId,
        driverId: user.id,
        driverName: user.name,
        amount: parseFloat(quoteAmount),
      });

      present({
        message: 'Cotización enviada exitosamente',
        duration: 2000,
        color: 'success',
      });

      setShowModal(false);
      setQuoteAmount('');

      // Marcar como respondida
      setRequests(prev => 
        prev.map(req => 
          req.requestId === selectedRequest.requestId 
            ? { ...req, responded: true } 
            : req
        )
      );
    } catch (error) {
      present({
        message: 'Error al enviar cotización',
        duration: 3000,
        color: 'danger',
      });
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
          <IonTitle>Conductor - {user?.name}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout}>
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={carSportOutline} /> Solicitudes de Cotización
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {requests.length === 0 ? (
              <IonText color="medium">
                <p>No hay solicitudes pendientes. Esperando nuevas solicitudes...</p>
              </IonText>
            ) : (
              <IonList>
                {requests.map((request, index) => (
                  <IonItem key={index}>
                    <IonLabel>
                      <h2>{request.clientName}</h2>
                      <p>{new Date(request.timestamp).toLocaleString()}</p>
                    </IonLabel>
                    {request.responded ? (
                      <IonBadge color="success" slot="end">
                        Respondida
                      </IonBadge>
                    ) : (
                      <IonButton 
                        slot="end" 
                        onClick={() => handleRespondToRequest(request)}
                      >
                        Cotizar
                      </IonButton>
                    )}
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Enviar Cotización</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedRequest && (
              <>
                <IonText>
                  <h2>Cliente: {selectedRequest.clientName}</h2>
                  <p>Solicitud recibida: {new Date(selectedRequest.timestamp).toLocaleString()}</p>
                </IonText>

                <IonItem style={{ marginTop: '20px' }}>
                  <IonLabel position="floating">Monto de la cotización ($)</IonLabel>
                  <IonInput
                    type="number"
                    value={quoteAmount}
                    onIonInput={(e) => setQuoteAmount(e.detail.value)}
                    placeholder="Ej: 25000"
                  />
                </IonItem>

                <IonButton 
                  expand="block" 
                  style={{ marginTop: '20px' }}
                  onClick={handleSendQuote}
                >
                  Enviar Cotización
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Home;


