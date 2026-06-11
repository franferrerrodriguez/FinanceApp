import assert from 'node:assert/strict';
import {
  getMissingCloseItemsForMonth,
  getMonthlyCloseAlert,
  getMonthlyCloseStatus,
  getPendingCloseMonths,
  isMonthFullyClosed,
  isMonthKey,
  pickSuggestedCloseMonthKey,
} from './monthlyClose.js';
import { createAsset, createLiability } from './patrimony.js';

const asset = createAsset({
  id: 'a1',
  name: 'Cuenta',
  category: 'bank',
  provider: 'bankinter',
});
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
assert.ok(overdueWithHistory.pendingMonths.includes('2026-07'));
assert.equal(overdueWithHistory.suggestedMonthKey, '2026-07');
assert.equal(overdueWithHistory.overdueMonths[0], '2026-06');
assert.equal(overdueWithHistory.urgency, 'danger');

assert.equal(
  pickSuggestedCloseMonthKey(['2026-05', '2026-06'], '2026-06'),
  '2026-06',
);
assert.equal(
  pickSuggestedCloseMonthKey(['2026-05', '2026-06'], '2026-07'),
  '2026-06',
);

const asset2 = createAsset({
  id: 'a2',
  name: 'Fondo',
  category: 'investment',
  provider: 'indexa',
});
const mayAndJunePartial = getMonthlyCloseStatus(
  [
    { id: 's1', assetId: 'a1', snapshotDate: '2026-05-31', value: 1000 },
    { id: 's2', assetId: 'a1', snapshotDate: '2026-06-05', value: 2000 },
  ],
  [asset, asset2],
  [],
  { now: new Date(2026, 5, 15) },
);
assert.ok(mayAndJunePartial.pendingMonths.includes(may));
assert.ok(mayAndJunePartial.pendingMonths.includes(june));
assert.equal(mayAndJunePartial.suggestedMonthKey, june);

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

const june3 = new Date(2026, 5, 3);
const junePendingStatus = getMonthlyCloseStatus(mayClose, [asset], [], {
  now: june3,
});
const newMonthAlert = getMonthlyCloseAlert(junePendingStatus, 'es', { now: june3 });
assert.equal(newMonthAlert?.id, 'monthly_close_new_month');
assert.equal(newMonthAlert?.severity, 'info');

const june15 = new Date(2026, 5, 15);
const midMonthAlert = getMonthlyCloseAlert(junePendingStatus, 'es', {
  now: june15,
});
assert.equal(midMonthAlert, null);

const june26 = new Date(2026, 5, 26);
const endStatus = getMonthlyCloseStatus(mayClose, [asset], [], { now: june26 });
const endAlert = getMonthlyCloseAlert(endStatus, 'es', { now: june26 });
assert.equal(endAlert?.id, 'monthly_close_due');

const overdueAlert = getMonthlyCloseAlert(overdueWithHistory, 'es', {
  now: new Date(2026, 6, 5),
});
assert.equal(overdueAlert?.id, 'monthly_close_overdue');
assert.equal(overdueAlert?.severity, 'danger');
assert.equal(overdueAlert?.params.count, 1);

const draftAsset = createAsset({ id: 'draft', name: '', category: 'bank' });
const juneOnlyAsset = [
  { id: 's-june', assetId: 'a1', snapshotDate: '2026-06-08', value: 1000 },
];
assert.equal(
  isMonthFullyClosed(juneOnlyAsset, june, [asset, draftAsset], []),
  true,
);

const missingJune = getMissingCloseItemsForMonth(
  mayClose,
  [asset, asset2],
  [],
  june,
);
assert.equal(missingJune.length, 2);
assert.ok(missingJune.some((i) => i.id === 'a1'));
assert.ok(missingJune.some((i) => i.id === 'a2'));

const missingNone = getMissingCloseItemsForMonth(mayClose, [asset], [], may);
assert.equal(missingNone.length, 0);

console.log('monthlyClose.test.js OK');
