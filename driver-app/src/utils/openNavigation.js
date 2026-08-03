/**
 * Abre navegación externa (Google Maps / Waze / Apple Maps)
 * Compatible con Capacitor Android y con los 2 formatos de ubicación
 * que usa Desvare: GeoJSON { coordinates: [lng, lat] } y { lat, lng }.
 */
import { Capacitor } from "@capacitor/core";
import { AppLauncher } from "@capacitor/app-launcher";

/**
 * Extrae { lat, lng } desde cualquiera de los formatos usados en el proyecto.
 * @param {object|null|undefined} location
 * @returns {{ lat: number, lng: number } | null}
 */
export function extractLatLng(location) {
  if (!location || typeof location !== "object") return null;

  // GeoJSON Point: coordinates = [lng, lat]
  if (
    Array.isArray(location.coordinates) &&
    location.coordinates.length >= 2
  ) {
    const lng = Number(location.coordinates[0]);
    const lat = Number(location.coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  // Formato plano usado en socket service:accepted / requestData
  if (location.lat != null && location.lng != null) {
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  // A veces llega anidado: { coordinates: { lat, lng } }
  if (
    location.coordinates &&
    typeof location.coordinates === "object" &&
    !Array.isArray(location.coordinates)
  ) {
    const lat = Number(location.coordinates.lat);
    const lng = Number(location.coordinates.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Abre una URL fuera del WebView (app nativa o navegador del sistema).
 * @param {string} url
 */
export async function openExternalUrl(url) {
  if (!url) return;

  if (Capacitor.isNativePlatform()) {
    try {
      await AppLauncher.openUrl({ url });
      return;
    } catch (err) {
      console.warn("AppLauncher.openUrl falló, usando fallback:", err);
    }
  }

  // Web / fallback
  window.open(url, "_blank");
}

/**
 * Construye URLs de navegación a partir de lat/lng.
 * @param {number} lat
 * @param {number} lng
 */
export function buildNavigationUrls(lat, lng) {
  return {
    // Intent de navegación turn-by-turn (Android / Google Maps)
    googleNavigation: `google.navigation:q=${lat},${lng}&mode=d`,
    // Universal URL (funciona en Android/iOS/web)
    googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    appleMaps: `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
  };
}

/**
 * Abre Google Maps directamente con la ruta al destino.
 * Intenta primero el scheme nativo; si falla, usa la URL https.
 * @param {{ lat: number, lng: number }} coords
 */
export async function openGoogleMapsNavigation(coords) {
  const { lat, lng } = coords;
  const urls = buildNavigationUrls(lat, lng);

  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
    try {
      await AppLauncher.openUrl({ url: urls.googleNavigation });
      return;
    } catch (err) {
      console.warn("google.navigation falló, usando URL https:", err);
    }
  }

  await openExternalUrl(urls.googleMaps);
}
