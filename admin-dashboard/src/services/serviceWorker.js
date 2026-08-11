const SERVICE_WORKER_URL = '/sw.js';

export const supportsServiceWorkers = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator;

export const registerServiceWorker = async () => {
  if (!supportsServiceWorkers()) {
    return null;
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration('/');
  if (existingRegistration) {
    return existingRegistration;
  }

  return navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' });
};

export const getReadyServiceWorker = async () => {
  const registration = await registerServiceWorker();
  if (!registration) {
    return null;
  }

  return navigator.serviceWorker.ready;
};

