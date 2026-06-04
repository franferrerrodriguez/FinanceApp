import { useAppStore } from '../store/appStore';
import { buildAppDataPayload, mapSettingsToUserSettingsRow } from './mapSettingsToDb';
import { supabase, supabaseConfigured } from './supabase';

/** Saves profile and settings to Supabase (does not migrate full assets). */
export async function persistUserToSupabase(userId) {
  if (!supabaseConfigured || !supabase) {
    return { ok: false, errorCode: 'not_configured' };
  }

  const state = useAppStore.getState();
  const { profile, settings } = state;

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
          app_data: buildAppDataPayload(state),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (error) throw error;
    }

    useAppStore.setState({ cloudSyncStatus: 'ready' });
    return { ok: true };
  } catch (error) {
    console.error('persistUserToSupabase failed:', error);
    useAppStore.setState({ cloudSyncStatus: 'error' });
    return { ok: false, error };
  }
}
