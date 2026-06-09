import { getEffectiveMortgageRent } from './calculations.js';
import { getCurrentMonthKey } from './dashboardMetrics.js';
import { createLiability, getSnapshotValueForItem } from './patrimony.js';
import { SNAPSHOT_ITEM_TYPE } from './snapshotItemTypes.js';

export const HOUSING_TYPE = {
  RENT: 'rent',
  MORTGAGE: 'mortgage',
};

export function inferHousingType(settings, liabilities = []) {
  const linked = getLinkedMortgageLiability(liabilities, settings);
  if (linked) return HOUSING_TYPE.MORTGAGE;
  if (settings?.housingType === HOUSING_TYPE.MORTGAGE) return HOUSING_TYPE.MORTGAGE;
  return HOUSING_TYPE.RENT;
}

/** Keeps housingType and linkedMortgageLiabilityId aligned with liabilities after merge/rehydrate. */
export function syncHousingSettings(settings, liabilities = []) {
  const linked = getLinkedMortgageLiability(liabilities, settings);
  return {
    ...settings,
    housingType: inferHousingType(settings, liabilities),
    linkedMortgageLiabilityId: linked?.id ?? null,
  };
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

export function isLinkedHousingMortgage(liability, settings = {}, liabilities = []) {
  if (!liability) return false;
  const linked = getLinkedMortgageLiability(liabilities, settings);
  return linked?.id === liability.id;
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

export function isLinkedMortgageLiability(liability, settings = {}) {
  return (
    liability?.id != null &&
    liability.id === settings?.linkedMortgageLiabilityId &&
    liability.category === 'mortgage'
  );
}

/** Monthly payment shown in catalogs: linked mortgage uses Budget → Housing. */
export function getLiabilityMonthlyPaymentDisplay(settings, liability) {
  if (isLinkedMortgageLiability(liability, settings)) {
    return getEffectiveMortgageRent(settings);
  }
  return liability?.monthlyPayment ?? 0;
}

export function liabilityMonthlyPaymentForProjection(settings, liability) {
  return getLiabilityMonthlyPaymentDisplay(settings, liability);
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
