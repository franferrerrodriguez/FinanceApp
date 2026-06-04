import { calcTotalIncome } from './calculations.js';

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
  if (calcTotalIncome(settings) <= 0) return 1;
  return 3;
}

export function clampOnboardingStep(requestedStep, settings, profile) {
  const max = getMaxAccessibleOnboardingStep(settings, profile);
  const step = Number(requestedStep);
  if (!Number.isFinite(step) || step < 0) return 0;
  return Math.min(step, max);
}
