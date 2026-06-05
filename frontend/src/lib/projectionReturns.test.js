import assert from 'node:assert/strict';
import {
  getAssetAnnualReturn,
  getDefaultReturnForAssetCategory,
  getPlanAnnualReturn,
  getReturnForCategory,
} from './projectionReturns.js';

const settings = {
  useRealReturn: true,
  indexFundRealReturn: 0.04,
};

assert.equal(getDefaultReturnForAssetCategory('bank', settings), 0.025);
assert.equal(getDefaultReturnForAssetCategory('investment', settings), 0.04);
assert.equal(getDefaultReturnForAssetCategory('cash', settings), 0);

assert.equal(
  getAssetAnnualReturn(settings, { category: 'investment', customAnnualReturn: 0.06 }),
  0.06,
);
assert.equal(
  getAssetAnnualReturn(settings, { category: 'investment', customAnnualReturn: null }),
  0.04,
);
assert.equal(getAssetAnnualReturn(settings, { category: 'bank' }), 0.025);

assert.equal(getReturnForCategory(settings, 'bank', null), 0.025);
assert.equal(
  getPlanAnnualReturn(settings, { category: 'investment', customAnnualReturn: null }),
  0.04,
);

console.log('projectionReturns.test.js: ok');
