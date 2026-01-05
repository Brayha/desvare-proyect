import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

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

import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import LoginOTP from './pages/LoginOTP';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import CompleteRegistration from './pages/CompleteRegistration';
import UnderReview from './pages/UnderReview';
import Rejected from './pages/Rejected';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ActiveService from './pages/ActiveService';

setupIonicReact();

function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/splash" component={Splash} />
          <Route exact path="/onboarding" component={Onboarding} />
          <Route exact path="/login" component={LoginOTP} />
          <Route exact path="/register" component={Register} />
          <Route exact path="/verify-otp" component={VerifyOTP} />
          <Route exact path="/complete-registration" component={CompleteRegistration} />
          <Route exact path="/under-review" component={UnderReview} />
          <Route exact path="/rejected" component={Rejected} />
          <Route exact path="/home" component={Home} />
          <Route exact path="/profile" component={Profile} />
          <Route exact path="/active-service" component={ActiveService} />
          <Route exact path="/">
            <Redirect to="/splash" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}

export default App;