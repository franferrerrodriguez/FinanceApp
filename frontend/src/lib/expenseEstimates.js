import {
  getEffectiveGroceries,
  getHouseholdExpenses,
  getLeisureExpenses,
  getMortgageRentTotal,
} from './calculations';

/** Some amounts are indicative averages (simple view or leisure). */
export function hasEstimatedFixedExpenses(settings) {
  if (!settings) return false;

  if (!settings.useDetailedExpenses) {
    return (
      getMortgageRentTotal(settings) > 0 ||
      getHouseholdExpenses(settings) > 0 ||
      getEffectiveGroceries(settings) > 0 ||
      getLeisureExpenses(settings) > 0
    );
  }

  return (
    (settings.utilities ?? 0) > 0 ||
    (settings.insurance ?? 0) > 0 ||
    (settings.subscriptions ?? 0) > 0 ||
    (settings.otherFixedExpenses ?? 0) > 0 ||
    getEffectiveGroceries(settings) > 0 ||
    getLeisureExpenses(settings) > 0
  );
}
