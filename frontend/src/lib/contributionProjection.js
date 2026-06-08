import { sumEuros } from './money.js';
import {
  getAverageContributionsByAsset,
  getLastMonthContributionsByAsset,
  getMonthKeyFromDate,
  resolveEntriesForMonth,
  resolveInvestmentFromBreakdown,
} from './contributionEntries.js';
import {
  PROJECTION_INVESTMENT_CATEGORIES,
  resolveContributionsForMonth,
  resolveInvestmentContributionsForMonth,
} from './contributionPlans.js';

export const PROJECTION_CONTRIBUTION_ASSUMPTION = {
  AVERAGE_3: 'average_3_months',
  LAST_MONTH: 'last_month',
  LEGACY_PLANS: 'legacy_plans',
};

/** Resolve contribution breakdown for one projection month. */
export function resolveContributionsForProjectionMonth({
  entries = [],
  contributionPlans = [],
  assets = [],
  settings = {},
  monthKey,
  monthIndex = 0,
}) {
  const actual = resolveEntriesForMonth(entries, monthKey, assets);
  if (actual.total > 0) return { ...actual, source: 'actual' };

  const assumption =
    settings?.projectionContributionAssumption ??
    PROJECTION_CONTRIBUTION_ASSUMPTION.AVERAGE_3;

  if (assumption === PROJECTION_CONTRIBUTION_ASSUMPTION.LEGACY_PLANS) {
    const legacy = resolveContributionsForMonth(contributionPlans, monthIndex, monthKey);
    return { ...legacy, source: 'legacy_plans' };
  }

  const projected =
    assumption === PROJECTION_CONTRIBUTION_ASSUMPTION.LAST_MONTH
      ? getLastMonthContributionsByAsset(entries, assets, { beforeMonthKey: monthKey })
      : getAverageContributionsByAsset(entries, assets, {
          lookbackMonths: 3,
          beforeMonthKey: monthKey,
        });

  if (projected.total > 0) return { ...projected, source: 'history' };

  const fallback = resolveContributionsForMonth(contributionPlans, monthIndex, monthKey);
  return { ...fallback, source: fallback.total > 0 ? 'legacy_plans' : 'none' };
}

export function resolveInvestmentContributionsForProjectionMonth(params) {
  const { breakdown } = resolveContributionsForProjectionMonth(params);
  return resolveInvestmentFromBreakdown(breakdown);
}

export function hasProjectionContributionData({
  entries = [],
  contributionPlans = [],
} = {}) {
  if ((entries ?? []).some((e) => (e.amount ?? 0) > 0 && e.assetId)) return true;
  return (contributionPlans ?? []).some(
    (p) =>
      p.isActive &&
      PROJECTION_INVESTMENT_CATEGORIES.includes(p.category) &&
      (p.monthlyAmount ?? 0) > 0,
  );
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
