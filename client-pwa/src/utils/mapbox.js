/**
 * Utilidades de Mapbox para el proyecto Desvare
 * 
 * Funciones para:
 * - Calcular rutas entre dos puntos
 * - Buscar direcciones (geocoding)
 * - Obtener dirección desde coordenadas (reverse geocoding)
 * - Formatear distancias y tiempos
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  console.error('⚠️ VITE_MAPBOX_TOKEN no está configurado en .env');
}

/**
 * Calcula una ruta entre dos puntos usando Mapbox Directions API
 * @param {Array} origin - [lng, lat] del punto de origen
 * @param {Array} destination - [lng, lat] del punto de destino
 * @returns {Promise<Object>} Información de la ruta (distancia, duración, geometría)
 */
export const getRoute = async (origin, destination) => {
  try {
    const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distance: route.distance, // en metros
        duration: route.duration, // en segundos
        geometry: route.geometry, // GeoJSON de la ruta
      };
    }
    
    throw new Error('No se encontró una ruta');
  } catch (error) {
    console.error('Error al calcular ruta:', error);
    throw error;
  }
};

/**
 * Busca direcciones usando Mapbox Geocoding API
 * @param {string} query - Texto de búsqueda (dirección o lugar)
 * @returns {Promise<Array>} Lista de resultados con coordenadas
 */
export const searchAddress = async (query) => {
  try {
    // Limitar búsqueda a Colombia
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=CO&access_token=${MAPBOX_TOKEN}&limit=5`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features.map(feature => ({
      id: feature.id,
      name: feature.place_name,
      coordinates: feature.center, // [lng, lat]
      address: feature.properties.address || '',
    }));
  } catch (error) {
    console.error('Error al buscar dirección:', error);
    throw error;
  }
};

/**
 * Obtiene la dirección desde coordenadas (reverse geocoding)
 * @param {number} longitude - Longitud
 * @param {number} latitude - Latitud
 * @returns {Promise<string>} Dirección formateada
 */
export const getAddressFromCoordinates = async (longitude, latitude) => {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    
    return 'Dirección desconocida';
  } catch (error) {
    console.error('Error al obtener dirección:', error);
    return 'Error al obtener dirección';
  }
};

/**
 * Formatea distancia en metros a texto legible
 * @param {number} meters - Distancia en metros
 * @returns {string} Distancia formateada (ej: "5.2 km" o "850 m")
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Formatea duración en segundos a texto legible
 * @param {number} seconds - Duración en segundos
 * @returns {string} Duración formateada (ej: "15 min" o "1h 30min")
 */
export const formatDuration = (seconds) => {
  const minutes = Math.round(seconds / 60);
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Calcula los límites (bounds) para una lista de coordenadas
 * Útil para ajustar el zoom del mapa
 * @param {Array} coordinates - Array de [lng, lat]
 * @returns {Array} [[minLng, minLat], [maxLng, maxLat]]
 */
export const calculateBounds = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }
  
  let minLng = coordinates[0][0];
  let maxLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];
  
  coordinates.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
  
  // Agregar padding (5%)
  const lngPadding = (maxLng - minLng) * 0.05;
  const latPadding = (maxLat - minLat) * 0.05;
  
  return [
    [minLng - lngPadding, minLat - latPadding],
    [maxLng + lngPadding, maxLat + latPadding]
  ];
};

