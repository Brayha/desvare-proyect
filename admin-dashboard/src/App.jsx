import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Reports from './pages/Reports';

import './App.css';

setupIonicReact();

// Componente para rutas protegidas
const PrivateRoute = ({ component: Component, ...rest }) => {
  const isAuthenticated = !!localStorage.getItem('adminToken');
  
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login" component={Login} />
          <PrivateRoute exact path="/dashboard" component={Dashboard} />
          <PrivateRoute exact path="/drivers" component={Drivers} />
          <PrivateRoute exact path="/drivers/:id" component={DriverDetail} />
          <PrivateRoute exact path="/clients" component={Clients} />
          <PrivateRoute exact path="/clients/:id" component={ClientDetail} />
          <PrivateRoute exact path="/services" component={Services} />
          <PrivateRoute exact path="/services/:id" component={ServiceDetail} />
          <PrivateRoute exact path="/reports" component={Reports} />
          <Route exact path="/">
            <Redirect to="/dashboard" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}

export default App;

