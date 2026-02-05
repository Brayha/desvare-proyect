import { IonHeader, IonToolbar, IonAvatar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import CustomToggle from './CustomToggle';
import './ServiceHeader.css';

const ServiceHeader = ({ user, isOnline, onToggleAvailability }) => {
  const history = useHistory();

  return (
    <IonHeader className="service-header">
      <IonToolbar className="service-toolbar">
        {/* Logo Isotipo */}
        <div className="logo-container" slot="start">
          <img 
            src="/isotipo.svg" 
            alt="Desvare" 
            className="isotipo"
          />
        </div>

        {/* Toggle Ocupado / Activo */}
        <div className="toggle-container">
          <CustomToggle 
            isActive={isOnline}
            onToggle={onToggleAvailability}
          />
        </div>

        {/* Avatar del conductor */}
        <div className="avatar-container" slot="end" onClick={() => history.push('/profile')}>
          <IonAvatar>
            <img 
              src={user?.driverProfile?.documents?.selfie || 'https://ionicframework.com/docs/img/demos/avatar.svg'} 
              alt={user?.name}
            />
          </IonAvatar>
        </div>
      </IonToolbar>
    </IonHeader>
  );
};

export default ServiceHeader;

