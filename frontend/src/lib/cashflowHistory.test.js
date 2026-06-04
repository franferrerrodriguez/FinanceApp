import assert from 'node:assert/strict';
import { buildMonthlyProjectionTable } from './projectionTable.js';
import {
  buildEffectiveMonthOptions,
  createCashflowEntryFromSettings,
  getCashflowTotalsForDate,
  resolveMonthlySalaryForDate,
  resolveSettingsForDate,
} from './cashflowHistory.js';

const settings = {
  monthlyNetSalary: 3000,
  salaryPaysPreset: '12',
  otherMonthlyIncome: 0,
  mortgageRentTotal: 500,
  householdFixedEstimate: 200,
  groceriesEstimate: 100,
  leisureEstimate: 400,
  projectionYears: 1,
  projectionAnnualExpenseIncrease: 0,
};

const monthOpts = buildEffectiveMonthOptions(['2019-03', '2026-01'], 12);
assert.ok(monthOpts.includes('2026-01'));
assert.ok(monthOpts.includes('2019-03'));
assert.ok(monthOpts[0] >= monthOpts[1]);

const history = [
  createCashflowEntryFromSettings(
    {
      ...settings,
      monthlyNetSalary: 2500,
      leisureEstimate: 300,
    },
    '2026-01',
  ),
  createCashflowEntryFromSettings(
    {
      ...settings,
      monthlyNetSalary: 2800,
      leisureEstimate: 400,
    },
    '2026-06',
  ),
];

assert.equal(
  resolveMonthlySalaryForDate(settings, history, new Date(2026, 2, 1)),
  2500,
);
assert.equal(
  resolveMonthlySalaryForDate(settings, history, new Date(2026, 6, 1)),
  2800,
);

const march = resolveSettingsForDate(settings, history, new Date(2026, 2, 1));
assert.equal(march.leisureEstimate, 300);

const rows = buildMonthlyProjectionTable({
  settings,
  cashflowHistory: history,
  startDate: new Date(2026, 0, 1),
  years: 1,
});

assert.equal(rows[0].salary, 2500);
assert.equal(rows[5].salary, 2800);
assert.equal(rows[0].variableExpenses, 300);
assert.equal(rows[5].variableExpenses, 400);

const totals = getCashflowTotalsForDate(settings, history, new Date(2026, 6, 1));
assert.equal(totals.income, 2800);
assert.equal(totals.leisure, 400);

console.log('cashflowHistory.test.js: ok');
