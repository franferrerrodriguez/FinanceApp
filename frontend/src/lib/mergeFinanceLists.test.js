import assert from 'node:assert/strict';
import { dedupeFinanceList, mergeFinanceLists } from './mergeFinanceLists.js';

assert.deepEqual(mergeFinanceLists([], [{ id: 'a1', name: 'X' }]), [
  { id: 'a1', name: 'X' },
]);

assert.deepEqual(
  mergeFinanceLists([{ id: 'a1', name: 'Base' }], [{ id: 'a1', name: 'Incoming' }]),
  [{ id: 'a1', name: 'Incoming' }],
);

assert.equal(
  dedupeFinanceList([
    { id: 'a1', name: 'One' },
    { id: 'a1', name: 'Two' },
  ]).length,
  1,
);

console.log('mergeFinanceLists.test.js OK');
