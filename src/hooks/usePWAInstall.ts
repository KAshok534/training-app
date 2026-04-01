import { useState, useEffect, useCallback } from 'react';
import type { BeforeInstallPromptEvent } from '../types';

interface UsePWAInstall {
  canInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<void>;
}

/**
 * Manages the PWA install prompt.
 *
 * How it works:
 * 1. Browser fires 'beforeinstallprompt' when the app is installable
 * 2. We capture and suppress that event (so the default banner doesn't appear)
 * 3. We expose `canInstall` and `promptInstall` so YOU control the UI
 * 4. When user taps your Install button, call promptInstall()
 * 5. On success, `canInstall` becomes false and `isInstalled` becomes true
 */
export const usePWAInstall = (): UsePWAInstall => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled]       = useState(false);

  useEffect(() => {
    // Check if already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault(); // Stop the default browser mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    promptInstall,
  };
};
