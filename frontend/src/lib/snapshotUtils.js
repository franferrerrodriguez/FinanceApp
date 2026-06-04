/** Normalized access for in-memory snapshots (camelCase) and legacy snake_case. */

export function getSnapshotMonthKey(snap) {
  const raw = snap?.snapshotDate ?? snap?.snapshot_date ?? snap?.date ?? '';
  return String(raw).slice(0, 7);
}

export function getSnapshotAssetId(snap) {
  return snap?.assetId ?? snap?.asset_id ?? null;
}

export function getSnapshotLiabilityId(snap) {
  return snap?.liabilityId ?? snap?.liability_id ?? null;
}

export function isAssetSnapshot(snap) {
  return Boolean(getSnapshotAssetId(snap)) && !getSnapshotLiabilityId(snap);
}

export function isLiabilitySnapshot(snap) {
  return Boolean(getSnapshotLiabilityId(snap));
}

export function groupSnapshotsByMonth(snapshots) {
  return (snapshots ?? []).reduce((acc, snap) => {
    const key = getSnapshotMonthKey(snap);
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(snap);
    return acc;
  }, {});
}

export function getMonthEndDate(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return monthKey;
  const last = new Date(y, m, 0);
  const yyyy = last.getFullYear();
  const mm = String(last.getMonth() + 1).padStart(2, '0');
  const dd = String(last.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
