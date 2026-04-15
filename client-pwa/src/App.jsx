import { IonApp, IonRouterOutlet, setupIonicReact, useIonToast } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import socketService from './services/socket';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NotificationPermissionPrompt from './components/NotificationPermissionPrompt/NotificationPermissionPrompt';
import { requestNotificationPermission, onMessageListener } from './services/fcmService';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import LocationPermission from './pages/LocationPermission';
import RequestAuth from './pages/RequestAuth';
import RequestConfirmation from './pages/RequestConfirmation';
import WaitingQuotes from './pages/WaitingQuotes';
import DriverOnWay from './pages/DriverOnWay';
import RatingService from './pages/RatingService';
import TabLayout from './components/TabLayout/TabLayout';

setupIonicReact();

// Componente para redirección inteligente - Todos van al Home primero
const InitialRedirect = () => {
  console.log('🏠 InitialRedirect → Redirigiendo a /home');
  return <Redirect to="/home" />;
};

const NotificationPromptGate = () => {
  const {
    user,
    showNotificationPrompt,
    setShowNotificationPrompt,
    dismissNotificationPrompt,
  } = useAuth();

  const handleRequestPermission = useCallback(async () => {
    if (!user?.id) return;
    const token = await requestNotificationPermission(user.id);
    if (token) {
      localStorage.setItem('notificationPromptDismissed', 'true');
    }
    setShowNotificationPrompt(false);
  }, [user, setShowNotificationPrompt]);

  if (!showNotificationPrompt || !user?.id) {
    return null;
  }

  return (
    <NotificationPermissionPrompt
      onRequestPermission={handleRequestPermission}
      onDismiss={dismissNotificationPrompt}
    />
  );
};

// Componente para escuchar notificaciones de Firebase en foreground
const FirebaseNotificationListener = () => {
  const { user } = useAuth();
  const [present] = useIonToast();

  useEffect(() => {
    if (!user?.id) return;
    
    console.log('🔔 Registrando listener de notificaciones Firebase...');
    
    const unsubscribe = onMessageListener((payload) => {
      console.log('📬 Notificación recibida en foreground:', payload);
      
      // Mostrar toast con la notificación
      present({
        message: `${payload.title}\n${payload.body}`,
        duration: 5000,
        position: 'top',
        color: 'primary',
        buttons: [
          {
            text: 'Ver',
            handler: () => {
              // Navegar a la URL especificada en la notificación
              if (payload.data?.url) {
                window.location.href = payload.data.url;
              }
            }
          },
          {
            text: 'Cerrar',
            role: 'cancel'
          }
        ]
      });
      
      // Reproducir sonido
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(err => console.log('No se pudo reproducir sonido:', err));
      } catch (err) {
        console.log('Error al reproducir sonido:', err);
      }
      
      // Vibrar (si el dispositivo lo soporta)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    });
    
    return () => {
      console.log('🔕 Desregistrando listener de notificaciones');
      unsubscribe();
    };
  }, [user, present]);

  return null; // Este componente no renderiza nada
};

function App() {
  // Corrige el problema de 100vh en browsers móviles (barra de dirección / nav bar)
  // VisualViewport API da la altura REAL visible, no la máxima teórica
  useEffect(() => {
    const setRealViewportHeight = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--real-vh', `${h}px`);
    };

    setRealViewportHeight();
    window.visualViewport?.addEventListener('resize', setRealViewportHeight);
    window.visualViewport?.addEventListener('scroll', setRealViewportHeight);
    window.addEventListener('resize', setRealViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', setRealViewportHeight);
      window.visualViewport?.removeEventListener('scroll', setRealViewportHeight);
      window.removeEventListener('resize', setRealViewportHeight);
    };
  }, []);

  // Conectar Socket.IO una sola vez al iniciar la app
  useEffect(() => {
    console.log('🚀 Inicializando Socket.IO...');
    socketService.connect();
    
    // NO desconectar en cleanup - mantener conexión durante toda la sesión
    // Socket.IO se desconectará solo cuando se cierre el navegador
    return () => {
      console.log('👋 App desmontándose (no cerrar Socket.IO)');
      // socketService.disconnect(); // ← COMENTADO: NO desconectar
    };
  }, []);

  return (
    <AuthProvider>
      <IonApp>
        <NotificationPromptGate />
        <FirebaseNotificationListener />
        <IonReactRouter>
          <IonRouterOutlet>
            {/* Páginas sin tabs */}
            <Route exact path="/login" component={Login} />
            <Route exact path="/register" component={Register} />
            <Route exact path="/home" component={Home} />
            <Route exact path="/location-permission" component={LocationPermission} />
            <Route exact path="/request-auth" component={RequestAuth} />
            <Route exact path="/request-confirmation" component={RequestConfirmation} />
            <Route exact path="/waiting-quotes" render={(props) => {
              // ✅ Usar requestId como key para forzar remount cuando cambie
              const requestId = localStorage.getItem('currentRequestId') || 'default';
              return <WaitingQuotes key={requestId} {...props} />;
            }} />
            <Route exact path="/driver-on-way" component={DriverOnWay} />
            <Route exact path="/rate-service" component={RatingService} />
            
            {/* Tabs (Desvare + Mi cuenta) */}
            <Route path="/tabs" component={TabLayout} />
            
            {/* Redirección inicial */}
            <Route exact path="/" component={InitialRedirect} />
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </AuthProvider>
  );
}

export default App;
