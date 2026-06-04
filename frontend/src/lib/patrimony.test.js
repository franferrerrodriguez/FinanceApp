import assert from 'node:assert/strict';
import {
  buildCloseMonthSnapshots,
  buildMonthlyCloseDrafts,
  buildPatrimonyHistoryTable,
  createAsset,
  createLiability,
  resolveSnapshotDateForMonth,
} from './patrimony.js';

const asset = createAsset({ id: 'a1', name: 'Cuenta', category: 'bank' });
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
assert.equal(drafts.liabilityRows[0].value, 80000);

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
assert.ok(juneIdx >= 0);
assert.equal(table.monthTotals[juneIdx].netWorth, 12000 - 79000);

console.log('patrimony.test.js OK');
