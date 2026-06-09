import assert from 'node:assert/strict';
import {
  getLiabilityOutstandingFromSnapshots,
  mergeLiabilityOutstandingSnapshot,
} from './liabilitySnapshots.js';

const snapshots = [
  { id: 's1', liabilityId: 'l1', snapshotDate: '2026-06-08', value: -45000 },
];

assert.equal(getLiabilityOutstandingFromSnapshots(snapshots, 'l1', '2026-06'), 45000);

const merged = mergeLiabilityOutstandingSnapshot({
  snapshots,
  liabilityId: 'l2',
  amount: 5000,
  monthKey: '2026-06',
  snapshotDate: '2026-06-08',
});

assert.equal(merged.length, 2);
assert.ok(merged.some((s) => s.liabilityId === 'l2' && s.value === -5000));

console.log('liabilitySnapshots.test.js: ok');
