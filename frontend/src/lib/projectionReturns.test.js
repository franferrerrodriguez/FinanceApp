import assert from 'node:assert/strict';
import {
  applyScenarioMultiplier,
  buildScenarioAssets,
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

// applyScenarioMultiplier
assert.equal(applyScenarioMultiplier(0.04, 'moderate'), 0.04);
assert.equal(applyScenarioMultiplier(0.04, 'pessimistic'), 0.01);
assert.equal(applyScenarioMultiplier(0.04, 'optimistic'), 0.06);
assert.equal(applyScenarioMultiplier(0.04, 'unknown'), 0.04); // unknown → 1.00 multiplier

// buildScenarioAssets: moderate returns same array reference
const testAssets = [{ id: 'a1', category: 'investment', customAnnualReturn: 0.04 }];
assert.equal(buildScenarioAssets(testAssets, 'moderate', settings), testAssets);

// buildScenarioAssets: pessimistic scales each asset's return
const pessimisticAssets = buildScenarioAssets(testAssets, 'pessimistic', settings);
assert.ok(pessimisticAssets !== testAssets);
assert.equal(pessimisticAssets[0].customAnnualReturn, 0.01);

// buildScenarioAssets: optimistic scales each asset's return
const optimisticAssets = buildScenarioAssets(testAssets, 'optimistic', settings);
assert.equal(optimisticAssets[0].customAnnualReturn, 0.06);

console.log('projectionReturns.test.js: ok');
