import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import DesvareLogoWhite from '../../../shared/src/img/Desvare-white.svg';
import './Splash.css';

const Splash = () => {
  const history = useHistory();

  useEffect(() => {
    // Verificar si el usuario ya vio el onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    // Timer para la animación del splash
    const timer = setTimeout(() => {
      if (token && user) {
        // Usuario ya autenticado, ir a Home
        const userData = JSON.parse(user);
        if (userData.userType === 'driver') {
          history.replace('/home');
        } else {
          // No es conductor, limpiar y ir a login
          localStorage.clear();
          history.replace('/onboarding');
        }
      } else if (hasSeenOnboarding) {
        // Ya vio el onboarding, ir directo a login
        history.replace('/login');
      } else {
        // Primera vez, mostrar onboarding
        history.replace('/onboarding');
      }
    }, 2500); // 2.5 segundos de splash

    return () => clearTimeout(timer);
  }, [history]);

  return (
    <IonPage>
      <IonContent className="splash-content">
        <div className="splash-container">
          {/* Logo con animación */}
          <div className="splash-logo-container">
            <div className="splash-logo">
              <img 
                src={DesvareLogoWhite} 
                alt="Desvare Logo" 
                className="logo-img"
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;

