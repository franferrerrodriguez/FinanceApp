import assert from 'node:assert/strict';
import { summarizePatrimonyGrowth } from './patrimonyGrowth.js';

const empty = summarizePatrimonyGrowth([]);
assert.equal(empty.hasData, false);
assert.equal(empty.monthsRecorded, 0);

const snapshots = [
  { id: '1', assetId: 'a1', snapshotDate: '2026-04-30', value: 50000 },
  { id: '2', assetId: 'a1', snapshotDate: '2026-05-31', value: 52000 },
  { id: '3', assetId: 'a1', snapshotDate: '2026-06-04', value: 54000 },
];

const growth = summarizePatrimonyGrowth(snapshots, 12);
assert.equal(growth.hasData, true);
assert.equal(growth.hasGrowth, true);
assert.equal(growth.startNetWorth, 50000);
assert.equal(growth.endNetWorth, 54000);
assert.equal(growth.absoluteChange, 4000);
assert.ok(Math.abs(growth.percentChange - 0.08) < 0.0001);
assert.equal(growth.monthOverMonthDelta, 2000);

console.log('patrimonyGrowth.test.js: ok');
