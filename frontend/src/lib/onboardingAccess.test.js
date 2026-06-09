import assert from 'node:assert/strict';
import {
  clampOnboardingStep,
  deriveOnboardingResumeStep,
  getMaxAccessibleOnboardingStep,
  getOnboardingEntryPath,
  hasCompletedWelcome,
  resolveOnboardingResumeStep,
} from './onboardingAccess.js';

assert.equal(hasCompletedWelcome(null), false);
assert.equal(hasCompletedWelcome({ name: 'Ana', age: 30 }), true);

assert.equal(getMaxAccessibleOnboardingStep({}, null), 0);
assert.equal(
  getMaxAccessibleOnboardingStep(
    { monthlyNetSalary: 2000, monthlyNetSalaryEffective: 2000 },
    { name: 'Ana', age: 30 },
  ),
  3,
);

assert.equal(clampOnboardingStep(3, {}, null), 0);
assert.equal(
  clampOnboardingStep(3, { monthlyNetSalaryEffective: 2500 }, { name: 'A', age: 25 }),
  3,
);

assert.equal(deriveOnboardingResumeStep({}, null), 0);
assert.equal(resolveOnboardingResumeStep(2, {}, null), 0);
assert.equal(resolveOnboardingResumeStep(2, { monthlyNetSalaryEffective: 2000 }, { name: 'Ana', age: 30 }), 2);
assert.equal(getOnboardingEntryPath({}, null, 2), '/onboarding');
assert.equal(
  getOnboardingEntryPath(
    { monthlyNetSalary: 2000, monthlyNetSalaryEffective: 2000 },
    { name: 'Ana', age: 30 },
    2,
  ),
  '/onboarding/expenses',
);

console.log('onboardingAccess.test.js: ok');
