import { getCurrentMonthKey, groupSnapshotsByMonth } from './dashboardMetrics.js';
import {
  calcTotalFixedExpenses,
  calcTotalVariableExpenses,
} from './calculations.js';
import { getAnnualExpensesMonthlyAverage } from './annualExpenses.js';
import { sumEuros } from './money.js';

const LIQUID_CATEGORIES = new Set(['bank', 'cash']);

export function calcMonthlyExpenseBaseline(settings, annualExpenses = []) {
  return sumEuros(
    calcTotalFixedExpenses(settings),
    calcTotalVariableExpenses(settings),
    getAnnualExpensesMonthlyAverage(annualExpenses),
  );
}

export function getLiquidCashFromSnapshots(snapshots, assets) {
  const monthKey = getCurrentMonthKey();
  const monthSnaps = groupSnapshotsByMonth(snapshots)[monthKey] ?? [];
  const assetMap = Object.fromEntries((assets ?? []).map((a) => [a.id, a]));

  return sumEuros(
    ...monthSnaps
      .filter((s) => s.asset_id && !s.liability_id)
      .map((s) => {
        const category = assetMap[s.asset_id]?.category;
        if (!LIQUID_CATEGORIES.has(category)) return 0;
        return Math.max(0, Number(s.value) || 0);
      }),
  );
}

export function computeEmergencyFundMetrics({
  settings,
  snapshots = [],
  assets = [],
  annualExpenses = [],
}) {
  const monthsTarget = Math.max(1, settings?.emergencyFundMonths ?? 6);
  const monthlyExpenses = calcMonthlyExpenseBaseline(settings, annualExpenses);
  const targetAmount = monthlyExpenses * monthsTarget;
  const liquid = getLiquidCashFromSnapshots(snapshots, assets);
  const hasSnapshots = (snapshots ?? []).some((s) => s.asset_id && !s.liability_id);

  const monthsCovered =
    monthlyExpenses > 0 ? liquid / monthlyExpenses : liquid > 0 ? Infinity : 0;

  let status = 'good';
  if (!hasSnapshots) status = 'unavailable';
  else if (monthsCovered < 3) status = 'danger';
  else if (monthsCovered < 6) status = 'warn';

  const progress =
    targetAmount > 0 ? Math.min(1, liquid / targetAmount) : liquid > 0 ? 1 : 0;

  return {
    monthsTarget,
    monthlyExpenses,
    targetAmount,
    liquid,
    monthsCovered,
    progress,
    status,
    hasSnapshots,
  };
}
