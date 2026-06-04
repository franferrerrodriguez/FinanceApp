import { ONBOARDING_STEP_IDS } from '../../modules/onboarding/constants';

const MAX_ONBOARDING_STEP = ONBOARDING_STEP_IDS.length - 1;

/** Onboarding flow (current step + completed flag). */
export const createOnboardingSlice = (set) => ({
  onboardingCompleted: false,
  onboardingStep: 0,

  setOnboardingStep: (onboardingStep) =>
    set({
      onboardingStep: Math.min(
        Math.max(0, onboardingStep),
        MAX_ONBOARDING_STEP,
      ),
    }),

  completeOnboarding: () =>
    set({
      onboardingCompleted: true,
      onboardingStep: 0,
      sessionStatus: 'guest_with_data',
    }),
});
