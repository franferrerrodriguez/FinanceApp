import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clampOnboardingStep } from '../../lib/onboardingAccess';
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
  const resumeChecked = useRef(false);

  const stepFromUrl = onboardingStepFromSlug(stepSlug);
  const allowedStep =
    stepFromUrl === null
      ? 0
      : clampOnboardingStep(stepFromUrl, settings, profile);

  useOnboardingRouteGuard(stepFromUrl);

  useEffect(() => {
    if (stepFromUrl === null) {
      navigate('/onboarding', { replace: true });
      return;
    }
    if (allowedStep !== stepFromUrl) {
      return;
    }
    if (step !== allowedStep) {
      setStep(allowedStep);
    }
  }, [stepFromUrl, allowedStep, step, setStep, navigate]);

  useEffect(() => {
    if (stepFromUrl !== null) {
      scrollOnboardingToTop();
    }
  }, [stepSlug, stepFromUrl]);

  useEffect(() => {
    if (resumeChecked.current) return;
    resumeChecked.current = true;

    if (!stepSlug && step > 0) {
      const resumeStep = clampOnboardingStep(step, settings, profile);
      navigate(onboardingPathForStep(resumeStep), { replace: true });
    }
  }, [stepSlug, step, settings, profile, navigate]);

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

  const activeStep = allowedStep;

  if (stepFromUrl === null) {
    return null;
  }

  if (allowedStep !== stepFromUrl) {
    return null;
  }

  return (
    <div className="mx-auto max-w-lg">
      <StepHeader stepIndex={activeStep} />
      {activeStep === 0 && <WelcomeStep onNext={() => goForward(1)} />}
      {activeStep === 1 && (
        <IncomeStep onBack={goBack} onNext={() => goForward(2)} />
      )}
      {activeStep === 2 && (
        <FixedExpensesStep onBack={goBack} onNext={() => goForward(3)} />
      )}
      {activeStep === 3 && (
        <SummaryStep onBack={goBack} onFinish={handleFinish} />
      )}
    </div>
  );
}
