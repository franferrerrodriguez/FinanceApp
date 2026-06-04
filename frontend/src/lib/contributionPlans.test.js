import assert from 'node:assert/strict';
import {
  createContributionPlan,
  getTotalMonthlyContributions,
  getWeightedAnnualReturn,
  getWeightedReturnSummary,
  hasActiveContributionAmounts,
  resolveContributionsForMonth,
  resolveInvestmentContributionsForMonth,
  seedPlansFromLegacyInvestment,
} from './contributionPlans.js';

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

const weighted = getWeightedAnnualReturn(settings, plans);
assert.equal(weighted, 0.04);

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

console.log('contributionPlans.test.js: ok');
