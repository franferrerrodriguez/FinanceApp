import assert from 'node:assert/strict';
import {
  isLikelyAutoAllocatedBreakdown,
  patchExpenseViewMode,
} from './expenseViewMode.js';

const invented = {
  householdFixedEstimate: 150,
  utilities: 60,
  insurance: 52.5,
  subscriptions: 22.5,
  otherFixedExpenses: 15,
};

assert.equal(isLikelyAutoAllocatedBreakdown(invented), true);

assert.deepEqual(patchExpenseViewMode(invented, true), {
  useDetailedExpenses: true,
  utilities: 0,
  insurance: 0,
  subscriptions: 0,
  otherFixedExpenses: 0,
});

const real = {
  householdFixedEstimate: 150,
  utilities: 80,
  insurance: 70,
  subscriptions: 0,
  otherFixedExpenses: 0,
};

assert.equal(isLikelyAutoAllocatedBreakdown(real), false);
assert.deepEqual(patchExpenseViewMode(real, true), { useDetailedExpenses: true });

console.log('expenseViewMode.test.js OK');
