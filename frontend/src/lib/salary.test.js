import assert from 'node:assert/strict';
import {
  computeMonthlyNetSalaryEffective,
  enrichSettingsWithSalary,
  getEffectiveMonthlySalary,
} from './salary.js';

assert.equal(
  computeMonthlyNetSalaryEffective({
    monthlyNetSalary: 3000,
    salaryPaysPreset: '12',
  }),
  3000,
);

assert.equal(
  computeMonthlyNetSalaryEffective({
    monthlyNetSalary: 3000,
    salaryPaysPreset: '14',
  }),
  3500,
);

assert.equal(
  computeMonthlyNetSalaryEffective({
    monthlyNetSalary: 3000,
    salaryPaysPreset: 'other',
    numPagas: 16,
  }),
  4000,
);

const enriched = enrichSettingsWithSalary(
  { monthlyNetSalary: 2530, salaryPaysPreset: '14' },
  {},
);
assert.equal(enriched.monthlyNetSalaryEffective, 2951.67);
assert.equal(getEffectiveMonthlySalary(enriched), 2951.67);

console.log('salary.test.js: ok');
