import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonText,
  IonButton,
  IonModal,
  IonInput,
  IonLabel,
  IonItem,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  useIonToast,
  useIonAlert,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/react';
import { requestAPI } from '../services/api';
import socketService from '../services/socket';
import { useDriverLocation } from '../hooks/useDriverLocation';
import ServiceHeader from '../components/ServiceHeader';
import RequestCard from '../components/RequestCard';
import LocationBanner from '../components/LocationBanner';
import LocationPermissionModal from '../components/LocationPermissionModal';
import './Home.css';

const Home = () => {
  const history = useHistory();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Hook de geolocalización del conductor
  const { 
    location: driverLocation, 
    loading: locationLoading, 
    error: locationError, 
    requestLocation 
  } = useDriverLocation(10000);

  // Cargar imagen de perfil solo si no existe (sin romper nada)
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) return;

    const parsedUser = JSON.parse(userData);
    
    // Si ya tiene selfie, no hacer nada
    if (parsedUser.driverProfile?.documents?.selfie) {
      return;
    }

    // Solo si NO tiene selfie, cargarlo del backend
    const loadProfileImage = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/drivers/profile/${parsedUser._id}`);
        if (response.ok) {
          const data = await response.json();
          const selfie = data.driver?.driverProfile?.documents?.selfie;
          
          if (selfie) {
            // Actualizar solo el selfie en localStorage
            const updatedUser = { ...parsedUser };
            if (!updatedUser.driverProfile.documents) {
              updatedUser.driverProfile.documents = {};
            }
            updatedUser.driverProfile.documents.selfie = selfie;
            
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            console.log('✅ Imagen de perfil cargada');
          }
        }
      } catch (error) {
        console.log('ℹ️ No se pudo cargar imagen de perfil (no crítico)');
      }
    };

    loadProfileImage();
  }, []); // Solo se ejecuta una vez

  // Cargar usuario y solicitudes al montar
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      history.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setIsOnline(parsedUser.driverProfile?.isOnline || false);

    // Conectar Socket.IO
    socketService.connect();
    socketService.registerDriver(parsedUser._id);

    // Cargar solicitudes iniciales
    loadRequests(parsedUser._id);

    // Escuchar nuevas solicitudes
    socketService.onRequestReceived((request) => {
      console.log('📥 Nueva solicitud recibida:', request);
      
      // Normalizar la solicitud para asegurar que tenga todos los campos necesarios
      const normalizedRequest = {
        ...request,
        status: request.status || 'pending', // Asegurar que tenga status
        quotesCount: request.quotesCount || 0 // Asegurar contador de cotizaciones
      };
      
      console.log('✅ Solicitud normalizada:', normalizedRequest);
      setRequests((prev) => [normalizedRequest, ...prev]);
      
      // Toast con botón "Ver" interactivo
      present({
        message: `🚗 Nueva solicitud de ${normalizedRequest.clientName}`,
        duration: 5000,
        position: 'bottom',
        color: 'primary',
        buttons: [
          {
            text: 'Ver',
            handler: () => {
              handleQuote(normalizedRequest);
            }
          }
        ]
      });
    });

    // Escuchar cancelaciones
    socketService.onRequestCancelled((data) => {
      console.log('🚫 Solicitud cancelada:', data.requestId);
      setRequests((prev) => prev.filter(req => req.requestId !== data.requestId));
      
      if (selectedRequest && selectedRequest.requestId === data.requestId) {
        setShowQuoteModal(false);
        setSelectedRequest(null);
      }
      
      present({
        message: data.message || 'Servicio cancelado por el cliente',
        duration: 4000,
        color: 'warning',
      });
    });

    // Escuchar cuando tu cotización es aceptada
    socketService.onServiceAccepted((data) => {
      console.log('🎉 ¡Tu cotización fue aceptada!', data);
      
      presentAlert({
        header: '🎉 ¡Cotización Aceptada!',
        message: `${data.clientName} aceptó tu cotización. Ve a recoger el vehículo.`,
        buttons: ['OK']
      });

      present({
        message: `¡Tu cotización fue aceptada! Cliente: ${data.clientName}`,
        duration: 5000,
        color: 'success',
      });

      // Guardar datos del servicio activo
      localStorage.setItem('activeService', JSON.stringify(data));

      // Actualizar estado a OCUPADO
      setIsOnline(false);
      const updatedUser = { ...parsedUser };
      updatedUser.driverProfile.isOnline = false;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // TODO: Navegar a vista de servicio activo
      // history.push('/active-service');
    });

    // Escuchar cuando otro conductor tomó el servicio
    socketService.onServiceTaken((data) => {
      console.log('❌ Servicio tomado por otro conductor:', data.requestId);
      
      // Remover de la lista
      setRequests((prev) => prev.filter(req => req.requestId !== data.requestId));
      
      present({
        message: 'Este servicio ya fue tomado por otro conductor',
        duration: 3000,
        color: 'medium',
      });
    });

    return () => {
      socketService.offRequestReceived();
      socketService.offRequestCancelled();
      socketService.offServiceAccepted();
      socketService.offServiceTaken();
      socketService.disconnect();
    };
  }, [history, present, presentAlert]);

  // Mostrar modal de permisos al detectar error de ubicación
  useEffect(() => {
    const hasSeenLocationModal = localStorage.getItem('hasSeenLocationModal');
    
    if (!hasSeenLocationModal && locationError) {
      setShowLocationModal(true);
    }
  }, [locationError]);

  // Función para cargar solicitudes
  const loadRequests = async (driverId) => {
    try {
      setLoadingRequests(true);
      const response = await fetch(`http://localhost:5001/api/requests/nearby/${driverId}`);
      const data = await response.json();
      
      if (response.ok) {
        setRequests(data.requests || []);
        console.log(`✅ ${data.count} solicitudes cargadas`);
      } else {
        console.error('Error al cargar solicitudes:', data);
      }
    } catch (error) {
      console.error('❌ Error al cargar solicitudes:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Toggle Ocupado/Activo
  const handleToggleAvailability = async (newStatus) => {
    try {
      const response = await fetch('http://localhost:5001/api/drivers/toggle-availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: user._id,
          isOnline: newStatus
        })
      });

      if (response.ok) {
        setIsOnline(newStatus);
        
        // Notificar a Socket.IO sobre el cambio de disponibilidad
        socketService.notifyAvailabilityChange(user._id, newStatus);
        
        present({
          message: newStatus ? '🟢 Ahora estás ACTIVO' : '🔴 Ahora estás OCUPADO',
          duration: 2000,
          color: newStatus ? 'success' : 'warning',
        });

        // Actualizar localStorage
        const updatedUser = { ...user };
        updatedUser.driverProfile.isOnline = newStatus;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Si cambia a OCUPADO, limpiar solicitudes actuales
        if (!newStatus) {
          setRequests([]);
        } else {
          // Si cambia a ACTIVO, recargar solicitudes
          loadRequests(user._id);
        }
      }
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      present({
        message: 'Error al cambiar estado',
        duration: 2000,
        color: 'danger',
      });
    }
  };

  // Abrir modal de cotización
  const handleQuote = (request) => {
    setSelectedRequest(request);
    setQuoteAmount('');
    setShowQuoteModal(true);
  };

  // Enviar cotización
  const handleSendQuote = async () => {
    if (!quoteAmount || isNaN(quoteAmount) || parseFloat(quoteAmount) <= 0) {
      present({
        message: 'Por favor ingresa un monto válido',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    if (!driverLocation) {
      present({
        message: '⚠️ Obteniendo tu ubicación... Intenta de nuevo',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    try {
      const quoteData = {
        driverId: user._id,
        driverName: user.name,
        amount: parseFloat(quoteAmount),
        location: {
          lat: driverLocation.lat,
          lng: driverLocation.lng,
        },
      };

      await requestAPI.addQuote(selectedRequest.requestId, quoteData);

      socketService.sendQuote({
        requestId: selectedRequest.requestId,
        clientId: selectedRequest.clientId,
        ...quoteData
      });

      present({
        message: '✅ Cotización enviada exitosamente',
        duration: 2000,
        color: 'success',
      });

      setShowQuoteModal(false);
      setQuoteAmount('');

      // Actualizar estado de la solicitud
      setRequests(prev => 
        prev.map(req => 
          req.requestId === selectedRequest.requestId 
            ? { ...req, quotesCount: req.quotesCount + 1, status: 'quoted' } 
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

  // Refrescar solicitudes
  const handleRefresh = async (event) => {
    console.log('🔄 Pull to refresh activado en driver-app');
    await loadRequests(user._id);
    
    present({
      message: `${requests.length} solicitudes actualizadas`,
      duration: 2000,
      color: 'success',
    });
    
    event.detail.complete();
  };

  // Manejar solicitud de permisos de ubicación
  const handleRequestLocationPermission = () => {
    localStorage.setItem('hasSeenLocationModal', 'true');
    setShowLocationModal(false);
    
    if (requestLocation) {
      requestLocation();
    }
    
    present({
      message: 'Por favor, permite el acceso a tu ubicación en el navegador',
      duration: 3000,
      color: 'primary',
    });
  };

  const handleDismissLocationModal = () => {
    localStorage.setItem('hasSeenLocationModal', 'true');
    setShowLocationModal(false);
  };

  return (
    <IonPage>
      <ServiceHeader 
        user={user} 
        isOnline={isOnline} 
        onToggleAvailability={handleToggleAvailability}
      />

      <IonContent className="ion-padding home-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Mostrar banner de ubicación solo si hay error */}
        {locationError && (
          <LocationBanner 
            loading={locationLoading} 
            error={locationError} 
            location={driverLocation} 
          />
        )}

        {/* Título */}
        <div className="page-title">
          <IonText>
            <h1>Bandeja de cotizaciones</h1>
            <p>Recibe aquí las solicitudes de los clientes que necesitan una cotización tuya</p>
          </IonText>
        </div>

        {/* Aviso si está ocupado */}
        {!isOnline && (
          <div className="offline-notice">
            <IonText color="warning">
              <p>⚠️ Estás OCUPADO. Activa tu disponibilidad para recibir nuevas solicitudes.</p>
            </IonText>
          </div>
        )}

        {/* Lista de solicitudes */}
        {loadingRequests ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p>Cargando solicitudes...</p>
            </IonText>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <IonText color="medium">
              <p>No hay solicitudes pendientes.</p>
              <p>Esperando nuevas solicitudes...</p>
            </IonText>
          </div>
        ) : (
          requests.map((request) => (
            <RequestCard 
              key={request.requestId} 
              request={request} 
              onQuote={handleQuote}
            />
          ))
        )}

        {/* Modal de cotización */}
        <IonModal isOpen={showQuoteModal} onDidDismiss={() => setShowQuoteModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Enviar Cotización</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowQuoteModal(false)}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedRequest && (
              <>
                <IonText>
                  <h2>Cliente: {selectedRequest.clientName}</h2>
                  <p><strong>Vehículo:</strong> {selectedRequest.vehicle?.brand} {selectedRequest.vehicle?.model}</p>
                  <p><strong>Placa:</strong> {selectedRequest.vehicle?.licensePlate}</p>
                  <p><strong>Problema:</strong> {selectedRequest.problem}</p>
                  <p><strong>Origen:</strong> {selectedRequest.origin.address}</p>
                  <p><strong>Destino:</strong> {selectedRequest.destination.address}</p>
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

                <IonButton 
                  expand="block" 
                  fill="outline"
                  style={{ marginTop: '10px' }}
                  onClick={() => setShowQuoteModal(false)}
                >
                  Cancelar
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>

        {/* Modal de permisos de ubicación */}
        <LocationPermissionModal
          isOpen={showLocationModal}
          onDismiss={handleDismissLocationModal}
          onRequestPermission={handleRequestLocationPermission}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
