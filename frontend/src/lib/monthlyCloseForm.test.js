import assert from 'node:assert/strict';
import {
  assetTracksGainLoss,
  canQuickSaveAllSame,
  computeDraftNetWorth,
  computeGainLossBreakdown,
  defaultTracksGainLossForCategory,
  estimateMortgageMonthlyDrop,
  findMostRecentMonthWithItem,
} from './monthlyCloseForm.js';
import { SNAPSHOT_ITEM_TYPE } from './snapshotItemTypes.js';

const item = { type: SNAPSHOT_ITEM_TYPE.ASSET, id: 'a1' };
const snapshots = [
  { id: 's1', assetId: 'a1', snapshotDate: '2026-04-30', value: 9000 },
  { id: 's2', assetId: 'a1', snapshotDate: '2026-05-31', value: 10000 },
];

assert.equal(
  findMostRecentMonthWithItem(snapshots, '2026-06', item),
  '2026-05',
);

assert.equal(
  estimateMortgageMonthlyDrop(
    { monthlyPayment: 500, interestRate: 0.03 },
    45000,
  ),
  387.5,
);

const breakdown = computeGainLossBreakdown(1000, -30.19);
assert.ok(breakdown);
assert.equal(breakdown.contributed, 1030.19);
assert.equal(breakdown.gain, -30.19);

assert.equal(
  computeDraftNetWorth(
    [{ value: 10000 }],
    [{ value: 8000 }],
  ),
  2000,
);

assert.equal(
  canQuickSaveAllSame(
    [{ prefillSource: 'previous', modified: false, value: 1 }],
    [{ prefillSource: 'previous', modified: false, value: 2 }],
  ),
  true,
);

assert.equal(
  canQuickSaveAllSame(
    [{ prefillSource: 'previous', modified: true, value: 1 }],
    [{ prefillSource: 'previous', modified: false, value: 2 }],
  ),
  false,
);

assert.equal(defaultTracksGainLossForCategory('investment'), true);
assert.equal(defaultTracksGainLossForCategory('bank'), false);
assert.equal(
  assetTracksGainLoss({ category: 'bank', tracksGainLoss: true }),
  true,
);
assert.equal(
  assetTracksGainLoss({ category: 'investment' }),
  true,
);

console.log('monthlyCloseForm.test.js OK');
