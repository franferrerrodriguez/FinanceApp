import { useAppStore } from '../store/appStore';
import { PERSIST_STORAGE_KEY } from '../store/persistConfig';
import { rememberCloudUserId } from './financeSession';
import { buildAppDataPayload, mapSettingsToUserSettingsRow } from './mapSettingsToDb';
import {
  mapAssetRow,
  mapLiabilityRow,
  mapSnapshotRow,
} from './patrimonyDb';
import { supabase } from './supabase';

export async function migrateLocalToSupabase(userId) {
  if (!supabase) {
    return { success: false, error: new Error('supabase_not_configured') };
  }

  const state = useAppStore.getState();
  const { assets, liabilities, snapshots, settings, profile } = state;

  try {
    if (profile?.name || profile?.age != null) {
      await supabase.from('profiles').upsert(
        {
          id: userId,
          name: profile.name ?? null,
          age: profile.age ?? null,
        },
        { onConflict: 'id' },
      );
    }

    const settingsRow = mapSettingsToUserSettingsRow(userId, settings);
    if (settingsRow) {
      const { error } = await supabase.from('user_settings').upsert(
        {
          ...settingsRow,
          app_data: buildAppDataPayload(state),
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
      const { error } = await supabase.from('monthly_snapshots').upsert(
        snapshots.map((s) => mapSnapshotRow(s, userId)),
        { onConflict: 'id' },
      );
      if (error) throw error;
    }

    localStorage.removeItem(PERSIST_STORAGE_KEY);
    rememberCloudUserId(userId);
    useAppStore.setState({ sessionStatus: 'authenticated', cloudSyncStatus: 'ready' });
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
}
