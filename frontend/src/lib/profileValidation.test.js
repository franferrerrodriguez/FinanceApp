import assert from 'node:assert/strict';
import { parseProfileAge, validateProfileForm } from './profileValidation.js';

assert.equal(parseProfileAge('25'), 25);
assert.equal(parseProfileAge('17'), null);

const ok = validateProfileForm({ name: ' Ana ', age: '30' });
assert.equal(ok.valid, true);
assert.equal(ok.name, 'Ana');
assert.equal(ok.age, 30);

const bad = validateProfileForm({ name: '', age: '10' });
assert.equal(bad.valid, false);
assert.equal(bad.ageErrorKey, 'tooYoung');

console.log('profileValidation.test.js: ok');
