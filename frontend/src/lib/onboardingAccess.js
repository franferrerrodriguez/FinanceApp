import { calcTotalIncome } from './calculations.js';

const ONBOARDING_STEP_SLUGS = [null, 'income', 'expenses', 'summary'];

function calcHasAnyExpense(settings = {}) {
  return (
    (settings.mortgageRent ?? 0) > 0 ||
    (settings.mortgageRentTotal ?? 0) > 0 ||
    (settings.householdFixedEstimate ?? 0) > 0 ||
    (settings.leisureEstimate ?? 0) > 0 ||
    (settings.groceriesEstimate ?? 0) > 0
  );
}

function onboardingPathForStepIndex(stepIndex) {
  const slug = ONBOARDING_STEP_SLUGS[stepIndex];
  return slug ? `/onboarding/${slug}` : '/onboarding';
}

const MIN_PROFILE_AGE = 18;

/** Step 0 (welcome) complete: valid name and age. */
export function hasCompletedWelcome(profile) {
  const name = profile?.name?.trim();
  const age = Number(profile?.age);
  return Boolean(name) && Number.isFinite(age) && age >= MIN_PROFILE_AGE;
}

/**
 * Furthest step the user can open based on saved data.
 * 0 = bienvenida, 1 = ingresos, 2 = gastos, 3 = resumen.
 */
export function getMaxAccessibleOnboardingStep(settings, profile) {
  if (!hasCompletedWelcome(profile)) return 0;
  return 3;
}

/** Continue-from step based on saved profile/income/expenses — not stored onboardingStep. */
export function deriveOnboardingResumeStep(settings, profile) {
  if (!hasCompletedWelcome(profile)) return 0;
  if (calcHasAnyExpense(settings)) return 3;
  if (calcTotalIncome(settings) > 0) return 2;
  return 1;
}

export function clampOnboardingStep(requestedStep, settings, profile) {
  const max = getMaxAccessibleOnboardingStep(settings, profile);
  const step = Number(requestedStep);
  if (!Number.isFinite(step) || step < 0) return 0;
  return Math.min(step, max);
}

/** Resume step from profile/income/expenses; stored step only advances, never skips profile. */
export function resolveOnboardingResumeStep(storedStep, settings, profile) {
  const derived = deriveOnboardingResumeStep(settings, profile);
  const stored = Number(storedStep);
  if (!Number.isFinite(stored) || stored < 0) return derived;
  const max = getMaxAccessibleOnboardingStep(settings, profile);
  return Math.min(Math.max(derived, stored), max);
}

export function getOnboardingEntryPath(settings, profile, storedStep = 0) {
  const step = resolveOnboardingResumeStep(storedStep, settings, profile);
  return onboardingPathForStepIndex(step);
}
