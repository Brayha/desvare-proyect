/** URLs del ecosistema Desvare */
export const PWA_URL = 'https://desvare.app/pedir';
export const PWA_LOGIN_URL = 'https://desvare.app/login';
export const DRIVER_REGISTER_URL = 'https://driver.desvare.app/register';
export const DRIVER_APP_URL = 'https://driver.desvare.app';
export const PRIVACY_URL = 'https://desvare.app/privacy';
export const TERMS_URL = 'https://desvare.app/terms';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.desvare.driver';

/** Construye URL de cotización con UTM */
export function cotizarUrl(campaign) {
  const params = new URLSearchParams({
    utm_source: 'desvare_co',
    utm_medium: campaign,
    utm_campaign: 'grua-bogota',
  });
  return `${PWA_URL}?${params.toString()}`;
}

/** Globos de precio en el hero — posiciones vía CSS (--n) */
export const heroQuotes = [
  { id: 1, price: '$ 80.000', delay: '0s', blur: false },
  { id: 2, price: '$ 90.000', delay: '1.8s', blur: true },
  { id: 3, price: '$ 150.000', delay: '3.6s', blur: true },
  { id: 4, price: '$ 120.000', delay: '5.4s', blur: false },
  { id: 5, price: '$ 90.000', delay: '7.2s', blur: false },
  { id: 6, price: '$ 90.000', delay: '9s', blur: false },
  { id: 7, price: '$ 100.000', delay: '10.8s', blur: false },
];

export const steps = [
  {
    number: '01',
    title: 'Indica origen y destino',
    desc: 'Marca en el mapa dónde estás y a dónde quieres llevar tu vehículo.',
    highlight: false,
  },
  {
    number: '02',
    title: 'Recibe cotizaciones',
    desc: 'Conductores cercanos te envían precios en tiempo real.',
    highlight: true,
  },
  {
    number: '03',
    title: 'Elige y sigue tu grúa',
    desc: 'Acepta la mejor oferta y sigue al conductor en el mapa hasta el destino.',
    highlight: true,
    cta: true,
  },
];

export const features = [
  {
    title: 'Precios transparentes',
    desc: 'Ves el precio antes de aceptar. Sin sorpresas ni cobros ocultos.',
    icon: 'dollar',
  },
  {
    title: 'Respuesta en minutos',
    desc: 'Conductores cercanos reciben tu solicitud al instante.',
    icon: 'timer',
  },
  {
    title: 'Conductores verificados',
    desc: 'Verificación de identidad, licencia y estado del vehículo.',
    icon: 'shield',
  },
  {
    title: 'Seguimiento en vivo',
    desc: 'Sigue en el mapa exactamente dónde está tu grúa.',
    icon: 'routing',
  },
];

export const driverBenefits = [
  'Recibe solicitudes cerca de ti',
  'Tú decides cuándo y cuánto cobrar',
  'Pagos directos sin intermediarios',
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
