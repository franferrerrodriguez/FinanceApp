import { ONBOARDING_STEP_IDS } from './constants';

/** URL slug by step index (0 = `/onboarding` only). */
const STEP_TO_SLUG = {
  0: null,
  1: 'income',
  2: 'expenses',
  3: 'summary',
};

const SLUG_TO_STEP = Object.fromEntries(
  Object.entries(STEP_TO_SLUG)
    .filter(([, slug]) => slug != null)
    .map(([index, slug]) => [slug, Number(index)]),
);

export function onboardingPathForStep(stepIndex) {
  const slug = STEP_TO_SLUG[stepIndex];
  return slug ? `/onboarding/${slug}` : '/onboarding';
}

/** @returns {number | null} step index, or null if slug is invalid */
export function onboardingStepFromSlug(stepSlug) {
  if (!stepSlug) return 0;
  const step = SLUG_TO_STEP[stepSlug];
  return step !== undefined ? step : null;
}

/** @returns {number | null} step index, or null if slug is invalid */
export function onboardingStepFromPathname(pathname) {
  const base = '/onboarding';
  if (pathname === base || pathname === `${base}/`) return 0;

  const prefix = `${base}/`;
  if (!pathname.startsWith(prefix)) return null;

  const slug = pathname.slice(prefix.length).split('/')[0];
  return onboardingStepFromSlug(slug);
}

export function isValidOnboardingStep(stepIndex) {
  return ONBOARDING_STEP_IDS.includes(stepIndex);
}
