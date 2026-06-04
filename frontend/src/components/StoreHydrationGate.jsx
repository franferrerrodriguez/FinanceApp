import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isAuthAvailable } from '../lib/auth';
import { ui } from '../lib/uiClasses';
import { useAppStore } from '../store/appStore';

/**
 * Blocks the tree until persisted state is in Zustand.
 * Avoids wrong redirects (e.g. sending to onboarding before reading localStorage).
 */
export function StoreHydrationGate({ children }) {
  const { t } = useTranslation();
  const [hydrated, setHydrated] = useState(() =>
    useAppStore.persist.hasHydrated(),
  );
  const authBootstrapped = useAppStore((s) => s.authBootstrapped);
  const needsAuthBootstrap = isAuthAvailable() && !authBootstrapped;

  useEffect(() => {
    const unsubFinish = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    setHydrated(useAppStore.persist.hasHydrated());

    const fallback = window.setTimeout(() => {
      setHydrated(true);
    }, 2000);

    return () => {
      window.clearTimeout(fallback);
      unsubFinish();
    };
  }, []);

  if (!hydrated || needsAuthBootstrap) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${ui.page} ${ui.text}`}
        role="status"
        aria-live="polite"
      >
        {t('app.loading')}
      </div>
    );
  }

  return children;
}
