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
import { logOutOutline, carSportOutline, locationOutline } from 'ionicons/icons';
import { requestAPI } from '../services/api';
import socketService from '../services/socket';
import { useDriverLocation } from '../hooks/useDriverLocation';

const Home = () => {
  const history = useHistory();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState('');

  // Hook de geolocalización del conductor
  const { location: driverLocation, loading: locationLoading, error: locationError } = useDriverLocation(10000);

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

    // Escuchar cancelaciones de solicitudes
    socketService.onRequestCancelled((data) => {
      console.log('🚫 Solicitud cancelada:', data.requestId);
      
      // Eliminar la solicitud de la lista
      setRequests((prev) => prev.filter(req => req.requestId !== data.requestId));
      
      // Cerrar modal si estaba abierta para esta solicitud
      if (selectedRequest && selectedRequest.requestId === data.requestId) {
        setShowModal(false);
        setSelectedRequest(null);
      }
      
      // Mostrar notificación
      present({
        message: data.message || 'Servicio cancelado por el cliente',
        duration: 4000,
        color: 'warning',
      });
    });

    return () => {
      socketService.offRequestReceived();
      socketService.offRequestCancelled();
      socketService.disconnect();
    };
  }, [history, present, presentAlert, selectedRequest]);

  // Mostrar error de ubicación si existe
  useEffect(() => {
    if (locationError) {
      present({
        message: `⚠️ Error de ubicación: ${locationError}`,
        duration: 4000,
        color: 'warning',
      });
    }
  }, [locationError, present]);

  // Mostrar confirmación cuando se obtiene la ubicación
  useEffect(() => {
    if (driverLocation && !locationLoading) {
      console.log('✅ Ubicación del conductor lista:', driverLocation);
    }
  }, [driverLocation, locationLoading]);

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

    // Verificar que tengamos la ubicación del conductor
    if (!driverLocation) {
      present({
        message: '⚠️ Obteniendo tu ubicación... Intenta de nuevo',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    try {
      console.log('📤 Enviando cotización con ubicación:', driverLocation);

      // Preparar datos de la cotización
      const quoteData = {
        driverId: user.id,
        driverName: user.name,
        amount: parseFloat(quoteAmount),
        location: {
          lat: driverLocation.lat,
          lng: driverLocation.lng,
        },
      };

      // Guardar en BD
      await requestAPI.addQuote(selectedRequest.requestId, quoteData);

      // Enviar por Socket.IO con ubicación
      socketService.sendQuote({
        requestId: selectedRequest.requestId,
        clientId: selectedRequest.clientId,
        driverId: user.id,
        driverName: user.name,
        amount: parseFloat(quoteAmount),
        location: {
          lat: driverLocation.lat,
          lng: driverLocation.lng,
        },
      });

      console.log('✅ Cotización enviada con ubicación exitosamente');

      present({
        message: '✅ Cotización enviada exitosamente',
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
      console.error('❌ Error al enviar cotización:', error);
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
            {/* Indicador de ubicación */}
            {locationLoading ? (
              <IonButton disabled>
                <IonIcon icon={locationOutline} />
                <IonText style={{ fontSize: '12px', marginLeft: '4px' }}>...</IonText>
              </IonButton>
            ) : driverLocation ? (
              <IonButton disabled color="success">
                <IonIcon icon={locationOutline} />
                <IonText style={{ fontSize: '12px', marginLeft: '4px' }}>✓</IonText>
              </IonButton>
            ) : (
              <IonButton disabled color="danger">
                <IonIcon icon={locationOutline} />
                <IonText style={{ fontSize: '12px', marginLeft: '4px' }}>✗</IonText>
              </IonButton>
            )}
            
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


