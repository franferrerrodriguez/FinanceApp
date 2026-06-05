import assert from 'node:assert/strict';
import { annualToMonthlyRate } from './calculations.js';
import {
  assetCategoryToBucket,
  buildInitialBucketState,
  computeWeightedPortfolioReturn,
  netWorthFromState,
} from './projectionBuckets.js';
import { buildMonthlyProjectionTable } from './projectionTable.js';
import { createAsset } from './patrimony.js';

const settings = {
  useRealReturn: true,
  indexFundRealReturn: 0.04,
  pensionPlanReturn: 0.035,
  savingsAccountReturn: 0.02,
  initialPatrimony: 0,
};

assert.equal(assetCategoryToBucket('bank'), 'liquid');
assert.equal(assetCategoryToBucket('etf'), 'investment');

const bank = createAsset({
  id: 'a-bank',
  name: 'Bankinter',
  category: 'bank',
  customAnnualReturn: 0.02,
});
const fund = createAsset({
  id: 'a-fund',
  name: 'Indexa',
  category: 'investment',
  customAnnualReturn: 0.04,
});

const snapshots = [
  { id: 's1', assetId: 'a-bank', snapshotDate: '2026-06-04', value: 10000 },
  { id: 's2', assetId: 'a-fund', snapshotDate: '2026-06-04', value: 50000 },
];

const initial = buildInitialBucketState({
  settings,
  assets: [bank, fund],
  snapshots,
  monthKey: '2026-06',
});

assert.equal(initial.buckets.liquid, 10000);
assert.equal(initial.buckets.investment, 50000);
assert.equal(netWorthFromState(initial.buckets, 0), 60000);

const weighted = computeWeightedPortfolioReturn(
  initial.buckets,
  initial.bucketRates,
);
assert.ok(Math.abs(weighted - (10000 * 0.02 + 50000 * 0.04) / 60000) < 0.0001);

const rows = buildMonthlyProjectionTable({
  settings: {
    ...settings,
    monthlyNetSalary: 3000,
    mortgageRent: 0,
    householdFixedEstimate: 0,
    leisureEstimate: 0,
    projectionYears: 1,
  },
  assets: [bank, fund],
  snapshots,
  startDate: new Date(2026, 6, 1),
  years: 1,
});

assert.equal(rows[0].patrimonioInicio, 60000);
const expectedReturn =
  10000 * annualToMonthlyRate(0.02) + 50000 * annualToMonthlyRate(0.04);
assert.ok(Math.abs(rows[0].monthlyReturn - expectedReturn) < 0.05);

console.log('projectionBuckets.test.js: ok');
