import assert from 'node:assert/strict';
import {
  createContributionPlan,
  getContributionEligibleAssets,
  getTotalMonthlyContributions,
  getWeightedAnnualReturn,
  getWeightedReturnSummary,
  hasActiveContributionAmounts,
  isPlanEffectiveInMonth,
  migratePlansToAssets,
  resolveContributionsForMonth,
  resolveInvestmentContributionsForMonth,
  seedPlansFromLegacyInvestment,
  syncPlanWithAsset,
} from './contributionPlans.js';
import { getPlanAnnualReturn } from './projectionReturns.js';
import { createAsset } from './patrimony.js';

const settings = {
  useRealReturn: true,
  indexFundRealReturn: 0.04,
  pensionPlanReturn: 0.035,
  savingsAccountReturn: 0.025,
};

const plans = [
  createContributionPlan({
    providerId: 'indexa',
    monthlyAmount: 500,
    category: 'investment',
  }),
  createContributionPlan({
    providerId: 'pensionPlan',
    monthlyAmount: 300,
    category: 'pension',
  }),
];

assert.equal(getTotalMonthlyContributions(plans), 800);

const rampPlan = createContributionPlan({
  monthlyAmount: 500,
  growthMode: 'ramp_monthly',
  rampPerMonth: 100,
});
assert.equal(resolveContributionsForMonth([rampPlan], 2).total, 700);

const futurePlan = createContributionPlan({
  monthlyAmount: 400,
  effectiveFrom: '2026-12',
});
assert.equal(isPlanEffectiveInMonth(futurePlan, '2026-06'), false);
assert.equal(
  resolveContributionsForMonth([futurePlan], 0, '2026-06').total,
  0,
);
assert.equal(
  resolveContributionsForMonth([futurePlan], 0, '2026-12').total,
  400,
);

const weighted = getWeightedAnnualReturn(settings, plans);
assert.ok(Math.abs(weighted - (500 * 0.04 + 300 * 0.035) / 800) < 0.0001);

assert.equal(hasActiveContributionAmounts(plans), true);
assert.equal(getWeightedReturnSummary(settings, []).isWeighted, false);
assert.equal(getWeightedReturnSummary(settings, plans).isWeighted, true);

const etfOnly = [
  createContributionPlan({
    providerId: 'tradeRepublic',
    monthlyAmount: 200,
    category: 'etf',
  }),
];
assert.equal(resolveInvestmentContributionsForMonth(etfOnly, 0), 200);

const seeded = seedPlansFromLegacyInvestment({ monthlyInvestmentAmount: 200 });
assert.equal(seeded.length, 1);
assert.equal(seeded[0].monthlyAmount, 200);

const bankAsset = createAsset({
  id: 'a-bank',
  name: 'Bankinter',
  category: 'bank',
  provider: 'bankinter',
  customAnnualReturn: 0.02,
});
const fundAsset = createAsset({
  id: 'a-fund',
  name: 'Indexa',
  category: 'investment',
  provider: 'indexa',
  customAnnualReturn: 0.05,
});
const eligible = getContributionEligibleAssets(
  [bankAsset, fundAsset, createAsset({ category: 'cash' })],
);
assert.equal(eligible.length, 2);

const linked = syncPlanWithAsset(createContributionPlan(), fundAsset);
assert.equal(linked.assetId, 'a-fund');
assert.equal(linked.category, 'investment');
assert.equal(
  getPlanAnnualReturn(settings, linked, [fundAsset]),
  0.05,
);

const migrated = migratePlansToAssets(
  [createContributionPlan({ providerId: 'indexa', category: 'investment' })],
  [fundAsset],
);
assert.equal(migrated[0].assetId, 'a-fund');

console.log('contributionPlans.test.js: ok');
