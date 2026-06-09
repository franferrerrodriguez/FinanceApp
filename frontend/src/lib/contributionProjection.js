import { sumEuros } from './money.js';
import {
  getAverageContributionsByAsset,
  getLastMonthContributionsByAsset,
  getMonthKeyFromDate,
  resolveEntriesForMonth,
  resolveInvestmentFromBreakdown,
} from './contributionEntries.js';
import {
  CONTRIBUTION_ELIGIBLE_CATEGORIES,
  PROJECTION_INVESTMENT_CATEGORIES,
  resolveContributionsForMonth,
  resolveInvestmentContributionsForMonth,
} from './contributionPlans.js';
import { getSnapshotValueForItem } from './patrimony.js';
import { SNAPSHOT_ITEM_TYPE } from './snapshotItemTypes.js';
import { groupSnapshotsByMonth } from './snapshotUtils.js';

export const PROJECTION_CONTRIBUTION_ASSUMPTION = {
  AVERAGE_3: 'average_3_months',
  LAST_MONTH: 'last_month',
  LEGACY_PLANS: 'legacy_plans',
};

function roundMoney(value) {
  return Math.round((value ?? 0) * 100) / 100;
}

function getLatestSnapshotMonthKey(snapshots = []) {
  const keys = Object.keys(groupSnapshotsByMonth(snapshots))
    .filter((key) => /^\d{4}-\d{2}$/.test(key))
    .sort();
  return keys[keys.length - 1] ?? null;
}

export function resolveContributionsFromPortfolioWeights({
  assets = [],
  snapshots = [],
  netContribution = 0,
  monthKey,
}) {
  const amount = Math.max(0, netContribution ?? 0);
  if (amount <= 0) return { total: 0, breakdown: [], source: 'none' };

  const referenceMonthKey = monthKey ?? getLatestSnapshotMonthKey(snapshots);
  if (!referenceMonthKey) return { total: 0, breakdown: [], source: 'none' };

  const eligibleAssets = (assets ?? []).filter(
    (asset) =>
      asset.isActive !== false &&
      CONTRIBUTION_ELIGIBLE_CATEGORIES.includes(asset.category),
  );

  const weighted = eligibleAssets
    .map((asset) => {
      const balance =
        getSnapshotValueForItem(snapshots, referenceMonthKey, {
          type: SNAPSHOT_ITEM_TYPE.ASSET,
          id: asset.id,
        }) ?? 0;
      return { asset, balance: Math.max(0, Number(balance) || 0) };
    })
    .filter((item) => item.balance > 0);

  const weightTotal = sumEuros(...weighted.map((item) => item.balance));
  if (weightTotal <= 0) return { total: 0, breakdown: [], source: 'none' };

  const breakdown = weighted.map(({ asset, balance }) => ({
    assetId: asset.id,
    providerId: asset.provider ?? 'other',
    category: asset.category ?? 'other',
    label: asset.name ?? '',
    amount: roundMoney(amount * (balance / weightTotal)),
  }));

  breakdown.sort((a, b) => a.label.localeCompare(b.label));
  return {
    total: roundMoney(sumEuros(...breakdown.map((item) => item.amount))),
    breakdown,
    source: 'portfolio_weights',
  };
}

/** Resolve contribution breakdown for one projection month. */
export function resolveContributionsForProjectionMonth({
  entries = [],
  contributionPlans = [],
  assets = [],
  settings = {},
  snapshots = [],
  monthKey,
  monthIndex = 0,
  netContribution = 0,
}) {
  const actual = resolveEntriesForMonth(entries, monthKey, assets);
  if (actual.total > 0) {
    return {
      ...actual,
      source: entries.some((entry) => entry.derived)
        ? 'derived'
        : 'actual',
    };
  }

  const assumption =
    settings?.projectionContributionAssumption ??
    PROJECTION_CONTRIBUTION_ASSUMPTION.AVERAGE_3;

  if (assumption === PROJECTION_CONTRIBUTION_ASSUMPTION.LEGACY_PLANS) {
    const legacy = resolveContributionsForMonth(contributionPlans, monthIndex, monthKey);
    if (legacy.total > 0) return { ...legacy, source: 'legacy_plans' };
  }

  const projected =
    assumption === PROJECTION_CONTRIBUTION_ASSUMPTION.LAST_MONTH
      ? getLastMonthContributionsByAsset(entries, assets, { beforeMonthKey: monthKey })
      : getAverageContributionsByAsset(entries, assets, {
          lookbackMonths: 3,
          beforeMonthKey: monthKey,
        });

  if (projected.total > 0) {
    return {
      ...projected,
      source: entries.some((entry) => entry.derived) ? 'derived_history' : 'history',
    };
  }

  const fallback = resolveContributionsForMonth(contributionPlans, monthIndex, monthKey);
  if (fallback.total > 0) return { ...fallback, source: 'legacy_plans' };

  return resolveContributionsFromPortfolioWeights({
    assets,
    snapshots,
    netContribution,
    monthKey: getLatestSnapshotMonthKey(snapshots),
  });
}

export function resolveInvestmentContributionsForProjectionMonth(params) {
  const { breakdown } = resolveContributionsForProjectionMonth(params);
  return resolveInvestmentFromBreakdown(breakdown);
}

export function hasProjectionContributionData({
  entries = [],
  contributionPlans = [],
  assets = [],
  snapshots = [],
} = {}) {
  if ((entries ?? []).some((e) => (e.amount ?? 0) > 0 && e.assetId)) return true;
  if (
    (contributionPlans ?? []).some(
      (p) =>
        p.isActive &&
        PROJECTION_INVESTMENT_CATEGORIES.includes(p.category) &&
        (p.monthlyAmount ?? 0) > 0,
    )
  ) {
    return true;
  }

  const monthKey = getLatestSnapshotMonthKey(snapshots);
  if (!monthKey) return false;

  return (assets ?? []).some((asset) => {
    if (asset.isActive === false) return false;
    if (!CONTRIBUTION_ELIGIBLE_CATEGORIES.includes(asset.category)) return false;
    const balance =
      getSnapshotValueForItem(snapshots, monthKey, {
        type: SNAPSHOT_ITEM_TYPE.ASSET,
        id: asset.id,
      }) ?? 0;
    return balance > 0;
  });
}

/** Dashboard / legacy sync: last month real total, else plan total. */
export function getEffectiveMonthlyInvestmentAmount({
  entries = [],
  contributionPlans = [],
  assets = [],
  monthKey,
} = {}) {
  const key = monthKey ?? getMonthKeyFromDate(new Date());
  const actual = resolveInvestmentFromBreakdown(
    resolveEntriesForMonth(entries, key, assets).breakdown,
  );
  if (actual > 0) return actual;
  return resolveInvestmentContributionsForMonth(contributionPlans, 0, key);
}

export function monthKeyFromProjectionDate(date) {
  return getMonthKeyFromDate(date);
}
