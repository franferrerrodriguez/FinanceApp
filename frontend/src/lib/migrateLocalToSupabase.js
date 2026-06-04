import { useAppStore } from '../store/appStore';
import { PERSIST_STORAGE_KEY } from '../store/persistConfig';
import { mapSettingsToUserSettingsRow } from './mapSettingsToDb';
import { supabase } from './supabase';

function mapAssetRow(asset, userId) {
  return {
    id: asset.id,
    user_id: userId,
    name: asset.name,
    category: asset.category,
    provider: asset.provider ?? null,
    notes: asset.notes ?? null,
    is_active: asset.isActive !== false,
  };
}

function mapLiabilityRow(liability, userId) {
  return {
    id: liability.id,
    user_id: userId,
    name: liability.name,
    category: liability.category,
    monthly_payment: liability.monthlyPayment ?? 0,
    interest_rate: liability.interestRate ?? null,
    is_active: liability.isActive !== false,
  };
}

function mapSnapshotRow(snapshot, userId) {
  return {
    id: snapshot.id,
    user_id: userId,
    asset_id: snapshot.assetId ?? null,
    liability_id: snapshot.liabilityId ?? null,
    snapshot_date: snapshot.snapshotDate ?? snapshot.date,
    value: snapshot.value,
    notes: snapshot.notes ?? null,
  };
}

export async function migrateLocalToSupabase(userId) {
  if (!supabase) {
    return { success: false, error: new Error('supabase_not_configured') };
  }

  const { assets, liabilities, snapshots, settings, profile } =
    useAppStore.getState();

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
      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsRow, { onConflict: 'user_id' });
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
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
}
