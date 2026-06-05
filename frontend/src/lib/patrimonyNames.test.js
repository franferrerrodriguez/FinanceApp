import assert from 'node:assert/strict';
import {
  applyAutoAssetNames,
  getAssetBaseLabel,
  isSavableAssetCatalog,
} from './patrimonyNames.js';

const formatProvider = (p) => (p === 'bankinter' ? 'Bankinter' : p || '');
const categoryLabel = (c) =>
  ({ bank: 'Cuenta', investment: 'Fondo', cash: 'Efectivo' })[c] ?? c;

assert.equal(
  getAssetBaseLabel({ provider: 'bankinter', category: 'bank' }, formatProvider, categoryLabel),
  'Bankinter',
);
assert.equal(
  getAssetBaseLabel({ provider: '', category: 'cash' }, formatProvider, categoryLabel),
  'Efectivo',
);

const one = applyAutoAssetNames(
  [{ id: '1', provider: 'bankinter', category: 'bank' }],
  (a) => getAssetBaseLabel(a, formatProvider, categoryLabel),
);
assert.equal(one[0].name, 'Bankinter');

const two = applyAutoAssetNames(
  [
    { id: '1', provider: 'bankinter', category: 'bank' },
    { id: '2', provider: 'bankinter', category: 'bank' },
  ],
  (a) => getAssetBaseLabel(a, formatProvider, categoryLabel),
);
assert.equal(two[0].name, 'Bankinter');
assert.equal(two[1].name, 'Bankinter 2');

assert.equal(isSavableAssetCatalog({ provider: 'bankinter', category: 'bank' }), true);
assert.equal(isSavableAssetCatalog({ provider: '', category: 'cash' }), true);
assert.equal(isSavableAssetCatalog({ provider: '', category: 'bank' }), false);

console.log('patrimonyNames.test.js: ok');
