import assert from 'node:assert/strict';
import {
  getBalanceSetupProgress,
  hasRecordedAccountBalances,
  isInvestStepComplete,
} from './balanceSetupProgress.js';
import { createAsset } from './patrimony.js';

const settings = {
  monthlyNetSalary: 2500,
  otherMonthlyIncome: 0,
  mortgageRent: 500,
  householdFixedEstimate: 0,
  leisureEstimate: 200,
};

assert.equal(hasRecordedAccountBalances([]), false);
assert.equal(
  hasRecordedAccountBalances([
    { assetId: 'a1', snapshotDate: '2026-06-04', value: 1000 },
  ]),
  true,
);

const fund = createAsset({ id: 'f1', category: 'investment', name: 'Indexa' });
assert.equal(isInvestStepComplete([fund], []), false);
assert.equal(
  isInvestStepComplete(
    [fund],
    [{ id: 'p1', isActive: true, monthlyAmount: 500, category: 'investment' }],
  ),
  true,
);
assert.equal(isInvestStepComplete([createAsset({ category: 'bank' })], []), true);

const progress = getBalanceSetupProgress({
  settings,
  assets: [fund],
  snapshots: [],
  contributionPlans: [],
});
assert.equal(progress.completeCount, 1);
assert.equal(progress.nextStepId, 'accounts');
assert.equal(progress.allComplete, false);

console.log('balanceSetupProgress.test.js: ok');
