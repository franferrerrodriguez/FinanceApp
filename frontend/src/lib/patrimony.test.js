import assert from 'node:assert/strict';
import {
  buildCloseMonthSnapshots,
  buildCurrentBalanceRows,
  buildMonthlyCloseDrafts,
  buildPatrimonyHistoryTable,
  createAsset,
  createLiability,
  resolveSnapshotDateForMonth,
} from './patrimony.js';

const asset = createAsset({
  id: 'a1',
  name: 'Cuenta',
  category: 'bank',
  provider: 'bankinter',
});
const liability = createLiability({
  id: 'l1',
  name: 'Hipoteca',
  category: 'mortgage',
});

const prevSnaps = [
  {
    id: 's1',
    assetId: 'a1',
    snapshotDate: '2026-05-31',
    value: 10000,
  },
  {
    id: 's2',
    liabilityId: 'l1',
    snapshotDate: '2026-05-31',
    value: -80000,
  },
];

const drafts = buildMonthlyCloseDrafts({
  assets: [asset],
  liabilities: [liability],
  snapshots: prevSnaps,
  monthKey: '2026-06',
});

assert.equal(drafts.assetRows[0].value, 10000);
assert.equal(drafts.assetRows[0].prefillSource, 'previous');
assert.equal(drafts.liabilityRows[0].value, 80000);
assert.equal(drafts.liabilityRows[0].prefillSource, 'previous');

assert.match(resolveSnapshotDateForMonth('2026-06'), /^\d{4}-\d{2}-\d{2}$/);
assert.equal(resolveSnapshotDateForMonth('2020-01').endsWith('-01-31'), true);

const closed = buildCloseMonthSnapshots({
  assetRows: [{ assetId: 'a1', value: 12000 }],
  liabilityRows: [{ liabilityId: 'l1', value: 79000 }],
  snapshotDate: '2026-06-30',
});

assert.equal(closed.length, 2);
assert.equal(closed[0].value, 12000);
assert.equal(closed[1].value, -79000);

const table = buildPatrimonyHistoryTable({
  assets: [asset],
  liabilities: [liability],
  snapshots: [
    ...prevSnaps,
    {
      id: 's3',
      assetId: 'a1',
      snapshotDate: '2026-06-30',
      value: 12000,
    },
    {
      id: 's4',
      liabilityId: 'l1',
      snapshotDate: '2026-06-30',
      value: -79000,
    },
  ],
  months: 12,
});

assert.ok(table.valueGrid.length === 2);
const juneIdx = table.monthKeys.indexOf('2026-06');
assert.ok(juneIdx >= 0, 'history table must include months with saved balances');
assert.equal(table.monthTotals[juneIdx].netWorth, 12000 - 79000);

const sparse = buildPatrimonyHistoryTable({
  assets: [asset],
  liabilities: [],
  snapshots: [
    {
      id: 'only',
      assetId: 'a1',
      snapshotDate: '2026-06-05',
      value: 6000,
    },
  ],
  months: 12,
});
assert.ok(
  sparse.monthKeys.includes('2026-06'),
  'sparse snapshots must still appear in history columns',
);
assert.equal(sparse.valueGrid[0].values[sparse.monthKeys.indexOf('2026-06')], 6000);

const current = buildCurrentBalanceRows(
  [asset],
  [liability],
  [
    {
      id: 's3',
      assetId: 'a1',
      snapshotDate: '2026-06-05',
      value: 6000,
    },
  ],
  '2026-06',
);

assert.equal(current.rows.length, 2);
assert.equal(current.hasAnyBalance, true);
assert.equal(current.rows[0].balance, 6000);
assert.equal(current.rows[1].hasBalance, false);

console.log('patrimony.test.js OK');
