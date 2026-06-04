import assert from 'node:assert/strict';
import { buildMonthlyProjectionTable } from './projectionTable.js';
import { resolveMonthlySalaryForDate } from './salaryHistory.js';

const settings = {
  monthlyNetSalary: 3000,
  salaryPaysPreset: '12',
  monthlyNetSalaryEffective: 3000,
  otherMonthlyIncome: 0,
  mortgageRent: 0,
  leisureEstimate: 0,
  projectionYears: 1,
  annualSalaryIncrease: 0,
  projectionAnnualExpenseIncrease: 0,
};

const history = [
  {
    id: '1',
    effectiveFrom: '2026-01',
    monthlyNetSalary: 2500,
    salaryPaysPreset: '12',
    numPagas: 12,
    monthlyNetSalaryEffective: 2500,
  },
  {
    id: '2',
    effectiveFrom: '2026-06',
    monthlyNetSalary: 2800,
    salaryPaysPreset: '12',
    numPagas: 12,
    monthlyNetSalaryEffective: 2800,
  },
];

assert.equal(
  resolveMonthlySalaryForDate(settings, history, new Date(2026, 2, 1)),
  2500,
);
assert.equal(
  resolveMonthlySalaryForDate(settings, history, new Date(2026, 6, 1)),
  2800,
);

const rows = buildMonthlyProjectionTable({
  settings,
  salaryHistory: history,
  startDate: new Date(2026, 0, 1),
  years: 1,
});

assert.equal(rows[0].salary, 2500);
assert.equal(rows[5].salary, 2800);

assert.equal(
  resolveMonthlySalaryForDate(settings, [], new Date(2026, 2, 1)),
  3000,
);

console.log('salaryHistory.test.js: ok');
