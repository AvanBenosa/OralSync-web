import { useCallback, useEffect, useMemo, useState } from 'react';

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

const DISMISS_KEY = 'oralsync-pwa-install-dismissed';

const hasWindow = (): boolean => typeof window !== 'undefined';

const isStandaloneMode = (): boolean => {
  if (!hasWindow()) {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true
  );
};

const isIosSafariBrowser = (): boolean => {
  if (!hasWindow()) {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isWebkitSafari = /safari/.test(userAgent) && !/crios|fxios|edgios|chrome|android/.test(userAgent);

  return isIos && isWebkitSafari;
};

export const usePwaInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isStandaloneMode());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (!hasWindow()) {
      return false;
    }

    return window.sessionStorage.getItem(DISMISS_KEY) === 'true';
  });

  useEffect(() => {
    if (!hasWindow()) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = (): void => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsDismissed(false);
      window.sessionStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const dismissBanner = useCallback((): void => {
    if (hasWindow()) {
      window.sessionStorage.setItem(DISMISS_KEY, 'true');
    }

    setIsDismissed(true);
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) {
      return 'unavailable';
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      if (hasWindow()) {
        window.sessionStorage.removeItem(DISMISS_KEY);
      }
      setIsDismissed(false);
      return 'accepted';
    }

    dismissBanner();
    return 'dismissed';
  }, [deferredPrompt, dismissBanner]);

  const isManualIosInstall = useMemo(
    () => !isInstalled && !deferredPrompt && isIosSafariBrowser(),
    [deferredPrompt, isInstalled]
  );

  const canPromptInstall = Boolean(deferredPrompt) && !isInstalled;
  const shouldShowBanner = !isInstalled && !isDismissed && (canPromptInstall || isManualIosInstall);

  return {
    canPromptInstall,
    isInstalled,
    isManualIosInstall,
    shouldShowBanner,
    dismissBanner,
    promptInstall,
  };
};

export default usePwaInstall;
