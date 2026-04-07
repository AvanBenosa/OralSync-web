const CACHE_VERSION = 'v2';
const APP_SHELL_CACHE = `oralsync-app-shell-${CACHE_VERSION}`;
const STATIC_ASSET_CACHE = `oralsync-static-assets-${CACHE_VERSION}`;

const getBasePath = () => {
  const scopeUrl = new URL(self.registration.scope);
  return scopeUrl.pathname.replace(/\/$/, '');
};

const toAppUrl = (path = '/') => {
  const basePath = getBasePath();

  if (path === '/') {
    return basePath ? `${basePath}/` : '/';
  }

  return `${basePath}${path.startsWith('/') ? path : `/${path}`}` || '/';
};

const getIndexUrl = () => toAppUrl('/index.html');
const getOfflineUrl = () => toAppUrl('/offline.html');

const getAppShellAssets = () => [
  toAppUrl('/'),
  getIndexUrl(),
  getOfflineUrl(),
  toAppUrl('/manifest.json'),
  toAppUrl('/favicon.ico'),
  toAppUrl('/logo192.png'),
  toAppUrl('/logo512.png'),
  toAppUrl('/OralSync.png'),
];

const isSameOrigin = (url) => url.origin === self.location.origin;

const getScopedPathname = (pathname) => {
  const basePath = getBasePath();

  if (!basePath || !pathname.startsWith(basePath)) {
    return pathname;
  }

  const scopedPath = pathname.slice(basePath.length);
  return scopedPath || '/';
};

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
  const indexUrl = getIndexUrl();
  const offlineUrl = getOfflineUrl();

  try {
    const response = await fetch(request);
    await putInCache(APP_SHELL_CACHE, indexUrl, response.clone());
    return response;
  } catch (error) {
    const cache = await caches.open(APP_SHELL_CACHE);
    const cachedIndex = await cache.match(indexUrl);

    if (cachedIndex) {
      return cachedIndex;
    }

    const offlineResponse = await cache.match(offlineUrl);
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
      .then((cache) => cache.addAll(getAppShellAssets()))
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
  const pathname = getScopedPathname(url.pathname);

  if (!isSameOrigin(url) || isApiOrProtectedRequest(pathname)) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }

  if (isStaticAssetRequest(pathname)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
