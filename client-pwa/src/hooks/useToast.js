import { useIonToast } from '@ionic/react';

/**
 * Hook personalizado para mostrar toasts con configuración predeterminada
 * Toasts aparecen desde abajo (bottom)
 */
export const useToast = () => {
  const [present] = useIonToast();

  const showSuccess = (message) => {
    present({
      message,
      duration: 3000,
      color: 'success',
      position: 'bottom', // 🎯 Aparece desde abajo
      cssClass: 'toast-bottom',
    });
  };

  const showError = (message) => {
    present({
      message,
      duration: 4000,
      color: 'danger',
      position: 'bottom', // 🎯 Aparece desde abajo
      cssClass: 'toast-bottom',
    });
  };

  const showWarning = (message) => {
    present({
      message,
      duration: 3000,
      color: 'warning',
      position: 'bottom', // 🎯 Aparece desde abajo
      cssClass: 'toast-bottom',
    });
  };

  const showInfo = (message) => {
    present({
      message,
      duration: 3000,
      color: 'primary',
      position: 'bottom', // 🎯 Aparece desde abajo
      cssClass: 'toast-bottom',
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

