import { calcMonthTotals } from './dashboardMetrics.js';
import { SNAPSHOT_ITEM_TYPE } from './snapshotItemTypes.js';
import {
  getSnapshotAssetId,
  getSnapshotLiabilityId,
  groupSnapshotsByMonth,
} from './snapshotUtils.js';
import { sumEuros } from './money.js';

export const CLOSE_ASSET_GROUP = {
  LIQUIDITY: 'liquidity',
  INVESTMENTS: 'investments',
};

const LIQUIDITY_CATEGORIES = new Set(['bank', 'cash', 'real_estate', 'other']);
const INVESTMENT_CATEGORIES = new Set(['investment', 'pension', 'etf']);

export function getAssetCloseGroup(category) {
  if (INVESTMENT_CATEGORIES.has(category)) return CLOSE_ASSET_GROUP.INVESTMENTS;
  return CLOSE_ASSET_GROUP.LIQUIDITY;
}

export function groupActiveAssetsForClose(assets) {
  const active = (assets ?? []).filter((a) => a.isActive !== false);
  const liquidity = [];
  const investments = [];
  for (const asset of active) {
    if (getAssetCloseGroup(asset.category) === CLOSE_ASSET_GROUP.INVESTMENTS) {
      investments.push(asset);
    } else if (LIQUIDITY_CATEGORIES.has(asset.category)) {
      liquidity.push(asset);
    } else {
      liquidity.push(asset);
    }
  }
  return { liquidity, investments };
}

export function findMostRecentMonthWithItem(snapshots, beforeMonthKey, item) {
  const keys = Object.keys(groupSnapshotsByMonth(snapshots))
    .filter((k) => /^\d{4}-\d{2}$/.test(k) && k < beforeMonthKey)
    .sort()
    .reverse();
  for (const mk of keys) {
    const snaps = groupSnapshotsByMonth(snapshots)[mk] ?? [];
    const found = snaps.some((s) => {
      if (item.type === SNAPSHOT_ITEM_TYPE.ASSET) {
        return getSnapshotAssetId(s) === item.id;
      }
      return getSnapshotLiabilityId(s) === item.id;
    });
    if (found) return mk;
  }
  return null;
}

export function getSnapshotGainLoss(snapshots, monthKey, item) {
  const grouped = groupSnapshotsByMonth(snapshots);
  const monthSnaps = grouped[monthKey] ?? [];
  const snap = monthSnaps.find((s) => {
    if (item.type === SNAPSHOT_ITEM_TYPE.ASSET) {
      return getSnapshotAssetId(s) === item.id;
    }
    return getSnapshotLiabilityId(s) === item.id;
  });
  if (snap?.gainLossEuros != null && Number.isFinite(Number(snap.gainLossEuros))) {
    return Number(snap.gainLossEuros);
  }
  return null;
}

export function getReferenceMonthNetWorth(
  snapshots,
  assets,
  liabilities,
  monthKey,
) {
  const activeAssets = (assets ?? []).filter((a) => a.isActive !== false);
  const activeLiabilities = (liabilities ?? []).filter((l) => l.isActive !== false);
  const keys = Object.keys(groupSnapshotsByMonth(snapshots))
    .filter((k) => /^\d{4}-\d{2}$/.test(k) && k < monthKey)
    .sort()
    .reverse();

  for (const mk of keys) {
    const monthSnaps = groupSnapshotsByMonth(snapshots)[mk] ?? [];
    if (!monthSnaps.length) continue;
    let hasAll = true;
    for (const asset of activeAssets) {
      if (!monthSnaps.some((s) => getSnapshotAssetId(s) === asset.id)) {
        hasAll = false;
        break;
      }
    }
    if (!hasAll) continue;
    for (const liability of activeLiabilities) {
      if (!monthSnaps.some((s) => getSnapshotLiabilityId(s) === liability.id)) {
        hasAll = false;
        break;
      }
    }
    if (!hasAll) continue;
    return calcMonthTotals(
      monthSnaps.map((s) => ({
        value: s.value,
        asset_id: getSnapshotAssetId(s),
        liability_id: getSnapshotLiabilityId(s),
      })),
    ).netWorth;
  }
  return null;
}

