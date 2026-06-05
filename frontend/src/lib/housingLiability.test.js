import assert from 'node:assert/strict';
import {
  createLinkedMortgageLiability,
  getLinkedMortgageLiability,
  getMortgageOutstandingBalance,
  inferHousingType,
  liabilityMonthlyPaymentForProjection,
  HOUSING_TYPE,
} from './housingLiability.js';

const settings = {
  housingType: HOUSING_TYPE.MORTGAGE,
  linkedMortgageLiabilityId: 'm1',
  mortgageRentTotal: 517,
  mortgageRentShared: true,
  mortgageRentYourSharePercent: 50,
};

const mortgage = createLinkedMortgageLiability();
mortgage.id = 'm1';

assert.equal(inferHousingType(settings, [mortgage]), HOUSING_TYPE.MORTGAGE);
assert.equal(getLinkedMortgageLiability([mortgage], settings)?.id, 'm1');

assert.equal(
  liabilityMonthlyPaymentForProjection(settings, mortgage),
  258.5,
);

const outstanding = getMortgageOutstandingBalance(
  [{ id: 's1', liabilityId: 'm1', snapshotDate: '2026-06-05', value: -120000 }],
  mortgage,
  '2026-06',
);
assert.equal(outstanding, 120000);

console.log('housingLiability.test.js: ok');
