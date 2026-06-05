import {
  ASSET_CATEGORY_VALUES,
  LIABILITY_CATEGORY_VALUES,
} from './constants.js';
import { calcMonthTotals, getCurrentMonthKey, getLastNMonthKeys } from './dashboardMetrics.js';
import { SNAPSHOT_ITEM_TYPE } from './snapshotItemTypes.js';
import {
  getMonthEndDate,
  getTodayIsoDate,
  getSnapshotAssetId,
  getSnapshotLiabilityId,
  getSnapshotMonthKey,
  groupSnapshotsByMonth,
} from './snapshotUtils.js';

export { ASSET_CATEGORY_VALUES, LIABILITY_CATEGORY_VALUES };
export { SNAPSHOT_ITEM_TYPE };

const createId = () =>
  crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function createAsset(partial = {}) {
  return {
    id: partial.id ?? createId(),
    name: partial.name?.trim() ?? '',
    category: partial.category ?? 'bank',
    provider: partial.provider?.trim() ?? '',
    notes: partial.notes?.trim() ?? '',
    customAnnualReturn:
      partial.customAnnualReturn === undefined
        ? null
        : partial.customAnnualReturn,
    isActive: partial.isActive !== false,
  };
}

export function createLiability(partial = {}) {
  return {
    id: partial.id ?? createId(),
    name: partial.name?.trim() ?? '',
    category: partial.category ?? 'personal_loan',
    monthlyPayment: Math.max(0, partial.monthlyPayment ?? 0),
    interestRate:
      partial.interestRate != null && Number.isFinite(Number(partial.interestRate))
        ? Number(partial.interestRate)
        : undefined,
    isActive: partial.isActive !== false,
  };
}

export function getActiveAssets(assets) {
  return (assets ?? []).filter((a) => a.isActive !== false);
}

export function getActiveLiabilities(liabilities) {
  return (liabilities ?? []).filter((l) => l.isActive !== false);
}

export function getSnapshotValueForItem(snapshots, monthKey, item) {
  const grouped = groupSnapshotsByMonth(snapshots);
  const monthSnaps = grouped[monthKey] ?? [];
  const snap = monthSnaps.find((s) => {
    if (item.type === SNAPSHOT_ITEM_TYPE.ASSET) {
      return getSnapshotAssetId(s) === item.id;
    }
    return getSnapshotLiabilityId(s) === item.id;
  });
  return snap != null ? Number(snap.value) : null;
}

/** Prefill close form: current month → previous month → 0. */
export function buildMonthlyCloseDrafts({
  assets,
  liabilities,
  snapshots,
  monthKey = getCurrentMonthKey(),
  asOfDate,
}) {
  const keys = getLastNMonthKeys(24);
  const idx = keys.indexOf(monthKey);
  const prevKey = idx > 0 ? keys[idx - 1] : null;

  const assetRows = getActiveAssets(assets).map((asset) => {
    let value =
      getSnapshotValueForItem(snapshots, monthKey, {
        type: SNAPSHOT_ITEM_TYPE.ASSET,
        id: asset.id,
      }) ??
      (prevKey
        ? getSnapshotValueForItem(snapshots, prevKey, {
            type: SNAPSHOT_ITEM_TYPE.ASSET,
            id: asset.id,
          })
        : null);
    if (value == null || !Number.isFinite(value)) value = 0;
    return { assetId: asset.id, value: Math.max(0, value) };
  });

  const liabilityRows = getActiveLiabilities(liabilities).map((liability) => {
    let raw =
      getSnapshotValueForItem(snapshots, monthKey, {
        type: SNAPSHOT_ITEM_TYPE.LIABILITY,
        id: liability.id,
      }) ??
      (prevKey
        ? getSnapshotValueForItem(snapshots, prevKey, {
            type: SNAPSHOT_ITEM_TYPE.LIABILITY,
            id: liability.id,
          })
        : null);
    if (raw == null || !Number.isFinite(raw)) raw = 0;
    const amount = Math.abs(raw);
    return { liabilityId: liability.id, value: amount };
  });

  const snapshotDate = resolveSnapshotDateForMonth(monthKey, asOfDate);

  return { assetRows, liabilityRows, snapshotDate };
}

/** Current calendar month → today; past months → last day of month. */
export function resolveSnapshotDateForMonth(monthKey, asOfDate) {
  if (asOfDate === 'today') return getTodayIsoDate();
  if (asOfDate) return asOfDate;
  return monthKey === getCurrentMonthKey()
    ? getTodayIsoDate()
    : getMonthEndDate(monthKey);
}

function getLatestSnapshotDateInMonth(snapshots, monthKey) {
  const monthSnaps = groupSnapshotsByMonth(snapshots)[monthKey] ?? [];
  if (!monthSnaps.length) return null;
  let latest = '';
  for (const snap of monthSnaps) {
    const d = String(snap.snapshotDate ?? '').slice(0, 10);
    if (d && d > latest) latest = d;
  }
  return latest || null;
}

export function buildCloseMonthSnapshots({ assetRows, liabilityRows, snapshotDate }) {
  const snaps = [];
  for (const row of assetRows ?? []) {
    snaps.push({
      id: createId(),
      assetId: row.assetId,
      snapshotDate,
      value: Math.max(0, Number(row.value) || 0),
    });
  }
  for (const row of liabilityRows ?? []) {
    const amount = Math.max(0, Number(row.value) || 0);
    snaps.push({
      id: createId(),
      liabilityId: row.liabilityId,
      snapshotDate,
      value: amount > 0 ? -amount : 0,
    });
  }
  return snaps;
}

