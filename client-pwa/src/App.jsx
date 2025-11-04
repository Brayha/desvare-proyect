import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { useEffect } from 'react';
import socketService from './services/socket';

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
import RequestService from './pages/RequestService';
import RequestAuth from './pages/RequestAuth';
import RequestConfirmation from './pages/RequestConfirmation';
import WaitingQuotes from './pages/WaitingQuotes';

setupIonicReact();

// Componente para redirección inteligente basada en autenticación
const InitialRedirect = () => {
  const userData = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  // Si el usuario está autenticado, llevarlo al home
  if (userData && token) {
    return <Redirect to="/home" />;
  }
  
  // Si no está autenticado, llevarlo a pedir permisos de ubicación
  return <Redirect to="/location-permission" />;
};

function App() {
  // Conectar Socket.IO una sola vez al iniciar la app
  useEffect(() => {
    console.log('🚀 Inicializando Socket.IO...');
    socketService.connect();
    
    // Cleanup al desmontar la app
    return () => {
      console.log('👋 Cerrando Socket.IO...');
      socketService.disconnect();
    };
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login" component={Login} />
          <Route exact path="/register" component={Register} />
          <Route exact path="/home" component={Home} />
          <Route exact path="/location-permission" component={LocationPermission} />
          <Route exact path="/request-service" component={RequestService} />
          <Route exact path="/request-auth" component={RequestAuth} />
          <Route exact path="/request-confirmation" component={RequestConfirmation} />
          <Route exact path="/waiting-quotes" component={WaitingQuotes} />
          <Route exact path="/" component={InitialRedirect} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}

export default App;