export function computeDraftNetWorth(assetRows, liabilityRows) {
  const assets = sumEuros(
    ...(assetRows ?? []).map((r) => Number(r.value) || 0),
  );
  const liabilities = sumEuros(
    ...(liabilityRows ?? []).map((r) => Number(r.value) || 0),
  );
  return assets - liabilities;
}

export function sumDraftGroupAssets(assetRows, assets, group) {
  const ids = new Set(
    (assets ?? [])
      .filter((a) => getAssetCloseGroup(a.category) === group)
      .map((a) => a.id),
  );
  return sumEuros(
    ...(assetRows ?? [])
      .filter((r) => ids.has(r.assetId))
      .map((r) => Number(r.value) || 0),
  );
}

export function sumDraftLiabilities(liabilityRows) {
  return sumEuros(
    ...(liabilityRows ?? []).map((r) => Number(r.value) || 0),
  );
}

export function isInvestmentAssetCategory(category) {
  return INVESTMENT_CATEGORIES.has(category);
}

export function defaultTracksGainLossForCategory(category) {
  return INVESTMENT_CATEGORIES.has(category);
}

export function assetTracksGainLoss(asset) {
  if (asset?.tracksGainLoss != null) return Boolean(asset.tracksGainLoss);
  return defaultTracksGainLossForCategory(asset?.category);
}

/** Rough principal paydown: cuota − intereses mensuales estimados. */
export function estimateMortgageMonthlyDrop(liability, outstandingBalance) {
  const payment = Math.max(0, Number(liability?.monthlyPayment) || 0);
  const balance = Math.max(0, Number(outstandingBalance) || 0);
  const rate = Number(liability?.interestRate) || 0;
  if (payment <= 0 || balance <= 0) return null;
  const monthlyInterest = balance * (rate / 12);
  const principal = payment - monthlyInterest;
  return principal > 0 ? principal : null;
}

export function canQuickSaveAllSame(assetRows, liabilityRows) {
  const rows = [...(assetRows ?? []), ...(liabilityRows ?? [])];
  if (!rows.length) return false;
  return rows.every(
    (r) => r.prefillSource === 'previous' && !r.modified && r.value != null,
  );
}

export function allCloseRowsFilled(assetRows, liabilityRows) {
  const rows = [...(assetRows ?? []), ...(liabilityRows ?? [])];
  if (!rows.length) return false;
  return rows.every(
    (r) => r.value != null && Number.isFinite(Number(r.value)),
  );
}

export function hasEmptyCloseRows(assetRows, liabilityRows) {
  return [...(assetRows ?? []), ...(liabilityRows ?? [])].some(
    (r) => r.value == null || !Number.isFinite(Number(r.value)),
  );
}

/** Empty rows → 0; prefilled and user-edited rows are kept. */
export function fillEmptyCloseRows(assetRows, liabilityRows) {
  const fill = (rows) =>
    (rows ?? []).map((r) =>
      r.modified || (r.value != null && Number.isFinite(Number(r.value)))
        ? r
        : { ...r, value: 0 },
    );
  return {
    assetRows: fill(assetRows),
    liabilityRows: fill(liabilityRows),
  };
}

export function computeGainLossBreakdown(balance, gainLossEuros) {
  const bal = Number(balance) || 0;
  const gain = gainLossEuros == null ? null : Number(gainLossEuros);
  if (gain == null || !Number.isFinite(gain)) return null;
  const contributed = bal - gain;
  const pct =
    contributed !== 0 ? (gain / contributed) * 100 : gain === 0 ? 0 : null;
  return { contributed, gain, pct };
}
