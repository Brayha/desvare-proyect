/**
 * Utilidades de Mapbox y Google Maps para el proyecto Desvare
 * 
 * Funciones para:
 * - Calcular rutas entre dos puntos
 * - Buscar direcciones (geocoding con Google Places API)
 * - Obtener dirección desde coordenadas (reverse geocoding)
 * - Formatear distancias y tiempos
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

if (!MAPBOX_TOKEN) {
  console.error('⚠️ VITE_MAPBOX_TOKEN no está configurado en .env');
}

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('⚠️ VITE_GOOGLE_MAPS_API_KEY no está configurado. Las búsquedas usarán solo Mapbox.');
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
 * Busca direcciones usando Google Places Autocomplete API
 * Solo obtiene sugerencias básicas (sin coordenadas completas)
 * @param {string} query - Texto de búsqueda
 * @param {Object} userLocation - Ubicación del usuario {lat, lng}
 * @returns {Promise<Array>} Lista de sugerencias básicas con place_id
 */
export const searchAddressGoogle = async (query, userLocation = null) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️ Google Maps API Key no configurada, usando Mapbox...');
    return searchAddressMapbox(query, userLocation);
  }

  try {
    // Usar Google Places Autocomplete
    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_MAPS_API_KEY,
      language: 'es',
      components: 'country:co', // Solo Colombia
    });

    // Si hay ubicación del usuario, priorizar resultados cercanos
    if (userLocation) {
      params.append('location', `${userLocation.lat},${userLocation.lng}`);
      params.append('radius', '50000'); // 50km de radio
    }

    // Usar el proxy del backend para evitar problemas de CORS
    const proxyUrl = `${API_URL}/api/google-places-proxy`;
    
    console.log('🔍 Buscando en Google Places:', query);
    
    const response = await fetch(`${proxyUrl}?${params}`);
    
    if (!response.ok) {
      console.error('❌ Error HTTP del proxy:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    console.log('📊 Respuesta de Google Places:', {
      status: data.status,
      resultados: data.predictions?.length || 0
    });
    
    if (data.status === 'REQUEST_DENIED') {
      console.error('❌ Google Places API Key inválida o restricciones de dominio:', data.error_message);
      return [];
    }
    
    if (data.status === 'INVALID_REQUEST') {
      console.error('❌ Petición inválida a Google Places:', data.error_message);
      return [];
    }
    
    const predictions = data.predictions || [];

    if (!predictions || predictions.length === 0) {
      console.log('ℹ️ No se encontraron resultados en Google Places');
      return [];
    }
    
    console.log(`✅ ${predictions.length} sugerencias encontradas`);

    // Devolver solo las sugerencias básicas (SIN obtener detalles aún)
    return predictions.slice(0, 8).map((prediction) => ({
      id: prediction.place_id,
      name: prediction.description,
      address: prediction.structured_formatting?.secondary_text || '',
      place_id: prediction.place_id, // Guardar para obtener detalles después
      source: 'google',
      // coordinates: null, // Se obtendrán al hacer clic
    }));
  } catch (error) {
    console.error('Error al buscar con Google Places:', error);
    // Fallback a Mapbox si Google falla
    return searchAddressMapbox(query, userLocation);
  }
};

/**
 * Obtiene los detalles completos de un lugar (coordenadas) usando su place_id
 * Se llama SOLO cuando el usuario hace clic en una sugerencia
 * @param {string} placeId - ID del lugar de Google Places
 * @returns {Promise<Object>} Detalles del lugar con coordenadas
 */
export const getPlaceDetails = async (placeId) => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API Key no configurada');
  }

  try {
    const proxyUrl = `${API_URL}/api/google-places-proxy`;
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
      fields: 'geometry,name,formatted_address',
      language: 'es',
    });

    console.log('📍 Obteniendo detalles del lugar seleccionado...');

    const response = await fetch(`${proxyUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'REQUEST_DENIED') {
      throw new Error('API Key inválida');
    }

    if (data.result && data.result.geometry) {
      console.log('✅ Coordenadas obtenidas');
      return {
        coordinates: [
          data.result.geometry.location.lng,
          data.result.geometry.location.lat
        ],
        name: data.result.formatted_address || data.result.name,
        address: data.result.formatted_address || '',
      };
    }
    
    throw new Error('No se encontraron detalles del lugar');
  } catch (error) {
    console.error('❌ Error obteniendo detalles del lugar:', error);
    throw error;
  }
};

/**
 * Busca direcciones usando Mapbox Geocoding API (fallback)
 * @param {string} query - Texto de búsqueda
 * @param {Object} userLocation - Ubicación del usuario {lat, lng}
 * @returns {Promise<Array>} Lista de resultados con coordenadas
 */
export const searchAddressMapbox = async (query, userLocation = null) => {
  try {
    const params = new URLSearchParams({
      country: 'CO',
      limit: '8',
      language: 'es',
      types: 'poi,address,place',
      access_token: MAPBOX_TOKEN,
    });

    // Si hay ubicación del usuario, priorizar resultados cercanos
    if (userLocation) {
      params.append('proximity', `${userLocation.lng},${userLocation.lat}`);
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features.map(feature => ({
      id: feature.id,
      name: feature.place_name,
      coordinates: feature.center, // [lng, lat]
      address: feature.properties.address || feature.place_name,
      source: 'mapbox',
    }));
  } catch (error) {
    console.error('Error al buscar dirección con Mapbox:', error);
    throw error;
  }
};

/**
 * Busca direcciones usando sistema híbrido (Google Places + Mapbox)
 * Intenta primero con Google (mejor para POIs) y complementa con Mapbox
 * @param {string} query - Texto de búsqueda
 * @param {Object} userLocation - Ubicación del usuario {lat, lng}
 * @returns {Promise<Array>} Lista de sugerencias (sin coordenadas completas)
 */
export const searchAddress = async (query, userLocation = null) => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Intentar primero con Google Places (mejor para POIs y negocios)
    const googleResults = await searchAddressGoogle(query, userLocation);
    
    // Si Google devuelve buenos resultados, usarlos
    if (googleResults.length >= 5) {
      return googleResults;
    }

    // Si Google devuelve pocos resultados, complementar con Mapbox
    const mapboxResults = await searchAddressMapbox(query, userLocation);
    
    // Combinar resultados
    // Google devuelve sugerencias sin coordenadas, Mapbox devuelve con coordenadas
    const allResults = [...googleResults, ...mapboxResults];
    
    // Eliminar duplicados por nombre (no podemos comparar coordenadas de Google)
    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex(r => r.name.toLowerCase() === result.name.toLowerCase())
    );

    return uniqueResults.slice(0, 8);
  } catch (error) {
    console.error('Error en búsqueda híbrida:', error);
    // Si todo falla, intentar solo con Mapbox
    return searchAddressMapbox(query, userLocation);
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

