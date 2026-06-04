import { Navigate } from 'react-router-dom';
import { useOnboardingState } from '../../store/hooks';
import { OnboardingStepper } from './OnboardingStepper';

export function OnboardingGate() {
  const { completed: onboardingCompleted } = useOnboardingState();

  if (onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <OnboardingStepper />;
}
