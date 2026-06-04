import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clampOnboardingStep } from '../../../lib/onboardingAccess';
import { useAppStore } from '../../../store/appStore';
import { PERSIST_STORAGE_KEY } from '../../../store/persistConfig';
import { useProfile, useSettings } from '../../../store/hooks';
import { onboardingPathForStep } from '../onboardingPaths';

/**
 * Alinea la URL del onboarding con los datos disponibles.
 * Si no hay datos y la URL apunta a un paso avanzado, vuelve al paso 1 (bienvenida).
 */
export function useOnboardingRouteGuard(stepFromUrl) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { profile } = useProfile();
  const hadPersistRef = useRef(false);

  useEffect(() => {
    if (stepFromUrl === null) return;

    const allowed = clampOnboardingStep(stepFromUrl, settings, profile);
    if (allowed !== stepFromUrl) {
      navigate(onboardingPathForStep(allowed), { replace: true });
    }
  }, [stepFromUrl, settings, profile, navigate]);

  useEffect(() => {
    const syncAfterPersistCleared = () => {
      if (!useAppStore.persist.hasHydrated()) return;

      const raw = localStorage.getItem(PERSIST_STORAGE_KEY);
      if (raw) {
        hadPersistRef.current = true;
        return;
      }

      if (!hadPersistRef.current) return;

      hadPersistRef.current = false;
      useAppStore.getState().resetApp();
      navigate('/onboarding', { replace: true });
    };

    const raw = localStorage.getItem(PERSIST_STORAGE_KEY);
    if (raw) hadPersistRef.current = true;

    const onStorage = (e) => {
      if (e.key === PERSIST_STORAGE_KEY && !e.newValue) {
        syncAfterPersistCleared();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', syncAfterPersistCleared);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', syncAfterPersistCleared);
    };
  }, [navigate]);
}
