import {
  getSnapshotAssetId,
  getSnapshotLiabilityId,
} from './snapshotUtils.js';
import { mapSnapshotRow } from './patrimonyDb.js';

/** Natural key for monthly_snapshots unique constraints. */
export function snapshotNaturalKey(snap) {
  const date = String(snap?.snapshotDate ?? snap?.snapshot_date ?? '').slice(
    0,
    10,
  );
  const assetId = getSnapshotAssetId(snap);
  const liabilityId = getSnapshotLiabilityId(snap);
  if (assetId && date) return `a:${assetId}:${date}`;
  if (liabilityId && date) return `l:${liabilityId}:${date}`;
  return snap?.id ? `id:${snap.id}` : null;
}

/** One row per asset/liability + date (last wins). Fixes duplicate-id cloud conflicts. */
export function dedupeSnapshots(snapshots = []) {
  const byKey = new Map();
  for (const snap of snapshots) {
    const key = snapshotNaturalKey(snap);
    if (!key) continue;
    byKey.set(key, snap);
  }
  return [...byKey.values()];
}

export async function upsertSnapshotsToSupabase(supabase, snapshots, userId) {
  const rows = dedupeSnapshots(snapshots).map((s) => mapSnapshotRow(s, userId));
  const assetRows = rows.filter((r) => r.asset_id);
  const liabilityRows = rows.filter((r) => r.liability_id);

  if (assetRows.length) {
    const { error } = await supabase.from('monthly_snapshots').upsert(assetRows, {
      onConflict: 'asset_id,snapshot_date',
    });
    if (error) throw error;
  }

  if (liabilityRows.length) {
    const { error } = await supabase
      .from('monthly_snapshots')
      .upsert(liabilityRows, {
        onConflict: 'liability_id,snapshot_date',
      });
    if (error) throw error;
  }
}