export function buildCurrentBalanceRows(
  assets,
  liabilities,
  snapshots,
  monthKey = getCurrentMonthKey(),
) {
  const rows = [
    ...getActiveAssets(assets).map((asset) => {
      const raw = getSnapshotValueForItem(snapshots, monthKey, {
        type: SNAPSHOT_ITEM_TYPE.ASSET,
        id: asset.id,
      });
      return {
        id: asset.id,
        kind: SNAPSHOT_ITEM_TYPE.ASSET,
        name: asset.name,
        category: asset.category,
        provider: asset.provider,
        balance: raw,
        hasBalance: raw != null && Number.isFinite(raw),
      };
    }),
    ...getActiveLiabilities(liabilities).map((liability) => {
      const raw = getSnapshotValueForItem(snapshots, monthKey, {
        type: SNAPSHOT_ITEM_TYPE.LIABILITY,
        id: liability.id,
      });
      const balance = raw == null ? null : Math.abs(Number(raw) || 0);
      return {
        id: liability.id,
        kind: SNAPSHOT_ITEM_TYPE.LIABILITY,
        name: liability.name,
        category: liability.category,
        provider: null,
        balance,
        hasBalance: raw != null && Number.isFinite(raw),
      };
    }),
  ];

  return {
    rows,
    hasAnyBalance: rows.some((row) => row.hasBalance),
  };
}

export function getCurrentPatrimonySummary(snapshots, monthKey = getCurrentMonthKey()) {
  const grouped = groupSnapshotsByMonth(snapshots);
  const monthSnaps = grouped[monthKey] ?? [];
  if (!monthSnaps.length) {
    return { netWorth: null, totalAssets: null, totalLiabilities: null, hasClose: false };
  }
  const totals = calcMonthTotals(
    monthSnaps.map((s) => ({
      value: s.value,
      asset_id: getSnapshotAssetId(s),
      liability_id: getSnapshotLiabilityId(s),
    })),
  );
  return {
    ...totals,
    hasClose: true,
    asOfDate: getLatestSnapshotDateInMonth(snapshots, monthKey),
  };
}

/** Rolling window plus any month that already has saved balances. */
export function resolvePatrimonyHistoryMonthKeys(snapshots, months = 12) {
  const rolling = getLastNMonthKeys(months);
  const dataMonths = Object.keys(groupSnapshotsByMonth(snapshots)).filter((key) =>
    /^\d{4}-\d{2}$/.test(key),
  );
  const currentKey = getCurrentMonthKey();
  const merged = [...new Set([...rolling, ...dataMonths, currentKey])].sort();

  const maxColumns = Math.max(months, dataMonths.length + 1, 12);
  if (merged.length <= maxColumns) return merged;
  return merged.slice(-maxColumns);
}

export function buildPatrimonyHistoryTable({
  assets,
  liabilities,
  snapshots,
  months = 12,
}) {
  const monthKeys = resolvePatrimonyHistoryMonthKeys(snapshots, months);
  const activeAssets = getActiveAssets(assets);
  const activeLiabilities = getActiveLiabilities(liabilities);

  const itemRows = [
    ...activeAssets.map((a) => ({
      id: a.id,
      type: SNAPSHOT_ITEM_TYPE.ASSET,
      name: a.name,
      category: a.category,
      sublabel: a.provider,
    })),
    ...activeLiabilities.map((l) => ({
      id: l.id,
      type: SNAPSHOT_ITEM_TYPE.LIABILITY,
      name: l.name,
      category: l.category,
      sublabel: null,
    })),
  ];

  const valueGrid = itemRows.map((item) => {
    const values = monthKeys.map((mk) => {
      const raw = getSnapshotValueForItem(snapshots, mk, item);
      return raw;
    });
    return { item, values };
  });

  const monthTotals = monthKeys.map((mk) => {
    const grouped = groupSnapshotsByMonth(snapshots);
    const snaps = grouped[mk] ?? [];
    if (!snaps.length) {
      return { netWorth: null, totalAssets: null, totalLiabilities: null };
    }
    return calcMonthTotals(
      snaps.map((s) => ({
        value: s.value,
        asset_id: getSnapshotAssetId(s),
        liability_id: getSnapshotLiabilityId(s),
      })),
    );
  });

  const categoryTotals = ASSET_CATEGORY_VALUES.map((cat) => ({
    category: cat,
    values: monthKeys.map((mk) => {
      let sum = 0;
      let any = false;
      for (const row of valueGrid) {
        if (
          row.item.type !== SNAPSHOT_ITEM_TYPE.ASSET ||
          row.item.category !== cat
        ) {
          continue;
        }
        const v = row.values[monthKeys.indexOf(mk)];
        if (v != null) {
          any = true;
          sum += v;
        }
      }
      return any ? sum : null;
    }),
  })).filter((row) => row.values.some((v) => v != null));

  return { monthKeys, valueGrid, monthTotals, categoryTotals };
}

export { formatMonthKey, formatMonthKeyLabel } from '../utils/monthLabel.js';
