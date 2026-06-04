import assert from 'node:assert/strict';
import { dedupeFinanceList, mergeFinanceLists } from './mergeFinanceLists.js';

assert.deepEqual(mergeFinanceLists([], [{ id: 'a1', name: 'X' }]), [
  { id: 'a1', name: 'X' },
]);

assert.deepEqual(
  mergeFinanceLists([{ id: 'a1', name: 'Cloud' }], [{ id: 'a1', name: 'Local' }]),
  [{ id: 'a1', name: 'Local' }],
);

assert.equal(
  dedupeFinanceList([
    { id: 'a1', name: 'One' },
    { id: 'a1', name: 'Two' },
  ]).length,
  1,
);

console.log('mergeFinanceLists.test.js OK');
