import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  clampOnboardingStep,
  deriveOnboardingResumeStep,
} from '../../lib/onboardingAccess';
import { useOnboardingState, useProfile, useSettings } from '../../store/hooks';
import { StepHeader } from './components/StepHeader';
import { useOnboardingRouteGuard } from './hooks/useOnboardingRouteGuard';
import {
  onboardingPathForStep,
  onboardingStepFromSlug,
} from './onboardingPaths';
import { FixedExpensesStep } from './steps/FixedExpensesStep';
import { IncomeStep } from './steps/IncomeStep';
import { SummaryStep } from './steps/SummaryStep';
import { WelcomeStep } from './steps/WelcomeStep';

function scrollOnboardingToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

export function OnboardingStepper() {
  const navigate = useNavigate();
  const { stepSlug } = useParams();
  const { step, setStep, complete } = useOnboardingState();
  const { settings } = useSettings();
  const { profile } = useProfile();

  const stepFromUrl = onboardingStepFromSlug(stepSlug);
  const allowedStep =
    stepFromUrl === null
      ? 0
      : clampOnboardingStep(stepFromUrl, settings, profile);

  useOnboardingRouteGuard(stepFromUrl);

  useEffect(() => {
    if (stepFromUrl === null) return;
    if (allowedStep !== stepFromUrl) return;
    if (step !== allowedStep) {
      setStep(allowedStep);
    }
  }, [stepFromUrl, allowedStep, step, setStep]);

  useEffect(() => {
    if (stepFromUrl === null) return;
    scrollOnboardingToTop();
  }, [stepSlug, stepFromUrl]);

  useEffect(() => {
    if (stepSlug) return;
    const resumeStep = deriveOnboardingResumeStep(settings, profile);
    if (resumeStep > 0) {
      navigate(onboardingPathForStep(resumeStep), { replace: true });
    }
  }, [stepSlug, settings, profile, navigate]);

  if (stepFromUrl === null) {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedStep !== stepFromUrl) {
    return <Navigate to={onboardingPathForStep(allowedStep)} replace />;
  }

  const goForward = (next) => {
    navigate(onboardingPathForStep(next));
  };

  const goBack = () => {
    navigate(-1);
  };

  const handleFinish = () => {
    complete();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="mx-auto max-w-lg">
      <StepHeader stepIndex={allowedStep} />
      {allowedStep === 0 && <WelcomeStep onNext={() => goForward(1)} />}
      {allowedStep === 1 && (
        <IncomeStep onBack={goBack} onNext={() => goForward(2)} />
      )}
      {allowedStep === 2 && (
        <FixedExpensesStep onBack={goBack} onNext={() => goForward(3)} />
      )}
      {allowedStep === 3 && (
        <SummaryStep onBack={goBack} onFinish={handleFinish} />
      )}
    </div>
  );
}
