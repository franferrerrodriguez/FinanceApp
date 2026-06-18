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
        className={`flex min-h-screen items-center justify-center ${ui.page}`}
        role="status"
        aria-label={t('app.loading')}
        aria-live="polite"
      >
        <svg
          className="h-8 w-8 animate-spin text-[var(--accent)]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-80"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>
    );
  }

  return children;
}
