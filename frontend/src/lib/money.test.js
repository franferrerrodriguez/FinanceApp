import assert from 'node:assert/strict';
import {
  allocateEurosByWeights,
  applyShareEuros,
  fromCents,
  parseMoneyEuros,
  shareCents,
  subtractEuros,
  sumEuros,
  toCents,
} from './money.js';

// Caso del usuario: 517 € al 50 % + 120 € al 50 %
assert.equal(shareCents(toCents(517), 50), 25850);
assert.equal(applyShareEuros(517, true, 50), 258.5);
assert.equal(applyShareEuros(120, true, 50), 60);
assert.equal(sumEuros(258.5, 60), 318.5);
assert.equal(subtractEuros(1000, 318.5, 0, 100), 581.5);

// Sin reparto
assert.equal(applyShareEuros(517, false, 50), 517);

// Entrada usuario
assert.equal(parseMoneyEuros('517'), 517);
assert.equal(parseMoneyEuros('258,50'), 258.5);

// Reparto desglose hogar: suma = total
const parts = allocateEurosByWeights(120, [40, 35, 15, 10]);
assert.equal(sumEuros(...parts), 120);

// Evitar drift flotante
assert.equal(toCents(0.1) + toCents(0.2), 30);

console.log('money.test.js: ok');
