import assert from 'node:assert/strict';
import { isDraftAsset, isDraftLiability } from './patrimonyDrafts.js';

assert.equal(isDraftAsset({ provider: '', category: 'bank' }), true);
assert.equal(isDraftAsset({ provider: 'bbva', category: 'bank' }), false);
assert.equal(isDraftAsset({ provider: '', category: 'cash' }), false);
assert.equal(isDraftAsset({ provider: '', category: 'real_estate' }), false);

assert.equal(isDraftLiability({ name: 'Nuevo pasivo', category: 'mortgage' }), true);

console.log('patrimonyDrafts.test.js OK');
