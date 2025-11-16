import React from 'react';
import { IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { Route, Redirect } from 'react-router-dom';
import { mapOutline, personOutline } from 'ionicons/icons';
import RequestService from '../../pages/RequestService';
import MyAccount from '../../pages/MyAccount';
import './TabLayout.css';

const TabLayout = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tabs/desvare" component={RequestService} />
        <Route exact path="/tabs/my-account" component={MyAccount} />
        <Route exact path="/tabs">
          <Redirect to="/tabs/desvare" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" className="custom-tab-bar">
        <IonTabButton tab="desvare" href="/tabs/desvare">
          <IonIcon icon={mapOutline} />
          <IonLabel>Desvare</IonLabel>
        </IonTabButton>

        <IonTabButton tab="my-account" href="/tabs/my-account">
          <IonIcon icon={personOutline} />
          <IonLabel>Mi cuenta</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default TabLayout;

