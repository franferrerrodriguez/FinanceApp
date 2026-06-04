import { Navigate } from 'react-router-dom';
import { onboardingPathForStep } from '../modules/onboarding/onboardingPaths';
import { useOnboardingState } from '../store/hooks';

export function RequireOnboarding({ children }) {
  const { completed: onboardingCompleted, step } = useOnboardingState();

  if (!onboardingCompleted) {
    const target =
      step > 0 ? onboardingPathForStep(step) : '/onboarding';
    return <Navigate to={target} replace />;
  }

  return children;
}
