type ServiceWorkerRegisterOptions = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

const isProduction = process.env.NODE_ENV === 'production';

const buildServiceWorkerUrl = (): string => {
  const publicUrl = process.env.PUBLIC_URL || '';
  return `${publicUrl}/service-worker.js`.replace(/([^:]\/)\/+/g, '$1');
};

const registerValidServiceWorker = (
  serviceWorkerUrl: string,
  options?: ServiceWorkerRegisterOptions
): void => {
  navigator.serviceWorker
    .register(serviceWorkerUrl)
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
      console.error('Service worker registration failed:', error);
    });
};

export const registerServiceWorker = (options?: ServiceWorkerRegisterOptions): void => {
  if (!isProduction || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    registerValidServiceWorker(buildServiceWorkerUrl(), options);
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

