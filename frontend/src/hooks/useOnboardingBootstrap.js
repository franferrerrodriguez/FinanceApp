import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  clampOnboardingStep,
  deriveOnboardingResumeStep,
  hasCompletedWelcome,
} from '../lib/onboardingAccess';
import {
  onboardingPathForStep,
  onboardingStepFromPathname,
} from '../modules/onboarding/onboardingPaths';
import { useAppStore } from '../store/appStore';

/** After hydrate: align stored step and URL with profile/income progress. */
export function useOnboardingBootstrap() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [hydrated, setHydrated] = useState(() =>
    useAppStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (hydrated) return;
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAppStore.persist.hasHydrated());
    return unsub;
  }, [hydrated]);

  const profile = useAppStore((s) => s.profile);
  const settings = useAppStore((s) => s.settings);
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);
  const onboardingStep = useAppStore((s) => s.onboardingStep);

  useEffect(() => {
    if (!hydrated || onboardingCompleted) return;

    const derived = deriveOnboardingResumeStep(settings, profile);
    if (onboardingStep !== derived) {
      useAppStore.setState({ onboardingStep: derived });
    }

    if (!pathname.startsWith('/onboarding')) return;

    const urlStep = onboardingStepFromPathname(pathname);
    if (urlStep === null) return;

    const allowedFromUrl = clampOnboardingStep(urlStep, settings, profile);
    if (allowedFromUrl !== urlStep) {
      navigate(onboardingPathForStep(allowedFromUrl), { replace: true });
      return;
    }

    if (!hasCompletedWelcome(profile) && urlStep > 0) {
      navigate('/onboarding', { replace: true });
    }
  }, [
    pathname,
    navigate,
    hydrated,
    profile,
    settings,
    onboardingCompleted,
    onboardingStep,
  ]);
}
