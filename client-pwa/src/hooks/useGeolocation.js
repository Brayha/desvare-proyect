import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar geolocalización del navegador
 * 
 * Proporciona:
 * - Ubicación actual del usuario
 * - Estados de carga y error
 * - Función para solicitar ubicación
 * - Función para observar cambios de ubicación (watch)
 * 
 * @returns {Object} { location, loading, error, requestLocation, watchLocation, clearWatch }
 */
const useGeolocation = () => {
  const [location, setLocation] = useState(null); // { latitude, longitude, accuracy }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  /**
   * Solicita la ubicación actual del usuario (una sola vez)
   */
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Error al obtener ubicación';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado. Por favor habilita el acceso a tu ubicación.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible en este momento.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado al obtener ubicación.';
            break;
          default:
            errorMessage = 'Error desconocido al obtener ubicación.';
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true, // Usar GPS si está disponible
        timeout: 10000, // 10 segundos máximo
        maximumAge: 0, // No usar caché
      }
    );
  };

  /**
   * Observa cambios en la ubicación del usuario (útil para conductores)
   */
  const watchLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    if (watchId) {
      console.warn('Ya hay un watchLocation activo');
      return;
    }

    setLoading(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError('Error al observar ubicación');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
  };

  /**
   * Detiene la observación de ubicación
   */
  const clearWatch = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Limpiar watch al desmontar el componente
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    location,
    loading,
    error,
    requestLocation,
    watchLocation,
    clearWatch,
  };
};

export { useGeolocation };
export default useGeolocation;

