import assert from 'node:assert/strict';
import { displayToPct, formatRateInputValue, pctToDisplay } from './formatters.js';

assert.equal(pctToDisplay(0.0225), 2.25);
assert.equal(pctToDisplay(0.15), 15);
assert.equal(displayToPct('2,25'), 0.0225);
assert.equal(displayToPct('2.25'), 0.0225);
assert.match(formatRateInputValue(0.0225, 'es'), /^2[,.]25$/);

console.log('formatters.test.js OK');
