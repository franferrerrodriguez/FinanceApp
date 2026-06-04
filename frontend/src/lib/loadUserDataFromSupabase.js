import { mergePersistedState } from '../store/persistConfig';
import { useAppStore } from '../store/appStore';
import {
  mapAppDataLists,
  mapUserSettingsRowToSettings,
} from './mapSettingsToDb';
import { supabase } from './supabase';

function mapAssetFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    provider: row.provider ?? undefined,
    notes: row.notes ?? undefined,
    isActive: row.is_active !== false,
  };
}

function mapLiabilityFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    monthlyPayment: Number(row.monthly_payment) || 0,
    interestRate:
      row.interest_rate != null ? Number(row.interest_rate) : undefined,
    isActive: row.is_active !== false,
  };
}

function mapSnapshotFromDb(row) {
  return {
    id: row.id,
    assetId: row.asset_id ?? undefined,
    liabilityId: row.liability_id ?? undefined,
    snapshotDate: row.snapshot_date,
    date: row.snapshot_date,
    value: Number(row.value),
    notes: row.notes ?? undefined,
  };
}

/**
 * Downloads user data and applies it to the store (cloud as source of truth).
 */
export async function loadUserDataFromSupabase(userId) {
  if (!supabase) {
    return { success: false, error: new Error('supabase_not_configured') };
  }

  try {
    const [
      profileRes,
      settingsRes,
      assetsRes,
      liabilitiesRes,
      snapshotsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id, name, age').eq('id', userId).maybeSingle(),
      supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('assets').select('*').eq('user_id', userId),
      supabase.from('liabilities').select('*').eq('user_id', userId),
      supabase.from('monthly_snapshots').select('*').eq('user_id', userId),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (settingsRes.error) throw settingsRes.error;
    if (assetsRes.error) throw assetsRes.error;
    if (liabilitiesRes.error) throw liabilitiesRes.error;
    if (snapshotsRes.error) throw snapshotsRes.error;

    const settingsRow = settingsRes.data;
    const lists = mapAppDataLists(settingsRow?.app_data);
    const profileFromTable = profileRes.data
      ? { name: profileRes.data.name ?? undefined, age: profileRes.data.age ?? undefined }
      : null;
    const profile = lists.profile ?? profileFromTable;

    const persisted = {
      onboardingCompleted:
        lists.onboardingCompleted || Boolean(settingsRow),
      settings: mapUserSettingsRowToSettings(settingsRow),
      annualExpenses: lists.annualExpenses,
      cashflowHistory: lists.cashflowHistory,
      contributionPlans: lists.contributionPlans,
      assets: (assetsRes.data ?? []).map(mapAssetFromDb),
      liabilities: (liabilitiesRes.data ?? []).map(mapLiabilityFromDb),
      snapshots: (snapshotsRes.data ?? []).map(mapSnapshotFromDb),
      profile,
      locale: lists.locale,
      theme: lists.theme,
    };

    const current = useAppStore.getState();
    const merged = mergePersistedState(persisted, current);

    useAppStore.setState({
      ...merged,
      sessionStatus: 'authenticated',
      cloudSyncStatus: 'ready',
    });

    return {
      success: true,
      empty: !settingsRow && !(assetsRes.data?.length),
    };
  } catch (error) {
    console.error('Load from Supabase failed:', error);
    useAppStore.setState({ cloudSyncStatus: 'error' });
    return { success: false, error };
  }
}
