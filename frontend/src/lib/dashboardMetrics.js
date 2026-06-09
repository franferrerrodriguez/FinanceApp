import {
  calcFreeCashflow,
  calcNetWorth,
  calcSavingsRate,
  calcTotalFixedExpenses,
  calcTotalIncome,
  calcTotalVariableExpenses,
} from './calculations.js';
import { sumEuros } from './money.js';
import {
  getAnnualExpensesMonthlyAverage,
  getAnnualExpensesYearlyTotal,
} from './annualExpenses.js';
import {
  computeEmergencyFundMetrics,
  getEmergencyFundAlert,
} from './emergencyFund.js';
import {
  getMonthlyCloseAlert,
  getMonthlyCloseStatus,
} from './monthlyClose.js';
import { SNAPSHOT_ITEM_TYPE } from './snapshotItemTypes.js';
import {
  getSnapshotAssetId,
  getSnapshotLiabilityId,
  groupSnapshotsByMonth,
} from './snapshotUtils.js';

const ASSET_CATEGORY_ORDER = [
  'bank',
  'investment',
  'etf',
  'real_estate',
  'pension',
  'cash',
  'other',
];

export function getCurrentMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getLastNMonthKeys(n = 12, fromDate = new Date()) {
  const keys = [];
  const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  for (let i = n - 1; i >= 0; i--) {
    const month = new Date(d.getFullYear(), d.getMonth() - i, 1);
    keys.push(getCurrentMonthKey(month));
  }
  return keys;
}

export { groupSnapshotsByMonth } from './snapshotUtils.js';

export function calcMonthTotals(monthSnapshots) {
  if (!monthSnapshots?.length) {
    return { netWorth: 0, totalAssets: 0, totalLiabilities: 0 };
  }

  let totalAssets = 0;
  let totalLiabilities = 0;

  const assetValues = [];
  const liabilityValues = [];

  for (const s of monthSnapshots) {
    const value = Number(s.value) || 0;
    if (getSnapshotLiabilityId(s)) {
      liabilityValues.push(value);
    } else {
      assetValues.push(value);
    }
  }

  totalAssets = sumEuros(...assetValues);
  totalLiabilities = sumEuros(...liabilityValues);

  return {
    netWorth: calcNetWorth(monthSnapshots),
    totalAssets,
    totalLiabilities,
  };
}

export function buildNetWorthHistory(snapshots, fallbackPatrimony = 0, months = 12) {
  const monthKeys = getLastNMonthKeys(months);
  const grouped = groupSnapshotsByMonth(snapshots);
  const currentKey = getCurrentMonthKey();
  const hasSnapshots = snapshots.length > 0;

  return monthKeys.map((monthKey) => {
    const monthSnaps = grouped[monthKey];
    if (monthSnaps?.length) {
      return { monthKey, ...calcMonthTotals(monthSnaps) };
    }

    if (!hasSnapshots && monthKey === currentKey) {
      const netWorth = fallbackPatrimony;
      return {
        monthKey,
        netWorth,
        totalAssets: Math.max(0, netWorth),
        totalLiabilities: netWorth < 0 ? netWorth : 0,
      };
    }

    return {
      monthKey,
      netWorth: null,
      totalAssets: null,
      totalLiabilities: null,
    };
  });
}

export function getMonthOverMonthDeltas(history) {
  const withData = history.filter((h) => h.netWorth != null);
  if (withData.length < 2) {
    return { netWorth: null, totalAssets: null, totalLiabilities: null };
  }

  const current = withData[withData.length - 1];
  const previous = withData[withData.length - 2];

  return {
    netWorth: current.netWorth - previous.netWorth,
    totalAssets: (current.totalAssets ?? 0) - (previous.totalAssets ?? 0),
    totalLiabilities:
      (current.totalLiabilities ?? 0) - (previous.totalLiabilities ?? 0),
  };
}

export function calcMonthlyVariationPct(history) {
  const withData = history.filter((h) => h.netWorth != null);
  if (withData.length < 2) return null;

  const current = withData[withData.length - 1];
  const previous = withData[withData.length - 2];
  const denom = Math.abs(previous.netWorth);

  if (denom === 0) return null;

  return ((current.netWorth - previous.netWorth) / denom) * 100;
}

