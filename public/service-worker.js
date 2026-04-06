const APP_SHELL_CACHE = 'oralsync-app-shell-v1';
const STATIC_ASSET_CACHE = 'oralsync-static-assets-v1';
const OFFLINE_URL = '/offline.html';
const INDEX_URL = '/index.html';
const APP_SHELL_ASSETS = [
  '/',
  INDEX_URL,
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/OralSync.png',
];

const isSameOrigin = (url) => url.origin === self.location.origin;

const isApiOrProtectedRequest = (pathname) =>
  pathname.startsWith('/api/') ||
  pathname.startsWith('/storage/') ||
  pathname.startsWith('/sockjs-node') ||
  pathname.startsWith('/signalr');

const isStaticAssetRequest = (pathname) =>
  pathname.startsWith('/static/') ||
  pathname === '/manifest.json' ||
  pathname === '/favicon.ico' ||
  pathname === '/logo192.png' ||
  pathname === '/logo512.png' ||
  pathname === '/OralSync.png';

const putInCache = async (cacheName, request, response) => {
  if (!response || response.status !== 200 || response.type === 'opaque') {
    return response;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(STATIC_ASSET_CACHE);
  const cachedResponse = await cache.match(request);

  const networkResponsePromise = fetch(request)
    .then((response) => putInCache(STATIC_ASSET_CACHE, request, response))
    .catch(() => cachedResponse);

  return cachedResponse || networkResponsePromise;
};

const networkFirstNavigation = async (request) => {
  try {
    const response = await fetch(request);
    await putInCache(APP_SHELL_CACHE, INDEX_URL, response.clone());
    return response;
  } catch (error) {
    const cache = await caches.open(APP_SHELL_CACHE);
    const cachedIndex = await cache.match(INDEX_URL);

    if (cachedIndex) {
      return cachedIndex;
    }

    const offlineResponse = await cache.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }

    throw error;
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== APP_SHELL_CACHE && cacheName !== STATIC_ASSET_CACHE) {
              return caches.delete(cacheName);
            }

            return Promise.resolve(true);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  if (!isSameOrigin(url) || isApiOrProtectedRequest(url.pathname)) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }

  if (isStaticAssetRequest(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
