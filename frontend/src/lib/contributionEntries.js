import { roundMoney, sumEuros } from './money.js';
import { getAssetAnnualReturn } from './projectionReturns.js';
import { getProjectionAnnualRate } from './projectionRates.js';
import {
  CONTRIBUTION_ELIGIBLE_CATEGORIES,
  isContributionEligibleAsset,
  PROJECTION_INVESTMENT_CATEGORIES,
  resolveLinkedAsset,
} from './contributionPlans.js';

export { isContributionEligibleAsset, resolveLinkedAsset } from './contributionPlans.js';

export function getMonthKeyFromDate(date) {
  return String(date ?? '').slice(0, 7);
}

export function createContributionEntry(partial = {}) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: partial.id ?? crypto.randomUUID?.() ?? `ce-${Date.now()}`,
    assetId: partial.assetId ?? null,
    date: partial.date ?? today,
    amount: partial.amount ?? 0,
    note: partial.note ?? '',
    derived: partial.derived === true,
  };
}

/** All active contribution-eligible assets (multiple entries per asset allowed). */
export function getContributionEntryAssets(assets = []) {
  return (assets ?? []).filter(isContributionEligibleAsset);
}

export function getEntriesForMonth(entries = [], monthKey) {
  if (!monthKey) return [];
  return (entries ?? [])
    .filter((entry) => getMonthKeyFromDate(entry.date) === monthKey)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export function getMonthKeysFromEntries(entries = []) {
  return [...new Set((entries ?? []).map((e) => getMonthKeyFromDate(e.date)).filter(Boolean))].sort(
    (a, b) => b.localeCompare(a),
  );
}

function resolveEntryAsset(entry, assets = []) {
  if (!entry?.assetId) return null;
  return assets.find((a) => a.id === entry.assetId) ?? null;
}

function buildBreakdownFromAmountsByAsset(amountsByAsset, assets = []) {
  const breakdown = [];
  for (const [assetId, amount] of Object.entries(amountsByAsset)) {
    if ((amount ?? 0) <= 0) continue;
    const asset = assets.find((a) => a.id === assetId);
    breakdown.push({
      assetId,
      providerId: asset?.provider ?? 'other',
      category: asset?.category ?? 'other',
      label: asset?.name ?? '',
      amount: roundMoney(amount),
    });
  }
  breakdown.sort((a, b) => a.label.localeCompare(b.label));
  const total = sumEuros(...breakdown.map((b) => b.amount));
  return { total, breakdown };
}

/** Sum real entries for a calendar month. */
export function resolveEntriesForMonth(entries = [], monthKey, assets = []) {
  const monthEntries = getEntriesForMonth(entries, monthKey);
  const amountsByAsset = {};

  for (const entry of monthEntries) {
    const asset = resolveEntryAsset(entry, assets);
    if (!asset || asset.isActive === false) continue;
    if (!CONTRIBUTION_ELIGIBLE_CATEGORIES.includes(asset.category)) continue;
    const amount = Math.max(0, entry.amount ?? 0);
    if (amount <= 0) continue;
    amountsByAsset[asset.id] = (amountsByAsset[asset.id] ?? 0) + amount;
  }

  return buildBreakdownFromAmountsByAsset(amountsByAsset, assets);
}

export function getTotalForMonth(entries = [], monthKey, assets = []) {
  return resolveEntriesForMonth(entries, monthKey, assets).total;
}

export function hasContributionEntries(entries = []) {
  return (entries ?? []).some((entry) => (entry.amount ?? 0) > 0 && entry.assetId);
}

export function hasEntriesInMonth(entries = [], monthKey) {
  return getEntriesForMonth(entries, monthKey).some(
    (entry) => (entry.amount ?? 0) > 0 && entry.assetId,
  );
}

/** Per-asset average over the last N distinct months with entries (before targetMonth). */
export function getAverageContributionsByAsset(
  entries = [],
  assets = [],
  { lookbackMonths = 3, beforeMonthKey } = {},
) {
  const monthKeys = getMonthKeysFromEntries(entries).filter(
    (key) => !beforeMonthKey || key < beforeMonthKey,
  );
  const recentKeys = monthKeys.slice(0, lookbackMonths);
  if (!recentKeys.length) return { total: 0, breakdown: [] };

  const amountsByAsset = {};
  for (const monthKey of recentKeys) {
    const { breakdown } = resolveEntriesForMonth(entries, monthKey, assets);
    for (const item of breakdown) {
      amountsByAsset[item.assetId] = (amountsByAsset[item.assetId] ?? 0) + item.amount;
    }
  }

  const divisor = recentKeys.length;
  const averaged = Object.fromEntries(
    Object.entries(amountsByAsset).map(([assetId, sum]) => [
      assetId,
      roundMoney(sum / divisor),
    ]),
  );

  return buildBreakdownFromAmountsByAsset(averaged, assets);
}

/** Last complete month totals per asset (before targetMonth). */
export function getLastMonthContributionsByAsset(
  entries = [],
  assets = [],
  { beforeMonthKey } = {},
) {
  const monthKeys = getMonthKeysFromEntries(entries).filter(
    (key) => !beforeMonthKey || key < beforeMonthKey,
  );
  const lastKey = monthKeys[0];
  if (!lastKey) return { total: 0, breakdown: [] };
  return resolveEntriesForMonth(entries, lastKey, assets);
}

export function resolveInvestmentFromBreakdown(breakdown = []) {
  return sumEuros(
    ...breakdown
      .filter((item) => PROJECTION_INVESTMENT_CATEGORIES.includes(item.category))
      .map((item) => item.amount),
  );
}

export function getWeightedReturnFromBreakdown(settings, breakdown = [], assets = []) {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const item of breakdown) {
    const amount = item.amount ?? 0;
    if (amount <= 0) continue;
    const asset = assets.find((a) => a.id === item.assetId);
    if (!asset) continue;
    weightedSum += amount * getAssetAnnualReturn(settings, asset);
    weightTotal += amount;
  }

  if (weightTotal <= 0) {
    return { rate: getProjectionAnnualRate(settings), isWeighted: false };
  }

  return { rate: weightedSum / weightTotal, isWeighted: true };
}
