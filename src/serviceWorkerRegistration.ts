type ServiceWorkerRegisterOptions = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

const isProduction = process.env.NODE_ENV === 'production';

const normalizeUrl = (value: string): string => value.replace(/([^:]\/)\/+/g, '$1');

const buildServiceWorkerUrls = (): string[] => {
  const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');
  const urls = [normalizeUrl(`${publicUrl}/service-worker.js`)];

  if (publicUrl) {
    urls.push('/service-worker.js');
  }

  return urls.filter((url, index) => urls.indexOf(url) === index);
};

const registerValidServiceWorker = (
  serviceWorkerUrls: string[],
  options?: ServiceWorkerRegisterOptions,
  attemptIndex = 0
): void => {
  const serviceWorkerUrl = serviceWorkerUrls[attemptIndex];

  if (!serviceWorkerUrl) {
    return;
  }

  const serviceWorkerScope = (() => {
    try {
      const resolvedUrl = new URL(serviceWorkerUrl, window.location.origin);
      return resolvedUrl.pathname.replace(/\/service-worker\.js$/, '/') || '/';
    } catch {
      return '/';
    }
  })();

  navigator.serviceWorker
    .register(serviceWorkerUrl, { scope: serviceWorkerScope })
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;

        if (!installingWorker) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state !== 'installed') {
            return;
          }

          if (navigator.serviceWorker.controller) {
            console.info('A new OralSync version is available. Refresh to update.');
            options?.onUpdate?.(registration);
            return;
          }

          console.info('OralSync is ready for app-style launch and offline shell access.');
          options?.onSuccess?.(registration);
        };
      };
    })
    .catch((error) => {
      if (attemptIndex + 1 < serviceWorkerUrls.length) {
        registerValidServiceWorker(serviceWorkerUrls, options, attemptIndex + 1);
        return;
      }

      console.error('Service worker registration failed:', error);
    });
};

export const registerServiceWorker = (options?: ServiceWorkerRegisterOptions): void => {
  if (!isProduction || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    registerValidServiceWorker(buildServiceWorkerUrls(), options);
  });
};

export const unregisterServiceWorker = (): void => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      void registration.unregister();
    })
    .catch(() => {
      // Ignore unregister failures because the app can continue safely.
    });
};
