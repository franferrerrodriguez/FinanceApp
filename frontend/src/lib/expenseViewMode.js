import { getHouseholdTotal } from './calculations.js';
import { allocateEurosByWeights } from './money.js';

/** Detect legacy auto-split (40/35/15/10) so we can clear invented breakdown. */
export function isLikelyAutoAllocatedBreakdown(settings) {
  const total = settings?.householdFixedEstimate ?? 0;
  if (total <= 0) return false;

  const parts = [
    settings.utilities ?? 0,
    settings.insurance ?? 0,
    settings.subscriptions ?? 0,
    settings.otherFixedExpenses ?? 0,
  ];
  const sum = parts.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - total) > 0.01) return false;

  const expected = allocateEurosByWeights(total, [40, 35, 15, 10]);
  return parts.every((v, i) => Math.abs(v - expected[i]) < 0.01);
}

/** Toggle simple ↔ detailed household; never invent breakdown amounts. */
export function patchExpenseViewMode(settings, useDetailedExpenses) {
  if (useDetailedExpenses) {
    if (isLikelyAutoAllocatedBreakdown(settings)) {
      return {
        useDetailedExpenses: true,
        utilities: 0,
        insurance: 0,
        subscriptions: 0,
        otherFixedExpenses: 0,
      };
    }
    return { useDetailedExpenses: true };
  }

  const total = getHouseholdTotal({
    ...settings,
    useDetailedExpenses: true,
  });

  return {
    useDetailedExpenses: false,
    householdFixedEstimate: total,
    householdFixedIsEstimate: true,
  };
}
