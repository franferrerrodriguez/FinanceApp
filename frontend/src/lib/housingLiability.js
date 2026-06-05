import { getEffectiveMortgageRent } from './calculations.js';
import { getCurrentMonthKey } from './dashboardMetrics.js';
import { createLiability, getSnapshotValueForItem } from './patrimony.js';
import { SNAPSHOT_ITEM_TYPE } from './snapshotItemTypes.js';

export const HOUSING_TYPE = {
  RENT: 'rent',
  MORTGAGE: 'mortgage',
};

export function inferHousingType(settings, liabilities = []) {
  if (settings?.housingType === HOUSING_TYPE.MORTGAGE) return HOUSING_TYPE.MORTGAGE;
  if (settings?.housingType === HOUSING_TYPE.RENT) return HOUSING_TYPE.RENT;
  if (settings?.linkedMortgageLiabilityId) return HOUSING_TYPE.MORTGAGE;
  const hasMortgageLiability = liabilities.some((l) => l.category === 'mortgage');
  if (hasMortgageLiability) return HOUSING_TYPE.MORTGAGE;
  return HOUSING_TYPE.RENT;
}

export function getLinkedMortgageLiability(liabilities = [], settings = {}) {
  const linkedId = settings.linkedMortgageLiabilityId;
  if (linkedId) {
    const linked = liabilities.find((l) => l.id === linkedId);
    if (linked) return linked;
  }
  return (
    liabilities.find(
      (l) => l.category === 'mortgage' && l.isActive !== false,
    ) ?? null
  );
}

export function getMortgageOutstandingBalance(
  snapshots = [],
  liability,
  monthKey = getCurrentMonthKey(),
) {
  if (!liability) return null;
  const raw = getSnapshotValueForItem(snapshots, monthKey, {
    type: SNAPSHOT_ITEM_TYPE.LIABILITY,
    id: liability.id,
  });
  if (raw == null || !Number.isFinite(raw)) return null;
  return Math.abs(Number(raw) || 0);
}

export function liabilityMonthlyPaymentForProjection(settings, liability) {
  if (
    liability?.id &&
    liability.id === settings?.linkedMortgageLiabilityId &&
    liability.category === 'mortgage'
  ) {
    return getEffectiveMortgageRent(settings);
  }
  return liability?.monthlyPayment ?? 0;
}

export function createLinkedMortgageLiability(name = 'Hipoteca') {
  return createLiability({
    name,
    category: 'mortgage',
    monthlyPayment: 0,
    isActive: true,
  });
}

/** Categories users can add manually (housing debt is managed from Cashflow). */
export const MANUAL_LIABILITY_CATEGORIES = [
  'personal_loan',
  'credit_card',
  'family_debt',
  'other',
];
