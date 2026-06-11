import assert from 'node:assert/strict';
import { createLiability } from './patrimony.js';
import { isDraftAsset, isDraftLiability, isSavableLiability } from './patrimonyDrafts.js';

assert.equal(isDraftAsset({ provider: '', category: 'bank' }), true);
assert.equal(isDraftAsset({ provider: 'bbva', category: 'bank' }), false);
assert.equal(isDraftAsset({ provider: '', category: 'cash' }), false);
assert.equal(isDraftAsset({ provider: '', category: 'real_estate' }), false);

assert.equal(isDraftLiability({ name: 'Nuevo pasivo', category: 'mortgage' }), true);
assert.equal(isSavableLiability(createLiability({ name: 'Hipoteca', interestRate: 0 })), true);
assert.equal(isSavableLiability({ name: 'Préstamo', interestRate: undefined }), false);
assert.equal(createLiability({ name: 'Test' }).interestRate, 0);

console.log('patrimonyDrafts.test.js OK');
