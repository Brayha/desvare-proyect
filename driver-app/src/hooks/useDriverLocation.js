import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para manejar la geolocalización del conductor en tiempo real
 * - Solicita permisos de ubicación
 * - Actualiza la ubicación cada X segundos
 * - Proporciona la ubicación actual
 */
export const useDriverLocation = (updateInterval = 10000) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Obtener ubicación inmediatamente
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        setLocation(newLocation);
        setLoading(false);
        console.log('📍 Ubicación del conductor obtenida:', newLocation);
      },
      (err) => {
        console.error('Error al obtener ubicación:', err);
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Iniciar seguimiento continuo de ubicación
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      setLoading(false);
      return;
    }

    console.log('🚗 Iniciando seguimiento de ubicación del conductor...');

    // watchPosition actualiza automáticamente cuando la ubicación cambia
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        setLocation(newLocation);
        setLoading(false);
        console.log('📍 Ubicación del conductor actualizada:', newLocation);
      },
      (err) => {
        console.error('Error al obtener ubicación:', err);
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true, // Usar GPS si está disponible
        timeout: 10000,
        maximumAge: updateInterval, // Actualizar según intervalo configurado
      }
    );

    setWatchId(id);

    // Limpiar al desmontar
    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id);
        console.log('🛑 Seguimiento de ubicación detenido');
      }
    };
  }, [updateInterval]);

  return {
    location,
    loading,
    error,
    requestLocation,
  };
};

