import { annualToMonthlyRate } from './calculations.js';
import { createContributionEntry } from './contributionEntries.js';
import { isContributionEligibleAsset } from './contributionPlans.js';
import { getSnapshotValueForItem } from './patrimony.js';
import { getAssetAnnualReturn } from './projectionReturns.js';
import { SNAPSHOT_ITEM_TYPE } from './snapshotItemTypes.js';
import { groupSnapshotsByMonth } from './snapshotUtils.js';

function roundMoney(value) {
  return Math.round((value ?? 0) * 100) / 100;
}

export function getPreviousMonthKeyWithData(snapshots, monthKey) {
  const keys = Object.keys(groupSnapshotsByMonth(snapshots))
    .filter((key) => /^\d{4}-\d{2}$/.test(key) && key < monthKey)
    .sort();
  return keys[keys.length - 1] ?? null;
}

export function inferContributionFromBalances({
  previousBalance,
  newBalance,
  asset,
  settings = {},
}) {
  const prev = Math.max(0, Number(previousBalance) || 0);
  const next = Math.max(0, Number(newBalance) || 0);
  const monthlyRate = annualToMonthlyRate(getAssetAnnualReturn(settings, asset));
  const expectedBalance = roundMoney(prev * (1 + monthlyRate));
  const delta = roundMoney(next - prev);
  const estimatedReturn = roundMoney(expectedBalance - prev);
  const amount = roundMoney(Math.max(0, next - expectedBalance));

  return { amount, delta, estimatedReturn, expectedBalance };
}

export function deriveContributionPreviewForAsset({
  snapshots,
  assets = [],
  settings = {},
  monthKey,
  assetId,
  newBalance,
}) {
  const asset = assets.find((item) => item.id === assetId);
  if (!asset || !isContributionEligibleAsset(asset)) return null;

  const prevKey = getPreviousMonthKeyWithData(snapshots, monthKey);
  if (!prevKey) return null;

  const previousBalance =
    getSnapshotValueForItem(snapshots, prevKey, {
      type: SNAPSHOT_ITEM_TYPE.ASSET,
      id: assetId,
    }) ?? 0;

  const inferred = inferContributionFromBalances({
    previousBalance,
    newBalance,
    asset,
    settings,
  });

  if (inferred.delta === 0 && inferred.amount === 0) return null;

  return {
    assetId,
    previousBalance,
    newBalance: Math.max(0, Number(newBalance) || 0),
    ...inferred,
  };
}

export function deriveContributionsForMonth({
  snapshots = [],
  assets = [],
  settings = {},
  monthKey,
  snapshotDate,
  assetBalances,
}) {
  const prevKey = getPreviousMonthKeyWithData(snapshots, monthKey);
  if (!prevKey) return [];

  const grouped = groupSnapshotsByMonth(snapshots);
  const monthSnaps = grouped[monthKey] ?? [];
  const resolvedDate =
    snapshotDate ??
    monthSnaps.find((snap) => snap.snapshotDate)?.snapshotDate ??
    `${monthKey}-28`;

  const entries = [];

  for (const asset of assets.filter(isContributionEligibleAsset)) {
    const newBalance =
      assetBalances?.[asset.id] ??
      getSnapshotValueForItem(snapshots, monthKey, {
        type: SNAPSHOT_ITEM_TYPE.ASSET,
        id: asset.id,
      });
    if (newBalance == null || !Number.isFinite(Number(newBalance))) continue;

    const previousBalance =
      getSnapshotValueForItem(snapshots, prevKey, {
        type: SNAPSHOT_ITEM_TYPE.ASSET,
        id: asset.id,
      }) ?? 0;

    const { amount } = inferContributionFromBalances({
      previousBalance,
      newBalance,
      asset,
      settings,
    });

    if (amount <= 0) continue;

    entries.push(
      createContributionEntry({
        assetId: asset.id,
        date: String(resolvedDate).slice(0, 10),
        amount,
        note: '',
        derived: true,
      }),
    );
  }

  return entries;
}

export function rebuildDerivedContributionEntries({
  snapshots = [],
  assets = [],
  settings = {},
}) {
  const monthKeys = Object.keys(groupSnapshotsByMonth(snapshots))
    .filter((key) => /^\d{4}-\d{2}$/.test(key))
    .sort();

  return monthKeys.flatMap((monthKey) =>
    deriveContributionsForMonth({
      snapshots,
      assets,
      settings,
      monthKey,
    }),
  );
}
