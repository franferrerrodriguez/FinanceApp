import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useEffect } from 'react';
import { hydrateAppStorageFromNative } from '../lib/appStorage';
import { isNativeApp } from '../lib/platform';
import { useAppStore } from '../store/appStore';

/**
 * Native shell: storage hydration, status bar, splash, deep links (Supabase auth later).
 */
export function useCapacitorShell() {
  useEffect(() => {
    if (!isNativeApp()) return undefined;

    let cancelled = false;

    document.documentElement.classList.add('native-app');

    (async () => {
      await hydrateAppStorageFromNative();

      const theme = useAppStore.getState().theme ?? 'system';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark =
        theme === 'dark' || (theme !== 'light' && prefersDark);

      try {
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light,
        });
        if (isDark) {
          await StatusBar.setBackgroundColor({ color: '#0f172a' });
        }
      } catch {
        // StatusBar not available on all webviews
      }

      if (!cancelled) {
        await SplashScreen.hide();
      }
    })();

    const urlListener = App.addListener('appUrlOpen', (event) => {
      const path = extractInAppPath(event.url);
      if (path) {
        window.location.href = path;
      }
    });

    return () => {
      cancelled = true;
      void urlListener.then((h) => h.remove());
    };
  }, []);
}

function extractInAppPath(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'financiaapp:') {
      return parsed.pathname + parsed.search + parsed.hash;
    }
    if (parsed.host === 'localhost' || parsed.hostname.includes('localhost')) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {
    return null;
  }
  return null;
}
