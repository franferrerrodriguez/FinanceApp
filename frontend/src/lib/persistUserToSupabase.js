import { useAppStore } from '../store/appStore';
import { buildAppDataPayload, mapSettingsToUserSettingsRow } from './mapSettingsToDb';
import {
  mapAssetRow,
  mapLiabilityRow,
} from './patrimonyDb';
import { filterDraftAssets, filterDraftLiabilities } from './patrimonyDrafts';
import { upsertSnapshotsToSupabase } from './snapshotPersist';
import { supabase, supabaseConfigured } from './supabase';

/** Saves profile, settings, app_data and patrimony lists to Supabase. */
export async function persistUserToSupabase(userId) {
  if (!supabaseConfigured || !supabase) {
    return { ok: false, errorCode: 'not_configured' };
  }

  const state = useAppStore.getState();
  const { profile, settings } = state;
  const assets = filterDraftAssets(state.assets);
  const liabilities = filterDraftLiabilities(state.liabilities);
  const snapshots = state.snapshots;

  try {
    if (profile?.name || profile?.age != null) {
      const { error } = await supabase.from('profiles').upsert(
        {
          id: userId,
          name: profile.name ?? null,
          age: profile.age ?? null,
        },
        { onConflict: 'id' },
      );
      if (error) throw error;
    }

    const settingsRow = mapSettingsToUserSettingsRow(userId, settings);
    if (settingsRow) {
      const { error } = await supabase.from('user_settings').upsert(
        {
          ...settingsRow,
          app_data: buildAppDataPayload({ ...state, assets, liabilities }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (error) throw error;
    }

    if (assets.length) {
      const { error } = await supabase
        .from('assets')
        .upsert(assets.map((a) => mapAssetRow(a, userId)), { onConflict: 'id' });
      if (error) throw error;
    }

    if (liabilities.length) {
      const { error } = await supabase.from('liabilities').upsert(
        liabilities.map((l) => mapLiabilityRow(l, userId)),
        { onConflict: 'id' },
      );
      if (error) throw error;
    }

    if (snapshots.length) {
      const assetIds = new Set(assets.map((a) => a.id));
      const liabilityIds = new Set(liabilities.map((l) => l.id));
      const validSnapshots = snapshots.filter((s) => {
        if (s.assetId) return assetIds.has(s.assetId);
        if (s.liabilityId) return liabilityIds.has(s.liabilityId);
        return false;
      });
      if (validSnapshots.length) {
        await upsertSnapshotsToSupabase(supabase, validSnapshots, userId);
      }
    }

    useAppStore.setState({ cloudSyncStatus: 'ready' });
    return { ok: true };
  } catch (error) {
    console.error('persistUserToSupabase failed:', error);
    useAppStore.setState({ cloudSyncStatus: 'error' });
    return { ok: false, error };
  }
}
