import assert from 'node:assert/strict';
import { buildMonthlyProjectionTable } from './projectionTable.js';
import {
  buildEffectiveMonthOptions,
  createCashflowEntryFromSettings,
  getCashflowTotalsForDate,
  mergeBudgetSettingsFields,
  resolveMonthlySalaryForDate,
  resolveSettingsForDate,
  syncSettingsFromCashflowHistory,
  upsertCurrentMonthCashflowTramo,
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
assert.equal(totals.investment, 0);
assert.equal(totals.savings, 2800 - 500 - 200 - 100 - 400);

const withInvestment = getCashflowTotalsForDate(
  { ...settings, monthlyBudgetInvestment: 150 },
  history,
  new Date(2026, 6, 1),
);
assert.equal(withInvestment.investment, 150);
assert.equal(withInvestment.savings, 2800 - 500 - 200 - 100 - 400 - 150);

assert.deepEqual(
  mergeBudgetSettingsFields(
    { monthlyBudgetInvestment: 500 },
    { monthlyBudgetInvestment: 0 },
  ),
  { monthlyBudgetInvestment: 500 },
);

const tramo = upsertCurrentMonthCashflowTramo(
  { ...settings, monthlyBudgetInvestment: 500 },
  [],
);
assert.equal(tramo[0].expenses.monthlyBudgetInvestment, 500);

const synced = syncSettingsFromCashflowHistory(
  { monthlyNetSalary: 3000, mortgageRentTotal: 800, monthlyBudgetInvestment: 500 },
  [
    {
      id: 't1',
      effectiveFrom: '2026-06',
      monthlyNetSalary: 0,
      expenses: { mortgageRentTotal: 0, monthlyBudgetInvestment: 0 },
    },
  ],
);
assert.equal(synced.monthlyNetSalary, 3000);
assert.equal(synced.mortgageRentTotal, 0);

console.log('cashflowHistory.test.js: ok');
