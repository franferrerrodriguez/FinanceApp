import assert from 'node:assert/strict';
import {
  computeFinancialDiagnosis,
  estimateFireYearsFromProjection,
  EXCESS_LIQUIDITY_MIN_EUR,
  INVESTMENT_RATE_BENCHMARK,
} from './financialDiagnosis.js';

const baseSettings = {
  monthlyNetSalary: 3000,
  monthlyNetSalaryEffective: 3000,
  monthlyBudgetInvestment: 600,
  emergencyFundMonths: 6,
  projectionYears: 25,
  useRealReturn: true,
  indexFundRealReturn: 0.04,
  groceriesEstimate: 400,
  leisureEstimate: 200,
  householdFixedEstimate: 800,
};

assert.equal(INVESTMENT_RATE_BENCHMARK, 0.15);
assert.equal(EXCESS_LIQUIDITY_MIN_EUR, 500);

const fireRows = [
  {
    monthIndex: 119,
    patrimonyEnd: 500000,
    appliedWeightedReturn: 0.04,
  },
];
assert.equal(estimateFireYearsFromProjection(fireRows, 15000), 10);

const stale = computeFinancialDiagnosis({
  settings: baseSettings,
  snapshots: [
    {
      id: 's1',
      assetId: 'a1',
      snapshotDate: '2026-04-30',
      value: 5000,
    },
  ],
  assets: [{ id: 'a1', name: 'Bank', category: 'bank', provider: 'bankinter', isActive: true }],
  liabilities: [],
  now: new Date('2026-06-15'),
});
assert.ok(stale.insights.some((i) => i.id === 'stale_balances'));

const excess = computeFinancialDiagnosis({
  settings: { ...baseSettings, emergencyFundMonths: 3 },
  snapshots: [
    {
      id: 's1',
      assetId: 'a1',
      monthKey: '2026-06',
      snapshotDate: '2026-06-15',
      value: 20000,
    },
  ],
  assets: [{ id: 'a1', name: 'Bank', category: 'bank', provider: 'bankinter', isActive: true }],
  liabilities: [],
  now: new Date('2026-06-15'),
});
assert.ok(
  excess.insights.some(
    (i) => i.id === 'emergency_fund_excess' || i.id === 'emergency_fund_covered',
  ),
);

console.log('financialDiagnosis.test.js OK');