export function getLatestMonthTotals(history) {
  const withData = [...history].reverse().find((h) => h.netWorth != null);
  return (
    withData ?? {
      netWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0,
    }
  );
}

export function buildCashflowSegments(
  income,
  fixedExpenses,
  variableExpenses,
  monthlyInvestment,
) {
  const safeIncome = Math.max(income, 0);
  const fixed = Math.min(fixedExpenses, safeIncome);
  const variable = Math.min(
    variableExpenses,
    Math.max(0, safeIncome - fixed),
  );
  const investment = Math.min(
    monthlyInvestment,
    Math.max(0, safeIncome - fixed - variable),
  );
  const free = calcFreeCashflow(safeIncome, fixed, investment, variable);

  const segments = [
    { key: 'fixed', amount: fixed },
    { key: 'variable', amount: variable },
    { key: 'investment', amount: investment },
    { key: 'free', amount: Math.max(0, free) },
  ];

  const base = safeIncome || 1;

  return segments.map((s) => ({
    ...s,
    percent: (s.amount / base) * 100,
  }));
}

export function buildAssetDistribution(
  snapshots,
  assets,
  monthKey = getCurrentMonthKey(),
) {
  const monthSnaps = groupSnapshotsByMonth(snapshots)[monthKey] ?? [];
  const assetSnaps = monthSnaps.filter((s) => getSnapshotAssetId(s) && !getSnapshotLiabilityId(s));

  if (!assetSnaps.length) return [];

  const assetMap = Object.fromEntries(assets.map((a) => [a.id, a]));
  const byCategory = {};

  for (const snap of assetSnaps) {
    const asset = assetMap[getSnapshotAssetId(snap)];
    const category = asset?.category ?? 'other';
    const value = Math.max(0, Number(snap.value) || 0);
    byCategory[category] = (byCategory[category] ?? 0) + value;
  }

  return ASSET_CATEGORY_ORDER.filter((cat) => byCategory[cat] > 0).map(
    (category) => ({
      category,
      value: byCategory[category],
    }),
  );
}

export function getTopHoldings(
  snapshots,
  assets,
  liabilities,
  limit = 3,
  monthKey = getCurrentMonthKey(),
) {
  const monthSnaps = groupSnapshotsByMonth(snapshots)[monthKey] ?? [];
  const assetMap = Object.fromEntries(assets.map((a) => [a.id, a]));
  const liabilityMap = Object.fromEntries(liabilities.map((l) => [l.id, l]));

  const items = monthSnaps
    .map((snap) => {
      const assetId = getSnapshotAssetId(snap);
      if (assetId) {
        const asset = assetMap[assetId];
        return {
          id: assetId,
          name: asset?.name ?? '—',
          value: Number(snap.value) || 0,
          type: SNAPSHOT_ITEM_TYPE.ASSET,
        };
      }
      const liabilityId = getSnapshotLiabilityId(snap);
      if (liabilityId) {
        const liability = liabilityMap[liabilityId];
        return {
          id: liabilityId,
          name: liability?.name ?? '—',
          value: Number(snap.value) || 0,
          type: SNAPSHOT_ITEM_TYPE.LIABILITY,
        };
      }
      return null;
    })
    .filter(Boolean);

  const topAssets = items
    .filter((i) => i.type === SNAPSHOT_ITEM_TYPE.ASSET)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  const topLiabilities = items
    .filter((i) => i.type === SNAPSHOT_ITEM_TYPE.LIABILITY)
    .sort((a, b) => a.value - b.value)
    .slice(0, limit);

  return { topAssets, topLiabilities };
}

