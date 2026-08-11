const CACHE_NAME = 'desvare-admin-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/desvare-admin.svg'];

const getNotificationRoute = (data = {}) => {
  const type = data.type || data.eventType;

  if (type === 'NEW_SERVICE_REQUEST') {
    const serviceId = data.serviceId || data.requestId || data.id;
    return serviceId ? `/services/${encodeURIComponent(serviceId)}` : '/services';
  }

  if (type === 'NEW_DRIVER') {
    const driverId = data.driverId || data.id;
    return driverId ? `/drivers/${encodeURIComponent(driverId)}` : '/drivers';
  }

  return '/dashboard';
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(APP_SHELL.map((asset) => cache.add(asset))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        return (await caches.match('/index.html')) || caches.match('/');
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cachedResponse) =>
        cachedResponse ||
        fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            const responseCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
          }
          return networkResponse;
        }),
    ),
  );
});

self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const data = { ...(payload.data || {}), type: payload.data?.type || payload.type };
  const title = payload.notification?.title || payload.title || 'Desvare Admin';
  const options = {
    body:
      payload.notification?.body ||
      payload.body ||
      'Tienes una nueva actualización en el panel.',
    icon: '/icons/desvare-admin.svg',
    badge: '/icons/desvare-admin.svg',
    tag: [data.type || 'desvare-admin', data.requestId || data.driverId]
      .filter(Boolean)
      .join('-'),
    data: {
      ...data,
      route: getNotificationRoute(data),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification.data?.route || getNotificationRoute(event.notification.data);
  const destination = new URL(route, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const appClient = clients.find((client) => client.url.startsWith(self.location.origin));

      if (appClient) {
        await appClient.navigate(destination);
        return appClient.focus();
      }

      return self.clients.openWindow(destination);
    }),
  );
});

