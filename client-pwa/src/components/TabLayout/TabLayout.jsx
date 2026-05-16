import React from 'react';
import { IonTabs, IonRouterOutlet } from '@ionic/react';
import { Route, Redirect } from 'react-router-dom';
import RequestService from '../../pages/RequestService';
import MyAccount from '../../pages/MyAccount';

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
    </IonTabs>
  );
};

export default TabLayout;