export function getDashboardAlerts({
  income,
  fixedExpenses,
  variableExpenses,
  monthlyInvestment,
  savingsRate,
  netWorth,
  liabilities,
  snapshots,
}) {
  const alerts = [];
  const cashflow = calcFreeCashflow(
    income,
    fixedExpenses,
    monthlyInvestment,
    variableExpenses,
  );

  const hasOutflows =
    monthlyInvestment > 0 || fixedExpenses + variableExpenses > 0;

  if (income <= 0 && hasOutflows) {
    alerts.push({ id: 'missing_income', severity: 'warn' });
  } else if (cashflow < 0) {
    alerts.push({ id: 'negative_cashflow', severity: 'danger' });
  }

  if (income > 0 && savingsRate < 0.1) {
    alerts.push({ id: 'low_savings_rate', severity: 'warn' });
  }

  const creditCardIds = new Set(
    liabilities
      .filter((l) => l.isActive !== false && l.category === 'credit_card')
      .map((l) => l.id),
  );

  if (creditCardIds.size > 0) {
    const hasCardDebt = snapshots.some(
      (s) =>
        creditCardIds.has(getSnapshotLiabilityId(s)) && Number(s.value) < 0,
    );
    const hasCardLiability = liabilities.some(
      (l) =>
        creditCardIds.has(l.id) &&
        (Number(l.monthly_payment) > 0 || Number(l.balance) > 0),
    );
    if (hasCardDebt || (snapshots.length === 0 && hasCardLiability)) {
      alerts.push({ id: 'credit_card_debt', severity: 'warn' });
    }
  }

  if (netWorth < 0) {
    alerts.push({ id: 'negative_net_worth', severity: 'danger' });
  }

  return alerts;
}

export function appendEmergencyFundAlert(alerts, emergencyFund) {
  const alert = getEmergencyFundAlert(emergencyFund);
  if (!alert) return alerts;
  return [alert, ...alerts];
}

export function appendMonthlyCloseAlert(alerts, monthlyCloseStatus, locale = 'es') {
  const alert = getMonthlyCloseAlert(monthlyCloseStatus, locale);
  if (!alert) return alerts;
  return [alert, ...alerts];
}

export function computeDashboardKpis({
  settings,
  snapshots,
  assets,
  liabilities,
  annualExpenses = [],
  locale = 'es',
}) {
  const income = calcTotalIncome(settings);
  const fixedExpenses = calcTotalFixedExpenses(settings);
  const monthlyInvestment =
    settings?.monthlyBudgetInvestment ?? settings?.monthlyInvestmentAmount ?? 0;
  const fallbackPatrimony = settings?.initialPatrimony ?? 0;

  const history = buildNetWorthHistory(snapshots, fallbackPatrimony);
  const latest = getLatestMonthTotals(history);
  const monthlyVariationPct = calcMonthlyVariationPct(history);
  const monthDeltas = getMonthOverMonthDeltas(history);
  const variableExpenses = calcTotalVariableExpenses(settings);
  const savingsRate = calcSavingsRate(
    income,
    fixedExpenses,
    variableExpenses + monthlyInvestment,
  );
  const monthlySavingsAmount = income * savingsRate;
  const cashflow = calcFreeCashflow(
    income,
    fixedExpenses,
    monthlyInvestment,
    variableExpenses,
  );

  const annualExpensesYearly = getAnnualExpensesYearlyTotal(annualExpenses);
  const annualExpensesMonthlyAvg =
    getAnnualExpensesMonthlyAverage(annualExpenses);
  const emergencyFund = computeEmergencyFundMetrics({
    settings,
    snapshots,
    assets,
    annualExpenses,
  });

  const monthlyClose = getMonthlyCloseStatus(snapshots, assets, liabilities);

  const alerts = appendMonthlyCloseAlert(
    appendEmergencyFundAlert(
      getDashboardAlerts({
        income,
        fixedExpenses,
        variableExpenses,
        monthlyInvestment,
        savingsRate,
        netWorth: latest.netWorth,
        liabilities,
        snapshots,
      }),
      emergencyFund,
    ),
    monthlyClose,
    locale,
  );

  return {
    income,
    fixedExpenses,
    variableExpenses,
    monthlyInvestment,
    cashflow,
    savingsRate,
    history,
    latest,
    monthlyVariationPct,
    monthDeltas,
    monthlySavingsAmount,
    annualExpensesYearly,
    annualExpensesMonthlyAvg,
    emergencyFund,
    cashflowSegments: buildCashflowSegments(
      income,
      fixedExpenses,
      variableExpenses,
      monthlyInvestment,
    ),
    assetDistribution: buildAssetDistribution(snapshots, assets),
    topHoldings: getTopHoldings(snapshots, assets, liabilities),
    monthlyClose,
    alerts,
  };
}
