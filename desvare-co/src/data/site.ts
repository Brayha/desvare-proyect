/** URLs del ecosistema Desvare */
export const PWA_URL = 'https://desvare.app/pedir';
export const PWA_LOGIN_URL = 'https://desvare.app/login';
export const DRIVER_REGISTER_URL = 'https://driver.desvare.app/register';
export const DRIVER_APP_URL = 'https://driver.desvare.app';
export const PRIVACY_URL = 'https://desvare.app/privacy';
export const TERMS_URL = 'https://desvare.app/terms';

export const CITY = 'Bogotá';
export const REGION = 'Cundinamarca';

/** Construye URL de cotización con UTM para Google Ads / analytics */
export function cotizarUrl(campaign: string): string {
  const params = new URLSearchParams({
    utm_source: 'desvare_co',
    utm_medium: campaign,
    utm_campaign: 'grua-bogota',
  });
  return `${PWA_URL}?${params.toString()}`;
}

export const stats = [
  { value: '100+', label: 'Conductores activos' },
  { value: '4.8 ★', label: 'Calificación promedio' },
  { value: '< 5 min', label: 'Primera cotización' },
];

export const steps = [
  {
    number: '01',
    title: 'Indica origen y destino',
    desc: 'Marca en el mapa dónde estás y a dónde quieres llevar tu vehículo.',
  },
  {
    number: '02',
    title: 'Recibe cotizaciones',
    desc: 'Conductores cercanos en Bogotá te envían precios en tiempo real.',
  },
  {
    number: '03',
    title: 'Elige y sigue tu grúa',
    desc: 'Acepta la mejor oferta y sigue al conductor en el mapa hasta el destino.',
  },
];

export const features = [
  {
    title: 'Precios transparentes',
    desc: 'Ves el precio antes de aceptar. Sin sorpresas ni cobros ocultos.',
    icon: 'tag',
  },
  {
    title: 'Respuesta en minutos',
    desc: 'Conductores cercanos reciben tu solicitud al instante.',
    icon: 'bolt',
  },
  {
    title: 'Conductores verificados',
    desc: 'Verificación de identidad, licencia y estado del vehículo.',
    icon: 'shield',
  },
  {
    title: 'Seguimiento en vivo',
    desc: 'Sigue en el mapa exactamente dónde está tu grúa.',
    icon: 'map',
  },
];

export const driverBenefits = [
  'App 100% gratuita para conductores',
  'Recibe solicitudes cerca de ti en Bogotá',
  'Tú decides cuándo y cuánto cobrar',
  'Pagos directos sin intermediarios',
  'Construye tu reputación con calificaciones',
  'Soporte dedicado',
];

export const faqs = [
  {
    q: '¿Cuánto demora en llegar la grúa en Bogotá?',
    a: 'Depende de la disponibilidad de conductores en tu zona. En promedio recibirás la primera cotización en menos de 5 minutos después de solicitar el servicio.',
  },
  {
    q: '¿Cómo se calculan los precios?',
    a: 'Cada conductor establece su precio según distancia, tipo de vehículo y condiciones del servicio. Tú comparas todas las cotizaciones y eliges la que más te conviene.',
  },
  {
    q: '¿Puedo cancelar una solicitud?',
    a: 'Sí, puedes cancelar mientras estés esperando cotizaciones, antes de aceptar una oferta. Una vez aceptada, coordina directamente con el conductor.',
  },
  {
    q: '¿Los conductores están verificados?',
    a: 'Sí. Antes de operar en Desvare, cada conductor pasa verificación de identidad, licencia y estado del vehículo.',
  },
  {
    q: '¿En qué zonas operan?',
    a: 'Actualmente operamos en Bogotá y Cundinamarca, expandiéndonos a más ciudades de Colombia.',
  },
];

/** Globos de precio en el mapa — solo valor, posiciones vía CSS (.price-bubble--N) */
export const mapQuotes = [
  { id: 1, price: '$85.000', delay: '0s' },
  { id: 2, price: '$98.000', delay: '2s' },
  { id: 3, price: '$112.000', delay: '4s' },
  { id: 4, price: '$92.000', delay: '6s' },
  { id: 5, price: '$105.000', delay: '8s' },
  { id: 6, price: '$78.000', delay: '10s' },
];
