import assert from 'node:assert/strict';
import {
  BALANCE_SETUP_STEP,
  filterFinanceAlerts,
  getBalanceSetupSteps,
  hasCloseableAssets,
  hasRecordedAccountBalances,
  needsAccountBalancesSetup,
  needsAddAssetsSetup,
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

// hasCloseableAssets / needsAddAssetsSetup
assert.equal(hasCloseableAssets([]), false);
assert.equal(hasCloseableAssets([fund]), true);
assert.equal(hasCloseableAssets([bank]), true);
assert.equal(needsAddAssetsSetup([]), true);
assert.equal(needsAddAssetsSetup([fund]), false);

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

// No assets at all — ADD_ASSETS is the next step
const noAssets = getBalanceSetupSteps({ assets: [], snapshots: [] });
assert.equal(noAssets.steps.length, 3);
assert.equal(noAssets.completeCount, 0);
assert.equal(noAssets.steps[0].id, BALANCE_SETUP_STEP.ADD_ASSETS);
assert.equal(noAssets.steps[0].complete, false);
assert.equal(noAssets.nextStepId, BALANCE_SETUP_STEP.ADD_ASSETS);

// Has assets but no snapshots — ACCOUNTS is next
const progress = getBalanceSetupSteps({
  assets: [fund],
  snapshots: [],
});
assert.equal(progress.steps.length, 3);
assert.equal(progress.completeCount, 1); // ADD_ASSETS done
assert.equal(progress.steps[0].id, BALANCE_SETUP_STEP.ADD_ASSETS);
assert.equal(progress.steps[0].complete, true);
assert.equal(progress.steps[1].id, BALANCE_SETUP_STEP.ACCOUNTS);
assert.equal(progress.steps[1].complete, false);
assert.equal(progress.nextStepId, BALANCE_SETUP_STEP.ACCOUNTS);

// Has assets + snapshots but no liquid — LIQUID is next
const liquidPending = getBalanceSetupSteps({
  assets: [fund],
  snapshots: [{ assetId: fund.id, snapshotDate: '2026-06-04', value: 1000 }],
});
assert.equal(liquidPending.completeCount, 2); // ADD_ASSETS + ACCOUNTS done
assert.equal(liquidPending.steps[0].complete, true);
assert.equal(liquidPending.steps[1].complete, true);
assert.equal(liquidPending.steps[2].complete, false);
assert.equal(liquidPending.nextStepId, BALANCE_SETUP_STEP.LIQUID);

// Bank account covers liquid — all complete
const bankOnly = getBalanceSetupSteps({
  assets: [bank],
  snapshots: [{ assetId: bank.id, snapshotDate: '2026-06-04', value: 1000 }],
});
assert.equal(bankOnly.steps.length, 3);
assert.equal(bankOnly.pendingSteps.length, 0);
assert.equal(bankOnly.allComplete, true);

// Fund with snapshots — LIQUID pending
const fundReady = getBalanceSetupSteps({
  assets: [fund],
  snapshots: [{ assetId: fund.id, snapshotDate: '2026-06-04', value: 1000 }],
});
assert.equal(fundReady.steps.length, 3);
assert.equal(fundReady.pendingSteps.length, 1);
assert.equal(fundReady.pendingSteps[0].id, BALANCE_SETUP_STEP.LIQUID);

const filtered = filterFinanceAlerts(
  [{ id: 'emergency_fund_no_accounts' }, { id: 'negative_cashflow' }],
  [{ id: BALANCE_SETUP_STEP.ACCOUNTS }],
);
assert.deepEqual(filtered.map((a) => a.id), ['negative_cashflow']);

console.log('balanceSetupProgress.test.js: ok');
