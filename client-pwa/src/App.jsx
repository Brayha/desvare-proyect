import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { useEffect } from 'react';
import socketService from './services/socket';
import { AuthProvider } from './contexts/AuthContext';

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

function App() {
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
