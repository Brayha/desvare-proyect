import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import DesvareLogoWhite from '../assets/img/Desvare-white.svg';
import './Splash.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('hasSeenLocationModal');
  localStorage.removeItem('activeService');
};

const Splash = () => {
  const history = useHistory();

  useEffect(() => {
    // Validación de sesión y animación corren en paralelo para no añadir demora
    const minWait = new Promise((resolve) => setTimeout(resolve, 2500));

    const validate = async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

      if (token && user) {
        let userData;
        try {
          userData = JSON.parse(user);
        } catch {
          clearSession();
          return hasSeenOnboarding ? '/login' : '/onboarding';
        }

        if (userData.userType === 'driver') {
          try {
            // Verificar que el conductor sigue existiendo en el backend
            const response = await fetch(`${API_URL}/api/drivers/profile/${userData._id}`);
            if (response.status === 404 || response.status === 401) {
              // Sesión fantasma: el usuario fue eliminado o el token es inválido
              clearSession();
              return hasSeenOnboarding ? '/login' : '/onboarding';
            }
            // Sesión válida → ir a Home o al servicio activo
            const activeService = localStorage.getItem('activeService');
            return activeService ? '/active-service' : '/home';
          } catch {
            // Error de red (sin conexión): confiar en localStorage y dejar entrar
            const activeService = localStorage.getItem('activeService');
            return activeService ? '/active-service' : '/home';
          }
        } else {
          // No es conductor
          clearSession();
          return '/onboarding';
        }
      } else if (hasSeenOnboarding) {
        return '/login';
      } else {
        return '/onboarding';
      }
    };

    let cancelled = false;
    Promise.all([minWait, validate()]).then(([, destination]) => {
      if (!cancelled) history.replace(destination);
    });

    return () => { cancelled = true; };
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

