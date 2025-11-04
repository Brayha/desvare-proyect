import { useIonToast } from '@ionic/react';
import { useCallback } from 'react';

/**
 * Hook personalizado para mostrar toasts con configuración predeterminada
 * Toasts aparecen desde abajo (bottom)
 * Usa useCallback para evitar re-renders infinitos
 */
export const useToast = () => {
  const [present] = useIonToast();

  const showSuccess = useCallback((message) => {
    present({
      message,
      duration: 3000,
      color: 'success',
      position: 'bottom', // 🎯 Aparece desde abajo
      cssClass: 'toast-bottom',
    });
  }, [present]);

  const showError = useCallback((message) => {
    present({
      message,
      duration: 4000,
      color: 'danger',
      position: 'bottom', // 🎯 Aparece desde abajo
      cssClass: 'toast-bottom',
    });
  }, [present]);

  const showWarning = useCallback((message) => {
    present({
      message,
      duration: 3000,
      color: 'warning',
      position: 'bottom', // 🎯 Aparece desde abajo
      cssClass: 'toast-bottom',
    });
  }, [present]);

  const showInfo = useCallback((message) => {
    present({
      message,
      duration: 3000,
      color: 'primary',
      position: 'bottom', // 🎯 Aparece desde abajo
      cssClass: 'toast-bottom',
    });
  }, [present]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

