import { getCurrentMonthKey } from './dashboardMetrics.js';
import {
  buildCloseMonthSnapshots,
  resolveSnapshotDateForMonth,
} from './patrimony.js';
import {
  getSnapshotAssetId,
  getSnapshotLiabilityId,
  getSnapshotMonthKey,
} from './snapshotUtils.js';

export function getLiabilityOutstandingFromSnapshots(
  snapshots = [],
  liabilityId,
  monthKey = getCurrentMonthKey(),
) {
  const snap = (snapshots ?? []).find(
    (s) =>
      getSnapshotLiabilityId(s) === liabilityId &&
      getSnapshotMonthKey(s) === monthKey,
  );
  if (snap == null || !Number.isFinite(Number(snap.value))) return null;
  return Math.abs(Number(snap.value) || 0);
}

/** Merge one liability balance into a month's snapshot set. */
export function mergeLiabilityOutstandingSnapshot({
  snapshots = [],
  liabilityId,
  amount,
  monthKey = getCurrentMonthKey(),
  snapshotDate,
}) {
  if (amount == null || amount === '' || !Number.isFinite(Number(amount))) {
    return snapshots.filter(
      (s) =>
        !(
          getSnapshotLiabilityId(s) === liabilityId &&
          getSnapshotMonthKey(s) === monthKey
        ),
    );
  }

  const value = Math.max(0, Number(amount));
  const date = snapshotDate ?? resolveSnapshotDateForMonth(monthKey);
  const otherMonth = snapshots.filter((s) => getSnapshotMonthKey(s) !== monthKey);
  const monthAssetSnaps = snapshots.filter(
    (s) =>
      getSnapshotMonthKey(s) === monthKey && getSnapshotAssetId(s),
  );
  const monthOtherLiabilities = snapshots.filter(
    (s) =>
      getSnapshotMonthKey(s) === monthKey &&
      getSnapshotLiabilityId(s) &&
      getSnapshotLiabilityId(s) !== liabilityId,
  );

  const liabilityRows = [
    ...monthOtherLiabilities.map((s) => ({
      liabilityId: getSnapshotLiabilityId(s),
      value: Math.abs(Number(s.value) || 0),
    })),
    { liabilityId, value },
  ];

  const newMonthSnaps = buildCloseMonthSnapshots({
    assetRows: monthAssetSnaps.map((s) => ({
      assetId: getSnapshotAssetId(s),
      value: Math.max(0, Number(s.value) || 0),
    })),
    liabilityRows,
    snapshotDate: date,
    existingSnapshots: snapshots,
  });

  return [...otherMonth, ...newMonthSnaps];
}
