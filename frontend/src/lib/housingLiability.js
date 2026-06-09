import {
  getEffectiveMortgageRent,
  getMortgageRentTotal,
} from './calculations.js';
import { applyShareEuros, normalizeEuros, totalFromShareEuros } from './money.js';
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

export function isLinkedMortgageLiability(liability, settings = {}) {
  return (
    liability?.id != null &&
    liability.id === settings?.linkedMortgageLiabilityId &&
    liability.category === 'mortgage'
  );
}

export function isMortgageCapitalShared(settings = {}, liability) {
  return (
    isLinkedMortgageLiability(liability, settings) &&
    Boolean(settings?.mortgageRentShared)
  );
}

export function getMortgageSharePercent(settings = {}) {
  return settings?.mortgageRentYourSharePercent ?? 50;
}

/** User's share stored in snapshots (patrimony / net worth). */
export function getMortgageYourShareOutstandingBalance(
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

/** @alias getMortgageYourShareOutstandingBalance */
export const getMortgageOutstandingBalance = getMortgageYourShareOutstandingBalance;

/** Full mortgage debt (bank statement / amortization). */
export function getMortgageFullOutstandingBalance(
  settings = {},
  snapshots = [],
  liability,
  monthKey = getCurrentMonthKey(),
) {
  const entered = liability?.enteredOutstandingTotal;
  if (
    isLinkedMortgageLiability(liability, settings) &&
    entered != null &&
    Number.isFinite(Number(entered))
  ) {
    return normalizeEuros(entered);
  }
  const share = getMortgageYourShareOutstandingBalance(
    snapshots,
    liability,
    monthKey,
  );
  return mortgageOutstandingShareToTotal(settings, liability, share);
}

/** Snapshot share → total for UI input. */
export function mortgageOutstandingShareToTotal(settings, liability, share) {
  if (share == null || !Number.isFinite(share)) return null;
  if (!isMortgageCapitalShared(settings, liability)) {
    return normalizeEuros(share);
  }
  if (
    liability?.enteredOutstandingTotal != null &&
    Number.isFinite(Number(liability.enteredOutstandingTotal))
  ) {
    return normalizeEuros(liability.enteredOutstandingTotal);
  }
  return totalFromShareEuros(share, getMortgageSharePercent(settings));
}

/** UI total → snapshot share on save. */
export function mortgageOutstandingTotalToShare(settings, liability, total) {
  if (total == null || !Number.isFinite(total)) return null;
  const amount = normalizeEuros(Math.max(0, Number(total) || 0));
  if (!isMortgageCapitalShared(settings, liability)) return amount;
  return applyShareEuros(amount, true, getMortgageSharePercent(settings));
}

/** Preserve exact total the user entered (shared mortgage UI). */
export function mortgageEnteredOutstandingTotal(total) {
  if (total == null || !Number.isFinite(Number(total))) return undefined;
  return normalizeEuros(Math.max(0, Number(total) || 0));
}

/** Share preview from a total the user entered (uses housing % from settings). */
export function getMortgageBalanceShareInfoFromTotal(settings, liability, total) {
  if (total == null || !Number.isFinite(total)) return null;
  if (!isMortgageCapitalShared(settings, liability)) return null;
  const percent = getMortgageSharePercent(settings);
  return {
    yourShare: applyShareEuros(total, true, percent),
    fullTotal: Math.max(0, Number(total) || 0),
    percent,
  };
}

/** Share preview from stored snapshot share. */
export function getMortgageBalanceShareInfo(settings, liability, yourShareBalance) {
  if (yourShareBalance == null || !Number.isFinite(yourShareBalance)) return null;
  if (!isMortgageCapitalShared(settings, liability)) return null;
  const percent = getMortgageSharePercent(settings);
  const fullTotal =
    liability?.enteredOutstandingTotal != null &&
    Number.isFinite(Number(liability.enteredOutstandingTotal))
      ? normalizeEuros(liability.enteredOutstandingTotal)
      : totalFromShareEuros(yourShareBalance, percent);
  return {
    yourShare: yourShareBalance,
    fullTotal,
    percent,
  };
}

/** Monthly payment shown in catalogs: linked mortgage uses Budget → Housing (your share). */
export function getLiabilityMonthlyPaymentDisplay(settings, liability) {
  if (isLinkedMortgageLiability(liability, settings)) {
    return getEffectiveMortgageRent(settings);
  }
  return liability?.monthlyPayment ?? 0;
}

/** Full mortgage installment for amortization (never your budget share). */
export function getMortgageFullMonthlyPayment(settings, liability) {
  if (isLinkedMortgageLiability(liability, settings)) {
    return getMortgageRentTotal(settings);
  }
  return liability?.monthlyPayment ?? 0;
}

/** Your budget share when the linked mortgage is split; null if not shared. */
export function getMortgageYourSharePayment(settings, liability) {
  if (!isLinkedMortgageLiability(liability, settings)) return null;
  if (!settings?.mortgageRentShared) return null;
  const total = getMortgageRentTotal(settings);
  const share = getEffectiveMortgageRent(settings);
  if (total <= 0 || share >= total) return null;
  return {
    amount: share,
    percent: getMortgageSharePercent(settings),
  };
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
