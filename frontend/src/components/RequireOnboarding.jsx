import { Navigate } from 'react-router-dom';
import { getOnboardingEntryPath } from '../lib/onboardingAccess';
import { useOnboardingState, useProfile, useSettings } from '../store/hooks';

export function RequireOnboarding({ children }) {
  const { completed: onboardingCompleted, step } = useOnboardingState();
  const { settings } = useSettings();
  const { profile } = useProfile();

  if (!onboardingCompleted) {
    return (
      <Navigate
        to={getOnboardingEntryPath(settings, profile, step)}
        replace
      />
    );
  }

  return children;
}
