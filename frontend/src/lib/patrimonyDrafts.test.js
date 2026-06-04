import assert from 'node:assert/strict';
import { isDraftAsset, isDraftLiability } from './patrimonyDrafts.js';

assert.equal(isDraftAsset({ name: 'Nuevo activo', category: 'bank' }), true);
assert.equal(
  isDraftAsset({ name: 'Nuevo activo', provider: 'bbva', category: 'bank' }),
  false,
);
assert.equal(isDraftAsset({ name: 'Mi fondo', category: 'investment' }), false);

assert.equal(isDraftLiability({ name: 'Nuevo pasivo', category: 'mortgage' }), true);

console.log('patrimonyDrafts.test.js OK');
