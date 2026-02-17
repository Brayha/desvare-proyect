import { useIonToast } from '@ionic/react';

/**
 * Hook personalizado para mostrar toasts de manera más sencilla
 * 
 * @returns {Object} { showSuccess, showError, showWarning, showInfo }
 */
const useToast = () => {
  const [present] = useIonToast();

  const showSuccess = (message, duration = 2000) => {
    present({
      message,
      duration,
      color: 'success',
      position: 'top',
    });
  };

  const showError = (message, duration = 3000) => {
    present({
      message,
      duration,
      color: 'danger',
      position: 'top',
    });
  };

  const showWarning = (message, duration = 2500) => {
    present({
      message,
      duration,
      color: 'warning',
      position: 'top',
    });
  };

  const showInfo = (message, duration = 2000) => {
    present({
      message,
      duration,
      color: 'primary',
      position: 'top',
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export { useToast };
export default useToast;

