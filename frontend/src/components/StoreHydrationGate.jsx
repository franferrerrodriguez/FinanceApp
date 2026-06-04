import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ui } from '../lib/uiClasses';
import { useAppStore } from '../store/appStore';

/**
 * Bloquea el árbol hasta que el estado persistido esté en Zustand.
 * Evita redirecciones incorrectas (p. ej. mandar al onboarding antes de leer localStorage).
 */
export function StoreHydrationGate({ children }) {
  const { t } = useTranslation();
  const [hydrated, setHydrated] = useState(() =>
    useAppStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsubFinish = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    setHydrated(useAppStore.persist.hasHydrated());

    return unsubFinish;
  }, []);

  if (!hydrated) {
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
