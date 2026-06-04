import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hydrateAppStorageFromNative } from '../lib/appStorage';
import { isNativeApp } from '../lib/platform';
import { ui } from '../lib/uiClasses';

/**
 * On Android/iOS, load Preferences into localStorage before Zustand rehydrates.
 */
export function NativeStorageBootstrap({ children }) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(() => !isNativeApp());

  useEffect(() => {
    if (!isNativeApp()) return undefined;
    let cancelled = false;
    hydrateAppStorageFromNative().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${ui.page} ${ui.text}`}
        role="status"
      >
        {t('app.loading')}
      </div>
    );
  }

  return children;
}
