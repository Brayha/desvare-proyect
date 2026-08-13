import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import DesvareLogoWhite from '../assets/img/Desvare-white.svg';
import { authAPI } from '../services/api';
import './Splash.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.desvare.app';

// clearSession NO elimina activeService: si el token expiró pero el conductor
// tiene un servicio en curso, queremos que vea el estado al reconectarse.
const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('hasSeenLocationModal');
};

const prepareOnboardingResume = (user, profile, requiresProfileSetup) => {
  const id = profile?._id || profile?.userId || user?._id;
  const phone = profile?.phone || user?.phone;
  if (id) localStorage.setItem('tempDriverId', id);
  if (phone) localStorage.setItem('tempDriverPhone', phone);
  localStorage.setItem(
    'otpPurpose',
    requiresProfileSetup ? 'PROFILE_SETUP' : 'PIN_SETUP',
  );
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
            let data;
            try {
              const response = await authAPI.getMyProfile();
              data = response.data;
            } catch (profileError) {
              if (profileError.response?.status !== 404) throw profileError;
              // Compatibilidad temporal con backends que aún no tienen profile/me.
              const response = await fetch(`${API_URL}/api/drivers/profile/${userData._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (response.status === 401) {
                clearSession();
                return hasSeenOnboarding ? '/login' : '/onboarding';
              }
              if (!response.ok) throw new Error(`Legacy profile: ${response.status}`);
              data = await response.json();
            }
            const profile = data.driver || data.profile || data;
            const requiresPinSetup = data.requiresPinSetup ?? profile.requiresPinSetup;
            const requiresProfileSetup =
              data.requiresProfileSetup ?? profile.requiresProfileSetup;
            if (requiresProfileSetup || requiresPinSetup) {
              prepareOnboardingResume(userData, profile, requiresProfileSetup);
              return '/verify-otp';
            }

            const newStatus = profile.status || profile.driverProfile?.status;
            const prevStatus = userData.driverProfile?.status;

            // Sincronizar el status en localStorage para que la próxima apertura sea correcta
            if (newStatus && newStatus !== prevStatus) {
              const updatedUser = { ...userData };
              if (updatedUser.driverProfile) updatedUser.driverProfile.status = newStatus;
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            // Si el conductor acaba de ser aprobado (transición a approved),
            // limpiar permissionsConfigured para forzar siempre el flujo de permisos
            if (prevStatus !== 'approved' && newStatus === 'approved') {
              localStorage.removeItem('permissionsConfigured');
            }

            // Enrutar según el estado actual del conductor (igual que navigateAfterAuth)
            if (newStatus === 'pending_documents') return '/complete-registration';
            if (newStatus === 'pending_review') return '/under-review';
            if (newStatus === 'rejected') return '/rejected';
            if (newStatus === 'approved') {
              // Si hay un servicio activo en curso, volver a él directamente
              const activeService = localStorage.getItem('activeService');
              if (activeService) return '/active-service';
              // Si ya pasó por los permisos (flag seteado en PermissionsSetup), ir a Home
              const permissionsConfigured = localStorage.getItem('permissionsConfigured');
              return permissionsConfigured ? '/home' : '/permissions';
            }
            // Status desconocido: ir a permisos
            return '/permissions';
          } catch (error) {
            if (error.response?.status === 401) {
              clearSession();
              return hasSeenOnboarding ? '/login' : '/onboarding';
            }
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

