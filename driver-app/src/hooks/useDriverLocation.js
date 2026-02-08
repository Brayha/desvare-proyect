import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';

/**
 * Hook para manejar la geolocalización del conductor en tiempo real
 * - Solicita permisos de ubicación
 * - Actualiza la ubicación cada X segundos
 * - Proporciona la ubicación actual
 * - 🆕 Se pausa automáticamente cuando el conductor está OCUPADO (ahorro de batería)
 * - 🆕 Usa Capacitor Geolocation plugin para mejor manejo de permisos nativos
 */
export const useDriverLocation = (isOnline = true, updateInterval = 10000) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  const requestLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Solicitar permisos primero
      const permissions = await Geolocation.checkPermissions();
      console.log('📍 Permisos de ubicación:', permissions.location);

      if (permissions.location === 'denied') {
        setError('Permisos de ubicación denegados. Por favor actívalos en configuración.');
        setLoading(false);
        return;
      }

      if (permissions.location === 'prompt' || permissions.location === 'prompt-with-rationale') {
        console.log('📍 Solicitando permisos de ubicación...');
        const request = await Geolocation.requestPermissions();
        if (request.location === 'denied') {
          setError('Permisos de ubicación denegados. Por favor actívalos en configuración.');
          setLoading(false);
          return;
        }
      }

      // Obtener ubicación actual
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };
      setLocation(newLocation);
      setLoading(false);
      console.log('📍 Ubicación del conductor obtenida:', newLocation);
    } catch (err) {
      console.error('❌ Error al obtener ubicación:', err);
      setError(err.message || 'Error al obtener ubicación');
      setLoading(false);
    }
  }, []);

  // Iniciar seguimiento continuo de ubicación
  useEffect(() => {
    let id = null;

    const startWatching = async () => {
      // 🆕 Solo activar GPS si el conductor está DISPONIBLE (isOnline === true)
      if (!isOnline) {
        console.log('🔴 GPS pausado - Conductor OCUPADO (ahorro de batería)');
        setLoading(false);
        setLocation(null);
        return;
      }

      try {
        // Verificar permisos primero
        const permissions = await Geolocation.checkPermissions();
        console.log('📍 Verificando permisos para watchPosition:', permissions.location);

        if (permissions.location === 'denied') {
          setError('Permisos de ubicación denegados. Por favor actívalos en configuración.');
          setLoading(false);
          return;
        }

        if (permissions.location === 'prompt' || permissions.location === 'prompt-with-rationale') {
          const request = await Geolocation.requestPermissions();
          if (request.location === 'denied') {
            setError('Permisos de ubicación denegados. Por favor actívalos en configuración.');
            setLoading(false);
            return;
          }
        }

        console.log('🚗 Iniciando seguimiento de ubicación del conductor...');

        // watchPosition con Capacitor
        id = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: updateInterval,
          },
          (position, err) => {
            if (err) {
              console.error('❌ Error al obtener ubicación:', err);
              setError(err.message);
              setLoading(false);
              return;
            }

            if (position) {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: Date.now(),
              };
              setLocation(newLocation);
              setLoading(false);
              console.log('📍 Ubicación del conductor actualizada:', newLocation);
            }
          }
        );

        setWatchId(id);
      } catch (err) {
        console.error('❌ Error iniciando watchPosition:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    startWatching();

    // Limpiar al desmontar
    return () => {
      if (id) {
        Geolocation.clearWatch({ id });
        console.log('🛑 Seguimiento de ubicación detenido');
      }
    };
  }, [isOnline, updateInterval]);

  return {
    location,
    loading,
    error,
    requestLocation,
  };
};

