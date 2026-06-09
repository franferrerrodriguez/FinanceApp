import assert from 'node:assert/strict';
import {
  createLinkedMortgageLiability,
  getLinkedMortgageLiability,
  getMortgageBalanceShareInfo,
  getMortgageBalanceShareInfoFromTotal,
  getMortgageFullMonthlyPayment,
  getMortgageFullOutstandingBalance,
  getMortgageOutstandingBalance,
  getMortgageYourSharePayment,
  inferHousingType,
  liabilityMonthlyPaymentForProjection,
  mortgageOutstandingShareToTotal,
  mortgageOutstandingTotalToShare,
  syncHousingSettings,
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

assert.equal(
  inferHousingType({ housingType: HOUSING_TYPE.RENT }, [mortgage]),
  HOUSING_TYPE.MORTGAGE,
  'linked mortgage wins over default rent',
);

assert.deepEqual(
  syncHousingSettings({ housingType: HOUSING_TYPE.RENT }, [mortgage]),
  {
    housingType: HOUSING_TYPE.MORTGAGE,
    linkedMortgageLiabilityId: 'm1',
  },
);
assert.equal(getLinkedMortgageLiability([mortgage], settings)?.id, 'm1');

assert.equal(
  liabilityMonthlyPaymentForProjection(settings, mortgage),
  258.5,
);

assert.equal(getMortgageFullMonthlyPayment(settings, mortgage), 517);
assert.deepEqual(getMortgageYourSharePayment(settings, mortgage), {
  amount: 258.5,
  percent: 50,
});

const outstanding = getMortgageOutstandingBalance(
  [{ id: 's1', liabilityId: 'm1', snapshotDate: '2026-06-05', value: -120000 }],
  mortgage,
  '2026-06',
);
assert.equal(outstanding, 120000);

const snapshots = [
  { id: 's1', liabilityId: 'm1', snapshotDate: '2026-06-05', value: -45000 },
];
assert.equal(getMortgageOutstandingBalance(snapshots, mortgage, '2026-06'), 45000);
assert.equal(
  getMortgageFullOutstandingBalance(settings, snapshots, mortgage, '2026-06'),
  90000,
);
assert.deepEqual(
  getMortgageBalanceShareInfo(settings, mortgage, 45000),
  { yourShare: 45000, fullTotal: 90000, percent: 50 },
);
assert.deepEqual(
  getMortgageBalanceShareInfoFromTotal(settings, mortgage, 90000),
  { yourShare: 45000, fullTotal: 90000, percent: 50 },
);
assert.equal(mortgageOutstandingTotalToShare(settings, mortgage, 90000), 45000);
assert.equal(mortgageOutstandingShareToTotal(settings, mortgage, 45000), 90000);

const mortgageWithTotal = { ...mortgage, enteredOutstandingTotal: 91207.59 };
assert.equal(
  mortgageOutstandingShareToTotal(settings, mortgageWithTotal, 45603.8),
  91207.59,
  'preserves user-entered total across share round-trip',
);
assert.equal(
  getMortgageFullOutstandingBalance(settings, snapshots, mortgageWithTotal, '2026-06'),
  91207.59,
);
assert.deepEqual(
  getMortgageBalanceShareInfo(settings, mortgageWithTotal, 45603.8),
  { yourShare: 45603.8, fullTotal: 91207.59, percent: 50 },
);

console.log('housingLiability.test.js: ok');
