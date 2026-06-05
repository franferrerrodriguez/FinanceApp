import assert from 'node:assert/strict';
import { buildCloseMonthSnapshots } from './patrimony.js';
import { dedupeSnapshots, snapshotNaturalKey } from './snapshotPersist.js';

assert.equal(
  snapshotNaturalKey({
    assetId: 'a1',
    snapshotDate: '2026-06-04',
  }),
  'a:a1:2026-06-04',
);

const dupes = dedupeSnapshots([
  { id: 'old', assetId: 'a1', snapshotDate: '2026-06-04', value: 100 },
  { id: 'new', assetId: 'a1', snapshotDate: '2026-06-04', value: 200 },
]);
assert.equal(dupes.length, 1);
assert.equal(dupes[0].value, 200);

const reused = buildCloseMonthSnapshots({
  assetRows: [{ assetId: 'a1', value: 5000 }],
  liabilityRows: [],
  snapshotDate: '2026-06-04',
  existingSnapshots: [
    { id: 'keep-me', assetId: 'a1', snapshotDate: '2026-06-04', value: 4000 },
  ],
});
assert.equal(reused[0].id, 'keep-me');
assert.equal(reused[0].value, 5000);

console.log('snapshotPersist.test.js: ok');
