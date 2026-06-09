import { pauseCloudAutoSync } from './cloudSync';
import { useAppStore } from '../store/appStore';
import { loadUserDataFromSupabase } from './loadUserDataFromSupabase';
import { migrateLocalToSupabase } from './migrateLocalToSupabase';
import { supabase } from './supabase';

/** Guest local data not yet in the cloud. */
export function hasLocalDataToMigrate(state) {
  if (!state.onboardingCompleted) return false;
  const s = state.settings;
  if (!s) return false;
  return (
    (s.monthlyNetSalary ?? 0) > 0 ||
    (s.otherMonthlyIncome ?? 0) > 0 ||
    (state.assets?.length ?? 0) > 0 ||
    (state.annualExpenses?.length ?? 0) > 0 ||
    (state.cashflowHistory?.length ?? 0) > 0
  );
}

async function userHasCloudSettings(userId) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

let syncInFlight = null;

/**
 * After login/session: upload local data if cloud is empty; otherwise download from Supabase.
 */
export async function syncUserDataOnAuth(userId) {
  if (!supabase) {
    return { success: false, error: new Error('supabase_not_configured') };
  }

  if (syncInFlight?.userId === userId) {
    return syncInFlight.promise;
  }

  const promise = (async () => {
    useAppStore.setState({ cloudSyncStatus: 'syncing' });

    try {
      const state = useAppStore.getState();
      const hasCloud = await userHasCloudSettings(userId);

      if (hasLocalDataToMigrate(state) && !hasCloud) {
        const migration = await migrateLocalToSupabase(userId);
        if (migration.success) {
          useAppStore.setState({ cloudSyncStatus: 'ready' });
          pauseCloudAutoSync();
          return migration;
        }
        const load = await loadUserDataFromSupabase(userId);
        return { ...migration, fallbackLoad: load };
      }

      return loadUserDataFromSupabase(userId);
    } catch (error) {
      console.error('syncUserDataOnAuth failed:', error);
      useAppStore.setState({ cloudSyncStatus: 'error' });
      return { success: false, error };
    }
  })();

  syncInFlight = { userId, promise };
  try {
    return await promise;
  } finally {
    if (syncInFlight?.userId === userId) {
      syncInFlight = null;
    }
  }
}
