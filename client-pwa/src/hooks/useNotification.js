import { useState, useCallback, useRef } from 'react';

/**
 * Hook personalizado para manejar notificaciones
 * Incluye sonido, vibración y notificaciones visuales
 */
export const useNotification = () => {
  const [activeNotifications, setActiveNotifications] = useState([]);
  const audioRef = useRef(null);

  // Inicializar Audio (solo una vez)
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification-sound.mp3');
      audioRef.current.volume = 0.7;
    }
    return audioRef.current;
  }, []);

  /**
   * Reproduce sonido de notificación
   */
  const playSound = useCallback(() => {
    try {
      const audio = getAudio();
      // Reiniciar si ya está sonando
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.warn('⚠️ No se pudo reproducir sonido:', error.message);
      });
    } catch (error) {
      console.warn('⚠️ Error al reproducir sonido:', error);
    }
  }, [getAudio]);

  /**
   * Activa vibración del dispositivo
   * Patrón: vibrar 200ms, pausa 100ms, vibrar 200ms
   */
  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (error) {
        console.warn('⚠️ Error al vibrar:', error);
      }
    }
  }, []);

  /**
   * Muestra una notificación completa (sonido + vibración + visual)
   * @param {Object} quote - Datos de la cotización
   * @param {Object} options - Opciones de notificación
   */
  const showQuoteNotification = useCallback((quote, options = {}) => {
    const {
      playSound: shouldPlaySound = true,
      vibrate: shouldVibrate = true,
      duration = 5000
    } = options;

    // Reproducir sonido
    if (shouldPlaySound) {
      playSound();
    }

    // Vibrar
    if (shouldVibrate) {
      vibrate();
    }

    // Agregar notificación visual
    const notification = {
      id: `quote-${Date.now()}-${Math.random()}`,
      quote,
      duration
    };

    setActiveNotifications(prev => [...prev, notification]);

    // Log para debugging
    console.log('🔔 Notificación mostrada:', {
      driverName: quote.driverName,
      amount: quote.amount,
      hasSound: shouldPlaySound,
      hasVibration: shouldVibrate
    });

    return notification.id;
  }, [playSound, vibrate]);

  /**
   * Cierra una notificación específica
   */
  const closeNotification = useCallback((id) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * Cierra todas las notificaciones
   */
  const closeAllNotifications = useCallback(() => {
    setActiveNotifications([]);
  }, []);

  /**
   * Solicitar permisos de notificación del navegador
   * (Para uso futuro con Web Notifications API)
   */
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('⚠️ Este navegador no soporta notificaciones');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }, []);

  return {
    // Estado
    activeNotifications,
    
    // Funciones
    showQuoteNotification,
    closeNotification,
    closeAllNotifications,
    playSound,
    vibrate,
    requestPermission
  };
};

export default useNotification;
