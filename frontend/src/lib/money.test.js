import assert from 'node:assert/strict';
import {
  allocateEurosByWeights,
  applyShareEuros,
  totalFromShareEuros,
  fromCents,
  parseMoneyEuros,
  shareCents,
  subtractEuros,
  sumEuros,
  formatMoneyInputValue,
  toCents,
} from './money.js';

// User case: €517 at 50% + €120 at 50%
assert.equal(shareCents(toCents(517), 50), 25850);
assert.equal(applyShareEuros(517, true, 50), 258.5);
assert.equal(totalFromShareEuros(258.5, 50), 517);
assert.equal(totalFromShareEuros(45000, 50), 90000);
assert.equal(applyShareEuros(120, true, 50), 60);
assert.equal(sumEuros(258.5, 60), 318.5);
assert.equal(subtractEuros(1000, 318.5, 0, 100), 581.5);

// No split
assert.equal(applyShareEuros(517, false, 50), 517);

// User input
assert.equal(parseMoneyEuros('517'), 517);
assert.equal(parseMoneyEuros('258,50'), 258.5);

// Household breakdown split: sum = total
const parts = allocateEurosByWeights(120, [40, 35, 15, 10]);
assert.equal(sumEuros(...parts), 120);

// Avoid float drift
assert.equal(toCents(0.1) + toCents(0.2), 30);

assert.equal(formatMoneyInputValue(91207.6, 'es'), '91207,60');
assert.equal(formatMoneyInputValue(91207.59, 'es'), '91207,59');

console.log('money.test.js: ok');
