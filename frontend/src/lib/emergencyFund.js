import { BALANCE_TAB, balancePath } from './balanceTabs.js';
import { getCurrentMonthKey } from './dashboardMetrics.js';
import {
  getSnapshotAssetId,
  groupSnapshotsByMonth,
} from './snapshotUtils.js';
import {
  calcTotalFixedExpenses,
  calcTotalVariableExpenses,
} from './calculations.js';
import { getAnnualExpensesMonthlyAverage } from './annualExpenses.js';
import { sumEuros } from './money.js';
import {
  EMERGENCY_FUND_MONTH_OPTIONS,
  EMERGENCY_FUND_RECOMMENDED_MONTHS,
} from './constants.js';

export { EMERGENCY_FUND_MONTH_OPTIONS, EMERGENCY_FUND_RECOMMENDED_MONTHS };

/** Month options for UI, keeping any persisted value not in the default list. */
export function buildEmergencyFundMonthOptions(currentMonths) {
  const set = new Set(EMERGENCY_FUND_MONTH_OPTIONS);
  const n = Number(currentMonths);
  if (Number.isFinite(n) && n >= 1) set.add(Math.round(n));
  return [...set].sort((a, b) => a - b);
}

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
      .filter((s) => getSnapshotAssetId(s))
      .map((s) => {
        const category = assetMap[getSnapshotAssetId(s)]?.category;
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
  const hasSnapshots = (snapshots ?? []).some((s) => getSnapshotAssetId(s));

  const monthsCovered =
    monthlyExpenses > 0 ? liquid / monthlyExpenses : liquid > 0 ? Infinity : 0;

  const progress =
    targetAmount > 0 ? Math.min(1, liquid / targetAmount) : liquid > 0 ? 1 : 0;
  const shortfall = Math.max(0, targetAmount - liquid);

  let status = 'good';
  if (!hasSnapshots) status = 'unavailable';
  else if (liquid >= targetAmount) status = 'good';
  else if (monthsCovered < 1 || progress < 0.25) status = 'danger';
  else status = 'warn';

  return {
    monthsTarget,
    monthlyExpenses,
    targetAmount,
    liquid,
    monthsCovered,
    progress,
    shortfall,
    status,
    hasSnapshots,
  };
}

/**
 * Alert when liquid cash (bank + cash) is below the configured emergency fund goal.
 */
export function getEmergencyFundAlert(metrics) {
  if (!metrics) return null;

  if (!metrics.hasSnapshots) {
    return {
      id: 'emergency_fund_no_data',
      severity: 'warn',
      href: balancePath(BALANCE_TAB.PATRIMONY),
    };
  }

  if (metrics.targetAmount <= 0 || metrics.monthlyExpenses <= 0) {
    return null;
  }

  if (metrics.liquid >= metrics.targetAmount) {
    return null;
  }

  const monthsCoveredLabel = formatMonthsForAlert(metrics.monthsCovered);
  const params = {
    liquid: metrics.liquid,
    target: metrics.targetAmount,
    shortfall: metrics.shortfall,
    months: metrics.monthsTarget,
    monthsCovered: monthsCoveredLabel,
  };

  if (metrics.status === 'danger') {
    return {
      id: 'emergency_fund_critical',
      severity: 'danger',
      params,
      href: balancePath(BALANCE_TAB.CASHFLOW),
    };
  }

  return {
    id: 'emergency_fund_below_target',
    severity: 'warn',
    params,
    href: balancePath(BALANCE_TAB.CASHFLOW),
  };
}

function formatMonthsForAlert(value) {
  if (!Number.isFinite(value)) return '0';
  if (value >= 99) return '99+';
  return (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, '');
}
