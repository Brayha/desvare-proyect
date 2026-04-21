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
            // Verificar que el conductor sigue existiendo en el backend y obtener su status actual
            const response = await fetch(`${API_URL}/api/drivers/profile/${userData._id}`);
            if (response.status === 404 || response.status === 401) {
              // Sesión fantasma: el usuario fue eliminado o el token es inválido
              clearSession();
              return hasSeenOnboarding ? '/login' : '/onboarding';
            }
            const data = await response.json();
            const status = data.driver?.status || userData.driverProfile?.status;

            // Enrutar según el estado actual del conductor (igual que navigateAfterAuth)
            if (status === 'pending_documents') return '/complete-registration';
            if (status === 'pending_review') return '/under-review';
            if (status === 'rejected') return '/rejected';
            if (status === 'approved') {
              // Si hay un servicio activo en curso, volver a él directamente
              const activeService = localStorage.getItem('activeService');
              if (activeService) return '/active-service';
              // Si ya configuró permisos, ir a Home; si no, mostrar pantalla de permisos
              const permissionsConfigured = localStorage.getItem('permissionsConfigured');
              return permissionsConfigured ? '/home' : '/permissions';
            }
            // Status desconocido: ir a permisos (conductor nuevo aprobado sin flujo completo)
            return '/permissions';
          } catch {
            // Error de red (sin conexión): usar status del localStorage para no bloquear al conductor
            const status = userData.driverProfile?.status;
            if (status === 'pending_documents') return '/complete-registration';
            if (status === 'pending_review') return '/under-review';
            if (status === 'rejected') return '/rejected';
            const activeService = localStorage.getItem('activeService');
            if (activeService) return '/active-service';
            return '/home';
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

