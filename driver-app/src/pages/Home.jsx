import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonText,
  useIonToast,
  useIonAlert,
  useIonViewWillEnter,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { requestAPI } from '../services/api';
import socketService from '../services/socket';
import { useDriverLocation } from '../hooks/useDriverLocation';
import { initializePushNotifications } from '../services/pushNotifications';
import ServiceHeader from '../components/ServiceHeader';
import RequestCard from '../components/RequestCard';
import LocationBanner from '../components/LocationBanner';
import LocationPermissionModal from '../components/LocationPermissionModal';
import CancellationDetailModal from '../components/CancellationDetailModal';
import './Home.css';

// ============================================
// API URL Configuration
// ============================================
const API_URL = import.meta.env.VITE_API_URL || 'https://api.desvare.app';

const Home = () => {
  const history = useHistory();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  
  // Estados para modal de cancelación
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationData, setCancellationData] = useState(null);
  // Estado para banner de notificaciones denegadas
  const [notifDenied, setNotifDenied] = useState(false);

  // Hook de geolocalización del conductor
  const { 
    location: driverLocation, 
    loading: locationLoading, 
    error: locationError, 
    requestLocation 
  } = useDriverLocation(isOnline, 10000); // 🆕 Pasar isOnline para pausar GPS cuando está OCUPADO

  // 🔄 Recargar requests cada vez que la vista se activa (volviendo de QuoteAmount, etc.)
  useIonViewWillEnter(() => {
    console.log('🔄 Vista Home activada - Recargando requests del backend...');
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      loadRequests(parsedUser._id);
    }
  });

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
        const profileToken = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/drivers/profile/${parsedUser._id}`, {
          headers: { ...(profileToken && { Authorization: `Bearer ${profileToken}` }) },
        });
        if (response.ok) {
          const data = await response.json();
          const selfie = data.driver?.documents?.selfie;
          
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

    // Conectar Socket.IO y registrar conductor
    socketService.connect();
    socketService.registerDriver(parsedUser._id);

    // Al reconectar: re-registrar conductor para que vuelva a recibir solicitudes
    const handleDriverReconnect = () => {
      console.log('🔄 Socket reconectado - re-registrando conductor...');
      socketService.registerDriver(parsedUser._id);
      // Re-notificar disponibilidad para volver a la sala active-drivers si corresponde
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.driverProfile?.isOnline) {
        socketService.notifyAvailabilityChange(parsedUser._id, true);
      }
    };
    socketService.onReconnect(handleDriverReconnect);

    // Al volver a la app (desbloquear pantalla / regresar de otra app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!socketService.isConnected()) {
          socketService.connect();
        }
        socketService.registerDriver(parsedUser._id);
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.driverProfile?.isOnline) {
          socketService.notifyAvailabilityChange(parsedUser._id, true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 🔔 Inicializar push notifications
    initializePushNotifications(parsedUser._id).then((granted) => {
      if (granted === false) setNotifDenied(true);
    });

    // Cargar solicitudes iniciales
    loadRequests(parsedUser._id);

    // Escuchar nuevas solicitudes
    socketService.onRequestReceived((request) => {
      console.log('📥 Nueva solicitud recibida:', request);
      
      // Normalizar la solicitud para asegurar que tenga todos los campos necesarios
      const normalizedRequest = {
        ...request,
        id: request.requestId,
        requestId: request.requestId,
        status: request.status || 'pending',
        quotesCount: request.quotesCount || 0,
        // ✅ Asegurar que vehicle existe con valores por defecto
        vehicle: request.vehicle || {
          icon: '🚗',
          brand: 'N/A',
          model: 'N/A',
          licensePlate: 'N/A'
        },
        // ✅ NUEVO: Preservar vehicleSnapshot completo (con truckData y busData)
        vehicleSnapshot: request.vehicleSnapshot,
        // ✅ NUEVO: Preservar serviceDetails completo (problema, sótano, carga)
        serviceDetails: request.serviceDetails,
        // ✅ Asegurar que problem existe
        problem: request.problem || 'Sin descripción',
        // ✅ Asegurar que distanceKm y durationMin existen
        distanceKm: request.distanceKm || (request.distance ? (request.distance / 1000).toFixed(1) : 'N/A'),
        durationMin: request.durationMin || (request.duration ? Math.round(request.duration / 60) : 'N/A')
      };
      
      console.log('✅ Solicitud normalizada:', normalizedRequest);
      console.log('🚗 VehicleSnapshot:', normalizedRequest.vehicleSnapshot);
      console.log('📝 ServiceDetails:', normalizedRequest.serviceDetails);
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
      console.log('🚫 EVENTO CANCELACIÓN RECIBIDO');
      console.log('📝 RequestId recibido:', data.requestId);
      console.log('📝 Razón:', data.reason);
      console.log('📝 Razón custom:', data.customReason);
      console.log('📦 Datos completos de cancelación:', data);
      console.log('📋 Requests actuales:', requests.map(r => r.requestId));
      
      // ✅ Remover de la lista con conversión a String para evitar problemas de comparación
      setRequests((prev) => {
        const filtered = prev.filter(req => 
          req.requestId?.toString() !== data.requestId?.toString()
        );
        console.log('📊 Requests después de filtrar:', filtered.map(r => r.requestId));
        return filtered;
      });

      // Limpiar lastQuotedRequest si corresponde a la solicitud cancelada.
      // Sin esto, loadRequests la reinyecta aunque el backend ya la filtró.
      try {
        const lastQuotedRaw = localStorage.getItem('lastQuotedRequest');
        if (lastQuotedRaw) {
          const lastQuoted = JSON.parse(lastQuotedRaw);
          if (lastQuoted.requestId?.toString() === data.requestId?.toString()) {
            localStorage.removeItem('lastQuotedRequest');
            console.log('🗑️ lastQuotedRequest limpiado por cancelación del cliente');
          }
        }
      } catch (_) {
        localStorage.removeItem('lastQuotedRequest');
      }
      
      // ✅ VERIFICAR si es el servicio ACTIVO (aceptado)
      const activeServiceData = localStorage.getItem('activeService');
      if (activeServiceData) {
        try {
          const activeService = JSON.parse(activeServiceData);
          if (activeService.requestId?.toString() === data.requestId?.toString()) {
            console.log('🚨 Servicio activo cancelado por el cliente');
            
            // Limpiar servicio activo
            localStorage.removeItem('activeService');
            
            // Actualizar estado a ACTIVO
            setIsOnline(true);
            const updatedUser = { ...parsedUser };
            updatedUser.driverProfile.isOnline = true;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Si está en /active-service, redirigir a /home
            if (window.location.pathname === '/active-service') {
              console.log('🔄 Redirigiendo desde /active-service a /home');
              history.push('/home');
            }
            
            // Guardar datos y redirigir a vista dedicada
            console.log('💾 Guardando datos de cancelación en localStorage');
            localStorage.setItem('lastCancellation', JSON.stringify(data));
            
            setTimeout(() => {
              console.log('🎯 Redirigiendo a /cancellation-detail');
              history.push('/cancellation-detail');
            }, 500);
            
            return; // ← IMPORTANTE: Salir aquí
          }
        } catch (error) {
          console.error('❌ Error al verificar servicio activo:', error);
        }
      }
      
      // ✅ Si NO es servicio activo (solo cotización en bandeja), remover silenciosamente
      console.log('ℹ️ Cancelación de solicitud en bandeja (no activa) - Removiendo silenciosamente');
      
      // NO mostrar toast, NO redirigir, quedarse en Home esperando nuevas solicitudes
    });

    // Escuchar cuando tu cotización es aceptada
    // También se recibe con isResume:true cuando el conductor reconecta tras push notification
    socketService.onServiceAccepted((data) => {
      const isResume = data.isResume === true;
      console.log(isResume ? '🔄 Reanudando servicio activo:' : '🎉 ¡Tu cotización fue aceptada!', data);
      
      // Incluir driverId en los datos guardados (necesario para sendLocationUpdate en ActiveService)
      const serviceToSave = {
        ...data,
        driverId: data.driverId || parsedUser?._id || parsedUser?.id
      };
      
      // Remover la solicitud de la bandeja (solo aplica si no es reanudación)
      if (!isResume) {
        setRequests((prev) => prev.filter(req => req.requestId?.toString() !== data.requestId?.toString()));
      }
      
      // Guardar datos del servicio activo en localStorage
      localStorage.setItem('activeService', JSON.stringify(serviceToSave));

      // Limpiar la cotización guardada: ya no corresponde mostrarla en Home
      localStorage.removeItem('lastQuotedRequest');

      // Actualizar estado a OCUPADO
      setIsOnline(false);
      const updatedUser = { ...parsedUser };
      if (updatedUser.driverProfile) updatedUser.driverProfile.isOnline = false;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      present({
        message: isResume
          ? `Servicio activo reanudado: ${data.clientName}`
          : `¡Tu cotización fue aceptada! Cliente: ${data.clientName}`,
        duration: 3000,
        color: isResume ? 'warning' : 'success',
      });

      // window.location.replace limpia el stack de Ionic: evita que Home/RequestDetail
      // queden apilados debajo de ActiveService y reaparezcan al volver atrás
      setTimeout(() => {
        window.location.replace('/active-service');
      }, 400);
    });

    // Escuchar cuando otro conductor tomó el servicio
    socketService.onServiceTaken((data) => {
      console.log('❌ Servicio tomado por otro conductor:', data.requestId);
      
      setRequests((prev) => prev.filter(
        req => req.requestId?.toString() !== data.requestId?.toString()
      ));
      
      present({
        message: 'Este servicio ya fue tomado por otro conductor',
        duration: 3000,
        color: 'medium',
      });
    });

    // Escuchar cuando una cotización expira
    socketService.onQuoteExpired((data) => {
      console.log('⏰ Cotización expirada:', data);
      
      setRequests((prev) => prev.filter(
        req => req.requestId?.toString() !== data.requestId?.toString()
      ));
      
      // Limpiar lastQuotedRequest si coincide
      try {
        const lastRaw = localStorage.getItem('lastQuotedRequest');
        if (lastRaw) {
          const last = JSON.parse(lastRaw);
          if (last.requestId?.toString() === data.requestId?.toString()) {
            localStorage.removeItem('lastQuotedRequest');
          }
        }
      } catch (_) { /* no crítico */ }

      present({
        message: data.message || 'Una de tus cotizaciones expiró',
        duration: 3000,
        color: 'medium',
      });
    });

    return () => {
      // Solo limpiar listeners — NO desconectar el socket.
      // El socket es un singleton compartido; desconectarlo aquí mata el GPS
      // en ActiveService cuando el conductor navega durante un servicio activo.
      socketService.offReconnect(handleDriverReconnect);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socketService.offRequestReceived();
      socketService.offRequestCancelled();
      socketService.offServiceAccepted();
      socketService.offServiceTaken();
      socketService.offQuoteExpired();
    };
  }, [history, present, presentAlert]);

  // Mostrar modal de permisos al detectar error de ubicación
  useEffect(() => {
    const hasSeenLocationModal = localStorage.getItem('hasSeenLocationModal');
    
    if (!hasSeenLocationModal && locationError) {
      setShowLocationModal(true);
    }
  }, [locationError]);

  // Solicitar permiso de notificaciones desde el banner
  const handleRequestNotifPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      present({ message: 'Las notificaciones push solo funcionan en la app instalada (APK)', duration: 3000, color: 'medium' });
      return;
    }
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const status = await PushNotifications.requestPermissions();
      if (status.receive === 'granted') {
        setNotifDenied(false);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          initializePushNotifications(u._id);
        }
        present({ message: '✅ Notificaciones activadas', duration: 2000, color: 'success' });
      } else {
        present({ message: 'Ve a Ajustes → Notificaciones para activarlas', duration: 4000, color: 'warning' });
      }
    } catch (err) {
      console.error('Error solicitando permiso de notificaciones:', err);
      present({ message: 'No se pudo solicitar el permiso. Ve a Ajustes.', duration: 3000, color: 'danger' });
    }
  };

  // Solicitar permiso de ubicación desde el banner de error
  const handleRequestLocationPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      // En navegador: intentar geolocalización directamente para disparar el prompt del browser
      try {
        await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
      } catch {
        // El usuario rechazó desde el navegador, abrir ajustes no es posible en web
        present({ message: 'Activa la ubicación en la configuración de tu navegador', duration: 4000, color: 'warning' });
      }
      return;
    }

    try {
      const status = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
      const granted = status.location === 'granted' || status.coarseLocation === 'granted';
      if (granted) {
        present({ message: '✅ Permiso de ubicación concedido', duration: 2000, color: 'success' });
        // Recargar la página para que el hook de ubicación se reinicie
        window.location.reload();
      } else {
        // Permiso denegado permanentemente → instruir al usuario
        present({ message: 'Ve a Ajustes → Permisos → Ubicación para activarla', duration: 4000, color: 'warning' });
      }
    } catch (err) {
      console.error('Error solicitando permiso de ubicación:', err);
      present({ message: 'No se pudo solicitar el permiso. Ve a Ajustes del dispositivo.', duration: 4000, color: 'danger' });
    }
  };

  // Función para cargar solicitudes
  const loadRequests = async (driverId) => {
    try {
      setLoadingRequests(true);
      const token = localStorage.getItem('token');

      // Enviar coordenadas del conductor para que el backend filtre por proximidad
      const locationParams = driverLocation
        ? `?lat=${driverLocation.lat}&lng=${driverLocation.lng}`
        : '';

      const response = await fetch(`${API_URL}/api/requests/nearby/${driverId}${locationParams}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      const data = await response.json();
      
      if (response.ok) {
        let fetchedRequests = data.requests || [];

        // Si el backend no devolvió la solicitud que ya cotizamos
        // (puede pasar cuando el GPS no está disponible o la solicitud ya no es "nearby"),
        // la reinyectamos desde localStorage para que el conductor siempre la vea.
        // Los eventos de socket (aceptación, cancelación, expiración) la limpian cuando corresponde.
        const lastQuotedRaw = localStorage.getItem('lastQuotedRequest');
        if (lastQuotedRaw) {
          try {
            const lastQuoted = JSON.parse(lastQuotedRaw);
            const alreadyPresent = fetchedRequests.some(
              (r) => r.requestId === lastQuoted.requestId
            );

            if (alreadyPresent) {
              // Está en la lista → fusionar quotes[] para que el badge del monto funcione
              fetchedRequests = fetchedRequests.map((r) => {
                if (r.requestId === lastQuoted.requestId && lastQuoted.quotes?.length) {
                  return { ...r, quotes: r.quotes?.length ? r.quotes : lastQuoted.quotes };
                }
                return r;
              });
            } else {
              // No la devolvió el backend → inyectarla directamente sin llamada extra.
              // Los eventos de socket se encargan de limpiar lastQuotedRequest cuando
              // la solicitud es aceptada, cancelada o expirada.
              fetchedRequests = [lastQuoted, ...fetchedRequests];
              console.log('📋 Solicitud cotizada reinyectada desde localStorage');
            }
          } catch (_) {
            localStorage.removeItem('lastQuotedRequest');
          }
        }

        setRequests(fetchedRequests);
        console.log(`✅ ${fetchedRequests.length} solicitudes cargadas`);
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
      // Validar que user existe y tiene _id
      if (!user || !user._id) {
        console.error('❌ Error: user no está definido o no tiene _id');
        present({
          message: '⚠️ Error: Usuario no cargado. Intenta de nuevo.',
          duration: 2000,
          color: 'danger',
        });
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/drivers/toggle-availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
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

  // Abrir detalle de solicitud o detalle de cotización
  const handleQuote = (request) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));

    if (!currentUser || !currentUser._id) {
      console.error('❌ Error: user no está definido o no tiene _id');
      present({
        message: '⚠️ Error: Usuario no cargado. Intenta de nuevo.',
        duration: 2000,
        color: 'danger',
      });
      return;
    }

    const myQuote = request.quotes?.find(q => q.driverId?.toString() === currentUser._id?.toString());

    if (myQuote) {
      history.push(`/quote-detail/${request.requestId}`);
    } else {
      // Guardar en localStorage como respaldo: Ionic puede perder location.state
      // en ciertos ciclos del lifecycle (re-mount, hot-reload, push notification resume)
      localStorage.setItem('pendingRequestDetail', JSON.stringify(request));
      if (driverLocation) {
        localStorage.setItem('pendingDriverLocation', JSON.stringify(driverLocation));
      } else {
        localStorage.removeItem('pendingDriverLocation');
      }
      history.push('/request-detail', {
        request: request,
        driverLocation: driverLocation,
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

  // Manejar solicitud de permisos de ubicación desde el modal (diferente al banner)
  const handleRequestLocationFromModal = () => {
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

        {/* Banner de ubicación */}
        {locationError && (
          <LocationBanner 
            loading={locationLoading} 
            error={locationError} 
            location={driverLocation}
            onRequestPermission={handleRequestLocationPermission}
          />
        )}

        {/* Banner de notificaciones denegadas */}
        {notifDenied && (
          <div className="location-banner location-banner-error">
            <span style={{ fontSize: 24, flexShrink: 0 }}>🔕</span>
            <div className="location-text">
              <span className="location-title">Notificaciones desactivadas</span>
              <span className="location-subtitle">No recibirás avisos de nuevos servicios</span>
            </div>
            <button className="location-action-btn" onClick={handleRequestNotifPermission}>
              <span>Activar</span>
            </button>
          </div>
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
          (() => {
            // Leer user una sola vez fuera del map, no N veces por cada solicitud
            const currentUser = JSON.parse(localStorage.getItem('user'));
            return requests.map((request) => {
              const myQuote = request.quotes?.find(q => q.driverId === currentUser?._id);
              return (
                <RequestCard
                  key={request.requestId}
                  request={request}
                  onQuote={handleQuote}
                  myQuote={myQuote}
                />
              );
            });
          })()
        )}

        {/* Modal de permisos de ubicación */}
        <LocationPermissionModal
          isOpen={showLocationModal}
          onDismiss={handleDismissLocationModal}
          onRequestPermission={handleRequestLocationFromModal}
        />

        {/* Modal de detalle de cancelación */}
        <CancellationDetailModal
          isOpen={showCancellationModal}
          onDismiss={() => setShowCancellationModal(false)}
          cancellationData={cancellationData}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
