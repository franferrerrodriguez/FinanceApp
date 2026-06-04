import assert from 'node:assert/strict';
import {
  clampOnboardingStep,
  getMaxAccessibleOnboardingStep,
  hasCompletedWelcome,
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

console.log('onboardingAccess.test.js: ok');
