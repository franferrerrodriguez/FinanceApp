import assert from 'node:assert/strict';
import {
  deriveContributionsForMonth,
  inferContributionFromBalances,
  rebuildDerivedContributionEntries,
} from './deriveContributionsFromSnapshots.js';
import { createAsset } from './patrimony.js';

const fund = createAsset({
  id: 'f1',
  category: 'investment',
  name: 'Indexa',
  customAnnualReturn: 0.06,
});
const bank = createAsset({
  id: 'b1',
  category: 'bank',
  name: 'Cuenta',
  customAnnualReturn: 0.025,
});

const fundInferred = inferContributionFromBalances({
  previousBalance: 1000,
  newBalance: 2000,
  asset: fund,
  settings: {},
});
assert.equal(fundInferred.amount, 995.13);
assert.equal(fundInferred.delta, 1000);

const bankInferred = inferContributionFromBalances({
  previousBalance: 1000,
  newBalance: 2000,
  asset: bank,
  settings: {},
});
assert.equal(bankInferred.amount, 997.94);

const snapshots = [
  { assetId: 'f1', snapshotDate: '2026-05-31', value: 1000 },
  { assetId: 'f1', snapshotDate: '2026-06-08', value: 2000 },
];

assert.equal(
  deriveContributionsForMonth({
    snapshots,
    assets: [fund],
    settings: {},
    monthKey: '2026-05',
  }).length,
  0,
);

const juneEntries = deriveContributionsForMonth({
  snapshots,
  assets: [fund],
  settings: {},
  monthKey: '2026-06',
});
assert.equal(juneEntries.length, 1);
assert.equal(juneEntries[0].amount, 995.13);
assert.equal(juneEntries[0].derived, true);

const rebuilt = rebuildDerivedContributionEntries({
  snapshots: [
    { assetId: 'b1', snapshotDate: '2026-05-31', value: 500 },
    { assetId: 'b1', snapshotDate: '2026-06-30', value: 1500 },
  ],
  assets: [bank],
  settings: {},
});
assert.equal(rebuilt.length, 1);
assert.ok(rebuilt[0].amount > 990);

console.log('deriveContributionsFromSnapshots.test.js: ok');
