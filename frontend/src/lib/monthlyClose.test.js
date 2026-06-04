import assert from 'node:assert/strict';
import {
  getMonthlyCloseStatus,
  getPendingCloseMonths,
  isMonthFullyClosed,
  isMonthKey,
} from './monthlyClose.js';
import { createAsset, createLiability } from './patrimony.js';

const asset = createAsset({ id: 'a1', name: 'Cuenta', category: 'bank' });
const june = '2026-06';
const may = '2026-05';

assert.ok(isMonthKey('2026-06'));
assert.ok(!isMonthKey('2026-6'));

const mayClose = [
  {
    id: 's1',
    assetId: 'a1',
    snapshotDate: '2026-05-31',
    value: 1000,
  },
];

assert.equal(isMonthFullyClosed(mayClose, may, [asset], []), true);
assert.equal(isMonthFullyClosed([], may, [asset], []), false);

const pending = getPendingCloseMonths(mayClose, [asset], [], {
  now: new Date(2026, 5, 15),
});
assert.deepEqual(pending, [june]);

const status = getMonthlyCloseStatus(mayClose, [asset], [], {
  now: new Date(2026, 5, 10),
});
assert.equal(status.suggestedMonthKey, june);
assert.equal(status.urgency, 'info');

const overdueStatus = getMonthlyCloseStatus([], [asset], [], {
  now: new Date(2026, 5, 10),
});
assert.equal(overdueStatus.pendingMonths.length, 1);
assert.equal(overdueStatus.pendingMonths[0], '2026-06');
assert.equal(overdueStatus.urgency, 'info');

const overdueWithHistory = getMonthlyCloseStatus(mayClose, [asset], [], {
  now: new Date(2026, 6, 5),
});
assert.ok(overdueWithHistory.pendingMonths.includes('2026-06'));
assert.equal(overdueWithHistory.overdueMonths[0], '2026-06');
assert.equal(overdueWithHistory.urgency, 'danger');

const liability = createLiability({ id: 'l1', name: 'Hipoteca' });
assert.equal(
  isMonthFullyClosed(
    [{ id: 's', assetId: 'a1', snapshotDate: '2026-06-30', value: 1 }],
    june,
    [asset],
    [liability],
  ),
  false,
);

console.log('monthlyClose.test.js OK');
