import {
  getSnapshotAssetId,
  getSnapshotLiabilityId,
  getSnapshotMonthKey,
} from './snapshotUtils.js';
import { mapSnapshotRow } from './patrimonyDb.js';

/** Natural key: one snapshot per asset/liability per calendar month. */
export function snapshotNaturalKey(snap) {
  const month = getSnapshotMonthKey(snap);
  const assetId = getSnapshotAssetId(snap);
  const liabilityId = getSnapshotLiabilityId(snap);
  if (assetId && month) return `a:${assetId}:${month}`;
  if (liabilityId && month) return `l:${liabilityId}:${month}`;
  return snap?.id ? `id:${snap.id}` : null;
}

function snapshotDateValue(snap) {
  return String(snap?.snapshotDate ?? snap?.snapshot_date ?? '').slice(0, 10);
}

function pickPreferredSnapshot(prev, next) {
  const prevDate = snapshotDateValue(prev);
  const nextDate = snapshotDateValue(next);
  const preferred = nextDate >= prevDate ? next : prev;
  const other = preferred === next ? prev : next;
  return { ...preferred, id: preferred.id ?? other.id };
}

/** One row per asset/liability + month (latest date wins). */
export function dedupeSnapshots(snapshots = []) {
  const byKey = new Map();
  for (const snap of snapshots) {
    const key = snapshotNaturalKey(snap);
    if (!key) continue;
    const prev = byKey.get(key);
    byKey.set(key, prev ? pickPreferredSnapshot(prev, snap) : snap);
  }
  return [...byKey.values()];
}

export async function upsertSnapshotsToSupabase(supabase, snapshots, userId) {
  const rows = dedupeSnapshots(snapshots).map((s) => mapSnapshotRow(s, userId));
  const assetRows = rows.filter((r) => r.asset_id);
  const liabilityRows = rows.filter((r) => r.liability_id);

  if (assetRows.length) {
    const { error } = await supabase.from('monthly_snapshots').upsert(assetRows, {
      onConflict: 'id',
    });
    if (error) throw error;
  }

  if (liabilityRows.length) {
    const { error } = await supabase
      .from('monthly_snapshots')
      .upsert(liabilityRows, {
        onConflict: 'id',
      });
    if (error) throw error;
  }
}
