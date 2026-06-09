import assert from 'node:assert/strict';
import { annualToMonthlyRate } from './calculations.js';
import { createContributionEntry } from './contributionEntries.js';
import { getCashflowTotalsForDate } from './cashflowHistory.js';
import {
  buildMonthlyProjectionTable,
  summarizeMonthlyProjection,
} from './projectionTable.js';
import { getProjectionAnnualRate } from './projectionRates.js';

assert.equal(getProjectionAnnualRate({ useRealReturn: true, indexFundRealReturn: 0.04 }), 0.04);

const rMes = annualToMonthlyRate(0.04);
assert.ok(Math.abs(rMes - 0.003273739) < 0.000001);

const baseSettings = {
  monthlyNetSalary: 2530,
  otherMonthlyIncome: 0,
  mortgageRent: 318.5,
  mortgageRentTotal: 318.5,
  mortgageRentShared: false,
  householdFixedEstimate: 0,
  leisureEstimate: 200,
  leisureShared: false,
  initialPatrimony: 0,
  indexFundRealReturn: 0.04,
  savingsAccountReturn: 0.025,
  useRealReturn: true,
  annualSalaryIncrease: 0,
  projectionAnnualExpenseIncrease: 0,
  projectionYears: 2,
};

const rows = buildMonthlyProjectionTable({
  settings: baseSettings,
  contributionPlans: [],
  initialPatrimony: 0,
  startDate: new Date(2026, 5, 1),
  years: 2,
});

assert.equal(rows[0].netContribution, 2011.5);
assert.equal(rows[0].patrimonioInicio, 0);
assert.equal(rows[0].monthlyReturn, 0);
assert.equal(rows[0].patrimonyEnd, 2011.5);

const liquidRate = annualToMonthlyRate(0.025);
assert.equal(rows[1].patrimonioInicio, 2011.5);
assert.equal(rows[1].netContribution, 2011.5);
const expectedM2 = 2011.5 + 2011.5 + 2011.5 * liquidRate;
assert.ok(Math.abs(rows[1].patrimonyEnd - expectedM2) < 0.02);

const summary = summarizeMonthlyProjection(rows, 0);
assert.equal(summary.finalPatrimony, rows[rows.length - 1].patrimonyEnd);
assert.ok(summary.isCoherent);
assert.equal(
  summary.finalPatrimony,
  summary.initialPatrimony + summary.totalContributions + summary.totalInterest,
);

const withInvest = buildMonthlyProjectionTable({
  settings: baseSettings,
  contributionPlans: [
    {
      id: '1',
      providerId: 'indexa',
      category: 'investment',
      monthlyAmount: 500,
      isActive: true,
      growthMode: 'fixed',
      rampPerMonth: 0,
      annualIncrease: 0,
      customAnnualReturn: null,
    },
  ],
  initialPatrimony: 0,
  startDate: new Date(2026, 0, 1),
  years: 1,
});
assert.equal(withInvest[0].additionalInvestments, 500);
assert.equal(withInvest[0].netContribution, 1511.5);
assert.equal(withInvest[0].patrimonyEnd, 2011.5);

const withBudget = buildMonthlyProjectionTable({
  settings: { ...baseSettings, monthlyBudgetInvestment: 500 },
  contributionPlans: [],
  initialPatrimony: 0,
  startDate: new Date(2026, 0, 1),
  years: 1,
});
assert.equal(withBudget[0].additionalInvestments, 500);
assert.equal(withBudget[0].netContribution, 1511.5);

const withSalaryGrowth = buildMonthlyProjectionTable({
  settings: { ...baseSettings, annualSalaryIncrease: 0.015 },
  contributionPlans: [],
  initialPatrimony: 0,
  startDate: new Date(2026, 0, 1),
  years: 2,
});
assert.equal(withSalaryGrowth[0].salary, 2530);
assert.equal(
  Math.round(withSalaryGrowth[12].salary * 100) / 100,
  Math.round(2530 * 1.015 * 100) / 100,
);

const coherentSettings = {
  monthlyNetSalary: 2530,
  salaryPaysPreset: '12',
  numPagas: 12,
  mortgageRentTotal: 358.5,
  householdFixedEstimate: 400,
  groceriesEstimate: 400,
  leisureEstimate: 300,
  monthlyBudgetInvestment: 500,
  annualSalaryIncrease: 0.015,
  projectionAnnualExpenseIncrease: 0,
  projectionYears: 20,
};

const budgetTotals = getCashflowTotalsForDate(coherentSettings, [], new Date(2026, 5, 1));
assert.equal(budgetTotals.savings, 571.5);
assert.equal(budgetTotals.investment, 500);
assert.equal(budgetTotals.grossSavings, 1071.5);

const coherentRows = buildMonthlyProjectionTable({
  settings: coherentSettings,
  contributionPlans: [],
  contributionEntries: [],
  startDate: new Date(2026, 5, 1),
  years: 20,
});
assert.equal(coherentRows[0].netContribution, 571.5);
assert.equal(coherentRows[0].additionalInvestments, 500);
assert.equal(
  coherentRows[0].netContribution + coherentRows[0].additionalInvestments,
  budgetTotals.grossSavings,
);
assert.ok(Math.abs(coherentRows[228].salary - 2530 * Math.pow(1.015, 19)) < 1);

const fourteenPays = buildMonthlyProjectionTable({
  settings: {
    ...baseSettings,
    salaryPaysPreset: '14',
    monthlyNetSalaryEffective: (2530 * 14) / 12,
  },
  contributionPlans: [],
  initialPatrimony: 0,
  startDate: new Date(2026, 5, 1),
  years: 1,
});
const effectiveSalary = (2530 * 14) / 12;
assert.equal(
  fourteenPays[0].netContribution,
  Math.round((effectiveSalary - 318.5 - 200) * 100) / 100,
);

const withAnnual = buildMonthlyProjectionTable({
  settings: baseSettings,
  annualExpenses: [{ id: '1', name: 'IBI', amount: 600, month: 6 }],
  contributionPlans: [],
  initialPatrimony: 0,
  startDate: new Date(2026, 5, 1),
  years: 1,
});
assert.equal(withAnnual[0].punctualExpenses, 600);
assert.equal(withAnnual[0].netContribution, 2011.5 - 600);

const withEntries = buildMonthlyProjectionTable({
  settings: baseSettings,
  contributionEntries: [
    createContributionEntry({
      id: 'e1',
      assetId: 'idx',
      date: '2026-06-10',
      amount: 500,
    }),
  ],
  assets: [
    {
      id: 'idx',
      category: 'investment',
      name: 'Indexa',
      isActive: true,
    },
  ],
  initialPatrimony: 0,
  startDate: new Date(2026, 5, 1),
  years: 1,
});
assert.equal(withEntries[0].additionalInvestments, 500);

console.log('projectionTable.test.js: ok');
