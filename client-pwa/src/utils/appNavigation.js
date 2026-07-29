/** URL del sitio marketing (desvare.co). Configurable por entorno. */
export const MARKETING_SITE_URL =
  import.meta.env.VITE_MARKETING_SITE_URL || 'https://www.desvare.co';

export const LOCATION_PERMISSION_KEY = 'locationPermission';

export function hasStoredLocationPermission() {
  return localStorage.getItem(LOCATION_PERMISSION_KEY) === 'granted';
}

export function markLocationPermissionGranted() {
  localStorage.setItem(LOCATION_PERMISSION_KEY, 'granted');
}

/** Redirige al sitio marketing fuera de la PWA. */
export function goToMarketingSite() {
  window.location.replace(MARKETING_SITE_URL);
}

/**
 * Reanuda un servicio en curso, si existe.
 * @returns {string|null} Ruta interna o null si no hay servicio activo.
 */
export function resolveActiveServicePath() {
  const activeServiceStatus = localStorage.getItem('activeServiceStatus');
  const hasActiveService = !!localStorage.getItem('activeService');
  const currentRequestId = localStorage.getItem('currentRequestId');

  if (
    activeServiceStatus === 'accepted' ||
    activeServiceStatus === 'in_progress' ||
    hasActiveService
  ) {
    return '/driver-on-way';
  }

  if (
    (activeServiceStatus === 'pending' || activeServiceStatus === 'quoting') &&
    currentRequestId
  ) {
    return '/waiting-quotes';
  }

  return null;
}

/**
 * Decide si el usuario va al mapa o a la pantalla de permiso GPS.
 * Prioriza localStorage (evita repetir la pantalla en Safari/Chrome).
 * @returns {Promise<'/tabs/desvare'|'/location-permission'>}
 */
export async function resolveGeolocationEntryPath() {
  if (hasStoredLocationPermission()) {
    return '/tabs/desvare';
  }

  try {
    if (navigator.permissions?.query) {
      const result = await navigator.permissions.query({ name: 'geolocation' });

      if (result.state === 'granted') {
        markLocationPermissionGranted();
        return '/tabs/desvare';
      }

      // 'prompt' o 'denied': mostrar pantalla explicativa solo si no hay registro previo
      return '/location-permission';
    }
  } catch {
    // Permissions API no disponible o falló — usar caché local
  }

  return hasStoredLocationPermission() ? '/tabs/desvare' : '/location-permission';
}

/**
 * Punto de entrada principal de la PWA (/pedir, /).
 * @returns {Promise<string>} Ruta interna destino.
 */
export async function resolveAppEntryPath() {
  const activePath = resolveActiveServicePath();
  if (activePath) return activePath;

  return resolveGeolocationEntryPath();
}
