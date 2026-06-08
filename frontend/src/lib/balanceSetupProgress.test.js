import assert from 'node:assert/strict';
import {
  BALANCE_SETUP_STEP,
  filterFinanceAlerts,
  getBalanceSetupSteps,
  hasRecordedAccountBalances,
  needsAccountBalancesSetup,
  needsContributionsSetup,
  needsLiquidAccountsSetup,
} from './balanceSetupProgress.js';
import { createAsset } from './patrimony.js';

assert.equal(hasRecordedAccountBalances([]), false);
assert.equal(
  hasRecordedAccountBalances([
    { assetId: 'a1', snapshotDate: '2026-06-04', value: 1000 },
  ]),
  true,
);

const fund = createAsset({
  id: 'f1',
  category: 'investment',
  name: 'Indexa',
  provider: 'indexa',
});
const bank = createAsset({
  id: 'b1',
  category: 'bank',
  provider: 'bankinter',
});

assert.equal(needsContributionsSetup([fund], []), true);
assert.equal(
  needsContributionsSetup(
    [fund],
    [{ id: 'e1', assetId: 'f1', date: '2026-06-10', amount: 500 }],
  ),
  false,
);
assert.equal(needsContributionsSetup([bank], []), false);

assert.equal(needsAccountBalancesSetup([], [], []), true);
assert.equal(needsAccountBalancesSetup([bank], [], []), true);
assert.equal(
  needsAccountBalancesSetup(
    [bank],
    [],
    [{ assetId: bank.id, snapshotDate: '2026-06-04', value: 1000 }],
  ),
  false,
);

assert.equal(needsLiquidAccountsSetup([fund], [], []), false);
assert.equal(
  needsLiquidAccountsSetup(
    [fund],
    [],
    [{ assetId: fund.id, snapshotDate: '2026-06-04', value: 1000 }],
  ),
  true,
);
assert.equal(
  needsLiquidAccountsSetup(
    [bank],
    [],
    [{ assetId: bank.id, snapshotDate: '2026-06-04', value: 1000 }],
  ),
  false,
);

const progress = getBalanceSetupSteps({
  assets: [fund],
  snapshots: [],
  contributionEntries: [],
});
assert.equal(progress.steps.length, 3);
assert.equal(progress.completeCount, 0);
assert.equal(progress.pendingSteps.length, 3);
assert.equal(progress.steps[0].id, BALANCE_SETUP_STEP.ACCOUNTS);
assert.equal(progress.steps[0].complete, false);
assert.equal(progress.steps[2].id, BALANCE_SETUP_STEP.INVEST);
assert.equal(progress.nextStepId, BALANCE_SETUP_STEP.ACCOUNTS);

const liquidPending = getBalanceSetupSteps({
  assets: [fund],
  snapshots: [{ assetId: fund.id, snapshotDate: '2026-06-04', value: 1000 }],
  contributionEntries: [],
});
assert.equal(liquidPending.completeCount, 1);
assert.equal(liquidPending.steps[0].complete, true);
assert.equal(liquidPending.steps[1].complete, false);
assert.equal(liquidPending.nextStepId, BALANCE_SETUP_STEP.LIQUID);

const bankOnly = getBalanceSetupSteps({
  assets: [bank],
  snapshots: [{ assetId: bank.id, snapshotDate: '2026-06-04', value: 1000 }],
  contributionEntries: [],
});
assert.equal(bankOnly.steps.length, 2);
assert.ok(!bankOnly.steps.some((s) => s.id === BALANCE_SETUP_STEP.INVEST));
assert.equal(bankOnly.pendingSteps.length, 0);
assert.equal(bankOnly.allComplete, true);

const fundReady = getBalanceSetupSteps({
  assets: [fund],
  snapshots: [{ assetId: fund.id, snapshotDate: '2026-06-04', value: 1000 }],
  contributionEntries: [],
});
assert.equal(fundReady.steps.length, 3);
assert.equal(fundReady.steps[2].complete, false);
assert.ok(fundReady.pendingSteps.some((s) => s.id === BALANCE_SETUP_STEP.INVEST));

const filtered = filterFinanceAlerts(
  [{ id: 'emergency_fund_no_accounts' }, { id: 'negative_cashflow' }],
  [{ id: BALANCE_SETUP_STEP.ACCOUNTS }],
);
assert.deepEqual(filtered.map((a) => a.id), ['negative_cashflow']);

console.log('balanceSetupProgress.test.js: ok');
